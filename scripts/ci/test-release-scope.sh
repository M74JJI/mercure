#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "$script_dir/../.." && pwd)"
detector="$repository_root/scripts/release/detect-release-sensitive-changes.sh"

assert_scope() {
  local expected="$1"
  shift
  local actual

  actual="$(printf '%s\n' "$@" | "$detector")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Release-scope detection mismatch: expected $expected, got $actual for: $*" >&2
    exit 1
  fi
}

assert_scope true 'apps/web/src/app/page.tsx'
assert_scope true 'libs/platform/backend/feature/src/lib/bootstrap-api.ts'
assert_scope true 'prisma/models/rules.prisma'
assert_scope true 'package.json'
assert_scope true '.github/workflows/release.yml'
assert_scope true 'future-build-input.config.mjs'
assert_scope false 'docs/operations/production-readiness.md'
assert_scope false 'README.md'
assert_scope false 'scripts/ci/validate-repository-hygiene.sh'
assert_scope true 'docs/adr/0019-rules-streaming-archive-ingestion.md' 'libs/modules/rules/backend/domain/src/lib/rules-records.ts'

echo 'Release-scope regression tests passed.'
