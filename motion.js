/* Promptoo: Movement (what the character does, how the background moves, who moves relative to the camera).
   These live in the Character step as tabs. To add an option: add one row to a list below, and (for the 3D preview)
   one entry in effects/motion.js. Row = [name, prompt wording, tip, glyph, animation class]. */
(function (root) {
  "use strict";
  const ACT = [
    ["standing still", "stands still", "Holds a pose. Best for portraits and dialogue.", "🧍", "mv-bob"],
    ["walking", "walks", "A natural pace. Easy for every model.", "🚶", "mv-x"],
    ["running", "runs", "High energy. Keep the clip short.", "🏃", "mv-xf"],
    ["jogging", "jogs at an easy pace", "", "🏃", "mv-x"],
    ["turning around", "turns around", "A turn toward or away from the camera.", "🔄", "mv-spin"],
    ["looking back over the shoulder", "glances back over their shoulder", "Good for suspense.", "👀", "mv-bob"],
    ["sitting down", "sits down", "", "🪑", "mv-dn"],
    ["standing up", "stands up", "", "🧍", "mv-up"],
    ["kneeling", "kneels down", "", "🧎", "mv-dn"],
    ["crouching", "crouches low", "", "🧎", "mv-dn"],
    ["jumping", "jumps", "", "🤸", "mv-jump"],
    ["climbing", "climbs", "", "🧗", "mv-up"],
    ["reaching out a hand", "reaches out a hand", "", "🤲", "mv-bob"],
    ["pointing ahead", "points ahead", "", "👉", "mv-bob"],
    ["waving", "waves", "", "👋", "mv-wave"],
    ["picking something up", "bends down and picks something up", "", "🫳", "mv-dn"],
    ["opening a door", "opens a door", "", "🚪", "mv-bob"],
    ["dancing", "dances", "", "💃", "mv-wave"],
    ["spinning around", "spins around", "", "🌀", "mv-spin"],
    ["fighting", "fights, throwing punches", "", "🥊", "mv-wave"],
    ["falling", "falls to the ground", "", "🫠", "mv-fall"],
    ["stumbling", "stumbles forward", "", "😵", "mv-fall"],
    ["leaning on a wall", "leans against a wall", "", "🧱", "mv-bob"],
    ["laughing", "laughs", "", "😂", "mv-jump"],
    ["talking with hand gestures", "talks, gesturing with their hands", "", "🗣", "mv-wave"],
    ["drinking from a cup", "raises a cup and takes a sip", "", "🥤", "mv-bob"]
  ];
  const SPD = [
    ["very slow", "very slowly", "", "🐢", "mv-x"],
    ["slow and deliberate", "slowly and deliberately", "", "🚶", "mv-x"],
    ["relaxed", "at a relaxed pace", "", "😌", "mv-x"],
    ["brisk", "at a brisk pace", "", "🚶", "mv-xf"],
    ["hurried", "in a hurry", "", "⏩", "mv-xf"],
    ["frantic, full speed", "frantically, at full speed", "", "💨", "mv-xf"]
  ];
  const DIR = [
    ["toward the camera", "toward the camera", "", "⬇", "mv-dn"],
    ["away from the camera", "away from the camera", "", "⬆", "mv-up"],
    ["left to right", "from left to right across the frame", "", "➡", "mv-x"],
    ["right to left", "from right to left across the frame", "", "⬅", "mv-x"],
    ["diagonally toward the camera", "diagonally toward the camera", "", "↘", "mv-dn"],
    ["in a circle", "in a circle", "", "🔁", "mv-spin"],
    ["into the distance", "into the distance toward the horizon", "", "🌄", "mv-up"],
    ["up a slope or stairs", "up a slope", "", "⛰", "mv-up"]
  ];
  const MICRO = [
    ["breathing visibly", "breathing visibly", "A small sign of life. Models handle it well.", "🫁", "mv-bob"],
    ["blinking naturally", "blinking naturally", "", "👁", "mv-bob"],
    ["hair blowing in the wind", "hair blowing in the wind", "", "💨", "mv-sway"],
    ["clothes rippling in the wind", "clothes rippling in the wind", "", "🧥", "mv-sway"],
    ["a subtle smile forming", "a subtle smile slowly forming", "", "🙂", "mv-bob"],
    ["head tilting", "head tilting slightly", "", "🤔", "mv-sway"],
    ["eyes glancing around", "eyes glancing around", "", "👀", "mv-sway"],
    ["fidgeting nervously", "fidgeting nervously", "", "😬", "mv-sway"],
    ["trembling", "trembling", "", "🥶", "mv-sway"],
    ["breath visible in the cold air", "breath visible in the cold air", "", "🌬", "mv-bob"],
    ["tears forming", "tears forming and rolling down", "", "😢", "mv-dn"],
    ["jaw clenching", "jaw clenching", "", "😠", "mv-bob"],
    ["hands shaking", "hands shaking", "", "🫨", "mv-sway"],
    ["a slow exhale", "a slow exhale", "", "😮‍💨", "mv-bob"]
  ];
  const BG = [
    ["people walking past", "people walking past in the background", "", "🚶", "mv-x"],
    ["people moving in the distance", "small figures moving in the far distance", "", "👥", "mv-x"],
    ["traffic passing", "traffic passing in the background", "", "🚗", "mv-xf"],
    ["a train passing", "a train passing in the background", "", "🚆", "mv-xf"],
    ["trees swaying", "trees swaying in the wind", "", "🌳", "mv-sway"],
    ["tall grass swaying", "tall grass swaying in the wind", "", "🌾", "mv-sway"],
    ["clouds drifting", "clouds drifting slowly across the sky", "", "☁️", "mv-x"],
    ["birds flying overhead", "birds flying overhead", "", "🕊", "mv-x"],
    ["water rippling", "water rippling in the background", "", "🌊", "mv-sway"],
    ["waves rolling in", "waves rolling toward the shore", "", "🌊", "mv-dn"],
    ["a flag or curtain fluttering", "a flag fluttering in the wind", "", "🚩", "mv-sway"],
    ["neon signs flickering", "neon signs flickering", "", "💡", "mv-bob"],
    ["lights flickering", "lights flickering", "", "💡", "mv-bob"],
    ["fire flickering", "a fire flickering", "", "🔥", "mv-bob"],
    ["smoke rising in the distance", "smoke rising in the distance", "", "🌫", "mv-up"],
    ["a windmill or fan turning", "a windmill turning slowly", "", "🌀", "mv-spin"],
    ["machinery moving", "machinery moving in the background", "", "⚙", "mv-spin"],
    ["a frozen, still background", "the background completely still", "Everything but the subject holds still.", "🧊", "mv-bob"]
  ];
  const REL = [
    ["subject moves, camera locked off", "the subject moves while the camera stays locked off", "The classic, most reliable setup.", "🎯", "mv-x"],
    ["subject still, camera moves", "the subject stays still while the camera moves around them", "", "🎥", "mv-spin"],
    ["camera follows the subject", "the camera follows the subject as they move", "", "🎬", "mv-xf"],
    ["subject enters the frame", "the subject walks into frame", "", "➡", "mv-x"],
    ["subject leaves the frame", "the subject walks out of frame", "", "⬅", "mv-x"],
    ["camera and subject move together", "the camera moves in step with the subject", "", "🤝", "mv-xf"],
    ["subject and camera move in opposite directions", "the subject and the camera move in opposite directions", "", "↔", "mv-x"]
  ];
  const GROUPS = {
    act: { label: "Character action", ic: "🚶", list: ACT, pop: 10 },
    spd: { label: "Speed & energy", ic: "⚡", list: SPD, single: 1 },
    dirm: { label: "Direction of travel", ic: "🧭", list: DIR, single: 1 },
    micro: { label: "Small details", ic: "🫁", list: MICRO, pop: 6 },
    bgm: { label: "Background movement", ic: "🌳", list: BG, pop: 8 },
    rel: { label: "Camera vs subject", ic: "🎥", list: REL, single: 1 }
  };
  const M = root.MOTION = { GROUPS, ORDER: ["act", "spd", "dirm", "micro", "bgm", "rel"], W: {}, TIP: {}, GLYPH: {}, CLS: {} };
  M.ORDER.forEach(k => GROUPS[k].list.forEach(r => { M.W[r[0]] = r[1]; if (r[2]) M.TIP[r[0]] = r[2]; M.GLYPH[r[0]] = r[3]; M.CLS[r[0]] = r[4]; }));
  M.word = n => M.W[n] || n;
  if (root.CAM && root.CAM.TIPS) Object.assign(root.CAM.TIPS, M.TIP);

  /* groups for the app (merged next to the other option groups, shown as tabs in the Character step) */
  root.EXTRA_G = root.EXTRA_G || {};
  M.ORDER.forEach(k => { const g = GROUPS[k]; root.EXTRA_G[k] = { label: g.label, ic: g.ic, step: "char", mot: 1, single: g.single || 0, pop: g.pop || g.list.length, opts: g.list.map(r => r[0]) }; });

  /* small animated tiles (no images needed) */
  root.EXTRA_THUMB = root.EXTRA_THUMB || {};
  M.ORDER.forEach(k => { root.EXTRA_THUMB[k] = o => `<div class="th mv ${M.CLS[o] || ""}"><i class="mvbg"></i><b class="mvg">${M.GLYPH[o] || "•"}</b></div>`; });
  if (typeof document !== "undefined") {
    const st = document.createElement("style");
    st.textContent = `.th.mv{display:grid;place-items:center;background:linear-gradient(160deg,#27303f,#151a24);overflow:hidden}.th.mv .mvbg{position:absolute;left:0;right:0;bottom:0;height:30%;background:rgba(255,255,255,.06)}
.th.mv .mvg{font-size:30px;line-height:1;position:relative;filter:drop-shadow(0 2px 3px #0008)}
.mv-x .mvg{animation:mvx 1.8s ease-in-out infinite alternate}.mv-xf .mvg{animation:mvx .7s ease-in-out infinite alternate}
.mv-bob .mvg{animation:mvb 2.2s ease-in-out infinite}.mv-sway .mvg{animation:mvs 1.6s ease-in-out infinite alternate}
.mv-spin .mvg{animation:mvr 2.4s linear infinite}.mv-dn .mvg{animation:mvd 1.8s ease-in-out infinite}.mv-up .mvg{animation:mvu 1.8s ease-in-out infinite}
.mv-jump .mvg{animation:mvj .9s ease-out infinite}.mv-wave .mvg{animation:mvs .55s ease-in-out infinite alternate}.mv-fall .mvg{animation:mvf 2s ease-in infinite}
@keyframes mvx{from{transform:translateX(-26%)}to{transform:translateX(26%)}}@keyframes mvb{50%{transform:scale(1.08)}}@keyframes mvs{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
@keyframes mvr{to{transform:rotate(360deg)}}@keyframes mvd{0%{transform:translateY(-22%);opacity:.3}60%{opacity:1}100%{transform:translateY(22%)}}@keyframes mvu{0%{transform:translateY(22%);opacity:.3}60%{opacity:1}100%{transform:translateY(-22%)}}
@keyframes mvj{0%,100%{transform:translateY(18%)}45%{transform:translateY(-26%)}}@keyframes mvf{0%{transform:rotate(0)}70%,100%{transform:rotate(80deg) translateY(10%)}}
@media (prefers-reduced-motion:reduce){.th.mv .mvg{animation:none!important}}`;
    document.head.appendChild(st);
  }
})(typeof window !== "undefined" ? window : globalThis);
