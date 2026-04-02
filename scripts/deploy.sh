#!/usr/bin/env bash
set -euo pipefail

echo "=== Frontend: Build (validation) ==="
cd packages/web
if [ ! -f .env.production ] && [ -z "${VITE_CLERK_PUBLISHABLE_KEY:-}" ]; then
  echo "Warning: VITE_CLERK_PUBLISHABLE_KEY not set. Checking .env.production..."
  echo "Create packages/web/.env.production or export the variable."
  exit 1
fi
pnpm build

echo "=== Backend: Migrations ==="
cd ../server
npx wrangler d1 migrations apply exam-db --remote

echo "=== Backend: Deploy Workers ==="
npx wrangler deploy

echo "=== Frontend: Deploy Pages ==="
cd ../web
npx wrangler pages deploy dist --project-name=exam-app --branch=main

echo "=== Done ==="
