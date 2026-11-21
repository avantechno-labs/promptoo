"""Puts the shared header and footer into every page, so they stay identical everywhere.
   Run:  python tools/stamp.py
   Each page marks the spot with   <!--footer:start--> ... <!--footer:end-->   (and header:start / header:end).
   Edit partials/header.html or partials/footer.html, run this, commit. Pages that have no markers are left alone."""
import io, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "app.html", "terms.html", "privacy.html", "contact.html", "camera-movements.html", "camera-angles-and-shots.html", "404.html"]
def read(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f: return f.read()
def write(p, t):
    with io.open(os.path.join(ROOT, p), "w", encoding="utf-8", newline="\n") as f: f.write(t)
parts = {"header": read("partials/header.html").strip(), "footer": read("partials/footer.html").strip()}
changed = 0
for page in PAGES:
    if not os.path.exists(os.path.join(ROOT, page)): continue
    t = read(page); o = t
    for k, html in parts.items():
        pat = re.compile(r"<!--%s:start-->.*?<!--%s:end-->" % (k, k), re.S)
        if pat.search(t): t = pat.sub(lambda m: "<!--%s:start-->\n%s\n<!--%s:end-->" % (k, html, k), t)
    if t != o: write(page, t); changed += 1; print("stamped", page)
print("done,", changed, "page(s) changed")
