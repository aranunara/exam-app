#!/usr/bin/env bash
set -euo pipefail

echo "=== Deploying via GitHub Actions ==="
git push origin main

echo "=== Pushed to main. GitHub Actions will handle the rest ==="
echo "Watch: https://github.com/aranunara/exam-app/actions"
