#!/bin/sh
# smoke-ios.sh -- end-to-end offline smoke test for the moedict-app iOS Simulator build.
#
# What it does:
#   1. Resolves/verifies the built simulator .app bundle.
#      Default:  $REPO_ROOT/ios/App/build/Debug-iphonesimulator/App.app
#      Fallback: /tmp/moedict-ios-sim-derived/Build/Products/Debug-iphonesimulator/App.app
#      Override: pass the .app path as the first argument (same as smoke-android.sh).
#   2. Finds an available booted or shutdown iPhone simulator and boots it if needed.
#   3. Installs the app bundle onto the simulator.
#   4. Launches the app with bundle ID org.audreyt.dict.moe.
#   5. Polls until the installed bundle has actually been read
#      (atime bump on /dictionary/ or /stroke-json/) AND a screenshot
#      looks rendered — process existence is not webview readiness.
#   6. Asserts via WebKit/simctl logs (from the launch timestamp) that no
#      404s/didFail occur on bundled paths, AND that a bundled dictionary
#      path was served successfully.

# Exits 0 on success, 1 on any failure.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PKG="org.audreyt.dict.moe"
DEFAULT_APP="$REPO_ROOT/ios/App/build/Debug-iphonesimulator/App.app"
# Ephemeral xcodebuild -derivedDataPath leftover from yesterday's hand-built sim.
FALLBACK_APP="/tmp/moedict-ios-sim-derived/Build/Products/Debug-iphonesimulator/App.app"
SETTLE_TIMEOUT="${SETTLE_TIMEOUT:-45}"

# Calibration 2026-08-14, iPhone 17 sim, 1206x2622 PNG:
#   blank (status bar + home indicator only):  76093 bytes
#   rendered 萌 entry (previous passing run): 783120 / 788587 bytes
# A 200 KB floor sits well above chrome-only and well below a rendered page.
# The 10 KB floor cannot catch a blank iOS screenshot (still ~76 KB).
MIN_RENDERED_BYTES=200000


if [ -n "${1:-}" ]; then
  APP_PATH="$1"
elif [ -d "$DEFAULT_APP" ]; then
  APP_PATH="$DEFAULT_APP"
elif [ -d "$FALLBACK_APP" ]; then
  APP_PATH="$FALLBACK_APP"
else
  APP_PATH="$DEFAULT_APP"
fi

LOG_FILE="/tmp/moedict-smoke-ios-log.txt"
SCREEN_FILE="/tmp/moedict-smoke-ios-screen.png"

hdr() { printf '\n=== %s ===\n' "$1"; }
fail() { printf 'FAILED: %s\n' "$1" >&2; FAIL_COUNT=$((FAIL_COUNT+1)); }
FAIL_COUNT=0

hdr "Preflight"
if ! command -v xcrun >/dev/null 2>&1; then
  fail "xcrun not found in PATH."
  exit 1
fi

hdr "Resolve .app Bundle"
echo "App path: $APP_PATH"
if [ "$APP_PATH" = "$FALLBACK_APP" ] && [ ! -d "$DEFAULT_APP" ]; then
  echo "note: default $DEFAULT_APP missing; using documented fallback"
fi
if [ ! -d "$APP_PATH" ]; then
  fail "App bundle not found at $APP_PATH. Build for iphonesimulator, or pass a path (fallback: $FALLBACK_APP)."
  exit 1
fi

APP_BYTES="$(du -sk "$APP_PATH" 2>/dev/null | awk '{print $1 * 1024}')"
echo "App bundle size: $APP_BYTES bytes"
if [ "$APP_BYTES" -lt 52428800 ]; then
  fail "App bundle size (<50MB) seems unusually small. Pre-bundled data may be missing."
  exit 1
fi

hdr "Select Simulator"
# Look for a booted iPhone simulator first, else pick the first available iPhone simulator
BOOTED_UDID="$(xcrun simctl list devices available | grep -E 'iPhone.*\(Booted\)' | head -n1 | grep -Eo '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' || true)"

if [ -n "$BOOTED_UDID" ]; then
  UDID="$BOOTED_UDID"
  echo "Using already booted simulator UDID: $UDID"
else
  SHUTDOWN_UDID="$(xcrun simctl list devices available | grep -E 'iPhone' | grep -E '\(Shutdown\)' | head -n1 | grep -Eo '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' || true)"
  if [ -z "$SHUTDOWN_UDID" ]; then
    fail "No available iPhone simulator found."
    exit 1
  fi
  UDID="$SHUTDOWN_UDID"
  echo "Booting simulator UDID: $UDID..."
  xcrun simctl boot "$UDID"
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
    STATUS="$(xcrun simctl list devices | grep "$UDID" | grep -o "Booted" || true)"
    if [ "$STATUS" = "Booted" ]; then
      break
    fi
    sleep 1
    if [ "$i" = "30" ]; then
      fail "Simulator $UDID did not reach Booted within 30s."
      exit 1
    fi
  done
fi

hdr "Install App"
echo "Installing $APP_PATH on $UDID..."
if ! xcrun simctl install "$UDID" "$APP_PATH"; then
  fail "simctl install failed."
  exit 1
fi

hdr "Launch App"
echo "Launching $PKG on $UDID..."
# Cold-start so the next atime sample is a real serve, not a leftover
# from a process that already had the files mapped.
xcrun simctl terminate "$UDID" "$PKG" >/dev/null 2>&1 || true
INSTALLED_APP="$(xcrun simctl get_app_container "$UDID" "$PKG" app 2>/dev/null || true)"
PROBE_XREF="$INSTALLED_APP/public/dictionary/a/xref.json"
PROBE_PACK="$INSTALLED_APP/public/dictionary/pack/12.txt"
PROBE_STROKE="$INSTALLED_APP/public/stroke-json/840c.json"
if [ -z "$INSTALLED_APP" ] || [ ! -d "$INSTALLED_APP/public" ]; then
  fail "could not resolve installed App.app container for $PKG"
  exit 1
fi
atime_of() { stat -f %a "$1" 2>/dev/null || stat -c %X "$1" 2>/dev/null || echo 0; }
# APFS relatime only updates atime after a quiet period, so a second
# launch will not bump it unless we rewind the stamp first.
reset_atime() { [ -f "$1" ] && touch -a -t 200001010101 "$1"; }
reset_atime "$PROBE_XREF"
reset_atime "$PROBE_PACK"
reset_atime "$PROBE_STROKE"
PRIOR_XREF="$(atime_of "$PROBE_XREF")"
PRIOR_PACK="$(atime_of "$PROBE_PACK")"
PRIOR_STROKE="$(atime_of "$PROBE_STROKE")"
echo "probe atimes before launch: xref=$PRIOR_XREF pack=$PRIOR_PACK stroke=$PRIOR_STROKE"


LAUNCH_TS="$(date '+%Y-%m-%d %H:%M:%S')"
LAUNCH_OUT="$(xcrun simctl launch --terminate-running-process "$UDID" "$PKG" 2>&1 || true)"
echo "$LAUNCH_OUT"
echo "launch timestamp: $LAUNCH_TS"
if echo "$LAUNCH_OUT" | grep -qE 'error:|Unable to find|not found|failed'; then
  fail "simctl launch reported an error."
  exit 1
fi

png_looks_rendered() {
  # $1 path  $2 byte size. Byte floor is the portable check; python3 (stdlib
  # only) adds a pixel-diversity gate when present. No extra dependencies.
  _png="$1"
  _bytes="$2"
  if [ "$_bytes" -lt "$MIN_RENDERED_BYTES" ]; then
    return 1
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    return 0
  fi
  python3 - "$_png" <<'PY'
import sys
from struct import unpack
from zlib import decompress
path = sys.argv[1]
data = open(path, "rb").read()
if data[:8] != b"\x89PNG\r\n\x1a\n":
    sys.exit(1)
pos = 8
w = h = ct = None
idat = b""
while pos < len(data):
    ln = unpack(">I", data[pos:pos+4])[0]
    typ = data[pos+4:pos+8]
    chunk = data[pos+8:pos+8+ln]
    pos += 12 + ln
    if typ == b"IHDR":
        w, h, _bit, ct = unpack(">IIBB", chunk[:10])
    elif typ == b"IDAT":
        idat += chunk
if not w or ct not in (2, 6):
    sys.exit(1)
raw = decompress(idat)
bpp = 4 if ct == 6 else 3
stride = 1 + w * bpp
rgb = set()
nonzero = total = 0
step = 3
for y in range(80, max(81, h - 60), step):
    row = raw[y * stride + 1:(y + 1) * stride]
    for x in range(0, w, step):
        r, g, b = row[x * bpp], row[x * bpp + 1], row[x * bpp + 2]
        total += 1
        if r | g | b:
            nonzero += 1
        rgb.add((r, g, b))
# Blank 2026-08-14: unique_rgb=127, nonzero=0.1%.
# Rendered: unique_rgb>=1078, nonzero>=12%.
frac = (nonzero / total) if total else 0
sys.exit(0 if len(rgb) >= 200 and frac >= 0.03 else 1)
PY
}

hdr "Wait for rendered content"
echo "timeout: ${SETTLE_TIMEOUT}s (poll screenshot + atime on bundled dictionary/stroke files)"
echo "rendered floor: ${MIN_RENDERED_BYTES} bytes (blank~76KB, rendered~788KB on this sim)"
ELAPSED=0
APP_READY=0
READ_HITS=""
while [ "$ELAPSED" -lt "$SETTLE_TIMEOUT" ]; do
  READ_HITS=""
  if [ -f "$PROBE_XREF" ] && [ "$(atime_of "$PROBE_XREF")" -gt "$PRIOR_XREF" ]; then
    READ_HITS="$READ_HITS /dictionary/a/xref.json"
  fi
  if [ -f "$PROBE_PACK" ] && [ "$(atime_of "$PROBE_PACK")" -gt "$PRIOR_PACK" ]; then
    READ_HITS="$READ_HITS /dictionary/pack/12.txt"
  fi
  if [ -f "$PROBE_STROKE" ] && [ "$(atime_of "$PROBE_STROKE")" -gt "$PRIOR_STROKE" ]; then
    READ_HITS="$READ_HITS /stroke-json/840c.json"
  fi
  xcrun simctl io "$UDID" screenshot "$SCREEN_FILE" >/dev/null 2>&1
  SCR_BYTES="$(stat -f%z "$SCREEN_FILE" 2>/dev/null || stat -c%s "$SCREEN_FILE" 2>/dev/null || echo 0)"
  SCR_BYTES="$(echo "$SCR_BYTES" | tr -d ' ')"
  RENDERED=0
  if png_looks_rendered "$SCREEN_FILE" "$SCR_BYTES"; then
    RENDERED=1
  fi
  printf '  %ss screenshot=%s bytes rendered=%s reads=%s\n' \
    "$ELAPSED" "$SCR_BYTES" "$RENDERED" "${READ_HITS:-none}"
  if [ "$RENDERED" -eq 1 ] && [ -n "$READ_HITS" ]; then
    APP_READY=1
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
if [ "$APP_READY" -ne 1 ]; then
  fail "app never reached rendered content + bundled-path read within ${SETTLE_TIMEOUT}s (last screenshot ${SCR_BYTES:-0} bytes, reads=${READ_HITS:-none})"
  echo ""
  echo "Smoke test FAILED with $FAIL_COUNT errors."
  exit 1
fi
echo "ready at ${ELAPSED}s; screenshot $SCREEN_FILE ($SCR_BYTES bytes); served:$READ_HITS"


hdr "Screenshot"
echo "Screenshot: $SCREEN_FILE ($SCR_BYTES bytes)"
if [ "$SCR_BYTES" -lt "$MIN_RENDERED_BYTES" ]; then
  fail "Screenshot $SCR_BYTES bytes < ${MIN_RENDERED_BYTES} — blank/chrome-only (calibrated blank=76093, rendered~788000)."
fi

hdr "Log Assertions"
# Anchor to the launch timestamp so a short --last window cannot miss the
# start; also keep a 10m backstop if --start is rejected by this simctl.
if ! xcrun simctl spawn "$UDID" log show \
    --predicate 'process == "App" and message contains "didFail"' \
    --start "$LAUNCH_TS" >"$LOG_FILE" 2>&1; then
  xcrun simctl spawn "$UDID" log show \
    --predicate 'process == "App" and message contains "didFail"' \
    --last 10m >"$LOG_FILE" 2>&1 || true
fi

BAD_PATHS='/dictionary/\|/stroke-json/\|/search-index/\|/assets-legacy/'
if grep -E 'didFail' "$LOG_FILE" 2>/dev/null | grep -q "$BAD_PATHS"; then
  fail "Found failed resource loads (didFail) on bundled asset paths!"
  grep -E 'didFail' "$LOG_FILE" | grep "$BAD_PATHS" >&2
else
  echo "No failed resource loads detected on bundled asset paths."
fi

# Positive control: WebKit does not log Capacitor scheme-handler URLs, so the
# proof that a bundled path was served is the atime bump recorded above.
if [ -n "$READ_HITS" ]; then
  echo "positive control: bundled path served:$READ_HITS"
else
  fail "no bundled /dictionary/ or /stroke-json/ file was read after launch"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo ""
  echo "Smoke test FAILED with $FAIL_COUNT errors."
  exit 1
else
  echo ""
  echo "Smoke test PASSED!"
  exit 0
fi

