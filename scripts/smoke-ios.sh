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
#   5. Polls until the app process appears, then captures a screenshot.
#   6. Asserts via WebKit/simctl logs (from the launch timestamp) that no
#      404s/didFail occur on bundled paths
#      (/dictionary/, /search-index/, /stroke-json/, /assets-legacy/).
#
# Exits 0 on success, 1 on any failure.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PKG="org.audreyt.dict.moe"
DEFAULT_APP="$REPO_ROOT/ios/App/build/Debug-iphonesimulator/App.app"
# Ephemeral xcodebuild -derivedDataPath leftover from yesterday's hand-built sim.
FALLBACK_APP="/tmp/moedict-ios-sim-derived/Build/Products/Debug-iphonesimulator/App.app"
SETTLE_TIMEOUT="${SETTLE_TIMEOUT:-30}"

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
LAUNCH_TS="$(date '+%Y-%m-%d %H:%M:%S')"
LAUNCH_OUT="$(xcrun simctl launch "$UDID" "$PKG" 2>&1 || true)"
echo "$LAUNCH_OUT"
echo "launch timestamp: $LAUNCH_TS"
if echo "$LAUNCH_OUT" | grep -qE 'error:|Unable to find|not found|failed'; then
  fail "simctl launch reported an error."
  exit 1
fi

hdr "Wait for app process"
echo "timeout: ${SETTLE_TIMEOUT}s (poll launchctl / process list for $PKG or App)"
ELAPSED=0
APP_READY=0
while [ "$ELAPSED" -lt "$SETTLE_TIMEOUT" ]; do
  if xcrun simctl spawn "$UDID" launchctl list 2>/dev/null | grep -q "$PKG"; then
    echo "app process listed in launchctl (${ELAPSED}s)"
    APP_READY=1
    break
  fi
  if xcrun simctl spawn "$UDID" ps -A 2>/dev/null | grep -v grep | grep -qE '[[:space:]]App$|/App.app/App'; then
    echo "app process listed in ps (${ELAPSED}s)"
    APP_READY=1
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
if [ "$APP_READY" -ne 1 ]; then
  fail "app process $PKG never appeared within ${SETTLE_TIMEOUT}s"
fi

hdr "Screenshot"
xcrun simctl io "$UDID" screenshot "$SCREEN_FILE"
SCR_BYTES="$(stat -f%z "$SCREEN_FILE" 2>/dev/null || stat -c%s "$SCREEN_FILE" 2>/dev/null || echo 0)"
echo "Screenshot: $SCREEN_FILE ($SCR_BYTES bytes)"
if [ "$SCR_BYTES" -lt 10240 ]; then
  fail "Screenshot size < 10 KB -- webview may be blank."
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

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo ""
  echo "Smoke test FAILED with $FAIL_COUNT errors."
  exit 1
else
  echo ""
  echo "Smoke test PASSED!"
  exit 0
fi
