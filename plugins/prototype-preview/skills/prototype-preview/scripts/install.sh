#!/usr/bin/env bash
# Copies the prototype preview into an app.
#   install.sh <source-root> [--with-i18n]
# <source-root> is the folder that holds the routes folder: `src` for src/app, `.` for app/ at the
# project root. Files go to <source-root>/preview/ (and <source-root>/i18n/ with --with-i18n).
# Existing files are never overwritten; they're listed as skipped so you can compare them by hand.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: install.sh <source-root> [--with-i18n]" >&2
  exit 1
fi

root="$1"
with_i18n="${2:-}"
templates="$(cd "$(dirname "$0")/../templates" && pwd)"

copy_dir() {
  local from="$1" to="$2"
  mkdir -p "$to"
  for file in "$from"/*; do
    local name
    name="$(basename "$file")"
    if [ -e "$to/$name" ]; then
      echo "skipped  $to/$name (already exists)"
    else
      cp "$file" "$to/$name"
      echo "added    $to/$name"
    fi
  done
}

copy_dir "$templates/preview" "$root/preview"
if [ "$with_i18n" = "--with-i18n" ]; then
  copy_dir "$templates/i18n" "$root/i18n"
fi
