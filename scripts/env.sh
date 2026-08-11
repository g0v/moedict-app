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
if [ -z "${ANDROID_HOME:-}" ]; then
  if [ -d "$REPO_ROOT/.android-sdk" ]; then
    export ANDROID_HOME="$REPO_ROOT/.android-sdk"
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
