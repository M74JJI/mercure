#!/usr/bin/env bash
set -euo pipefail

release_sensitive=false

while IFS= read -r changed_path; do
  [[ -z "$changed_path" ]] && continue

  case "$changed_path" in
    docs/*|README.md|CONTRIBUTING.md|SECURITY.md|.github/CODEOWNERS|security/policies/*|scripts/ci/*|.gitignore|.editorconfig)
      ;;
    *)
      release_sensitive=true
      break
      ;;
  esac
done

printf '%s\n' "$release_sensitive"
