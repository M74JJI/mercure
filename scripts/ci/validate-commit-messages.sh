#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$script_dir/git-policy.sh"

is_allowed_github_pr_merge_commit() {
  local sha="$1"
  local subject="$2"
  local parent_count

  [[ "${ALLOW_GITHUB_PR_MERGE_COMMITS:-false}" == 'true' ]] || return 1

  parent_count="$(git rev-list --parents -n 1 "$sha" | awk '{ print NF - 1 }')"
  [[ "$parent_count" -eq 2 ]] || return 1

  [[ "$subject" =~ ^Merge[[:space:]]pull[[:space:]]request[[:space:]]#[0-9]+[[:space:]]from[[:space:]][^[:space:]]+$ ]]
}

validate_commit() {
  local sha="$1"
  local subject
  local body

  subject="$(git show -s --format=%s "$sha")"
  body="$(git show -s --format=%B "$sha")"

  if ! is_allowed_github_pr_merge_commit "$sha" "$subject"; then
    validate_subject "$subject" "Commit $sha"
  fi

  validate_attribution "$body"
}

if [[ $# -eq 1 ]]; then
  validate_commit "$1"
  exit 0
fi

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <commit> OR $0 <base> <head>" >&2
  exit 2
fi

base="$1"
head="$2"
zero='0000000000000000000000000000000000000000'

if [[ "$base" == "$zero" ]]; then
  commits="$(git rev-list --reverse "$head")"
else
  commits="$(git rev-list --reverse "$base..$head")"
fi

while IFS= read -r sha; do
  [[ -z "$sha" ]] && continue
  validate_commit "$sha"
done <<< "$commits"
