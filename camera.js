/* Promptoo camera vocabulary: shot sizes, camera angles, camera moves, recipes.
   One line per option. To add an option, add a line here (and nothing else).
   n    name (stored in the scene, shown on the pill, used by the checker)
   tip  one short line: when to use it (shown as a tooltip)
   w    prompt wording. Moves: what the camera does ("The camera ..."). Angles: where the camera sits.
   fam  family chip inside the tab
   pop  1 = shown first under "Popular"
   Preview recipes: sizes/angles use tf (css transform), to (origin), sc (scene params), extra; moves use cls (animation class) and g (glyph). */
(function (root) {

  /* ---------------- shot sizes (how much of the subject is in frame) ---------------- */
  const SIZES = [
    { n: "extreme wide shot", tip: "Tiny subject in a huge place", pop: 1 },
    { n: "wide establishing shot", tip: "Show the whole place first", pop: 1 },
    { n: "wide shot", tip: "Whole body with lots of surroundings", pop: 1, tf: "scale(.7)", w: "Wide shot, the subject's whole body with plenty of the surroundings visible:" },
    { n: "full shot", tip: "Head to toe, body language", tf: "scale(1.15)", w: "Full shot, the subject seen head to toe:" },
    { n: "medium wide shot", tip: "From the knees up, the cowboy shot", tf: "scale(1.45)", w: "Medium wide shot, the subject framed from the knees up:" },
    { n: "medium shot", tip: "Waist up, conversation and action", pop: 1 },
    { n: "medium close-up", tip: "Chest up, emotion with context", pop: 1 },
    { n: "close-up", tip: "Face fills the frame, feelings", pop: 1 },
    { n: "extreme close-up", tip: "One detail, eyes or an object", pop: 1 },
    { n: "insert shot", tip: "A tight detail of an object", tf: "scale(7)", w: "Insert shot, a tight detail of one object filling the frame:" }
  ];

  /* ---------------- camera angles (where the camera sits relative to the subject) ---------------- */
  const ANGLES = [
    { n: "eye-level angle", fam: "height", pop: 1, tip: "Neutral, natural, like a person looks", tf: "scale(1.15)", w: "eye level, the camera at the subject's natural eye height looking straight at them" },
    { n: "low-angle shot", fam: "height", pop: 1, tip: "Makes the subject look powerful", w: "low angle, the camera below the subject's eyeline pointing upward" },
    { n: "high-angle shot", fam: "height", pop: 1, tip: "Makes the subject look small or weak", w: "high angle, the camera above the subject pointing downward" },
    { n: "bird's-eye view", fam: "height", pop: 1, tip: "Far above, a map-like view", w: "bird's-eye view, the camera far above the subject looking almost straight down" },
    { n: "overhead top-down shot", fam: "height", tip: "Straight down from directly above", tf: "rotateX(75deg) scale(1.35)", to: "50% 15%", w: "overhead top-down, the camera directly above the subject with the lens pointing vertically down" },
    { n: "hip-level angle", fam: "height", tip: "Waist height, grounded and a little heroic", tf: "rotateX(-14deg) scale(1.2)", to: "50% 100%", w: "hip level, the camera at waist height looking slightly up" },
    { n: "shoulder-level angle", fam: "height", tip: "Just below eye height, natural handheld feel", tf: "rotateX(-6deg) scale(1.2)", to: "50% 100%", w: "shoulder level, the camera just below eye height for a natural, grounded view" },
    { n: "ground-level angle", fam: "height", tip: "Lens on the ground, floor in front", tf: "rotateX(-40deg) scale(1.4)", to: "50% 100%", w: "ground level, the camera almost touching the ground with floor surfaces in the foreground" },
    { n: "worm's-eye view", fam: "height", tip: "From the ground looking steeply up", tf: "rotateX(-52deg) scale(1.5)", to: "50% 100%", w: "worm's-eye view, the camera on the ground looking steeply upward at the subject" },
    { n: "hero angle", fam: "height", tip: "Iconic, confident, a little low", tf: "rotateX(-22deg) scale(1.3)", to: "50% 100%", w: "hero angle, the camera slightly below the subject aimed upward for a powerful, iconic frame" },
    { n: "dutch angle", fam: "tilt", pop: 1, tip: "Tilted horizon, unease", w: "Dutch angle, the camera rolled so the horizon runs diagonally" },
    { n: "extreme dutch angle", fam: "tilt", tip: "Very tilted, chaos or madness", tf: "rotate(-30deg) scale(1.6)", w: "extreme Dutch angle, the camera heavily rolled so the horizon is sharply diagonal" },
    { n: "upside-down angle", fam: "tilt", tip: "World flipped, disorientation", tf: "rotate(180deg) scale(1.1)", w: "upside-down angle, the camera rotated 180 degrees so the world is inverted" },
    { n: "from-behind angle", fam: "side", tip: "Follow someone into the scene", tf: "scale(1.2)", sc: { mode: "back" }, w: "from behind, the camera directly behind the subject facing the same way" },
    { n: "profile angle", fam: "side", tip: "Side view of the subject", tf: "scale(1.2)", sc: { mode: "left" }, w: "profile, the camera at the subject's side seeing them in side view" },
    { n: "three-quarter angle", fam: "side", tip: "Flattering, about 45 degrees off front", tf: "scale(1.2)", sc: { mode: "tq" }, w: "three-quarter angle, the camera about 45 degrees off the subject's front" },
    { n: "reverse angle", fam: "side", tip: "Look back from the opposite side", tf: "scale(1.15) scaleX(-1)", sc: { mode: "right" }, w: "reverse angle, the camera on the opposite side of the previous shot looking back" },
    { n: "point-of-view shot", fam: "side", pop: 1, tip: "Seen through the character's eyes", w: "first-person point of view, seeing exactly what the character sees" },
    { n: "over-the-shoulder shot", fam: "side", pop: 1, tip: "Dialogue between two people", w: "over the shoulder, the camera behind one character's shoulder looking toward another" },
    { n: "single shot", fam: "side", tip: "One character alone in frame", tf: "scale(1.2)", w: "single, one character alone in the frame" },
    { n: "two-shot", fam: "side", tip: "Two characters framed together", w: "two-shot, both characters framed together" }
  ];
  const ANGLE_FAMS = [["pop", "Popular"], ["height", "Height"], ["tilt", "Tilt"], ["side", "Side and view"]];

  /* ---------------- camera moves ---------------- */
  const MOVES = [
    // pan / tilt
    { n: "static locked-off camera", fam: "pan", pop: 1, cls: "", g: "🔒", tip: "No movement, the subject carries the shot" },
    { n: "pan right", fam: "pan", pop: 1, cls: "a-panr", g: "⟶", tip: "Scan a room or follow action to the right" },
    { n: "pan left", fam: "pan", pop: 1, cls: "a-panl", g: "⟵", tip: "Scan a room or follow action to the left" },
    { n: "tilt up", fam: "pan", cls: "a-tiltu", g: "⟰", tip: "Reveal height, look up a tall subject" },
    { n: "tilt down", fam: "pan", cls: "a-tiltd", g: "⟱", tip: "Look down, drop to a detail" },
    { n: "whip pan", fam: "pan", cls: "a-whip", g: "⚡", tip: "Violent snap between subjects, energy" },
    // zoom (lens only: the camera stays where it is)
    { n: "slow zoom in", fam: "zoom", cls: "a-zslow", g: "⤢", w: "zooms in slowly with the lens, the camera itself staying still", tip: "Gentle creeping focus on the subject" },
    { n: "slow zoom out", fam: "zoom", cls: "a-zslowout", g: "⤡", w: "zooms out slowly with the lens, the camera itself staying still", tip: "Gently widen to show context" },
    { n: "fast zoom in", fam: "zoom", cls: "a-zin", g: "⤢", w: "zooms in quickly with the lens, the camera itself staying still", tip: "Sudden attention, a retro 70s feel" },
    { n: "fast zoom out", fam: "zoom", cls: "a-zout", g: "⤡", w: "zooms out quickly with the lens, the camera itself staying still", tip: "Sudden reveal of the wider scene" },
    { n: "crash zoom in", fam: "zoom", cls: "a-crash", g: "⤢", w: "snaps in with a sudden, violent zoom onto the subject", tip: "Shock or comedy emphasis" },
    { n: "crash zoom out", fam: "zoom", cls: "a-crashout", g: "⤡", w: "snaps out with a sudden zoom to reveal the wider scene", tip: "Shock reveal" },
    // dolly / track (the camera physically travels)
    { n: "slow push-in", fam: "dolly", pop: 1, cls: "a-push", g: "⤢", tip: "Build intensity, move toward a face" },
    { n: "slow pull-out", fam: "dolly", pop: 1, cls: "a-pull", g: "⤡", tip: "Reveal context, show isolation" },
    { n: "tracking shot", fam: "dolly", pop: 1, cls: "a-track", g: "➜", tip: "Travel with the subject" },
    { n: "steadicam follow", fam: "dolly", cls: "a-steady", g: "🚶", tip: "Smooth follow, we are right behind them" },
    { n: "side tracking shot", fam: "dolly", cls: "a-track", g: "➜", w: "travels alongside the subject at the same speed, holding a steady medium-wide frame", tip: "Walk-and-talk from the side" },
    { n: "vehicle tracking shot", fam: "dolly", cls: "a-track", g: "➜", w: "tracks beside a moving vehicle at its speed, keeping it framed", tip: "Cars, bikes, trains in motion" },
    { n: "chase shot", fam: "dolly", cls: "a-steady", g: "🏃", w: "pursues the subject closely from behind at speed, keeping the frame tight", tip: "Urgent pursuit" },
    { n: "reverse tracking walk-and-talk", fam: "dolly", cls: "a-steady", g: "🚶", w: "moves backward ahead of the subject, keeping them framed as they walk toward the lens", tip: "Face-forward walking conversation" },
    { n: "low tracking shot", fam: "dolly", cls: "a-track", g: "➜", w: "tracks close to the ground alongside the subject with the lens near floor level", tip: "Feet, speed, ground detail" },
    // physical moves (truck, pedestal, slider, arc, orbit)
    { n: "orbit around subject", fam: "phys", pop: 1, cls: "a-orbit", g: "⟳", tip: "Circle the subject, heroic or dreamy" },
    { n: "orbit clockwise", fam: "phys", cls: "a-orbit", g: "⟳", w: "circles the subject at a fixed distance, travelling clockwise, smooth and continuous", tip: "Orbit with a known direction" },
    { n: "orbit counterclockwise", fam: "phys", cls: "a-orbit", g: "⟲", w: "circles the subject at a fixed distance, travelling counterclockwise, smooth and continuous", tip: "Orbit the other way" },
    { n: "arc left", fam: "phys", cls: "a-orbit", g: "⟲", w: "curves in a partial arc to the left around the subject, ending at a new side angle", tip: "Short curved move, a new view of the subject" },
    { n: "arc right", fam: "phys", cls: "a-orbit", g: "⟳", w: "curves in a partial arc to the right around the subject, ending at a new side angle", tip: "Short curved move, a new view of the subject" },
    { n: "truck left", fam: "phys", cls: "a-panl", g: "⟵", w: "slides sideways to the left, parallel to the subject, without turning", tip: "Sideways travel, reveals parallax" },
    { n: "truck right", fam: "phys", cls: "a-panr", g: "⟶", w: "slides sideways to the right, parallel to the subject, without turning", tip: "Sideways travel, reveals parallax" },
    { n: "slider left", fam: "phys", cls: "a-panl", g: "⟵", w: "glides a short distance left on a slider, slow and smooth", tip: "Subtle product and detail move" },
    { n: "slider right", fam: "phys", cls: "a-panr", g: "⟶", w: "glides a short distance right on a slider, slow and smooth", tip: "Subtle product and detail move" },
    { n: "pedestal up", fam: "phys", cls: "a-tiltu", g: "⇧", w: "rises straight up on a vertical column without tilting", tip: "Rise to a new height, level view" },
    { n: "pedestal down", fam: "phys", cls: "a-tiltd", g: "⇩", w: "lowers straight down on a vertical column without tilting", tip: "Drop to a new height, level view" },
    { n: "push past pass-by shot", fam: "phys", cls: "a-track", g: "➜", w: "pushes forward and passes close beside the subject in one sweep", tip: "Fly past something to a reveal" },
    // handheld
    { n: "handheld shaky cam", fam: "hand", pop: 1, cls: "a-hand", g: "〰", tip: "Raw, urgent, documentary feel" },
    // drone / crane
    { n: "crane up", fam: "air", pop: 1, cls: "a-crane", g: "⇧", tip: "Rise to reveal the scene below" },
    { n: "crane down", fam: "air", cls: "a-craned", g: "⇩", w: "descends smoothly on a crane toward the subject", tip: "Come down into the scene" },
    { n: "drone fly-over", fam: "air", pop: 1, cls: "a-drone", g: "🛸", tip: "Aerial sweep over a landscape" },
    { n: "drone pull back", fam: "air", cls: "a-pull", g: "⤡", w: "pulls straight back and upward from the subject, revealing the setting", tip: "Reveal how big the place is" },
    { n: "drone push in", fam: "air", cls: "a-push", g: "⤢", w: "pushes in toward the subject from above and ahead", tip: "Fly toward a landmark or person" },
    { n: "helicopter shot", fam: "air", cls: "a-drone", g: "🛸", w: "sweeps high above the landscape in one broad, smooth aerial pass", tip: "Big cinematic aerials" },
    // specials
    { n: "dolly zoom", fam: "spec", cls: "a-dolly", g: "◎", tip: "Vertigo effect, the background warps" },
    { n: "Snorricam body-mounted camera", fam: "spec", cls: "a-hand", g: "〰", w: "is rigidly mounted to the subject's body, so their face stays fixed while the world moves behind them", tip: "Dizzy, subjective, panicked" },
    { n: "pass-through-objects shot", fam: "spec", cls: "a-push", g: "⤢", w: "flies through an opening or object in one continuous move into the next space", tip: "Transition-style continuous move" },
    { n: "earth zoom out", fam: "spec", cls: "a-pull", g: "⤡", w: "pulls back continuously from the subject out to a view of the whole planet", tip: "Epic scale reveal" },
    { n: "infinite zoom", fam: "spec", cls: "a-push", g: "⤢", w: "keeps pushing deeper into the image as each layer becomes a new scene", tip: "Endless nested scenes" }
  ];
  const MOVE_FAMS = [["pop", "Popular"], ["pan", "Pan / Tilt"], ["zoom", "Zoom"], ["dolly", "Dolly / Track"], ["phys", "Truck, Pedestal, Arc"], ["hand", "Handheld"], ["air", "Drone / Crane"], ["spec", "Specials"]];

  /* moves that cancel each other, and moves that do the same job (checker uses these) */
  const OPPOSITES = [
    ["slow zoom in", "slow zoom out"], ["fast zoom in", "fast zoom out"], ["crash zoom in", "crash zoom out"],
    ["truck left", "truck right"], ["slider left", "slider right"], ["arc left", "arc right"],
    ["pedestal up", "pedestal down"], ["orbit clockwise", "orbit counterclockwise"], ["crane up", "crane down"],
    ["drone push in", "drone pull back"], ["slow push-in", "slow pull-out"]
  ];
  const ZOOMS = ["slow zoom in", "slow zoom out", "fast zoom in", "fast zoom out", "crash zoom in", "crash zoom out"];
  const DOLLIES = ["slow push-in", "slow pull-out", "drone push in", "drone pull back", "push past pass-by shot"];

  /* ---------------- recipes: start from a proven combination ---------------- */
  const RECIPES = [
    { n: "Luxury product reveal", d: "Extreme close-up, slow push-in, golden light", sel: { shot: ["extreme close-up"], angle: ["low-angle shot"], move: ["slow push-in"], light: ["golden hour sunlight"], lens: ["anamorphic lens with flares"], style: ["cinematic film look"] } },
    { n: "Hero reveal", d: "Low angle, slow push-in, epic mood", sel: { shot: ["medium shot"], angle: ["hero angle"], move: ["slow push-in"], light: ["rim lighting"], mood: ["epic"], style: ["cinematic film look"] } },
    { n: "Tense chase", d: "Chase shot, neon, fast pace", sel: { shot: ["medium shot"], angle: ["low-angle shot"], move: ["chase shot"], light: ["neon lighting"], mood: ["tense"], pace: ["dynamic action pacing"] } },
    { n: "Quiet dialogue", d: "Over the shoulder, locked off, warm light", sel: { shot: ["medium close-up"], angle: ["over-the-shoulder shot"], move: ["static locked-off camera"], light: ["candlelight"], mood: ["calm"], lens: ["85mm portrait lens"] } },
    { n: "Epic landscape", d: "Extreme wide, drone pull back, golden hour", sel: { shot: ["extreme wide shot"], angle: ["bird's-eye view"], move: ["drone pull back"], light: ["golden hour sunlight"], mood: ["epic"] } },
    { n: "Horror dread", d: "Dutch angle, slow push-in, low key light", sel: { shot: ["wide establishing shot"], angle: ["dutch angle"], move: ["slow push-in"], light: ["low-key chiaroscuro"], mood: ["eerie"], grade: ["cool desaturated"] } },
    { n: "Dreamy orbit", d: "Orbit, shallow focus, pastel", sel: { shot: ["medium shot"], move: ["orbit clockwise"], light: ["golden hour sunlight"], lens: ["shallow depth of field"], mood: ["dreamlike"], style: ["dreamy pastel"] } },
    { n: "Documentary handheld", d: "Handheld, eye level, natural light", sel: { shot: ["medium shot"], angle: ["eye-level angle"], move: ["handheld shaky cam"], light: ["soft overcast light"], mood: ["gritty"], style: ["documentary realism"] } },
    { n: "Walk and talk", d: "Reverse tracking, medium close-up", sel: { shot: ["medium close-up"], angle: ["eye-level angle"], move: ["reverse tracking walk-and-talk"], light: ["soft overcast light"] } },
    { n: "Rooftop vertigo", d: "High angle, dolly zoom, unease", sel: { shot: ["medium shot"], angle: ["high-angle shot"], move: ["dolly zoom"], mood: ["tense"], light: ["blue hour"] } }
  ];

  /* ---------------- derived tables the app merges into its own maps ---------------- */
  const rotOf = tf => (tf || "").replace(/scale\([^)]*\)\s*/g, "").trim();
  const SHOT_EXTRA = {}, SHOTW_EXTRA = {}, ANGW = {}, MOVE_EXTRA = {}, MOVEP_EXTRA = {}, TIPS = {};
  SIZES.forEach(o => { TIPS[o.n] = o.tip; if (o.tf) SHOT_EXTRA[o.n] = { tf: o.tf }; if (o.w) SHOTW_EXTRA[o.n] = o.w; });
  ANGLES.forEach(o => {
    TIPS[o.n] = o.tip; ANGW[o.n] = o.w;
    if (o.tf || o.sc) SHOT_EXTRA[o.n] = { tf: o.tf || "none", to: o.to, sc: o.sc, rot: rotOf(o.tf), isAngle: 1 };
  });
  MOVES.forEach(o => { TIPS[o.n] = o.tip; MOVE_EXTRA[o.n] = [o.cls, o.g]; if (o.w) MOVEP_EXTRA[o.n] = o.w; });

  /* animation classes the new moves need (the older ones live in the page's own css) */
  try {
    const st = document.createElement("style");
    st.textContent = `.a-zslow .scn{animation:k-push 3.4s ease-in-out infinite alternate}.a-zslowout .scn{animation:k-pull 3.4s ease-in-out infinite alternate}
.a-zin .scn{animation:k-push .9s ease-in infinite alternate}.a-zout .scn{animation:k-pull .9s ease-in infinite alternate}
.a-crash .scn{animation:k-crash 1.6s ease-in-out infinite}.a-crashout .scn{animation:k-crashout 1.6s ease-in-out infinite}
.a-craned .scn{animation:k-crane 2s ease-in-out infinite alternate-reverse}
@keyframes k-crash{0%,55%{transform:scale(1)}72%,100%{transform:scale(2.5)}}
@keyframes k-crashout{0%,55%{transform:scale(2.5)}72%,100%{transform:scale(1)}}`;
    document.head.appendChild(st);
  } catch (e) {}

  root.CAM = {
    SIZES, ANGLES, MOVES, ANGLE_FAMS, MOVE_FAMS, OPPOSITES, ZOOMS, DOLLIES, RECIPES,
    SHOT_EXTRA, SHOTW_EXTRA, ANGW, MOVE_EXTRA, MOVEP_EXTRA, TIPS,
    ANGLE_SET: new Set(ANGLES.map(a => a.n)),
    MOVE_NAMES: MOVES.map(m => m.n),
    famOf: Object.assign({}, ...ANGLES.map(a => ({ [a.n]: a.fam })), ...MOVES.map(m => ({ [m.n]: m.fam }))),
    pop: Object.assign({}, ...SIZES.concat(ANGLES, MOVES).map(o => ({ [o.n]: o.pop ? 1 : 0 })))
  };
})(typeof window !== "undefined" ? window : globalThis);
