/* Promptoo styles. Add a style = add one line to a family.
   n  name (this is the value stored in a scene, shown on the pill and used by the checker)
   w  wording that goes into the prompt (optional: the name is used if missing). Describe traits, not artists or studios.
   Preview recipe: f css filter, ov overlay color/gradient, cls, bars, grain, lines, dots (halftone), grid (pixel grid)
   m  1 = this style defines the whole medium (photo, flat, pixel, drawn, 3D). Two of those from different families are flagged.
   Users can add their own on the Style tab. They are kept in this browser (promptoo.styles.v1) and added to these families. */
(function () {
  const FAMS = [
    { id: "photo", label: "Photo & film", items: [
      { n: "cinematic film look", f: "contrast(1.15) saturate(.9)", bars: 1, m: 1, w: "cinematic film look, shallow depth of field, rich contrast" },
      { n: "documentary realism", f: "saturate(.75) contrast(1.05)", cls: "a-hand", m: 1, w: "documentary realism, natural light, handheld, unpolished" },
      { n: "hyper-realistic", f: "contrast(1.15) saturate(1.1)", m: 1, w: "hyper-realistic, sharp detail, true-to-life textures" },
      { n: "filmic grain and halation", f: "contrast(1.08) saturate(.95)", grain: 1, w: "filmic grain, soft halation glow around bright highlights" },
      { n: "vintage 16mm film", f: "sepia(.45) contrast(1.05) saturate(.85)", grain: 1, m: 1, w: "vintage 16mm film, soft grain, warm faded color" },
      { n: "noir black and white", f: "grayscale(1) contrast(1.55)", m: 1, w: "black-and-white noir, hard shadows, high contrast" },
      { n: "silent-film monochrome", f: "grayscale(1) sepia(.35) contrast(1.1)", grain: 1, m: 1, w: "silent-film look, flickering monochrome, soft vignette, jerky frame rate" },
      { n: "Super 8 home movie", f: "sepia(.3) saturate(1.3) contrast(.95) brightness(1.05)", grain: 1, m: 1, w: "Super 8 home-movie look, light leaks, faded warm color, gentle shake" },
      { n: "found-footage camcorder", f: "saturate(.8) contrast(1.1)", lines: 1, cls: "a-hand", m: 1, w: "found-footage camcorder look, handheld, low resolution, date stamp feel" }
    ] },
    { id: "flat", label: "Flat & graphic", items: [
      { n: "flat cartoon", f: "saturate(1.8) contrast(1.35) brightness(1.08)", m: 1, w: "flat 2D cartoon, solid colors, no gradients, thick clean outlines" },
      { n: "ink silhouette", f: "grayscale(1) contrast(6) brightness(.85)", m: 1, w: "ink silhouette animation, solid black shapes against a plain light background, no interior detail" },
      { n: "vintage comic half-tone", f: "sepia(.25) saturate(1.3) contrast(1.25)", dots: 1, m: 1, w: "vintage comic-book print, half-tone dots, bold ink outlines, limited color palette" },
      { n: "paper cut-out", f: "saturate(1.2) contrast(1.1)", ov: "linear-gradient(135deg,rgba(255,255,255,.18),transparent 60%)", m: 1, w: "paper cut-out animation, layered flat paper shapes, soft drop shadows, visible paper texture" },
      { n: "line art", f: "grayscale(1) contrast(2.2) brightness(1.5)", m: 1, w: "clean line art, thin black outlines on white, no fill or shading" },
      { n: "vector motion graphics", f: "saturate(1.6) contrast(1.2) brightness(1.1)", m: 1, w: "vector motion graphics, flat geometric shapes, smooth gradients, crisp edges" },
      { n: "isometric illustration", f: "saturate(1.4) contrast(1.15) brightness(1.08)", grid: 1, m: 1, w: "isometric illustration, clean geometric blocks, fixed isometric angle, soft shadows" },
      { n: "minimalist", f: "saturate(.25) brightness(1.2) contrast(.9)", w: "minimalist, few elements, lots of empty space, restrained palette" }
    ] },
    { id: "pixel", label: "Pixel & retro", items: [
      { n: "8-bit sprite", f: "saturate(1.9) contrast(1.5)", grid: 1, m: 1, w: "8-bit pixel-art sprite animation, chunky square pixels, very limited color palette, no smoothing" },
      { n: "16-bit pixel art", f: "saturate(1.5) contrast(1.25)", grid: 1, m: 1, w: "16-bit pixel art, detailed sprites, dithered shading, side-scroller game look" },
      { n: "CRT arcade", f: "saturate(1.6) contrast(1.3)", lines: 1, grid: 1, m: 1, w: "retro CRT arcade look, glowing scanlines, bright saturated pixels" },
      { n: "low-poly PS1", f: "saturate(1.1) contrast(1.15)", grid: 1, m: 1, w: "low-poly 90s 3D game look, jagged polygons, warped textures, flat shading" },
      { n: "VHS retro", f: "saturate(1.3) contrast(1.1)", lines: 1, cls: "chroma", w: "VHS retro look, tracking lines, color bleed, soft analog blur" },
      { n: "synthwave", f: "hue-rotate(280deg) saturate(2) contrast(1.2)", ov: "linear-gradient(rgba(255,60,200,.28),rgba(40,200,255,.2))", w: "synthwave, neon pink and cyan grid, glowing sunset, 80s retro-futurism" }
    ] },
    { id: "drawn", label: "Hand-drawn & painted", items: [
      { n: "anime", f: "saturate(1.7) contrast(1.15) brightness(1.05)", m: 1, w: "anime style, clean cel shading, expressive eyes, dynamic speed lines" },
      { n: "90s cel animation", f: "saturate(1.35) contrast(1.1) sepia(.12)", grain: 1, m: 1, w: "1990s hand-painted cel animation, slightly soft film transfer, bold flat colors, visible ink lines" },
      { n: "manga ink", f: "grayscale(1) contrast(2)", dots: 1, m: 1, w: "black-and-white manga ink drawing, screentone shading, sharp linework, dramatic panels" },
      { n: "watercolor painting", f: "blur(.8px) saturate(.85) brightness(1.1)", ov: "rgba(255,250,235,.28)", m: 1, w: "watercolor painting, soft bleeding edges, translucent washes, visible paper texture" },
      { n: "pencil sketch", f: "grayscale(1) contrast(1.2) brightness(1.25)", grain: 1, m: 1, w: "pencil sketch, graphite shading, visible hatching, rough hand-drawn lines on paper" },
      { n: "oil painting", f: "saturate(1.25) contrast(1.1) blur(.5px)", grain: 1, m: 1, w: "oil painting, thick visible brush strokes, rich blended color, canvas texture" },
      { n: "chalk blackboard", f: "grayscale(1) contrast(1.4) brightness(.8)", ov: "rgba(20,40,30,.55)", grain: 1, m: 1, w: "white chalk drawing on a dark green blackboard, dusty smudged strokes" },
      { n: "storybook illustration", f: "saturate(1.15) brightness(1.1) contrast(.95)", ov: "rgba(255,240,210,.22)", m: 1, w: "children's storybook illustration, soft gouache textures, warm gentle colors, rounded friendly shapes" },
      { n: "ukiyo-e woodblock", f: "saturate(.8) contrast(1.2) sepia(.3)", grain: 1, m: 1, w: "Japanese woodblock print look, flat areas of muted color, bold dark outlines, paper grain" },
      { n: "fantasy illustration", f: "saturate(1.5) hue-rotate(-25deg) brightness(1.05)", ov: "linear-gradient(rgba(190,120,255,.25),transparent)", m: 1, w: "detailed fantasy illustration, painterly, dramatic glowing light" }
    ] },
    { id: "craft", label: "3D & craft", items: [
      { n: "3D Pixar-style animation", f: "saturate(1.35) brightness(1.12) contrast(.95)", m: 1, w: "stylized 3D animated feature look, soft rounded shapes, expressive characters, glossy lighting" },
      { n: "claymation stop-motion", f: "saturate(1.15) contrast(.9) sepia(.15)", grain: 1, m: 1, w: "claymation stop-motion, visible fingerprints in the clay, slightly jerky frame rate, handmade sets" },
      { n: "felt and puppet", f: "saturate(1.1) contrast(.9) sepia(.1)", grain: 1, m: 1, w: "handmade felt puppets and fabric sets, visible stitching and fuzz, soft stop-motion movement" },
      { n: "toy miniature", f: "saturate(1.4) contrast(1.1) brightness(1.1)", ov: "linear-gradient(transparent 40%,rgba(255,255,255,.15))", m: 1, w: "plastic toy miniature world, glossy molded figures, tilt-shift shallow focus" },
      { n: "low-poly 3D", f: "saturate(1.3) contrast(1.15)", m: 1, w: "low-poly 3D, faceted flat-shaded triangles, simple clean colors" },
      { n: "voxel blocks", f: "saturate(1.5) contrast(1.2)", grid: 1, m: 1, w: "voxel art, everything built from small cubes, blocky world, soft ambient occlusion" },
      { n: "tilt-shift miniature", f: "saturate(1.45) contrast(1.1) brightness(1.08)", ov: "linear-gradient(rgba(255,255,255,.2),transparent 30%,transparent 70%,rgba(255,255,255,.2))", w: "tilt-shift miniature look, extreme top and bottom blur, saturated toy-like color" }
    ] },
    { id: "mood", label: "Mood & genre", items: [
      { n: "cyberpunk", f: "hue-rotate(250deg) saturate(2) contrast(1.2)", w: "cyberpunk, neon-lit rain-soaked streets, high-tech and decay" },
      { n: "neon noir", f: "hue-rotate(270deg) saturate(1.8) contrast(1.4)", ov: "linear-gradient(rgba(255,0,140,.22),rgba(0,160,255,.18))", w: "neon noir, deep shadows lit by pink and blue neon, wet reflective surfaces" },
      { n: "surreal", f: "hue-rotate(130deg) saturate(1.8)", w: "surreal, dreamlike impossible imagery, strange scale and juxtaposition" },
      { n: "dreamy pastel", f: "saturate(.9) brightness(1.18) contrast(.85)", ov: "linear-gradient(rgba(255,200,230,.3),rgba(190,220,255,.25))", w: "dreamy pastel look, soft glow, hazy light, gentle pink and blue tones" },
      { n: "dark gothic", f: "saturate(.7) contrast(1.4) brightness(.8)", ov: "rgba(30,0,40,.3)", w: "dark gothic, candlelit shadows, ornate decay, brooding atmosphere" },
      { n: "retro-futurism", f: "sepia(.35) saturate(1.5) hue-rotate(-10deg)", grain: 1, w: "1970s retro-futurism, chrome and orange tones, optimistic space-age design" }
    ] }
  ];

  /* looks the user can pick for the preview of a custom style */
  const LOOKS = {
    none: { label: "No change", f: "none" },
    flat: { label: "Flat colors", f: "saturate(1.8) contrast(1.35) brightness(1.08)" },
    ink: { label: "Black ink", f: "grayscale(1) contrast(6) brightness(.85)" },
    pixel: { label: "Pixel grid", f: "saturate(1.9) contrast(1.5)", grid: 1 },
    halftone: { label: "Half-tone dots", f: "sepia(.25) saturate(1.3) contrast(1.25)", dots: 1 },
    painted: { label: "Painted", f: "blur(.8px) saturate(.9) brightness(1.1)", ov: "rgba(255,250,235,.25)" },
    clay: { label: "Handmade / clay", f: "saturate(1.15) contrast(.9) sepia(.15)", grain: 1 },
    film: { label: "Old film", f: "sepia(.4) contrast(1.05) saturate(.85)", grain: 1 },
    neon: { label: "Neon", f: "hue-rotate(260deg) saturate(2) contrast(1.2)" },
    mono: { label: "Black and white", f: "grayscale(1) contrast(1.4)" }
  };

  const KEY = "promptoo.styles.v1";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  };
  let custom = store.get().filter(x => x && x.n);

  const DRAWN = [];                    // every drawn / animated / graphic medium (checker uses this live list)
  const REAL = ["documentary realism", "hyper-realistic"];
  const famOf = {};
  const all = () => FAMS.flatMap(f => f.items.map(i => i.n)).concat(custom.map(c => c.n));
  const find = n => { for (const f of FAMS) { const i = f.items.find(x => x.n === n); if (i) return { item: i, fam: f.id }; } const c = custom.find(x => x.n === n); return c ? { item: recipe(c), fam: c.fam || "mine", custom: 1 } : null; };
  const recipe = c => Object.assign({ n: c.n, w: c.w, m: 1 }, LOOKS[c.look] || LOOKS.none);

  function rebuild() {
    DRAWN.length = 0;
    FAMS.forEach(f => f.items.forEach(i => { famOf[i.n] = f.id; if (f.id !== "photo" && f.id !== "mood" && i.m) DRAWN.push(i.n); }));
    custom.forEach(c => { famOf[c.n] = c.fam || "mine"; if ((c.fam || "mine") !== "photo" && (c.fam || "mine") !== "mood") DRAWN.push(c.n); });
  }
  rebuild();

  window.STYLE_LIB = {
    FAMS, LOOKS, all, find, famOf, DRAWN, REAL,
    custom: () => custom,
    famLabel: id => id === "mine" ? "My styles" : (FAMS.find(f => f.id === id) || {}).label || id,
    add(n, fam, w, look) {
      n = String(n || "").trim(); if (!n) return null;
      custom = custom.filter(c => c.n !== n);
      custom.push({ n, fam: fam || "mine", w: String(w || "").trim(), look: look || "none" });
      store.set(custom); rebuild(); return n;
    },
    remove(n) { custom = custom.filter(c => c.n !== n); store.set(custom); rebuild(); },
    /* one style per line: "name: wording", "name - wording" or "name | wording" */
    parse(text) {
      return String(text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
        const m = l.match(/^(.{2,60}?)\s*(?::|\||\s[-–—]\s)\s*(.+)$/);
        return m ? { n: m[1].replace(/^[\d.\-)\s*•]+/, "").trim(), w: m[2].trim() } : { n: l.slice(0, 60), w: "" };
      }).filter(x => x.n);
    }
  };
})();
