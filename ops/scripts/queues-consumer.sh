#!/usr/bin/env bash
set -euo pipefail

: "${TF_VAR_account_id:?TF_VAR_account_id is required}"
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"

QUEUE_NAME="${1:-unitn-ap-api-invite-dev}"
SCRIPT_NAME="${2:-unitn-ap-api-dev}"

export CLOUDFLARE_ACCOUNT_ID="${TF_VAR_account_id}"
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

npx --yes wrangler@4 queues consumer add "${QUEUE_NAME}" "${SCRIPT_NAME}" \
  --batch-size 10 \
  --batch-timeout 5 \
  --message-retries 3 \
  --max-concurrency 3 \
  --retry-delay-secs 10

npx --yes wrangler@4 queues info "${QUEUE_NAME}"
