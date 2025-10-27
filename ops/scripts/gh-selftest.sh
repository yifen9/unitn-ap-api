#!/usr/bin/env bash
set -euo pipefail
: "${TF_VAR_github_token:?TF_VAR_github_token required}"
ORG="${1:-unitn-ap-2025}"
SLUG="${2:-wg-test}"

echo "[whoami]"
curl -sS -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer ${TF_VAR_github_token}" \
  https://api.github.com/user | jq -r '.login,.type' || true
echo

echo "[GET team]"
code=$(curl -sS -o /tmp/gh.out -w "%{http_code}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer ${TF_VAR_github_token}" \
  "https://api.github.com/orgs/${ORG}/teams/${SLUG}")
echo "status=${code}"
head -c 300 /tmp/gh.out; echo; echo

echo "[POST invitation]"
code=$(curl -sS -o /tmp/gh2.out -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer ${TF_VAR_github_token}" \
  -H "content-type: application/json" \
  -d '{"email":"noreply@example.com","role":"direct_member"}' \
  "https://api.github.com/orgs/${ORG}/invitations")
echo "status=${code}"
head -c 300 /tmp/gh2.out; echo
