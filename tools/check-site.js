/* Checks the site pages: links and anchors resolve, SEO basics are present, JSON-LD parses. Run: node tools/check-site.js */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PAGES = ["index.html", "app.html", "terms.html", "privacy.html", "contact.html", "camera-movements.html", "camera-angles-and-shots.html", "prompt-examples.html", "404.html"];
let bad = 0; const fail = (p, m) => { bad++; console.log("FAIL", p, "-", m); }; const ok = (p, m) => console.log("PASS", p, "-", m);
const html = {}; PAGES.forEach(p => html[p] = fs.readFileSync(path.join(ROOT, p), "utf8"));
const ids = p => new Set([...html[p].matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
PAGES.forEach(p => {
  const t = html[p], isDoc = p !== "404.html";
  const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  if (!title) fail(p, "no title"); else if (title.length > 70) fail(p, "title too long (" + title.length + ")");
  const desc = (t.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (isDoc) { if (!desc) fail(p, "no meta description"); else if (desc.length < 70 || desc.length > 170) fail(p, "description length " + desc.length); }
  if (isDoc && !/<link rel="canonical" href="https:\/\/promptoo\.avanlabs\.com\//.test(t)) fail(p, "no canonical");
  if (p !== "app.html") { const h1 = (t.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) fail(p, "h1 count " + h1); }
  if (p !== "404.html" && !/<footer class="site-footer"/.test(t)) fail(p, "footer missing");
  if (!["app.html", "404.html"].includes(p) && !/<header class="site-head"/.test(t)) fail(p, "header missing");
  [...t.matchAll(/<img\b[^>]*>/g)].forEach(m => { if (!/\salt="/.test(m[0])) fail(p, "img without alt: " + m[0].slice(0, 60)); });
  [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].forEach(m => { try { JSON.parse(m[1]); } catch (e) { fail(p, "bad JSON-LD: " + e.message); } });
  // links
  [...t.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]).forEach(u => {
    if (/^(https?:|mailto:|data:|#$)/.test(u) || u.startsWith("//") || u.includes("${")) return;
    const [file, hash] = u.split("#"); const target = file === "" ? p : file.replace(/^\//, "");
    if (!fs.existsSync(path.join(ROOT, target))) { fail(p, "missing file " + u); return; }
    if (hash && !/^ex=/.test(hash) && PAGES.includes(target) && !ids(target).has(hash)) fail(p, "missing anchor " + u);
  });
});
// sitemap and robots
const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
[...sm.matchAll(/<loc>https:\/\/promptoo\.avanlabs\.com\/([^<]*)<\/loc>/g)].forEach(m => { const f = m[1] ? (/\.\w+$/.test(m[1]) ? m[1] : m[1] + ".html") : "index.html"; if (!fs.existsSync(path.join(ROOT, f))) fail("sitemap.xml", "missing " + f); });
["index.html", "app.html", "camera-movements.html", "camera-angles-and-shots.html", "prompt-examples.html", "contact.html", "terms.html", "privacy.html"].forEach(f => { if (!sm.includes("/" + (f === "index.html" ? "" : f.replace(/\.html$/, "")) + "<")) fail("sitemap.xml", "not listed: " + f); });
if (!/Sitemap: https:\/\/promptoo\.avanlabs\.com\/sitemap\.xml/.test(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8"))) fail("robots.txt", "no sitemap line");
["img/og.png", "img/hero-app.webp", "img/styles.webp", "img/locations.webp", "img/logo.png", "img/favicon.png"].forEach(f => { if (!fs.existsSync(path.join(ROOT, f))) fail(f, "missing"); });
// the legal notice is in the export, the footer carries the copyright
if (!/Created on Promptoo by Avan Labs/.test(html["app.html"])) fail("app.html", "export notice missing");
if (!/Created on Promptoo by Avan Labs/.test(fs.readFileSync(path.join(ROOT, "partials/footer.html"), "utf8"))) fail("footer", "copyright line missing");
// example deep links resolve to a real example
try { const { EXAMPLES } = require(path.join(ROOT, "examples.js")); [...html["prompt-examples.html"].matchAll(/app\.html#ex=([A-Za-z0-9_-]+)/g)].forEach(m => { if (!EXAMPLES.some(e => e.id === m[1])) fail("prompt-examples.html", "unknown example " + m[1]); }); if (!EXAMPLES.every(e => html["prompt-examples.html"].includes('id="' + e.id + '"'))) fail("prompt-examples.html", "page is out of date: run tools/build-examples.js"); } catch (e) { fail("examples.js", e.message); }
console.log(bad ? "\n" + bad + " problem(s)" : "\nAll site checks passed (" + PAGES.length + " pages)"); process.exit(bad ? 1 : 0);
