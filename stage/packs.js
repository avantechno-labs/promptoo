/* Promptoo 3D stage: effect packs. A pack is plain JSON, so users can add effects without writing code.
   Stage3D.fromJSON(spec) registers one effect (and its option in the app). Examples (also in effects/README.md):
     { "type":"move",  "name":"my slow slide", "tip":"Glide left then settle",
       "keys":[ {"t":0,"truck":.6}, {"t":.6,"truck":-.3,"yaw":8}, {"t":1,"truck":-.3,"yaw":8} ] }
     { "type":"light", "name":"police lights", "sun":{"elev":5,"intensity":.2}, "ambient":.15,
       "lights":[ {"kind":"point","color":"#ff2020","intensity":40,"pos":[-2,2,1.5]}, {"kind":"point","color":"#2050ff","intensity":40,"pos":[2,2,1.5]} ], "bloom":.5 }
     { "type":"particles", "group":"atmo", "name":"golden dust", "color":"#ffd27a", "count":400, "size":.04, "speed":[0,.1,0], "glow":true }
     { "type":"look", "name":"my comic", "material":"toon", "post":[ {"pass":"outline","thickness":1.6}, {"pass":"halftone","size":6} ] }
   Keys for moves: dolly zoom yaw pitch roll lift truck pan tilt shake (values are added to the rig; t runs 0..1, values are blended between keys). */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE; const { lerp, smooth } = S.util;
  const RIG = ["dolly", "zoom", "yaw", "pitch", "roll", "lift", "truck", "pan", "tilt", "shake"], MUL = { dolly: 1, zoom: 1 };
  const MATS = {}; // filled by effects/look.js through the style registry (toon, flat, ink ...)

  S.fromJSON = function (spec) {
    if (!spec || !spec.type || !spec.name) throw new Error("pack entries need a type and a name");
    const ui = { tip: spec.tip || "Custom effect", w: spec.w, fam: spec.fam, pop: 0, custom: true };
    if (spec.type === "move") {
      const keys = (spec.keys || []).slice().sort((a, b) => a.t - b.t); if (!keys.length) throw new Error("a move needs keys");
      return S.register({ group: "move", name: spec.name, ui: Object.assign({ w: spec.w || "moves in a custom path" }, ui), rig(r, t) {
        let a = keys[0], b = keys[keys.length - 1]; for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; }
        const k = b.t === a.t ? 0 : smooth((t - a.t) / (b.t - a.t));
        RIG.forEach(f => { if (a[f] == null && b[f] == null) return; const va = a[f] == null ? (MUL[f] ? 1 : 0) : a[f], vb = b[f] == null ? (MUL[f] ? 1 : 0) : b[f], v = lerp(va, vb, k); if (MUL[f]) r[f] *= v; else r[f] += v; });
      } });
    }
    if (spec.type === "light") {
      return S.register({ group: "light", name: spec.name, ui, env(E) { if (spec.sun) { const s = spec.sun; if (s.elev != null) E.sunElev = s.elev; if (s.azim != null) E.sunAzim = s.azim; if (s.color) E.sunColor = s.color; if (s.intensity != null) E.sun = s.intensity; } if (spec.ambient != null) E.ambient = spec.ambient; if (spec.sky) { E.skyTop = spec.sky[0]; E.skyHorizon = spec.sky[1] || spec.sky[0]; } if (spec.fog) { E.fogColor = spec.fog.color || E.fogColor; E.fogDensity = spec.fog.density != null ? spec.fog.density : E.fogDensity; } if (spec.exposure) E.exposure = spec.exposure; },
        scene(ctx) { (spec.lights || []).forEach(l => { const p = l.pos || [0, 3, 2]; const o = l.kind === "dir" ? new T.DirectionalLight(l.color || "#fff", (l.intensity == null ? 2 : l.intensity) * Math.PI) : new T.PointLight(l.color || "#fff", l.intensity == null ? 20 : l.intensity, l.distance || 0, 2); o.position.set(p[0], p[1], p[2]); ctx.add(o); if (l.kind === "dir") { o.target.position.set(0, 1, 0); ctx.add(o.target); } if (l.flicker) ctx.every((t, dt, c) => { o.intensity = (l.intensity || 20) * (.85 + .15 * Math.sin(c.time * 14) * Math.sin(c.time * 4.1)); }); }); },
        post: spec.bloom ? [{ pass: "bloom", strength: spec.bloom, threshold: .6 }] : null });
    }
    if (spec.type === "particles") {
      const group = spec.group === "weather" || spec.group === "season" ? spec.group : "atmo";
      return S.register({ group, name: spec.name, ui, env(E) { if (spec.fog != null) E.fogDensity += spec.fog; }, scene(ctx) { ctx.particles({ count: spec.count || 400, area: spec.area || [20, 10, 20], center: spec.center || [0, 4, 0], size: spec.size || .06, color: spec.color || "#ffffff", speed: spec.speed || [0, -1, 0], jitter: spec.jitter || [.3, .3, .3], opacity: spec.opacity == null ? .8 : spec.opacity, glow: !!spec.glow, streak: spec.streak || 0, sway: spec.sway || 0, twinkle: spec.twinkle || 0 }); } });
    }
    if (spec.type === "look") {
      const m = spec.material && S.materials ? S.materials[spec.material] : null;
      return S.register({ group: "style", name: spec.name, ui, material: m || undefined, post: spec.post || [], env: spec.world ? (E => Object.assign(E, spec.world)) : undefined });
    }
    throw new Error("unknown effect type " + spec.type);
  };
})(typeof window !== "undefined" ? window : globalThis);
