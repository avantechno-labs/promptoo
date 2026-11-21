# Adding effects to Promptoo's 3D preview

Everything in the 3D preview is a plug-in "effect". To add one you write **one entry** and add (at most) **one script tag**. Nothing else in the app has to change.

```
stage/core.js      the engine and the effect registry (Stage3D.register ...)
stage/passes.js    post-processing passes: grade, outline, pixelate, halftone, bloom, dof ...
stage/dummy.js     the stand-in character (colors, hair, accessories come from the character card)
effects/camera.js  shot sizes, angles, lenses, camera moves
effects/world.js   time of day, lighting, mood, color grade, weather, season, atmosphere
effects/places.js  locations, eras, crowds
effects/compose.js placement, facing, framing guides, pacing, transitions
effects/look.js    visual styles (post chains and material swaps)
stage/packs.js     the same thing as JSON, for users (no code)
```

## 1. The shape of an effect

```js
Stage3D.register({
  group: "move",                    // shot, angle, lens, move, light, mood, grade, time, weather, season, atmo,
                                    // loc, era, crowd, place, facing, frame, pace, trans, style
  name:  "my slow slide",           // the option value stored in a scene
  ui:    { tip: "Glide, then settle", w: "glides sideways and settles", fam: "phys", pop: 0 },
                                    // OPTIONAL. Adds the option to the app (tab, tooltip, prompt wording)
                                    // if it is new. Leave it out for options the app already has.
  env(E, ctx)          { E.sunElev = 8; E.fogDensity += .01 },                // change the world state
  scene(ctx)           { ctx.add(mesh); ctx.light(light); ctx.particles({...}) },   // build things
  update(ctx, t, dt)   { },                                                    // per-frame animation
  rig(r, t, ctx)       { r.truck += (t - .5) * 2 },                           // move the camera
  subject(sub, t, ctx) { sub.root.rotation.y = 1 },                           // move or pose the character
  material(m, mesh)    { return new THREE.MeshToonMaterial({ color: m.color }) },   // swap materials
  post: [ { pass: "outline", thickness: 1.4 }, { pass: "grade", saturation: 1.3 } ] // or (ctx) => [...]
});
```

Every hook is optional. `t` runs 0..1 across the clip. Several effects can be active at once; they run in a fixed group order
(`Stage3D.GROUP_ORDER`), then by `order`.

### Camera rig fields (`rig(r, t, ctx)`)

| field | meaning |
|---|---|
| `frameH`, `targetY` | how much of the subject fills the frame (in subject heights) and where the camera aims |
| `fov0` | lens (vertical field of view in degrees). A wider lens moves the camera closer for the same framing |
| `dolly` | distance multiplier (camera moves) |
| `zoom` | lens magnification only (camera stays where it is) |
| `yaw`, `pitch`, `roll` | degrees around the subject, above/below, tilt of the horizon |
| `pan`, `tilt` | the view turns, the camera stays |
| `truck`, `lift` | sideways / up, in subject heights |
| `shake` | handheld shake amount |
| `follow`, `attach` | follow the subject or a vehicle / be rigidly attached to the subject |
| `shiftX`, `shiftY` | move the subject inside the frame (fraction of the frame) |
| `blur`, `fade`, `fadeColor`, `flash` | motion blur, fade to a color, white flash |
| `pov` | put the camera at the character's head |

### World state fields (`env(E, ctx)`)

`skyTop skyHorizon groundColor sunElev sunAzim sunColor sun ambient fogColor fogDensity exposure stars moon aurora shadows ground groundSize foliage bare wind`

### Helpers inside `scene(ctx)`

`ctx.add(obj)` `ctx.light(l)` `ctx.every((t, dt, ctx) => ...)` (a per-frame callback) `ctx.particles({count, area, center, size, color, speed, jitter, streak, glow, sway, twinkle})`
`ctx.mat(color, opts)` `ctx.geo("box"|"sphere"|"cyl"|"cone"|"cap"|"plane"|"torus"|"icos")` `ctx.mesh(geo, color, pos, scale, opts)`
`ctx.rand()` (repeatable random), `ctx.subject`, `ctx.second` (a second actor), `ctx.timeScale`, `ctx.fps` (stop-motion frame rate).

## 2. Adding a post-processing pass

```js
Stage3D.registerPass({
  id: "mylook", order: 60,          // lower runs first. 35 = tonemap (before it is linear light, after it is display light)
  shader: {
    uniforms: { tDiffuse: {value: null}, resolution: {value: new THREE.Vector2()}, amount: {value: 1} },
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 resolution; uniform float amount; varying vec2 vUv;
                     void main(){ gl_FragColor = texture2D(tDiffuse, vUv) * amount; }`
  }
});
// use it in any effect:  post: [ { pass: "mylook", amount: .8 } ]
```

## 3. Adding an effect without code (JSON)

In the app: Project settings tab, **Custom effects (JSON)**. Paste one object (or an array). They are saved in the browser.

```json
{ "type":"move", "name":"my slide", "tip":"Glide left, then settle",
  "keys":[ {"t":0,"truck":.6}, {"t":.6,"truck":-.3,"yaw":8}, {"t":1,"truck":-.3,"yaw":8} ] }

{ "type":"light", "name":"police lights", "sun":{"elev":5,"intensity":.2}, "ambient":.15,
  "lights":[ {"kind":"point","color":"#ff2020","intensity":40,"pos":[-2,2,1.5],"flicker":true},
             {"kind":"point","color":"#2050ff","intensity":40,"pos":[2,2,1.5]} ], "bloom":.5 }

{ "type":"particles", "group":"atmo", "name":"golden dust", "color":"#ffd27a", "count":400, "size":.04, "speed":[0,.1,0], "glow":true }

{ "type":"look", "name":"my comic", "material":"toon",
  "post":[ {"pass":"outline","thickness":1.6}, {"pass":"halftone","size":6} ] }
```

`material` can be `toon`, `flat`, `ink`, `clay`, `plastic` or `lowpoly`. Pass names are the ids in `stage/passes.js`.

## 4. Adding it to the page

A new file needs one line in `index.html`, before `stage/packs.js`:

```html
<script src="effects/my-effects.js"></script>
```

The file is a normal script that calls `Stage3D.register(...)`. Open the large 3D view in the app and it lists any pick that has no 3D effect yet.
