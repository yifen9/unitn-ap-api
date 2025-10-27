#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://api.ap.unitn.yifen9.li}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl not found" >&2
  exit 1
fi

GITHUB_ID="${1:-}"
EMAIL="${2:-}"

if [ -z "$GITHUB_ID" ]; then
  read -r -p "GitHub ID: " GITHUB_ID
fi

if [ -z "$EMAIL" ]; then
  read -r -p "UniTN email (@studenti.unitn.it): " EMAIL
fi

echo "Creating invitation..."
CREATE_STATUS=0
CREATE_RESP="$(
  curl --silent --show-error --fail \
    --request POST \
    --header "content-type: application/json" \
    --data "{\"githubId\":\"${GITHUB_ID}\",\"email\":\"${EMAIL}\"}" \
    "${BASE}/v1/invitations" \
  || CREATE_STATUS=$?
)"
if [ "$CREATE_STATUS" -ne 0 ]; then
  echo "Failed to create invitation (status=$CREATE_STATUS)"
  exit 1
fi

INV_ID="$(echo "$CREATE_RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
if [ -z "$INV_ID" ]; then
  echo "Unexpected response:"
  echo "$CREATE_RESP"
  exit 1
fi
echo "Invitation accepted (id: ${INV_ID})"

echo "Sending verification email..."
curl --silent --show-error --fail \
  --request POST \
  "${BASE}/v1/invitations/${INV_ID}/resend" >/dev/null

echo "Done. Please check your UniTN inbox and click the verification link."
