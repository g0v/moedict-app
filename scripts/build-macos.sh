#!/bin/sh
# Build the macOS app bundle for 萌典 (MoeDict)
# Usage: sh scripts/build-macos.sh
#
# Produces: build/萌典.app/

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MACOS_DIR="$ROOT/macos"
BUILD_DIR="$ROOT/build"
APP_BUNDLE="$BUILD_DIR/萌典.app"

# Ensure dist/ exists (run web build if needed)
if [ ! -d "$ROOT/dist" ] || [ ! -f "$ROOT/dist/index.html" ]; then
    echo "dist/ not found — running npm run build..."
    cd "$ROOT"
    npm run build
fi

echo "Compiling main.swift..."
swiftc \
    -target arm64-apple-macos13.0 \
    -sdk "$(xcrun --show-sdk-path --sdk macosx)" \
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

# Copy dist contents into Resources/public/ (not symlinked)
echo "Copying dist/ into app bundle Resources/public/..."
cp -R "$ROOT/dist" "$APP_BUNDLE/Contents/Resources/public"

# Clean up intermediate binary
rm -f "$BUILD_DIR/萌典-binary"

echo "Built: $APP_BUNDLE"
echo "Size: $(du -sh "$APP_BUNDLE" | cut -f1)"
