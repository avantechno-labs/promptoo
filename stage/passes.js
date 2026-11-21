/* Promptoo 3D stage: post-processing passes. Each pass is one registerPass() call, so a new look is a new pass here
   (or a new entry in effects/look.js that chains the existing passes). Passes run in `order` (low first).
   Every pass sees `tDiffuse` (the frame so far), `resolution` and `time`. Pass options come from the effect's post list. */
(function (root) {
  "use strict";
  const S = root.Stage3D; if (!S || !S.available) return; const T = S.THREE;
  const V2 = (x, y) => new T.Vector2(x, y), V3 = (x, y, z) => new T.Vector3(x, y, z), C = c => S.rawColor(new T.Color(), c);
  const HEAD = "uniform sampler2D tDiffuse; uniform vec2 resolution; uniform float time; varying vec2 vUv;\n";
  const LUMA = "float luma(vec3 c){ return dot(c, vec3(.299,.587,.114)); }\nfloat hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\n";
  function simple(id, order, uniforms, body, extra) {
    const u = Object.assign({ tDiffuse: { value: null }, resolution: { value: V2(320, 180) }, time: { value: 0 } }, uniforms);
    S.registerPass(Object.assign({ id, order, shader: { uniforms: u, fragmentShader: HEAD + LUMA + body } }, extra || {}, { update: (p, ctx, t, spec, r, stage) => { if (p.uniforms.time) p.uniforms.time.value = ctx.time; if (extra && extra.update) extra.update(p, ctx, t, spec, r, stage); } }));
  }

  /* ----- scene-referred passes (before the tonemap, linear light) ----- */
  S.registerPass({ id: "dof", order: 10, factory(ctx, s, stage) { const p = new T.BokehPass(ctx.scene, stage.camera, { focus: 4, aperture: .01, maxblur: .02 }); return p; },
    update(p, ctx, t, spec, r) { const ap = (spec.aperture != null ? spec.aperture : 0) + (r.aperture || 0); p.uniforms.aperture.value = ap; p.uniforms.maxblur.value = spec.maxblur || .02; p.uniforms.focus.value = (ctx.camDist || 4) * (spec.focusMul || 1) * (r.focusMul || 1) + (spec.focusOffset || 0); } });
  S.registerPass({ id: "bloom", order: 20, factory(ctx, s, stage) { return new T.UnrealBloomPass(V2(stage.width, stage.height), s.strength == null ? .6 : s.strength, s.radius == null ? .5 : s.radius, s.threshold == null ? .85 : s.threshold); },
    update(p, ctx, t, spec) { if (spec.pulse) p.strength = spec.strength * (1 + .25 * Math.sin(ctx.time * 3)); } });
  simple("dirblur", 12, { amount: { value: 0 }, angle: { value: 0 } }, `uniform float amount, angle; void main(){ vec2 d=vec2(cos(angle),sin(angle))*amount; vec4 c=vec4(0.); for(int i=-6;i<=6;i++){ c+=texture2D(tDiffuse, vUv+d*float(i)/6.); } gl_FragColor=c/13.; }`,
    { update: (p, ctx, t, spec, r) => { p.uniforms.amount.value = (spec.amount || 0) + (r.blur || 0) * .05; } });
  simple("godrays", 15, { sunPos: { value: V2(.5, .6) }, strength: { value: .6 }, decay: { value: .95 }, threshold: { value: .75 } }, `uniform vec2 sunPos; uniform float strength, decay, threshold;
    void main(){ vec3 base=texture2D(tDiffuse,vUv).rgb; vec2 d=(sunPos-vUv)/28.; vec2 uv=vUv; float w=1.; vec3 acc=vec3(0.);
      for(int i=0;i<28;i++){ uv+=d; vec3 s=texture2D(tDiffuse,uv).rgb; float b=max(luma(s)-threshold,0.); acc+=s*b*w; w*=decay; }
      gl_FragColor=vec4(base+acc*strength*.35,1.); }`,
    { update: (p, ctx, t, spec, r, stage) => { const v = ctx.dirToSun.clone().multiplyScalar(1000).add(stage.camera.position).project(stage.camera); p.uniforms.sunPos.value.set(v.x * .5 + .5, v.y * .5 + .5); if (spec.strength != null) p.uniforms.strength.value = spec.strength; } });
  simple("streak", 30, { threshold: { value: .8 }, strength: { value: .5 }, tint: { value: C("#8fb8ff") }, len: { value: 1 } }, `uniform float threshold,strength,len; uniform vec3 tint;
    void main(){ vec3 base=texture2D(tDiffuse,vUv).rgb; vec3 acc=vec3(0.); float w=1.;
      for(int i=1;i<24;i++){ float o=float(i)/24.*.28*len; vec3 a=texture2D(tDiffuse,vUv+vec2(o,0.)).rgb; vec3 b=texture2D(tDiffuse,vUv-vec2(o,0.)).rgb; acc+=(max(a-threshold,0.)+max(b-threshold,0.))*w; w*=.88; }
      gl_FragColor=vec4(base+acc*tint*strength*.18,1.); }`);

  /* ----- tone mapping to display light: everything after this is "what you see" ----- */
  simple("tonemap", 35, { exposure: { value: 1 }, gammaOut: { value: 1 } }, `uniform float exposure;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb*exposure; c=aces(c); c=pow(c,vec3(1./2.2)); gl_FragColor=vec4(c,1.); }`,
    { update: (p, ctx) => { p.uniforms.exposure.value = ctx.E.exposure || 1; } });

  /* ----- look passes (display light) ----- */
  simple("outline", 40, { thickness: { value: 1.2 }, threshold: { value: .22 }, strength: { value: 1 }, lineColor: { value: C("#101018") }, levels: { value: 0 }, flatten: { value: 0 } },
    `uniform float thickness,threshold,strength,levels,flatten; uniform vec3 lineColor;
    void main(){ vec2 px=thickness/resolution; vec3 c=texture2D(tDiffuse,vUv).rgb;
      vec3 a=texture2D(tDiffuse,vUv+px*vec2(-1.,-1.)).rgb, b=texture2D(tDiffuse,vUv+px*vec2(0.,-1.)).rgb, d=texture2D(tDiffuse,vUv+px*vec2(1.,-1.)).rgb,
           e=texture2D(tDiffuse,vUv+px*vec2(-1.,0.)).rgb, f=texture2D(tDiffuse,vUv+px*vec2(1.,0.)).rgb,
           g=texture2D(tDiffuse,vUv+px*vec2(-1.,1.)).rgb, h=texture2D(tDiffuse,vUv+px*vec2(0.,1.)).rgb, i=texture2D(tDiffuse,vUv+px*vec2(1.,1.)).rgb;
      vec3 gx=-a-2.*e-g+d+2.*f+i, gy=-a-2.*b-d+g+2.*h+i; float edge=length(gx)+length(gy);
      if(levels>1.){ c=floor(c*levels+.5)/levels; }
      c=mix(c, vec3(luma(c)), flatten*0.);
      float m=smoothstep(threshold,threshold*2.2,edge)*strength; gl_FragColor=vec4(mix(c,lineColor,m),1.); }`);
  simple("paint", 42, { radius: { value: 2.4 }, sigma: { value: .12 } }, `uniform float radius,sigma;
    void main(){ vec2 px=radius/resolution; vec3 c0=texture2D(tDiffuse,vUv).rgb; vec3 acc=vec3(0.); float ws=0.;
      for(int i=0;i<16;i++){ float a=float(i)*2.39996; float r=sqrt(float(i)+.5)/4.; vec2 o=vec2(cos(a),sin(a))*r*px*2.; vec3 s=texture2D(tDiffuse,vUv+o).rgb; float w=exp(-dot(s-c0,s-c0)/(sigma*sigma)); acc+=s*w; ws+=w; }
      gl_FragColor=vec4(acc/ws,1.); }`);
  simple("sketch", 44, { spacing: { value: 5 }, strength: { value: .9 }, ink: { value: C("#2a2a30") }, paperColor: { value: C("#f4efe4") }, edge: { value: .25 }, colorMix: { value: 0 } }, `uniform float spacing,strength,edge,colorMix; uniform vec3 ink,paperColor;
    void main(){ vec2 px=1./resolution; vec3 c=texture2D(tDiffuse,vUv).rgb; float l=luma(c); vec2 p=vUv*resolution;
      float h1=step(.5,fract((p.x+p.y)/spacing)), h2=step(.5,fract((p.x-p.y)/spacing)); float hatch=0.; if(l<.7) hatch+=1.-h1; if(l<.45) hatch+=1.-h2; if(l<.25) hatch+=step(.5,fract(p.y/spacing));
      float a=luma(texture2D(tDiffuse,vUv+px*vec2(1.,0.)).rgb), b=luma(texture2D(tDiffuse,vUv+px*vec2(0.,1.)).rgb); float ed=smoothstep(edge*.4,edge,abs(l-a)+abs(l-b));
      float n=hash21(floor(p/1.5)); vec3 base=mix(paperColor,c,colorMix); vec3 o=mix(base,ink,clamp((hatch*.55+ed)*strength+ (1.-l)*.15*n,0.,1.)); gl_FragColor=vec4(o,1.); }`);
  simple("halftone", 50, { size: { value: 6 }, angle: { value: .52 }, strength: { value: .85 }, paper: { value: C("#f2ead8") }, mode: { value: 0 }, inkColor: { value: C("#16161c") } }, `uniform float size,angle,strength,mode; uniform vec3 paper,inkColor;
    void main(){ vec2 p=vUv*resolution; float ca=cos(angle), sa=sin(angle);
      vec2 g=vec2(ca*p.x+sa*p.y, -sa*p.x+ca*p.y)/size; vec2 cell=floor(g)+.5; vec2 f=fract(g)-.5;
      vec2 q=cell*size; vec2 pc=vec2(ca*q.x-sa*q.y, sa*q.x+ca*q.y); vec3 c=texture2D(tDiffuse,pc/resolution).rgb;
      float l=luma(c); float r=sqrt(1.-clamp(l,0.,1.))*.72; float m=smoothstep(r,r-.15,length(f)); vec3 o;
      if(mode<.5){ o=mix(c, c*(1.-(1.-m)*.45*strength), 1.); o=mix(o, paper*.98, (1.-m)*.2*strength); } else { o=mix(paper, inkColor, m); }
      gl_FragColor=vec4(o,1.); }`);
  simple("posterize", 55, { levels: { value: 5 } }, `uniform float levels; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; gl_FragColor=vec4(floor(c*levels+.5)/levels,1.); }`);
  simple("pixelate", 60, { size: { value: 6 }, levels: { value: 0 }, dither: { value: 0 } }, `uniform float size,levels,dither;
    void main(){ vec2 d=size/resolution; vec2 uv=d*(floor(vUv/d)+.5); vec3 c=texture2D(tDiffuse,uv).rgb;
      if(levels>1.){ float b=(mod(floor(vUv.x/d.x)+floor(vUv.y/d.y),2.)-.5)*dither/levels; c=floor((c+b)*levels+.5)/levels; } gl_FragColor=vec4(c,1.); }`);
  simple("chroma", 70, { amount: { value: .003 } }, `uniform float amount; void main(){ vec2 d=(vUv-.5)*amount; float r=texture2D(tDiffuse,vUv+d).r, g=texture2D(tDiffuse,vUv).g, b=texture2D(tDiffuse,vUv-d).b; gl_FragColor=vec4(r,g,b,1.); }`);
  simple("vhs", 72, { amount: { value: 1 } }, `uniform float amount;
    void main(){ vec2 uv=vUv; float band=step(.97,hash21(vec2(floor(time*6.),floor(uv.y*40.)))); uv.x+=band*.02*amount+ (hash21(vec2(floor(uv.y*resolution.y/2.),floor(time*30.)))-.5)*.002*amount;
      float tr=smoothstep(.0,.02,abs(fract(uv.y-time*.12)-.5)-.47); vec3 c; c.r=texture2D(tDiffuse,uv+vec2(.004,0.)).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-vec2(.004,0.)).b;
      c=mix(c,vec3(luma(c)),.2); c+= (hash21(uv*resolution+time)-.5)*.1*amount; c*=.92+.08*sin(uv.y*resolution.y*1.5); c=mix(c,c+.2,tr*.0); gl_FragColor=vec4(c,1.); }`);
  simple("scan", 75, { intensity: { value: .35 }, curve: { value: .08 }, mask: { value: .25 } }, `uniform float intensity,curve,mask;
    void main(){ vec2 uv=vUv*2.-1.; uv*=1.+dot(uv,uv)*curve; uv=uv*.5+.5; if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){ gl_FragColor=vec4(0.,0.,0.,1.); return; }
      vec3 c=texture2D(tDiffuse,uv).rgb; c*=1.-intensity*(.5+.5*sin(uv.y*resolution.y*3.14159)); float m=mod(floor(uv.x*resolution.x),3.); c*=mix(vec3(1.),vec3(m<1.?1.:.75, (m>=1.&&m<2.)?1.:.75, m>=2.?1.:.75), mask); c*=1.1; gl_FragColor=vec4(c,1.); }`);
  simple("fisheye", 78, { strength: { value: .55 } }, `uniform float strength; void main(){ vec2 uv=vUv*2.-1.; float r=length(uv); uv*=1.+strength*r*r; uv=uv*.5+.5; vec3 c=texture2D(tDiffuse,clamp(uv,0.,1.)).rgb; float m=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.); gl_FragColor=vec4(c*m,1.); }`);
  simple("grade", 80, { exposure: { value: 0 }, contrast: { value: 1 }, saturation: { value: 1 }, lift: { value: V3(0, 0, 0) }, gain: { value: V3(1, 1, 1) }, gamma: { value: 1 }, tint: { value: V3(1, 1, 1) }, gray: { value: 0 }, sepia: { value: 0 }, fadeBlack: { value: 0 }, shadowTint: { value: V3(0, 0, 0) }, highlightTint: { value: V3(0, 0, 0) } },
    `uniform float exposure,contrast,saturation,gamma,gray,sepia,fadeBlack; uniform vec3 lift,gain,tint,shadowTint,highlightTint;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c*=pow(2.,exposure); c=(c-.5)*contrast+.5; float l=luma(c); c=mix(vec3(l),c,saturation);
      c=c*gain*tint+lift; c+=shadowTint*(1.-smoothstep(0.,.55,l))+highlightTint*smoothstep(.45,1.,l); c=pow(max(c,0.),vec3(1./gamma));
      vec3 sp=vec3(dot(c,vec3(.393,.769,.189)),dot(c,vec3(.349,.686,.168)),dot(c,vec3(.272,.534,.131))); c=mix(c,sp,sepia); c=mix(c,vec3(luma(c)),gray); c=mix(c,vec3(fadeBlack),fadeBlack*.0)+fadeBlack*(1.-c)*.5;
      gl_FragColor=vec4(clamp(c,0.,1.),1.); }`);
  simple("soft", 82, { radius: { value: 2 }, amt: { value: .6 } }, `uniform float radius, amt;
    void main(){ vec2 px=radius/resolution; vec3 c=vec3(0.); float w=0.; for(int x=-2;x<=2;x++){ for(int y=-2;y<=2;y++){ float k=exp(-float(x*x+y*y)/4.); c+=texture2D(tDiffuse,vUv+vec2(float(x),float(y))*px).rgb*k; w+=k; } } vec3 o=texture2D(tDiffuse,vUv).rgb; vec3 b=c/w; gl_FragColor=vec4(mix(o,b,amt)+max(b-.7,0.)*.25,1.); }`);
  simple("tiltshift", 83, { focus: { value: .5 }, band: { value: .16 }, amount: { value: 3 }, satBoost: { value: 1.3 } }, `uniform float focus,band,amount,satBoost;
    void main(){ float d=smoothstep(band,band+.28,abs(vUv.y-focus)); vec2 px=amount*d/resolution; vec3 c=vec3(0.); float w=0.; for(int i=-4;i<=4;i++){ float k=1.-abs(float(i))/5.; c+=texture2D(tDiffuse,vUv+vec2(0.,float(i))*px*2.).rgb*k; c+=texture2D(tDiffuse,vUv+vec2(float(i),0.)*px*2.).rgb*k; w+=2.*k; }
      c/=w; float l=luma(c); c=mix(vec3(l),c,satBoost); gl_FragColor=vec4(c,1.); }`);
  simple("heat", 26, { amount: { value: .004 } }, `uniform float amount; void main(){ float m=smoothstep(.0,.7,1.-vUv.y); vec2 uv=vUv+vec2(sin(vUv.y*60.+time*3.)+sin(vUv.y*23.-time*2.),cos(vUv.x*40.+time*2.))*amount*m; gl_FragColor=vec4(texture2D(tDiffuse,uv).rgb,1.); }`);
  simple("paper", 85, { amount: { value: .18 }, tint: { value: C("#f6f0e2") }, edgeDark: { value: .25 } }, `uniform float amount,edgeDark; uniform vec3 tint;
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y); }
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; vec2 p=vUv*resolution; float n=vn(p/2.)*.6+vn(p/7.)*.4; c=mix(c,c*tint,.6); c*=1.-amount*(1.-n); vec2 e=vUv*(1.-vUv); c*=mix(1.,smoothstep(0.,.08,e.x*e.y*4.),edgeDark); gl_FragColor=vec4(c,1.); }`);
  simple("grain", 90, { amount: { value: .12 }, size: { value: 1.4 }, color: { value: 0 } }, `uniform float amount,size,color;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; vec2 p=floor(vUv*resolution/size); float n=hash21(p+time*37.)-.5; vec3 g=color>0.?vec3(hash21(p+time*11.),hash21(p+time*23.+5.),hash21(p+time*7.+9.))-.5:vec3(n); float l=luma(c); c+=g*amount*(1.-.6*abs(l-.5)*2.); gl_FragColor=vec4(c,1.); }`);
  simple("glitch", 86, { amount: { value: .5 } }, `uniform float amount; void main(){ vec2 uv=vUv; float t=floor(time*8.); float blk=step(.92,hash21(vec2(floor(uv.y*14.),t)))*amount; uv.x+=blk*(hash21(vec2(t,floor(uv.y*14.)))-.5)*.12; vec3 c; c.r=texture2D(tDiffuse,uv+vec2(blk*.01,0.)).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-vec2(blk*.01,0.)).b; gl_FragColor=vec4(c,1.); }`);
  simple("vignette", 92, { strength: { value: .45 }, softness: { value: .6 } }, `uniform float strength,softness; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float d=distance(vUv,vec2(.5))*1.4142; c*=1.-strength*smoothstep(1.-softness,1.,d); gl_FragColor=vec4(c,1.); }`);
  simple("fade", 95, { amount: { value: 0 }, color: { value: C("#000000") }, flash: { value: 0 } }, `uniform float amount,flash; uniform vec3 color; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c=mix(c,color,clamp(amount,0.,1.)); c=mix(c,vec3(1.),clamp(flash,0.,1.)); gl_FragColor=vec4(c,1.); }`,
    { update: (p, ctx, t, spec, r) => { p.uniforms.amount.value = r.fade || 0; p.uniforms.flash.value = r.flash || 0; if (r.fadeColor) S.rawColor(p.uniforms.color.value, r.fadeColor); } });
  simple("letterbox", 99, { ratio: { value: 2.39 } }, `uniform float ratio; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float a=resolution.x/resolution.y; float vis=a/ratio; float m=step(abs(vUv.y-.5),vis*.5); if(vis>=1.) m=1.; gl_FragColor=vec4(c*m,1.); }`);
})(typeof window !== "undefined" ? window : globalThis);
