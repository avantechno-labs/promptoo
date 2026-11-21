/* 3D effects: shot sizes, camera angles, lenses and camera moves.
   Add a move: one entry in MOVES with a rig(r, t, ctx) function. t runs 0..1 across the clip. Fields you can change on r:
     dolly (distance multiplier)  zoom (lens only)  yaw (deg around subject)  pitch (deg, + = camera above)  roll (deg)
     pan / tilt (deg, view turns, camera stays)  truck / lift (sideways / up, in subject heights)  shake  follow  attach  blur  fade */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE; const { lerp, smooth, rad, deg, clamp } = S.util;
  const reg = S.registerMany;

  /* ---------- shot sizes: how much of the subject fills the frame ---------- */
  reg("shot", {
    "extreme wide shot": [16, .25], "wide establishing shot": [8, .3], "wide shot": [3.4, .45], "full shot": [1.35, .52], "medium wide shot": [.78, .62],
    "medium shot": [.52, .72], "medium close-up": [.33, .8], "close-up": [.21, .9], "extreme close-up": [.075, .91], "insert shot": [.06, .56]
  }, ([h, y]) => ({ rig(r) { r.frameH = h; r.targetY = y; } }));

  /* ---------- camera angles ---------- */
  const ang = (o) => ({ rig(r, t, ctx) { if (o.pitch != null) r.pitch = o.pitch; if (o.yaw) r.yaw += o.yaw; if (o.roll) r.roll += o.roll; if (o.lift) r.lift += o.lift; if (o.tm) r.targetY *= o.tm; if (o.pov) r.pov = 1; }, scene: o.extra });
  const second = (x, z, rot, color) => ctx => { const d = S.makeExtra(color || "#6a5a50", 1); d.position.set(x, 0, z); d.rotation.y = rot; ctx.add(d); ctx.second = d; };
  reg("angle", {
    "eye-level angle": { pitch: 0 }, "low-angle shot": { pitch: -22 }, "high-angle shot": { pitch: 32 }, "bird's-eye view": { pitch: 62 }, "overhead top-down shot": { pitch: 88 },
    "hip-level angle": { pitch: -8, tm: .85 }, "shoulder-level angle": { pitch: -3 }, "ground-level angle": { pitch: -7, tm: .5 }, "worm's-eye view": { pitch: -42, tm: .8 }, "hero angle": { pitch: -14 },
    "dutch angle": { roll: -15 }, "extreme dutch angle": { roll: -32 }, "upside-down angle": { roll: 180 },
    "from-behind angle": { yaw: 180 }, "profile angle": { yaw: 90 }, "three-quarter angle": { yaw: 40 }, "reverse angle": { yaw: 150 }, "single shot": {}, "point-of-view shot": { pov: 1 },
    "over-the-shoulder shot": { yaw: -9, pitch: 5, extra: ctx => { second(-.3, 1.3, Math.PI, "#55606e")(ctx); } },
    "two-shot": { yaw: 0, extra: ctx => { second(.55, 0, 0, "#6a5a50")(ctx); if (ctx.subject) ctx.subject.home.x = -.5, ctx.subject.root.position.x = -.5; } }
  }, ang);
  // the two-shot and over-the-shoulder need a wider default frame and the shot size effect still wins if the user picked one
  S.get("angle", "two-shot").rig = function (r) { r.frameH = Math.max(r.frameH, 1.5); r.targetY = Math.min(r.targetY, .6); };
  S.get("angle", "over-the-shoulder shot").rig = function (r) { r.yaw += -9; r.pitch = 5; r.frameH = Math.max(r.frameH, .85); r.targetY = Math.max(r.targetY, .75); };
  S.get("angle", "point-of-view shot").rig = function (r, t, ctx) { r.pov = 1; r.pitch = 0; };
  S.get("angle", "point-of-view shot").scene = function (ctx) { if (ctx.subject) ctx.subject.root.visible = false; };

  /* ---------- lenses ---------- */
  const fovOf = mm => deg(2 * Math.atan(12 / mm));
  reg("lens", {
    "24mm wide lens": [24], "35mm lens": [35], "50mm lens": [50], "85mm portrait lens": [85, { dof: .006 }], "macro lens": [60, { dof: .02 }],
    "telephoto compression": [200, {}], "shallow depth of field": [50, { dof: .016 }], "deep focus": [28, {}],
    "anamorphic lens with flares": [40, { post: [{ pass: "streak", strength: .9, tint: "#7fb0ff" }, { pass: "letterbox", ratio: 2.39 }] }],
    "fisheye": [14, { post: [{ pass: "fisheye", strength: .6 }] }]
  }, ([mm, o]) => ({ rig(r) { r.fov0 = fovOf(mm); }, post: (o && o.post) || (o && o.dof ? [{ pass: "dof", aperture: o.dof }] : null) }));
  S.get("lens", "fisheye").rig = function (r) { r.fov0 = 80; };

  /* ---------- camera moves ---------- */
  const E = smooth;
  const walkSub = (sub, ctx, dx, dz, yawFace, speed) => { if (!sub) return; sub.forceWalk = true; if (speed) sub.forceSpeed = speed; };
  function tracker(opts) { // the subject walks along a line and the camera follows
    return {
      subject(sub, t, ctx) { if (!sub) return; sub.forceWalk = true; sub.forceSpeed = opts.speed || 4.2; const k = t - .5; sub.root.position.set(sub.home.x + opts.dx * k, 0, sub.home.z + opts.dz * k); sub.root.rotation.y = opts.face; },
      rig(r, t, ctx) { r.follow = 1; r.yaw += (opts.yaw || 0); r.pitch += (opts.pitch || 0); if (opts.shake) r.shake += opts.shake; if (opts.dolly) r.dolly *= opts.dolly; if (opts.tm) r.targetY *= opts.tm; }
    };
  }
  const M = {
    "static locked-off camera": {},
    "pan right": { rig(r, t) { r.pan += lerp(14, -14, E(t)); } },
    "pan left": { rig(r, t) { r.pan += lerp(-14, 14, E(t)); } },
    "tilt up": { rig(r, t) { r.tilt += lerp(-9, 9, E(t)); } },
    "tilt down": { rig(r, t) { r.tilt += lerp(9, -9, E(t)); } },
    "whip pan": { rig(r, t) { const a = E(clamp((t - .35) / .12, 0, 1)), b = E(clamp((t - .75) / .12, 0, 1)); const p = a * (1 - b); r.pan += lerp(0, -75, p); r.blur += 4 * (Math.min(a, 1 - a) + Math.min(b, 1 - b)); } },
    "slow zoom in": { rig(r, t) { r.zoom *= lerp(1, 1.7, E(t)); } },
    "slow zoom out": { rig(r, t) { r.zoom *= lerp(1.7, 1, E(t)); } },
    "fast zoom in": { rig(r, t) { r.zoom *= lerp(1, 2.6, E(clamp(t * 2.2, 0, 1))); } },
    "fast zoom out": { rig(r, t) { r.zoom *= lerp(2.6, 1, E(clamp(t * 2.2, 0, 1))); } },
    "crash zoom in": { rig(r, t) { const p = E(clamp((t - .5) / .1, 0, 1)); r.zoom *= lerp(1, 3.2, p); r.blur += 3 * p * (1 - p) * 4; } },
    "crash zoom out": { rig(r, t) { const p = E(clamp((t - .5) / .1, 0, 1)); r.zoom *= lerp(3.2, 1, p); r.blur += 3 * p * (1 - p) * 4; } },
    "slow push-in": { rig(r, t) { r.dolly *= lerp(1.35, .72, E(t)); } },
    "slow pull-out": { rig(r, t) { r.dolly *= lerp(.72, 1.35, E(t)); } },
    "tracking shot": tracker({ dx: 5, dz: 0, face: Math.PI / 2, yaw: 28 }),
    "steadicam follow": tracker({ dx: 0, dz: -5, face: Math.PI, yaw: 0, pitch: 6, shake: .02, dolly: 1.05 }),
    "side tracking shot": tracker({ dx: 5, dz: 0, face: Math.PI / 2, yaw: 0, dolly: 1.1 }),
    "chase shot": tracker({ dx: 0, dz: -8, face: Math.PI, yaw: 0, pitch: 4, shake: .1, dolly: .85, speed: 7.5 }),
    "reverse tracking walk-and-talk": tracker({ dx: 0, dz: 5, face: 0, yaw: 0, pitch: 3 }),
    "low tracking shot": tracker({ dx: 5, dz: 0, face: Math.PI / 2, yaw: 20, pitch: -8, tm: .4 }),
    "vehicle tracking shot": { scene(ctx) { const car = S.makeCar("#b03a2e"); car.position.set(-3, 0, 0); ctx.add(car); ctx.followObj = car; ctx.car = car; if (ctx.subject) ctx.subject.root.visible = false; },
      rig(r, t, ctx) { r.follow = 1; r.yaw += 70; r.frameH = Math.max(r.frameH, 2.2); r.pitch = 6; if (ctx.car) ctx.car.position.x = -3 + (t - .5) * 9; } },
    "orbit around subject": { rig(r, t) { r.yaw += lerp(0, -200, t); } },
    "orbit clockwise": { rig(r, t) { r.yaw += lerp(0, -300, t); } },
    "orbit counterclockwise": { rig(r, t) { r.yaw += lerp(0, 300, t); } },
    "arc left": { rig(r, t) { r.yaw += lerp(32, -32, E(t)); } },
    "arc right": { rig(r, t) { r.yaw += lerp(-32, 32, E(t)); } },
    "truck left": { rig(r, t) { r.truck += lerp(.9, -.9, E(t)); } },
    "truck right": { rig(r, t) { r.truck += lerp(-.9, .9, E(t)); } },
    "slider left": { rig(r, t) { r.truck += lerp(.25, -.25, E(t)); } },
    "slider right": { rig(r, t) { r.truck += lerp(-.25, .25, E(t)); } },
    "pedestal up": { rig(r, t) { r.lift += lerp(-.35, .35, E(t)); } },
    "pedestal down": { rig(r, t) { r.lift += lerp(.35, -.35, E(t)); } },
    "push past pass-by shot": { rig(r, t) { r.dolly *= lerp(1.4, .5, E(t)); r.truck += lerp(1.3, -.9, E(t)); r.yaw += lerp(25, -25, E(t)); } },
    "handheld shaky cam": { rig(r) { r.shake += .06; } },
    "crane up": { rig(r, t) { r.pitch += lerp(0, 40, E(t)); r.dolly *= lerp(1, 1.3, E(t)); } },
    "crane down": { rig(r, t) { r.pitch += lerp(40, 0, E(t)); r.dolly *= lerp(1.3, 1, E(t)); } },
    "drone fly-over": { rig(r, t) { r.pitch = lerp(26, 52, E(t)); r.yaw += lerp(-22, 22, E(t)); r.dolly *= lerp(1.9, 1.1, E(t)); } },
    "drone pull back": { rig(r, t) { r.dolly *= lerp(.7, 2, E(t)); r.pitch = lerp(10, 34, E(t)); } },
    "drone push in": { rig(r, t) { r.dolly *= lerp(2, .8, E(t)); r.pitch = lerp(34, 18, E(t)); } },
    "helicopter shot": { rig(r, t) { r.dolly *= 2.4; r.pitch = lerp(24, 34, t); r.yaw += lerp(0, -120, t); } },
    "dolly zoom": { rig(r, t) { const d = lerp(1.35, .55, E(t)); r.dolly *= d; r.zoom *= d; } },
    "Snorricam body-mounted camera": { subject(sub, t, ctx) { if (!sub) return; sub.forceWalk = true; sub.forceSpeed = 3; sub.root.rotation.y = Math.sin(ctx.time * 1.4) * .55; sub.root.position.x = sub.home.x + Math.sin(ctx.time * .9) * .9; sub.root.position.z = sub.home.z + Math.cos(ctx.time * 1.1) * .5; },
      rig(r) { r.follow = 1; r.attach = 1; r.frameH = Math.min(r.frameH, .5); r.targetY = Math.max(r.targetY, .75); r.shake += .02; } },
    "pass-through-objects shot": { scene(ctx) { [1.3, 3.2].forEach((z, i) => { const ring = S.mesh("torus", i ? "#4fd1ff" : "#ff9f43", [0, 1.1, z], [4.2 + i, 4.2 + i, 4.2 + i], { emissive: i ? "#4fd1ff" : "#ff9f43", emissiveIntensity: .7 }); ring.scale.z = 4; ctx.add(ring); }); }, rig(r, t) { r.dolly *= lerp(1.9, .42, E(t)); } },
    "earth zoom out": { env(E_) { E_.groundSize = 9000; E_.fogDensity = Math.min(E_.fogDensity, .0004); }, rig(r, t) { r.dolly *= Math.exp(lerp(Math.log(.6), Math.log(150), E(t))); r.pitch = lerp(5, 62, E(t)); } },
    "infinite zoom": { scene(ctx) { for (let i = 0; i < 9; i++) { const s = 5 * Math.pow(.72, i), ring = S.mesh("torus", i % 2 ? "#e0b84a" : "#7a5ac8", [0, 1.1, 1.2 + i * 1.3], [s, s, s], { emissive: i % 2 ? "#e0b84a" : "#7a5ac8", emissiveIntensity: .5 }); ring.scale.z = s * 4; ctx.add(ring); } }, rig(r, t) { r.dolly *= lerp(1.5, .35, E(t)); } }
  };
  reg("move", M, m => m);

  /* a car for the vehicle shot (also used by the location and crowd effects) */
  S.makeCar = function (color) {
    const g = new T.Group();
    g.add(S.mesh("box", color || "#2c6fbb", [0, .45, 0], [3.6, .6, 1.6]), S.mesh("box", "#9fb6c8", [-.2, .95, 0], [1.9, .5, 1.4], { rough: .2, metal: .2 }));
    [[-1.1, .5], [1.1, .5], [-1.1, -.5], [1.1, -.5]].forEach(([x, z]) => { const w = S.mesh("cyl", "#111", [x * 1.1, .28, z * 1.6], [.56, .3, .56]); w.rotation.x = Math.PI / 2; g.add(w); });
    return g;
  };
})(typeof window !== "undefined" ? window : globalThis);
