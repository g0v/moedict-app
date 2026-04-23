#!/bin/sh
# Build the macOS app bundle for 萌典 (MoeDict).
#
# Modes:
#   sh scripts/build-macos.sh             # unsigned dev build (fast, legacy behaviour)
#   sh scripts/build-macos.sh --sandbox   # signed with Apple Development cert
#                                         # (App Sandbox entitlements; suitable for
#                                         # local MAS smoke testing before submission)
#   sh scripts/build-macos.sh --mas       # signed with Apple Distribution cert and
#                                         # embedded MAS provisioning profile; output
#                                         # is ready to be wrapped in a .pkg and
#                                         # uploaded via Transporter. Requires env:
#                                         #   MOEDICT_MAS_PROFILE=/path/to/profile.provisionprofile
#                                         #   (and an "Apple Distribution: Audrey Tang"
#                                         #    identity in the keychain)
#
# Produces: build/萌典.app/

set -e

MODE="${1:-unsigned}"
case "$MODE" in
    --sandbox|--mas|unsigned) ;;
    *) echo "Unknown mode: $MODE"; echo "Use --sandbox, --mas, or no flag for unsigned."; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MACOS_DIR="$ROOT/macos"
BUILD_DIR="$ROOT/build"
APP_BUNDLE="$BUILD_DIR/萌典.app"
ENTITLEMENTS="$MACOS_DIR/Moedict.entitlements"
SWIFT_MODULE_CACHE="$BUILD_DIR/.swift-module-cache"

# Ensure dist/ exists (run web build if needed)
if [ ! -d "$ROOT/dist" ] || [ ! -f "$ROOT/dist/index.html" ]; then
    echo "dist/ not found — running npm run build..."
    cd "$ROOT"
    npm run build
fi

mkdir -p "$BUILD_DIR"
mkdir -p "$SWIFT_MODULE_CACHE"

echo "Compiling main.swift..."
swiftc \
    -target arm64-apple-macos13.0 \
    -sdk "$(xcrun --show-sdk-path --sdk macosx)" \
    -module-cache-path "$SWIFT_MODULE_CACHE" \
    -O \
    -o "$BUILD_DIR/萌典-binary" \
    "$MACOS_DIR/main.swift"

echo "Assembling app bundle..."
# Clean previous build
rm -rf "$APP_BUNDLE"

# Create bundle structure
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy binary
cp "$BUILD_DIR/萌典-binary" "$APP_BUNDLE/Contents/MacOS/萌典"
chmod +x "$APP_BUNDLE/Contents/MacOS/萌典"

# Copy Info.plist
cp "$MACOS_DIR/萌典.app/Contents/Info.plist" "$APP_BUNDLE/Contents/Info.plist"

# Copy icon
cp "$MACOS_DIR/萌典.app/Contents/Resources/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"

# Copy dist contents into Resources/public/ (not symlinked — the bundle is
# self-contained so it can be archived / signed / distributed).
echo "Copying dist/ into app bundle Resources/public/..."
cp -R "$ROOT/dist" "$APP_BUNDLE/Contents/Resources/public"

# Clean up intermediate binary
rm -f "$BUILD_DIR/萌典-binary"

# ---------- Signing ----------
# Codesigning requires a valid macOS developer identity in the keychain. Both
# sandbox test and MAS modes sign with --options runtime (hardened runtime) so
# the binary passes notarisation checks; the entitlements file turns on App
# Sandbox, which Mac App Store validation refuses to accept without.

sign_with() {
    identity="$1"
    echo "Signing .app with identity: $identity"
    codesign --force --deep --options runtime \
        --entitlements "$ENTITLEMENTS" \
        --sign "$identity" \
        "$APP_BUNDLE"
    echo "Verifying signature:"
    codesign --verify --verbose=2 "$APP_BUNDLE" 2>&1 | sed 's/^/  /'
    echo "Entitlements on the signed binary:"
    codesign -d --entitlements :- "$APP_BUNDLE" 2>/dev/null | sed 's/^/  /' || true
}

case "$MODE" in
    --sandbox)
        DEV_ID=$(security find-identity -v -p codesigning | awk -F'"' '/Apple Development: /{print $2; exit}')
        if [ -z "$DEV_ID" ]; then
            echo "No 'Apple Development' identity in keychain; cannot sign for sandbox test." >&2
            exit 1
        fi
        sign_with "$DEV_ID"
        ;;
    --mas)
        if [ -z "${MOEDICT_MAS_PROFILE:-}" ] || [ ! -f "$MOEDICT_MAS_PROFILE" ]; then
            echo "MOEDICT_MAS_PROFILE must point to a .provisionprofile downloaded from the" >&2
            echo "Apple Developer Portal (Mac App Store distribution profile for tw.moedict.app)." >&2
            exit 1
        fi
        echo "Embedding provisioning profile..."
        cp "$MOEDICT_MAS_PROFILE" "$APP_BUNDLE/Contents/embedded.provisionprofile"
        DIST_ID=$(security find-identity -v -p codesigning | awk -F'"' '/Apple Distribution: /{print $2; exit}')
        if [ -z "$DIST_ID" ]; then
            echo "No 'Apple Distribution' identity in keychain." >&2
            exit 1
        fi
        sign_with "$DIST_ID"
        PKG_OUT="$BUILD_DIR/萌典.pkg"
        echo "Wrapping into installer package: $PKG_OUT"
        productbuild \
            --component "$APP_BUNDLE" /Applications \
            --sign "$DIST_ID" \
            --timestamp \
            "$PKG_OUT"
        echo "Verifying pkg signature:"
        pkgutil --check-signature "$PKG_OUT" | sed 's/^/  /' | head -8
        echo "Built: $PKG_OUT ($(du -sh "$PKG_OUT" | cut -f1))"
        ;;
    unsigned)
        echo "Unsigned build (local dev only). Launchd may refuse to open this app on" \
             "recent macOS; pass --sandbox for a signed sandbox test build."
        ;;
esac

echo "Built: $APP_BUNDLE"
echo "Size: $(du -sh "$APP_BUNDLE" | cut -f1)"
