#!/bin/sh
# Prepare dictionary data for offline bundling.
# Copies data from the sibling moedict.tw repo into public/ so Vite
# includes it in the build output and Capacitor packages it into the APK.

set -e

MOEDICT_TW="${MOEDICT_TW:-moedict.tw}"

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

# Pinyin lookup indexes used by the sidebar's romanization search.
# Without these, the packaged app can list Mandarin/Cross-Strait pinyin via
# other local routes but Taiwanese/Hakka romanized searches return no suggestions.
if [ -d "$MOEDICT_TW/data/dictionary/lookup/pinyin" ]; then
  mkdir -p public/dictionary/lookup
  cp -r "$MOEDICT_TW/data/dictionary/lookup/pinyin" public/dictionary/lookup/
else
  echo "Error: Cannot find $MOEDICT_TW/data/dictionary/lookup/pinyin"
  echo "Run 'bun run build-pinyin-lookup' in the moedict.tw repo first"
  exit 1
fi

# Top-level radical and category files
cp "$MOEDICT_TW"/data/dictionary/@*.json  public/dictionary/ 2>/dev/null || true
cp "$MOEDICT_TW"/data/dictionary/=*.json  public/dictionary/ 2>/dev/null || true

# Search indexes (for Fuse.js full-text search)
mkdir -p public/search-index
SEARCH_INDEX_DIR=""
if ls "$MOEDICT_TW"/public/search-index/*.json >/dev/null 2>&1; then
  SEARCH_INDEX_DIR="$MOEDICT_TW/public/search-index"
elif ls "$MOEDICT_TW"/data/dictionary/search-index/*.json >/dev/null 2>&1; then
  SEARCH_INDEX_DIR="$MOEDICT_TW/data/dictionary/search-index"
elif [ -f "$MOEDICT_TW/scripts/build-search-index.mjs" ]; then
  echo "Generating search indexes from $MOEDICT_TW ..."
  node "$MOEDICT_TW/scripts/build-search-index.mjs"
  if ls "$MOEDICT_TW"/data/dictionary/search-index/*.json >/dev/null 2>&1; then
    SEARCH_INDEX_DIR="$MOEDICT_TW/data/dictionary/search-index"
  else
    echo "Error: Search index generation did not produce any JSON files"
    exit 1
  fi
else
  echo "Error: Cannot find search indexes in $MOEDICT_TW"
  exit 1
fi
cp "$SEARCH_INDEX_DIR"/*.json public/search-index/

# Legacy assets (CSS, JS, fonts for the original moedict-webkit styling)
mkdir -p public/assets-legacy
cp -r "$MOEDICT_TW/data/assets/css"     public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/js"      public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/fonts"   public/assets-legacy/
cp -r "$MOEDICT_TW/data/assets/images"  public/assets-legacy/
cp "$MOEDICT_TW/data/assets/styles.css" public/assets-legacy/

# PUA variant-headword font (MOE revised-dict.woff, 標楷體2) — referenced by
# src/index.css @font-face at /fonts/revised-dict.woff for the 110 plane-15 PUA
# variant headwords. Copied from the submodule's public/fonts/ (NOT data/assets).
if [ -d "$MOEDICT_TW/public/fonts" ]; then
  mkdir -p public/fonts
  cp -r "$MOEDICT_TW/public/fonts/." public/fonts/
fi

# Stroke animation data. The upstream constant and corpus manifest define the
# exact set; synchronize only when the committed local bundle is incomplete.
stroke_count=$(find public/stroke-json -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
expected_stroke_count=$(sed -nE 's/^export const STROKE_CORPUS_EXPECTED_COUNT = ([0-9]+);$/\1/p' "$MOEDICT_TW/src/utils/stroke-corpus.ts")
if [ -z "$expected_stroke_count" ]; then
  echo "Error: Cannot read STROKE_CORPUS_EXPECTED_COUNT from $MOEDICT_TW/src/utils/stroke-corpus.ts"
  exit 1
fi
if [ "$stroke_count" -ne "$expected_stroke_count" ]; then
  echo "Synchronizing stroke animation corpus ($stroke_count/$expected_stroke_count present)..."
  sh scripts/download-strokes.sh
fi

stroke_size=$(du -sh public/stroke-json 2>/dev/null | cut -f1 || echo "0")
echo "Done. Dictionary: $(du -sh public/dictionary | cut -f1), Assets: $(du -sh public/assets-legacy | cut -f1), Strokes: $stroke_size"
