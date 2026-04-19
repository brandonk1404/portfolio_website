#!/bin/bash
# Portfolio build script — run this at the start of each session
# Usage: bash build.sh
# This ensures the working copy is always sourced from THIS zip only.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ZIP_NAME="portfolio_website-main.zip"
UPLOADS="/mnt/user-data/uploads"
WORK="/home/claude"

echo "=== Portfolio Build Script ==="
echo "Cleaning any stale extractions..."

# Remove any existing working copy that didn't come from the current zip
rm -rf "$WORK/portfolio_website-main"

# Find the most recently modified zip in uploads
LATEST_ZIP=$(ls -t "$UPLOADS"/*.zip 2>/dev/null | head -1)

if [ -z "$LATEST_ZIP" ]; then
  echo "ERROR: No zip found in $UPLOADS"
  exit 1
fi

echo "Using zip: $LATEST_ZIP"
echo "Modified: $(stat -c '%y' "$LATEST_ZIP")"

# Extract fresh
unzip -q "$LATEST_ZIP" -d "$WORK"
echo "Extracted to: $WORK/portfolio_website-main"
echo "Files: $(find "$WORK/portfolio_website-main" -type f | wc -l)"
echo "=== Ready ==="
