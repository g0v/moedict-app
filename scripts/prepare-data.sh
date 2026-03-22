#!/bin/sh
# Prepare dictionary data for offline bundling.
# Copies data from the sibling moedict.tw repo into public/ so Vite
# includes it in the build output and Capacitor packages it into the APK.

set -e

MOEDICT_TW="${MOEDICT_TW:-../moedict.tw}"

if [ ! -d "$MOEDICT_TW/data/dictionary" ]; then
  echo "Error: Cannot find $MOEDICT_TW/data/dictionary"
  echo "Set MOEDICT_TW to point to the moedict.tw repo"
  exit 1
fi

echo "Copying dictionary data from $MOEDICT_TW ..."

# Dictionary packed buckets and per-language data
mkdir -p public/dictionary
cp -r "$MOEDICT_TW/data/dictionary/pack"  public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/pcck"  public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/phck"  public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/ptck"  public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/a"     public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/c"     public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/h"     public/dictionary/
cp -r "$MOEDICT_TW/data/dictionary/t"     public/dictionary/

# Top-level radical and category files
cp "$MOEDICT_TW"/data/dictionary/@*.json  public/dictionary/ 2>/dev/null || true
cp "$MOEDICT_TW"/data/dictionary/=*.json  public/dictionary/ 2>/dev/null || true

# Search indexes (for Fuse.js full-text search)
mkdir -p public/search-index
cp "$MOEDICT_TW"/public/search-index/*.json public/search-index/

# Legacy assets (CSS, JS, fonts for the original moedict-webkit styling)
mkdir -p public/assets-legacy
cp -r "$MOEDICT_TW/data/assets/css"     public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/js"      public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/fonts"   public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/images"  public/assets-legacy/
cp "$MOEDICT_TW/data/assets/styles.css" public/assets-legacy/

# Stroke animation data (download if not already present)
stroke_count=$(find public/stroke-json -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
if [ "$stroke_count" -lt 1000 ]; then
  echo "Downloading stroke animation data..."
  sh scripts/download-strokes.sh
fi

stroke_size=$(du -sh public/stroke-json 2>/dev/null | cut -f1 || echo "0")
echo "Done. Dictionary: $(du -sh public/dictionary | cut -f1), Assets: $(du -sh public/assets-legacy | cut -f1), Strokes: $stroke_size"
