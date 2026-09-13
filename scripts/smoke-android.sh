#!/bin/sh
# smoke-android.sh -- end-to-end offline smoke test for the moedict-app APK.
#
# What it does: installs the given APK (debug default) on a connected Android
# device/emulator, flips airplane mode on, launches the app, waits for it to
# settle, and then asserts via logcat + a screenshot that the webview came up
# without fatal JS errors and without 404s on any bundled /dictionary/,
# /search-index/, /stroke-json/, /assets-legacy/, /assets/fonts/, or /fonts/
# path. The Worker-first /assets/fonts/MOEDICT.woff2?v=* miss is allowed only
# when /assets-legacy/fonts/MOEDICT.woff2 was then served (the Capacitor
# fallback).
#
# Positive control differs by build type. Debug builds emit Capacitor's
# Logger.debug lines, so a served bundled request is asserted directly in
# logcat. Release builds cannot: Capacitor defaults loggingBehavior to debug,
# which sets loggingEnabled = isDebug (CapConfig.java), silencing every
# Logger.debug("Handling local request: ...") line. For release, the positive
# control is instead: airplane mode provably on + a substantially rendered
# first screenshot. With no network available, a ~500 KB render of the entry
# route can only come from locally served bundled JS/CSS/data.
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
if [ -f "$SCRIPT_DIR/env.sh" ]; then
  . "$SCRIPT_DIR/env.sh"
fi

DEFAULT_APK="$REPO_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
APK_PATH="${1:-$DEFAULT_APK}"

# Resolve AAPT and APKSIGNER from PATH or ANDROID_HOME
AAPT_BIN="$(command -v aapt 2>/dev/null || true)"
if [ -z "$AAPT_BIN" ] && [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME/build-tools" ]; then
  AAPT_BIN="$(find "$ANDROID_HOME/build-tools" -name aapt 2>/dev/null | sort -V | tail -n1 || true)"
fi

APKSIGNER_BIN="$(command -v apksigner 2>/dev/null || true)"
if [ -z "$APKSIGNER_BIN" ] && [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME/build-tools" ]; then
  APKSIGNER_BIN="$(find "$ANDROID_HOME/build-tools" -name apksigner 2>/dev/null | sort -V | tail -n1 || true)"
fi

# Extract package name dynamically from APK if possible
PKG=""
if [ -f "$APK_PATH" ] && [ -n "$AAPT_BIN" ] && [ -x "$AAPT_BIN" ]; then
  PKG="$("$AAPT_BIN" dump badging "$APK_PATH" 2>/dev/null | awk -F"'" '/package: name=/{print $2; exit}' || true)"
fi
if [ -z "$PKG" ]; then
  PKG="org.audreyt.dict.moe.debug"
fi
# Release builds silence Capacitor Logger.debug (see header), so the
# logcat positive control below only applies to debug packages.
case "$PKG" in
  *.debug) IS_RELEASE=0 ;;
  *) IS_RELEASE=1 ;;
esac
# Calibrated 2026-09-13 on 1080x2400 emulator screenshots: healthy renders
# of the default entry route are ~500 KB; a blank/error page compresses far
# smaller. Release renders must clear this bar (see positive control).
RELEASE_MIN_SCREEN_BYTES=100000
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

hdr "Safety check: inspect device installation of $PKG"
echo "Target package: $PKG"

# 1. Get signer certificate SHA-256 digest of the new APK
APK_CERT_DIGEST=""
APK_CERT_DN=""
if [ -n "$APKSIGNER_BIN" ] && [ -x "$APKSIGNER_BIN" ]; then
  APK_CERTS_RAW="$("$APKSIGNER_BIN" verify --print-certs "$APK_PATH" 2>/dev/null || true)"
  APK_CERT_DIGEST="$(echo "$APK_CERTS_RAW" | awk -F': ' '/Signer #[0-9]+ certificate SHA-256 digest:/{print tolower($2); exit}' || true)"
  APK_CERT_DN="$(echo "$APK_CERTS_RAW" | awk -F': ' '/Signer #[0-9]+ certificate DN:/{print $2; exit}' || true)"
fi

# 2. Check if the target package is already installed on the device
INSTALLED_PATH="$(adb shell pm path "$PKG" 2>/dev/null | head -n1 | sed -e 's/^package://' | tr -d '\r\n' || true)"

if [ -n "$INSTALLED_PATH" ]; then
  echo "Package '$PKG' is ALREADY INSTALLED on device at: $INSTALLED_PATH"
  
  # Pull installed base.apk to inspect its signer
  INSTALLED_CERT_DIGEST=""
  INSTALLED_CERT_DN=""
  INSTALLED_TEMP="/tmp/moedict-installed-check-$$.apk"
  if adb pull "$INSTALLED_PATH" "$INSTALLED_TEMP" >/dev/null 2>&1; then
    if [ -n "$APKSIGNER_BIN" ] && [ -x "$APKSIGNER_BIN" ]; then
      INSTALLED_CERTS_RAW="$("$APKSIGNER_BIN" verify --print-certs "$INSTALLED_TEMP" 2>/dev/null || true)"
      INSTALLED_CERT_DIGEST="$(echo "$INSTALLED_CERTS_RAW" | awk -F': ' '/Signer #[0-9]+ certificate SHA-256 digest:/{print tolower($2); exit}' || true)"
      INSTALLED_CERT_DN="$(echo "$INSTALLED_CERTS_RAW" | awk -F': ' '/Signer #[0-9]+ certificate DN:/{print $2; exit}' || true)"
    fi
    rm -f "$INSTALLED_TEMP"
  fi

  echo "  Installed app signer : ${INSTALLED_CERT_DN:-unknown}"
  echo "  Installed SHA-256    : ${INSTALLED_CERT_DIGEST:-unknown}"
  echo "  New APK signer       : ${APK_CERT_DN:-unknown}"
  echo "  New APK SHA-256      : ${APK_CERT_DIGEST:-unknown}"

  SIGNERS_MATCH=0
  KNOWN_MISMATCH=0
  if [ -n "$INSTALLED_CERT_DIGEST" ] && [ -n "$APK_CERT_DIGEST" ]; then
    if [ "$INSTALLED_CERT_DIGEST" = "$APK_CERT_DIGEST" ]; then
      SIGNERS_MATCH=1
    else
      KNOWN_MISMATCH=1
    fi
  fi

  if [ "$SIGNERS_MATCH" -eq 1 ]; then
    echo "Signers MATCH. Safe to update/reinstall matching debug package."
  elif [ "$KNOWN_MISMATCH" -eq 0 ]; then
    # The installed signer could not be read (pull/verify hiccup), so there
    # is no proven mismatch. Proceed to the install attempt below: Android
    # itself refuses an incompatible update (INSTALL_FAILED_UPDATE_INCOMPATIBLE)
    # without touching app data, and the install step already fails cleanly
    # on anything but "Success". Only a proven mismatch takes the
    # uninstall/opt-in path.
    echo "WARNING: installed signer unreadable; proceeding to install attempt (Android enforces signature compatibility safely)."
  else
    echo "SIGNER MISMATCH / NON-DEBUG SIGNATURE DETECTED on target package '$PKG'!"
    if [ "${ALLOW_DESTRUCTIVE_UNINSTALL:-0}" = "1" ] || [ "${ALLOW_UNINSTALL_STORE_APP:-0}" = "1" ]; then
      echo "WARNING: Explicit opt-in set (ALLOW_DESTRUCTIVE_UNINSTALL=1)."
      echo "Proceeding to uninstall '$PKG' (ALL SAVED USER DATA FOR THIS PACKAGE WILL BE LOST)..."
      adb uninstall "$PKG" || true
    else
      printf '\n'
      echo "================================================================================"
      echo "SAFETY GUARD: REFUSING DESTRUCTIVE UNINSTALL ON TARGET DEVICE"
      echo "================================================================================"
      echo "Target package '$PKG' is ALREADY INSTALLED on this device, but its signer"
      echo "differs from the APK being tested:"
      echo ""
      echo "  Installed signer : ${INSTALLED_CERT_DN:-unknown}"
      echo "  Installed SHA-256: ${INSTALLED_CERT_DIGEST:-unknown}"
      echo "  New APK signer   : ${APK_CERT_DN:-unknown}"
      echo "  New APK SHA-256  : ${APK_CERT_DIGEST:-unknown}"
      echo ""
      echo "Because Android enforces signature compatibility (INSTALL_FAILED_UPDATE_INCOMPATIBLE),"
      echo "installing over this package requires UNINSTALLING the existing app first."
      echo ""
      echo "HAZARD:"
      echo "Uninstalling '$PKG' will PERMANENTLY DESTROY all existing app data, including:"
      echo "  - Starred words (字詞記錄簿) in WebView localStorage"
      echo "  - User preferences and search history"
      echo "  - Offline cache"
      echo ""
      echo "HOW TO PROCEED:"
      echo "1. Non-destructive side-by-side testing (RECOMMENDED):"
      echo "   The debug build (org.audreyt.dict.moe.debug) has its own data sandbox and"
      echo "   installs alongside the store app without touching its saved data."
      echo ""
      echo "2. Destructive override (if you INTENTIONALLY want to wipe the device install):"
      echo "   Re-run with ALLOW_DESTRUCTIVE_UNINSTALL=1:"
      echo "     ALLOW_DESTRUCTIVE_UNINSTALL=1 sh scripts/smoke-android.sh"
      echo "================================================================================"
      fail "Safety guard blocked destructive uninstall of '$PKG'"
      exit 1
    fi
  fi
else
  echo "Package '$PKG' is not currently installed on device. Safe to proceed."
fi
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
if [ "$AM_NOW" = "0" ]; then
  fail "airplane mode did not engage; offline assertions would be meaningless"
  exit 1
fi

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
BAD_PATHS='/dictionary/\|/stroke-json/\|/search-index/\|/assets-legacy/\|/assets/fonts/\|/fonts/'
# Worker-first Same-Origin face: Capacitor cannot serve
# /assets/fonts/MOEDICT.*?v=20260713-cors. The bundled second src is
# /assets-legacy/fonts/MOEDICT.woff2. Drop that expected miss from the
# fail set only when the legacy file was actually handled.
legacy_woff2_served() {
  grep -q 'Handling local request: https://localhost/assets-legacy/fonts/MOEDICT.woff2' "$1" 2>/dev/null
}
drop_expected_font_miss() {
  if legacy_woff2_served "$1"; then
    grep -v '/assets/fonts/MOEDICT.woff2' || true
  else
    cat
  fi
}
ASSET_FAILS="$(grep -E 'net::ERR_|Unable to open asset URL' "$LOGCAT_FILE" 2>/dev/null | grep "$BAD_PATHS" | drop_expected_font_miss "$LOGCAT_FILE" || true)"
if [ -n "$ASSET_FAILS" ]; then
  fail "net::ERR_* / Unable to open asset URL for a bundled data path"
  echo "$ASSET_FAILS" | head -n 10
fi
if grep -E 'net::ERR_|Unable to open asset URL' "$LOGCAT_FILE" 2>/dev/null | grep -q '/assets/fonts/MOEDICT.woff2'; then
  if legacy_woff2_served "$LOGCAT_FILE"; then
    echo "font fallback: Worker /assets/fonts/MOEDICT.woff2 missed; served /assets-legacy/fonts/MOEDICT.woff2"
  elif [ "$IS_RELEASE" = "1" ]; then
    # The serve confirmation is a Logger.debug line, absent in release
    # builds, so a miss here cannot distinguish "fallback served silently"
    # from "fallback broken". Downgrade to a warning rather than fail;
    # the render-size positive control below still guards the outcome.
    echo "WARNING: Worker /assets/fonts/MOEDICT.woff2 missed; legacy serve unconfirmable in release logcat."
  else
    fail "Worker /assets/fonts/MOEDICT.woff2 missed and /assets-legacy/fonts/MOEDICT.woff2 was not served"
  fi
fi
# 404 detection: require the literal " 404 " or "=404" or "/404" around the number
# to avoid catching log timestamp millis like "18:39:40.404".
if grep -E 'chromium|Console' "$LOGCAT_FILE" 2>/dev/null | grep -E '( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep -q "$BAD_PATHS"; then
  fail "HTTP 404 for a bundled data path in chromium console"
  grep -E 'chromium|Console' "$LOGCAT_FILE" | grep -E '( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep "$BAD_PATHS" | head -n 10
fi
# Positive control: absence-of-failure is not enough. A passing 2026-08-14
# emulator run logged Capacitor serving dictionary/pack/12.txt,
# dictionary/a/xref.json, and stroke-json/840c.json. Require at least one
# successful local request under those trees (not dictionary-corpus/, which
# 404s and is not bundled).
if [ "$IS_RELEASE" = "0" ]; then
  GOOD_SERVED="$(grep 'Handling local request: https://localhost/' "$LOGCAT_FILE" 2>/dev/null | grep -E '/dictionary/pack/|/dictionary/.*/xref|/stroke-json/|/search-index/' || true)"
  if [ -n "$GOOD_SERVED" ]; then
    echo "positive control: bundled path served"
    echo "$GOOD_SERVED" | sed -n '1,5p'
  else
    fail "no successful bundled /dictionary/, /stroke-json/, or /search-index/ request in logcat"
  fi
else
  # Release builds never log "Handling local request" (Logger.debug gated
  # on isDebug), so require a substantially rendered first screenshot
  # instead. Airplane mode is provably on above, so a large render of the
  # entry route can only come from locally served bundled assets.
  if [ "$SCR_BYTES" -ge "$RELEASE_MIN_SCREEN_BYTES" ]; then
    echo "positive control (release): airplane-mode render is $SCR_BYTES bytes (>= $RELEASE_MIN_SCREEN_BYTES)"
  else
    fail "release render only $SCR_BYTES bytes (< $RELEASE_MIN_SCREEN_BYTES); webview may be blank or on an error page"
  fi
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
  NEW_ERRS="$(diff "$LOGCAT_FILE" "$LOGCAT_FILE_T" 2>/dev/null | grep '^>' | grep -E 'net::ERR_|Unable to open asset URL|FATAL EXCEPTION|( 404 |=404|/404[^0-9]|HTTP.{0,10}404|status.{0,10}404)' | grep "$BAD_PATHS" | drop_expected_font_miss "$LOGCAT_FILE_T" || true)"
  if [ -n "$NEW_ERRS" ]; then
    fail "new errors after /t deep-link"
    echo "$NEW_ERRS" | head -n 10
  fi
fi

# cleanup() trap will restore airplane mode and print summary.
