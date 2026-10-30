#!/bin/bash
# Double-click this file in Finder if PixelUsageDesk.app does not launch or is not running.
cd "$(dirname "$0")"

APP="$HOME/Applications/PixelUsageDesk.app/Contents/MacOS/PixelUsageDesk"
if [ ! -x "$APP" ]; then
  APP="$(pwd)/PixelUsageDesk.app/Contents/MacOS/PixelUsageDesk"
fi

if pgrep -f "PixelUsageDesk.app/Contents/MacOS/PixelUsageDesk" >/dev/null 2>&1; then
  exit 0
fi

nohup "$APP" >/dev/null 2>&1 &
exit 0
