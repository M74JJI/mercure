#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$script_dir/git-policy.sh"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <branch|pr-title> <value>" >&2
  exit 2
fi

kind="$1"
value="$2"

case "$kind" in
  branch)
    validate_branch "$value"
    ;;
  pr-title)
    validate_subject "$value" 'Pull request title'
    ;;
  *)
    echo "Unknown metadata kind: $kind" >&2
    exit 2
    ;;
esac
