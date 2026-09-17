#!/usr/bin/env bash

ALLOWED_TYPES_PATTERN='feature|fix|security|config|refactor|test|docs|build|ci|perf|chore|revert'
ALLOWED_SCOPES_PATTERN='workspace|nx|web|api|rules|database|prisma|github|ci|dependencies|security|docker|docs|testing'
ALLOWED_SCOPES_DISPLAY='workspace, nx, web, api, rules, database, prisma, github, ci, dependencies, security, docker, docs, testing'
SUBJECT_PATTERN="^(${ALLOWED_TYPES_PATTERN}):(${ALLOWED_SCOPES_PATTERN}):([a-z0-9]+(-[a-z0-9]+)*)$"
BRANCH_PATTERN="^(${ALLOWED_TYPES_PATTERN})/[a-z0-9]+(-[a-z0-9]+)*$"
AI_ATTRIBUTION_PATTERN='(Co-authored-by:.*(ChatGPT|Claude|Codex|OpenAI|Anthropic)|Generated-by:.*(ChatGPT|Claude|Codex|OpenAI|Anthropic)|AI-assisted:)'

validate_subject() {
  local subject="$1"
  local label="${2:-Subject}"

  if [[ ! "$subject" =~ $SUBJECT_PATTERN ]]; then
    echo "$label rejected: '$subject'" >&2
    echo 'Expected: <type>:<approved-scope>:<kebab-case-description>' >&2
    echo "Approved scopes: $ALLOWED_SCOPES_DISPLAY" >&2
    return 1
  fi
}

validate_branch() {
  local branch="$1"

  if [[ "$branch" == 'main' ]]; then
    return 0
  fi

  if [[ ! "$branch" =~ $BRANCH_PATTERN ]]; then
    echo "Branch rejected: '$branch'" >&2
    echo 'Expected: <approved-type>/<kebab-case-description>' >&2
    return 1
  fi
}

validate_attribution() {
  local message="$1"

  if printf '%s\n' "$message" | grep -Eiq "$AI_ATTRIBUTION_PATTERN"; then
    echo 'Forbidden AI/tool attribution metadata found.' >&2
    return 1
  fi
}
