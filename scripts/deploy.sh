#!/usr/bin/env bash
set -euo pipefail

echo "=== Frontend: Build (validation) ==="
cd packages/web
if [ -f .env ]; then
  set -a; source .env; set +a
fi
: "${VITE_CLERK_PUBLISHABLE_KEY:?Must be set}"
: "${VITE_API_URL:?Must be set}"
pnpm build

echo "=== Backend: Migrations ==="
cd ../server
npx wrangler d1 migrations apply exam-db --remote

echo "=== Backend: Deploy Workers ==="
npx wrangler deploy

echo "=== Frontend: Deploy Pages ==="
cd ../web
npx wrangler pages deploy dist --project-name=exam-app --branch=production

echo "=== Done ==="
