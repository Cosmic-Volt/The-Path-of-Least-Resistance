#!/usr/bin/env python3
"""Bundle KaTeX (JS + CSS + fonts) into one self-contained JS file."""
import base64, pathlib, re, json

HERE = pathlib.Path(__file__).parent
DIST = HERE.parent / "node_modules" / "katex" / "dist"

# Faces KaTeX actually reaches for in maths/science notation.
# Fraktur, Script, SansSerif and Typewriter are dropped — they only appear
# for \mathfrak, \mathscr, \textsf, \texttt, which this app never emits.
KEEP = ("KaTeX_Main", "KaTeX_Math", "KaTeX_Size1", "KaTeX_Size2",
        "KaTeX_Size3", "KaTeX_Size4", "KaTeX_AMS", "KaTeX_Caligraphic")

css = (DIST / "katex.min.css").read_text()

kept, dropped = [], []
for f in sorted((DIST / "fonts").glob("*.woff2")):
    (kept if f.name.startswith(KEEP) else dropped).append(f)

embedded = {}
for f in kept:
    embedded[f.name] = "data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode()

def swap(m):
    """Rewrite one src: url(...) list to the embedded woff2 only."""
    block = m.group(0)
    hit = re.search(r'fonts/([A-Za-z0-9_\-]+\.woff2)', block)
    if not hit or hit.group(1) not in embedded:
        return block
    return "src:url(%s) format('woff2')" % embedded[hit.group(1)]

css = re.sub(r"src:[^;}]*?fonts/[^;}]*", swap, css)
# any face whose files we dropped still points at fonts/… — neutralise it
css = re.sub(r"src:[^;}]*?fonts/[^;}]*", "src:local('serif')", css)

js  = (DIST / "katex.min.js").read_text()
ar  = (DIST / "contrib" / "auto-render.min.js").read_text()

out = HERE / "katex-bundle.js"
out.write_text(
  "/* KaTeX %s — bundled for offline use (MIT licence, © Khan Academy and\n"
  "   contributors, https://katex.org). JS, auto-render and the maths font\n"
  "   faces are embedded so formulas render with no network at all. */\n"
  "(function(){\n"
  "var s=document.createElement('style');\n"
  "s.textContent=%s;\n"
  "document.head.appendChild(s);\n"
  "})();\n%s\n%s\n"
  % (json.loads((DIST.parent / "package.json").read_text())["version"],
     json.dumps(css), js, ar)
)
print("fonts embedded:", len(kept), "| dropped:", ", ".join(f.name for f in dropped))
print("bundle:", round(out.stat().st_size / 1024), "KB")
