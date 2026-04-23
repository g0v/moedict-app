#!/bin/sh
# Verify that a built APK contains all required offline assets.
# Compares entry counts inside the APK against the source counts under public/
# (which prepare-data.sh stages from the moedict.tw submodule).
#
# Usage: verify-apk.sh [path-to-apk]
# Default APK: android/app/build/outputs/apk/debug/app-debug.apk

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APK="${1:-$REPO_ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
PUBLIC="$REPO_ROOT/public"

# CJK filenames in the APK crash BSD awk unless the locale is forced to C.
export LC_ALL=C

FAIL=0
pass() { printf '[ OK ] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; FAIL=1; }

apk_has()         { printf '%s\n' "$ENTRIES" | grep -Fxq "$1"; }
apk_count_under() { printf '%s\n' "$ENTRIES" | awk -v p="$1" 'index($0,p)==1 && $0!=p' | grep -c .; }
apk_count_glob()  { printf '%s\n' "$ENTRIES" | awk -v p="$1" -v s="$2" 'index($0,p)==1 && substr($0,length($0)-length(s)+1)==s' | grep -c .; }
disk_count()      { find "$1" -type f 2>/dev/null | wc -l | tr -d ' '; }

cmp_counts() {
  if   [ "$3" -eq 0 ];   then fail "$1: disk count is 0 -- run 'npm run prepare-data' first"
  elif [ "$2" -eq "$3" ]; then pass "$1: $2 (matches disk)"
  else                         fail "$1: APK has $2, disk has $3"
  fi
}

# ---------- 1. APK exists and is > 50 MB ----------
printf '\n== 1. APK file sanity ==\n'
if [ ! -f "$APK" ]; then
  fail "APK not found at: $APK"
  echo "       Run: npm run build:android"
  exit 1
fi
APK_BYTES=$(wc -c < "$APK" | tr -d ' ')
APK_HUMAN=$(du -h "$APK" | cut -f1)
if [ "$APK_BYTES" -gt 52428800 ]; then
  pass "APK is $APK_HUMAN ($APK_BYTES bytes) > 50 MB"
else
  fail "APK is only $APK_HUMAN ($APK_BYTES bytes); expected > 50 MB"
fi

ENTRIES=$(unzip -l "$APK" 2>/dev/null | awk 'NR>3 && NF>=4 {print $NF}')
ENTRY_COUNT=$(printf '%s\n' "$ENTRIES" | grep -c .)

# ---------- 2. index.html ----------
printf '\n== 2. Web entry point ==\n'
if apk_has "assets/public/index.html"; then pass "assets/public/index.html present"
else                                        fail "assets/public/index.html missing"
fi

# ---------- 3. capacitor.config.json ----------
printf '\n== 3. Capacitor config ==\n'
if apk_has "assets/capacitor.config.json"; then
  CFG=$(unzip -p "$APK" assets/capacitor.config.json 2>/dev/null)
  if [ -z "$CFG" ]; then
    fail "assets/capacitor.config.json is empty"
  elif printf '%s' "$CFG" | grep -q '"appId"[[:space:]]*:[[:space:]]*"org.audreyt.dict.moe"'; then
    pass "capacitor.config.json present with appId=org.audreyt.dict.moe"
  else
    fail "capacitor.config.json present but appId mismatch or unparseable"
  fi
else
  fail "assets/capacitor.config.json missing"
fi

# ---------- 4. Dictionary language shards ----------
printf '\n== 4. Dictionary language shards ==\n'
for lang in a c h t; do
  if apk_has "assets/public/dictionary/$lang/index.json"; then pass "dictionary/$lang/index.json present"
  else                                                         fail "dictionary/$lang/index.json missing"
  fi
done

# ---------- 5. Search indexes ----------
printf '\n== 5. Search indexes ==\n'
for lang in a c h t; do
  if apk_has "assets/public/search-index/$lang.json"; then pass "search-index/$lang.json present"
  else                                                     fail "search-index/$lang.json missing"
  fi
done

# ---------- 6. Packed buckets ----------
printf '\n== 6. Packed buckets (pack/pcck/phck/ptck) ==\n'
TOTAL_APK=0; TOTAL_DISK=0
for b in pack pcck phck ptck; do
  apk_n=$(apk_count_under "assets/public/dictionary/$b/")
  disk_n=$(disk_count "$PUBLIC/dictionary/$b")
  cmp_counts "  $b" "$apk_n" "$disk_n"
  TOTAL_APK=$((TOTAL_APK + apk_n)); TOTAL_DISK=$((TOTAL_DISK + disk_n))
done
cmp_counts "  TOTAL buckets" "$TOTAL_APK" "$TOTAL_DISK"

# ---------- 7. Stroke JSONs ----------
printf '\n== 7. Stroke animation JSONs ==\n'
APK_STROKES=$(apk_count_glob "assets/public/stroke-json/" ".json")
DISK_STROKES=$(find "$PUBLIC/stroke-json" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
cmp_counts "  stroke-json/*.json" "$APK_STROKES" "$DISK_STROKES"

# ---------- 8. Legacy assets ----------
printf '\n== 8. Legacy assets (fonts/css/js/images) ==\n'
for d in fonts css js images; do
  apk_n=$(apk_count_under "assets/public/assets-legacy/$d/")
  disk_n=$(disk_count "$PUBLIC/assets-legacy/$d")
  cmp_counts "  assets-legacy/$d" "$apk_n" "$disk_n"
done

# ---------- Summary ----------
printf '\n== Summary ==\n'
printf 'APK:          %s\n' "$APK"
printf 'APK size:     %s (%s bytes)\n' "$APK_HUMAN" "$APK_BYTES"
printf 'APK entries:  %s\n' "$ENTRY_COUNT"
printf 'Buckets:      %s files (expected %s on disk)\n' "$TOTAL_APK" "$TOTAL_DISK"
printf 'Strokes:      %s files (expected %s on disk)\n' "$APK_STROKES" "$DISK_STROKES"

if [ "$FAIL" -eq 0 ]; then
  printf '\nAll checks passed.\n'
  exit 0
else
  printf '\nOne or more checks FAILED. See [FAIL] lines above.\n'
  exit 1
fi
