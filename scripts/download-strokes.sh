#!/bin/sh
# Download all CJK stroke animation data for offline use.
# Range: U+4E00–U+9FFF (CJK Unified Ideographs, ~20992 chars)
# Source: Rackspace CDN used by the original moedict-webkit

set -e

CDN="https://829091573dd46381a321-9e8a43b8d3436eaf4353af683c892840.ssl.cf1.rackcdn.com"
OUTDIR="public/stroke-json"
mkdir -p "$OUTDIR"

existing=$(find "$OUTDIR" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
echo "Existing stroke files: $existing"

echo "Downloading stroke data for U+4E00–U+9FFF (~20992 codepoints)..."

# Generate codepoint list, skipping already downloaded
seq $((0x4E00)) $((0x9FFF)) | while read i; do
  cp=$(printf '%x' "$i")
  if [ ! -f "$OUTDIR/${cp}.json" ]; then
    echo "$cp"
  fi
done | xargs -P 30 -I {} sh -c \
  'curl -s -f -o "'"$OUTDIR"'/{}.json" "'"$CDN"'/{}.json" 2>/dev/null || rm -f "'"$OUTDIR"'/{}.json"'

# Remove any leftover empty files
find "$OUTDIR" -name '*.json' -empty -delete 2>/dev/null || true

count=$(find "$OUTDIR" -name '*.json' | wc -l | tr -d ' ')
size=$(du -sh "$OUTDIR" | cut -f1)
echo "Done. $count stroke files ($size)"
