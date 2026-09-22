#!/usr/bin/env bash
set -euo pipefail

required_tests=(
  "libs/platform/backend/identity/infrastructure/src/lib/keycloak-access-token-verifier.spec.ts"
  "libs/platform/backend/presentation/src/lib/authentication.guard.spec.ts"
  "libs/platform/backend/presentation/src/lib/authorization.guard.spec.ts"
  "libs/platform/backend/logging/src/lib/platform-logging.module.spec.ts"
  "libs/modules/rules/backend/infrastructure/src/lib/filesystem-manager-archive-source.spec.ts"
  "libs/modules/rules/backend/infrastructure/src/lib/rules-authoring-workflow.spec.ts"
  "libs/modules/rules/backend/infrastructure/src/lib/postgres-ruleset-import-lease.integration.spec.ts"
  "libs/modules/rules/backend/infrastructure/src/lib/prisma-rules-intelligence-rate-limiter.integration.spec.ts"
  "libs/modules/rules/backend/presentation/src/lib/rules-intelligence-rate-limit.guard.spec.ts"
  "libs/modules/rules/backend/presentation/src/lib/rules-authoring.controller.spec.ts"
)

missing=()
for test_file in "${required_tests[@]}"; do
  if [[ ! -f "$test_file" ]]; then
    missing+=("$test_file")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Critical security regression tests are missing:" >&2
  printf ' - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "Critical security regression inventory passed (${#required_tests[@]} required test files)."
