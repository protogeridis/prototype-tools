#!/usr/bin/env bash
# Adds the canvas view to an app that already has the prototype preview.
#   install.sh <source-root>
# <source-root> is the folder that holds preview/ (and the routes folder). Existing files are never
# overwritten; they're listed as skipped.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: install.sh <source-root>" >&2
  exit 1
fi

root="$1"
templates="$(cd "$(dirname "$0")/../templates" && pwd)"

if [ ! -f "$root/preview/PreviewPage.tsx" ]; then
  echo "No $root/preview/PreviewPage.tsx. Set up the prototype preview first (prototype-preview skill)." >&2
  exit 1
fi

for file in "$templates/preview"/*; do
  name="$(basename "$file")"
  if [ -e "$root/preview/$name" ]; then
    echo "skipped  $root/preview/$name (already exists)"
  else
    cp "$file" "$root/preview/$name"
    echo "added    $root/preview/$name"
  fi
done
