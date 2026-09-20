#!/usr/bin/env bash
set -euo pipefail

: "${MERCURE_API_BASE_URL:?MERCURE_API_BASE_URL is required}"
: "${MERCURE_USER_ACCESS_TOKEN:?MERCURE_USER_ACCESS_TOKEN is required}"
: "${MERCURE_ADMIN_ACCESS_TOKEN:?MERCURE_ADMIN_ACCESS_TOKEN is required}"

case "$MERCURE_API_BASE_URL" in
  https://*) ;;
  *)
    echo 'MERCURE_API_BASE_URL must use https://.' >&2
    exit 2
    ;;
esac

api_base="${MERCURE_API_BASE_URL%/}"

request_status() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local args=(
    --silent
    --show-error
    --output /dev/null
    --write-out '%{http_code}'
    --request "$method"
  )

  if [[ -n "$token" ]]; then
    if [[ "$token" == *[[:space:]]* ]]; then
      echo 'Access token contains invalid whitespace.' >&2
      exit 2
    fi

    printf 'Authorization: Bearer %s\n' "$token" |
      curl "${args[@]}" --header @- "$api_base$path"
    return
  fi

  curl "${args[@]}" "$api_base$path"
}

expect_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "$label failed: expected HTTP $expected, received HTTP $actual." >&2
    exit 1
  fi

  echo "$label: HTTP $actual"
}

expect_status \
  'Unauthenticated Rules read' \
  '401' \
  "$(request_status GET '/api/v1/rules/snapshots?offset=0&limit=1')"

expect_status \
  'Normal user Rules read' \
  '200' \
  "$(request_status GET '/api/v1/rules/snapshots?offset=0&limit=1' "$MERCURE_USER_ACCESS_TOKEN")"

expect_status \
  'Normal user authoring denial' \
  '403' \
  "$(request_status GET '/api/v1/rules/authoring/drafts?offset=0&limit=1' "$MERCURE_USER_ACCESS_TOKEN")"

expect_status \
  'Administrator Rules read' \
  '200' \
  "$(request_status GET '/api/v1/rules/snapshots?offset=0&limit=1' "$MERCURE_ADMIN_ACCESS_TOKEN")"

expect_status \
  'Administrator authoring read' \
  '200' \
  "$(request_status GET '/api/v1/rules/authoring/drafts?offset=0&limit=1' "$MERCURE_ADMIN_ACCESS_TOKEN")"

echo 'Mercure read-only production authorization smoke test passed.'
echo 'Snapshot-import mutation authorization remains covered by automated tests and must be exercised only in a controlled staging/change window.'
