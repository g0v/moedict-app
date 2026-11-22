#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

# Run the real staging command in an isolated app with a small upstream corpus.
UPSTREAM="$TEST_DIR/upstream"
APP="$TEST_DIR/app"
for dir in pack pcck phck ptck a c h t lookup/pinyin; do
    mkdir -p "$UPSTREAM/data/dictionary/$dir"
done
mkdir -p "$UPSTREAM/public/search-index" "$UPSTREAM/src/utils"
printf '{}\n' > "$UPSTREAM/public/search-index/a.json"
printf 'export const STROKE_CORPUS_EXPECTED_COUNT = 0;\n' \
    > "$UPSTREAM/src/utils/stroke-corpus.ts"
for dir in css js fonts images; do
    mkdir -p "$UPSTREAM/data/assets/$dir"
done
printf 'body {}\n' > "$UPSTREAM/data/assets/styles.css"

# Chinese filenames and nested directories must survive staging byte for byte.
GUIDE="發音與表記_resized.jpg"
mkdir -p "$UPSTREAM/public/images/guide/nested" "$APP/public/stroke-json"
printf 'guide image bytes\n' > "$UPSTREAM/public/images/guide/$GUIDE"
printf 'nested image bytes\n' > "$UPSTREAM/public/images/guide/nested/example.jpg"

cd "$APP"
MOEDICT_TW="$UPSTREAM" sh "$ROOT/scripts/prepare-data.sh"

for file in "$GUIDE" nested/example.jpg; do
    if [ ! -f "public/images/guide/$file" ]; then
        echo "FAIL: About guide image was not bundled: $file" >&2
        exit 1
    fi
    cmp "$UPSTREAM/public/images/guide/$file" "public/images/guide/$file"
done
echo "PASS: About guide images are bundled at their original paths."
