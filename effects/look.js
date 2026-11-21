/* 3D effects: visual styles. A style is a chain of post-processing passes (see stage/passes.js) and, for cartoon, ink, clay and
   low-poly looks, a material swap that is applied to every object. Add a style: one entry below.
     post: [ {pass:"outline", thickness:1.5}, {pass:"grade", saturation:1.3} ]
     material: m => new THREE.MeshToonMaterial({ color: m.color })     // optional: replace every material
     env: E => { E.skyTop = "#fff" }                                    // optional: change the world
   Custom styles made in the app use one of the "look:" presets at the bottom. */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE;
  const reg = S.registerMany;
  const G = o => ({ pass: "grade", ...o });

  /* material swaps */
  let _ramp; const ramp = () => { if (_ramp) return _ramp; const d = new T.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, T.RedFormat); d.minFilter = d.magFilter = T.NearestFilter; d.needsUpdate = true; d.userData.shared = true; return (_ramp = d); };
  const std = m => m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial);
  const copy = (m, o) => Object.assign({ color: m.color, side: m.side, transparent: m.transparent, opacity: m.opacity }, o);
  const toon = m => std(m) ? new T.MeshToonMaterial(copy(m, { emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, gradientMap: ramp() })) : null;
  const flat = m => { if (!std(m)) return null; const c = m.color.clone(); if (m.emissive && m.emissiveIntensity > 0 && (m.emissive.r + m.emissive.g + m.emissive.b) > .05) c.lerp(m.emissive, .6); return new T.MeshBasicMaterial(copy(m, { color: c })); };
  const ink = (m, mesh) => std(m) ? new T.MeshBasicMaterial({ color: mesh.userData.ground ? "#e4dfd2" : "#0b0b0e", side: m.side }) : null;
  const clay = m => std(m) ? new T.MeshStandardMaterial(copy(m, { roughness: 1, metalness: 0, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity })) : null;
  const plastic = m => std(m) ? new T.MeshStandardMaterial(copy(m, { roughness: .22, metalness: .05, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity })) : null;
  const lowpoly = m => std(m) ? new T.MeshStandardMaterial(copy(m, { roughness: .9, flatShading: true, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity })) : null;
  S.materials = { toon, flat, ink, clay, plastic, lowpoly };
  const light = (a, b, g) => E => { E.skyTop = a; E.skyHorizon = b; E.groundColor = g; E.fogColor = b; E.stars = 0; E.moon = 0; E.sunDisc = 0; };
  const OUT = (t, th, c) => ({ pass: "outline", thickness: t || 1.4, threshold: th || .2, lineColor: c || "#14141c" });

  reg("style", {
    /* photo and film */
    "cinematic film look": { post: [{ pass: "bloom", strength: .22, threshold: .85 }, G({ contrast: 1.12, saturation: .95, shadowTint: [-.01, .01, .02], highlightTint: [.02, .01, 0] }), { pass: "grain", amount: .05 }, { pass: "vignette", strength: .3 }, { pass: "letterbox", ratio: 2.39 }] },
    "documentary realism": { rig(r) { r.shake += .035; }, post: [G({ saturation: .85, contrast: 1.04 }), { pass: "grain", amount: .05 }] },
    "hyper-realistic": { post: [{ pass: "bloom", strength: .12, threshold: .9 }, G({ contrast: 1.1, saturation: 1.05 })] },
    "filmic grain and halation": { post: [{ pass: "bloom", strength: .5, radius: .9, threshold: .65 }, G({ tint: [1.03, 1, .97] }), { pass: "grain", amount: .17 }] },
    "vintage 16mm film": { post: [G({ sepia: .35, saturation: .85, fadeBlack: .05, contrast: 1.05 }), { pass: "grain", amount: .22 }, { pass: "vignette", strength: .5 }] },
    "noir black and white": { post: [G({ gray: 1, contrast: 1.4 }), { pass: "grain", amount: .12 }, { pass: "vignette", strength: .55 }] },
    "silent-film monochrome": { rig(r) { r.shake += .01; }, post: [G({ gray: 1, sepia: .4, contrast: 1.1 }), { pass: "grain", amount: .3 }, { pass: "vignette", strength: .6 }], scene(ctx) { ctx.fps = 16; } },
    "Super 8 home movie": { rig(r) { r.shake += .02; }, post: [G({ saturation: 1.25, sepia: .15, fadeBlack: .06 }), { pass: "chroma", amount: .002 }, { pass: "grain", amount: .25 }, { pass: "vignette", strength: .5 }] },
    "found-footage camcorder": { rig(r) { r.shake += .08; }, post: [{ pass: "vhs", amount: .6 }, G({ saturation: .85 }), { pass: "grain", amount: .1 }] },
    /* flat and graphic */
    "flat cartoon": { material: flat, post: [OUT(1.6, .16), G({ saturation: 1.4 })] },
    "ink silhouette": { material: ink, env: light("#efeadc", "#efeadc", "#e4dfd2"), post: [{ pass: "grain", amount: .05 }] },
    "vintage comic half-tone": { material: toon, post: [{ pass: "posterize", levels: 6 }, OUT(1.5, .2), { pass: "halftone", size: 6, mode: 0, strength: .9 }, G({ saturation: 1.25, sepia: .1 })] },
    "paper cut-out": { material: flat, post: [OUT(1, .25, "#40384a"), G({ saturation: 1.1 }), { pass: "paper", amount: .25 }] },
    "line art": { material: m => std(m) ? new T.MeshBasicMaterial({ color: "#f8f8f8", side: m.side }) : null, env: light("#ffffff", "#ffffff", "#f1f1f1"), post: [OUT(1.2, .035, "#202024")] },
    "vector motion graphics": { material: flat, post: [{ pass: "posterize", levels: 9 }, G({ saturation: 1.5 })] },
    "isometric illustration": { material: toon, rig(r) { r.fov0 = 9; r.pitch = 35; r.yaw += 45; }, post: [OUT(1.3, .2, "#2a2c3a"), G({ saturation: 1.3 })] },
    "minimalist": { material: flat, env: light("#eceae6", "#f4f2ee", "#e2e0dc"), post: [G({ saturation: .35, contrast: .95 })] },
    /* pixel and retro */
    "8-bit sprite": { material: flat, post: [{ pass: "pixelate", size: 8, levels: 5, dither: .12 }, G({ saturation: 1.6, contrast: 1.2 })] },
    "16-bit pixel art": { material: toon, post: [{ pass: "pixelate", size: 5, levels: 8, dither: .1 }, G({ saturation: 1.4 })] },
    "CRT arcade": { post: [{ pass: "pixelate", size: 4, levels: 8, dither: .1 }, { pass: "bloom", strength: .22, threshold: .92 }, { pass: "scan", intensity: .3, curve: .06, mask: .15 }, { pass: "chroma", amount: .002 }] },
    "low-poly PS1": { material: lowpoly, post: [{ pass: "pixelate", size: 3, levels: 24, dither: .3 }, G({ saturation: 1.1 })], scene(ctx) { ctx.fps = 15; } },
    "VHS retro": { post: [{ pass: "vhs", amount: 1 }, { pass: "chroma", amount: .0025 }, G({ saturation: 1.15 })] },
    "synthwave": { env: E => Object.assign(E, { skyTop: "#1a0a3a", skyHorizon: "#ff4fa8", fogColor: "#6a1a7a", sunElev: 6, sunAzim: 180, sunColor: "#ff6ac8" }), post: [{ pass: "bloom", strength: .7, threshold: .55 }, G({ shadowTint: [.03, 0, .08], highlightTint: [.06, .02, .03] }), { pass: "scan", intensity: .2, curve: 0, mask: 0 }] },
    /* hand-drawn and painted */
    "anime": { material: toon, post: [OUT(1.2, .22), { pass: "bloom", strength: .25, threshold: .8 }, G({ saturation: 1.35, contrast: 1.08 })] },
    "90s cel animation": { material: toon, post: [OUT(1.3, .2), { pass: "grain", amount: .1 }, G({ saturation: 1.2, sepia: .08 })] },
    "manga ink": { material: toon, env: light("#f2efe6", "#f2efe6", "#e9e6dc"), post: [OUT(1.6, .16), { pass: "halftone", size: 5, mode: 1, strength: 1 }, G({ gray: 1, contrast: 1.2 })] },
    "watercolor painting": { post: [{ pass: "paint", radius: 2.2, sigma: .14 }, { pass: "soft", radius: 1.4, amt: .35 }, G({ saturation: .9 }), { pass: "paper", amount: .2, edgeDark: .3 }] },
    "pencil sketch": { post: [{ pass: "sketch", spacing: 5, colorMix: 0 }] },
    "oil painting": { post: [{ pass: "paint", radius: 3.2, sigma: .2 }, { pass: "bloom", strength: .12 }, G({ saturation: 1.15 }), { pass: "grain", amount: .05 }] },
    "chalk blackboard": { env: light("#1d2a24", "#1d2a24", "#1d2a24"), post: [{ pass: "sketch", spacing: 6, ink: "#f2f2ea", paperColor: "#1d2a24", edge: .2, strength: 1 }, { pass: "grain", amount: .1 }] },
    "storybook illustration": { material: toon, post: [{ pass: "paint", radius: 1.8, sigma: .16 }, OUT(1, .3, "#6a4a3a"), G({ tint: [1.05, 1.01, .94], saturation: 1.1 }), { pass: "paper", amount: .18 }] },
    "ukiyo-e woodblock": { material: flat, post: [{ pass: "posterize", levels: 5 }, OUT(1.8, .15, "#1a1a22"), G({ saturation: .8, tint: [1, .97, .9] }), { pass: "paper", amount: .3 }, { pass: "grain", amount: .08 }] },
    "fantasy illustration": { post: [{ pass: "paint", radius: 2, sigma: .16 }, { pass: "bloom", strength: .5, threshold: .6 }, G({ saturation: 1.25, highlightTint: [.04, 0, .07] })] },
    /* 3D and craft */
    "3D Pixar-style animation": { material: plastic, post: [{ pass: "bloom", strength: .3, threshold: .75 }, { pass: "dof", aperture: .004 }, G({ saturation: 1.2, tint: [1.03, 1.01, .98] }), { pass: "vignette", strength: .15 }] },
    "claymation stop-motion": { material: clay, scene(ctx) { ctx.fps = 12; }, post: [G({ saturation: 1.1, sepia: .06 }), { pass: "grain", amount: .12 }] },
    "felt and puppet": { material: clay, scene(ctx) { ctx.fps = 12; }, post: [{ pass: "grain", amount: .28, size: 1.1 }, G({ saturation: 1.05 })] },
    "toy miniature": { material: plastic, post: [{ pass: "tiltshift", amount: 3.5 }, G({ saturation: 1.4 })] },
    "low-poly 3D": { material: lowpoly, post: [G({ saturation: 1.2 })] },
    "voxel blocks": { material: flat, post: [{ pass: "pixelate", size: 6 }, G({ saturation: 1.3 })] },
    "tilt-shift miniature": { post: [{ pass: "tiltshift", amount: 4, band: .14 }, G({ saturation: 1.45, contrast: 1.1 })] },
    /* mood and genre */
    "cyberpunk": { env: E => { E.sun *= .3; E.ambient *= .6; E.skyTop = "#150a2a"; E.skyHorizon = "#4a1a6a"; E.fogColor = "#3a1a5a"; E.fogDensity += .01; }, post: [{ pass: "bloom", strength: .8, threshold: .55 }, G({ shadowTint: [-.01, .02, .06], highlightTint: [.07, 0, .05], contrast: 1.15 }), { pass: "chroma", amount: .0015 }] },
    "neon noir": { env: E => { E.sun *= .2; E.ambient = .4; E.skyTop = "#14081e"; E.skyHorizon = "#3a0f4a"; E.fogColor = "#3a0f4a"; E.fogDensity += .012; E.stars = Math.max(E.stars, .3); }, post: [G({ shadowTint: [.02, 0, .06], highlightTint: [.05, 0, .04], contrast: 1.3 }), { pass: "bloom", strength: .6, threshold: .6 }, { pass: "vignette", strength: .5 }] },
    "surreal": { post: [G({ tint: [1.1, .9, 1.2], saturation: 1.4 }), { pass: "chroma", amount: .004 }, { pass: "fisheye", strength: .2 }] },
    "dreamy pastel": { post: [{ pass: "soft", radius: 2, amt: .45 }, { pass: "bloom", strength: .7, threshold: .5 }, G({ saturation: .85, contrast: .85, lift: [.06, .05, .07], tint: [1.04, 1, 1.05] })] },
    "dark gothic": { env: E => { E.sun *= .35; E.ambient *= .6; E.skyTop = "#1a1620"; E.skyHorizon = "#3a3040"; E.fogColor = "#2a2030"; E.fogDensity += .014; }, post: [G({ saturation: .6, contrast: 1.35 }), { pass: "vignette", strength: .65 }] },
    "retro-futurism": { post: [G({ sepia: .2, tint: [1.08, 1, .88], saturation: 1.2 }), { pass: "grain", amount: .12 }, { pass: "bloom", strength: .3 }] },
    /* presets used by styles the user makes in the app (the "Preview looks like" choice) */
    "look:none": {}, "look:flat": { material: flat, post: [OUT(1.5, .17), G({ saturation: 1.4 })] }, "look:ink": { material: ink, env: light("#efeadc", "#efeadc", "#e4dfd2") },
    "look:pixel": { material: flat, post: [{ pass: "pixelate", size: 7, levels: 4, dither: .5 }, G({ saturation: 1.5 })] }, "look:halftone": { material: toon, post: [OUT(1.4, .2), { pass: "halftone", size: 6, mode: 0 }, G({ saturation: 1.2 })] },
    "look:painted": { post: [{ pass: "paint", radius: 2.4, sigma: .15 }, { pass: "paper", amount: .2 }, G({ saturation: .9 })] }, "look:clay": { material: clay, scene(ctx) { ctx.fps = 12; }, post: [{ pass: "grain", amount: .12 }] },
    "look:film": { post: [G({ sepia: .35, saturation: .85 }), { pass: "grain", amount: .22 }, { pass: "vignette", strength: .5 }] }, "look:neon": { post: [{ pass: "bloom", strength: .8, threshold: .55 }, G({ saturation: 1.4, shadowTint: [.02, 0, .06] })] },
    "look:mono": { post: [G({ gray: 1, contrast: 1.3 })] }
  }, o => o);
})(typeof window !== "undefined" ? window : globalThis);
