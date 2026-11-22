/* Promptoo 3D stage: the stand-in character. A mannequin built from simple shapes that follows the character card
   (height, build, skin, hair, outfit colours, accessories) and the action text (walk, run, dance ...).
   Stage3D.makeDummy(charCard, sceneText, ctx) -> { root, home, update(t,dt,ctx), pose, ... }
   Extend it: add a word to ACCESSORIES or COLORS below, or register an effect with a `subject` hook. */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE;
  const COLORS = { red: "#b23a3a", crimson: "#9c2b3a", maroon: "#6d2230", orange: "#d9772b", yellow: "#d8b83a", gold: "#c9a23a", green: "#3f8a5a", olive: "#6b7040", teal: "#2a8a8f", cyan: "#2fb4c8", blue: "#3a5fb2", navy: "#27355e", purple: "#6b4aa8", violet: "#6b4aa8", pink: "#d46a9a", white: "#e9ecef", cream: "#e8dfc4", black: "#17181c", grey: "#7a828c", gray: "#7a828c", silver: "#aab2bd", brown: "#7a5538", tan: "#b98d5f", beige: "#cdbd9a", khaki: "#a8a070", jeans: "#3b5b8c", denim: "#3b5b8c", suit: "#23252d", tuxedo: "#14151a" };
  const SKIN = { fair: "#f0d3bd", pale: "#f2dccb", light: "#edc9a8", olive: "#cfa57a", tan: "#c28f62", brown: "#8d5a3a", "dark brown": "#5c3a26", dark: "#4a2e1f", black: "#4a2e1f" };
  const HAIRC = { black: "#15110f", brown: "#4a2f1d", blond: "#d7b35a", blonde: "#d7b35a", red: "#a8421f", ginger: "#b8561f", grey: "#9aa0a6", gray: "#9aa0a6", silver: "#c4c8cc", white: "#e8e8e8", blue: "#2b4cc2", pink: "#e0679f", green: "#3f9a5a", purple: "#6b3fb0" };
  const ACCESSORIES = [["glasses", /glasses|spectacles|eyewear/i], ["hat", /\b(hat|cap|beanie|fedora)\b/i], ["hood", /hood/i], ["headphones", /headphone/i], ["backpack", /backpack|rucksack|satchel/i], ["helmet", /helmet|space ?suit|astronaut/i], ["cape", /cape|cloak/i], ["sword", /sword|katana|blade/i], ["camera", /camera/i], ["scarf", /scarf/i], ["tie", /\btie\b/i], ["mask", /\bmask\b/i], ["crown", /crown|tiara/i], ["bag", /\b(bag|purse|briefcase)\b/i]];

  function colorIn(text, def) { text = (text || "").toLowerCase(); let best = null, pos = 1e9; Object.keys(COLORS).forEach(k => { const i = text.search(new RegExp("\\b" + k + "\\b")); if (i >= 0 && i < pos) { pos = i; best = COLORS[k]; } }); return best || def; }
  function colorsIn(text) { text = (text || "").toLowerCase(); const out = []; Object.keys(COLORS).forEach(k => { const i = text.search(new RegExp("\\b" + k + "\\b")); if (i >= 0) out.push([i, COLORS[k], k]); }); return out.sort((a, b) => a[0] - b[0]); }
  S.dummyColors = { COLORS, SKIN, HAIRC, ACCESSORIES };

  S.makeDummy = function (card, sceneText, ctx, opts) {
    opts = opts || {};
    const a = (card && card.attrs) || {}, st = sceneText || {};
    const all = [a.type, a.age, a.hair, a.outfit, a.build, a.skin, a.face, a.footwear, a.acc, a.feat, a.posture, st.subject].filter(Boolean).join(" ").toLowerCase();
    const outfit = (a.outfit || st.subject || "").toLowerCase();
    const cs = colorsIn(outfit);
    const top = (cs[0] && cs[0][1]) || opts.top || "#4b5f86";
    let bottom = (cs[1] && cs[1][1]) || (/jeans|denim/.test(outfit) ? COLORS.jeans : /suit|tux/.test(outfit) ? COLORS.suit : "#2f3340");
    if (/suit|tuxedo/.test(outfit) && cs[0] === undefined) bottom = top;
    const isChild = /child|kid|toddler|boy|girl/.test(all) && !/teen|man|woman/.test(all), isWoman = /woman|girl|lady|female|she\b/.test(all), isRobot = /robot|android|droid|cyborg/.test(all), isFox = /fox|dog|cat|animal|wolf/.test(all);
    const skinKey = Object.keys(SKIN).find(k => new RegExp("\\b" + k + "\\b").test((a.skin || "").toLowerCase())); let skin = SKIN[skinKey] || (isRobot ? "#9aa6b2" : "#e0b894");
    let hairColor = "#2b2018"; const hw = (a.hair || "").toLowerCase(); Object.keys(HAIRC).forEach(k => { if (new RegExp("\\b" + k + "\\b").test(hw)) hairColor = HAIRC[k]; });
    const hairKind = /bald|shaved/.test(hw) ? "bald" : /long|ponytail|braid|wavy/.test(hw) ? "long" : /curly|afro/.test(hw) ? "curly" : hw ? "short" : (isWoman ? "long" : "short");
    const build = (a.build || "").toLowerCase(); const wide = /stocky|broad|heavy|muscular|large/.test(build) ? 1.25 : /slim|thin|petite|lanky/.test(build) ? .82 : 1;
    const hMul = isChild ? .62 : /tall|lanky/.test(build) ? 1.1 : /petite|short/.test(build) ? .9 : 1;
    const M = (c, o) => S.mat(c, o);
    const root = new T.Group(); const body = new T.Group(); root.add(body);
    const H = ctx ? ctx.H : 1.75; body.scale.setScalar(hMul * H / 1.75);
    const parts = {};
    const add = (g, color, pos, scl, parent, o) => { const m = S.mesh(g, color, pos, scl, o); (parent || body).add(m); return m; };
    // legs (pivot at the hip so they swing)
    const legs = [-1, 1].map(s => { const p = new T.Group(); p.position.set(s * .1 * wide, .92, 0); body.add(p);
      add("cap", bottom, [0, -.4, 0], [.15 * wide, .62, .15 * wide], p); add("box", isRobot ? "#59616b" : "#1b1b1f", [0, -.83, .04], [.14 * wide, .08, .26], p); return p; });
    // torso
    const torsoH = isWoman ? .5 : .54; const torso = add("cap", top, [0, 1.14, 0], [.34 * wide, torsoH, .2 * wide]); parts.torso = torso;
    if (isWoman) { add("cone", bottom, [0, .98, 0], [.38, .28, .26]).rotation.x = Math.PI; }
    // arms
    const arms = [-1, 1].map(s => { const p = new T.Group(); p.position.set(s * .23 * wide, 1.36, 0); body.add(p);
      add("cap", top, [0, -.27, 0], [.1 * wide, .46, .1 * wide], p); add("sphere", skin, [0, -.57, 0], [.1, .1, .1], p); return p; });
    // neck + head
    add("cyl", skin, [0, 1.46, 0], [.09, .08, .09]);
    const head = new T.Group(); head.position.set(0, 1.6, 0); body.add(head); parts.head = head;
    add("sphere", skin, [0, 0, 0], [.24, .27, .25], head);
    if (isRobot) { add("box", "#2a3138", [0, 0, .1], [.22, .1, .08], head); add("sphere", "#7be0ff", [-.05, 0, .14], [.04, .04, .04], head, { emissive: "#7be0ff" }); add("sphere", "#7be0ff", [.05, 0, .14], [.04, .04, .04], head, { emissive: "#7be0ff" }); }
    else { [-1, 1].forEach(s => add("sphere", "#14141a", [s * .06, .02, .115], [.032, .032, .02], head)); add("cone", skin, [0, -.02, .125], [.03, .06, .03], head).rotation.x = Math.PI / 2; }
    // hair
    const hasHat = /hat|cap|beanie|helmet/.test(all) || /hood/.test(all);
    if (!isRobot && hairKind !== "bald" && !/helmet/.test(all)) {
      add("sphere", hairColor, [0, .06, -.02], [.27, .24, .27], head);
      if (hairKind === "long") add("cap", hairColor, [0, -.16, -.08], [.26, .36, .12], head);
      if (hairKind === "curly") add("sphere", hairColor, [0, .1, -.02], [.34, .3, .34], head);
    }
    // accessories (words from the card or the subject text)
    const has = k => (ACCESSORIES.find(x => x[0] === k)[1]).test(all);
    if (has("glasses")) { [-1, 1].forEach(s => { const r = add("torus", "#111", [s * .065, .03, .13], [.12, .12, .12], head); }); add("box", "#111", [0, .03, .135], [.04, .01, .01], head); }
    if (has("hat") && !has("helmet")) { add("cyl", "#2d2a36", [0, .16, 0], [.34, .05, .34], head); add("cyl", "#2d2a36", [0, .24, 0], [.22, .16, .22], head); }
    if (has("hood")) { add("sphere", top, [0, .02, -.03], [.31, .3, .31], head); }
    if (has("headphones")) { [-1, 1].forEach(s => add("cyl", "#222", [s * .135, .02, 0], [.09, .05, .09], head).rotation.z = Math.PI / 2); add("torus", "#222", [0, .08, 0], [.3, .3, .3], head).rotation.x = Math.PI / 2; }
    if (has("helmet")) { add("sphere", "#e8eef5", [0, .02, 0], [.38, .4, .38], head, { rough: .25, opacity: .55 }); add("box", "#cfd6de", [0, -.18, -.12], [.3, .34, .2], head); }
    if (has("backpack")) add("box", "#8a5a3a", [0, 1.12, -.2], [.3, .4, .14]);
    if (has("bag")) add("box", "#5a3a28", [.3 * wide, .85, .02], [.16, .2, .08]);
    if (has("cape")) { const c = add("box", colorIn(outfit, "#8a1f2c"), [0, 1.0, -.16], [.5, .95, .03]); c.rotation.x = .08; }
    if (has("scarf")) add("torus", "#b0402f", [0, 1.45, 0], [.3, .3, .3]).rotation.x = Math.PI / 2;
    if (has("tie")) add("box", "#7a1f1f", [0, 1.18, .105], [.05, .26, .02]);
    if (has("mask")) add("box", "#e8e8e8", [0, -.05, .13], [.2, .1, .04], head);
    if (has("crown")) add("cyl", "#e0b84a", [0, .17, 0], [.26, .08, .26], head);
    if (has("sword")) { const sw = add("box", "#cfd6de", [0, -.55, .12], [.03, .9, .015], arms[1]); sw.rotation.x = 1.2; }
    if (has("camera")) add("box", "#222", [0, 1.18, .14], [.14, .09, .08]);
    if (isFox) { [-1, 1].forEach(s => add("cone", "#c4682b", [s * .09, .22, 0], [.09, .16, .06], head)); add("cone", "#c4682b", [0, .9, -.3], [.12, .5, .12]).rotation.x = -1.2; }
    if (/hood|jacket|coat/.test(outfit)) add("cap", top, [0, 1.12, 0], [.37 * wide, .56, .23 * wide]);

    // ---- poses and motion ----
    const act = ((st.action || "") + " " + (a.posture || "")).toLowerCase();
    const mode = /\b(run|runs|running|sprint|jog|chase|chases|racing)\b/.test(act) ? "run" : /\b(walk|walks|walking|stroll|strolls|march|stride|wander|hike|hikes|climbs?)\b/.test(act) ? "walk" : /\b(dance|dances|dancing|spin|spins)\b/.test(act) ? "dance" : /\b(wave|waves|waving)\b/.test(act) ? "wave" : "idle";
    const sub = { root, body, head, legs, arms, parts, mode, home: new T.Vector3(0, 0, 0), speed: mode === "run" ? 3.2 : mode === "walk" ? 1.3 : 0, phase: 0, attrs: { isChild, isWoman, isRobot, wide, hMul, skin, top, bottom }, baseY: 0, walking: mode === "walk" || mode === "run", lookYaw: 0, lookPitch: 0, extraSway: 0 };
    sub.update = function (t, dt, c) {
      const sp = sub.walking || sub.forceWalk ? (sub.forceSpeed || (mode === "run" ? 6.5 : 4.2)) : 0;
      sub.phase += dt * sp * (c ? c.timeScale || 1 : 1);
      const swing = (sub.walking || sub.forceWalk) ? (mode === "run" ? .85 : .5) : 0, ph = sub.phase;
      legs[0].rotation.x = Math.sin(ph) * swing; legs[1].rotation.x = -Math.sin(ph) * swing;
      if (mode === "wave") { arms[1].rotation.z = 2.4 + Math.sin(ph * 3 + (c ? c.time * 6 : 0)) * .3; arms[0].rotation.x = 0; }
      else if (mode === "dance") { const tt = c ? c.time : 0; arms[0].rotation.z = -1.2 + Math.sin(tt * 5) * .5; arms[1].rotation.z = 1.2 - Math.sin(tt * 5) * .5; body.rotation.z = Math.sin(tt * 3) * .06; body.position.y = Math.abs(Math.sin(tt * 5)) * .05; }
      else { arms[0].rotation.x = -Math.sin(ph) * swing * .9; arms[1].rotation.x = Math.sin(ph) * swing * .9; if (!sub.walking && !sub.forceWalk) { const tt = c ? c.time : 0; torso.scale.y = 1 + Math.sin(tt * 1.6) * .006; } }
      if (sub.walking || sub.forceWalk) body.position.y = Math.abs(Math.sin(ph)) * .02 * (mode === "run" ? 2 : 1);
      head.rotation.y = rad(sub.lookYaw); head.rotation.x = rad(sub.lookPitch);
      if (sub.mot && S.motion) S.motion(sub, t, dt, c);   // movement options (effects/motion.js) pose the figure on top
    };
    root.position.copy(sub.home); root.traverse(o => { o.castShadow = true; });
    function rad(d) { return d * Math.PI / 180; }
    return sub;
  };

  /* a smaller, cheaper figure for crowds and extra actors */
  S.makeExtra = function (color, scale) {
    const g = new T.Group(); const c = color || "#5a6070";
    const b = S.mesh("cap", c, [0, .95, 0], [.36, .55, .2]); const h = S.mesh("sphere", "#d8b090", [0, 1.55, 0], [.22, .25, .22]); const l = S.mesh("cap", "#2a2d36", [0, .45, 0], [.3, .85, .16]);
    g.add(b, h, l); g.scale.setScalar(scale || 1); return g;
  };
})(typeof window !== "undefined" ? window : globalThis);
