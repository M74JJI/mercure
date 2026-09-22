#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
validator="$script_dir/validate-commit-messages.sh"
zero='0000000000000000000000000000000000000000'
sandbox="$(mktemp -d)"

cleanup() {
  rm -rf "$sandbox"
}
trap cleanup EXIT

git -C "$sandbox" init --quiet
git -C "$sandbox" config user.name 'Mercure CI'
git -C "$sandbox" config user.email 'mercure-ci@example.test'
git -C "$sandbox" config commit.gpgsign false

printf 'legacy\n' > "$sandbox/policy-fixture.txt"
git -C "$sandbox" add policy-fixture.txt
git -C "$sandbox" commit --quiet -m 'legacy commit outside enforced history'
legacy_base="$(git -C "$sandbox" rev-parse HEAD)"
git -C "$sandbox" update-ref refs/remotes/origin/main "$legacy_base"

git -C "$sandbox" checkout --quiet -b fix/policy-fixture
printf 'valid\n' >> "$sandbox/policy-fixture.txt"
git -C "$sandbox" add policy-fixture.txt
git -C "$sandbox" commit --quiet -m 'fix:ci:validate-new-branch-range'
valid_head="$(git -C "$sandbox" rev-parse HEAD)"

(
  cd "$sandbox"
  COMMIT_POLICY_FALLBACK_BASE=origin/main bash "$validator" "$zero" "$valid_head"
)

printf 'invalid\n' >> "$sandbox/policy-fixture.txt"
git -C "$sandbox" add policy-fixture.txt
git -C "$sandbox" commit --quiet -m 'invalid new branch commit'
invalid_head="$(git -C "$sandbox" rev-parse HEAD)"

if (
  cd "$sandbox"
  COMMIT_POLICY_FALLBACK_BASE=origin/main bash "$validator" "$zero" "$invalid_head" >/dev/null 2>&1
); then
  echo 'New-branch range validation accepted an invalid branch commit.' >&2
  exit 1
fi

echo 'Commit-policy new-branch range regression tests passed.'
