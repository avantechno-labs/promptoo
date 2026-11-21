/* Promptoo: Environment + Composition groups, their picture previews, and character fields.
   Everything here is data. Add a row to add an option. First `pop` options show as "most popular". */
(function (root) {
  /* ---------------- option tables ---------------- */
  // [name, emoji, sky1, sky2, ground, hills]
  const LOC = [
    ["city street","🏙","#6f8fb5","#cfd8e3","#4a4d55","#7b8798"],["forest","🌲","#6aa27a","#cfe6d2","#2f5a3a","#3f7a52"],
    ["desert","🏜","#f0b46a","#ffe4b0","#d9a45c","#c98e4d"],["beach","🏖","#59b7ee","#d4f1ff","#efd9a1","#4aa0c8"],
    ["mountains","🏔","#7aa2d6","#e3effa","#e9eef5","#8896a8"],["living room","🛋","#c9b49a","#e6d8c6","#8a6a4b","#d9c6ad"],
    ["rooftop","🌆","#e98a5c","#ffd6a1","#4a4a52","#6f5a66"],["countryside field","🌾","#7fc0ee","#e3f4ff","#8fb55a","#6f9a4c"],
    ["moon surface","🌑","#02030a","#0b0d1e","#8d8d96","#6a6a74"],["space station interior","🛰","#1b2a42","#31465f","#566377","#31465f"],
    ["underwater","🌊","#0b4a7a","#3aa0c8","#0e3354","#1a6f9c"],["jungle","🌴","#4f9a5f","#bfe3b4","#1f4a2b","#2f6b3d"],
    ["cave","🕳","#1a1613","#3a322b","#2a241f","#3a322b"],["spaceship cockpit","🚀","#101a2e","#24365a","#1a2438","#24365a"],
    ["castle interior","🏰","#6a5a4a","#8a7a68","#4a4038","#7a6a58"],["old town alley","🏘","#8a7a8c","#d9c2b4","#5a4f4a","#9a8070"],
    ["highway road","🛣","#6fa8e8","#dcefff","#3b3d44","#7e8e9c"],["office","🏢","#cfd6de","#e8edf2","#8a919b","#dde3ea"],
    ["school hallway","🏫","#d8d2b8","#ece7d2","#9a8f72","#e0dac2"],["subway station","🚇","#4d5560","#8a929c","#5b6068","#6a727c"],
    ["cemetery","🪦","#6b6f80","#b8bcc8","#3f4a3c","#555a66"],["swamp","🐊","#7a8a62","#c5cfa8","#3c4a30","#566244"],
    ["volcano","🌋","#4a2a24","#d9703a","#2a1a18","#5a2e22"],["canyon","🏞","#e0a064","#ffd9a8","#b8683a","#a85a30"],
    ["glacier","🧊","#9ec7e8","#e6f4fc","#e9f4fb","#b8d8ee"],["harbor docks","⚓","#7fa8cc","#d8e6f0","#5a4a3a","#4a7a9a"],
    ["shopping mall","🛍","#e6dfe6","#f6f0f6","#b8aab8","#eae2ea"],["stadium","🏟","#5fa0e0","#d4e8fa","#4f9a4a","#8a8f98"],
    ["library","📚","#8a6a4a","#b8956a","#5a4030","#9a7a58"],["laboratory","🧪","#cfe0e8","#e8f2f6","#9aa8b0","#dde9ee"],
    ["warehouse","📦","#7a7a80","#a8a8ae","#5a5a60","#8a8a90"],["kitchen","🍳","#e6d8c0","#f4ebd8","#a88a68","#eadcc4"],
    ["bedroom","🛏","#b8a8c8","#d8cce4","#8a7a6a","#ccc0da"],["hospital corridor","🏥","#d6e4e0","#eef6f4","#a8bab6","#e2eeea"],
    ["bar or pub","🍺","#4a2e20","#7a4a2c","#2e1c12","#5e3a24"],["church","⛪","#6a6478","#a8a2b8","#4a4458","#8a8498"],
    ["train station","🚉","#7a8aa0","#c8d2de","#5a5e66","#8a96a8"],["airport","✈","#7fb0e0","#e0eefa","#6a7078","#9aa6b4"],
    ["hotel lobby","🏨","#d8c8a8","#efe2c8","#9a7e5a","#e2d3b6"]
  ];
  // [name, emoji, sky1, sky2, ground, hills, sun|moon spec, stars]
  const TIME = [
    ["dawn","🌅","#2b2f6b","#f3a37a","#2c2a3c","#4a3c5a",{sun:{x:92,y:100,r:9,c:"#ffd9a8"}}],
    ["morning","🌤","#6db3f2","#fbe9c8","#6a7a5a","#7a8a9c",{sun:{x:70,y:72,r:11,c:"#fff3c2"}}],
    ["midday","☀","#3d9cf5","#d8efff","#7a8a5a","#6a8aa8",{sun:{x:160,y:24,r:12,c:"#fff"}}],
    ["golden hour sunset","🌇","#ff8a4a","#ffd9a0","#5a3a28","#8a5a45",{sun:{x:250,y:96,r:14,c:"#fff1c2"}}],
    ["dusk","🌆","#2a2f6e","#d9728a","#241e34","#3a2e50",{sun:{x:160,y:104,r:8,c:"#ffb090"}}],
    ["night","🌙","#04061a","#1a2450","#0c1220","#141c38",{moon:{x:232,y:38,r:10}}],
    ["midnight","🌌","#010208","#0a1030","#06080f","#0c1226",{moon:{x:90,y:30,r:7},stars:1}],
    ["blue hour twilight","🌃","#14265c","#7f9ad8","#1b2440","#2a3560",{}],
    ["overcast afternoon","☁","#a7afb9","#d9dde2","#7a817c","#8d96a0",{}],
    ["late evening","🌆","#1c1840","#7a4a7a","#1a1428","#2c2040",{}],
    ["sunrise over horizon","🌄","#ff9a5c","#ffe2a8","#4a3a2c","#6a4a3a",{sun:{x:160,y:100,r:15,c:"#fff6d0"}}]
  ];
  // [name, emoji, sky1, sky2, ground, hills, fx classes]
  const WEATHER = [
    ["clear sky","🌞","#4aa8ff","#d6efff","#7d8a5a","#6a8aa8",""],["light rain","🌦","#6a7a8c","#9eaab6","#4a5a52","#5a6a78","fx-rain-l"],
    ["heavy rain","🌧","#46525f","#7d8a98","#363f3c","#44525e","fx-rain-h"],["fog","🌫","#b9c3cb","#e9edf0","#8a948c","#a8b2ba","fx-fog"],
    ["snowfall","🌨","#9fb3c8","#e6edf4","#eef3f8","#c8d6e4","fx-snow"],["windy","💨","#6ab0ee","#d6ecff","#8a9a5a","#6a8aa8","fx-wind"],
    ["overcast clouds","☁","#9aa3ad","#d3d8dd","#6f786f","#8a949e","fx-haze-g"],
    ["thunderstorm","⛈","#262d3d","#56607a","#222a2a","#2e3646","fx-rain-h fx-flash"],["sandstorm","🌪","#c9985a","#e8c88a","#b8884a","#c89a60","fx-sand"],
    ["drizzle","🌦","#8a98a6","#bcc6ce","#56645c","#6a7884","fx-rain-l"],["mist","🌫","#c4ced4","#eef2f4","#8a9a92","#aab6bc","fx-mist"],
    ["hail","🧊","#56606c","#8a95a2","#4a5450","#586470","fx-hail"],["humid haze","🥵","#e3c98a","#fff2cc","#8a8a50","#b8a870","fx-haze-y"],
    ["blizzard","❄","#b0bfd0","#f0f4f8","#f2f6fa","#d4dfeb","fx-blizzard"],["aurora skies","🌌","#04112a","#0b2a3a","#10202a","#16303a","fx-aurora"],
    ["rainbow after rain","🌈","#7db8e8","#e8f3fb","#6f9a5a","#6a8aa8","fx-rainbow"]
  ];
  const SEASON = [
    ["spring","🌸","#8ccbf2","#e9f7ff","#8fc46a","#70ad5c"],["summer","☀","#3fa0f0","#cfeaff","#6fb03c","#4f9a3a"],
    ["autumn","🍂","#d9a36a","#f4dcb0","#a8622a","#b8742f"],["winter","❄","#a9bfd6","#eef3f8","#f1f5f9","#c9d4e0"],
    ["monsoon season","🌧","#556a7c","#9aa9b6","#3f6a4a","#486e58"],["early spring blossoms","🌷","#a8d8f0","#f6fbff","#9ccc7a","#e8b4c8"],
    ["late autumn with bare trees","🍁","#9a9a9a","#d8d4cc","#6a5a46","#7a6a58"],["midsummer heat","🔥","#ffcf7a","#fff0c4","#d8a850","#c89040"]
  ];
  const ERA = [
    ["modern day","🏢","#6f8fb5","#cfd8e3","#4a4d55","#7b8798"],["futuristic sci-fi","🚀","#0d1b3a","#2fd4ff","#1b2a4a","#243a66"],
    ["medieval fantasy","🏰","#7a6a9a","#e0c8a0","#4a5a3a","#6a5a7a"],["1980s retro","📼","#ff4fa8","#ffd25a","#2a1a4a","#5a2a7a"],
    ["post-apocalyptic","☢","#7a6a4a","#c8b080","#4a4034","#5a4a3a"],["1950s vintage","📻","#8ac0d8","#f0e4c8","#8a7a60","#b8a888"],
    ["Victorian era","🎩","#8a8a98","#c8c4cc","#4a4650","#6a6670"],["ancient Rome","🏛","#6fb0e0","#f0e4d0","#c8b898","#d8c8a8"],
    ["wild west","🤠","#e8a868","#ffe0b0","#c8985a","#b8784a"],["cyberpunk future","🌃","#150626","#ff2fa0","#0e0820","#2a0a50"],
    ["steampunk","⚙","#8a6a4a","#d8b888","#4a3a2a","#7a5a3a"],["stone age","🦴","#8ab0c8","#e8dcc0","#7a6a4a","#8a7a5a"],
    ["1920s jazz age","🎷","#4a3a2a","#d8b868","#2a2018","#6a5030"],["feudal Japan","⛩","#c85a4a","#f4dcc0","#5a4a3a","#7a4a3a"]
  ];
  const ATMO = [
    ["light fog","fx-fog"],["dust particles in the air","pt-dust"],["drifting smoke","pt-smoke"],["falling snow","fx-snow"],
    ["floating embers","pt-embers"],["lens flare","fx-flare"],["rain streaks","fx-rain-l"],["glowing fireflies","pt-fireflies"],
    ["heat haze","fx-heat"],["falling leaves","pt-leaves"],["floating pollen","pt-pollen"],["rising steam","pt-steam"],["flying sparks","pt-sparks"],
    ["neon haze","fx-neon"],["mist rolling over the ground","fx-gmist"],["cherry blossom petals","pt-petals"],["falling ash","pt-ash"],
    ["magical sparkles","pt-magic"],["floating bubbles","pt-bubbles"],["confetti","pt-confetti"]
  ];
  const CROWD = [
    ["empty and deserted",0],["sparse few people",4],["busy bustling crowd",12],["packed crowd",26],["single lone figure",1],
    ["traffic and vehicles passing","cars"],["animals around","animals"]
  ];
  const PLACE = [ // name, scene params
    ["subject centered in frame",{fx:0}],["subject on the left third",{fx:-26.7}],["subject on the right third",{fx:26.7}],
    ["subject low in frame",{fy:-5}],["subject high in frame",{fy:-48}],
    ["subject small and off-center with lots of negative space",{fx:-45,fs:.45,fy:-15}],["subject filling the frame",{fs:1.6,fy:0}],["tiny figure in a vast frame",{fs:.3,fy:-10}]
  ];
  const FACING = [
    ["facing the camera",{mode:"front"}],["back to the camera",{mode:"back"}],["in profile facing left",{mode:"left"}],["in profile facing right",{mode:"right"}],
    ["walking toward the camera",{mode:"toward",fs:1.45,fy:0},"⬇"],["walking away from the camera",{mode:"away",fs:.8,fy:-10},"⬆"],
    ["looking off-screen",{mode:"off"}],["looking up",{mode:"up"}],["looking down",{mode:"down"}],["three-quarter view",{mode:"tq"}]
  ];
  const FRAME = ["rule of thirds","symmetrical framing","leading lines","foreground element in front","negative space","frame within a frame",
    "layered depth: foreground, midground, background","diagonal composition","golden ratio","generous headroom and margins","tight framing"];

  /* ---------------- groups (merged into the app's G) ---------------- */
  root.EXTRA_G = {
    loc:{label:"Location type",ic:"🌍",step:"env",single:1,pop:8,opts:LOC.map(x=>x[0])},
    time:{label:"Time of day",ic:"🕒",step:"env",single:1,pop:6,opts:TIME.map(x=>x[0])},
    weather:{label:"Weather",ic:"⛅",step:"env",single:1,pop:7,opts:WEATHER.map(x=>x[0])},
    season:{label:"Season",ic:"🍃",step:"env",single:1,pop:4,opts:SEASON.map(x=>x[0])},
    atmo:{label:"Atmosphere & particles",ic:"✨",step:"env",pop:8,opts:ATMO.map(x=>x[0])},
    era:{label:"Era / world",ic:"🕰",step:"env",single:1,pop:5,opts:ERA.map(x=>x[0])},
    crowd:{label:"Crowd & activity",ic:"👥",step:"env",single:1,pop:3,opts:CROWD.map(x=>x[0])},
    place:{label:"Subject placement",ic:"🎯",step:"comp",single:1,pop:5,opts:PLACE.map(x=>x[0])},
    facing:{label:"Subject direction",ic:"🧭",step:"comp",single:1,pop:6,opts:FACING.map(x=>x[0])},
    frame:{label:"Framing & depth",ic:"🖼",step:"comp",pop:6,opts:FRAME}
  };

  /* ---------------- preview helpers (use the app's scene() and th()) ---------------- */
  const find = (t, n) => t.find(r => r[0] === n);
  const pal = r => ({ sky: [r[2], r[3]], ground: r[4], hills: r[5] });
  const ovs = inner => `<svg class="ovs" viewBox="0 0 160 90" preserveAspectRatio="none">${inner}</svg>`;
  const GRID = ovs(`<path d="M53.3 0V90M106.7 0V90M0 30H160M0 60H160" stroke="#fff" stroke-opacity=".6" stroke-width=".8" fill="none"/>`);
  const fx = cls => cls.split(" ").filter(Boolean).map(c => `<i class="fx ${c}"></i>`).join("");
  function crowdFigs(n) {
    if (n === "cars") return [40, 130, 230, 290].map((x, i) => `<g><rect x="${x-14}" y="${126+i%2*4}" width="28" height="9" rx="3" fill="${["#c0392b","#2c6fbb","#e0b030","#444"][i]}"/><circle cx="${x-8}" cy="${136+i%2*4}" r="2.4" fill="#111"/><circle cx="${x+8}" cy="${136+i%2*4}" r="2.4" fill="#111"/></g>`).join("");
    if (n === "animals") return "";
    let o = "", s = 7;
    for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; const x = 30 + (s % 260), sc = n === 1 ? .35 : .4 + (s % 7) / 40, y = 124 + (s % 11);
      o += `<g transform="translate(${x} ${y}) scale(${sc}) translate(${-x} -135)">${FIG(x, "#3a4050", null, false, "front")}</g>`; }
    return o;
  }
  const FRAME_T = {
        "rule of thirds": [{ fx: -26.7 }, GRID],
        "symmetrical framing": [{}, ovs(`<path d="M80 0V90" stroke="#fff" stroke-opacity=".7" stroke-dasharray="3 3"/>`)],
        "leading lines": [{}, ovs(`<path d="M0 90L72 48M160 90L88 48M30 90L76 50M130 90L84 50M0 70L70 47M160 70L90 47" stroke="#fff" stroke-opacity=".65" stroke-width=".9"/>`)],
        "foreground element in front": [{ bgBlur: 1 }, ovs(`<ellipse cx="8" cy="96" rx="34" ry="24" fill="#06120a"/><ellipse cx="152" cy="98" rx="38" ry="22" fill="#06120a"/><path d="M20 78l4 10M28 76l2 12M138 76l-3 12M146 78l-5 10" stroke="#06120a" stroke-width="2"/>`)],
        "negative space": [{ fx: -45, fs: .45, fy: -15 }, ""],
        "frame within a frame": [{ fs: .5, fy: -30 }, ovs(`<path fill-rule="evenodd" d="M0 0H160V90H0Z M38 14H122V78H38Z" fill="#05060a" fill-opacity=".93"/>`)],
        "layered depth: foreground, midground, background": [{ bgBlur: 1.4 }, ovs(`<ellipse cx="14" cy="98" rx="42" ry="22" fill="#06120a" opacity=".92"/><path d="M110 0Q132 14 160 8V0Z" fill="#06120a" opacity=".85"/>`)],
        "diagonal composition": [{ fx: -22 }, ovs(`<path d="M0 90L160 8" stroke="#fff" stroke-opacity=".6" stroke-width=".9"/>`)],
        "golden ratio": [{ fx: 18.9 }, ovs(`<path d="M61.1 0V90M98.9 0V90M0 34.4H160M0 55.6H160" stroke="#f6c64a" stroke-opacity=".75" stroke-width=".8"/>`)],
        "generous headroom and margins": [{ fs: .55, fy: -20 }, ovs(`<rect x="12" y="8" width="136" height="74" fill="none" stroke="#fff" stroke-opacity=".6" stroke-dasharray="3 3"/>`)],
        "tight framing": [{ fs: 1.3, fy: 0 }, ""]
      };
  const THUMBS = {
    loc: o => { const r = find(LOC, o); return th(scene(pal(r)), { glyph: r[1] }); },
    time: o => { const r = find(TIME, o), e = r[6] || {}; return th(scene(Object.assign(pal(r), { sun: e.sun, moon: e.moon, stars: e.stars })), { glyph: r[1] }); },
    weather: o => { const r = find(WEATHER, o); return th(scene(pal(r)), { glyph: r[1], extra: fx(r[6]) }); },
    season: o => { const r = find(SEASON, o); return th(scene(pal(r)), { glyph: r[1] }); },
    era: o => { const r = find(ERA, o); return th(scene(pal(r)), { glyph: r[1] }); },
    atmo: o => { const r = find(ATMO, o); const dark = !/fog|flare|rain|snow|heat/.test(r[1]);
      return th(scene(dark ? { sky: ["#0d1228", "#232b4d"], ground: "#10131f", hills: "#171c33" } : {}), { extra: fx(r[1]) }); },
    crowd: o => { const r = find(CROWD, o); const ex = crowdFigs(r[1]);
      return th(scene({ extra: ex, sky: ["#6f8fb5", "#cfd8e3"], ground: "#4a4d55", hills: "#7b8798", nofig: 1 }), { glyph: r[1] === "animals" ? "🐕" : r[1] === "cars" ? "🚗" : "" }); },
    place: o => { const r = find(PLACE, o); return th(scene(Object.assign({ fs: .7, fy: -25 }, r[1])), { extra: GRID }); },
    facing: o => { const r = find(FACING, o); return th(scene(Object.assign({ fs: 1.15, fy: 0 }, r[1])), { glyph: r[2] || "" }); },
    frame: o => {
      const base = { fs: .7, fy: -25 };
      const t = FRAME_T[o]; return th(scene(Object.assign({}, base, t[0])), { extra: t[1] });
    }
  };
  root.EXTRA_THUMB = THUMBS;

  /* Environment picks as seen in the live preview. o = the scene's picks, L = the chosen lighting look (if any).
     Priority: sky = weather > time of day > lighting > location > season > era; ground and hills = location > season > era > weather > time.
     Returns scene() params, weather/atmosphere effect overlays and season/era tint overlays. */
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  /* Composition picks as seen in the live preview: placement, facing and framing (guides). Placement wins over framing. */
  root.COMP_LOOK = o => {
    const one = k => (o[k] || [])[0];
    const sc = {}; let extra = "";
    const fr = one("frame") && FRAME_T[one("frame")];
    if (fr) { Object.assign(sc, fr[0]); extra += fr[1] || ""; }
    const fa = one("facing") && find(FACING, one("facing"));
    if (fa) Object.assign(sc, fa[1]);
    const pl = one("place") && find(PLACE, one("place"));
    if (pl) Object.assign(sc, pl[1]);
    return { sc, extra };
  };

  root.ENV_LOOK = (o, L) => {
    const one = k => (o[k] || [])[0];
    const get = (t, k) => (one(k) ? find(t, one(k)) : null);
    const loc = get(LOC, "loc"), time = get(TIME, "time"), wx = get(WEATHER, "weather"), se = get(SEASON, "season"), era = get(ERA, "era"), crowd = get(CROWD, "crowd");
    const wxp = wx && wx[0] !== "clear sky" ? wx : null;
    const skyOf = r => r && [r[2], r[3]];
    const first = (...a) => a.find(Boolean);
    const sc = {};
    const sky = first(skyOf(wxp), skyOf(time), L && L.sky, skyOf(loc), skyOf(se), skyOf(era), skyOf(wx));
    if (loc || time || wx || se || era) sc.sky = sky;
    const gr = first(loc, se, era, wxp, time);
    if (gr) { sc.ground = gr[4]; sc.hills = gr[5]; }
    if (time) { const e = time[6] || {}; if (e.sun) sc.sun = e.sun; if (e.moon) sc.moon = e.moon; if (e.stars) sc.stars = e.stars; }
    if (crowd && crowd[1] !== 0) sc.extra = crowdFigs(crowd[1]);
    const cls = [wx && wx[6], ...(o.atmo || []).map(n => (find(ATMO, n) || [])[1])].filter(Boolean).join(" ");
    const ov = [se && rgba(se[2], .16), era && rgba(era[2], .16)].filter(Boolean);
    return { sc, fx: fx(cls), ov };
  };

  /* ---------------- CSS for weather / particles / overlays ---------------- */
  const tile = (w, h, inner) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${inner}</svg>`)}")`;
  function dots(n, color, a, b, seed) {
    let s = seed, r = () => (s = (s * 16807) % 2147483647) / 2147483647, o = "";
    for (let i = 0; i < n; i++) o += `<circle cx='${(r() * 60).toFixed(1)}' cy='${(r() * 60).toFixed(1)}' r='${(a + r() * (b - a)).toFixed(2)}' fill='${color}' fill-opacity='${(.5 + r() * .5).toFixed(2)}'/>`;
    return o;
  }
  const css = [
    `.ovs{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}`,
    `.fx{position:absolute;inset:0;pointer-events:none;z-index:2;animation:fxm var(--t,1s) linear infinite;background-repeat:repeat}`,
    `@keyframes fxm{to{background-position:var(--mx,0) var(--my,0)}}`,
    `@keyframes fxp{from{opacity:.55}to{opacity:1}}@keyframes fxflash{0%,90%{opacity:0}92%{opacity:.85}95%{opacity:0}97%{opacity:.5}100%{opacity:0}}@keyframes fxwave{0%{transform:translateX(0)}50%{transform:translateX(1.5px)}100%{transform:translateX(0)}}`,
    `.fx-rain-l{background-image:${tile(24,40,`<line x1='5' y1='2' x2='2' y2='16' stroke='white' stroke-opacity='.6'/><line x1='17' y1='22' x2='14' y2='36' stroke='white' stroke-opacity='.45'/>`)};background-size:24px 40px;--my:40px;--t:.9s}`,
    `.fx-rain-h{background-image:${tile(14,24,`<line x1='4' y1='1' x2='1' y2='13' stroke='white' stroke-opacity='.75'/><line x1='11' y1='13' x2='8' y2='23' stroke='white' stroke-opacity='.6'/>`)};background-size:14px 24px;--my:24px;--t:.35s}`,
    `.fx-hail{background-image:${tile(22,22,`<circle cx='5' cy='5' r='1.6' fill='white'/><circle cx='16' cy='15' r='1.3' fill='white'/>`)};background-size:22px 22px;--my:22px;--t:.4s}`,
    `.fx-snow{background-image:${tile(60,60,dots(14,"white",1,2.2,11))};background-size:60px 60px;--my:60px;--t:3s}`,
    `.fx-blizzard{background-image:${tile(60,60,dots(26,"white",1,2.4,23))};background-size:60px 60px;--mx:-60px;--my:60px;--t:.9s;box-shadow:inset 0 0 40px 20px rgba(255,255,255,.45)}`,
    `.fx-fog{background:linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,.2) 55%,rgba(255,255,255,.55));animation:fxp 2.5s ease-in-out infinite alternate}`,
    `.fx-mist{background:linear-gradient(transparent 30%,rgba(255,255,255,.55));animation:fxp 3s ease-in-out infinite alternate}`,
    `.fx-gmist{background:linear-gradient(transparent 55%,rgba(255,255,255,.6));animation:fxp 3s ease-in-out infinite alternate}`,
    `.fx-haze-g{background:linear-gradient(rgba(200,205,212,.45),rgba(200,205,212,.15))}`,
    `.fx-haze-y{background:linear-gradient(rgba(255,226,150,.5),rgba(255,226,150,.15));animation:fxp 2.5s ease-in-out infinite alternate}`,
    `.fx-wind{background-image:${tile(60,20,`<line x1='0' y1='5' x2='34' y2='5' stroke='white' stroke-opacity='.55'/><line x1='20' y1='14' x2='56' y2='14' stroke='white' stroke-opacity='.4'/>`)};background-size:60px 20px;--mx:60px;--t:.6s}`,
    `.fx-sand{background-image:${tile(40,40,dots(12,"#e0b36a",.6,1.4,5).replace(/60/g,"40"))},linear-gradient(rgba(214,168,98,.5),rgba(214,168,98,.35));background-size:40px 40px,100% 100%;--mx:-40px;--t:.45s}`,
    `.fx-flash{background:#cfe0ff;opacity:0;animation:fxflash 2.2s infinite}`,
    `.fx-aurora{background:linear-gradient(100deg,transparent 5%,rgba(60,255,160,.55) 35%,rgba(140,80,255,.5) 60%,transparent 92%);background-size:220% 60%;background-repeat:no-repeat;filter:blur(7px);animation:fxm 5s ease-in-out infinite alternate;--mx:60%;--my:0}`,
    `.fx-rainbow{background:radial-gradient(circle at 50% 125%,transparent 54%,rgba(255,0,0,.45) 55%,rgba(255,150,0,.45) 58%,rgba(255,255,0,.4) 61%,rgba(0,200,0,.4) 64%,rgba(0,120,255,.45) 67%,rgba(130,0,200,.45) 70%,transparent 71%);animation:none}`,
    `.fx-flare{background:radial-gradient(circle at 72% 28%,rgba(255,255,255,.95),rgba(255,210,130,.45) 12%,transparent 32%),linear-gradient(90deg,transparent,rgba(255,255,255,.55) 72%,transparent) 0 28%/100% 2px no-repeat;animation:fxp 2s ease-in-out infinite alternate}`,
    `.fx-neon{background:linear-gradient(120deg,rgba(255,0,170,.4),transparent 45%,rgba(0,220,255,.4));animation:fxp 1.6s ease-in-out infinite alternate}`,
    `.fx-heat{background:repeating-linear-gradient(180deg,rgba(255,255,255,.1) 0 3px,transparent 3px 7px);filter:blur(1px);animation:fxwave .35s linear infinite}`
  ];
  const PT = [ // key, color, count, rmin, rmax, mx, my, seconds, extra css
    ["dust","#fff4d0",18,.5,1.4,"60px","0",8,""],["smoke","#cfd2d8",6,4,9,"0","-60px",6,"filter:blur(2px);"],
    ["embers","#ff9a3c",14,.8,1.8,"0","-60px",3,"filter:drop-shadow(0 0 2px #ff7a1c);"],["fireflies","#c8ff6a",10,1.2,2.2,"60px","0",7,"filter:drop-shadow(0 0 3px #c8ff6a);"],
    ["leaves","#c9742a",10,1.6,2.8,"60px","60px",4,""],["pollen","#fff3a0",14,.6,1.2,"60px","0",9,""],["steam","#ffffff",6,4,8,"0","-60px",5,"filter:blur(3px);opacity:.8;"],
    ["sparks","#ffd27a",12,.6,1.2,"0","-60px",1.2,"filter:drop-shadow(0 0 2px #ffb030);"],["petals","#ffb7c9",10,1.6,2.6,"60px","60px",4,""],
    ["ash","#bdbdbd",14,.8,1.6,"0","60px",6,""],["magic","#d6a8ff",14,.6,1.6,"0","-60px",3,"filter:drop-shadow(0 0 3px #b070ff);"]
  ];
  PT.forEach((p, i) => css.push(`.pt-${p[0]}{position:absolute;inset:0;pointer-events:none;z-index:2;background-image:${tile(60, 60, dots(p[2], p[1], p[3], p[4], 31 + i * 7))};background-size:60px 60px;--mx:${p[5]};--my:${p[6]};animation:fxm ${p[7]}s linear infinite;${p[8]}}`));
  css.push(`.pt-bubbles{position:absolute;inset:0;z-index:2;background-image:${tile(60, 60, `<circle cx='12' cy='40' r='3' fill='none' stroke='white' stroke-opacity='.8'/><circle cx='40' cy='18' r='4.5' fill='none' stroke='white' stroke-opacity='.7'/><circle cx='50' cy='52' r='2' fill='none' stroke='white' stroke-opacity='.8'/>`)};background-size:60px 60px;--my:-60px;animation:fxm 4s linear infinite}`);
  css.push(`.pt-confetti{position:absolute;inset:0;z-index:2;background-image:${tile(60, 60, `<rect x='6' y='8' width='3' height='5' fill='#ff4f6a'/><rect x='30' y='20' width='3' height='5' fill='#ffd24a'/><rect x='48' y='6' width='3' height='5' fill='#4aa8ff'/><rect x='18' y='44' width='3' height='5' fill='#5fd48a'/><rect x='42' y='46' width='3' height='5' fill='#c46cff'/>`)};background-size:60px 60px;--my:60px;animation:fxm 1.4s linear infinite}`);
  const st = document.createElement("style"); st.textContent = css.join("\n"); document.head.appendChild(st);

  /* ---------------- character fields ---------------- */
  root.CHAR_FIELDS = [
    { k: "type", label: "Who / what", ic: "🧑", pop: 1, hint: "young woman, old fisherman, robot dog…", ex: ["young woman", "middle-aged man", "small child", "friendly robot", "talking fox"] },
    { k: "age", label: "Age", ic: "🎂", pop: 1, hint: "teenage, early 20s, elderly…", ex: ["teenage", "early 20s", "in their 30s", "middle-aged", "elderly"] },
    { k: "hair", label: "Hair", ic: "💇", pop: 1, hint: "short messy black hair…", ex: ["short black hair", "long wavy brown hair", "shaved head", "silver ponytail", "curly red hair"] },
    { k: "outfit", label: "Outfit", ic: "👕", pop: 1, hint: "red hooded jacket and jeans…", ex: ["red hooded jacket and jeans", "black suit and tie", "worn white space suit", "yellow raincoat", "leather armor"] },
    { k: "expression", label: "Expression / emotion", ic: "🙂", pop: 1, hint: "calm, determined, curious…", ex: ["calm", "determined", "curious", "worried", "smiling warmly"] },
    { k: "build", label: "Build & height", ic: "🏋", hint: "slim, athletic, tall…", ex: ["slim", "athletic", "stocky", "tall and lanky", "petite"] },
    { k: "skin", label: "Skin tone", ic: "🎨", hint: "fair, olive, tan, brown…", ex: ["fair", "olive", "tan", "brown", "dark brown"] },
    { k: "face", label: "Face & eyes", ic: "👁", hint: "green eyes, freckles, sharp jaw…", ex: ["green eyes", "freckles", "sharp jawline", "round glasses", "scar over left eyebrow"] },
    { k: "footwear", label: "Footwear", ic: "👟", hint: "worn sneakers, black boots…", ex: ["worn sneakers", "black boots", "barefoot", "sandals"] },
    { k: "acc", label: "Accessories & props", ic: "🎒", hint: "backpack, glowing amulet…", ex: ["backpack", "glowing amulet", "headphones", "katana", "camera on a strap"] },
    { k: "feat", label: "Distinguishing features", ic: "✨", hint: "tattoo on forearm, glowing blue eyes…", ex: ["tattoo on the forearm", "glowing blue eyes", "cybernetic arm", "pointed ears"] },
    { k: "posture", label: "Posture & demeanor", ic: "🚶", hint: "confident stride, tired slouch…", ex: ["confident stride", "slouched and tired", "alert and tense", "relaxed"] }
  ];
  /* A character is described in two places: the first line (head + the details marked as key identifiers)
     and a separate "Character:" line holding everything else. */
  function charPhrases(c) {
    const a = (c && c.attrs) || {}, t = x => (x || "").replace(/\s+/g, " ").trim().replace(/[.,;:]+$/, "");
    const ph = {};
    if (t(a.age)) ph.age = t(a.age);
    if (t(a.build)) ph.build = t(a.build) + " build";
    if (t(a.skin)) ph.skin = t(a.skin) + " skin";
    if (t(a.hair)) ph.hair = /hair|bald|head|mask|hood/i.test(a.hair) ? t(a.hair) : t(a.hair) + " hair";
    if (t(a.face)) ph.face = t(a.face);
    if (t(a.outfit)) ph.outfit = "wearing " + t(a.outfit);
    if (t(a.footwear)) ph.footwear = "in " + t(a.footwear);
    if (t(a.acc)) ph.acc = "with " + t(a.acc);
    if (t(a.feat)) ph.feat = t(a.feat);
    if (t(a.expression)) ph.expression = t(a.expression) + " expression";
    if (t(a.posture)) ph.posture = t(a.posture);
    return { head: t(a.type) || "character", ph };
  }
  const ORDER = ["age", "build", "skin", "hair", "face", "outfit", "footwear", "acc", "feat", "expression", "posture"];
  root.CHAR_KEYABLE = k => k !== "type" && k !== "age" && k !== "posture";
  root.charDesc = c => { const { head, ph } = charPhrases(c); const r = ORDER.filter(k => ph[k]).map(k => ph[k]); return head + (r.length ? ", " + r.join(", ") : ""); };
  root.charParts = c => {
    const { head, ph } = charPhrases(c), key = (c && c.key) || {};
    const ks = ORDER.filter(k => key[k] && ph[k] && root.CHAR_KEYABLE(k));
    const nouns = ks.filter(k => k !== "outfit").map(k => ph[k].replace(/^(with|in) /, ""));
    let first = head;
    if (nouns.length) first += " with " + nouns.join(" and ");
    if (ks.includes("outfit")) first += " " + ph.outfit;
    return [first, ORDER.filter(k => ph[k] && !ks.includes(k)).map(k => ph[k]).join(", ")];
  };
})(window);
