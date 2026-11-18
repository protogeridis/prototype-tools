#!/usr/bin/env bash
# Adds the canvas view to a Next.js app that already has the prototype preview.
#   install.sh <source-root>
# <source-root> is the folder that holds prototype-preview/ (and app/). Existing files are never
# overwritten; they're listed as skipped.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: install.sh <source-root>" >&2
  exit 1
fi

root="$1"
templates="$(cd "$(dirname "$0")/../templates" && pwd)"

if [ ! -f "$root/prototype-preview/PreviewPage.tsx" ]; then
  echo "No $root/prototype-preview/PreviewPage.tsx. Set up the preview first (web-prototype-preview skill)." >&2
  exit 1
fi

for file in "$templates/prototype-preview"/*; do
  name="$(basename "$file")"
  if [ -e "$root/prototype-preview/$name" ]; then
    echo "skipped  $root/prototype-preview/$name (already exists)"
  else
    cp "$file" "$root/prototype-preview/$name"
    echo "added    $root/prototype-preview/$name"
  fi
done
