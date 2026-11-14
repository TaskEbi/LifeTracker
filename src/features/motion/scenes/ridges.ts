/**
 * Ridges 峰: one mountain range per section, running across the last 53 weeks; every busy week is a
 * peak. The ranges stand one behind another, each hiding the foot of the next, and a pulse of light
 * runs along them from a year ago to now.
 */
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, PerspectiveCamera, Scene, ShaderMaterial, Vector3 } from 'three';
import { fmtHours, fmtSpan, WEEKS } from '../../../domain/motion/model';
import { damp, makeLabels, project, SECTION_HEX, vec, type StageCtx, type StageScene } from '../stage';

const W = 7.2; // a year, left to right
const GAP = 0.58; // between ranges
const PEAK = 1.7;
const SUB = 5; // points per week
const LINE = 0.028;

const VERT = /* glsl */ `
attribute float aT, aX, aEdge;
uniform float uGrow, uLine;
varying float vT, vX, vEdge, vDist;
void main(){
  float g = clamp((uGrow * 1.5 - aX) / 0.5, 0., 1.);
  g = 1. - pow(1. - g, 3.);
  vec3 p = position;
  p.y = p.y * g + aEdge * uLine;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  vT = aT; vX = aX; vEdge = aEdge; vDist = -mv.z;
}`;
const FILL_FRAG = /* glsl */ `
uniform vec3 uColor, uBg;
uniform float uOn, uPulse;
varying float vT, vX, vDist;
void main(){
  float pulse = exp(-pow((vX - uPulse) * 7., 2.));
  vec3 col = mix(uBg, uColor * 0.42, pow(vT, 1.8) * uOn) + uColor * pulse * vT * 0.25;
  col = mix(uBg, col, exp(-vDist * 0.035));
  gl_FragColor = vec4(col, 1.);
}`;
const LINE_FRAG = /* glsl */ `
uniform vec3 uColor, uBg;
uniform float uOn, uPulse;
varying float vX, vDist;
void main(){
  float pulse = exp(-pow((vX - uPulse) * 7., 2.));
  vec3 col = mix(uColor, vec3(1.), 0.18 + pulse * 0.7) * (0.35 + 0.65 * uOn) * (1. + pulse * 0.6);
  col = mix(uBg, col, exp(-vDist * 0.03));
  gl_FragColor = vec4(col, 1.);
}`;

/** Weekly values → a smooth run of heights, SUB points per week. */
function profile(weeks: number[], scale: number): Float32Array {
  const soft = weeks.map((v, i) => (v * 2 + (weeks[i - 1] ?? v) + (weeks[i + 1] ?? v)) / 4);
  const n = (WEEKS - 1) * SUB + 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const f = i / SUB;
    const a = Math.floor(f);
    const k = f - a;
    const e = (1 - Math.cos(k * Math.PI)) / 2;
    out[i] = (soft[a] * (1 - e) + (soft[Math.min(WEEKS - 1, a + 1)] ?? 0) * e) * scale;
  }
  return out;
}

export function createRidges(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  const bg = new Vector3(0.02, 0.02, 0.028);
  const shared = { uGrow: { value: 0 }, uPulse: { value: -1 }, uLine: { value: LINE }, uBg: { value: bg } };
  const disposables: { dispose(): void }[] = [];

  // the busiest range at the back, so the smaller ones aren't hidden behind it
  const rows = data.sections
    .filter((s) => (data.weekly[s.id]?.reduce((a, b) => a + b, 0) ?? 0) > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 9);
  const top = Math.max(60, ...rows.flatMap((s) => data.weekly[s.id]!));
  const n = (WEEKS - 1) * SUB + 1;
  const ridges = rows.map((s, i) => {
    const hs = profile(data.weekly[s.id]!, PEAK / top);
    const z = (i - (rows.length - 1) / 2) * GAP;
    const build = (line: boolean) => {
      const pos = new Float32Array(n * 2 * 3);
      const aT = new Float32Array(n * 2);
      const aX = new Float32Array(n * 2);
      const aEdge = new Float32Array(n * 2);
      const idx: number[] = [];
      for (let j = 0; j < n; j++) {
        const x = (j / (n - 1) - 0.5) * W;
        // the fill runs from the ground to the crest; the line is a thin band sitting on the crest
        pos.set([x, line ? hs[j] : 0, z, x, hs[j], z], j * 6);
        aT.set([0, 1], j * 2);
        aX.set([j / (n - 1), j / (n - 1)], j * 2);
        aEdge.set(line ? [-0.2, 1] : [0, 0], j * 2);
        if (j) idx.push(j * 2 - 2, j * 2 - 1, j * 2, j * 2 - 1, j * 2 + 1, j * 2);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(pos, 3));
      g.setAttribute('aT', new BufferAttribute(aT, 1));
      g.setAttribute('aX', new BufferAttribute(aX, 1));
      g.setAttribute('aEdge', new BufferAttribute(aEdge, 1));
      g.setIndex(idx);
      disposables.push(g);
      return g;
    };
    const on = { value: 1 };
    const uniforms = { ...shared, uColor: { value: vec(SECTION_HEX[s.id]) }, uOn: on };
    const fill = new Mesh(build(false), new ShaderMaterial({ vertexShader: VERT, fragmentShader: FILL_FRAG, uniforms, side: DoubleSide }));
    const line = new Mesh(build(true), new ShaderMaterial({ vertexShader: VERT, fragmentShader: LINE_FRAG, uniforms, side: DoubleSide }));
    line.renderOrder = 1;
    fill.frustumCulled = line.frustumCulled = false;
    disposables.push(fill.material, line.material);
    scene.add(fill, line);
    const weeks = data.weekly[s.id]!;
    return { s, z, hs, on, best: Math.max(...weeks), total: weeks.reduce((a, b) => a + b, 0) };
  });

  const labels = makeLabels(
    ctx.overlay,
    ridges.map((r) => ({ text: r.s.kanji, color: SECTION_HEX[r.s.id] })),
  );

  let yaw = 0.5;
  let yawTo = 0.5;
  let set = false;
  let sel = -1;
  let grow = 0;
  let pulse = -0.3;
  let w = 1;
  let h = 1;

  const overview = () =>
    ctx.hud({ kicker: `${WEEKS} weeks · ${ridges.length} sections`, title: 'The shape of the year', value: fmtHours(data.total), sub: 'A range for each section, a peak for every busy week; now is at the near end', color: '#e9ecff' });
  const select = (i: number) => {
    sel = i;
    if (i < 0) return overview();
    const r = ridges[i];
    ctx.hud({ kicker: `${r.s.code} · ${r.s.kanji}`, title: r.s.name, value: fmtHours(r.total), sub: `Busiest week ${fmtSpan(r.best)} · about ${fmtSpan(r.total / WEEKS)} a week`, color: SECTION_HEX[r.s.id], section: r.s.id });
  };
  overview();

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!set) {
        // a tall screen looks along the year, a wide one across it
        yaw = yawTo = h > w ? 1.08 : 0.42;
        set = true;
      }
    },
    frame(t, dt) {
      grow = Math.min(1, grow + dt / (ctx.reduced ? 0.01 : 3.2));
      shared.uGrow.value = grow;
      if (grow >= 1 && !ctx.reduced) {
        pulse += dt * 0.22;
        if (pulse > 1.6) pulse = -0.3;
      }
      shared.uPulse.value = pulse;
      for (const [i, r] of ridges.entries()) r.on.value = damp(r.on.value, sel < 0 || sel === i ? 1 : 0.22, 6, dt);

      yaw = damp(yaw, yawTo + (ctx.pointer.inside ? ctx.pointer.x * 0.12 : Math.sin(t * 0.2) * 0.06), 4, dt);
      const portrait = h > w;
      const dist = portrait ? 10.6 : 10.4;
      const height = 3.3 + (ctx.pointer.inside ? ctx.pointer.y * 0.5 : 0);
      camera.position.set(Math.sin(yaw) * dist, height, Math.cos(yaw) * dist);
      camera.lookAt(portrait ? 0.6 : 0, portrait ? -1.9 : 0.25, 0);

      ridges.forEach((r, i) => {
        const s = project(camera, W / 2 + 0.28, 0.12, r.z);
        labels.place(i, ((s.x + 1) / 2) * w, ((1 - s.y) / 2) * h, sel === i ? 1.25 : 0.95, s.z < 1 ? grow * (sel < 0 || sel === i ? 1 : 0.35) : 0);
      });
      renderer.render(scene, camera);
    },
    drag(dx) {
      yawTo = Math.max(-1.35, Math.min(1.35, yawTo - dx * 0.005));
    },
    tap(x, y) {
      let hit = -1;
      let best = 0.07;
      ridges.forEach((r, i) => {
        for (let j = 0; j <= 26; j++) {
          const k = Math.round((j / 26) * (r.hs.length - 1));
          const s = project(camera, (k / (r.hs.length - 1) - 0.5) * W, r.hs[k] * 0.85, r.z);
          const d = Math.hypot((s.x - x) * (w / h), s.y - y);
          if (s.z < 1 && d < best) {
            best = d;
            hit = i;
          }
        }
      });
      select(hit === sel ? -1 : hit);
    },
    dispose() {
      labels.dispose();
      for (const d of disposables) d.dispose();
    },
  };
}
