#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

APP="PixelUsageDesk.app"
mkdir -p .build/tmp .build/module-cache
export TMPDIR="$PWD/.build/tmp"
export CLANG_MODULE_CACHE_PATH="$PWD/.build/module-cache"
export SWIFT_MODULE_CACHE_PATH="$PWD/.build/module-cache"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

swiftc -O -swift-version 5 \
  -module-cache-path "$PWD/.build/module-cache" \
  -framework Cocoa \
  -framework WebKit \
  -o "$APP/Contents/MacOS/PixelUsageDesk" \
  main.swift

cp desk.html "$APP/Contents/Resources/desk.html"
cp appicon.png "$APP/Contents/Resources/appicon.png"
cp Info.plist "$APP/Contents/Info.plist"

# Local ad-hoc signature. The app is not notarized; it is built and run on this Mac.
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

echo "built $APP"
