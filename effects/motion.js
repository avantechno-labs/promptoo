/* 3D effects: movement. The groups are act (character action), spd (speed), dirm (direction), micro (small details),
   bgm (background movement) and rel (camera vs subject). The option lists live in motion.js (the app side);
   here every option gets a behaviour. Character options only write intent into sub.mot; one interpreter, S.motion,
   turns that intent into poses and a path every frame, so several options combine (for example "walking" + "brisk" + "toward the camera").
   To add one: add a row to a list in motion.js, then register it here (a character option: set a flag in sub.mot and handle it in S.motion). */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available || !root.MOTION) return; const T = S.THREE; const { lerp, clamp } = S.util;
  const reg = S.registerMany, MO = root.MOTION;
  ["act", "spd", "dirm", "micro", "bgm", "rel"].forEach(g => { if (S.GROUP_ORDER.indexOf(g) < 0) S.GROUP_ORDER.push(g); });
  const sm = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const mot = sub => sub.mot || (sub.mot = { acts: new Set(), micro: new Set(), speed: 1, dir: null, rel: null, ph: 0 });
  const mk = (ctx, g, c, p, s, o, rot) => { const m = S.mesh(g, c, p, s, o); if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0); ctx.add(m); return m; };
  const rad = d => d * Math.PI / 180;

  /* ---------- the interpreter: intent -> poses and a path ---------- */
  S.motion = function (sub, t, dt, c) {
    const m = sub.mot; if (!m) return;
    const { body, head, legs, arms, root } = sub, torso = sub.parts && sub.parts.torso, A = m.acts, has = n => A.has(n), tt = c ? c.time : t * 5;
    body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); legs.forEach(l => l.rotation.set(0, 0, 0)); arms.forEach(a => a.rotation.set(0, 0, 0));
    head.rotation.set(rad(sub.lookPitch || 0), rad(sub.lookYaw || 0), 0); if (torso) torso.scale.y = 1;
    const still = has("standing still"), spd = m.speed || 1;
    const gait = still ? 0 : has("running") ? 2.1 : has("jogging") ? 1.5 : has("walking") ? 1 : has("stumbling") ? .8 : has("climbing") ? .6 : 0;
    const entering = m.rel === "subject enters the frame", leaving = m.rel === "subject leaves the frame";
    const travels = !still && (gait > 0 || m.dir || entering || leaving), g = (gait || 1) * spd;
    if (travels) {
      m.ph += dt * 5 * g * ((c && c.timeScale) || 1); const sw = Math.min(.95, .45 * g), p = m.ph;
      legs[0].rotation.x = Math.sin(p) * sw; legs[1].rotation.x = -Math.sin(p) * sw; arms[0].rotation.x = -Math.sin(p) * sw * .9; arms[1].rotation.x = Math.sin(p) * sw * .9;
      body.position.y = Math.abs(Math.sin(p)) * .02 * g; if (g >= 1.5) body.rotation.x = .1;
      const d = 2.3 * Math.min(g, 1.6), s = t * 2 - 1, h = sub.home; let x = 0, y = 0, z = 0, ry = null;
      const dir = m.dir || (gait || entering || leaving ? (m.dir === null ? "left to right" : m.dir) : null);
      if (dir === "toward the camera") { z = lerp(-3.2, 1.1, t); ry = 0; }
      else if (dir === "away from the camera") { z = lerp(1.1, -3.2, t); ry = Math.PI; }
      else if (dir === "left to right") { x = s * d; ry = Math.PI / 2; }
      else if (dir === "right to left") { x = -s * d; ry = -Math.PI / 2; }
      else if (dir === "diagonally toward the camera") { x = s * d * .4; z = lerp(-3, 1, t); ry = Math.atan2(.4, 1); }
      else if (dir === "in a circle") { const a = t * Math.PI * 1.7 * Math.min(g, 1.6), r = 1.5; x = r * Math.sin(a); z = r * (1 - Math.cos(a)); ry = Math.atan2(Math.cos(a), Math.sin(a)); }
      else if (dir === "into the distance") { z = 1 - t * 7 * Math.min(g, 1.5); ry = Math.PI; }
      else if (dir === "up a slope or stairs") { y = t * 1.4; z = -s * d * .6; ry = Math.PI; body.rotation.x = Math.max(body.rotation.x, .08); }
      if (entering) { x = lerp(-4.6, 0, sm(0, .65, t)); ry = Math.PI / 2; } else if (leaving) { x = lerp(0, 4.6, sm(.35, 1, t)); ry = Math.PI / 2; }
      root.position.set(h.x + x, y, h.z + z); if (ry != null) root.rotation.y = ry;
    }
    /* poses (these can combine with a path or stand alone) */
    if (has("turning around")) root.rotation.y += Math.PI * sm(.1, .7, t);
    if (has("spinning around")) root.rotation.y += Math.PI * 4 * t;
    if (has("looking back over the shoulder")) { root.rotation.y += Math.PI * .8; head.rotation.y = -Math.PI * .75 * sm(.1, .5, t) + rad(sub.lookYaw || 0); }
    if (has("sitting down")) { const k = sm(.05, .6, t); legs.forEach(l => l.rotation.x = -1.45 * k); body.position.y = -.43 * k; body.rotation.x = .05 * k; arms.forEach(a => a.rotation.x = -.5 * k); }
    if (has("standing up")) { const k = 1 - sm(.1, .6, t); legs.forEach(l => l.rotation.x = -1.45 * k); body.position.y = -.43 * k; arms.forEach(a => a.rotation.x = -.5 * k); }
    if (has("kneeling")) { const k = sm(.05, .55, t); body.position.y = -.4 * k; legs[0].rotation.x = -1.3 * k; legs[1].rotation.x = .25 * k; }
    if (has("crouching")) { const k = sm(.05, .5, t); body.position.y = -.33 * k; body.rotation.x = .35 * k; legs.forEach(l => l.rotation.x = -.95 * k); arms.forEach(a => a.rotation.x = -.7 * k); }
    if (has("jumping")) { const y = Math.max(0, Math.sin(t * Math.PI * 3)); body.position.y = y * .55; legs.forEach(l => l.rotation.x = -.6 * y); arms.forEach(a => a.rotation.z = (a === arms[0] ? -1 : 1) * 1.5 * y); }
    if (has("climbing")) { const p = tt * 3; arms[0].rotation.x = -2.5 + Math.sin(p) * .4; arms[1].rotation.x = -2.5 - Math.sin(p) * .4; legs[0].rotation.x = Math.sin(p) * .6; legs[1].rotation.x = -Math.sin(p) * .6; if (!travels) body.position.y = t * 1.2; }
    if (has("reaching out a hand")) arms[1].rotation.x = -1.55 * sm(.05, .5, t);
    if (has("pointing ahead")) { const k = sm(.05, .4, t); arms[1].rotation.x = -1.5 * k; head.rotation.y *= 1; }
    if (has("waving")) { arms[1].rotation.z = 2.4 + Math.sin(tt * 9) * .3; arms[1].rotation.x = 0; }
    if (has("picking something up")) { const k = Math.sin(clamp(t * 1.15, 0, 1) * Math.PI); body.rotation.x = .95 * k; arms.forEach(a => a.rotation.x = -1.1 * k); legs.forEach(l => l.rotation.x = -.35 * k); }
    if (has("opening a door")) { arms[1].rotation.x = -1.25; arms[1].rotation.z = .1; }
    if (has("dancing")) { arms[0].rotation.z = -1.2 + Math.sin(tt * 5) * .5; arms[1].rotation.z = 1.2 - Math.sin(tt * 5) * .5; body.rotation.z = Math.sin(tt * 3) * .06; body.position.y = Math.abs(Math.sin(tt * 5)) * .05; legs[0].rotation.x = Math.sin(tt * 5) * .3; legs[1].rotation.x = -Math.sin(tt * 5) * .3; }
    if (has("fighting")) { const a = Math.sin(tt * 8); arms[0].rotation.x = -1.5 * Math.max(0, a); arms[1].rotation.x = -1.5 * Math.max(0, -a); body.rotation.y = Math.sin(tt * 4) * .3; legs[0].rotation.x = -.3; legs[1].rotation.x = .3; body.position.y = -.05; }
    if (has("falling")) { const k = sm(.15, .75, t); body.rotation.x = 1.45 * k; body.position.y = -.02 * k; arms.forEach(a => a.rotation.x = -1.2 * k); }
    if (has("stumbling")) { body.rotation.x = .3 + Math.sin(tt * 6) * .22; arms.forEach((a, i) => a.rotation.x = -.9 + Math.sin(tt * 6 + i) * .5); }
    if (has("leaning on a wall")) { body.rotation.z = -.13; legs[1].rotation.x = .3; arms[1].rotation.z = .2; }
    if (has("laughing")) { body.position.y = Math.abs(Math.sin(tt * 9)) * .03; head.rotation.x = -.32; if (torso) torso.scale.y = 1 + Math.abs(Math.sin(tt * 9)) * .03; }
    if (has("talking with hand gestures")) { arms[0].rotation.x = -.9 + Math.sin(tt * 3) * .3; arms[1].rotation.x = -.9 + Math.cos(tt * 3.4) * .3; head.rotation.x = Math.sin(tt * 4) * .06; }
    if (has("drinking from a cup")) { const k = sm(.1, .45, t) * (1 - sm(.75, .95, t)); arms[1].rotation.x = -2.3 * k; head.rotation.x = -.18 * k; }
    /* small details (always on top) */
    const mi = m.micro;
    if (mi.has("breathing visibly") && torso) torso.scale.y = 1 + Math.sin(tt * 2.2) * .025;
    if (mi.has("a slow exhale") && torso) { torso.scale.y = 1 + Math.sin(tt * .9) * .035; head.rotation.x += -.05 * Math.sin(tt * .9); }
    if (mi.has("head tilting")) head.rotation.z = .24 * sm(0, .5, t);
    if (mi.has("eyes glancing around")) head.rotation.y += Math.sin(tt * 1.4) * .55;
    if (mi.has("a subtle smile forming") || mi.has("blinking naturally") || mi.has("jaw clenching")) head.rotation.x += Math.sin(tt * 2.6) * .025;
    if (mi.has("fidgeting nervously")) { arms[0].rotation.x += Math.sin(tt * 7) * .12; arms[1].rotation.z += Math.sin(tt * 9) * .08; head.rotation.y += Math.sin(tt * 2.2) * .12; }
    if (mi.has("trembling")) { body.position.x += Math.sin(tt * 42) * .007; body.rotation.z += Math.sin(tt * 37) * .012; }
    if (mi.has("hands shaking")) arms.forEach((a, i) => { a.rotation.x += -.9 + Math.sin(tt * 34 + i) * .08; });
    if (mi.has("tears forming")) head.rotation.x += .1 * sm(0, .5, t);
  };

  /* ---------- character options: each one sets intent for the interpreter ---------- */
  const SPEEDS = { "very slow": .45, "slow and deliberate": .7, "relaxed": .9, "brisk": 1.35, "hurried": 1.7, "frantic, full speed": 2.2 };
  const cb = (fn) => ({ subject(sub) { if (sub) fn(mot(sub), sub); } });
  const table = (g, fn) => { const o = {}; MO.GROUPS[g].list.forEach(r => { o[r[0]] = cb((m, sub) => fn(m, r[0], sub)); }); return o; };
  reg("act", table("act", (m, n) => m.acts.add(n)), o => o);
  /* some actions bring a prop or a wall into the scene */
  const act = n => S.get("act", n);
  act("opening a door").scene = ctx => { const hinge = new T.Group(); hinge.position.set(.55, 0, .35); hinge.add(S.mesh("box", "#7a5230", [.45, 1.05, 0], [.9, 2.1, .06])); ctx.add(hinge); mk(ctx, "box", "#4a3320", [.05, 1.05, .3], [.1, 2.2, .12]); mk(ctx, "box", "#4a3320", [1.05, 1.05, .3], [.1, 2.2, .12]); mk(ctx, "box", "#4a3320", [.55, 2.15, .3], [1.1, .1, .12]); ctx.every((t) => { hinge.rotation.y = -1.7 * sm(.15, .75, t); }); };
  act("leaning on a wall").scene = ctx => { mk(ctx, "box", "#8a8f98", [.62, 1.3, 0], [.12, 2.6, 3.2]); };
  act("picking something up").scene = ctx => { mk(ctx, "box", "#c9a23a", [.1, .09, .4], [.18, .18, .18]); };
  act("drinking from a cup").scene = ctx => { };
  reg("spd", table("spd", (m, n) => { m.speed = SPEEDS[n] || 1; }), o => o);
  reg("dirm", table("dirm", (m, n) => { m.dir = n; }), o => o);
  const micro = table("micro", (m, n) => m.micro.add(n));
  micro["hair blowing in the wind"].env = E => { E.wind = Math.max(E.wind || 0, 1.3); };
  micro["clothes rippling in the wind"].env = E => { E.wind = Math.max(E.wind || 0, 1.3); };
  micro["breath visible in the cold air"].scene = ctx => ctx.particles({ count: 26, area: [.25, .15, .25], center: [0, 1.55, .38], size: .2, color: "#eef4fa", opacity: .22, speed: [0, .12, .35], jitter: [.05, .05, .1] });
  micro["a slow exhale"].scene = ctx => ctx.particles({ count: 18, area: [.2, .1, .2], center: [0, 1.55, .38], size: .16, color: "#eef4fa", opacity: .16, speed: [0, .08, .25], jitter: [.04, .04, .08] });
  micro["tears forming"].scene = ctx => ctx.particles({ count: 6, area: [.16, .05, .02], center: [0, 1.58, .27], size: .03, color: "#bfe4ff", opacity: .9, speed: [0, -.28, 0], jitter: [.01, .03, 0], glow: true });
  reg("micro", micro, o => o);

  /* ---------- camera vs subject (the camera side of it is a rig change) ---------- */
  reg("rel", {
    "subject moves, camera locked off": Object.assign(cb((m, sub) => { m.rel = "subject moves, camera locked off"; m.acts.size || m.acts.add("walking"); }), {}),
    "subject still, camera moves": Object.assign(cb((m) => { m.rel = "subject still, camera moves"; m.acts.add("standing still"); }), { rig(r, t) { r.yaw += lerp(-26, 26, t); r.dolly = (r.dolly || 1) * lerp(1.1, .88, t); } }),
    "camera follows the subject": Object.assign(cb((m) => { m.rel = "camera follows the subject"; m.acts.size || m.acts.add("walking"); }), { rig(r) { r.follow = true; } }),
    "subject enters the frame": cb((m) => { m.rel = "subject enters the frame"; }),
    "subject leaves the frame": cb((m) => { m.rel = "subject leaves the frame"; }),
    "camera and subject move together": Object.assign(cb((m) => { m.rel = "camera and subject move together"; m.acts.size || m.acts.add("walking"); }), { rig(r) { r.follow = true; r.attach = true; } }),
    "subject and camera move in opposite directions": Object.assign(cb((m) => { m.rel = "subject and camera move in opposite directions"; m.acts.size || m.acts.add("walking"); }), { rig(r, t) { r.truck += lerp(.6, -.6, t); } })
  }, o => o);

  /* ---------- background movement ---------- */
  const people = (n, zmin, zmax, speed, scale) => ctx => { const cols = ["#5a6070", "#8a5a50", "#4a6a5a", "#6a5a80", "#8a7a50", "#506a8a"], list = [];
    for (let i = 0; i < n; i++) { const d = S.makeExtra(cols[i % cols.length], scale * (.85 + ctx.rand() * .3)), dirn = i % 2 ? 1 : -1; d.position.set(-14 + ctx.rand() * 28, 0, zmin + ctx.rand() * (zmax - zmin)); d.rotation.y = dirn * Math.PI / 2; ctx.add(d); list.push([d, dirn, speed * (.7 + ctx.rand() * .6), ctx.rand() * 6]); }
    ctx.every((t, dt, c) => list.forEach(([d, dirn, sp, ph]) => { d.position.x += dirn * sp * dt; if (d.position.x > 15) d.position.x = -15; if (d.position.x < -15) d.position.x = 15; d.position.y = Math.abs(Math.sin(c.time * sp * 5 + ph)) * .03; })); };
  const sway = (ctx, objs, amp, rate) => ctx.every((t, dt, c) => objs.forEach((o, i) => { o.rotation.z = Math.sin(c.time * rate + i * .9) * amp; }));
  const P = (ctx, o) => ctx.particles(o);
  reg("bgm", {
    "people walking past": { scene: people(7, -6, -3.5, 1.1, 1) },
    "people moving in the distance": { scene: people(16, -22, -12, .8, .85) },
    "traffic passing": { scene(ctx) { const cars = [["#b03a2e", -9, 1], ["#2c6fbb", -3, -1], ["#e0b030", 5, 1], ["#444", 11, -1]].map(([c, x, d]) => { const m = S.makeCar(c); m.position.set(x, 0, -8 + d * .9); if (d < 0) m.rotation.y = Math.PI; ctx.add(m); return [m, d]; }); ctx.every((t, dt) => cars.forEach(([m, d]) => { m.position.x += d * dt * 6.5; if (m.position.x > 19) m.position.x = -19; if (m.position.x < -19) m.position.x = 19; })); } },
    "a train passing": { scene(ctx) { const tr = new T.Group(); const cars = []; for (let i = 0; i < 7; i++) { const c = S.mesh("box", i ? "#6a7a8a" : "#b03a2e", [i * -4.9, 1.7, 0], [4.6, 3, 2.6]); const w = S.mesh("box", "#cfe6ff", [i * -4.9, 2.2, 1.31], [3.8, .8, .04], { emissive: "#cfe6ff", emissiveIntensity: .6 }); tr.add(c, w); } tr.position.set(-6, 0, -14); ctx.add(tr); ctx.every((t, dt) => { tr.position.x += dt * 14; if (tr.position.x > 50) tr.position.x = -50; }); } },
    "trees swaying": { scene(ctx) { const list = []; for (let i = 0; i < 9; i++) { const g = new T.Group(); g.add(S.mesh("cyl", "#5a3f2a", [0, 1.2, 0], [.3, 2.4, .3]), S.mesh("sphere", "#3f7a3a", [0, 3.3, 0], [2.2, 2.4, 2.2])); g.position.set(-12 + i * 3 + ctx.rand(), 0, -9 - ctx.rand() * 5); ctx.add(g); list.push(g); } sway(ctx, list, .05, 1.6); } },
    "tall grass swaying": { scene(ctx) { const list = []; for (let i = 0; i < 70; i++) { const g = new T.Group(); const b = S.mesh("cone", "#7aa04a", [0, .35, 0], [.07, .7, .07]); g.add(b); g.position.set(-7 + ctx.rand() * 14, 0, -4.5 + ctx.rand() * 3.5); ctx.add(g); list.push(g); } sway(ctx, list, .22, 2.3); } },
    "clouds drifting": { scene(ctx) { const cl = []; for (let i = 0; i < 7; i++) { const c = mk(ctx, "sphere", "#ffffff", [-60 + i * 22, 30 + ctx.rand() * 6, -70 - ctx.rand() * 20], [18 + ctx.rand() * 10, 4.5, 8], { opacity: .85, emissive: "#ffffff", emissiveIntensity: .3 }); cl.push(c); } ctx.every((t, dt) => cl.forEach(c => { c.position.x += dt * 2.2; if (c.position.x > 80) c.position.x = -80; })); } },
    "birds flying overhead": { scene(ctx) { const bs = []; for (let i = 0; i < 6; i++) { const g = new T.Group(), a = S.mesh("box", "#1a1a1e", [-.18, 0, 0], [.4, .02, .1]), b = S.mesh("box", "#1a1a1e", [.18, 0, 0], [.4, .02, .1]); g.add(a, b); g.position.set(-14 + i * 5, 7 + ctx.rand() * 3, -10 - ctx.rand() * 6); ctx.add(g); bs.push([g, a, b, ctx.rand() * 6]); } ctx.every((t, dt, c) => bs.forEach(([g, a, b, ph]) => { g.position.x += dt * 4; if (g.position.x > 16) g.position.x = -16; const f = Math.sin(c.time * 9 + ph) * .6; a.rotation.z = f; b.rotation.z = -f; })); } },
    "water rippling": { scene(ctx) { mk(ctx, "plane", "#2a5a7a", [0, .02, -6], [18, 10, 1], { rough: .15 }, [-Math.PI / 2, 0, 0]); const rings = []; for (let i = 0; i < 5; i++) { const r = mk(ctx, "torus", "#bfe0f4", [-4 + i * 2, .05, -6 + (i % 2) * 2], [1, 1, 1], { opacity: .6 }, [Math.PI / 2, 0, 0]); rings.push(r); } ctx.every((t, dt, c) => rings.forEach((r, i) => { const k = (c.time * .5 + i * .2) % 1; r.scale.set(.2 + k * 2, .2 + k * 2, .2 + k * 2); r.material.opacity = .6 * (1 - k); })); } },
    "waves rolling in": { scene(ctx) { mk(ctx, "plane", "#2a6a8a", [0, .02, -14], [60, 24, 1], { rough: .2 }, [-Math.PI / 2, 0, 0]); const ws = []; for (let i = 0; i < 5; i++) { ws.push(mk(ctx, "box", "#eaf6ff", [0, .08, -22 + i * 3.4], [40, .06, .5], { opacity: .85 })); } ctx.every((t, dt) => ws.forEach(w => { w.position.z += dt * 1.1; if (w.position.z > -4) w.position.z = -24; })); } },
    "a flag or curtain fluttering": { scene(ctx) { mk(ctx, "cyl", "#8a8f98", [3.2, 2.2, -4], [.08, 4.4, .08]); const f = mk(ctx, "plane", "#c0392b", [4, 3.8, -4], [1.6, 1, 1]); ctx.every((t, dt, c) => { f.rotation.y = Math.sin(c.time * 5) * .35; f.rotation.z = Math.sin(c.time * 7) * .08; }); } },
    "neon signs flickering": { scene(ctx) { const m = [["#ff2fb8", -4], ["#2fe0ff", 0], ["#ffd23f", 4]].map(([c, x]) => mk(ctx, "box", c, [x, 3.6, -9], [2.6, .7, .1], { emissive: c, emissiveIntensity: 1.8 })); ctx.every((t, dt, c) => m.forEach((o, i) => { const k = Math.sin(c.time * (11 + i * 3) + i) > .65 ? .15 : 1; o.material.emissiveIntensity = 1.8 * k; })); } },
    "lights flickering": { scene(ctx) { const l = new T.PointLight("#ffe6b0", 30, 0, 2); l.position.set(0, 3.2, 1); ctx.light(l); ctx.every((t, dt, c) => { const f = Math.sin(c.time * 23) * Math.sin(c.time * 7.3); l.intensity = f > .35 ? 4 : 30; }); } },
    "fire flickering": { scene(ctx) { const f = mk(ctx, "cone", "#ff9a3a", [-1.8, .5, -1.5], [.5, 1, .5], { emissive: "#ff7a1a", emissiveIntensity: 3 }); mk(ctx, "cyl", "#4a3320", [-1.8, .1, -1.5], [.9, .15, .9]); const l = new T.PointLight("#ff8a3a", 18, 14, 2); l.position.set(-1.8, 1, -1.4); ctx.light(l); ctx.every((t, dt, c) => { const k = 1 + Math.sin(c.time * 17) * .15 + Math.sin(c.time * 29) * .1; f.scale.set(.5 * k, 1 * (1.1 - (k - 1)), .5 * k); l.intensity = 18 * k; }); P(ctx, { count: 40, area: [.4, .2, .4], center: [-1.8, 1.1, -1.5], size: .05, color: "#ffb04a", speed: [0, 1.2, 0], jitter: [.2, .3, .2], opacity: 1, twinkle: .8, glow: true }); } },
    "smoke rising in the distance": { scene: ctx => P(ctx, { count: 60, area: [2.5, 6, 2.5], center: [-9, 5, -16], size: 3.2, color: "#8a8f96", opacity: .13, speed: [.25, .8, 0], jitter: [.2, .2, .2], sway: .5 }) },
    "a windmill or fan turning": { scene(ctx) { mk(ctx, "cyl", "#d8d0c0", [5, 3, -9], [.9, 6, .9]); const hub = new T.Group(); hub.position.set(5, 6, -8.4); for (let i = 0; i < 4; i++) { const b = S.mesh("box", "#efe8d8", [0, 1.7, 0], [.35, 3.4, .05]); const pv = new T.Group(); pv.add(b); pv.rotation.z = i * Math.PI / 2; hub.add(pv); } ctx.add(hub); ctx.every((t, dt) => { hub.rotation.z -= dt * 1.1; }); } },
    "machinery moving": { scene(ctx) { const g = []; for (let i = 0; i < 3; i++) { const o = mk(ctx, "torus", "#b8863a", [-3 + i * 3, 2 + (i % 2) * .8, -7], [1.6 - i * .2, 1.6 - i * .2, 1.6 - i * .2], { metal: .6, rough: .4 }); g.push([o, i % 2 ? -1 : 1]); } const p = mk(ctx, "box", "#6a7078", [5.5, 1, -7], [.5, 1.2, .5]); ctx.every((t, dt, c) => { g.forEach(([o, d]) => { o.rotation.z += dt * d * 1.4; }); p.position.y = 1 + Math.abs(Math.sin(c.time * 3)) * .9; }); } },
    "a frozen, still background": { env: E => { E.wind = 0; }, scene(ctx) { ctx.frozenBackground = true; } }
  }, o => o);

})(typeof window !== "undefined" ? window : globalThis);
