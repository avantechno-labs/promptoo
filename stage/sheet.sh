#!/bin/bash
# usage: sheet.sh "<query>" out.png [width,height]
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"; DIR="$(cd "$(dirname "$0")" && pwd)"
"$CH" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars --window-size=${3:-1560,900} --virtual-time-budget=60000 --screenshot="$(cygpath -w "$2")" "file:///$(cygpath -m "$DIR/sheet.html")?$1" >/dev/null 2>&1
