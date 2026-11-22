/* Promptoo prompt checker. Data-driven: add a line to add a rule.
   Levels: e = contradiction (red), w = risky (amber), t = tip (no color) */
(function (root) {
  const E = "e", W = "w", T = "t";
  const MOVES = ["static locked-off camera","slow push-in","slow pull-out","pan left","pan right","tilt up","tilt down","tracking shot","handheld shaky cam","orbit around subject","crane up","drone fly-over","dolly zoom","whip pan","steadicam follow"];
  const CAM = root.CAM;
  const ALLMOVES = CAM ? CAM.MOVE_NAMES : MOVES;
  const NOSTATIC = ALLMOVES.filter(m => m !== "static locked-off camera");
  const ANGSET = CAM ? CAM.ANGLE_SET : new Set();
  const WIDE = ["extreme wide shot", "wide establishing shot", "wide shot"];
  const CLOSE = ["close-up", "extreme close-up", "medium close-up", "insert shot"];
  const DAY_L = ["golden hour sunlight", "harsh midday sun", "soft overcast light"];
  const ANIM = ["anime", "3D Pixar-style animation", "claymation stop-motion", "watercolor painting"];
  // every drawn, animated or graphic medium. Comes from styles.js (a live list, so styles a user adds are included)
  const SL = root.STYLE_LIB;
  const DRAWN = SL ? SL.DRAWN : ANIM.concat(["fantasy illustration"]);
  const PIXELISH = ["8-bit sprite", "16-bit pixel art", "CRT arcade", "flat cartoon", "ink silhouette", "line art", "vector motion graphics", "paper cut-out", "manga ink"];
  const COLORGR = ["teal and orange", "warm golden tones", "vibrant saturated", "pastel soft", "muted earthy", "cool desaturated"];
  const LENSES = ["24mm wide lens","35mm lens","50mm lens","85mm portrait lens","macro lens","fisheye","telephoto compression"];

  const rules = [];
  const X = (l, a, b, msg) => rules.push({ l, a, b, msg });
  const ONE = (l, g, vals, msg) => rules.push({ l, a: [g, vals], b: [g, vals], msg, one: 1 });

  /* ---- camera movement ---- */
  X(E,["move",["slow push-in"]],["move",["slow pull-out"]],"Push-in and pull-out are opposite moves. The model will pick one or wobble between them. Keep one.");
  X(E,["move",["pan left"]],["move",["pan right"]],"Pan left and pan right cancel each other out. Keep one.");
  X(E,["move",["tilt up"]],["move",["tilt down"]],"Tilt up and tilt down are opposites. Keep one.");
  X(E,["move",["static locked-off camera"]],["move",NOSTATIC],"“Static” means the camera does not move, which contradicts your other camera move.");
  X(W,["move",["handheld shaky cam"]],["move",["steadicam follow","orbit around subject","crane up","drone fly-over"]],"Handheld shake fights smooth, gliding moves. The model usually drops one of them.");
  X(W,["move",["dolly zoom"]],["move",["orbit around subject","crane up","drone fly-over","whip pan","tracking shot","steadicam follow"]],"A dolly zoom already warps perspective. Stacking another big move usually produces a mess.");
  X(W,["move",["whip pan"]],["move",["steadicam follow","slow push-in","slow pull-out","orbit around subject"]],"A whip pan is a fast snap. It does not combine well with slow, smooth moves.");
  X(W,["move",["drone fly-over"]],["move",["crane up"]],"Drone fly-over and crane up are both big vertical sweeps. Pick one.");
  X(W,["move",["tracking shot"]],["move",["orbit around subject"]],"Tracking alongside and orbiting are two different ways around the subject. Choose one for a clean shot.");

  /* ---- shot size/angle x movement ---- */
  X(E,["shot",["point-of-view shot"]],["move",["orbit around subject"]],"A POV shot is the character's own eyes, so the camera cannot orbit around them.");
  X(W,["shot",["point-of-view shot"]],["move",["drone fly-over","crane up"]],"POV puts the camera at the character's eye level. Drone and crane moves lift it away from that.");
  X(W,["shot",["over-the-shoulder shot"]],["move",["orbit around subject","drone fly-over"]],"Over-the-shoulder depends on a fixed spot behind one person. Big moves break the framing.");
  X(W,["shot",WIDE],["move",["dolly zoom"]],"A dolly zoom needs a clear subject in the foreground. In a wide shot the figure is too small for the effect to read.");
  X(W,["shot",["extreme close-up"]],["move",["drone fly-over","crane up"]],"At extreme close-up there is almost nothing in frame to fly over, so the move will look like random shake.");
  X(W,["shot",["low-angle shot"]],["move",["drone fly-over"]],"A drone looks down on the scene, a low angle looks up. They contradict.");

  /* ---- shot x lens ---- */
  X(W,["shot",CLOSE],["lens",["24mm wide lens","fisheye"]],"A very wide lens up close stretches and distorts faces. If you want that look, fine; otherwise use 50 to 85mm.");
  X(W,["shot",WIDE.concat(["two-shot"])],["lens",["macro lens"]],"Macro lenses are for tiny subjects at very short range. They conflict with wide framing.");
  X(W,["shot",WIDE],["lens",["85mm portrait lens","telephoto compression"]],"Long lenses narrow and compress the view, which fights a wide establishing frame.");
  X(W,["shot",WIDE],["lens",["shallow depth of field"]],"Shallow depth of field blurs most of a wide scene, so the establishing detail is lost.");
  ONE(E,"lens",LENSES,"Different lenses cannot be used in the same shot. Keep one.");
  X(E,["lens",["shallow depth of field"]],["lens",["deep focus"]],"Shallow depth of field blurs the background, deep focus keeps everything sharp. Pick one.");

  /* ---- lighting ---- */
  ONE(E,"light",["golden hour sunlight","blue hour","harsh midday sun","moonlight"],"These are different times of day, so they cannot all be true in one shot.");
  X(E,["light",["high-key bright"]],["light",["low-key chiaroscuro"]],"High-key is bright and flat, low-key is dark with deep shadows. Opposites.");
  X(E,["light",["soft overcast light"]],["light",["harsh midday sun"]],"Soft overcast and harsh midday sun are opposite light qualities.");
  X(W,["light",["backlit silhouette"]],["shot",CLOSE],"A silhouette is a black shape, so a close-up shows no face or detail. Use a medium or wide shot, or choose rim lighting instead.");
  X(W,["light",["backlit silhouette"]],["shot",WIDE],"In a wide shot the silhouetted figure becomes a tiny dark shape, so character details will not be visible.");
  X(W,["light",["backlit silhouette"]],["light",["high-key bright","studio softbox","soft overcast light"]],"A silhouette needs a bright background and an unlit subject. Flat or bright lighting cancels it out.");
  X(W,["light",["candlelight","moonlight","low-key chiaroscuro","blue hour"]],["light",["high-key bright","harsh midday sun","studio softbox"]],"Dark, moody light sources contradict bright, even lighting.");
  X(W,["light",["neon lighting"]],["light",DAY_L],"Neon belongs to night scenes. Daylight washes it out.");
  X(W,["light",["volumetric god rays"]],["light",["high-key bright","soft overcast light","studio softbox"]],"God rays need a strong directional light and some haze. Flat light removes them.");
  X(W,["light",["rim lighting"]],["light",["high-key bright"]],"Rim light needs a dark scene to show the glowing edge.");

  /* ---- mood ---- */
  X(E,["mood",["calm"]],["mood",["energetic","tense"]],"Calm contradicts energetic or tense.");
  X(E,["mood",["joyful"]],["mood",["melancholic","eerie","tense","gritty"]],"Joyful contradicts a sad, scary or gritty mood.");
  X(W,["mood",["romantic"]],["mood",["eerie","gritty","tense"]],"Romantic and eerie/gritty/tense pull the scene in opposite directions.");
  X(W,["mood",["mysterious"]],["mood",["joyful"]],"Mysterious and joyful rarely blend. The model will favor one.");
  X(W,["mood",["eerie","tense","mysterious","gritty","melancholic"]],["grade",["vibrant saturated","pastel soft"]],"Bright candy colors work against a dark mood.");
  X(W,["mood",["joyful","romantic"]],["grade",["cool desaturated"]],"A cold, drained color grade works against a warm, happy mood.");
  X(W,["mood",["joyful","romantic"]],["style",["noir black and white"]],"Noir black-and-white reads as dark and serious, which fights a joyful or romantic mood.");
  X(W,["mood",["joyful"]],["light",["low-key chiaroscuro"]],"Low-key shadows read as dark and dramatic, which fights a joyful mood.");
  X(W,["mood",["energetic"]],["pace",["slow motion","smooth slow pacing"]],"Energetic mood and slow pacing pull against each other.");
  X(W,["mood",["calm"]],["pace",["dynamic action pacing","fast cuts"]],"Calm mood and fast, dynamic pacing contradict.");
  X(W,["mood",["calm"]],["move",["whip pan","handheld shaky cam"]],"Whip pans and handheld shake feel anxious, not calm.");

  /* ---- visual style ---- */
  ONE(E,"style",ANIM,"These are different animation techniques. The model can only commit to one.");
  X(E,["style",["documentary realism","hyper-realistic"]],["style",DRAWN],"Realistic and drawn/animated looks contradict.");
  X(W,["style",["hyper-realistic"]],["style",["vintage 16mm film","VHS retro"]],"Hyper-real sharpness conflicts with an intentionally soft, degraded film or video look.");
  X(W,["style",["VHS retro"]],["style",["vintage 16mm film"]],"Two different old-media formats. Pick one.");
  X(W,["style",["minimalist"]],["light",["neon lighting","volumetric god rays"]],"Minimalist means few visual elements. Busy light effects fight it.");

  /* ---- color grade ---- */
  X(E,["style",["noir black and white"]],["grade",COLORGR],"Noir is black-and-white, so there is no color to grade.");
  X(E,["grade",["black and white"]],["grade",COLORGR],"Black and white removes color, so other color grades cancel out.");
  X(W,["style",["noir black and white"]],["light",["neon lighting","golden hour sunlight"]],"Neon and golden hour work through color, which black-and-white throws away.");
  X(W,["grade",["black and white"]],["light",["neon lighting","golden hour sunlight"]],"Neon and golden hour work through color, which black-and-white throws away.");
  X(E,["grade",["vibrant saturated"]],["grade",["cool desaturated","muted earthy","pastel soft"]],"Vibrant saturated colors contradict a muted, desaturated or pastel grade.");
  X(E,["grade",["warm golden tones"]],["grade",["cool desaturated"]],"Warm golden and cool desaturated are opposite color temperatures.");
  X(W,["grade",["pastel soft"]],["grade",["high contrast"]],"Pastel is soft and low-contrast. High contrast is the opposite.");
  X(W,["grade",["warm golden tones"]],["light",["blue hour","moonlight"]],"A warm golden grade fights cool night lighting.");
  X(W,["grade",["cool desaturated"]],["light",["golden hour sunlight"]],"A cool, drained grade fights warm golden-hour light.");

  /* ---- quality boost (global) ---- */
  X(E,["quality",["photorealistic"]],["style",DRAWN],"Quality boost says photorealistic, but your style is drawn or animated. Set Quality boost to none, or change the style.");
  X(W,["quality",["35mm"]],["style",DRAWN],"“35mm film” is a photographic look, and animation styles are not shot on film. The model will blend or ignore one. Try Quality boost = none.");
  X(W,["quality",["35mm"]],["style",["VHS retro","vintage 16mm film"]],"Quality boost already asks for 35mm film. A second film or video format gives a muddled look.");
  X(W,["style",PIXELISH],["lens",["shallow depth of field","macro lens","fisheye","anamorphic lens with flares"]],"Flat, pixel and line styles have no real lens. Depth of field and lens flares are usually ignored or turn the image muddy.");
  X(W,["style",["ink silhouette"]],["shot",CLOSE],"A silhouette has no face or interior detail, so a close-up shows nothing. Use a medium or wide shot.");
  X(W,["style",["ink silhouette","line art"]],["grade",COLORGR],"This style is black and white or very limited in color, so a color grade is mostly lost.");
  X(W,["style",["8-bit sprite","16-bit pixel art","voxel blocks"]],["move",["dolly zoom","orbit around subject","crane up","drone fly-over"]],"Pixel and block looks work best with a simple, side-on or fixed camera. Big 3D camera moves tend to smooth the pixels away.");
  X(W,["quality",["4K"]],["style",["VHS retro","vintage 16mm film","watercolor painting","minimalist"]],"“4K, ultra detailed, sharp” contradicts an intentionally soft, degraded or painterly look.");

  /* ---- aspect ratio ---- */
  X(W,["aspect",["9:16"]],["shot",WIDE.concat(["two-shot"])],"In vertical 9:16, wide shots lose subject size. Prefer medium or closer framing.");
  X(W,["aspect",["9:16"]],["move",["pan left","pan right"]],"Pans have little room to travel in a tall, narrow frame.");

  /* ---- pacing ---- */
  X(W,["pace",["slow motion"]],["move",["whip pan","handheld shaky cam"]],"Slow motion smooths out fast or shaky moves, so the energy of the move is lost.");
  X(W,["pace",["fast cuts"]],["move",["static locked-off camera","orbit around subject"]],"Fast cuts mean many short shots. A locked-off frame or one long orbit is a single continuous shot.");
  X(W,["pace",["time-lapse"]],["move",["handheld shaky cam","steadicam follow"]],"Time-lapse is normally shot from a fixed point. Moving cameras look odd sped up.");

  /* ---- negative prompt vs picks ---- */
  X(W,["neg",["blur"]],["lens",["shallow depth of field","macro lens","85mm portrait lens"]],"Your negative prompt bans blur, but this lens choice creates deliberate background blur.");
  X(W,["neg",["blur"]],["mood",["dreamlike"]],"Your negative prompt bans blur, but a dreamlike mood is usually soft and blurry.");
  X(W,["neg",["blur"]],["move",["whip pan"]],"Your negative prompt bans blur, but a whip pan is motion-blurred by nature.");
  X(W,["neg",["dark"]],["light",["low-key chiaroscuro","candlelight","moonlight","backlit silhouette"]],"Your negative prompt bans dark images, but this lighting is deliberately dark.");
  X(W,["neg",["grain","noise"]],["style",["vintage 16mm film","VHS retro","claymation stop-motion"]],"Your negative prompt bans grain/noise, but this style depends on it.");
  X(W,["neg",["grain","noise"]],["mood",["gritty"]],"Your negative prompt bans grain/noise, but a gritty mood depends on texture.");

  const REAL_FROM = rules.length; // rules from here to the composition block are real-world physics; Fantasy mode skips them
  /* ---- Where (setting text) vs lighting ---- */
  X(E,["setting",[/\b(night|nighttime|midnight|moonlit|starry)\b/i]],["light",DAY_L],"“Where” describes a night scene, but your lighting is daylight.");
  X(W,["setting",[/(\bon\b[^.,]*\bmoon\b|surface of[^.,]*\bmoon\b|\blunar\b|\bmoon'?s? surface\b)/i]],["light",["moonlight","soft overcast light","golden hour sunlight","blue hour","volumetric god rays","candlelight"]],"“Where” puts the character on a moon's surface. There is no atmosphere there: no haze, twilight or soft glow, and “moonlight” has no moon overhead to come from. Hard sunlight, rim lighting or deep shadows (low-key) look right.");
  X(W,["setting",[/\b(under|beneath|by|in the light of)\b[^.,]*\bmoon\b/i]],["light",DAY_L],"“Where” mentions the moon (night?), but your lighting is daylight. Fine only if it is a daytime moon on purpose.");
  X(W,["setting",[/\b(daytime|noon|midday|sunny|afternoon|morning)\b/i]],["light",["moonlight","candlelight"]],"“Where” describes daytime, but your lighting is night-time.");
  X(W,["setting",[/\b(indoors?|inside|interior|room|apartment|kitchen|office|bedroom|hallway|corridor|warehouse|basement|elevator|cave|classroom|house)\b/i]],["light",["harsh midday sun","golden hour sunlight","moonlight","volumetric god rays"]],"“Where” sounds indoors, but you picked sun or moon lighting. Mention a window or opening in Where, or use practical or studio lighting.");
  X(W,["setting",[/\b(outer space|in space|deep space)\b/i]],["light",["golden hour sunlight","soft overcast light"]],"There is no atmosphere in space, so golden-hour or overcast light does not exist there.");

  /* ---- environment ---- */
  const INDOOR = ["living room","space station interior","cave","spaceship cockpit","castle interior","office","school hallway","library","laboratory","warehouse","kitchen","bedroom","hospital corridor","bar or pub","church","hotel lobby","shopping mall","subway station"];
  const RAIN = ["light rain","heavy rain","thunderstorm","drizzle","hail"];
  const SNOW = ["snowfall","blizzard"];
  const OUTWX = RAIN.concat(SNOW, ["windy","sandstorm","fog","mist","rainbow after rain","aurora skies"]);
  const OLD = ["medieval fantasy","ancient Rome","wild west","stone age","Victorian era","feudal Japan"];
  const DAYTIME = ["morning","midday","overcast afternoon"];
  const TWI = ["dawn","dusk","golden hour sunset","sunrise over horizon","blue hour twilight","late evening"];
  X(E,["time",["night","midnight"]],["light",DAY_L],"Time of day is night, but your lighting is daylight.");
  X(W,["time",DAYTIME],["light",["moonlight","candlelight","neon lighting"]],"Time of day is daytime, but your lighting is a night-time source.");
  X(W,["time",["dawn","dusk","blue hour twilight","late evening"]],["light",["harsh midday sun","high-key bright"]],"Twilight skies are dim. Harsh midday or high-key lighting contradicts them.");
  X(W,["time",["golden hour sunset","sunrise over horizon","dawn"]],["light",["moonlight"]],"Sunrise and sunset are sun-lit. Moonlight is a night source.");
  X(W,["weather",RAIN],["light",["harsh midday sun","golden hour sunlight"]],"Strong direct sun rarely appears during rain. Use soft overcast light, or keep it only for a sun-shower look.");
  X(E,["weather",SNOW],["season",["summer","midsummer heat"]],"Snow in summer contradicts.");
  X(W,["weather",SNOW],["loc",["desert","beach","jungle"]],"Snow in a desert, beach or jungle is unusual. Fine only if intentional.");
  X(E,["weather",OUTWX],["loc",["moon surface"]],"The moon has no atmosphere, so there is no weather there.");
  X(E,["weather",OUTWX.concat(["humid haze"])],["loc",["underwater"]],"Weather does not exist underwater.");
  X(W,["weather",OUTWX],["loc",INDOOR],"This weather is outdoors, but the location is indoors. Mention a window or doorway in the extra details, or change one.");
  X(W,["atmo",["falling snow","floating embers","drifting smoke","falling leaves","cherry blossom petals","falling ash","rain streaks"]],["loc",["underwater"]],"These airborne particles do not float or fall underwater.");
  X(E,["atmo",["rain streaks"]],["weather",["clear sky"]],"Rain streaks with a clear sky contradict.");
  X(W,["atmo",["falling snow"]],["weather",RAIN],"Snow and rain together is sleet. Pick one unless that is the look.");
  X(E,["atmo",["heat haze"]],["weather",SNOW],"Heat haze contradicts snow.");
  X(E,["atmo",["falling snow"]],["season",["summer","midsummer heat"]],"Falling snow in summer contradicts.");
  X(W,["atmo",["falling leaves"]],["season",["winter","spring"]],"Falling leaves suggest autumn.");
  X(W,["atmo",["cherry blossom petals"]],["season",["autumn","winter","late autumn with bare trees"]],"Cherry blossoms bloom in spring.");
  X(W,["atmo",["glowing fireflies"]],["time",DAYTIME],"Fireflies glow at night, not in daylight.");
  X(E,["loc",["moon surface"]],["era",OLD],"A moon surface does not fit a historical or fantasy era.");
  X(W,["era",OLD],["loc",["subway station","highway road","airport","shopping mall","office","laboratory"]],"This location is modern, but the era is historical.");
  X(W,["era",["futuristic sci-fi","cyberpunk future"]],["loc",["countryside field","old town alley","castle interior","church"]],"A rustic or historic place clashes with a futuristic era, unless that contrast is the point.");
  X(W,["loc",["moon surface","space station interior","spaceship cockpit"]],["time",TWI],"Sunrise and twilight colors need an atmosphere. In space or on the moon the sky is black.");
  X(W,["loc",["moon surface"]],["light",["moonlight","soft overcast light","golden hour sunlight","blue hour","volumetric god rays","candlelight"]],"On a moon's surface there is no atmosphere: no haze, twilight or soft glow, and “moonlight” has no moon overhead to come from. Hard sunlight, rim lighting or deep shadows (low-key) look right.");
  X(W,["crowd",["single lone figure"]],["shot",["two-shot","over-the-shoulder shot"]],"A lone figure contradicts a two-person shot.");
  X(T,["crowd",["empty and deserted"]],["loc",["stadium","shopping mall","airport","train station"]],"Empty is unusual for a place that is normally crowded. Great for an eerie look.");
  X(T,["crowd",["packed crowd","busy bustling crowd"]],["loc",["moon surface","cave","desert","forest","mountains","glacier"]],"A crowd in a remote location is unusual.");

  /* ---- "Where" says moon surface: no air means no weather, particles, twilight or seasons ---- */
  const MOONRE = /(\bon\b[^.,]*\bmoon\b|surface of[^.,]*\bmoon\b|\blunar\b|\bmoon'?s? surface\b)/i;
  X(E,["setting",[MOONRE]],["weather",OUTWX],"“Where” puts the character on a moon's surface. With no atmosphere there is no wind, rain, fog or storms.");
  X(W,["setting",[MOONRE]],["atmo",["rain streaks","falling snow","falling leaves","drifting smoke","floating pollen","cherry blossom petals","glowing fireflies","heat haze","mist rolling over the ground","light fog","rising steam"]],"“Where” puts the character on a moon's surface. With no air, particles and haze have nothing to drift in.");
  X(W,["setting",[MOONRE]],["time",TWI],"“Where” puts the character on a moon's surface. Sunrise and sunset colors need an atmosphere, so the sky stays black.");
  X(W,["setting",[MOONRE]],["season",["spring","summer","autumn","winter","monsoon season","early spring blossoms","late autumn with bare trees","midsummer heat"]],"“Where” puts the character on a moon's surface. Seasons come from weather and plants on a planet with an atmosphere, so they do not show up there.");

  rules.slice(REAL_FROM).forEach(r => { r.real = 1; });

  /* ---- composition ---- */
  X(W,["place",["subject centered in frame"]],["frame",["rule of thirds","golden ratio"]],"Rule of thirds and golden ratio place the subject off-center. “Centered” contradicts that.");
  X(W,["frame",["symmetrical framing"]],["place",["subject on the left third","subject on the right third","subject small and off-center with lots of negative space"]],"Symmetry works best with the subject centered.");
  X(E,["place",["tiny figure in a vast frame"]],["shot",CLOSE],"A tiny figure in a vast frame needs a wide shot, but you picked a close shot.");
  X(W,["place",["subject filling the frame"]],["shot",WIDE],"Filling the frame needs a close shot, not a wide one.");
  X(W,["place",["subject filling the frame","subject low in frame"]],["frame",["generous headroom and margins","negative space"]],"This placement conflicts with generous margins and empty space.");
  X(W,["frame",["tight framing"]],["frame",["generous headroom and margins","negative space"]],"Tight framing contradicts generous margins and negative space.");
  X(W,["frame",["tight framing"]],["shot",WIDE],"Tight framing needs a closer shot.");
  X(W,["facing",["facing the camera","walking toward the camera"]],["light",["backlit silhouette"]],"A silhouette hides the face, so facing the camera shows nothing. Use rim lighting or turn the subject.");
  X(W,["facing",["walking toward the camera"]],["move",["orbit around subject"]],"Walking straight at the camera while the camera orbits makes the framing hard to hold. Pick one.");

  /* ---- text rules (functions) ---- */
  const CHARS = ["spiderman","batman","superman","ironman","captainamerica","wonderwoman","blackwidow","hulk","thor","deadpool","wolverine","joker","mickeymouse","minniemouse","donaldduck","pikachu","supermario","luigi","harrypotter","hermione","darthvader","yoda","babyyoda","mandalorian","goku","naruto","luffy","pokemon","hellokitty","spongebob","homersimpson","shrek","buzzlightyear","gandalf","frodo","jacksparrow","jamesbond","terminator","elmo","kermit","tomandjerry","bugsbunny","scoobydoo","sonicthehedgehog","mulan","moana","simba","olaf"];
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[n];
  }
  function findChar(text) {
    const w = (text.toLowerCase().match(/[a-z0-9]+/g) || []), cands = new Set();
    for (let i = 0; i < w.length; i++) { cands.add(w[i]); if (w[i + 1]) cands.add(w[i] + w[i + 1]); if (w[i + 2]) cands.add(w[i] + w[i + 1] + w[i + 2]); }
    for (const c of cands) for (const n of CHARS) {
      const thr = n.length >= 10 ? 2 : n.length >= 6 ? 1 : 0;
      if (c.length >= 4 && lev(c, n) <= thr) return c;
    }
    return null;
  }


  /* ---- movement: what the character does, the background, and who moves relative to the camera ---- */
  const GO = ["walking", "running", "jogging", "climbing", "stumbling"];
  const BIG = ["jumping", "dancing", "fighting", "falling", "spinning around", "kneeling", "crouching", "sitting down", "standing up", "picking something up", "opening a door"];
  const DIRS = ["toward the camera", "away from the camera", "left to right", "right to left", "diagonally toward the camera", "in a circle", "into the distance", "up a slope or stairs"];
  X(E, ["act", ["standing still"]], ["act", GO], "“Standing still” and a moving action contradict each other. Keep one.");
  X(W, ["act", ["walking"]], ["act", ["running", "jogging"]], "Walking and running are two different gaits. Keep one, or the model blends them into an odd shuffle.");
  X(W, ["act", ["sitting down"]], ["act", ["standing up"]], "Sitting down and standing up are opposite motions. Choose one for a short clip.");
  X(W, ["act", ["sitting down", "kneeling", "crouching"]], ["act", ["running", "jumping", "jogging", "climbing"]], "A low pose and a fast action cannot happen together. Make one a separate scene.");
  X(W, ["act", ["falling", "stumbling"]], ["act", ["dancing", "waving", "laughing", "talking with hand gestures", "drinking from a cup"]], "A fall or a stumble does not mix with a relaxed gesture.");
  X(W, ["act", ["standing still", "leaning on a wall", "sitting down"]], ["spd", ["hurried", "frantic, full speed", "brisk"]], "A speed of “hurried” or “frantic” implies travel, but the character is set to stay put. Pick a moving action or a calmer speed.");
  X(W, ["act", ["standing still"]], ["dirm", DIRS], "A direction of travel needs a character who moves. “Standing still” cancels it.");
  X(E, ["dirm", ["toward the camera"]], ["facing", ["back to the camera", "walking away from the camera"]], "Moving toward the camera, but the character is set to face away from it. Pick one.");
  X(E, ["dirm", ["away from the camera"]], ["facing", ["facing the camera", "walking toward the camera"]], "Moving away from the camera, but the character is set to face it. Pick one.");
  X(W, ["dirm", ["toward the camera"]], ["angle", ["from-behind angle"]], "The camera is behind the character, who is meant to walk toward it. They would have to turn around.");
  X(E, ["rel", ["subject moves, camera locked off"]], ["move", NOSTATIC], "“Camera locked off” means no camera move, which contradicts the camera move you chose.");
  X(E, ["rel", ["subject still, camera moves"]], ["move", ["static locked-off camera"]], "The camera should move around a still subject, but the camera is set to static.");
  X(W, ["rel", ["subject still, camera moves"]], ["act", GO], "The subject is meant to stay still, but a moving action is picked. Remove one.");
  X(E, ["rel", ["camera follows the subject", "camera and subject move together"]], ["move", ["static locked-off camera"]], "The camera is meant to follow the subject, but it is set to static.");
  X(W, ["rel", ["camera follows the subject", "camera and subject move together"]], ["act", ["standing still", "leaning on a wall"]], "There is nothing to follow: the character stays put.");
  X(W, ["rel", ["subject enters the frame", "subject leaves the frame"]], ["act", ["standing still", "sitting down", "leaning on a wall"]], "Entering or leaving the frame needs a moving character.");
  X(W, ["rel", ["subject enters the frame", "subject leaves the frame"]], ["move", ["orbit around subject", "tracking shot", "steadicam follow", "chase shot"]], "A follow or orbit keeps the subject in frame, so it cannot enter or leave it.");
  X(E, ["bgm", ["a frozen, still background"]], ["bgm", ["people walking past", "traffic passing", "trees swaying", "clouds drifting", "water rippling", "waves rolling in", "fire flickering"]], "A frozen background and a moving background contradict each other. Keep one.");
  X(W, ["bgm", ["a frozen, still background"]], ["atmo", ["falling snow", "rain streaks", "drifting smoke", "falling leaves", "confetti", "falling ash", "cherry blossom petals", "floating embers"]], "The background is frozen, but you also asked for falling or drifting particles.");
  X(W, ["bgm", ["a frozen, still background"]], ["crowd", ["busy bustling crowd", "packed crowd", "traffic and vehicles passing"]], "The background is frozen, but the crowd or traffic is meant to be busy.");
  X(W, ["bgm", ["people walking past", "people moving in the distance"]], ["crowd", ["empty and deserted", "single lone figure"]], "People are meant to walk past, but the crowd is set to empty or a lone figure.");
  X(W, ["micro", ["breath visible in the cold air"]], ["season", ["summer", "midsummer heat"]], "Visible breath needs cold air, which does not fit a summer or hot setting.");
  X(W, ["micro", ["hair blowing in the wind", "clothes rippling in the wind"]], ["act", ["sitting down", "kneeling"]], "Wind effects are easy to lose on a seated or kneeling figure. Keep them for standing or walking shots.");
  X(W, ["pace", ["time-lapse", "fast cuts"]], ["micro", ["breathing visibly", "blinking naturally", "a subtle smile forming", "a slow exhale", "jaw clenching", "tears forming"]], "Tiny details disappear in time-lapse or fast cuts. Use slower pacing or drop them.");
  X(W, ["pace", ["slow motion"]], ["spd", ["frantic, full speed", "hurried"]], "Slow motion and a frantic speed pull in opposite directions. The model will pick one.");
  /* ---- camera vocabulary (moves, zooms, angles) ---- */
  if (CAM) {
    CAM.OPPOSITES.forEach(([a, b]) => X(E, ["move", [a]], ["move", [b]], `“${a}” and “${b}” are opposite moves and cancel each other. Keep one.`));
    X(W, ["move", CAM.ZOOMS], ["move", ["slow push-in", "slow pull-out", "drone push in", "drone pull back", "tracking shot", "steadicam follow", "chase shot"]], "A zoom changes the lens and a dolly or track moves the camera. Together they fight over the framing. Pick one, or say exactly which does what.");
    X(W, ["move", ["crash zoom in", "crash zoom out", "fast zoom in", "fast zoom out"]], ["mood", ["calm", "romantic", "dreamlike"]], "A fast or crash zoom is abrupt and jarring. It fights a calm, romantic or dreamy mood.");
    X(W, ["move", ["Snorricam body-mounted camera"]], ["move", ["drone fly-over", "crane up", "crane down", "helicopter shot", "orbit around subject", "orbit clockwise", "orbit counterclockwise"]], "A body-mounted camera is locked to the subject, so it cannot also fly or orbit around them.");
    X(W, ["move", ["earth zoom out", "infinite zoom", "pass-through-objects shot"]], ["move", NOSTATIC.filter(m => !["earth zoom out", "infinite zoom", "pass-through-objects shot"].includes(m))], "This is a single continuous special move. Stacking another camera move on top usually breaks it.");
    X(W, ["angle", ["worm's-eye view", "ground-level angle"]], ["move", ["drone fly-over", "drone pull back", "drone push in", "helicopter shot", "crane up"]], "A drone or crane looks down from above, while this angle sits on the ground looking up. They contradict.");
    X(W, ["angle", ["overhead top-down shot", "bird's-eye view"]], ["move", ["low tracking shot", "tilt up", "pedestal up", "pedestal down"]], "Looking straight down leaves little room for tilts or height changes. The move will look odd.");
    X(W, ["angle", ["from-behind angle"]], ["facing", ["facing the camera", "walking toward the camera"]], "The camera is behind the subject, but the subject is set to face the camera. Pick one.");
    X(W, ["angle", ["profile angle"]], ["facing", ["facing the camera", "back to the camera", "walking toward the camera", "walking away from the camera"]], "A profile angle shows the side of the subject. Facing the camera or turning away contradicts it.");
    X(W, ["angle", ["upside-down angle", "extreme dutch angle"]], ["style", ["documentary realism"]], "Extreme rolls break the calm, believable look of documentary realism.");
    X(W, ["angle", ["single shot"]], ["crowd", ["packed crowd", "busy bustling crowd"]], "A single shot frames one character alone, but the crowd setting is packed. Make the crowd the background or pick a wider angle.");
  }

  const fns = [];
  fns.push((s) => {
    const sel = s.sel || {}, a = sel.act || [], out = [];
    if (a.length > 2) out.push({ l: W, targets: a.map(v => ({ g: "act", v })), msg: "More than two actions in one short clip is hard for a model to show. Split them into separate scenes." });
    const big = a.filter(v => BIG.includes(v));
    if (big.length >= 2 && a.length <= 2) out.push({ l: T, targets: big.map(v => ({ g: "act", v })), msg: "Two big actions at once rarely both appear. Pick one, or make them two scenes." });
    if (a.length && (s.action || "").trim()) out.push({ l: T, targets: [{ g: "action", v: s.action }].concat(a.map(v => ({ g: "act", v }))), msg: "You have both a “Doing what” text and action picks. They are combined in the prompt, so make sure they do not repeat or contradict each other." });
    return out;
  });
  fns.push((s) => {
    const sel = s.sel || {}, n = ["act", "spd", "dirm", "micro", "bgm", "rel"].reduce((x, k) => x + (sel[k] || []).length, 0);
    if (n > 7) return [{ l: T, targets: [], msg: `You picked ${n} movement options. Models follow a few movements well and drop the rest. Keep the ones that matter most.` }];
    return [];
  });

  fns.push((s, S) => {
    const fields = [["action", s.action], ["setting", s.setting], ["subject", s.subject], ["envText", s.envText]];
    const re = /\b(cinematic (shot|camera)|dynamic (camera|shot|movement)|epic shot|amazing|stunning|beautiful shot|high quality|masterpiece)\b/i;
    const out = [];
    fields.forEach(([g, v]) => { const m = (v || "").match(re); if (m) out.push({ l: T, targets: [{ g, v }], msg: `“${m[0]}” is too vague for a video model to act on. Say what the camera actually does (a shot size, a move, a lens) or what the light looks like.` }); });
    return out;
  });
  fns.push((s) => {
    if (!SL) return [];
    const st = (s.sel && s.sel.style) || [];
    const med = st.map(n => ({ n, f: SL.famOf[n], m: (SL.find(n) || { item: {} }).item.m })).filter(x => x.m && x.f);
    const fams = [...new Set(med.map(x => x.f))];
    if (fams.length < 2) return [];
    return [{ l: W, targets: med.map(x => ({ g: "style", v: x.n })), msg: `${med.map(x => "“" + x.n + "”").join(" and ")} are different mediums (${fams.map(f => SL.famLabel(f)).join(" / ")}). Video models pick one or make a muddy mix. Keep one main style and drop the other, or use a Mood & genre style as the extra.` }];
  });
  fns.push((s) => {
    if ((s.subject || "").trim() || (s.action || "").trim() || s.char) return [];
    return [{ l: W, targets: [{ g: "subject" }, { g: "action" }], msg: "No subject or action yet. Without “Who / what” and “Doing what” the model will invent the content and the video will look generic." }];
  });
  fns.push((s) => {
    const out = [];
    ["subject", "action", "setting", "dialog"].forEach(f => {
      const t = s[f]; if (!t) return; const hit = findChar(t);
      if (hit) out.push({ l: W, targets: [{ g: f, v: t }], msg: `“${hit}” looks like a named character. Many video models block or distort named or copyrighted characters. Describe the look instead, for example “a young masked hero in a red and blue suit”.` });
    });
    return out;
  });
  fns.push((s, S) => {
    const c = (S.chars || []).find(x => x.id === s.char); if (!c) return [];
    const out = [];
    Object.keys(c.attrs || {}).forEach(k => { const t = c.attrs[k]; if (!t) return; const h = findChar(t);
      if (h) out.push({ l: W, targets: [{ g: "char", v: t }], msg: `The character card mentions “${h}”, which looks like a named character. Many video models block or distort these. Describe the look instead.` }); });
    return out;
  });
  fns.push((s, S) => {
    const c = (S.chars || []).find(x => x.id === s.char);
    const moon = MOONRE.test(s.setting || "") || ((s.sel || {}).loc || []).includes("moon surface");
    if (!c || !moon) return [];
    const o = (c.attrs || {}).outfit || "";
    if (/suit|helmet|armou?r|exo/i.test(o)) return [];
    return [{ l: T, targets: [{ g: "char", v: o || "outfit" }], msg: "There is no air on a moon's surface, so a character in everyday clothes will look odd unless the scene is stylized. A space suit or helmet reads as correct." }];
  });
  fns[fns.length - 1].real = 1;
  fns.push((s) => {
    const words = (s.dialog || "").trim().split(/\s+/).filter(Boolean).length; if (!words) return [];
    const need = words / 2.5, dur = +s.dur || 5;
    if (need > dur + 0.5) return [{ l: W, targets: [{ g: "dialog", v: s.dialog }, { g: "dur" }], msg: `This dialogue takes about ${need.toFixed(1)}s to say, but the scene is ${dur}s. Shorten the line or lengthen the scene, or the speech will be rushed or cut off.` }];
    return [];
  });
  fns.push((s) => {
    const sel = s.sel || {}, out = [], hasD = (s.dialog || "").trim();
    if (hasD && (sel.pace || []).some(p => ["slow motion", "time-lapse"].includes(p))) out.push({ l: W, targets: [{ g: "dialog", v: s.dialog }].concat(sel.pace.map(v => ({ g: "pace", v }))), msg: "Speech does not survive slow motion or time-lapse. Lip sync and audio will break." });
    return out;
  });
  fns.push((s) => {
    const d = +s.dur || 5;
    if (d > 10) return [{ l: T, targets: [{ g: "dur" }], msg: "Long single clips tend to drift (faces, props and details change). Consider splitting this into two scenes." }];
    if (d < 2) return [{ l: W, targets: [{ g: "dur" }], msg: "Under 2 seconds is too short for most video models to show your action." }];
    return [];
  });
  fns.push((s) => {
    const a = (s.action || ""); if (!a.trim()) return [];
    const n = (a.match(/\b(then|after that|afterwards|before|while|and then)\b/gi) || []).length + (a.match(/,/g) || []).length + Math.max(0, (a.match(/\band\b/gi) || []).length - 1);
    if (n >= 2) return [{ l: W, targets: [{ g: "action", v: a }], msg: "That looks like several actions in one clip. Short clips handle one or two. Split it into separate scenes for a reliable result." }];
    return [];
  });
  fns.push((s) => {
    const sel = s.sel || {}, sh = (sel.shot || []).filter(x => ["two-shot", "over-the-shoulder shot"].includes(x));
    const sub = (s.subject || "").trim();
    if (sh.length && sub && !/\b(and|two|couple|pair|both|with|friends|group|men|women|people|duo|siblings|brothers|sisters)\b|&|\+/i.test(sub))
      return [{ l: W, targets: sh.map(v => ({ g: "shot", v })).concat([{ g: "subject", v: s.subject }]), msg: "This shot needs two people but Who / what describes only one. Add the second person." }];
    return [];
  });
  fns.push((s) => {
    const out = [];
    ["subject", "action", "setting", "dialog"].forEach(f => {
      const t = s[f]; if (t && /\b(text|logo|sign (?:saying|reading)|caption|subtitles?|lettering|slogan|brand name)\b/i.test(t))
        out.push({ l: W, targets: [{ g: f, v: t }], msg: "AI video models usually render text and logos wrongly (garbled letters). Add text in editing instead." });
    });
    return out;
  });
  fns.push((s) => {
    const sel = s.sel || {}, n = Object.keys(sel).reduce((a, k) => a + (sel[k] || []).length, 0);
    if (n > 10) return [{ l: T, targets: [], msg: `You picked ${n} effects. Too many instructions compete and the model ignores some. Keep the ones that matter most.` }];
    return [];
  });
  fns.push((s) => {
    const m = ((s.sel || {}).move || []);
    if (m.length > 2) return [{ l: T, targets: m.map(v => ({ g: "move", v })), msg: "More than two camera moves in one short clip is hard to follow, and models rarely do all of them." }];
    return [];
  });

  /* ---- engine ---- */
  const SUB = new Set(["quality", "neg"]), TEXTG = ["setting", "subject", "action", "dialog"];
  function src(g, s, S) {
    if (g === "quality") return S.quality ? [S.quality] : [];
    if (g === "aspect") return S.aspect ? [S.aspect] : [];
    if (g === "neg") return S.gNeg ? [S.gNeg] : [];
    if (TEXTG.includes(g)) return (s[g] && s[g].trim()) ? [s[g]] : [];
    return (s.sel && s.sel[g]) || [];
  }
  const hit = (g, spec, s, S) => src(g, s, S).filter(v => spec.some(sp => sp instanceof RegExp ? sp.test(v) : SUB.has(g) ? v.toLowerCase().includes(sp.toLowerCase()) : v === sp));
  function checkScene(s0, S) {
    const out = [];
    let s = s0;
    const ang = (s0.sel && s0.sel.angle) || [];
    if (ang.length) s = Object.assign({}, s0, { sel: Object.assign({}, s0.sel, { shot: [...((s0.sel && s0.sel.shot) || []), ...ang] }) });
    rules.forEach(r => {
      if (S.fantasy && r.real) return;
      const A = hit(r.a[0], r.a[1], s, S);
      if (r.one) { if (A.length >= 2) out.push({ l: r.l, msg: r.msg, targets: A.map(v => ({ g: r.a[0], v })) }); return; }
      const B = hit(r.b[0], r.b[1], s, S);
      if (!A.length || !B.length) return;
      if (r.a[0] === r.b[0] && !A.some(x => B.some(y => x !== y))) return;
      const t = [], seen = new Set();
      A.map(v => ({ g: r.a[0], v })).concat(B.map(v => ({ g: r.b[0], v }))).forEach(x => { const k = x.g + "|" + x.v; if (!seen.has(k)) { seen.add(k); t.push(x); } });
      out.push({ l: r.l, msg: r.msg, targets: t });
    });
    fns.forEach(f => { if (S.fantasy && f.real) return; f(s, S).forEach(i => out.push(i)); });
    out.forEach(i => i.targets.forEach(x => { if (x.g === "shot" && ANGSET.has(x.v)) x.g = "angle"; }));
    const o = { e: 0, w: 1, t: 2 };
    return out.sort((a, b) => o[a.l] - o[b.l]);
  }
  const stats = (() => {
    let combos = 0;
    rules.forEach(r => { const a = r.a[1].length, b = r.b[1].length; combos += r.one ? a * (a - 1) / 2 : a * b; });
    return { pairRules: rules.length, functionRules: fns.length, combos };
  })();
  root.checkScene = checkScene; root.RULE_STATS = stats;
  if (typeof module !== "undefined") module.exports = { checkScene, stats };
})(typeof window !== "undefined" ? window : globalThis);
