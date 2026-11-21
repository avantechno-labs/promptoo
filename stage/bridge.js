/* Promptoo: connects the 3D stage to the app. Loaded after the main script, so it can use the app's own functions
   (S, sc, mustSel, charOf, pick, render, G, CAM ...). If WebGL or the library files are missing the app keeps its drawing preview. */
(function (root) {
  "use strict";
  const ST = root.Stage3D; if (!ST || !ST.available) { root.Stage3DUI = { available: false }; return; }
  const $ = id => document.getElementById(id);
  const store = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  const UI = root.Stage3DUI = { available: ST.canWebGL(), mode: store.get("promptoo.prev3d") === "0" ? "2d" : "3d", thumbsOn: store.get("promptoo.t3d") === "1", stage: null, big: false };

  /* ---------- make new registered effects show up in the app (tabs, tooltips, wording) ---------- */
  ST.hooks.addOption = e => {
    const g = G[e.group]; if (!g) return; const n = e.name, u = e.ui || {};
    if (!g.opts.includes(n)) g.opts.push(n);
    if (u.tip) CAM.TIPS[n] = u.tip;
    if (e.group === "move") { MOVE[n] = MOVE[n] || ["", "✦"]; if (u.w) MOVEP[n] = u.w; CAM.famOf[n] = u.fam || "spec"; CAM.pop[n] = u.pop ? 1 : 0; CAM.MOVE_NAMES.includes(n) || CAM.MOVE_NAMES.push(n); }
    if (e.group === "angle") { SHOT[n] = SHOT[n] || {}; if (u.w) CAM.ANGW[n] = u.w; CAM.famOf[n] = u.fam || "side"; CAM.ANGLE_SET.add(n); }
    if (e.group === "shot") { SHOT[n] = SHOT[n] || {}; if (u.w) SHOTW[n] = u.w; }
    if (e.group === "light") LIGHT[n] = LIGHT[n] || { sky: ["#10131c", "#1c2030"], ground: "#0a0c12", hills: "#10131c" };
    if (e.group === "style" && window.STYLE_LIB && !STYLE_LIB.find(n)) STYLE_LIB.add(n, "mine", u.w || "", "none");
    if (e.group === "style") G.style.opts = STYLE_LIB.all();
  };
  const FXKEY = "promptoo.fx.v1";
  UI.packs = () => { try { return JSON.parse(store.get(FXKEY) || "[]") } catch (e) { return [] } };
  UI.addPack = spec => { const specs = Array.isArray(spec) ? spec : [spec]; specs.forEach(s => ST.fromJSON(s)); const all = UI.packs().filter(p => !specs.some(s => s.name === p.name)).concat(specs); store.set(FXKEY, JSON.stringify(all)); };
  UI.removePack = name => { store.set(FXKEY, JSON.stringify(UI.packs().filter(p => p.name !== name))); };
  UI.packs().forEach(p => { try { ST.fromJSON(p) } catch (e) { console.warn("pack", p.name, e.message) } });

  if (!UI.available) return;   // no WebGL: the options and custom effects above still work, the preview stays the flat drawing

  /* ---------- scene -> stage input ---------- */
  function customLook(n) { const c = root.STYLE_LIB && STYLE_LIB.custom().find(x => x.n === n); return c ? c.look : null; }
  function buildInput(s) {
    const o = mustSel(s), sel = {};
    Object.keys(o).forEach(k => { sel[k] = (o[k] || []).map(n => { if (k === "style" && !ST.has("style", n)) { const lk = customLook(n); return lk ? "look:" + lk : n; } return n; }); });
    const c = charOf(s);
    return { sel, scene: { subject: s.subject || "", action: s.action || "", setting: s.setting || "" }, char: c ? { name: c.name, attrs: c.attrs || {} } : null, dur: Math.max(2, Math.min(12, +s.dur || 5)), ref: c && c.refImg ? c.refImg : null };
  }
  UI.coverage = function (s) { const o = mustSel(s || sc()), miss = []; Object.keys(o).forEach(k => (o[k] || []).forEach(n => { if (!ST.has(k, n) && !(k === "style" && customLook(n))) miss.push(G[k] ? G[k].label + ": " + n : k + ": " + n); })); return miss; };

  /* ---------- mount the preview into the banner ---------- */
  const stageBox = document.querySelector(".pv-stage"), livePrev = $("livePrev");
  const wrap = document.createElement("div"); wrap.id = "stage3d"; wrap.className = "pv-3d"; wrap.innerHTML = '<canvas class="c3"></canvas><canvas class="ov3"></canvas>';
  stageBox.appendChild(wrap);
  const tools = document.createElement("div"); tools.className = "pv-tools"; tools.innerHTML =
    '<button id="t3Mode" title="Switch between the 3D preview and the flat drawing">3D</button><button id="t3Play" title="Pause or play">Pause</button><button id="t3Big" title="Large view with the set diagram">Large</button><button id="t3Still" title="Save a still image">Still</button><button id="t3Clip" title="Record a short preview clip">Clip</button><button id="t3Frames" title="Save the first and last frame (for start and end frame uploads)">Frames</button>';
  stageBox.parentNode.insertBefore(tools, stageBox.nextSibling);

  let lastKey = "", applyTimer = null, size = [0, 0];
  function ensureStage() { if (UI.stage) return UI.stage; const cv = wrap.querySelector(".c3"); UI.stage = new ST.Stage({ canvas: cv, width: 250, height: 140, pixelRatio: Math.min(root.devicePixelRatio || 1, 1.5) }); UI.stage.overlay = wrap.querySelector(".ov3"); return UI.stage; }
  function fit() {
    if (!UI.stage || UI.big) return; const [aw, ah] = String(S.aspect || "16:9").split(":").map(Number), r = (aw / ah) || 16 / 9;
    const cw = stageBox.clientWidth || 250, ch = stageBox.clientHeight || 140; let w = Math.min(cw, ch * r), h = w / r; w = Math.max(80, Math.floor(w)); h = Math.max(45, Math.floor(h));
    if (size[0] !== w || size[1] !== h) { size = [w, h]; UI.stage.setSize(w, h); }
  }
  function applyNow(s) {
    const st = ensureStage(); const inp = buildInput(s), key = JSON.stringify([inp.sel, inp.scene, inp.char, inp.dur, S.aspect]);
    fit(); if (key === lastKey) return; lastKey = key;
    const t0 = performance.now(); st.apply(inp); UI.applyMs = performance.now() - t0; UI.miss = UI.coverage(s); st.start(); refreshBig();
  }
  function update3d(s) { clearTimeout(applyTimer); applyTimer = setTimeout(() => { try { applyNow(s) } catch (e) { console.warn("3D preview failed", e); setMode("2d", true); } }, 90); }
  function setMode(m, silent) {
    UI.mode = m; if (!silent) store.set("promptoo.prev3d", m === "3d" ? "1" : "0");
    wrap.hidden = m !== "3d"; livePrev.hidden = m === "3d"; $("t3Mode").textContent = m === "3d" ? "3D" : "Draw"; $("t3Play").disabled = m !== "3d"; ["t3Big", "t3Still", "t3Clip", "t3Frames"].forEach(i => $(i).disabled = m !== "3d");
    if (m === "3d") { lastKey = ""; update3d(sc()); } else if (UI.stage) UI.stage.stop();
  }
  const baseRP = root.renderPreview;
  root.renderPreview = function (s) { baseRP(s); if (UI.mode === "3d") update3d(s); };
  $("t3Mode").onclick = () => setMode(UI.mode === "3d" ? "2d" : "3d");
  $("t3Play").onclick = () => { if (!UI.stage) return; const p = UI.stage.pause(); $("t3Play").textContent = p ? "Play" : "Pause"; };
  if (root.ResizeObserver) new ResizeObserver(() => { if (UI.stage && UI.mode === "3d") { size = [0, 0]; fit(); } }).observe(stageBox);

  /* ---------- exports ---------- */
  const dl = (name, url) => { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  const slug = () => ((sc().title || sc().subject || "scene").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene").slice(0, 30);
  UI.still = () => { const st = UI.stage; if (!st) return; const w = 1280, h = Math.round(w / (st.width / st.height)); dl("promptoo-" + slug() + ".png", st.snapshot(st.t, w, h)); toast("Still saved ✓"); };
  UI.frames = () => { const st = UI.stage; if (!st) return; const w = 1280, h = Math.round(w / (st.width / st.height)); dl("promptoo-" + slug() + "-start.png", st.snapshot(0, w, h)); setTimeout(() => dl("promptoo-" + slug() + "-end.png", st.snapshot(.999, w, h)), 250); toast("Start and end frames saved ✓"); };
  UI.clip = () => {
    const st = UI.stage; if (!st || !root.MediaRecorder) { toast("This browser cannot record clips"); return; }
    const was = [st.width, st.height], cv = st.canvas; st.setSize(960, Math.round(960 / (was[0] / was[1]))); st.seek(0); st.start();
    const stream = cv.captureStream(30), rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" }), chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); }; rec.onstop = () => { dl("promptoo-" + slug() + ".webm", URL.createObjectURL(new Blob(chunks, { type: "video/webm" }))); st.setSize(was[0], was[1]); toast("Clip saved ✓"); $("t3Clip").disabled = false; };
    $("t3Clip").disabled = true; toast("Recording " + Math.round(st.dur) + "s…"); st._acc = 0; rec.start(); setTimeout(() => rec.stop(), st.dur * 1000 / (st.ctx.timeScale || 1) + 200);
  };
  $("t3Still").onclick = UI.still; $("t3Frames").onclick = UI.frames; $("t3Clip").onclick = UI.clip;

  /* ---------- large view with the set diagram ---------- */
  const big = document.createElement("div"); big.id = "big3d"; big.hidden = true;
  big.innerHTML = '<div class="b3-card"><div class="b3-head"><b>3D preview</b><span class="hint" id="b3Info"></span><span style="flex:1"></span><button id="b3Play">Pause</button><button id="b3Still">Still</button><button id="b3Frames">Start/end frames</button><button id="b3Clip">Clip</button><button id="b3Close" class="pri">Close</button></div><div class="b3-body"><div class="b3-view" id="b3View"></div><div class="b3-side"><div class="hint" style="margin-bottom:4px">Set diagram (from above). Drag the camera to change shot size and side angle.</div><canvas id="b3Diag" width="300" height="300"></canvas><div id="b3Cov" class="hint" style="margin-top:8px"></div></div></div></div>';
  document.body.appendChild(big);
  function openBig() {
    const st = ensureStage(); UI.big = true; big.hidden = false; const view = $("b3View"); view.appendChild(wrap); wrap.classList.add("is-big");
    const [aw, ah] = String(S.aspect || "16:9").split(":").map(Number), r = (aw / ah) || 16 / 9; const maxW = Math.min(innerWidth * .62, 980), maxH = innerHeight * .68; let w = Math.min(maxW, maxH * r); st.setSize(Math.floor(w), Math.floor(w / r)); size = [0, 0]; refreshBig();
  }
  function closeBig() { UI.big = false; big.hidden = true; wrap.classList.remove("is-big"); stageBox.appendChild(wrap); size = [0, 0]; fit(); }
  function refreshBig() { if (big.hidden) return; const miss = UI.miss || []; $("b3Info").textContent = " " + (UI.stage ? UI.stage.active.length : 0) + " effects active · built in " + Math.round(UI.applyMs || 0) + " ms"; $("b3Cov").innerHTML = miss.length ? "No 3D effect yet for: " + miss.map(esc).join(", ") : "Every pick in this scene has a 3D effect."; }
  $("t3Big").onclick = openBig; $("b3Close").onclick = closeBig; big.addEventListener("mousedown", e => { if (e.target === big) closeBig(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !big.hidden) closeBig(); });
  $("b3Play").onclick = () => { const p = UI.stage.pause(); $("b3Play").textContent = p ? "Play" : "Pause"; }; $("b3Still").onclick = UI.still; $("b3Frames").onclick = UI.frames; $("b3Clip").onclick = UI.clip;

  const diag = $("b3Diag"), dg = diag.getContext("2d"); let drag = false, pendingPick = null;
  const SIZES = [["extreme wide shot", 16], ["wide establishing shot", 8], ["wide shot", 3.4], ["full shot", 1.35], ["medium wide shot", .78], ["medium shot", .52], ["medium close-up", .33], ["close-up", .21], ["extreme close-up", .075]];
  function drawDiagram() {
    const st = UI.stage; if (!st || !st.ctx || big.hidden) return; const ctx = st.ctx, W = diag.width, Hh = diag.height; dg.clearRect(0, 0, W, Hh);
    const cp = ctx.camPos, sub = ctx.subject ? ctx.subject.root.position : { x: 0, z: 0 }; const reach = Math.max(4, Math.hypot(cp.x - sub.x, cp.z - sub.z) * 1.25), sc2 = (W / 2 - 14) / reach;
    const X = x => W / 2 + (x - sub.x) * sc2, Z = z => Hh / 2 + (z - sub.z) * sc2;
    dg.fillStyle = "rgba(127,127,127,.1)"; dg.fillRect(0, 0, W, Hh); dg.strokeStyle = "rgba(127,127,127,.35)"; for (let i = 1; i < 4; i++) { dg.beginPath(); dg.arc(W / 2, Hh / 2, i * reach / 3 * sc2, 0, 6.3); dg.stroke(); }
    // lights
    ctx.root.children.forEach(o => { if (o.isPointLight) { dg.fillStyle = "#" + o.color.getHexString(); dg.beginPath(); dg.arc(X(o.position.x), Z(o.position.z), 4, 0, 6.3); dg.fill(); } if (o.isDirectionalLight && o !== ctx.sun) { dg.strokeStyle = "#" + o.color.getHexString(); dg.beginPath(); dg.moveTo(X(o.position.x), Z(o.position.z)); dg.lineTo(X(0), Z(0)); dg.stroke(); } });
    const sd = ctx.dirToSun; dg.strokeStyle = "#ffcf5a"; dg.lineWidth = 2; dg.beginPath(); dg.moveTo(W / 2, Hh / 2); dg.lineTo(W / 2 + sd.x * (W / 2 - 18) * Math.max(.2, Math.cos(Math.asin(Math.max(-1, Math.min(1, sd.y))))), Hh / 2 + sd.z * (W / 2 - 18) * Math.max(.2, Math.cos(Math.asin(Math.max(-1, Math.min(1, sd.y)))))); dg.stroke(); dg.fillStyle = "#ffcf5a"; dg.fillText("sun", W / 2 + sd.x * (W / 2 - 18) + 4, Hh / 2 + sd.z * (W / 2 - 18)); dg.lineWidth = 1;
    // subject
    dg.fillStyle = "#6fa8ff"; dg.beginPath(); dg.arc(X(sub.x), Z(sub.z), 7, 0, 6.3); dg.fill(); const ry = ctx.subject ? ctx.subject.root.rotation.y : 0; dg.strokeStyle = "#fff"; dg.beginPath(); dg.moveTo(X(sub.x), Z(sub.z)); dg.lineTo(X(sub.x) + Math.sin(ry) * 14, Z(sub.z) + Math.cos(ry) * 14); dg.stroke();
    // camera + view cone
    const cx = X(cp.x), cz = Z(cp.z), ang = Math.atan2(sub.x - cp.x, sub.z - cp.z), half = (st.camera.fov * Math.PI / 180) / 2 * st.camera.aspect;
    dg.fillStyle = "rgba(255,255,255,.12)"; dg.beginPath(); dg.moveTo(cx, cz); dg.lineTo(cx + Math.sin(ang - half) * 70, cz + Math.cos(ang - half) * 70); dg.lineTo(cx + Math.sin(ang + half) * 70, cz + Math.cos(ang + half) * 70); dg.closePath(); dg.fill();
    dg.fillStyle = drag ? "#ffb04a" : "#ffffff"; dg.fillRect(cx - 6, cz - 6, 12, 12); ctx._diag = { X, Z, sc2, sub, cx, cz };
  }
  function diagPos(e) { const r = diag.getBoundingClientRect(); return [(e.clientX - r.left) * diag.width / r.width, (e.clientY - r.top) * diag.height / r.height]; }
  diag.addEventListener("pointerdown", e => { const st = UI.stage; if (!st || !st.ctx || !st.ctx._diag) return; const [x, y] = diagPos(e), d = st.ctx._diag; if (Math.hypot(x - d.cx, y - d.cz) < 16) { drag = true; diag.setPointerCapture(e.pointerId); } });
  diag.addEventListener("pointermove", e => { if (!drag) return; const st = UI.stage, d = st.ctx._diag, [x, y] = diagPos(e); const dx = (x - diag.width / 2) / d.sc2, dz = (y - diag.height / 2) / d.sc2; const yaw = Math.atan2(dx, dz) * 180 / Math.PI, dist = Math.max(.4, Math.hypot(dx, dz));
    const fov = st.ctx.rig0.fov0, fh = dist * 2 * Math.tan(fov * Math.PI / 360) / st.ctx.H; const base = st.ctx.rig0; base.yaw = yaw - (st.ctx.lastRig ? 0 : 0); base.frameH = fh; pendingPick = { yaw, frameH: fh }; });
  diag.addEventListener("pointerup", () => { if (!drag) return; drag = false; const p = pendingPick; pendingPick = null; if (!p) return; const s = sc(); s.sel.shot = [SIZES.reduce((a, b) => Math.abs(Math.log(b[1] / p.frameH)) < Math.abs(Math.log(a[1] / p.frameH)) ? b : a)[0]];
    const ay = Math.abs(((p.yaw + 180) % 360 + 360) % 360 - 180); const side = ay < 15 ? null : ay < 62 ? "three-quarter angle" : ay < 125 ? "profile angle" : "from-behind angle"; if (side) s.sel.angle = [side]; else if ((s.sel.angle || []).some(a => ["three-quarter angle", "profile angle", "from-behind angle"].includes(a))) s.sel.angle = [];
    s.manual = null; lastKey = ""; render(); });
  ST.Stage.prototype._diagHook = null; setInterval(() => { if (!big.hidden) drawDiagram(); }, 60);

  /* ---------- 3D thumbnails for the option cards (optional) ---------- */
  const TB = {}; let thumbStage = null; const cache = new Map(), queue = []; let busy = false;
  const BASES = { move: { shot: ["full shot"] }, angle: { shot: ["medium shot"] }, shot: {}, lens: { shot: ["medium shot"], loc: ["countryside field"] }, style: { loc: ["countryside field"], time: ["golden hour sunset"], shot: ["full shot"] }, grade: { loc: ["countryside field"], time: ["morning"], shot: ["full shot"] }, mood: { loc: ["countryside field"], time: ["morning"], shot: ["full shot"] }, light: { shot: ["full shot"], loc: ["countryside field"] }, place: { shot: ["medium shot"] }, facing: { shot: ["full shot"] }, frame: { shot: ["full shot"] }, pace: {}, trans: {} };
  const T_AT = { move: .85, trans: .08, pace: .5 };
  function thumbRender(k, o) {
    thumbStage = thumbStage || new ST.Stage({ canvas: document.createElement("canvas"), width: 192, height: 108, pixelRatio: 1 });
    const sel = Object.assign({}, BASES[k] || {}); sel[k] = [o]; const inp = { sel, scene: { subject: "", action: "" }, char: null, dur: 5 };
    thumbStage.apply(inp); thumbStage.renderAt(T_AT[k] != null ? T_AT[k] : .5, .016); thumbStage.renderAt(T_AT[k] != null ? T_AT[k] : .5, .016); return thumbStage.canvas.toDataURL("image/jpeg", .8);
  }
  function pump() { if (busy || !queue.length) return; busy = true; setTimeout(() => { const [k, o] = queue.shift(), key = k + "|" + o; try { if (!cache.has(key) && ST.has(k, o)) cache.set(key, thumbRender(k, o)); } catch (e) { cache.set(key, null); }
    const url = cache.get(key); if (url) document.querySelectorAll('.opt[data-k="' + k + '"]').forEach(n => { if (n.dataset.o === o) { const th = n.querySelector(".th"); if (th) th.innerHTML = '<img class="t3img" alt="" src="' + url + '">'; } });
    busy = false; pump(); }, 16); }
  UI.thumbHTML = (k, o) => { const key = k + "|" + o; if (cache.has(key)) { const u = cache.get(key); return u ? '<div class="th"><img class="t3img" alt="" src="' + u + '"></div>' : null; } if (ST.has(k, o) && !queue.some(q => q[0] === k && q[1] === o)) { queue.push([k, o]); pump(); } return null; };
  UI.setThumbs = on => { UI.thumbsOn = !!on; store.set("promptoo.t3d", on ? "1" : "0"); render(); };

  /* ---------- project settings: switch + custom effect packs ---------- */
  const proj = $("projPanel");
  if (proj) {
    const box = document.createElement("div"); box.className = "f"; box.innerHTML =
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--txt)"><input type="checkbox" id="t3Thumbs" style="width:auto;margin:0"> <span>3D option thumbnails <span class="hint">· slower, drawn by the 3D engine</span></span></label>' +
      '<details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Custom effects (JSON)</summary><div class="hint" style="margin:6px 0">Add your own move, light, particles or look. See effects/README.md for the format. Saved in this browser.</div>' +
      '<textarea id="fxJson" rows="6" placeholder=\'{"type":"move","name":"my slide","keys":[{"t":0,"truck":.6},{"t":1,"truck":-.6}]}\'></textarea><div class="bar"><button id="fxAdd" class="ghost">Add effect</button></div><div id="fxList" class="hint"></div></details>';
    proj.appendChild(box); $("t3Thumbs").checked = UI.thumbsOn; $("t3Thumbs").onchange = e => UI.setThumbs(e.target.checked);
    const list = () => { const p = UI.packs(); $("fxList").innerHTML = p.length ? p.map(x => esc(x.type + ": " + x.name) + ' <a href="#" data-fxdel="' + esc(x.name) + '">remove</a>').join("<br>") : ""; };
    $("fxAdd").onclick = () => { try { const spec = JSON.parse($("fxJson").value); UI.addPack(spec); $("fxJson").value = ""; list(); lastKey = ""; render(); toast("Effect added ✓"); } catch (e) { toast("Could not add: " + e.message); } };
    $("fxList").addEventListener("click", e => { const a = e.target.closest("[data-fxdel]"); if (!a) return; e.preventDefault(); UI.removePack(a.dataset.fxdel); list(); toast("Removed. Reload to clear it fully."); });
    list();
  }

  setMode(UI.mode, true); if (UI.mode === "3d") update3d(sc());
})(typeof window !== "undefined" ? window : globalThis);
