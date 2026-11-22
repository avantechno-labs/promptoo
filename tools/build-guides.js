/* Builds the two reference guides (camera movements, camera angles and shots) from the app's own data,
   so the guides never drift from the tool. Run:  node tools/build-guides.js   then   python tools/stamp.py */
const fs = require("fs"), path = require("path");
global.window = global; global.document = { createElement: () => ({}), head: { appendChild() {} } };
const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "camera.js")); const CAM = global.CAM;
const app = fs.readFileSync(path.join(ROOT, "app.html"), "utf8");
const grab = name => { const i = app.indexOf("const " + name + "="); const s = app.indexOf("{", i), e = app.indexOf("};", s); return new Function("return " + app.slice(s, e + 1))(); };
const MOVEP = grab("MOVEP"), SHOTW = grab("SHOTW");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cap = s => s[0].toUpperCase() + s.slice(1);
const BASE = "https://promptoo.avanlabs.com/";

function head({ file, title, desc, h1, ld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Avan Labs">
<meta name="theme-color" content="#0d1113">
<link rel="canonical" href="${BASE}${file.replace(/\.html$/, "")}">
<link rel="icon" type="image/png" href="img/favicon.png">
<meta property="og:type" content="article"><meta property="og:site_name" content="Promptoo"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${file.replace(/\.html$/, "")}"><meta property="og:image" content="${BASE}img/og.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${BASE}img/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="site.css"><link rel="stylesheet" href="footer.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body>
<!--header:start-->
<!--header:end-->
`;
}
const tail = `<!--footer:start-->
<!--footer:end-->
</body>
</html>
`;
const cta = (txt) => `<section class="band"><div class="wrap"><h2>${txt}</h2><p>Open Promptoo, pick the option, and see it in the live 3D preview before you copy the prompt. Free, no signup.</p><a class="btn pri big" href="app.html">Try it in Promptoo</a></div></section>`;
const article = (file, title, desc) => ({ "@context": "https://schema.org", "@graph": [
  { "@type": "Article", "headline": title, "description": desc, "datePublished": "2026-11-21", "dateModified": "2026-11-21", "author": { "@type": "Organization", "name": "Avan Labs", "url": "https://avanlabs.com" }, "publisher": { "@type": "Organization", "name": "Avan Labs", "url": "https://avanlabs.com" }, "mainEntityOfPage": BASE + file, "image": BASE + "img/og.png" },
  { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Promptoo", "item": BASE }, { "@type": "ListItem", "position": 2, "name": title, "item": BASE + file.replace(/\.html$/, "") }] }] });

/* ---------- camera movements ---------- */
(function () {
  const file = "camera-movements.html", title = "AI Video Camera Movements: 45 Moves and How to Prompt Them";
  const desc = "A guide to 45 camera movements for AI video prompts: pan, tilt, zoom, dolly, truck, orbit, crane, drone and more. What each does, when to use it and how to word it.";
  const fams = CAM.MOVE_FAMS.filter(f => f[0] !== "pop");
  let body = "";
  fams.forEach(([id, label]) => {
    const items = CAM.MOVES.filter(m => m.fam === id); if (!items.length) return;
    body += `<div class="fam" id="${id}"><h2>${esc(label)} <span class="meta">(${items.length})</span></h2><div class="items">` + items.map(m => {
      const w = m.w || MOVEP[m.n]; return `<div class="item"><h3>${esc(cap(m.n))}</h3><p class="tip">${esc(m.tip)}.</p>${w ? `<p class="w">Prompt wording: <code>The camera ${esc(w)}</code></p>` : ""}</div>`; }).join("") + `</div></div>`;
  });
  const html = head({ file, title, desc, ld: article(file, title, desc) }) + `<main class="doc"><div class="wrap">
<p class="crumbs"><a href="index.html">Promptoo</a> / Camera movements guide</p>
<h1>${esc(title)}</h1>
<p class="lead">AI video models respond to camera language. This guide lists the ${CAM.MOVES.length} camera movements in Promptoo, what each one does, when to use it and how to word it so the model understands. Every move can be tried in the live 3D preview.</p>
<div class="note"><strong>Quick answer:</strong> describe what the camera physically does, what stays fixed, and where it ends. Use one main move per scene. Say "no lens zoom" if you mean a dolly, and "locked-off, zero camera movement" if you want a still camera.</div>
<h2>How to write a camera move in an AI video prompt</h2>
<ul>
<li><strong>Be physical.</strong> "Camera pushes slowly forward toward her face" works better than "dynamic camera".</li>
<li><strong>One main move.</strong> Add a second only if the two form one clear, physical shot. Stacked, unrelated moves give conflicting instructions.</li>
<li><strong>Dolly is not zoom.</strong> A dolly moves the camera through the scene. A zoom changes only the lens. Name the one you want.</li>
<li><strong>Combine with a shot size and an angle.</strong> For example "low-angle medium shot with a slow push-in".</li>
<li><strong>Let the subject move when the camera is still.</strong> If the camera is locked off, the subject carries the motion.</li>
</ul>
${body}
<h2>Related guide</h2>
<p><a href="camera-angles-and-shots.html">Camera angles and shot sizes for AI video and image prompts</a></p>
</div></main>
${cta("Try these camera moves in 3D")}
` + tail;
  fs.writeFileSync(path.join(ROOT, file), html, "utf8"); console.log("wrote", file, CAM.MOVES.length, "moves");
})();

/* ---------- angles and shots ---------- */
(function () {
  const file = "camera-angles-and-shots.html", title = "Camera Angles and Shot Sizes for AI Video and Image Prompts";
  const desc = "Shot sizes from extreme wide to insert, and 21 camera angles from eye level to worm's-eye. What each means, when to use it and how to word it in an AI prompt.";
  const sizeItems = CAM.SIZES.map(s => { const w = (SHOTW[s.n] || s.w || "").replace(/[:.]$/, ""); return `<div class="item"><h3>${esc(cap(s.n))}</h3><p class="tip">${esc(s.tip)}.</p>${w ? `<p class="w">Prompt wording: <code>${esc(w)}</code></p>` : ""}</div>`; }).join("");
  const famsA = CAM.ANGLE_FAMS.filter(f => f[0] !== "pop");
  const angleBody = famsA.map(([id, label]) => { const items = CAM.ANGLES.filter(a => a.fam === id); return `<div class="fam" id="angle-${id}"><h2>${esc(label)} <span class="meta">(${items.length})</span></h2><div class="items">` + items.map(a => `<div class="item"><h3>${esc(cap(a.n))}</h3><p class="tip">${esc(a.tip)}.</p><p class="w">Prompt wording: <code>${esc(cap(CAM.ANGW[a.n]))}</code></p></div>`).join("") + `</div></div>`; }).join("");
  const html = head({ file, title, desc, ld: article(file, title, desc) }) + `<main class="doc"><div class="wrap">
<p class="crumbs"><a href="index.html">Promptoo</a> / Camera angles and shots guide</p>
<h1>${esc(title)}</h1>
<p class="lead">Shot size is how much of the subject fills the frame. Camera angle is where the camera sits relative to the subject. Together with a camera move they describe a shot. This guide covers the ${CAM.SIZES.length} shot sizes and ${CAM.ANGLES.length} angles in Promptoo. They work for AI video and for still images.</p>
<div class="note"><strong>Quick answer:</strong> pick a shot size first (how big the subject is), then an angle (where the camera is), then optionally a move. Describe the angle geometrically, for example "camera below the subject's eyeline, pointing upward".</div>
<div class="fam" id="sizes"><h2>Shot sizes <span class="meta">(${CAM.SIZES.length})</span></h2><div class="items">${sizeItems}</div></div>
${angleBody}
<h2>Related guide</h2>
<p><a href="camera-movements.html">AI video camera movements: ${CAM.MOVES.length} moves and how to prompt them</a></p>
</div></main>
${cta("Try these shots and angles in 3D")}
` + tail;
  fs.writeFileSync(path.join(ROOT, file), html, "utf8"); console.log("wrote", file, CAM.SIZES.length, "sizes", CAM.ANGLES.length, "angles");
})();
