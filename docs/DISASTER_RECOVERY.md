# SplitACharter — Database Disaster Recovery Runbook

This document provides the standard operating procedure (SOP) for disaster recovery (DR) of the SplitACharter PostgreSQL database. 

It implements a **$0/month, high-resilience off-site backup architecture** using GitHub Actions and Cloudflare R2 (or AWS S3), completely isolated from Supabase to protect against account breaches, project deletions, ransomware, or catastrophic data loss.

---

## 1. Objectives & Metrics

- **Cost:** **$0.00 / month** (within GitHub Actions free runner allowance and Cloudflare R2 10 GB free tier with zero egress fees).
- **Recovery Point Objective (RPO):** **6 to 12 hours** (backups run twice daily at `02:00 UTC` and `14:00 UTC`, plus manual one-click on-demand triggers). Any bookings or payments received in the intervening window are caught up via Stripe webhook replay.
- **Recovery Time Objective (RTO):** **15 to 20 minutes** (downloading latest `.sql.gz` snapshot, applying it via `psql` to any fresh or existing Supabase project, and updating Vercel).
- **Breach & Ransomware Isolation:** **100% Isolated**. Backups are stored in an independent Cloudflare account. An attacker who gains access to Supabase or Vercel cannot delete, tamper with, or ransom the off-site backups.

---

## 2. One-Time Setup Guide (Takes ~5 Minutes)

### Step 1: Create a Free Cloudflare R2 Bucket
1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. In the left navigation, click **R2 Object Storage**.
3. Click **Create Bucket**:
   - Bucket Name: `splitacharter-backups`
   - Location: Automatic (or North America)
4. Click **Manage R2 API Tokens** (on the right sidebar) → **Create API Token**:
   - Token Name: `github-actions-backup`
   - Permissions: **Object Read & Write**
   - Apply to specific bucket: `splitacharter-backups`
   - TTL: Leave forever (or as desired)
5. Copy down the generated credentials:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (found in your R2 dashboard URL or token summary)

### Step 2: Retrieve Supabase Database Direct Connection String
1. In the [Supabase Dashboard](https://supabase.com/dashboard), go to your project.
2. Navigate to **Project Settings** (gear icon) → **Database**.
3. Under **Connection string**, select **URI**.
4. Choose **Direct connection** (Port `5432`) or **Session Pooler** (Port `5432`).
5. Copy the connection URI:
   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

### Step 3: Add GitHub Repository Secrets
1. Go to your GitHub repository for SplitACharter (`BubbleG45/SplitACharter`).
2. Navigate to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add the following:
   - `SUPABASE_DB_URL`: The full PostgreSQL connection string from Step 2.
   - `R2_ACCOUNT_ID`: Your Cloudflare Account ID.
   - `R2_ACCESS_KEY_ID`: Your R2 API Token Access Key ID.
   - `R2_SECRET_ACCESS_KEY`: Your R2 API Token Secret Access Key.
   - `R2_BUCKET_NAME`: `splitacharter-backups`

Once added, the backup workflow in `.github/workflows/database-backup.yml` will run automatically every 12 hours and can also be triggered manually anytime via **Actions** → **Database Backup (Off-Site)** → **Run workflow**.

---

## 3. Disaster Scenarios Covered

1. **Malicious Breach / Account Takeover:** Attacker deletes or wipes the Supabase project. The off-site backups in Cloudflare R2 remain untouched and secure.
2. **Accidental Deletion / Bad Migration:** A script or migration drops critical tables or corrupts booking records.
3. **Infrastructure Outage:** Regional downtime on Supabase; you can restore the full schema and data onto any Postgres provider (Render, Railway, Neon, or AWS RDS) in minutes.

---

## 4. Emergency Database Restore Procedure

When a disaster or breach occurs, follow these steps to restore the platform to operational status:

### Step 1: Download the Latest Healthy Backup
1. Go to the **Cloudflare Dashboard** → **R2** → `splitacharter-backups` → `backups/`.
2. Find the most recent snapshot prior to the incident (e.g. `splitacharter_backup_YYYYMMDD_HHMMSSZ.sql.gz`) and download it.
   *(Alternatively, using AWS CLI: `aws s3 cp s3://splitacharter-backups/backups/<filename>.sql.gz . --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)*.

### Step 2: Provision Target Database
- If the existing Supabase database is corrupted: You can restore directly into the existing database.
- If the Supabase project was deleted or breached:
  1. Create a brand new project in Supabase (or any Postgres hosting provider).
  2. Note down the new project URL, public `anon` key, `service_role` key, and database connection string.

### Step 3: Execute the Restore
Run the restore script or command from your terminal:

**Option A (Using the helper script):**
```bash
./scripts/restore-database.sh splitacharter_backup_YYYYMMDD_HHMMSSZ.sql.gz "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Option B (Standard single-line command):**
```bash
gunzip -c splitacharter_backup_YYYYMMDD_HHMMSSZ.sql.gz | psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### Step 4: Verify Data Integrity
Connect to the restored database and run a quick row count audit:
```sql
SELECT 'customers' AS table_name, count(*) FROM customers
UNION ALL
SELECT 'trip_instances', count(*) FROM trip_instances
UNION ALL
SELECT 'bookings', count(*) FROM bookings
UNION ALL
SELECT 'payment_records', count(*) FROM payment_records;
```

### Step 5: Reconnect Vercel Production
If you restored into a new Supabase project:
1. Go to **Vercel** → **SplitACharter** → **Settings** → **Environment Variables**.
2. Update:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (if configured)
3. Navigate to **Deployments** → **Redeploy** (without cache).

---

## 5. Stripe & Inngest Post-Recovery Reconciliation

Because the database was restored from a snapshot taken a few hours prior, any Stripe payments or Inngest background jobs that occurred in the intervening hours must be reconciled.

### 5.1 Stripe Webhook Replay (Idempotent Catch-up)
SplitACharter's webhook handler (`src/routes/api/webhooks/stripe/+server.ts`) is designed with database-level idempotency:
- If a payment record already exists, it safely skips processing.
- If a booking is missing its payment record, it updates the booking status to `paid` and inserts the `payment_records` entry.

**To replay payments from Stripe:**
1. Open the [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. Select your production endpoint (`https://splitacharter.boats/api/webhooks/stripe`).
3. Filter events between the backup timestamp and the current time.
4. For all `payment_intent.succeeded` or `charge.refunded` events, click **Resend** to send them to the restored application.

### 5.2 Inngest Background Jobs Synchronization
1. Open the [Inngest Cloud Dashboard](https://app.inngest.com).
2. Verify active runs for `reconfirmBookingWorkflow`.
3. Check for any trip instances in `pending-reconfirm` status that require an Inngest run:
   ```sql
   SELECT id, date, status FROM trip_instances WHERE status = 'pending-reconfirm';
   ```
4. If an Inngest workflow run was dropped during the window, emit a `booking/match.detected` event via the Inngest dashboard Event Sender to restart the reconfirmation reminders and forfeiture timer.

---

## 6. Routine Drills & Testing Schedule

- **Schedule:** Conduct a dry-run test once every 6 months.
- **Drill Steps:**
  1. Trigger an on-demand backup run from the GitHub Actions tab.
  2. Download the resulting `.sql.gz` file.
  3. Spin up a temporary local or free Supabase staging project.
  4. Restore the database using `./scripts/restore-database.sh`.
  5. Verify that all tables, customer accounts, and trips are intact.
