/**
 * Year 年: the last 53 weeks as a field of bars, one per day, as tall as the time logged and in the
 * colour of the section that took most of it. The camera flies in from a year ago while the bars
 * rise, and stops at today. Drag to travel back along the year; tap a day to read it.
 */
import { AdditiveBlending, BoxGeometry, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector3, type Texture } from 'three';
import { longDay, monthName } from '../../../domain/log/dates';
import { fmtHours, fmtSpan, WEEKS } from '../../../domain/motion/model';
import { sectionInfo } from '../../../domain/sections';
import { canvas2d, damp, FONT_MONO, project, rgb, SECTION_HEX, smooth, textureOf, type StageCtx, type StageScene } from '../stage';

const SX = 0.36;
const SZ = 0.36;
const CELL = 0.27;
const MAX_H = 2.1;
const BG = [0.02, 0.02, 0.028];

const BAR_VERT = /* glsl */ `
attribute vec2 aOffset;
attribute vec3 aColor;
attribute float aH, aDelay, aId;
uniform float uGrow, uSel, uSweep, uCell;
varying vec3 vColor, vN;
varying float vY, vDist, vSel, vSweep, vH;
void main(){
  float g = clamp((uGrow - aDelay) / 0.16, 0., 1.);
  g = 1. - pow(1. - g, 3.);
  float sel = 1. - step(0.5, abs(aId - uSel));
  float hh = aH * g + sel * 0.16 * step(0.001, aH);
  vec3 p = position;
  p.xz *= uCell * (1. + sel * 0.2);
  p.y *= hh;
  p.xz += aOffset;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  vColor = aColor; vN = normal; vY = position.y; vDist = -mv.z; vSel = sel; vH = hh;
  vSweep = exp(-pow((aOffset.x - uSweep) * 1.1, 2.));
}`;

const BAR_FRAG = /* glsl */ `
uniform vec3 uBg;
varying vec3 vColor, vN;
varying float vY, vDist, vSel, vSweep, vH;
void main(){
  if (vH < 0.001) discard;
  float top = step(0.5, vN.y);
  float side = abs(vN.x) > 0.5 ? 0.5 : 0.78;
  float grad = mix(0.16, 1., pow(vY, 1.6));
  vec3 col = vColor * mix(side * grad, 1.2, top) + top * 0.2;
  // a bright lip under the top edge, so each bar reads as lit glass
  col += vColor * (1. - top) * smoothstep(0.035, 0., (1. - vY) * vH) * 0.9;
  col += vColor * vSweep * 0.55 * mix(grad, 1., top);
  col = mix(col, vec3(1.), vSel * 0.45);
  col = mix(uBg, col, exp(-vDist * 0.055));
  gl_FragColor = vec4(col, 1.);
}`;

const CAP_VERT = /* glsl */ `
attribute vec2 aOffset;
attribute vec3 aColor;
attribute float aH, aDelay;
uniform float uGrow, uCell;
varying vec3 vColor;
varying vec2 vUv;
varying float vK;
void main(){
  float g = clamp((uGrow - aDelay) / 0.16, 0., 1.);
  g = 1. - pow(1. - g, 3.);
  vec3 p = vec3(position.x * uCell * 4.2 + aOffset.x, aH * g + 0.02, position.y * uCell * 4.2 + aOffset.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  vColor = aColor; vUv = uv; vK = g * smoothstep(0.1, 1.6, aH) * exp(mv.z * 0.05);
}`;

const CAP_FRAG = /* glsl */ `
varying vec3 vColor;
varying vec2 vUv;
varying float vK;
void main(){
  float r = length(vUv - 0.5) * 2.;
  gl_FragColor = vec4(vColor, exp(-r * r * 4.5) * 0.3 * vK);
}`;

const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
varying float vDist;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mv = viewMatrix * wp; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;

const FLOOR_FRAG = /* glsl */ `
uniform vec3 uBg;
uniform float uSweep;
uniform vec2 uStep;
varying vec3 vW;
varying float vDist;
void main(){
  vec2 c = vec2(vW.x / uStep.x + 0.5, vW.z / uStep.y + 0.5);
  vec2 f = abs(fract(c) - 0.5);
  vec2 w = fwidth(c);
  float line = max(1. - smoothstep(0., w.x * 1.5, 0.5 - f.x), 1. - smoothstep(0., w.y * 1.5, 0.5 - f.y));
  float inField = step(abs(vW.z), uStep.y * 3.5) ;
  float sweep = exp(-pow((vW.x - uSweep) * 1.1, 2.));
  vec3 col = uBg + vec3(0.5, 0.55, 0.7) * line * (0.05 + 0.07 * inField + sweep * 0.2);
  col = mix(uBg, col, exp(-vDist * 0.075));
  gl_FragColor = vec4(col, 1.);
}`;

const BEAM_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main(){
  float x = abs(vUv.x - 0.5) * 2.;
  float a = exp(-x * x * 9.) * pow(1. - vUv.y, 1.6) * (0.5 + 0.2 * sin(uTime * 2.4));
  gl_FragColor = vec4(1., 0.93, 0.8, a);
}`;
const UV_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export function createYear(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const days = data.days;
  const n = days.length;
  const maxMin = Math.max(60, ...days.map((d) => d.minutes));
  const todayIdx = Math.max(0, days.findLastIndex((d) => !d.future));
  const xOf = (i: number) => (Math.floor(i / 7) - (WEEKS - 1)) * SX;
  const zOf = (i: number) => ((i % 7) - 3) * SZ;
  const hOf = (i: number) => (days[i].future ? 0 : days[i].minutes ? 0.1 + MAX_H * Math.pow(days[i].minutes / maxMin, 0.85) : 0.022);

  const scene = new Scene();
  const camera = new PerspectiveCamera(46, 1, 0.1, 80);
  renderer.setClearColor(0x050507, 1);

  const offs = new Float32Array(n * 2);
  const cols = new Float32Array(n * 3);
  const hs = new Float32Array(n);
  const delays = new Float32Array(n);
  const ids = new Float32Array(n);
  days.forEach((d, i) => {
    offs[i * 2] = xOf(i);
    offs[i * 2 + 1] = zOf(i);
    const c = d.minutes ? rgb(d.top ? SECTION_HEX[d.top] : '#9aa1aa') : [0.2, 0.2, 0.24];
    cols.set(c, i * 3);
    hs[i] = hOf(i);
    delays[i] = (Math.floor(i / 7) / (WEEKS - 1)) * 0.84;
    ids[i] = i;
  });
  const attrs = (g: InstancedBufferGeometry) => {
    g.setAttribute('aOffset', new InstancedBufferAttribute(offs, 2));
    g.setAttribute('aColor', new InstancedBufferAttribute(cols, 3));
    g.setAttribute('aH', new InstancedBufferAttribute(hs, 1));
    g.setAttribute('aDelay', new InstancedBufferAttribute(delays, 1));
    g.setAttribute('aId', new InstancedBufferAttribute(ids, 1));
    g.instanceCount = n;
    return g;
  };
  const shared = { uGrow: { value: 0 }, uSel: { value: -1 }, uSweep: { value: -99 }, uCell: { value: CELL }, uBg: { value: new Vector3(...BG) } };

  const box = new BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const barGeo = attrs(new InstancedBufferGeometry().copy(box as never) as InstancedBufferGeometry);
  const barMat = new ShaderMaterial({ vertexShader: BAR_VERT, fragmentShader: BAR_FRAG, uniforms: shared });
  const bars = new Mesh(barGeo, barMat);
  bars.frustumCulled = false;

  const quad = new PlaneGeometry(1, 1);
  const capGeo = attrs(new InstancedBufferGeometry().copy(quad as never) as InstancedBufferGeometry);
  const capMat = new ShaderMaterial({ vertexShader: CAP_VERT, fragmentShader: CAP_FRAG, uniforms: shared, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const caps = new Mesh(capGeo, capMat);
  caps.frustumCulled = false;
  caps.renderOrder = 2;

  const floorGeo = new PlaneGeometry(90, 50);
  const floorMat = new ShaderMaterial({ vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: { uBg: shared.uBg, uSweep: shared.uSweep, uStep: { value: [SX, SZ] } } });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-(WEEKS * SX) / 2, -0.001, 0);
  scene.add(floor, bars, caps);

  // today: a column of light
  const time = { value: 0 };
  const beamGeo = new PlaneGeometry(0.5, 7);
  beamGeo.translate(0, 3.5, 0);
  const beamMat = new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: BEAM_FRAG, uniforms: { uTime: time }, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide });
  const beam = new Mesh(beamGeo, beamMat);
  beam.position.set(xOf(todayIdx), hOf(todayIdx), zOf(todayIdx));
  beam.renderOrder = 3;
  scene.add(beam);

  // month names on the floor in front of the first week of each month
  const textures: Texture[] = [];
  const labelMats: MeshBasicMaterial[] = [];
  const labelGeo = new PlaneGeometry(1.1, 0.34);
  for (let wk = 0; wk < WEEKS; wk++) {
    const d = days[wk * 7].date;
    const prev = wk ? days[(wk - 1) * 7].date : '';
    if (wk && d.slice(0, 7) === prev.slice(0, 7)) continue;
    if (!wk && Number(d.slice(8)) > 7) continue;
    const [c, g] = canvas2d(256, 80);
    g.font = `500 44px ${FONT_MONO}`;
    g.fillStyle = '#fff';
    g.textBaseline = 'middle';
    (g as unknown as { letterSpacing: string }).letterSpacing = '8px';
    g.fillText(`${monthName(d).toUpperCase()}${d.slice(5, 7) === '01' ? ` ${d.slice(2, 4)}` : ''}`, 6, 44);
    const tex = textureOf(c, renderer);
    textures.push(tex);
    const m = new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false });
    labelMats.push(m);
    const mesh = new Mesh(labelGeo, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(wk * SX - (WEEKS - 1) * SX + 0.42, 0.004, 4 * SZ + 0.12);
    scene.add(mesh);
  }

  const X_MIN = -(WEEKS - 1) * SX;
  let pos = X_MIN; // where along the year the camera is looking from
  let target = 0;
  let intro = 0;
  let touched = false;
  let sel = -1;
  let w = 1;
  let h = 1;
  let sweep = X_MIN - 3;
  let swayX = 0;
  let swayY = 0;
  let lastPx = 9;
  let lastPy = 9;
  const best = Math.max(...days.map((d) => d.minutes));

  const overview = () =>
    ctx.hud({ kicker: `Last ${WEEKS} weeks`, title: 'Your year', value: fmtHours(data.total), sub: `${data.active} days with something logged · longest day ${fmtSpan(best)}`, color: '#ffe6c2' });
  const select = (i: number) => {
    if (i === sel) return;
    sel = i;
    shared.uSel.value = i;
    if (i < 0) return overview();
    const d = days[i];
    const top = d.top ? sectionInfo(d.top) : null;
    ctx.hud({
      kicker: longDay(d.date),
      title: d.minutes ? (top ? top.name : 'Logged') : 'Nothing logged',
      value: d.minutes ? fmtSpan(d.minutes) : '—',
      sub: d.minutes ? (top ? `Most of it was ${top.full.toLowerCase()}` : 'Time outside the sections') : 'A day off',
      color: d.top ? SECTION_HEX[d.top] : '#c9ccd4',
      section: d.top ?? undefined,
    });
  };
  overview();

  const pick = (x: number, y: number, reach: number) => {
    let hit = -1;
    let bestD = reach;
    for (let i = 0; i < n; i++) {
      if (days[i].future) continue;
      const s = project(camera, xOf(i), hOf(i), zOf(i));
      if (s.z > 1) continue;
      const d = Math.hypot((s.x - x) * (w / h), s.y - y);
      if (d < bestD) {
        bestD = d;
        hit = i;
      }
    }
    return hit;
  };

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.fov = h > w ? 52 : 40;
      camera.updateProjectionMatrix();
    },
    frame(t, dt) {
      time.value = t;
      const dur = ctx.reduced ? 0.01 : 5;
      intro = Math.min(1, intro + dt / dur);
      const e = smooth(intro);
      shared.uGrow.value = intro * 1.12;
      if (!touched) pos = X_MIN * (1 - e);
      else pos = damp(pos, target, 5, dt);
      // every so often a line of light runs the length of the year
      if (intro >= 1 && !ctx.reduced) {
        sweep += dt * 5.5;
        if (sweep > 6) sweep = X_MIN - 6 - 30;
      }
      shared.uSweep.value = sweep;

      const portrait = h > w;
      swayX = damp(swayX, ctx.pointer.inside ? ctx.pointer.x : 0, 3, dt);
      swayY = damp(swayY, ctx.pointer.inside ? ctx.pointer.y : 0, 3, dt);
      const lift = (1 - e) * 1.6; // higher and further back while flying in
      if (portrait) {
        camera.position.set(pos + 3.6 + swayX * 0.5, 5.2 + lift + swayY * 0.3, 8.6 + lift);
        camera.lookAt(pos - 3.4, -1.6, -0.2);
      } else {
        camera.position.set(pos + 3.4 + swayX * 0.7, 3.0 + lift + swayY * 0.4, 5.6 + lift);
        camera.lookAt(pos - 3.6, 0.5, 0);
      }
      beam.lookAt(camera.position.x, beam.position.y, camera.position.z);
      beamMat.opacity = e;
      beam.visible = intro > 0.9;

      // with a mouse, the day under the pointer lights up
      if (ctx.pointer.inside && (Math.abs(ctx.pointer.x - lastPx) > 0.002 || Math.abs(ctx.pointer.y - lastPy) > 0.002)) {
        lastPx = ctx.pointer.x;
        lastPy = ctx.pointer.y;
        if (matchMedia('(hover: hover)').matches && intro >= 1) select(pick(lastPx, lastPy, 0.05));
      }
      renderer.render(scene, camera);
    },
    drag(dx) {
      if (!touched) target = pos;
      touched = true;
      intro = 1;
      target = Math.max(X_MIN + 2, Math.min(0, target - dx * (9 / Math.min(w, 1000))));
    },
    tap(x, y) {
      if (intro < 1) {
        intro = 1;
        return;
      }
      select(pick(x, y, 0.07));
    },
    dispose() {
      box.dispose();
      quad.dispose();
      barGeo.dispose();
      capGeo.dispose();
      floorGeo.dispose();
      beamGeo.dispose();
      labelGeo.dispose();
      barMat.dispose();
      capMat.dispose();
      floorMat.dispose();
      beamMat.dispose();
      for (const m of labelMats) m.dispose();
      for (const tx of textures) tx.dispose();
    },
  };
}
