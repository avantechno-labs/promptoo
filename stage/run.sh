#!/bin/bash
# usage: run.sh "<query>" out.png   (renders stage/test.html with the query, prints the report, saves a screenshot)
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="$(cd "$(dirname "$0")" && pwd)"; URL="file:///$(cygpath -m "$DIR/test.html")?$1"
"$CH" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars --window-size=${3:-960,540} --virtual-time-budget=5000 --dump-dom "$URL" 2>/dev/null | python -c "
import sys,re,html
t=sys.stdin.read();m=re.search(r'<pre id=\"o\"[^>]*>(.*?)</pre>',t,re.S);print(html.unescape(m.group(1)) if m else 'NO REPORT')"
[ -n "$2" ] && "$CH" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars --window-size=${3:-960,540} --virtual-time-budget=5000 --screenshot="$(cygpath -w "$2")" "$URL" >/dev/null 2>&1
