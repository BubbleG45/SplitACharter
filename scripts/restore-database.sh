#!/usr/bin/env bash
# SplitACharter — Emergency Database Restore Helper
# Usage: ./scripts/restore-database.sh <path-to-backup.sql.gz> <target-database-connection-url>

set -e

BACKUP_FILE="$1"
TARGET_DB_URL="$2"

if [ -z "$BACKUP_FILE" ] || [ -z "$TARGET_DB_URL" ]; then
  echo "Error: Missing arguments."
  echo "Usage: ./scripts/restore-database.sh <path-to-backup.sql.gz> <target-database-connection-url>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' not found."
  exit 1
fi

echo "=========================================="
echo "SplitACharter Database Restore"
echo "Backup file: $BACKUP_FILE"
echo "Target DB:   ${TARGET_DB_URL:0:30}..."
echo "=========================================="
read -p "Are you sure you want to restore to the target database? Existing data will be overwritten! (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore aborted."
  exit 0
fi

echo "Decompressing and restoring database..."
gunzip -c "$BACKUP_FILE" | psql "$TARGET_DB_URL"

echo "Restore completed successfully."
