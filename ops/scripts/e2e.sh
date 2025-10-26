#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://api.ap.unitn.yifen9.li}"
EMAIL="${EMAIL:-yifeng.li@studenti.unitn.it}"
GH_ID="${GH_ID:-clareLab}"
SECRET="${GITHUB_WEBHOOK_SECRET:-testsecret}"

echo "# 1) health"
curl -sS -i "$BASE/v1/healthz" | sed -n '1,12p'

echo "# 2) create invitation"
resp=$(curl -sS -X POST "$BASE/v1/invitations" \
  -H 'content-type: application/json' \
  -d "{\"githubId\":\"$GH_ID\",\"email\":\"$EMAIL\"}")
echo "$resp" | jq .
id=$(echo "$resp" | jq -r .id)
