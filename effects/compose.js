/* 3D effects: composition (placement, facing, framing guides), pacing and transitions. */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE; const { lerp, smooth, clamp } = S.util;
  const reg = S.registerMany;

  /* where the subject sits in the frame: shiftX < 0 moves the subject left, shiftY < 0 moves it down */
  reg("place", {
    "subject centered in frame": {},
    "subject on the left third": { rig(r) { r.shiftX = -.167; } },
    "subject on the right third": { rig(r) { r.shiftX = .167; } },
    "subject low in frame": { rig(r) { r.shiftY = -.17; } },
    "subject high in frame": { rig(r) { r.shiftY = .2; } },
    "subject small and off-center with lots of negative space": { rig(r) { r.frameH *= 2.3; r.shiftX = -.3; r.shiftY = -.05; } },
    "subject filling the frame": { rig(r) { r.frameH *= .55; } },
    "tiny figure in a vast frame": { rig(r) { r.frameH *= 4.2; r.shiftY = -.05; } }
  }, o => o);

  /* which way the subject faces and looks */
  const face = (yaw, o) => Object.assign({ subject(sub, t, ctx) { if (!sub) return; sub.root.rotation.y = yaw; if (o && o.lookYaw != null) sub.lookYaw = o.lookYaw; if (o && o.lookPitch != null) sub.lookPitch = o.lookPitch; } }, {});
  reg("facing", {
    "facing the camera": face(0), "back to the camera": face(Math.PI), "in profile facing left": face(-Math.PI / 2), "in profile facing right": face(Math.PI / 2),
    "three-quarter view": face(.75), "looking off-screen": face(.2, { lookYaw: 55 }), "looking up": face(0, { lookPitch: -28 }), "looking down": face(0, { lookPitch: 26 }),
    "walking toward the camera": { subject(sub, t, ctx) { if (!sub) return; sub.forceWalk = true; sub.root.rotation.y = 0; sub.root.position.set(sub.home.x, 0, sub.home.z + lerp(-2.6, 2.6, t)); } },
    "walking away from the camera": { subject(sub, t, ctx) { if (!sub) return; sub.forceWalk = true; sub.root.rotation.y = Math.PI; sub.root.position.set(sub.home.x, 0, sub.home.z + lerp(2.6, -2.6, t)); } }
  }, o => o);

  /* framing: some move the subject, most also draw a guide on top of the preview (guides are not in exported images) */
  const line = (g, x1, y1, x2, y2, c) => { g.strokeStyle = c || "rgba(255,255,255,.7)"; g.lineWidth = Math.max(1, g.canvas.width / 400); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const guide = fn => ctx => ctx.guides.push(fn);
  const blobs = (g, w, h) => { g.fillStyle = "rgba(8,22,12,.82)"; [[.02, 1.02, .22, .2], [.98, 1.03, .26, .17]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x * w, y * h, rx * w, ry * h, 0, 0, 6.3); g.fill(); }); g.strokeStyle = "rgba(8,22,12,.82)"; g.lineWidth = w / 120; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w * (.03 + i * .02), h); g.lineTo(w * (.02 + i * .025), h * .84); g.stroke(); g.beginPath(); g.moveTo(w * (.96 - i * .02), h); g.lineTo(w * (.97 - i * .025), h * .86); g.stroke(); } };
  reg("frame", {
    "rule of thirds": { rig(r) { if (!r.shiftX) r.shiftX = -.167; }, scene: guide((g, w, h) => { [1 / 3, 2 / 3].forEach(k => { line(g, w * k, 0, w * k, h); line(g, 0, h * k, w, h * k); }); }) },
    "symmetrical framing": { rig(r) { r.yaw *= 0; r.roll = 0; }, scene: guide((g, w, h) => { g.setLineDash([6, 6]); line(g, w / 2, 0, w / 2, h); }) },
    "leading lines": { scene: guide((g, w, h) => { [[0, 1], [.15, 1], [.3, 1], [1, 1], [.85, 1], [.7, 1]].forEach(([x]) => line(g, x * w, h, w * .5 + (x - .5) * w * .12, h * .52)); line(g, 0, h * .8, w * .48, h * .52); line(g, w, h * .8, w * .52, h * .52); }) },
    "foreground element in front": { rig(r) { r.aperture = Math.max(r.aperture, .004); }, scene: guide((g, w, h) => blobs(g, w, h)), post: [{ pass: "dof", aperture: .008 }] },
    "negative space": { rig(r) { r.frameH *= 1.9; r.shiftX = .26; r.shiftY = -.04; }, scene: guide((g, w, h) => { g.setLineDash([8, 6]); line(g, w * .55, 0, w * .55, h, "rgba(255,255,255,.5)"); }) },
    "frame within a frame": { scene: guide((g, w, h) => { g.fillStyle = "rgba(5,6,10,.9)"; g.beginPath(); g.rect(0, 0, w, h); g.rect(w * .22, h * .14, w * .56, h * .72); g.fill("evenodd"); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(w * .22, h * .14, w * .56, h * .72); }) },
    "layered depth: foreground, midground, background": { scene: guide((g, w, h) => blobs(g, w, h)), post: [{ pass: "dof", aperture: .006 }] },
    "diagonal composition": { rig(r) { r.roll += -7; r.shiftX = -.12; }, scene: guide((g, w, h) => line(g, 0, h, w, 0, "rgba(255,255,255,.5)")) },
    "golden ratio": { rig(r) { if (!r.shiftX) r.shiftX = -.118; }, scene: guide((g, w, h) => { [.382, .618].forEach(k => { line(g, w * k, 0, w * k, h, "rgba(246,198,74,.8)"); line(g, 0, h * k, w, h * k, "rgba(246,198,74,.8)"); }); }) },
    "generous headroom and margins": { rig(r) { r.frameH *= 1.3; r.shiftY = -.08; }, scene: guide((g, w, h) => { g.setLineDash([6, 6]); g.strokeStyle = "rgba(255,255,255,.6)"; g.strokeRect(w * .08, h * .08, w * .84, h * .84); }) },
    "tight framing": { rig(r) { r.frameH *= .7; } }
  }, o => o);

  /* pacing: speed of everything (and how often it cuts) */
  reg("pace", {
    "slow motion": { scene(ctx) { ctx.timeScale = .35; } },
    "real-time": { scene(ctx) { ctx.timeScale = 1; } },
    "time-lapse": { scene(ctx) { ctx.timeScale = 4; }, post: [{ pass: "dirblur", amount: .004 }] },
    "fast cuts": { rig(r, t) { const k = Math.floor(t * 5) % 5; r.yaw += [0, 38, -34, 72, -12][k]; r.frameH *= [1, .55, 1.5, .8, 1.25][k]; r.pitch += [0, 6, -4, 10, 0][k]; } },
    "smooth slow pacing": { scene(ctx) { ctx.timeScale = .6; } },
    "dynamic action pacing": { scene(ctx) { ctx.timeScale = 1.5; }, rig(r) { r.shake += .035; } }
  }, o => o);

  /* transition into the scene (the first part of the clip) */
  reg("trans", {
    "cut": {}, "match cut": {},
    "fade in": { rig(r, t) { r.fade = Math.max(r.fade, 1 - smooth(t / .22)); } },
    "fade to black": { rig(r, t) { r.fade = Math.max(r.fade, smooth((t - .72) / .26)); } },
    "dissolve": { rig(r, t) { r.fadeColor = "#ffffff"; r.fade = Math.max(r.fade, .85 * (1 - smooth(t / .3))); } },
    "whip-pan transition": { rig(r, t) { const p = 1 - smooth(clamp(t / .16, 0, 1)); r.pan += -70 * p; r.blur += 6 * p; } },
    "smash cut": { rig(r, t) { r.flash = Math.max(r.flash, clamp(1 - t / .06, 0, 1)); } }
  }, o => o);
})(typeof window !== "undefined" ? window : globalThis);
