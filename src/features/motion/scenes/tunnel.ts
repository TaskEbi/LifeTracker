/**
 * Tunnel 門: a flight through twelve gates, one per section, each with its kanji hanging in the
 * opening; you pass straight through it. The streaks along the walls take the colour of the gate
 * ahead. Move to steer, tap for a burst of speed.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, LineSegments, Mesh, PerspectiveCamera, PlaneGeometry, RingGeometry, Scene, ShaderMaterial, Vector3, type Texture } from 'three';
import { fmtHours } from '../../../domain/motion/model';
import { damp, glyphCanvas, FONT_KANJI, rgb, rng, SECTION_HEX, textureOf, vec, type StageCtx, type StageScene } from '../stage';

const GAP = 10;
const DEPTH = 90; // how far the streaks reach

/** The tunnel bends; everything in it is pushed sideways by how far ahead it is. */
const BEND = /* glsl */ `
vec2 bend(float z, float t){ float d = abs(z); return vec2(sin(d * 0.045 + t * 0.21) * d * 0.075, cos(d * 0.037 + t * 0.17) * d * 0.045); }`;
const bendJs = (z: number, t: number): [number, number] => {
  const d = Math.abs(z);
  return [Math.sin(d * 0.045 + t * 0.21) * d * 0.075, Math.cos(d * 0.037 + t * 0.17) * d * 0.045];
};

const STREAK_VERT = /* glsl */ `
attribute float aZ, aSeed;
uniform float uTravel, uTime, uStretch;
varying float vA, vSeed;
${BEND}
void main(){
  float z = mod(aZ + uTravel * (0.7 + aSeed * 0.6), ${DEPTH.toFixed(1)}) - ${DEPTH.toFixed(1)};
  z += position.z * uStretch;
  vec3 p = vec3(position.xy + bend(z, uTime), z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  vA = smoothstep(-${DEPTH.toFixed(1)}, -${(DEPTH * 0.55).toFixed(1)}, z) * smoothstep(0.5, -6., z) * (0.25 + 0.75 * aSeed) * (position.z > 0.01 ? 1. : 0.);
  vSeed = aSeed;
}`;
const STREAK_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vA, vSeed;
void main(){ gl_FragColor = vec4(mix(uColor, vec3(1.), vSeed * vSeed * 0.6), vA); }`;

const FLAT_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const RING_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
void main(){ gl_FragColor = vec4(uColor, uAlpha); }`;
const GLYPH_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUv;
void main(){
  float a = texture2D(uMap, vUv).a;
  // a soft aura round the strokes
  float halo = texture2D(uMap, vUv, 4.).a;
  gl_FragColor = vec4(mix(uColor, vec3(1.), a * 0.75), (a + halo * 0.45) * uAlpha);
}`;

export function createTunnel(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const rand = rng(21);
  const scene = new Scene();
  const camera = new PerspectiveCamera(72, 1, 0.05, 200);
  const n = data.sections.length;
  const LOOP = n * GAP;
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const textures: Texture[] = [];

  // streaks along the walls
  const S = Math.min(innerWidth, innerHeight) < 700 ? 900 : 1500;
  const sp = new Float32Array(S * 6);
  const sz = new Float32Array(S * 2);
  const ss = new Float32Array(S * 2);
  for (let i = 0; i < S; i++) {
    const a = rand() * Math.PI * 2;
    const r = 3.6 + rand() * rand() * 7;
    const len = 1.2 + rand() * 4.5;
    const z0 = -rand() * DEPTH;
    const seed = rand();
    sp.set([Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * r, Math.sin(a) * r, len], i * 6);
    sz.set([z0, z0], i * 2);
    ss.set([seed, seed], i * 2);
  }
  const streakGeo = keep(new BufferGeometry());
  streakGeo.setAttribute('position', new BufferAttribute(sp, 3));
  streakGeo.setAttribute('aZ', new BufferAttribute(sz, 1));
  streakGeo.setAttribute('aSeed', new BufferAttribute(ss, 1));
  const streakU = { uTravel: { value: 0 }, uTime: { value: 0 }, uStretch: { value: 1 }, uColor: { value: vec(SECTION_HEX[data.sections[0].id]) } };
  const streaks = new LineSegments(streakGeo, keep(new ShaderMaterial({ vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG, uniforms: streakU, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending })));
  streaks.frustumCulled = false;
  scene.add(streaks);

  // the gates: three six-sided frames turning against each other, and the kanji in the opening
  const frames = [keep(new RingGeometry(2.55, 2.66, 6, 1)), keep(new RingGeometry(2.95, 3.0, 6, 1)), keep(new RingGeometry(3.5, 3.75, 6, 1))];
  const glyphGeo = keep(new PlaneGeometry(2.6, 2.6));
  const gates = data.sections.map((s, i) => {
    const hex = SECTION_HEX[s.id];
    const alpha = { value: 0 };
    const color = { value: vec(hex) };
    const group = new Group();
    const rings = frames.map((geo, k) => {
      const m = new Mesh(geo, keep(new ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: RING_FRAG, uniforms: { uColor: color, uAlpha: alpha }, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })));
      m.rotation.z = k * 0.5;
      group.add(m);
      return m;
    });
    const tex = textureOf(glyphCanvas(s.kanji, 256, FONT_KANJI, '800'), renderer);
    textures.push(tex);
    const glyph = new Mesh(glyphGeo, keep(new ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: GLYPH_FRAG, uniforms: { uMap: { value: tex }, uColor: color, uAlpha: alpha }, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })));
    group.add(glyph);
    scene.add(group);
    return { s, hex, group, rings, alpha, i };
  });

  let travel = 0;
  let boost = 0;
  let ahead = -1;
  let steerX = 0;
  let steerY = 0;
  const colorTo = new Vector3();

  const show = (i: number) => {
    if (i === ahead) return;
    ahead = i;
    const s = gates[i].s;
    colorTo.set(...rgb(gates[i].hex));
    ctx.hud({ kicker: `Gate ${i + 1} of ${n} · ${s.code}`, title: s.name, value: `LV ${s.level}`, sub: s.minutes ? `${fmtHours(s.minutes)} in the last year · ${Math.round(s.pct * 100)}% to LV ${s.level + 1}` : `${Math.round(s.pct * 100)}% of the way to LV ${s.level + 1}`, color: gates[i].hex, section: s.id });
  };
  show(0);
  streakU.uColor.value.copy(colorTo);

  return {
    resize(w, h) {
      camera.aspect = w / h;
      camera.fov = h > w ? 82 : 66;
      camera.updateProjectionMatrix();
    },
    frame(t, dt) {
      boost = damp(boost, 0, 1.6, dt);
      const speed = (ctx.reduced ? 1.4 : 6.5) + boost;
      travel += speed * dt;
      streakU.uTravel.value = travel;
      streakU.uTime.value = t;
      streakU.uStretch.value = 1 + boost * 0.12;
      streakU.uColor.value.lerp(colorTo, 1 - Math.exp(-2.5 * dt));

      let next = 0;
      let nearest = 1e9;
      for (const g of gates) {
        const z = -((((g.i * GAP + 14 - travel) % LOOP) + LOOP) % LOOP);
        const [bx, by] = bendJs(z, t);
        g.group.position.set(bx, by, z);
        g.rings.forEach((r, k) => (r.rotation.z += dt * (k % 2 ? -0.25 : 0.18) * (1 + boost * 0.1)));
        // out of the dark far ahead; gone just before it reaches the lens
        const far = Math.min(1, Math.max(0, (z + 75) / 30));
        const close = Math.min(1, Math.max(0, (-z - 0.3) / 2.2));
        g.alpha.value = far * close * 0.95;
        if (-z > 2.5 && -z < nearest) {
          nearest = -z;
          next = g.i;
        }
      }
      show(next);

      steerX = damp(steerX, ctx.pointer.inside ? ctx.pointer.x : Math.sin(t * 0.4) * 0.35, 2.5, dt);
      steerY = damp(steerY, ctx.pointer.inside ? ctx.pointer.y : Math.cos(t * 0.31) * 0.25, 2.5, dt);
      camera.position.set(steerX * 0.9, steerY * 0.6, 0);
      camera.rotation.set(steerY * 0.12, -steerX * 0.16, -steerX * 0.22 + Math.sin(t * 0.27) * 0.06);
      const fov = (camera.aspect < 1 ? 82 : 66) + boost * 1.1;
      if (Math.abs(camera.fov - fov) > 0.05) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    },
    tap() {
      boost = Math.min(26, boost + 16);
    },
    dispose() {
      for (const d of disposables) d.dispose();
      for (const tx of textures) tx.dispose();
    },
  };
}
