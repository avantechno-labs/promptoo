/* Promptoo 3D stage: the engine and the plugin registry.
   Everything you see in the 3D preview is an EFFECT registered here. An effect is a small object:

     Stage3D.register({
       group: "move",                 // which option group it belongs to (shot, angle, lens, move, light, time, weather, ...)
       name:  "slow push-in",         // the option value stored in a scene (must match the option name in the app)
       ui:    { tip, fam, w, pop },   // OPTIONAL: adds the option to the app's tabs, tooltips and prompt wording if it is new
       order: 0,                      // OPTIONAL: tie-break inside a group (lower runs first)

       // every hook below is optional. Use only what the effect needs:
       env(E, ctx)            // change the world state: sun, sky colors, fog, ambient, ground, exposure ...
       scene(ctx)             // build things: ctx.add(mesh), ctx.light(light), ctx.particles({...}) ...
       update(ctx, t, dt)     // per frame animation (t = 0..1 across the clip, dt in seconds)
       rig(r, t, ctx)         // move the camera: change r.dolly, r.yaw, r.zoom, r.pan, r.roll, r.shake ...
       subject(sub, t, ctx)   // move or pose the main character
       material(mat, mesh)    // return a replacement material for every mesh (toon, flat, ink ...)
       post: [ {pass:"pixelate", size:6}, ... ]   // post-processing passes by id (or a function (ctx) => [...])
     });
     Stage3D.registerPass({ id, order, shader:{uniforms, vertexShader, fragmentShader}, update(pass, ctx, t, opts) });

   Several effects can be active at once. Hooks run in a fixed group order (see GROUP_ORDER), then by `order`. */
(function (root) {
  "use strict";
  const T = root.THREE;
  if (!T) { root.Stage3D = { available: false }; return; }

  // linear light everywhere in the scene; the tonemap pass converts to display light, so hex colors are read as sRGB here
  if (T.ColorManagement) { T.ColorManagement.legacyMode = false; T.ColorManagement.enabled = true; }
  const rawColor = (c, hex) => { if (typeof hex === "string") { const n = parseInt(hex.replace("#", ""), 16); c.setHex(n, T.LinearSRGBColorSpace); } else c.set(hex); return c; };  // display-light colors for post passes (no conversion)

  const REG = Object.create(null), PASSES = Object.create(null);
  const GROUP_ORDER = ["loc", "era", "time", "season", "weather", "atmo", "crowd", "light", "mood", "shot", "angle", "lens", "place", "facing", "frame", "move", "pace", "trans", "grade", "style"];
  const gIndex = g => { const i = GROUP_ORDER.indexOf(g); return i < 0 ? 99 : i; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  const Stage3D = { available: true, THREE: T, REG, PASSES, GROUP_ORDER, util: { clamp, lerp, smooth, rad, deg, rng, hash }, hooks: {}, listeners: [] };

  /* ---------- registry ---------- */
  Stage3D.register = function (e) {
    if (!e || !e.group || !e.name) throw new Error("effect needs a group and a name");
    (REG[e.group] = REG[e.group] || Object.create(null))[e.name] = e;
    if (e.ui && Stage3D.hooks.addOption) Stage3D.hooks.addOption(e);
    return e;
  };
  Stage3D.registerMany = function (group, table, make) {
    Object.keys(table).forEach(name => Stage3D.register(Object.assign({ group, name }, make(table[name], name))));
  };
  Stage3D.registerPass = function (def) { PASSES[def.id] = def; return def; };
  Stage3D.get = (group, name) => (REG[group] || {})[name] || null;
  Stage3D.has = (group, name) => !!Stage3D.get(group, name);
  Stage3D.names = group => Object.keys(REG[group] || {});

  /* ---------- helpers every effect can use ---------- */
  const matCache = new Map();
  Stage3D.mat = function (color, o) {
    o = o || {};
    const key = color + "|" + (o.rough == null ? .85 : o.rough) + "|" + (o.metal || 0) + "|" + (o.emissive || "") + "|" + (o.flat ? 1 : 0) + "|" + (o.side || 0) + "|" + (o.opacity == null ? 1 : o.opacity);
    let m = matCache.get(key);
    if (!m) {
      m = new T.MeshStandardMaterial({ color, roughness: o.rough == null ? .85 : o.rough, metalness: o.metal || 0, flatShading: !!o.flat, side: o.side || T.FrontSide });
      if (o.emissive) { m.emissive = new T.Color(o.emissive); m.emissiveIntensity = o.emissiveIntensity || 1; }
      if (o.opacity != null && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; }
      m.userData.shared = true; matCache.set(key, m);
    }
    return m;
  };
  const geoCache = {};
  Stage3D.geo = function (k) {
    if (geoCache[k]) return geoCache[k];
    const g = { box: () => new T.BoxGeometry(1, 1, 1), sphere: () => new T.SphereGeometry(.5, 16, 12), cyl: () => new T.CylinderGeometry(.5, .5, 1, 12), cone: () => new T.ConeGeometry(.5, 1, 10), cap: () => { const g = new T.CapsuleGeometry(.25, .5, 4, 10); g.scale(2, 1, 2); return g; }, plane: () => new T.PlaneGeometry(1, 1), torus: () => new T.TorusGeometry(.5, .06, 8, 28), icos: () => new T.IcosahedronGeometry(.5, 0) }[k]();
    g.userData.shared = true; return (geoCache[k] = g);
  };
  Stage3D.mesh = function (g, color, pos, scl, o) {
    const m = new T.Mesh(Stage3D.geo(g), Stage3D.mat(color, o));
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    m.castShadow = true; m.receiveShadow = true; return m;
  };

  /* ---------- the stage ---------- */
  const SUBJECT_H = 1.75;
  function defaultEnv() {
    return { skyTop: "#5a9be0", skyHorizon: "#cfe6ff", groundColor: "#7d7a56", sunElev: 55, sunAzim: 40, sunColor: "#fff3d6", sun: 2.4, ambient: .7, ambientGround: "#4a4a40",
      fogColor: "#cfe6ff", fogDensity: .006, exposure: 1.0, stars: 0, moon: 0, shadows: true, ground: true, groundSize: 600, overrideMaterial: null, bg: null, aurora: 0, sunDisc: 1, tint: null };
  }
  function defaultRig() {
    return { frameH: 1.3, targetY: .55, fov0: 38, dolly: 1, zoom: 1, yaw: 0, pitch: 4, roll: 0, lift: 0, truck: 0, pan: 0, tilt: 0, shake: 0, follow: 0, shiftX: 0, shiftY: 0,
      aperture: 0, focusMul: 1, blur: 0, fade: 0, fadeColor: "#000000", flash: 0, attach: 0, lookAhead: 0 };
  }

  class Stage {
    constructor(opts) {
      opts = opts || {};
      this.canvas = opts.canvas || document.createElement("canvas");
      this.width = opts.width || 320; this.height = opts.height || 180; this.pr = opts.pixelRatio || Math.min(root.devicePixelRatio || 1, 1.5);
      this.renderer = new T.WebGLRenderer({ canvas: this.canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "low-power" });
      this.renderer.outputEncoding = T.LinearEncoding; this.renderer.toneMapping = T.NoToneMapping;
      this.renderer.physicallyCorrectLights = true;   // point lights fall off with distance (intensity in candela); directional and ambient levels below are scaled by pi to match
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.renderer.setPixelRatio(1);
      this.camera = new T.PerspectiveCamera(40, this.width / this.height, .05, 6000);
      this.clock = { t0: performance.now(), last: performance.now() };
      this.state = null; this.playing = false; this.speed = 1; this.dur = 5; this.t = 0; this.paused = false; this.errors = [];
      this.overlay = null; this.onFrame = null; this.ctx = null; this.composer = null;
      this.setSize(this.width, this.height);
    }
    setSize(w, h) {
      this.width = Math.max(16, Math.round(w)); this.height = Math.max(16, Math.round(h));
      this.renderer.setSize(this.width * this.pr, this.height * this.pr, false);
      this.canvas.style.width = this.width + "px"; this.canvas.style.height = this.height + "px";
      this.camera.aspect = this.width / this.height; this.camera.updateProjectionMatrix();
      if (this.composer) this.composer.setSize(this.width * this.pr, this.height * this.pr);
      if (this.overlay) { this.overlay.width = this.width * this.pr; this.overlay.height = this.height * this.pr; this.overlay.style.width = this.width + "px"; this.overlay.style.height = this.height + "px"; }
      if (this.ctx) this._resizePasses();
    }
    setAspect(a) { this.aspect = a; }

    /* Build the whole world from the scene's picks. input = { sel, scene:{subject,action,setting}, char:{attrs}, dur, seed } */
    apply(input) {
      input = input || {}; this.input = input;
      this._dispose();
      const sel = input.sel || {};
      const scene = new T.Scene(); const rootG = new T.Group(); scene.add(rootG);
      const ctx = this.ctx = { T, stage: this, scene, root: rootG, sel, input, H: SUBJECT_H, E: defaultEnv(), rig0: defaultRig(), actors: [], guides: [], updaters: [], rand: rng(hash(JSON.stringify(sel)) ^ (input.seed || 7)), time: 0, timeScale: 1, tracked: [], follow: null,
        dur: input.dur || 5, util: Stage3D.util, mat: Stage3D.mat, geo: Stage3D.geo, mesh: Stage3D.mesh, motion: null, st: null, extraPasses: [] };
      ctx.add = o => { rootG.add(o); return o; };
      ctx.light = l => { rootG.add(l); return l; };
      ctx.every = fn => { ctx.updaters.push(fn); };
      ctx.particles = o => Stage3D.makeParticles(ctx, o);

      // 1. resolve the active effects, in group order
      const active = [];
      GROUP_ORDER.forEach(g => (sel[g] || []).forEach(name => { const e = Stage3D.get(g, name); if (e) active.push(e); }));
      Object.keys(sel).forEach(g => { if (GROUP_ORDER.indexOf(g) < 0) (sel[g] || []).forEach(name => { const e = Stage3D.get(g, name); if (e) active.push(e); }); });
      active.sort((a, b) => gIndex(a.group) - gIndex(b.group) || (a.order || 0) - (b.order || 0));
      this.active = active; ctx.active = active;
      const call = (hook, ...args) => active.forEach(e => { if (typeof e[hook] === "function") { ctx.st = (ctx.states = ctx.states || new Map()).get(e) || (ctx.states.set(e, {}), ctx.states.get(e)); ctx.cur = e; try { e[hook](...args) } catch (err) { this._err(e, hook, err); } } });
      this._call = call;

      // 2. world state
      call("env", ctx.E, ctx);
      call("envLate", ctx.E, ctx);   // worlds that define their own sky and light (moon, underwater, interiors) win over time of day
      this._buildWorld(ctx);
      // 3. subject + extras
      if (Stage3D.makeDummy) { const d = Stage3D.makeDummy(input.char || {}, input.scene || {}, ctx); ctx.subject = d; ctx.actors.push(d); rootG.add(d.root); }
      call("scene", ctx);
      // 4. style materials
      if (active.some(e => typeof e.material === "function")) this._restyle(ctx, active);
      // 5. post chain
      this._buildPost(ctx, active);
      this.dur = ctx.dur; this.speed = 1;
      return this;
    }
    _err(e, hook, err) { this.errors.push(e.group + ":" + e.name + "." + hook + " -> " + (err && err.message || err)); if (root.console) console.warn("[Stage3D]", e.group, e.name, hook, err); }

    _buildWorld(ctx) {
      const E = ctx.E, scene = ctx.scene;
      scene.fog = E.fogDensity > 0 ? new T.FogExp2(new T.Color(E.fogColor), E.fogDensity) : null;
      // sky dome
      const sky = new T.Mesh(new T.SphereGeometry(2500, 24, 12), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new T.Color(E.skyTop) }, horizon: { value: new T.Color(E.skyHorizon) }, ground: { value: new T.Color(E.groundColor) }, sunDir: { value: new T.Vector3() }, sunColor: { value: new T.Color(E.sunColor) }, stars: { value: E.stars }, moon: { value: E.moon }, sunDisc: { value: E.sunDisc }, time: { value: 0 }, aurora: { value: E.aurora } },
        vertexShader: "varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
        fragmentShader: `varying vec3 vP; uniform vec3 top,horizon,ground,sunDir,sunColor; uniform float stars,moon,sunDisc,time,aurora;
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){ vec3 d=normalize(vP); float y=d.y; vec3 c=mix(horizon,top,pow(clamp(y,0.,1.),.55)); if(y<0.) c=mix(horizon,ground,clamp(-y*4.,0.,1.));
            float s=max(dot(d,sunDir),0.); c+=sunColor*(pow(s,8.)*.25+pow(s,400.)*sunDisc*3.);
            if(stars>0.&&y>0.){ vec2 g=floor(vec2(atan(d.x,d.z)*90.,y*160.)); float r=h(g); c+=vec3(step(.9965,r))*stars*smoothstep(0.,.2,y); }
            if(moon>0.){ vec3 md=normalize(vec3(-.5,.45,-.7)); float m=smoothstep(.9988,.9993,dot(d,md)); c=mix(c,vec3(.93,.95,1.),m*moon); }
            if(aurora>0.&&y>.05){ float w=sin(atan(d.x,d.z)*3.+time*.4)*.5+.5; float band=smoothstep(.12,.35,y)*smoothstep(.75,.35,y); vec3 ac=mix(vec3(.1,1.,.5),vec3(.6,.2,1.),w); c+=ac*band*aurora*(.5+.5*sin(atan(d.x,d.z)*7.+time*.8)); }
            gl_FragColor=vec4(c,1.); }` }));
      sky.userData.noStyle = true; sky.userData.sky = true; sky.renderOrder = -10; ctx.sky = sky; scene.add(sky);
      // sun + ambient
      const az = rad(E.sunAzim), el = rad(E.sunElev), dir = new T.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      sky.material.uniforms.sunDir.value.copy(dir);
      const sun = new T.DirectionalLight(new T.Color(E.sunColor), E.sun * Math.PI); sun.position.copy(dir).multiplyScalar(60);
      sun.castShadow = !!E.shadows; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 160; sun.shadow.bias = -.0006;
      ctx.root.add(sun); ctx.sun = sun;
      const hemi = new T.HemisphereLight(new T.Color(E.skyHorizon), new T.Color(E.ambientGround), E.ambient * 1.7 * Math.PI); ctx.root.add(hemi); ctx.hemi = hemi;
      if (E.ground) {
        const g = new T.Mesh(new T.CircleGeometry(E.groundSize, 48), new T.MeshStandardMaterial({ color: E.groundColor, roughness: 1, metalness: 0 }));
        g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.userData.ground = true; ctx.root.add(g); ctx.groundMesh = g;
      }
      ctx.dirToSun = dir;
    }
    _restyle(ctx, active) {
      const fns = active.filter(e => typeof e.material === "function");
      const cache = new Map();
      ctx.scene.traverse(o => {
        if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
        if (o.userData.noStyle || o.isPoints) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material]; const out = mats.map(m => {
          if (!m || m.userData.noStyle) return m;
          let key = m.uuid + fns.map(f => f.name).join(); if (cache.has(key)) return cache.get(key);
          let r = m; fns.forEach(f => { try { const x = f.material(r, o, ctx); if (x) r = x; } catch (e) { this._err(f, "material", e); } });
          if (r !== m) { r.userData.styled = true; r.userData.shared = false; } cache.set(key, r); return r;
        });
        o.material = Array.isArray(o.material) ? out : out[0];
      });
    }

    /* ----- post-processing: effects list passes by id; the stage sorts and builds them ----- */
    _buildPost(ctx, active) {
      const specs = [];
      active.forEach(e => {
        let p = e.post; if (typeof p === "function") { try { p = p(ctx) } catch (err) { this._err(e, "post", err); p = null; } }
        (p || []).forEach(s => specs.push(Object.assign({ _from: e }, s)));
      });
      (ctx.extraPasses || []).forEach(s => specs.push(s));
      if (!specs.some(s => s.pass === "dirblur")) specs.push({ pass: "dirblur" });
      if (!specs.some(s => s.pass === "fade")) specs.push({ pass: "fade" });
      specs.push({ pass: "tonemap" });
      specs.sort((a, b) => ((PASSES[a.pass] || {}).order || 50) - ((PASSES[b.pass] || {}).order || 50));
      this.specs = specs;
      if (this.composer) { this.composer.passes.forEach(p => p.dispose && p.dispose()); }
      const rt = new T.WebGLRenderTarget(this.width * this.pr, this.height * this.pr, { type: T.HalfFloatType, samples: 4 });
      const composer = this.composer = new T.EffectComposer(this.renderer, rt);
      composer.setPixelRatio(1); composer.setSize(this.width * this.pr, this.height * this.pr);
      composer.addPass(new T.RenderPass(ctx.scene, this.camera));
      this.passes = [];
      specs.forEach(s => {
        const def = PASSES[s.pass]; if (!def) { this.errors.push("unknown pass " + s.pass); return; }
        let pass;
        try {
          if (def.factory) pass = def.factory(ctx, s, this); else {
            pass = new T.ShaderPass({ uniforms: def.shader.uniforms || {}, vertexShader: def.shader.vertexShader || DEFAULT_VS, fragmentShader: def.shader.fragmentShader });
            const u = pass.uniforms;   // ShaderPass clones the uniforms, so set the effect's options on the pass's own copy
            Object.keys(s).forEach(k => { if (k[0] !== "_" && k !== "pass" && u[k]) { const v = s[k]; if (u[k].value && u[k].value.isColor) rawColor(u[k].value, v); else if (u[k].value && u[k].value.isVector2 && Array.isArray(v)) u[k].value.set(v[0], v[1]); else if (u[k].value && u[k].value.isVector3 && Array.isArray(v)) u[k].value.set(v[0], v[1], v[2]); else u[k].value = v; } });
            if (u.resolution) u.resolution.value.set(this.width * this.pr, this.height * this.pr);
          }
          pass._def = def; pass._spec = s; composer.addPass(pass); this.passes.push(pass);
        } catch (err) { this.errors.push("pass " + s.pass + ": " + err.message); }
      });
      // the last pass draws to the screen
      composer.passes.forEach(p => { p.renderToScreen = false; });
      const last = composer.passes[composer.passes.length - 1]; if (last) last.renderToScreen = true;
      if (composer.passes.length === 1) { const c = new T.ShaderPass(T.CopyShader); composer.addPass(c); c.renderToScreen = true; }
    }
    _resizePasses() { (this.passes || []).forEach(p => { const u = p.uniforms; if (u && u.resolution) u.resolution.value.set(this.width * this.pr, this.height * this.pr); if (p._def && p._def.resize) p._def.resize(p, this); }); }

    /* ----- one frame at t (0..1) ----- */
    renderAt(t, dt) {
      const ctx = this.ctx; if (!ctx) return; dt = dt || 1 / 60; this.t = t; ctx.t = t; ctx.time += dt;
      if (ctx.fps) { const d = ctx.dur || 5; t = Math.floor(t * d * ctx.fps) / (d * ctx.fps); }
      const r = Object.assign({}, ctx.rig0); r.truck = r.truck || 0;
      const call = this._call;
      call("subject", ctx.subject, t, ctx);
      call("rig", r, t, ctx);
      call("update", ctx, t, dt);
      ctx.updaters.forEach(f => f(t, dt, ctx));
      if (ctx.subject && ctx.subject.update) ctx.subject.update(t, dt, ctx);
      if (ctx.sky) ctx.sky.material.uniforms.time.value = ctx.time;
      this._solve(r, ctx);
      (this.passes || []).forEach(p => { if (p._def && p._def.update) p._def.update(p, ctx, t, p._spec, r, this); });
      this.composer.render(dt);
      if (this.overlay) this._drawGuides();
      if (this.onFrame) this.onFrame(t);
    }
    _drawGuides() {
      const g = this.overlay.getContext("2d"); const w = this.overlay.width, h = this.overlay.height; g.clearRect(0, 0, w, h);
      (this.ctx.guides || []).forEach(fn => { g.save(); try { fn(g, w, h) } catch (e) {} g.restore(); });
    }
    _solve(r, ctx) {
      const H = ctx.H, cam = this.camera, aspect = this.width / this.height;
      const sub = ctx.subject ? ctx.subject.root.position : new T.Vector3();
      const fovRad = rad(r.fov0);
      // the framing is defined for a 16:9 frame; keep it when the aspect changes by fitting to the width as well
      const fitH = Math.max(r.frameH * H, (r.frameH * H * (16 / 9)) / aspect * (aspect < 16 / 9 ? .62 : 1));
      const dist = fitH / (2 * Math.tan(fovRad / 2)) * r.dolly;
      const base = r.follow ? (ctx.followObj ? ctx.followObj.position : sub) : new T.Vector3(ctx.subject ? ctx.subject.home.x : 0, 0, ctx.subject ? ctx.subject.home.z : 0);
      const target = new T.Vector3(base.x, r.targetY * H, base.z);
      let yaw = rad(r.yaw + (r.attach && ctx.subject ? deg(ctx.subject.root.rotation.y) : 0)), pitch = rad(r.pitch);
      const dir = new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      const right = new T.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const pos = target.clone().addScaledVector(dir, dist);
      pos.addScaledVector(right, r.truck * H); target.addScaledVector(right, r.truck * H);
      pos.y += r.lift * H; target.y += r.lift * H;
      if (r.lookAhead) { const fwd = new T.Vector3(-dir.x, 0, -dir.z).normalize(); target.addScaledVector(fwd, r.lookAhead); }
      // pan and tilt turn the view without moving the camera
      const f = target.clone().sub(pos); const len = f.length(); f.normalize();
      if (r.pan) f.applyAxisAngle(new T.Vector3(0, 1, 0), rad(r.pan));
      if (r.tilt) { const ax = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize(); if (ax.lengthSq() > 0) f.applyAxisAngle(ax, rad(r.tilt)); }
      const look = pos.clone().addScaledVector(f, len);
      if (r.shake) { const tt = ctx.time * 9, s = r.shake; pos.x += (Math.sin(tt * 1.3) + Math.sin(tt * 2.9)) * s * H * .2; pos.y += (Math.sin(tt * 1.7) + Math.cos(tt * 3.3)) * s * H * .2; look.x += Math.sin(tt * 2.1) * s * H * .3; look.y += Math.cos(tt * 2.6) * s * H * .3; }
      if (r.pov && ctx.subject) { const sr = ctx.subject.root, hd = new T.Vector3(0, 1.62 * H / 1.75, 0).add(sr.position), fw = new T.Vector3(Math.sin(sr.rotation.y), 0, Math.cos(sr.rotation.y)); pos.copy(hd).addScaledVector(fw, .15); look.copy(hd).addScaledVector(fw, 10); }
      if (pos.y < .06) pos.y = .06;
      cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(look);
      if (r.roll) cam.rotateZ(rad(r.roll));
      cam.fov = deg(2 * Math.atan(Math.tan(fovRad / 2) / r.zoom)); cam.aspect = aspect;
      if (r.shiftX || r.shiftY) { const fw = this.width, fh = this.height; cam.setViewOffset(fw, fh, -r.shiftX * fw, r.shiftY * fh, fw, fh); } else cam.clearViewOffset();
      cam.updateProjectionMatrix();
      ctx.camDist = dist; ctx.camPos = pos; ctx.lastRig = r;
    }

    /* ----- play loop ----- */
    start() {
      if (this.playing) return; this.playing = true; this._last = performance.now(); this._acc = 0;
      const loop = now => {
        if (!this.playing) return; this._raf = requestAnimationFrame(loop);
        if (document.hidden || this.paused) { this._last = now; return; }
        const dt = Math.min(.1, (now - this._last) / 1000); this._last = now;
        if (!this.ctx) return;
        this._acc += dt * (this.ctx.timeScale || 1) * this.speed;
        const dur = Math.max(1, this.dur || 5); const t = (this._acc % dur) / dur;
        this.renderAt(t, dt);
      };
      this._raf = requestAnimationFrame(loop);
    }
    stop() { this.playing = false; if (this._raf) cancelAnimationFrame(this._raf); }
    pause(v) { this.paused = v == null ? !this.paused : !!v; return this.paused; }
    seek(t) { this._acc = t * (this.dur || 5); this.renderAt(t, 0); }
    snapshot(t, w, h) {
      const ow = this.width, oh = this.height;
      if (w && h) this.setSize(w, h);
      this.renderAt(t == null ? this.t : t, 0);
      const url = this.canvas.toDataURL("image/png");
      if (w && h) { this.setSize(ow, oh); this.renderAt(this.t, 0); }
      return url;
    }
    _dispose() {
      const ctx = this.ctx; if (!ctx) return;
      this.stop && this.playing && (this._wasPlaying = true);
      ctx.scene.traverse(o => {
        if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        ms.forEach(m => { if (m && !m.userData.shared) { Object.keys(m).forEach(k => { if (m[k] && m[k].isTexture && !m[k].userData.shared) m[k].dispose(); }); m.dispose(); } });
      });
      if (this.composer) { this.composer.passes.forEach(p => p.dispose && p.dispose()); this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); this.composer = null; }
      this.ctx = null;
    }
    destroy() { this.stop(); this._dispose(); this.renderer.dispose(); }
  }
  const DEFAULT_VS = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }";
  Stage3D.DEFAULT_VS = DEFAULT_VS; Stage3D.rawColor = rawColor; Stage3D.Stage = Stage;
  Stage3D.defaultRig = defaultRig; Stage3D.defaultEnv = defaultEnv;
  Stage3D.canWebGL = function () { if (/jsdom/i.test(navigator.userAgent || "")) return false; try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } };

  /* ---------- particles: one helper for rain, snow, dust, sparks, petals, bubbles, confetti ... ---------- */
  Stage3D.makeParticles = function (ctx, o) {
    o = Object.assign({ count: 800, area: [24, 14, 24], center: [0, 7, 0], size: .08, color: "#ffffff", speed: [0, -4, 0], jitter: [.3, .3, .3], opacity: .8, wrap: true, shape: "points", streak: 0, sway: 0, twinkle: 0, glow: false, gravityFree: false, size2: .02 }, o);
    const n = o.count, R = rng(hash(o.color) + n);
    const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = o.center[0] + (R() - .5) * o.area[0]; pos[i * 3 + 1] = o.center[1] + (R() - .5) * o.area[1]; pos[i * 3 + 2] = o.center[2] + (R() - .5) * o.area[2];
      vel[i * 3] = o.speed[0] + (R() - .5) * o.jitter[0] * 2; vel[i * 3 + 1] = o.speed[1] + (R() - .5) * o.jitter[1] * 2; vel[i * 3 + 2] = o.speed[2] + (R() - .5) * o.jitter[2] * 2; ph[i] = R() * 6.28;
    }
    let obj;
    if (o.streak) { // rain-like streaks: line segments along the velocity
      const g = new T.BufferGeometry(); const seg = new Float32Array(n * 6); g.setAttribute("position", new T.BufferAttribute(seg, 3));
      obj = new T.LineSegments(g, new T.LineBasicMaterial({ color: o.color, transparent: true, opacity: o.opacity, fog: false, depthWrite: false })); obj.frustumCulled = false;
      obj.userData.update = dt => { for (let i = 0; i < n; i++) { for (let k = 0; k < 3; k++) { pos[i * 3 + k] += vel[i * 3 + k] * dt; } wrap(i);
        const vx = vel[i * 3], vy = vel[i * 3 + 1], vz = vel[i * 3 + 2], l = Math.hypot(vx, vy, vz) || 1, s = o.streak / l;
        seg[i * 6] = pos[i * 3]; seg[i * 6 + 1] = pos[i * 3 + 1]; seg[i * 6 + 2] = pos[i * 3 + 2]; seg[i * 6 + 3] = pos[i * 3] - vx * s; seg[i * 6 + 4] = pos[i * 3 + 1] - vy * s; seg[i * 6 + 5] = pos[i * 3 + 2] - vz * s; }
        g.attributes.position.needsUpdate = true; };
    } else {
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3));
      const m = new T.PointsMaterial({ color: o.color, size: o.size, transparent: true, opacity: o.opacity, depthWrite: false, sizeAttenuation: true, fog: false, blending: o.glow ? T.AdditiveBlending : T.NormalBlending, map: Stage3D.dotTex(), alphaTest: .01 });
      obj = new T.Points(g, m); obj.frustumCulled = false;
      obj.userData.update = (dt, time) => { for (let i = 0; i < n; i++) { pos[i * 3] += vel[i * 3] * dt + (o.sway ? Math.sin(time * 1.3 + ph[i]) * o.sway * dt : 0); pos[i * 3 + 1] += vel[i * 3 + 1] * dt + (o.twinkle ? Math.sin(time * 2 + ph[i]) * o.twinkle * dt : 0); pos[i * 3 + 2] += vel[i * 3 + 2] * dt; wrap(i); }
        g.attributes.position.needsUpdate = true; if (o.twinkle) m.opacity = o.opacity * (.7 + .3 * Math.sin(time * 3)); };
    }
    function wrap(i) { for (let k = 0; k < 3; k++) { const lo = o.center[k] - o.area[k] / 2, hi = o.center[k] + o.area[k] / 2; if (pos[i * 3 + k] < lo) pos[i * 3 + k] += o.area[k]; else if (pos[i * 3 + k] > hi) pos[i * 3 + k] -= o.area[k]; } }
    obj.userData.noStyle = true; ctx.add(obj);
    ctx.every((t, dt, c) => obj.userData.update(Math.min(dt, .05) || .016, c.time));
    obj.userData.update(.0, 0);
    return obj;
  };
  let _dot; Stage3D.dotTex = function () {
    if (_dot) return _dot; const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d");
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.5, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); _dot = new T.CanvasTexture(c); _dot.userData.shared = true; return _dot;
  };

  root.Stage3D = Stage3D;
})(typeof window !== "undefined" ? window : globalThis);
