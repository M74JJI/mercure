#!/usr/bin/env bash
set -euo pipefail

policy_file="security/policies/forbidden-repository-paths.txt"

if [[ ! -f "$policy_file" ]]; then
  echo "Missing repository hygiene policy: $policy_file" >&2
  exit 1
fi

mapfile -t tracked < <(git ls-files)
violations=()

while IFS= read -r pattern || [[ -n "$pattern" ]]; do
  [[ -z "$pattern" ]] && continue

  if [[ "$pattern" == */ ]]; then
    prefix="${pattern%/}"
    for path in "${tracked[@]}"; do
      if [[ "$path" == "$prefix" || "$path" == "$prefix/"* ]]; then
        violations+=("$path")
      fi
    done
  else
    for path in "${tracked[@]}"; do
      if [[ "$path" == "$pattern" ]]; then
        violations+=("$path")
      fi
    done
  fi
done < "$policy_file"

if (( ${#violations[@]} > 0 )); then
  echo "Forbidden repository artifacts detected:" >&2
  printf ' - %s\n' "${violations[@]}" | sort -u >&2
  exit 1
fi

echo "Repository hygiene policy passed."
