#!/bin/sh
# Synchronize the authoritative MOE stroke corpus for offline use.
# The current pointer and immutable manifest provide the exact file list,
# including codepoints outside the BMP URO range. Existing files are skipped;
# downloaded and local files are verified against manifest hashes.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun "$SCRIPT_DIR/sync-stroke-corpus.ts"
