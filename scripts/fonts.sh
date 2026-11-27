#!/usr/bin/env bash
# Rebuilds src/fonts/*.woff2 from the fonts the client itself bundles (core's assets/myriad/font), so the site's text and
# icons are the game's: Noto Sans (regular, semibold) for text, JetBrains Mono Nerd Font for digits, code and icons.
# Needs fonttools + brotli (pip install fonttools brotli) and a core checkout next to this one. Icons are the Nerd Font
# codepoints core and Essentials use, found in their Java sources.
set -euo pipefail
cd "$(dirname "$0")/.."
FONTS=../myriad/core/src/main/resources/assets/myriad/font
TEXT="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2190-2199,U+2212,U+2215,U+2318,U+2325,U+2387,U+238B,U+23CE,U+21E7,U+21E5,U+2423,U+25B2-25BC,U+2713,U+2715,U+FFFD"
ICONS=$(python3 -I - ../myriad/core/src/main/java ../myriad-essentials/src/main/java <<'PY'
import re, sys, pathlib
cps = set()
for root in sys.argv[1:]:
    for p in pathlib.Path(root).rglob("*.java"):
        s = p.read_text(errors="ignore")
        for c in re.findall(r"\\u([0-9a-fA-F]{4})", s):
            if 0xE000 <= int(c, 16) <= 0xF8FF: cps.add(int(c, 16))
        cps.update(ord(ch) for ch in s if 0xE000 <= ord(ch) <= 0xF8FF)
print(",".join("U+%04X" % c for c in sorted(cps)))
PY
)
sub() { pyftsubset "$1" --unicodes="$2" --flavor=woff2 --layout-features='kern,liga,calt,tnum' --output-file="$3"; }
sub "$FONTS/ui-regular.ttf" "$TEXT" src/fonts/ui-regular.woff2
sub "$FONTS/ui-semibold.ttf" "$TEXT" src/fonts/ui-semibold.woff2
sub "$FONTS/mono.ttf" "$TEXT,$ICONS" src/fonts/mono.woff2
ls -l src/fonts
# The fonts' licences travel with them (both SIL OFL 1.1).
cp ../myriad/core/src/main/resources/META-INF/licenses/{NotoSans-OFL.txt,JetBrainsMonoNerdFont-OFL.txt} public/licenses/
