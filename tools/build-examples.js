/* Builds prompt-examples.html from examples.js. Each prompt is produced by the app's own prompt writer (so the page and the tool never
   disagree) and each example is checked: no checker warnings, within the pick budget, every option exists.
   Needs jsdom (npm i jsdom somewhere on the module path).   Run:  node tools/build-examples.js   then   python tools/stamp.py */
const fs = require("fs"), path = require("path");
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require("jsdom")); } catch (e) { console.error("This script needs jsdom:  npm i jsdom"); process.exit(1); }
const ROOT = path.join(__dirname, "..");
const { EXAMPLES, CATS } = require(path.join(ROOT, "examples.js"));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BASE = "https://promptoo.avanlabs.com/", FILE = "prompt-examples";
const DATE = "2026-11-22";

(async () => {
  const dom = await JSDOM.fromFile(path.join(ROOT, "app.html"), { runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: new VirtualConsole(), url: "file://" + path.join(ROOT, "app.html").replace(/\\/g, "/") });
  const w = dom.window; await new Promise(r => setTimeout(r, 1500));
  w.__EX = EXAMPLES;
  const out = w.eval(`(function(){
    S.wording="lines";S.fantasy=false;S.budget=8;
    return __EX.map(function(e){
      var s=Object.assign(blank(),{subject:e.subject,action:e.action,setting:e.setting,dur:e.dur,sel:JSON.parse(JSON.stringify(e.sel))});
      var bad=[];Object.keys(e.sel).forEach(function(k){if(!G[k])bad.push("unknown group "+k);else e.sel[k].forEach(function(v){if(G[k].opts.indexOf(v)<0)bad.push(k+": "+v)})});
      var iss=check(s).filter(function(i){return i.l!=="t"}).map(function(i){return i.l+": "+i.msg});
      var picks=Object.keys(e.sel).reduce(function(a,k){return a+e.sel[k].length},0);
      var chips=[];Object.keys(e.sel).forEach(function(k){e.sel[k].forEach(function(v){chips.push([G[k].label,v])})});
      return {id:e.id,text:text(s,0),bad:bad,issues:iss,picks:picks,chips:chips,single:Object.keys(e.sel).filter(function(k){return G[k]&&G[k].single&&e.sel[k].length>1})};
    });})()`);
  let fail = 0;
  out.forEach(o => { const p = []; if (o.bad.length) p.push("bad options " + o.bad.join(", ")); if (o.issues.length) p.push("checker: " + o.issues.join(" | ")); if (o.picks > 8) p.push(o.picks + " picks (max 8)"); if (o.single.length) p.push("several picks in a single-choice group " + o.single.join(", "));
    if (p.length) { fail++; console.log("FAIL " + o.id + ": " + p.join("; ")); } });
  const ids = new Set(); EXAMPLES.forEach(e => { if (ids.has(e.id)) { fail++; console.log("FAIL duplicate id " + e.id); } ids.add(e.id); });
  if (fail) { console.log(fail + " problem(s). Page not written."); process.exit(1); }

  const by = Object.fromEntries(out.map(o => [o.id, o]));
  const title = "AI Video and Image Prompt Examples You Can Copy (Veo, Sora, Kling)";
  const desc = "Copy-ready AI video and image prompt examples for Veo, Sora, Kling, Runway and Midjourney: cinematic, product, nature, anime and horror. Open any in free Promptoo.";
  const faq = [
    ["What makes a good AI video prompt?", "One clear subject, one main action, a place, a shot size, one camera move, a light source and a style. Each example on this page follows that pattern, and avoids text, logos and several actions at once, which models handle badly."],
    ["Do these prompts work in Veo, Sora, Kling, Runway, Luma and Pika?", "They are written in plain, physical language that these text-to-video tools generally understand, so they are a good starting point in any of them. Results differ between models and from run to run, so treat each as a base to adjust. Promptoo is not affiliated with these tools."],
    ["Can I use these as AI image prompts for Midjourney or Stable Diffusion?", "Yes. The image examples have no camera movement because a still has none. For video examples, drop the motion lines and keep the subject, setting, shot, lens, light and style."],
    ["How long should an AI video prompt be?", "Usually 40 to 120 words is enough. Longer prompts tend to add instructions the model drops. Keep the details that change the picture and cut the rest."],
    ["Why do the examples avoid text and logos?", "AI video and image models usually draw letters wrongly. Add text later in an editor. The examples also keep to one subject and one action, which is the most reliable way to get a clean result."],
    ["Can I use these prompts commercially?", "The prompts are free to copy and adapt. What you may do with the generated video or image depends on the terms of the tool you use. Promptoo itself is free for personal use, and commercial use of the Promptoo tool needs permission from Avan Labs."]
  ];
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", "headline": title, "description": desc, "datePublished": DATE, "dateModified": DATE, "author": { "@type": "Organization", "name": "Avan Labs", "url": "https://avanlabs.com" }, "publisher": { "@type": "Organization", "name": "Avan Labs", "url": "https://avanlabs.com" }, "mainEntityOfPage": BASE + FILE, "image": BASE + "img/og.png" },
    { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Promptoo", "item": BASE }, { "@type": "ListItem", "position": 2, "name": "Prompt examples", "item": BASE + FILE }] },
    { "@type": "ItemList", "name": "AI video and image prompt examples", "numberOfItems": EXAMPLES.length, "itemListElement": EXAMPLES.map((e, i) => ({ "@type": "ListItem", "position": i + 1, "name": e.title, "url": BASE + FILE + "#" + e.id })) },
    { "@type": "FAQPage", "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } })) }] };

  const card = e => { const o = by[e.id]; return `<article class="ex" id="${e.id}">
<div class="ex-top"><span class="tag ${e.type}">${e.type === "image" ? "Image" : "Video"}</span><span class="meta">${e.dur && e.type === "video" ? e.dur + " seconds" : ""}</span></div>
<h3>${esc(e.title)}</h3>
<p class="why">${esc(e.why)}</p>
<pre class="prompt" id="p-${e.id}">${esc(o.text)}</pre>
<p class="picks">${o.chips.map(([g, v]) => `<span class="chip"><i>${esc(g)}</i> ${esc(v)}</span>`).join("")}</p>
<div class="ex-actions"><button class="btn" type="button" data-copy="p-${e.id}">Copy prompt</button><a class="btn pri" href="app.html#ex=${e.id}">Open in Promptoo</a></div>
</article>`; };
  const sections = CATS.map(c => { const list = EXAMPLES.filter(e => e.cat === c.id); if (!list.length) return ""; return `<section class="exsec" id="${c.id}"><h2>${esc(c.h2)}</h2><p class="lead">${esc(c.intro)}</p><div class="exgrid">${list.map(card).join("\n")}</div></section>`; }).join("\n");
  const toc = CATS.filter(c => EXAMPLES.some(e => e.cat === c.id)).map(c => `<li><a href="#${c.id}">${esc(c.label)}</a> <span class="meta">(${EXAMPLES.filter(e => e.cat === c.id).length})</span></li>`).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Avan Labs">
<meta name="theme-color" content="#0d1113">
<link rel="canonical" href="${BASE}${FILE}">
<link rel="icon" type="image/png" href="img/favicon.png">
<meta property="og:type" content="article"><meta property="og:site_name" content="Promptoo"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${FILE}"><meta property="og:image" content="${BASE}img/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
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
<main class="doc"><div class="wrap">
<p class="crumbs"><a href="index.html">Promptoo</a> / Prompt examples</p>
<h1>AI Video and Image Prompt Examples You Can Copy</h1>
<p class="lead">${EXAMPLES.length} ready-to-use prompts for Veo, Sora, Kling, Runway, Luma, Pika and image tools such as Midjourney. Copy one as it is, or open it in the free Promptoo builder to change the camera, light or style and see it in a live 3D preview.</p>
<div class="note"><strong>Quick answer:</strong> a good AI video prompt names one subject, one action, the place, the shot size, one camera move, the light and the style. Nothing more. Every example below follows that and passes Promptoo's prompt checker with no warnings.</div>
<h2>Jump to a type of prompt</h2>
<ul class="toc">${toc}</ul>
<h2>How these prompts are built</h2>
<ul>
<li><strong>One subject, one action.</strong> Short clips cannot hold several actions. If you need more, make a second scene.</li>
<li><strong>One camera move, named physically.</strong> "Slow push-in" or "drone fly-over", not "dynamic camera". See the <a href="camera-movements.html">camera movements guide</a>.</li>
<li><strong>Shot size and angle first.</strong> They decide the framing. See <a href="camera-angles-and-shots.html">camera angles and shot sizes</a>.</li>
<li><strong>Light and style set the look.</strong> One light source and one style beat a long list of adjectives.</li>
<li><strong>No text, no logos, no brand names.</strong> Models draw letters badly. Add them in editing.</li>
</ul>
<p class="meta">Each prompt below is written by the Promptoo tool from the options listed under it, so what you copy here is exactly what the builder produces. Prompts are a starting point: models vary, and the same prompt can give different results on each run.</p>
${sections}
<h2>How to adapt any example</h2>
<ol>
<li>Click <strong>Open in Promptoo</strong>. The example becomes a new scene with its options already picked.</li>
<li>Change the <strong>subject</strong> and <strong>setting</strong> to your own idea. Keep the camera and light.</li>
<li>Swap one option at a time, such as the camera move or the style, and watch the 3D preview.</li>
<li>Fix anything the checker flags, then copy the prompt into your video or image tool.</li>
</ol>
<h2>AI video prompt examples: frequently asked questions</h2>
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
<h2>Related guides</h2>
<p><a href="camera-movements.html">AI video camera movements: 45 moves and how to prompt them</a> · <a href="camera-angles-and-shots.html">Camera angles and shot sizes for AI prompts</a></p>
</div></main>
<section class="band"><div class="wrap"><h2>Make your own prompt in minutes</h2><p>Pick the shot, camera move, light and style, see it in 3D, and copy the prompt. Free, no signup.</p><a class="btn pri big" href="app.html">Try it in Promptoo</a></div></section>
<script>
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-copy]"); if (!b) return;
  var el = document.getElementById(b.getAttribute("data-copy")); if (!el) return; var t = el.textContent, old = b.textContent;
  function done(ok) { b.textContent = ok ? "Copied" : "Press Ctrl+C"; setTimeout(function () { b.textContent = old; }, 1500); }
  function fallback() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); var ok = false; try { ok = document.execCommand("copy"); } catch (x) {} done(ok); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, fallback); else fallback();
});
</script>
<!--footer:start-->
<!--footer:end-->
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, FILE + ".html"), html);
  console.log("wrote " + FILE + ".html with " + EXAMPLES.length + " examples");
  process.exit(0);
})();
