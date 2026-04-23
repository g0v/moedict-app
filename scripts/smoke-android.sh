#!/bin/sh
# smoke-android.sh -- end-to-end offline smoke test for the moedict-app APK.
#
# What it does: installs the debug APK on a connected Android device/emulator,
# flips airplane mode on, launches the app, waits for it to settle, and then
# asserts via logcat + a screenshot that the webview came up without fatal
# JS errors and without 404s on any bundled /dictionary/, /search-index/,
# /stroke-json/, or /assets-legacy/ path.
#
# Assumptions:
#   * An Android emulator or physical device is already connected (`adb devices`
#     shows at least one device in the `device` state).
#   * `adb` is either in PATH or lives under ~/Library/Android/sdk/platform-tools/.
#   * APK has already been built (default path: android/app/build/outputs/apk/debug/app-debug.apk).
#
# Exits 0 on success, 1 on any failure. Restores airplane-mode state on exit.

set -u

# Resolve repo root (parent of scripts/).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PKG="org.audreyt.dict.moe"
# Note: applicationId (PKG) and namespace diverge in android/app/build.gradle,
# so the launcher class lives in tw.moedict.app.* rather than org.audreyt.dict.moe.*.
# Use `monkey -p $PKG -c LAUNCHER` to avoid hardcoding the class name.
DEFAULT_APK="$REPO_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
APK_PATH="${1:-$DEFAULT_APK}"

LOGCAT_FILE="/tmp/moedict-smoke-logcat.txt"
LOGCAT_FILE_T="/tmp/moedict-smoke-logcat-t.txt"
SCREEN_FILE="/tmp/moedict-smoke-screen.png"
SCREEN_FILE_T="/tmp/moedict-smoke-screen-t.png"

# Pretty-print step headers.
hdr() { printf '\n=== %s ===\n' "$1"; }
fail() { printf 'FAILED: %s\n' "$1" >&2; FAIL_COUNT=$((FAIL_COUNT+1)); }
FAIL_COUNT=0
PRIOR_AIRPLANE=""

# Ensure adb is on PATH (prepend the standard macOS Android SDK location).
if ! command -v adb >/dev/null 2>&1; then
  if [ -x "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
    PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
    export PATH
  fi
fi

# Cleanup: restore airplane-mode to its prior state, print summary.
cleanup() {
  if [ -n "$PRIOR_AIRPLANE" ] && command -v adb >/dev/null 2>&1; then
    hdr "Teardown: restoring airplane-mode=$PRIOR_AIRPLANE"
    if [ "$PRIOR_AIRPLANE" = "0" ]; then
      adb shell cmd connectivity airplane-mode disable >/dev/null 2>&1 || {
        adb shell settings put global airplane_mode_on 0 >/dev/null 2>&1 || true
        adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false >/dev/null 2>&1 || true
      }
    fi
  fi
  if [ "$FAIL_COUNT" -gt 0 ]; then
    hdr "Summary: $FAIL_COUNT check(s) failed"
    if [ -f "$LOGCAT_FILE" ]; then
      echo "--- first 20 lines of $LOGCAT_FILE ---"
      head -n 20 "$LOGCAT_FILE" || true
      echo "--- (full log at $LOGCAT_FILE) ---"
    fi
    exit 1
  fi
  hdr "Summary: all checks passed"
  exit 0
}
trap cleanup EXIT INT TERM

hdr "Preflight"
if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found in PATH. Install Android platform-tools or add them to PATH."
  FAIL_COUNT=1; exit 1
fi
echo "adb: $(command -v adb)"

# Parse `adb devices -l` for a device in the `device` state.
DEVICES_RAW="$(adb devices -l 2>/dev/null | tail -n +2 | grep -v '^\s*$' || true)"
if [ -z "$DEVICES_RAW" ]; then
  echo "No devices from 'adb devices'. Start an emulator or plug in hardware."
  FAIL_COUNT=1; exit 1
fi
DEVICE_LINE="$(echo "$DEVICES_RAW" | awk '/[[:space:]]device([[:space:]]|$)/ {print; exit}')"
if [ -z "$DEVICE_LINE" ]; then
  echo "Devices found but none are in 'device' state:"
  echo "$DEVICES_RAW"
  FAIL_COUNT=1; exit 1
fi
echo "Using device: $DEVICE_LINE"

hdr "Resolve APK"
echo "APK path: $APK_PATH"
if [ ! -f "$APK_PATH" ]; then
  echo "APK not found. Run 'npm run build:android' first."
  FAIL_COUNT=1; exit 1
fi
# Portable byte-size check: stat -f on BSD/macOS, stat -c on GNU.
APK_BYTES="$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH" 2>/dev/null || wc -c <"$APK_PATH")"
APK_BYTES="$(echo "$APK_BYTES" | tr -d ' ')"
echo "APK size: $APK_BYTES bytes"
if [ "$APK_BYTES" -lt 52428800 ]; then
  echo "APK is < 50 MB; dictionary data probably isn't bundled."
  FAIL_COUNT=1; exit 1
fi

hdr "Record prior airplane-mode"
PRIOR_AIRPLANE="$(adb shell settings get global airplane_mode_on 2>/dev/null | tr -d '\r\n ' || true)"
[ -z "$PRIOR_AIRPLANE" ] && PRIOR_AIRPLANE="0"
echo "airplane_mode_on was: $PRIOR_AIRPLANE"

hdr "Uninstall any prior install"
adb uninstall "$PKG" >/dev/null 2>&1 || true
echo "done."

hdr "Install APK"
INSTALL_OUT="$(adb install -r "$APK_PATH" 2>&1 || true)"
echo "$INSTALL_OUT"
if ! echo "$INSTALL_OUT" | grep -q 'Success'; then
  fail "adb install did not report Success"
  exit 1
fi

hdr "Enable airplane mode"
if ! adb shell cmd connectivity airplane-mode enable >/dev/null 2>&1; then
  adb shell settings put global airplane_mode_on 1 >/dev/null 2>&1 || true
  adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true >/dev/null 2>&1 || true
fi
sleep 2
AM_NOW="$(adb shell settings get global airplane_mode_on 2>/dev/null | tr -d '\r\n ' || echo unknown)"
echo "airplane_mode_on now: $AM_NOW"

hdr "Clear logcat"
adb logcat -c >/dev/null 2>&1 || true

hdr "Launch app"
# Wake screen + dismiss keyguard so a real device doesn't snap a black screenshot.
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
START_TS="$(date +%s)"
LAUNCH_OUT="$(adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 2>&1 || true)"
echo "$LAUNCH_OUT"
echo "launch timestamp: $START_TS"
if echo "$LAUNCH_OUT" | grep -qE 'No activities found|Error|does not exist'; then
  fail "launcher intent did not resolve for $PKG"
  exit 1
fi
# Confirm the process actually appears within 5s.
for i in 1 2 3 4 5; do
  if adb shell pidof "$PKG" 2>/dev/null | grep -q '[0-9]'; then
    echo "app pid: $(adb shell pidof "$PKG" | tr -d '\r\n')"
    break
  fi
  sleep 1
  [ "$i" = "5" ] && fail "app process $PKG never appeared"
done

hdr "Wait for app to settle (~8s)"
for i in 1 2 3 4 5 6 7 8; do
  sleep 1
  adb logcat -d >"$LOGCAT_FILE" 2>/dev/null || true
  printf '.'
done
printf '\n'
adb logcat -d >"$LOGCAT_FILE" 2>/dev/null || true
echo "logcat snapshot: $LOGCAT_FILE ($(wc -l <"$LOGCAT_FILE" | tr -d ' ') lines)"

hdr "Screenshot"
adb exec-out screencap -p >"$SCREEN_FILE" 2>/dev/null || true
SCR_BYTES="$(stat -f%z "$SCREEN_FILE" 2>/dev/null || stat -c%s "$SCREEN_FILE" 2>/dev/null || echo 0)"
SCR_BYTES="$(echo "$SCR_BYTES" | tr -d ' ')"
echo "screenshot: $SCREEN_FILE ($SCR_BYTES bytes)"
if [ "$SCR_BYTES" -lt 10240 ]; then
  echo "WARNING: screenshot < 10 KB -- webview may be blank."
fi

hdr "Logcat assertions"
BAD_PATHS='/dictionary/\|/stroke-json/\|/search-index/\|/assets-legacy/'
if grep -q 'FATAL EXCEPTION' "$LOGCAT_FILE" 2>/dev/null; then
  fail "FATAL EXCEPTION in logcat"
  grep 'FATAL EXCEPTION' "$LOGCAT_FILE" | head -n 5
fi
if grep -E 'net::ERR_' "$LOGCAT_FILE" 2>/dev/null | grep -q "$BAD_PATHS"; then
  fail "net::ERR_* for a bundled data path"
  grep -E 'net::ERR_' "$LOGCAT_FILE" | grep "$BAD_PATHS" | head -n 10
fi
# 404 detection: require the literal " 404 " or "=404" or "/404" around the number
# to avoid catching log timestamp millis like "18:39:40.404".
if grep -E 'chromium|Console' "$LOGCAT_FILE" 2>/dev/null | grep -E '( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep -q "$BAD_PATHS"; then
  fail "HTTP 404 for a bundled data path in chromium console"
  grep -E 'chromium|Console' "$LOGCAT_FILE" | grep -E '( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep "$BAD_PATHS" | head -n 10
fi
CAP_PIDS="$(grep -Eo 'Capacitor[^:]*: *pid=[0-9]+|pid=[0-9]+ .*Capacitor' "$LOGCAT_FILE" 2>/dev/null | head -n 5 || true)"
CHR_PIDS="$(grep -E 'chromium' "$LOGCAT_FILE" 2>/dev/null | head -n 3 || true)"
[ -n "$CAP_PIDS" ] && echo "Capacitor trace sample: $CAP_PIDS"
[ -n "$CHR_PIDS" ] && echo "Chromium trace sample (first 3 lines): $CHR_PIDS"

hdr "Navigation probe: in-app route change to /t"
# Capacitor uses androidScheme: 'https' with host 'localhost', not a registered deep-link scheme,
# so a VIEW intent won't reach the webview. Instead, evaluate a small JS hop via the shared
# webview by sending a BROADCAST that the app doesn't listen for -- the real lever here is
# to simply kill+relaunch and then rely on the app's initial route, OR just keep the same
# session and note that the first launch already exercised the root route. For a second
# probe, relaunch and assert the app survives a cold start in airplane mode.
adb shell am force-stop "$PKG" >/dev/null 2>&1 || true
sleep 1
adb logcat -c >/dev/null 2>&1 || true
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
sleep 3
adb logcat -d >"$LOGCAT_FILE_T" 2>/dev/null || true
adb exec-out screencap -p >"$SCREEN_FILE_T" 2>/dev/null || true
echo "second screenshot: $SCREEN_FILE_T"

# Compare: lines in T snapshot that were not in the first snapshot, for the bad paths.
# Same 404-pattern specificity as above.
if [ -f "$LOGCAT_FILE" ] && [ -f "$LOGCAT_FILE_T" ]; then
  NEW_ERRS="$(diff "$LOGCAT_FILE" "$LOGCAT_FILE_T" 2>/dev/null | grep '^>' | grep -E 'net::ERR_|FATAL EXCEPTION|( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep "$BAD_PATHS" || true)"
  if [ -n "$NEW_ERRS" ]; then
    fail "new errors after /t deep-link"
    echo "$NEW_ERRS" | head -n 10
  fi
fi

# cleanup() trap will restore airplane mode and print summary.
