#!/bin/sh
# scripts/env.sh -- Environment helper for moedict-app builds (JDK 21 & Android SDK)

# Resolve directory where env.sh resides
if [ -n "${BASH_SOURCE:-}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$BASH_SOURCE")" 2>/dev/null && pwd)"
else
  SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
fi
REPO_ROOT="$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd)"
[ -z "$REPO_ROOT" ] && REPO_ROOT="$PWD"

# 1. Resolve JDK 21 (Capacitor 7 Android requires Java 21)
NEED_JDK21=1
if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
  JAVA_VER="$("$JAVA_HOME/bin/javac" -version 2>&1 | awk '{print $2}')"
  case "$JAVA_VER" in
    21.*|21) NEED_JDK21=0 ;;
  esac
fi

if [ "$NEED_JDK21" -eq 1 ]; then
  if [ -d "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JDK21_PATH="$(/usr/libexec/java_home -v 21 2>/dev/null)"
    if [ -n "$JDK21_PATH" ]; then
      export JAVA_HOME="$JDK21_PATH"
    fi
  elif [ -d "/usr/lib/jvm/java-21-openjdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
  fi
fi

# 2. Android SDK & Gradle cache paths
# Repo-local .android-sdk wins over a pre-set ANDROID_HOME / ANDROID_SDK_ROOT
# that points elsewhere, so a machine-global SDK cannot silently take over.
_canon_dir() {
  (cd "$1" 2>/dev/null && pwd)
}

LOCAL_SDK="$REPO_ROOT/.android-sdk"
if [ -d "$LOCAL_SDK" ]; then
  LOCAL_SDK_CANON="$(_canon_dir "$LOCAL_SDK")"
  if [ -n "${ANDROID_HOME:-}" ]; then
    HOME_CANON="$(_canon_dir "$ANDROID_HOME" || true)"
    if [ "$HOME_CANON" != "$LOCAL_SDK_CANON" ]; then
      echo "note: overriding ANDROID_HOME=${ANDROID_HOME} -> ${LOCAL_SDK_CANON}"
      export ANDROID_HOME="$LOCAL_SDK_CANON"
    fi
  else
    export ANDROID_HOME="$LOCAL_SDK_CANON"
  fi
  if [ -n "${ANDROID_SDK_ROOT:-}" ]; then
    ROOT_CANON="$(_canon_dir "$ANDROID_SDK_ROOT" || true)"
    if [ "$ROOT_CANON" != "$LOCAL_SDK_CANON" ]; then
      echo "note: overriding ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT} -> ${LOCAL_SDK_CANON}"
      export ANDROID_SDK_ROOT="$LOCAL_SDK_CANON"
    fi
  fi
fi

if [ -z "${GRADLE_USER_HOME:-}" ]; then
  if [ -d "$REPO_ROOT/.gradle-user-home" ]; then
    export GRADLE_USER_HOME="$REPO_ROOT/.gradle-user-home"
  fi
fi

if [ -z "${ANDROID_USER_HOME:-}" ]; then
  if [ -d "$REPO_ROOT/.android-home" ]; then
    export ANDROID_USER_HOME="$REPO_ROOT/.android-home"
  fi
fi
