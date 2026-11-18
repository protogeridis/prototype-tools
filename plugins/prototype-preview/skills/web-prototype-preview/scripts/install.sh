#!/usr/bin/env bash
# Copies the prototype preview into a Next.js (App Router) app.
#   install.sh <source-root>
# <source-root> is the folder that holds the app/ directory: `src` for src/app, `.` for app/ at the
# project root. Files go to <source-root>/prototype-preview/. Existing files are never overwritten;
# they're listed as skipped so you can compare them by hand.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: install.sh <source-root>" >&2
  exit 1
fi

root="$1"
templates="$(cd "$(dirname "$0")/../templates" && pwd)"
mkdir -p "$root/prototype-preview"
for file in "$templates/prototype-preview"/*; do
  name="$(basename "$file")"
  if [ -e "$root/prototype-preview/$name" ]; then
    echo "skipped  $root/prototype-preview/$name (already exists)"
  else
    cp "$file" "$root/prototype-preview/$name"
    echo "added    $root/prototype-preview/$name"
  fi
done
