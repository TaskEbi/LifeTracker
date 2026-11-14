/**
 * Core 核: tens of thousands of points that hold the shape of your level, then pour themselves
 * into each section's kanji in turn. Below it a dial of the twelve sections turns to the one shown.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineLoop, PerspectiveCamera, Points, Scene, ShaderMaterial, Sprite, SpriteMaterial, Vector3, type Texture } from 'three';
import { fmtHours } from '../../../domain/motion/model';
import { canvas2d, damp, FONT_DISPLAY, FONT_GOTHIC, GLSL_NOISE, GOLD, project, rgb, rng, SECTION_HEX, textureOf, vec, type Hud, type StageCtx, type StageScene } from '../stage';

const SIZE = 2.7; // world height of a glyph
const DEPTH = 0.42;
const MORPH = 1.9; // seconds
const HOLD = 4.4;

/** Points spread through the filled pixels of a glyph, thicker at its front and back faces so it reads as solid when turned. */
function sampleGlyph(text: string, font: string, n: number, rand: () => number): Float32Array {
  const S = 240;
  const [, g] = canvas2d(S, S);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  let px = S * 0.9;
  g.font = font.replace('%', `${px}px`);
  const wide = g.measureText(text).width;
  if (wide > S * 0.94) px *= (S * 0.94) / wide;
  g.font = font.replace('%', `${px}px`);
  const m = g.measureText(text);
  const asc = m.actualBoundingBoxAscent || px * 0.8;
  const desc = m.actualBoundingBoxDescent || 0;
  g.fillStyle = '#fff';
  g.fillText(text, S / 2, S / 2 + (asc - desc) / 2);
  const img = g.getImageData(0, 0, S, S).data;
  const filled: number[] = [];
  for (let i = 0; i < S * S; i++) if (img[i * 4 + 3] > 110) filled.push(i);
  const out = new Float32Array(n * 3);
  if (!filled.length) return out;
  for (let i = 0; i < n; i++) {
    const p = filled[(rand() * filled.length) | 0];
    const x = ((p % S) + rand()) / S - 0.5;
    const y = 0.5 - (((p / S) | 0) + rand()) / S;
    const r = rand();
    const z = r < 0.36 ? 0.5 - rand() * 0.06 : r < 0.72 ? -0.5 + rand() * 0.06 : rand() - 0.5;
    out[i * 3] = x * SIZE;
    out[i * 3 + 1] = y * SIZE;
    out[i * 3 + 2] = z * DEPTH;
  }
  return out;
}

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aSeed;
uniform float uTime, uMix, uSize, uPointerStr, uBurst;
uniform vec3 uColorA, uColorB, uPointer;
varying vec3 vColor;
varying float vAlpha;
${GLSL_NOISE}
void main(){
  float local = clamp(uMix * 1.7 - aSeed.x * 0.7, 0., 1.);
  float e = local * local * (3. - 2. * local);
  vec3 p = mix(aFrom, aTo, e);
  float arc = sin(e * 3.14159265);
  // on the way across, each point is carried by a slow field and swung round the vertical axis
  vec3 flow = vec3(
    snoise(vec3(aFrom.xy * 0.9, uTime * 0.12 + aSeed.w * 5.)),
    snoise(vec3(aTo.yx * 0.9 + 7., uTime * 0.12 + aSeed.y * 3.)),
    snoise(vec3(aFrom.x * 0.8 + 3., aTo.y * 0.8, aSeed.w * 9.)));
  p += flow * arc * 1.25;
  float ang = arc * (aSeed.y - 0.5) * 3.2;
  float c = cos(ang), s = sin(ang);
  p.xz = mat2(c, -s, s, c) * p.xz;
  // at rest: a slight breathing shimmer
  float tw = uTime * 0.7 + aSeed.w * 40.;
  p += 0.022 * vec3(sin(tw + p.y * 5.), cos(tw * 1.1 + p.x * 5.), sin(tw * 0.9 + p.x * 3. + p.y * 3.));
  p += normalize(p + vec3(0.001)) * uBurst * (0.25 + aSeed.w) * 0.9;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec2 d = wp.xy - uPointer.xy;
  float push = uPointerStr * smoothstep(0.85, 0., length(d));
  wp.xyz += normalize(vec3(d, (aSeed.w - 0.5) * 1.6) + 0.0001) * push * 0.6;
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + aSeed.y * 1.25) * (1. + arc * 1.4 + push * 2.) / -mv.z;
  vec3 col = mix(uColorA, uColorB, e);
  vColor = mix(col, vec3(1.), aSeed.z * aSeed.z * 0.6 + arc * 0.25);
  vAlpha = (0.3 + 0.55 * aSeed.z) * (1. - arc * 0.35);
}`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;

const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime, uSize;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y = mod(p.y + uTime * (0.03 + aSeed * 0.05) + 5., 10.) - 5.;
  p.x += sin(uTime * 0.2 + aSeed * 30.) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aSeed) / -mv.z;
  vColor = vec3(0.75, 0.8, 1.);
  vAlpha = 0.1 + 0.25 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 50.));
}`;

interface Shape {
  text: string;
  font: string;
  color: string;
  hud: Hud;
}

export function createCore(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const rand = rng(7);
  const phone = Math.min(innerWidth, innerHeight) < 700;
  const N = phone ? 24000 : 44000;

  const shapes: Shape[] = [
    {
      text: String(data.level),
      font: `% ${FONT_DISPLAY}`,
      color: GOLD,
      hud: { kicker: 'Overall', title: 'Level', value: String(data.level), sub: `${data.streak}-day streak · ${fmtHours(data.total)} in the last year`, color: GOLD },
    },
    ...data.sections.map((s) => ({
      text: s.kanji,
      font: `900 % ${FONT_GOTHIC}`,
      color: SECTION_HEX[s.id],
      hud: {
        kicker: `${s.code} · ${s.kanji}`,
        title: s.name,
        value: `LV ${s.level}`,
        sub: `${s.minutes ? `${fmtHours(s.minutes)} in the last year · ` : ''}${Math.round(s.pct * 100)}% of the way to LV ${s.level + 1}`,
        color: SECTION_HEX[s.id],
        section: s.id,
      },
    })),
  ];
  const cache = new Map<number, Float32Array>();
  const shapeOf = (i: number) => {
    let a = cache.get(i);
    if (!a) cache.set(i, (a = sampleGlyph(shapes[i].text, shapes[i].font, N, rand)));
    return a;
  };

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 60);
  const rig = new Group();
  scene.add(rig);

  // the cloud starts scattered and gathers into the level
  const scatter = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = rand() * Math.PI * 2;
    const r = 2.5 + rand() * 4;
    scatter[i * 3] = Math.cos(a) * r;
    scatter[i * 3 + 1] = (rand() - 0.5) * 7;
    scatter[i * 3 + 2] = Math.sin(a) * r - 1;
  }
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) seeds[i] = rand();
  const geo = new BufferGeometry();
  const aFrom = new BufferAttribute(scatter, 3);
  const aTo = new BufferAttribute(new Float32Array(shapeOf(0)), 3);
  geo.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aFrom', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aSeed', new BufferAttribute(seeds, 4));
  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 0 },
    uSize: { value: 20 },
    uPointerStr: { value: 0 },
    uBurst: { value: 0 },
    uPointer: { value: new Vector3(0, 0, 0) },
    uColorA: { value: vec(GOLD) },
    uColorB: { value: vec(GOLD) },
  };
  const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending });
  const cloud = new Points(geo, mat);
  cloud.frustumCulled = false;
  rig.add(cloud);

  // dust far behind, for depth
  const D = 700;
  const dustPos = new Float32Array(D * 3);
  const dustSeed = new Float32Array(D);
  for (let i = 0; i < D; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 16;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 10;
    dustPos[i * 3 + 2] = -1 - rand() * 9;
    dustSeed[i] = rand();
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new BufferAttribute(dustSeed, 1));
  const dustMat = new ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: FRAG, uniforms: { uTime: uniforms.uTime, uSize: { value: 30 } }, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  // the dial: twelve kanji on a ring that turns to bring the one shown to the front
  const DIAL_R = 1.72;
  const DIAL_Y = -1.95;
  const dial = new Group();
  dial.position.y = DIAL_Y;
  rig.add(dial);
  const ringGeo = new BufferGeometry();
  const ringPts = new Float32Array(160 * 3);
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    ringPts[i * 3] = Math.sin(a) * DIAL_R;
    ringPts[i * 3 + 2] = Math.cos(a) * DIAL_R;
  }
  ringGeo.setAttribute('position', new BufferAttribute(ringPts, 3));
  const ringMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthTest: false });
  const ring = new LineLoop(ringGeo, ringMat);
  dial.add(ring);
  const ring2 = new LineLoop(ringGeo, ringMat);
  ring2.scale.setScalar(0.62);
  dial.add(ring2);
  const textures: Texture[] = [];
  const sprites = data.sections.map((s, i) => {
    const [c, g] = canvas2d(128, 128);
    g.font = `900 92px ${FONT_GOTHIC}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(s.kanji, 64, 68);
    const tex = textureOf(c, renderer);
    textures.push(tex);
    const sm = new SpriteMaterial({ map: tex, color: SECTION_HEX[s.id], transparent: true, opacity: 0.5, depthTest: false, blending: AdditiveBlending });
    const sp = new Sprite(sm);
    const a = (i / data.sections.length) * Math.PI * 2;
    sp.position.set(Math.sin(a) * DIAL_R, 0, Math.cos(a) * DIAL_R);
    sp.scale.setScalar(0.3);
    dial.add(sp);
    return sp;
  });

  let index = 0;
  let pending: number | null = null;
  let mix = 0;
  let sinceChange = 0;
  let idle = 99; // seconds since the last touch
  let dialAngle = 0;
  let dialTarget = 0;
  let rotX = 0;
  let rotY = 0;
  let pStr = 0;
  let w = 1;
  let h = 1;
  const pointerWorld = new Vector3();
  const dir = new Vector3();

  ctx.hud(shapes[0].hud);

  const go = (i: number) => {
    if (i === index) return;
    if (mix < 1) {
      pending = i;
      return;
    }
    (aFrom.array as Float32Array).set(aTo.array as Float32Array);
    (aTo.array as Float32Array).set(shapeOf(i));
    aFrom.needsUpdate = true;
    aTo.needsUpdate = true;
    uniforms.uColorA.value.set(...rgb(shapes[index].color));
    uniforms.uColorB.value.set(...rgb(shapes[i].color));
    index = i;
    mix = 0;
    sinceChange = 0;
    if (i > 0) {
      // turn the short way round
      const want = -((i - 1) / sprites.length) * Math.PI * 2;
      dialTarget = want + Math.round((dialAngle - want) / (Math.PI * 2)) * Math.PI * 2;
    }
    ctx.hud(shapes[i].hud);
  };

  return {
    resize(nw, nh, dpr) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      const portrait = h > w;
      // on a phone the words take the lower part of the screen, so the cloud and its dial sit in the upper half
      const dist = Math.max(1.9 / (t * camera.aspect), (portrait ? 4.15 : 3.25) / t);
      const look = portrait ? -2.2 : -0.5;
      camera.position.set(0, look, dist);
      camera.lookAt(0, look, 0);
      camera.updateProjectionMatrix();
      uniforms.uSize.value = h * dpr * 0.023;
      dustMat.uniforms.uSize.value = h * dpr * 0.02;
    },
    frame(t, dt) {
      uniforms.uTime.value = t;
      mix = Math.min(1, mix + dt / MORPH);
      uniforms.uMix.value = mix;
      uniforms.uBurst.value = damp(uniforms.uBurst.value, 0, 5, dt);
      sinceChange += dt;
      idle += dt;
      if (mix >= 1 && pending !== null) {
        const p = pending;
        pending = null;
        go(p);
      } else if (!ctx.reduced && idle > 9 && sinceChange > HOLD) go((index + 1) % shapes.length);

      // the pointer stirs the cloud and leans the whole rig
      const px = ctx.pointer.inside ? ctx.pointer.x : 0;
      const py = ctx.pointer.inside ? ctx.pointer.y : 0;
      dir.set(px, py, 0.5).unproject(camera).sub(camera.position).normalize();
      pointerWorld.copy(camera.position).addScaledVector(dir, -camera.position.z / dir.z);
      uniforms.uPointer.value.lerp(pointerWorld, 1 - Math.exp(-10 * dt));
      pStr = damp(pStr, ctx.pointer.inside ? 1 : 0, 4, dt);
      uniforms.uPointerStr.value = pStr;
      const sway = ctx.reduced ? 0 : Math.sin(t * 0.32) * 0.32;
      rotY = damp(rotY, px * 0.55 + sway, 3, dt);
      rotX = damp(rotX, -py * 0.22 + 0.06, 3, dt);
      rig.rotation.set(rotX, rotY, 0);

      dialAngle = damp(dialAngle, dialTarget, 4, dt);
      dial.rotation.y = dialAngle;
      dial.rotation.x = 0.16;
      sprites.forEach((sp, i) => {
        const on = i === index - 1;
        const sm = sp.material as SpriteMaterial;
        sm.opacity = damp(sm.opacity, on ? 1 : 0.34, 6, dt);
        sp.scale.setScalar(damp(sp.scale.x, on ? 0.42 : 0.27, 6, dt));
      });
      renderer.render(scene, camera);
    },
    tap(x, y) {
      idle = 0;
      uniforms.uBurst.value = 0.5;
      // a kanji on the dial, if the tap landed on one; otherwise the next shape
      let best = -1;
      let bestD = 0.11 * (h > w ? 1.4 : 1);
      sprites.forEach((sp, i) => {
        const wp = sp.getWorldPosition(new Vector3());
        const s = project(camera, wp.x, wp.y, wp.z);
        const d = Math.hypot((s.x - x) * (w / h), s.y - y);
        if (s.z < 1 && d < bestD) {
          bestD = d;
          best = i;
        }
      });
      go(best >= 0 ? best + 1 : (index + 1) % shapes.length);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      for (const sp of sprites) sp.material.dispose();
      for (const tx of textures) tx.dispose();
    },
  };
}
