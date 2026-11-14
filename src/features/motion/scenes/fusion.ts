/**
 * Fusion 融: the week as drops of liquid metal, one per section and as big as its share of the time.
 * They circle, touch and merge, and their colours run into each other. Ray-marched in one shader;
 * the kanji that ride on the drops are labels over the canvas.
 */
import { Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, Vector4, OrthographicCamera } from 'three';
import { fmtHours, fmtSpan, type MotionSection } from '../../../domain/motion/model';
import { damp, makeLabels, SECTION_HEX, vec, type StageCtx, type StageScene } from '../stage';

const MAX = 7;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uFocal;
uniform vec4 uBlob[${MAX}];
uniform vec3 uCol[${MAX}];
uniform vec3 uRo, uRight, uUp, uFwd;
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float map(vec3 p){
  float d = 1e5;
  for (int i = 0; i < ${MAX}; i++) d = smin(d, length(p - uBlob[i].xyz) - uBlob[i].w, 0.6);
  return d;
}
vec3 tint(vec3 p){
  vec3 c = vec3(0.); float ws = 0.;
  for (int i = 0; i < ${MAX}; i++){
    float di = max(length(p - uBlob[i].xyz) - uBlob[i].w, 0.);
    float w = exp(-di * 6.) * step(0.001, uBlob[i].w);
    c += uCol[i] * w; ws += w;
  }
  return c / max(ws, 1e-4);
}
vec3 normalAt(vec3 p){
  vec2 e = vec2(0.003, 0.);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
vec3 sky(vec3 d){
  // a studio: a broad soft light above, a strip light to one side, dark below
  float up = smoothstep(-0.25, 1., d.y);
  vec3 c = mix(vec3(0.015, 0.016, 0.03), vec3(0.42, 0.46, 0.6), up * up);
  c += vec3(1.1, 1.05, 0.95) * smoothstep(0.93, 0.99, dot(d, normalize(vec3(0.55, 0.75, 0.35))));
  c += vec3(0.5, 0.6, 0.9) * smoothstep(0.04, 0., abs(d.y - 0.18 - d.x * 0.25)) * smoothstep(-0.2, -0.9, d.x) * 0.7;
  return c;
}
void main(){
  vec2 uv = (gl_FragCoord.xy * 2. - uRes) / uRes.y;
  vec3 rd = normalize(uRight * uv.x + uUp * uv.y + uFwd * uFocal);
  float t = 2.;
  float near = 1e5; vec3 nearP = uRo;
  bool hit = false;
  for (int i = 0; i < 60; i++){
    vec3 p = uRo + rd * t;
    float d = map(p);
    if (d < near){ near = d; nearP = p; }
    if (d < 0.004){ hit = true; break; }
    t += d * 0.92;
    if (t > 16.) break;
  }
  vec3 col = vec3(0.02, 0.02, 0.028) + vec3(0.03, 0.03, 0.05) * (1. - length(uv) * 0.6);
  if (hit){
    vec3 p = uRo + rd * t;
    vec3 n = normalAt(p);
    vec3 base = tint(p);
    vec3 L = normalize(vec3(0.55, 0.75, 0.35));
    float diff = 0.5 + 0.5 * dot(n, L);
    float ndv = max(dot(n, -rd), 0.);
    float fres = pow(1. - ndv, 3.);
    vec3 refl = sky(reflect(rd, n));
    float ao = clamp(map(p + n * 0.35) / 0.35, 0., 1.);
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 1.1 + ndv * 0.4 + vec3(0., 0.33, 0.67)) + uTime * 0.15);
    col = base * (0.1 + 0.85 * diff * diff) * (0.5 + 0.5 * ao);
    col += refl * base * 0.55;              // tinted reflection: coloured metal
    col += refl * fres * 0.7;               // clear coat at glancing angles
    col += irid * fres * 0.22;
    col += base * pow(1. - ndv, 1.5) * 0.35; // the colour glows at the rim
  } else {
    // light spilling off the drops into the dark
    col += tint(nearP) * exp(-near * 2.6) * 0.42;
  }
  col = col / (1. + col * 0.25);
  col = pow(col, vec3(0.9));
  gl_FragColor = vec4(col, 1.);
}`;

export function createFusion(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  // by the week if there is one to show, otherwise by the year, otherwise by level
  const weekly = data.sections.filter((s) => s.week > 0).length >= 3;
  const yearly = data.sections.filter((s) => s.minutes > 0).length >= 3;
  const measure = (s: MotionSection) => (weekly ? s.week : yearly ? s.minutes : s.xp + 1);
  const picked = [...data.sections].sort((a, b) => measure(b) - measure(a)).slice(0, MAX).filter((s) => measure(s) > 0);
  const total = picked.reduce((a, s) => a + measure(s), 0) || 1;
  const span = weekly ? 'the last 7 days' : yearly ? 'the last year' : 'your levels';
  const amount = (m: number) => (weekly ? fmtSpan(m) : yearly ? fmtHours(m) : `${Math.round(m)} XP`);

  const blobs = picked.map((s, i) => {
    const share = measure(s) / total;
    return { s, share, r: 0.36 + 0.78 * Math.sqrt(share), orbit: i === 0 ? 0.25 : 0.75 + i * 0.2, speed: (i % 2 ? -1 : 1) * (0.42 - i * 0.035), phase: i * 2.4, pos: new Vector3(), grow: 1 };
  });
  const uBlob = Array.from({ length: MAX }, () => new Vector4(0, 0, 0, 0));
  const uCol = Array.from({ length: MAX }, (_, i) => (blobs[i] ? vec(SECTION_HEX[blobs[i].s.id]) : new Vector3()));
  const uniforms = {
    uRes: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uFocal: { value: 1.9 },
    uBlob: { value: uBlob },
    uCol: { value: uCol },
    uRo: { value: new Vector3() },
    uRight: { value: new Vector3() },
    uUp: { value: new Vector3() },
    uFwd: { value: new Vector3() },
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geo = new PlaneGeometry(2, 2);
  const mat = new ShaderMaterial({ vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false });
  const quad = new Mesh(geo, mat);
  quad.frustumCulled = false;
  scene.add(quad);

  const labels = makeLabels(
    ctx.overlay,
    blobs.map((b) => ({ text: b.s.kanji, sub: `${Math.round(b.share * 100)}%` })),
  );

  let yaw = 0.4;
  let pitch = 0.22;
  let yawVel = 0;
  let w = 1;
  let h = 1;
  let sel = -1;
  let intro = 0;
  const up0 = new Vector3(0, 1, 0);
  const target = new Vector3();
  const v = new Vector3();
  const screen: { x: number; y: number; r: number; z: number }[] = blobs.map(() => ({ x: 0, y: 0, r: 0, z: 0 }));

  const overview = () =>
    ctx.hud({ kicker: weekly ? 'Last 7 days' : yearly ? 'Last year' : 'By level', title: 'Where it went', value: weekly || yearly ? amount(total) : `LV ${data.level}`, sub: `${blobs.length} sections, each as big as its share of ${span}`, color: '#e9ecff' });
  const select = (i: number) => {
    sel = i;
    if (i < 0) return overview();
    const b = blobs[i];
    ctx.hud({ kicker: `${b.s.code} · ${b.s.kanji}`, title: b.s.name, value: `${Math.round(b.share * 100)}%`, sub: `${amount(measure(b.s))} of ${span}`, color: SECTION_HEX[b.s.id], section: b.s.id });
  };
  overview();

  return {
    pixelScale: Math.min(innerWidth, innerHeight) < 700 ? 0.62 : 0.8,
    resize(nw, nh, dpr) {
      w = nw;
      h = nh;
      uniforms.uRes.value.set(Math.floor(w * dpr), Math.floor(h * dpr));
    },
    frame(t, dt) {
      uniforms.uTime.value = t;
      intro = Math.min(1, intro + dt / 2.2);
      const open = 1 - Math.pow(1 - intro, 3);
      if (!ctx.reduced) yaw += dt * 0.07;
      yaw += yawVel * dt;
      yawVel = damp(yawVel, 0, 3, dt);
      const portrait = h > w;
      const dist = portrait ? 10.5 : 6.4;
      target.set(0, portrait ? -1.2 : -0.15, 0);
      const ro = uniforms.uRo.value.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist + target.y, Math.cos(yaw) * Math.cos(pitch) * dist);
      const fwd = uniforms.uFwd.value.copy(target).sub(ro).normalize();
      const right = uniforms.uRight.value.crossVectors(fwd, up0).normalize();
      const up = uniforms.uUp.value.crossVectors(right, fwd);
      const k = ctx.reduced ? 0.25 : 1;
      blobs.forEach((b, i) => {
        const a = t * b.speed * k + b.phase;
        // they start as one drop and drift out to their orbits
        b.pos.set(Math.cos(a) * b.orbit * 1.2 * open, Math.sin(t * 0.5 * k + b.phase * 1.7) * 0.6 * open, Math.sin(a) * b.orbit * open);
        b.grow = damp(b.grow, i === sel ? 1.14 : 1, 6, dt);
        const r = b.r * b.grow * (0.5 + 0.5 * open);
        uBlob[i].set(b.pos.x, b.pos.y, b.pos.z, r);
        v.copy(b.pos).sub(ro);
        const z = v.dot(fwd);
        const sx = w / 2 + ((v.dot(right) / z) * uniforms.uFocal.value * h) / 2;
        const sy = h / 2 - ((v.dot(up) / z) * uniforms.uFocal.value * h) / 2;
        screen[i] = { x: sx, y: sy, r: ((r / z) * uniforms.uFocal.value * h) / 2, z };
        // nearer drops carry bigger, brighter labels; ones behind the rest fade
        const nearness = Math.max(0, Math.min(1, (dist + 1.6 - z) / 3.2));
        labels.place(i, sx, sy, (0.65 + 0.7 * nearness) * (0.7 + b.r * 0.7), open * (0.25 + 0.75 * nearness));
      });
      renderer.render(scene, camera);
    },
    drag(dx) {
      yawVel = -dx * 0.25;
      yaw -= dx * 0.006;
    },
    tap(x, y) {
      const px = ((x + 1) / 2) * w;
      const py = ((1 - y) / 2) * h;
      let hit = -1;
      let near = 1e9;
      screen.forEach((s, i) => {
        if (Math.hypot(s.x - px, s.y - py) < s.r * 1.05 && s.z < near) {
          near = s.z;
          hit = i;
        }
      });
      select(hit === sel ? -1 : hit);
    },
    dispose() {
      labels.dispose();
      geo.dispose();
      mat.dispose();
    },
  };
}
