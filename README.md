# SplitACharter Scaffolding

This is a SvelteKit-based project scaffolded for **SplitACharter**, a marketplace connecting groups to share private boat charters.

The project is pre-configured with:
- **Deployment Adapter:** `@sveltejs/adapter-vercel`
- **Database & Auth:** `@supabase/supabase-js` + `@supabase/ssr` (isomorphic Server-Side Rendering support via cookies)
- **Background Jobs:** `Inngest` serve handler with a verification `"hello world"` placeholder function
- **Environment Variables:** Placed in `.env` and `.env.example` covering Supabase, Stripe, Twilio, Resend, and Inngest keys.

---

## Getting Started

### 1. Installation
Install the project dependencies (if not already done during scaffolding):
```bash
npm install
```

### 2. Environment Setup
Copy the environment variables template and configure it:
```bash
cp .env.example .env
```
Ensure you update the placeholders in `.env` with your actual development keys.

---

## Connecting to Supabase

This project uses cookie-based session management. To configure it with your Supabase project:
1. Create a project at [Supabase](https://supabase.com/).
2. Grab the project API URL and public `anon` key from **Settings -> API**.
3. Set the variables in your `.env` file:
   - `PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`
   - `SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key` (used only on the server)
4. Enable your desired passwordless authentication providers (Email Magic Link and/or Phone SMS OTP) in the **Auth -> Providers** tab of the Supabase dashboard.

---

## Developing Locally

### 1. Run SvelteKit Dev Server
Start the local SvelteKit application:
```bash
npm run dev
```
The application will start (usually on `http://localhost:5173`).

You can verify the basic health check endpoint at:
`http://localhost:5173/api/health-check`

---

## Running Inngest Locally

To test background workflows and events:

### 1. Start the Inngest Dev Server
Inngest runs a local dev server that detects your background functions. Run the following command in a new terminal window:
```bash
npx inngest-cli@latest dev -u http://localhost:5173/api/inngest
```
*(Adjust the URL port if SvelteKit runs on a different port, e.g. `http://localhost:3000`)*.

### 2. Verify Wiring in the Dashboard
Open the Inngest Dev Server Dashboard at:
[http://localhost:8288](http://localhost:8288)

You should see:
- Your application named `split-a-charter` registered.
- The `hello-world` function waiting for the `test/hello.world` event.

### 3. Trigger a Test Event
From the Inngest Dev Server Dashboard, send a test event to verify wiring:
- **Event Name:** `test/hello.world`
- **Payload:** `{}` (or any JSON payload)

You will see the run succeed in the dashboard run history, and a message logged in your SvelteKit server console.
