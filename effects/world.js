/* 3D effects: time of day, lighting, mood, color grade, weather, season, atmosphere.
   Most are one line of data. env(E) edits the world (sun, sky, fog ...), scene(ctx) adds lights/particles, post lists passes.
   Add a weather type: one entry in WEATHER. Add a light setup: one entry in LIGHT. */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE; const { lerp, smooth, clamp } = S.util;
  const reg = S.registerMany;
  const P = (ctx, o) => ctx.particles(o);
  const assign = o => ({ env(E) { Object.assign(E, o); } });
  const grade = o => ({ pass: "grade", ...o });

  /* ---------- time of day (sun and sky) ---------- */
  reg("time", {
    "dawn": { sunElev: 6, sunAzim: -80, sunColor: "#ffb48a", sun: 1.5, skyTop: "#35457a", skyHorizon: "#f0a37c", ambient: .35, fogColor: "#e6a888", fogDensity: .012, groundColor: "#5a5440" },
    "morning": { sunElev: 28, sunAzim: -55, sunColor: "#fff0cc", sun: 2.2, skyTop: "#5fa3ea", skyHorizon: "#dff0ff", ambient: .6, fogColor: "#dbe9f5" },
    "midday": { sunElev: 78, sunAzim: 20, sunColor: "#ffffff", sun: 3.2, skyTop: "#2f86e6", skyHorizon: "#bfe0ff", ambient: .7 },
    "golden hour sunset": { sunElev: 7, sunAzim: 60, sunColor: "#ff9a4a", sun: 2.8, skyTop: "#5a6fb0", skyHorizon: "#ffb070", ambient: .42, fogColor: "#e8a070", fogDensity: .01, exposure: 1.05 },
    "dusk": { sunElev: -2, sunAzim: 70, sunColor: "#ff7a5a", sun: .5, skyTop: "#1c2250", skyHorizon: "#d86a7a", ambient: .28, fogColor: "#8a5a7a", fogDensity: .01, stars: .3 },
    "night": { sunElev: 40, sunAzim: -140, sunColor: "#8fa8ff", sun: .55, sunDisc: 0, skyTop: "#05070f", skyHorizon: "#10182c", ambient: .16, groundColor: "#1c2026", fogColor: "#0a0f1a", stars: 1, moon: 1 },
    "midnight": { sunElev: 55, sunAzim: -120, sunColor: "#7a92ff", sun: .4, sunDisc: 0, skyTop: "#02030a", skyHorizon: "#080c18", ambient: .1, groundColor: "#14171c", fogColor: "#05080f", stars: 1, moon: 1 },
    "blue hour twilight": { sunElev: -4, sunAzim: 80, sunColor: "#7f9bff", sun: .5, skyTop: "#16235a", skyHorizon: "#7f98d6", ambient: .38, fogColor: "#5a6aa0", fogDensity: .01, stars: .2 },
    "overcast afternoon": { sunElev: 40, sunAzim: 0, sunColor: "#dfe6ee", sun: .8, skyTop: "#9aa4b0", skyHorizon: "#d3d8dd", ambient: .9, fogColor: "#c8cfd6", fogDensity: .01, shadows: false },
    "late evening": { sunElev: 3, sunAzim: 75, sunColor: "#ff8450", sun: 1.4, skyTop: "#3a3f7a", skyHorizon: "#f08a60", ambient: .3, fogColor: "#b06a60", fogDensity: .011 },
    "sunrise over horizon": { sunElev: 4, sunAzim: -70, sunColor: "#ffc78a", sun: 2, skyTop: "#6a7fc0", skyHorizon: "#ffc890", ambient: .4, fogColor: "#f0b890", fogDensity: .01, sunDisc: 2 }
  }, o => assign(o));

  /* ---------- lighting setups ---------- */
  const dirLight = (ctx, color, intensity, pos, shadow) => { const l = new T.DirectionalLight(color, intensity * Math.PI); l.position.set(pos[0], pos[1], pos[2]); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); const c = l.shadow.camera; c.left = -8; c.right = 8; c.top = 8; c.bottom = -8; c.near = .5; c.far = 40; l.shadow.bias = -.0006; } l.target.position.set(0, 1, 0); ctx.add(l); ctx.add(l.target); return l; };
  const point = (ctx, color, intensity, pos, dist) => { const l = new T.PointLight(color, intensity, dist || 0, 2); l.position.set(pos[0], pos[1], pos[2]); l.castShadow = false; ctx.add(l); return l; };
  const dark = { sun: .05, ambient: .1, skyTop: "#0c0d14", skyHorizon: "#14161f", groundColor: "#14151a", fogColor: "#0b0c12", sunDisc: 0, stars: .3 };
  reg("light", {
    "golden hour sunlight": { env: E => Object.assign(E, { sunElev: 12, sunAzim: 55, sunColor: "#ffb066", sun: 3.1, ambient: .45, skyTop: "#6a78b8", skyHorizon: "#ffc088", fogColor: "#f0b080", fogDensity: .009 }) },
    "blue hour": { env: E => Object.assign(E, { sunElev: -3, sunColor: "#7f9bff", sun: .5, ambient: .42, skyTop: "#16235a", skyHorizon: "#7f98d6", fogColor: "#5a6aa0", fogDensity: .01 }) },
    "harsh midday sun": { env: E => Object.assign(E, { sunElev: 82, sunColor: "#ffffff", sun: 4.2, ambient: .32, skyTop: "#2f86e6", skyHorizon: "#bfe0ff" }) },
    "soft overcast light": { env: E => Object.assign(E, { sun: .55, ambient: 1.05, shadows: false, skyTop: "#a8b0ba", skyHorizon: "#dde1e5", fogColor: "#d0d5da", fogDensity: .01 }) },
    "neon lighting": { env: E => Object.assign(E, dark, { skyTop: "#150626", skyHorizon: "#3a0a5e", fogColor: "#2a0a44", fogDensity: .02, exposure: 1.2 }), scene: ctx => { point(ctx, "#ff2fb8", 55, [-2.4, 2.2, 1.6]); point(ctx, "#2fe0ff", 55, [2.4, 2, 1.2]); point(ctx, "#7a4cff", 25, [0, 3, -2]); }, post: [{ pass: "bloom", strength: .7, threshold: .6 }] },
    "candlelight": { env: E => Object.assign(E, dark, { skyTop: "#080604", skyHorizon: "#120a05", fogColor: "#0c0805", ambient: .06 }), scene(ctx) { const l = point(ctx, "#ff9a3a", 7, [.5, 1.35, .7], 9); ctx.every((t, dt, c) => { l.intensity = 7 * (.82 + .18 * Math.sin(c.time * 17) * Math.sin(c.time * 5.3) + .06 * Math.sin(c.time * 31)); }); const f = S.mesh("sphere", "#ffcf80", [.5, 1.35, .7], [.05, .09, .05], { emissive: "#ffb040", emissiveIntensity: 3 }); f.castShadow = false; ctx.add(f); }, post: [{ pass: "bloom", strength: .5, threshold: .7 }] },
    "moonlight": { env: E => Object.assign(E, { sunElev: 38, sunAzim: -135, sunColor: "#8fa8ff", sun: .6, sunDisc: 0, ambient: .17, skyTop: "#05070f", skyHorizon: "#10182c", groundColor: "#1c2026", fogColor: "#0a0f1a", stars: 1, moon: 1 }) },
    "backlit silhouette": { env: E => Object.assign(E, { sunElev: 9, sunAzim: 180, sunColor: "#ffb06a", sun: 5, ambient: .12, skyTop: "#7a5a7a", skyHorizon: "#ffc27a", fogColor: "#ffb070", fogDensity: .012, sunDisc: 2.5 }), post: [{ pass: "godrays", strength: .7 }, { pass: "bloom", strength: .6, threshold: .8 }] },
    "rim lighting": { env: E => Object.assign(E, dark, { ambient: .13, skyTop: "#06070b", skyHorizon: "#10131c" }), scene(ctx) { dirLight(ctx, "#9fc4ff", 4.2, [-3, 3.5, -4], false); dirLight(ctx, "#ffd9a0", 3.4, [3, 3, -4], false); dirLight(ctx, "#ffffff", .35, [0, 2, 5], false); } },
    "low-key chiaroscuro": { env: E => Object.assign(E, dark, { ambient: .04, skyTop: "#08080a", skyHorizon: "#111116" }), scene(ctx) { dirLight(ctx, "#ffe2bd", 4.4, [3, 5, 1.5], true); } },
    "high-key bright": { env: E => Object.assign(E, { ambient: 1.5, sun: 1.8, shadows: false, skyTop: "#f4f6fa", skyHorizon: "#ffffff", groundColor: "#f0f0f2", fogColor: "#ffffff", fogDensity: .004, exposure: 1.15 }) },
    "volumetric god rays": { env: E => Object.assign(E, { sunElev: 24, sunAzim: 170, sunColor: "#fff0cc", sun: 3.2, ambient: .35, fogColor: "#cfd8e0", fogDensity: .014, sunDisc: 2 }), post: [{ pass: "godrays", strength: 1.2, threshold: .65 }] },
    "practical lights": { env: E => Object.assign(E, dark, { ambient: .16, skyTop: "#0a0c14", skyHorizon: "#161a26" }), scene(ctx) { [[-2.2, 1.2], [2.4, -.4]].forEach(([x, z]) => { const lamp = new T.Group(); lamp.add(S.mesh("cyl", "#2a2a30", [0, .7, 0], [.06, 1.4, .06]), S.mesh("sphere", "#ffe2a8", [0, 1.5, 0], [.28, .28, .28], { emissive: "#ffcf80", emissiveIntensity: 2.5 })); lamp.position.set(x, 0, z); ctx.add(lamp); point(ctx, "#ffc878", 14, [x, 1.5, z], 12); }); }, post: [{ pass: "bloom", strength: .5, threshold: .7 }] },
    "studio softbox": { env: E => Object.assign(E, { sun: .6, ambient: .95, skyTop: "#cdcdd2", skyHorizon: "#e8e8ec", groundColor: "#d6d6da", fogColor: "#e0e0e4", fogDensity: .004, sunDisc: 0 }), scene(ctx) { dirLight(ctx, "#ffffff", 2.4, [-3, 4, 4], true); dirLight(ctx, "#dfe8ff", 1.1, [4, 2, 3], false); } },
    "Rembrandt lighting": { env: E => Object.assign(E, dark, { ambient: .12, skyTop: "#0c0a09", skyHorizon: "#1a1411" }), scene(ctx) { dirLight(ctx, "#ffd9aa", 4.2, [-2.5, 3.2, 2.4], true); dirLight(ctx, "#8fa0c0", .5, [3, 1, 2], false); } }
  }, o => o);

  /* ---------- mood: a gentle shift of color, fog and contrast ---------- */
  reg("mood", {
    "calm": { env: E => { E.ambient *= 1.1; }, post: [grade({ saturation: .95, tint: [1.03, 1.01, .98] })] },
    "tense": { env: E => { E.ambient *= .75; E.fogColor = "#7a8590"; E.fogDensity += .004; }, post: [grade({ contrast: 1.18, saturation: .8, tint: [.96, 1, 1.05] }), { pass: "vignette", strength: .55 }] },
    "joyful": { env: E => { E.exposure *= 1.1; }, post: [grade({ saturation: 1.25, tint: [1.04, 1.02, .95] })] },
    "melancholic": { env: E => { E.fogColor = "#8a97a6"; E.fogDensity += .006; }, post: [grade({ saturation: .6, tint: [.9, .97, 1.08], exposure: -.15 })] },
    "mysterious": { env: E => { E.fogColor = "#2a4a58"; E.fogDensity += .015; }, post: [grade({ tint: [.9, 1, 1.05], contrast: 1.08 }), { pass: "vignette", strength: .5 }] },
    "epic": { post: [grade({ contrast: 1.2, saturation: 1.15, highlightTint: [.05, .02, -.02] }), { pass: "bloom", strength: .35, threshold: .8 }] },
    "romantic": { post: [grade({ tint: [1.06, .98, .97], saturation: 1.05 }), { pass: "bloom", strength: .5, threshold: .65 }, { pass: "soft", radius: 1.5, amt: .25 }] },
    "eerie": { env: E => { E.fogColor = "#3d4f44"; E.fogDensity += .02; E.ambient *= .7; }, post: [grade({ saturation: .55, tint: [.9, 1.05, .95] }), { pass: "vignette", strength: .6 }] },
    "energetic": { post: [grade({ saturation: 1.35, contrast: 1.2 }), { pass: "chroma", amount: .0015 }] },
    "nostalgic": { post: [grade({ sepia: .35, saturation: .85, fadeBlack: .06 }), { pass: "grain", amount: .1 }] },
    "dreamlike": { post: [{ pass: "bloom", strength: .8, radius: .8, threshold: .55 }, { pass: "soft", radius: 2, amt: .35 }, grade({ saturation: 1.1, tint: [1.05, .98, 1.06] })] },
    "gritty": { post: [grade({ saturation: .6, contrast: 1.3 }), { pass: "grain", amount: .2 }] }
  }, o => o);

  /* ---------- color grades ---------- */
  reg("grade", {
    "teal and orange": { contrast: 1.1, saturation: 1.15, shadowTint: [-.02, .04, .05], highlightTint: [.06, .02, -.04] },
    "warm golden tones": { tint: [1.08, 1, .88], sepia: .08, saturation: 1.05 },
    "cool desaturated": { tint: [.92, .98, 1.08], saturation: .65 },
    "vibrant saturated": { saturation: 1.5, contrast: 1.12 },
    "pastel soft": { saturation: .8, contrast: .85, lift: [.06, .06, .07] },
    "black and white": { gray: 1, contrast: 1.15 },
    "muted earthy": { saturation: .7, tint: [1.04, 1, .92] },
    "high contrast": { contrast: 1.35 }
  }, o => ({ post: [grade(o)] }));

  /* ---------- weather ---------- */
  const rain = (count, speed, len, wind, op) => ctx => P(ctx, { count, area: [26, 16, 26], center: [0, 8, 0], speed: [wind || 0, -speed, 0], jitter: [.3, 1, .3], streak: len, color: "#cfdceb", opacity: op || .55 });
  const snow = (count, size, wind) => ctx => P(ctx, { count, area: [26, 14, 26], center: [0, 7, 0], speed: [wind || 0, -1.4, 0], jitter: [.4, .5, .4], size, color: "#ffffff", opacity: .9, sway: 1.2 });
  const wet = E => { E.groundColor = "#3c4044"; };
  reg("weather", {
    "clear sky": {},
    "light rain": { env: E => Object.assign(E, { skyTop: "#7c8794", skyHorizon: "#b4bdc6", fogColor: "#9aa6b2", fogDensity: .014, sun: .9, ambient: .8 }), scene: rain(900, 14, .35, 1, .5) },
    "heavy rain": { env: E => Object.assign(E, { skyTop: "#4a5460", skyHorizon: "#7d8a98", fogColor: "#6c7886", fogDensity: .024, sun: .4, ambient: .65 }), scene: rain(2400, 22, .6, 3, .6) },
    "fog": { env: E => Object.assign(E, { fogColor: "#cfd6dc", fogDensity: .06, sun: 1, skyTop: "#c8d0d6", skyHorizon: "#e2e7ea" }) },
    "snowfall": { env: E => Object.assign(E, { groundColor: "#e8eef5", skyTop: "#9fb3c8", skyHorizon: "#e6edf4", fogColor: "#dfe8f0", fogDensity: .016, sun: 1.1, ambient: .95 }), scene: snow(1600, .07) },
    "windy": { env: E => { E.wind = 1; }, scene: ctx => P(ctx, { count: 260, area: [26, 6, 26], center: [0, 2.5, 0], speed: [11, .2, 0], jitter: [2, .5, 1], streak: 1.4, color: "#ffffff", opacity: .2 }), rig(r, t, ctx) { r.shake += .012; } },
    "overcast clouds": { env: E => Object.assign(E, { skyTop: "#8e98a4", skyHorizon: "#d3d8dd", sun: .7, ambient: .95, fogColor: "#c4ccd4", fogDensity: .012 }) },
    "thunderstorm": { env: E => Object.assign(E, { skyTop: "#262d3d", skyHorizon: "#56607a", fogColor: "#3c4558", fogDensity: .022, sun: .25, ambient: .5 }), scene: rain(2400, 24, .65, 4, .55),
      rig(r, t, ctx) { const x = ctx.time * 1.0, f = Math.max(0, Math.sin(x * 2.3) * Math.sin(x * .7 + 1)); const fl = Math.pow(f, 8) > .5 ? Math.pow(f, 8) : 0; r.flash += fl * .55; } },
    "sandstorm": { env: E => Object.assign(E, { skyTop: "#c9985a", skyHorizon: "#e8c88a", fogColor: "#c9985a", fogDensity: .045, sun: 1.4, groundColor: "#b8884a" }), scene: ctx => P(ctx, { count: 2000, area: [26, 8, 26], center: [0, 3, 0], speed: [13, 0, 0], jitter: [3, 1, 2], streak: .6, color: "#d9b27a", opacity: .5 }), rig(r) { r.shake += .01; } },
    "drizzle": { env: E => Object.assign(E, { skyTop: "#8a98a6", skyHorizon: "#bcc6ce", fogColor: "#aab4bc", fogDensity: .012, sun: 1, ambient: .85 }), scene: rain(450, 10, .22, .4, .4) },
    "mist": { env: E => Object.assign(E, { fogColor: "#dfe5e8", fogDensity: .03, skyHorizon: "#eef2f4" }) },
    "hail": { env: E => Object.assign(E, { skyTop: "#56606c", skyHorizon: "#8a95a2", fogColor: "#7a8590", fogDensity: .016, sun: .5 }), scene: ctx => P(ctx, { count: 700, area: [26, 14, 26], center: [0, 7, 0], speed: [1, -17, 0], jitter: [.5, 2, .5], size: .09, color: "#eef4ff", opacity: .95 }) },
    "humid haze": { env: E => Object.assign(E, { skyTop: "#e3c98a", skyHorizon: "#fff2cc", fogColor: "#e8d49a", fogDensity: .02, sun: 1.6 }), post: [{ pass: "bloom", strength: .3, threshold: .7 }] },
    "blizzard": { env: E => Object.assign(E, { groundColor: "#eef3f8", skyTop: "#b8c6d4", skyHorizon: "#e9eff4", fogColor: "#e1e9f0", fogDensity: .05, sun: .6, wind: 2 }), scene: snow(2600, .09, 9), rig(r) { r.shake += .02; } },
    "aurora skies": { env: E => Object.assign(E, { sunElev: 30, sunAzim: -150, sunColor: "#8fa8ff", sun: .45, sunDisc: 0, ambient: .2, skyTop: "#04060f", skyHorizon: "#0e1a2c", groundColor: "#2a3340", fogColor: "#0a1220", stars: 1, aurora: 1.1 }) },
    "rainbow after rain": { env: E => Object.assign(E, { skyTop: "#6aa8e6", skyHorizon: "#d8ecff", groundColor: "#4a5a40", fogDensity: .005 }), scene(ctx) { const cols = ["#ff3b3b", "#ff9a2e", "#ffe14a", "#4bd05a", "#3a9bff", "#5a4bd8", "#a24bd8"]; cols.forEach((c, i) => { const m = new T.Mesh(new T.RingGeometry(140 - i * 3.2, 143 - i * 3.2, 64, 1, 0, Math.PI), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .4, side: T.DoubleSide, fog: false, depthWrite: false })); m.position.set(0, 0, -260); m.userData.noStyle = true; ctx.add(m); }); } }
  }, o => o);

  /* ---------- season ---------- */
  reg("season", {
    "spring": { env: E => Object.assign(E, { groundColor: "#6fa857", foliage: "#6bbf5a", skyTop: "#7fb8ee", skyHorizon: "#e9f7ff" }), scene: ctx => P(ctx, { count: 90, area: [20, 8, 20], center: [0, 4, 0], speed: [.3, -.5, 0], jitter: [.3, .2, .3], size: .06, color: "#ffd1e3", opacity: .8, sway: 1.5 }) },
    "summer": { env: E => Object.assign(E, { groundColor: "#5f9a3a", foliage: "#3f8f34", sun: 3 }) },
    "autumn": { env: E => Object.assign(E, { groundColor: "#8a6a3a", foliage: "#d9792b", skyTop: "#d9a36a", skyHorizon: "#f4dcb0" }), scene: ctx => P(ctx, { count: 140, area: [20, 8, 20], center: [0, 4, 0], speed: [.5, -1.1, 0], jitter: [.5, .3, .5], size: .11, color: "#d9722a", opacity: .95, sway: 2 }) },
    "winter": { env: E => Object.assign(E, { groundColor: "#eef3f8", foliage: "#dfe8ee", bare: 1, skyTop: "#a9bfd6", skyHorizon: "#eef3f8", fogColor: "#e1e9f0", fogDensity: .01 }), scene: snow(300, .05) },
    "monsoon season": { env: E => Object.assign(E, { groundColor: "#3f6a4a", foliage: "#2f6a3f", skyTop: "#556a7c", skyHorizon: "#9aa9b6", fogColor: "#7d8e9a", fogDensity: .018, sun: .6 }), scene: rain(1500, 18, .5, 2, .55) },
    "early spring blossoms": { env: E => Object.assign(E, { groundColor: "#9ccc7a", foliage: "#f2b6cf", skyTop: "#a8d8f0", skyHorizon: "#f6fbff" }), scene: ctx => P(ctx, { count: 220, area: [20, 8, 20], center: [0, 4, 0], speed: [.4, -.6, 0], jitter: [.3, .2, .3], size: .08, color: "#ffc2d9", opacity: .9, sway: 1.8 }) },
    "late autumn with bare trees": { env: E => Object.assign(E, { groundColor: "#6a5a46", foliage: "#7a6a58", bare: 1, skyTop: "#9a9a9a", skyHorizon: "#d8d4cc", fogColor: "#b8b4aa", fogDensity: .014, sun: 1.2 }), scene: ctx => P(ctx, { count: 50, area: [20, 8, 20], center: [0, 3, 0], speed: [.4, -1, 0], jitter: [.4, .3, .4], size: .1, color: "#7a5a38", opacity: .9, sway: 2 }) },
    "midsummer heat": { env: E => Object.assign(E, { groundColor: "#cda45a", skyTop: "#ffcf7a", skyHorizon: "#fff0c4", sun: 3.6, fogColor: "#fff0c4", fogDensity: .006 }), post: [{ pass: "heat", amount: .004 }] }
  }, o => o);

  /* ---------- atmosphere and particles ---------- */
  const c0 = [0, 1.6, 0];
  const glowP = (o) => ctx => P(ctx, Object.assign({ area: [10, 4, 10], center: c0, glow: true }, o));
  reg("atmo", {
    "light fog": { env: E => { E.fogDensity += .014; E.fogColor = "#d4dbe0"; } },
    "dust particles in the air": { scene: glowP({ count: 500, size: .035, color: "#fff2c8", speed: [.03, .02, 0], jitter: [.08, .06, .08], opacity: .55, twinkle: .1 }) },
    "drifting smoke": { scene: ctx => P(ctx, { count: 70, area: [8, 3, 8], center: [0, 1.5, -1], size: 1.4, color: "#8a8f96", opacity: .1, speed: [.35, .3, 0], jitter: [.2, .15, .2], sway: .6 }) },
    "falling snow": { scene: snow(1200, .06) },
    "floating embers": { scene: glowP({ count: 160, size: .05, color: "#ff8a2a", speed: [.15, .9, 0], jitter: [.3, .3, .3], opacity: .95, twinkle: .6, sway: .8 }) },
    "lens flare": { post: [{ pass: "streak", strength: 1, threshold: .7 }, { pass: "bloom", strength: .5, threshold: .75 }], env: E => { E.sunDisc = Math.max(E.sunDisc, 2); } },
    "rain streaks": { scene: rain(900, 14, .35, 1, .5) },
    "glowing fireflies": { scene: glowP({ count: 90, area: [12, 3, 12], center: [0, 1.6, 0], size: .09, color: "#d8ff5a", speed: [0, .05, 0], jitter: [.35, .25, .35], opacity: .95, twinkle: .8, sway: .6 }) },
    "heat haze": { post: [{ pass: "heat", amount: .005 }] },
    "falling leaves": { scene: ctx => P(ctx, { count: 120, area: [20, 8, 20], center: [0, 4, 0], speed: [.5, -1, 0], jitter: [.5, .3, .5], size: .1, color: "#c8702a", opacity: .95, sway: 2 }) },
    "floating pollen": { scene: glowP({ count: 300, size: .03, color: "#ffe36a", speed: [.05, .03, 0], jitter: [.12, .08, .12], opacity: .7 }) },
    "rising steam": { scene: ctx => P(ctx, { count: 40, area: [3, 3, 3], center: [0, 1.5, .5], size: .9, color: "#eef2f5", opacity: .16, speed: [.05, .6, 0], jitter: [.1, .1, .1] }) },
    "flying sparks": { scene: glowP({ count: 130, area: [6, 4, 6], size: .04, color: "#ffc24a", speed: [.5, 1.4, 0], jitter: [1.4, 1, 1.4], opacity: 1, twinkle: 1 }) },
    "neon haze": { env: E => { E.fogColor = "#7a1fa8"; E.fogDensity += .03; }, post: [{ pass: "bloom", strength: .5, threshold: .7 }] },
    "mist rolling over the ground": { scene: ctx => P(ctx, { count: 45, area: [24, .6, 24], center: [0, .35, 0], size: 3.2, color: "#e6ecef", opacity: .14, speed: [.5, 0, 0], jitter: [.2, .02, .2] }) },
    "cherry blossom petals": { scene: ctx => P(ctx, { count: 260, area: [20, 8, 20], center: [0, 4, 0], speed: [.5, -.7, 0], jitter: [.4, .25, .4], size: .08, color: "#ffc2d9", opacity: .9, sway: 2 }) },
    "falling ash": { env: E => { E.fogColor = "#6a6a6e"; E.fogDensity += .008; }, scene: ctx => P(ctx, { count: 500, area: [24, 12, 24], center: [0, 6, 0], speed: [.3, -.7, 0], jitter: [.3, .3, .3], size: .05, color: "#b8b8bc", opacity: .75, sway: .8 }) },
    "magical sparkles": { scene: glowP({ count: 220, area: [8, 4, 8], size: .06, color: "#9fe8ff", speed: [0, .25, 0], jitter: [.3, .2, .3], opacity: 1, twinkle: 1.2, sway: .5 }) },
    "floating bubbles": { scene: ctx => P(ctx, { count: 70, area: [10, 6, 10], center: [0, 3, 0], size: .24, color: "#bfe8ff", opacity: .3, speed: [0, .5, 0], jitter: [.1, .15, .1], sway: .6 }) },
    "confetti": { scene(ctx) { ["#ff4d6d", "#ffd23f", "#3bceac", "#4d8cff", "#c77dff"].forEach(c => P(ctx, { count: 60, area: [14, 10, 14], center: [0, 5, 0], speed: [0, -1.6, 0], jitter: [.6, .5, .6], size: .12, color: c, opacity: 1, sway: 2.5 })); } }
  }, o => o);
})(typeof window !== "undefined" ? window : globalThis);
