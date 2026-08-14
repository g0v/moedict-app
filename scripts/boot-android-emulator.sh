#!/bin/sh
# boot-android-emulator.sh -- idempotent bring-up of the moedict-smoke AVD.
#
# Uses the repo-local SDK (via scripts/env.sh). Homebrew avdmanager is bound
# to the Homebrew SDK root and cannot see .android-sdk -- always invoke
# $ANDROID_HOME/cmdline-tools/latest/bin/{sdkmanager,avdmanager}. Pass
# --sdk_root=$ANDROID_HOME to sdkmanager only (avdmanager 22 has no such flag).
#
# Exits 0 on success (including "already booted"), 1 on failure.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$SCRIPT_DIR/env.sh" ]; then
  . "$SCRIPT_DIR/env.sh"
fi

AVD_NAME="moedict-smoke"
SYS_IMAGE="system-images;android-35;google_apis;arm64-v8a"
DEVICE_NAME="pixel_6"
ABI="arm64-v8a"
BOOT_TIMEOUT="${BOOT_TIMEOUT:-180}"
EMULATOR_LOG="/tmp/moedict-emulator.log"

hdr() { printf '\n=== %s ===\n' "$1"; }
fail() { printf 'FAILED: %s\n' "$1" >&2; exit 1; }

hdr "Resolve SDK"
if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "$ANDROID_HOME" ]; then
  fail "ANDROID_HOME is unset or missing. Expected repo-local $REPO_ROOT/.android-sdk"
fi
echo "ANDROID_HOME=$ANDROID_HOME"
echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-unset}"
echo "ANDROID_USER_HOME=${ANDROID_USER_HOME:-unset}"
if [ -n "${ANDROID_USER_HOME:-}" ] && [ -d "$ANDROID_USER_HOME/avd" ]; then
  export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
  echo "ANDROID_AVD_HOME=$ANDROID_AVD_HOME"
fi

if [ -d "$ANDROID_HOME/platform-tools" ]; then
  PATH="$ANDROID_HOME/platform-tools:$PATH"
fi
if [ -d "$ANDROID_HOME/emulator" ]; then
  PATH="$ANDROID_HOME/emulator:$PATH"
fi
export PATH

SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"

# If cmdline-tools are not yet in the repo-local SDK, allow a one-shot
# bootstrap from whatever sdkmanager is on PATH (e.g. Homebrew), still
# targeting --sdk_root=$ANDROID_HOME. Never use Homebrew avdmanager.
if [ ! -x "$SDKMANAGER" ]; then
  if command -v sdkmanager >/dev/null 2>&1; then
    echo "note: repo-local sdkmanager missing; bootstrapping cmdline-tools via $(command -v sdkmanager)"
    BOOTSTRAP_SDKMANAGER="$(command -v sdkmanager)"
  else
    fail "sdkmanager not found at $SDKMANAGER and none on PATH"
  fi
else
  BOOTSTRAP_SDKMANAGER="$SDKMANAGER"
fi

install_pkg() {
  _pkg="$1"
  echo "installing $_pkg"
  yes | "$BOOTSTRAP_SDKMANAGER" --sdk_root="$ANDROID_HOME" --install "$_pkg" || \
    fail "sdkmanager failed to install $_pkg"
}

hdr "SDK packages"
if [ ! -x "$SDKMANAGER" ]; then
  yes | "$BOOTSTRAP_SDKMANAGER" --sdk_root="$ANDROID_HOME" --licenses >/dev/null 2>&1 || true
  install_pkg "cmdline-tools;latest"
  if [ ! -x "$SDKMANAGER" ]; then
    fail "cmdline-tools;latest installed but $SDKMANAGER is still missing"
  fi
  BOOTSTRAP_SDKMANAGER="$SDKMANAGER"
fi

NEED_INSTALL=""
[ -x "$EMULATOR_BIN" ] || NEED_INSTALL="$NEED_INSTALL emulator"
[ -d "$ANDROID_HOME/platforms/android-35" ] || NEED_INSTALL="$NEED_INSTALL platforms;android-35"
[ -d "$ANDROID_HOME/system-images/android-35/google_apis/arm64-v8a" ] || NEED_INSTALL="$NEED_INSTALL system-images;android-35;google_apis;arm64-v8a"
[ -x "$SDKMANAGER" ] || NEED_INSTALL="$NEED_INSTALL cmdline-tools;latest"

if [ -n "$NEED_INSTALL" ]; then
  echo "missing:$NEED_INSTALL"
  yes | "$SDKMANAGER" --sdk_root="$ANDROID_HOME" --licenses >/dev/null 2>&1 || true
  for _pkg in emulator "platforms;android-35" "system-images;android-35;google_apis;arm64-v8a" "cmdline-tools;latest"; do
    case " $NEED_INSTALL " in
      *" $_pkg "*) install_pkg "$_pkg" ;;
    esac
  done
else
  echo "emulator, platforms;android-35, $SYS_IMAGE, cmdline-tools;latest already present"
fi

if [ ! -x "$AVDMANAGER" ]; then
  fail "avdmanager not found at $AVDMANAGER"
fi
if [ ! -x "$EMULATOR_BIN" ]; then
  fail "emulator binary not found at $EMULATOR_BIN"
fi
if ! command -v adb >/dev/null 2>&1; then
  fail "adb not found on PATH (expected $ANDROID_HOME/platform-tools/adb)"
fi
echo "sdkmanager: $SDKMANAGER"
echo "avdmanager: $AVDMANAGER"
echo "emulator: $EMULATOR_BIN"
hdr "AVD $AVD_NAME"
AVD_LIST="$("$AVDMANAGER" list avd 2>/dev/null || true)"
if echo "$AVD_LIST" | grep -q "Name:[[:space:]]*$AVD_NAME[[:space:]]*$"; then
  echo "AVD $AVD_NAME already exists"
else
  echo "creating AVD $AVD_NAME (device=$DEVICE_NAME abi=$ABI image=$SYS_IMAGE)"
  # "no" declines the optional custom-hardware-profile prompt.
  if ! echo no | "$AVDMANAGER" create avd \
      --name "$AVD_NAME" \
      --package "$SYS_IMAGE" \
      --device "$DEVICE_NAME" \
      --abi "$ABI"; then
    fail "avdmanager failed to create $AVD_NAME"
  fi
fi

hdr "Detect running emulator"
EXISTING_SERIAL="$(adb devices 2>/dev/null | awk '/^emulator-/{print $1; exit}')"
EXISTING_STATE="$(adb devices 2>/dev/null | awk '/^emulator-/{print $2; exit}')"
if [ -n "${EXISTING_SERIAL:-}" ]; then
  echo "already running: $EXISTING_SERIAL ($EXISTING_STATE)"
  echo "not starting a second emulator"
else
  hdr "Boot emulator"
  echo "flags: -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect -accel on"
  echo "log: $EMULATOR_LOG"
  : >"$EMULATOR_LOG"
  nohup "$EMULATOR_BIN" -avd "$AVD_NAME" \
    -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect -accel on \
    >"$EMULATOR_LOG" 2>&1 &
  echo "emulator pid $!"
fi

hdr "Wait for boot"
echo "timeout: ${BOOT_TIMEOUT}s (poll adb device state + sys.boot_completed)"
ELAPSED=0
SERIAL=""
while [ "$ELAPSED" -lt "$BOOT_TIMEOUT" ]; do
  SERIAL="$(adb devices 2>/dev/null | awk '/^emulator-/{print $1; exit}')"
  STATE="$(adb devices 2>/dev/null | awk '/^emulator-/{print $2; exit}')"
  BOOT=""
  if [ "${STATE:-}" = "device" ] && [ -n "$SERIAL" ]; then
    BOOT="$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r\n' || true)"
    if [ "$BOOT" = "1" ]; then
      echo "ready: $SERIAL state=device sys.boot_completed=1 (${ELAPSED}s)"
      echo "ANDROID_HOME=$ANDROID_HOME"
      exit 0
    fi
  fi
  printf '  %ss serial=%s state=%s boot_completed=%s\n' \
    "$ELAPSED" "${SERIAL:-none}" "${STATE:-none}" "${BOOT:-?}"
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

fail "emulator did not reach device + sys.boot_completed=1 within ${BOOT_TIMEOUT}s (serial=${SERIAL:-none})"
