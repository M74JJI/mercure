#!/usr/bin/env bash
set -euo pipefail

COMMIT_PATTERN='^(feature|fix|security|config|refactor|test|docs|build|ci|perf|chore|revert):([a-z0-9]+(-[a-z0-9]+)*):([a-z0-9]+(-[a-z0-9]+)*)$'
AI_ATTRIBUTION_PATTERN='(Co-authored-by:.*(ChatGPT|Claude|Codex|OpenAI|Anthropic)|Generated-by:.*(ChatGPT|Claude|Codex|OpenAI|Anthropic)|AI-assisted:)'

validate_commit() {
  local sha="$1"
  local subject
  local body
  subject="$(git show -s --format=%s "$sha")"
  body="$(git show -s --format=%B "$sha")"

  if [[ ! "$subject" =~ $COMMIT_PATTERN ]]; then
    echo "Invalid commit subject: $subject" >&2
    echo "Expected: <type>:<scope>:<kebab-case-description>" >&2
    exit 1
  fi

  if printf '%s\n' "$body" | grep -Eiq "$AI_ATTRIBUTION_PATTERN"; then
    echo "Forbidden AI/tool attribution metadata found in commit $sha" >&2
    exit 1
  fi
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
