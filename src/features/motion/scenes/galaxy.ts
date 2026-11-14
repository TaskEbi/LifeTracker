/**
 * Galaxy 星: every day of the last year is a cluster of stars on a spiral arm, in the colour of the
 * section that took most of it and denser the more was logged. A year ago is near the core; this
 * week is out at the rim. Tap a cluster to read the day.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial, Vector3 } from 'three';
import { longDay } from '../../../domain/log/dates';
import { fmtHours, fmtSpan } from '../../../domain/motion/model';
import { sectionInfo } from '../../../domain/sections';
import { damp, makeLabels, project, rgb, rng, SECTION_HEX, smooth, type StageCtx, type StageScene } from '../stage';

const RIM = 4.6;
const SPIN = 0.27;
const spinAt = (r: number, t: number) => (t * SPIN) / (0.45 + r);

const VERT = /* glsl */ `
attribute vec3 aCenter, aColor, aSeed;
attribute float aDay;
uniform float uTime, uOpen, uSize, uSel;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float r = length(aCenter.xz);
  float ang = uTime * ${SPIN.toFixed(3)} / (0.45 + r) + (1. - uOpen) * (2.5 - r * 0.4);
  float c = cos(ang), s = sin(ang);
  vec3 ctr = aCenter * uOpen;
  ctr.xz = mat2(c, s, -s, c) * ctr.xz;
  vec3 p = ctr + position * (0.35 + 0.65 * uOpen);
  float sel = 1. - step(0.5, abs(aDay - uSel));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.45 + aSeed.x * 1.4) * (1. + sel * 1.6) / -mv.z;
  float tw = 0.72 + 0.28 * sin(uTime * (0.8 + aSeed.y * 3.) + aSeed.y * 40.);
  vColor = mix(aColor, vec3(1.), min(1., sel * 0.65 + aSeed.x * aSeed.x * 0.35));
  vAlpha = aSeed.z * tw * (1. + sel);
}`;
const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0., r);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;
const CORE_FRAG = /* glsl */ `
varying vec2 vUv;
void main(){
  float r = length(vUv - 0.5) * 2.;
  float a = exp(-r * r * 14.) * 0.9 + exp(-r * 3.4) * 0.3;
  gl_FragColor = vec4(mix(vec3(1., 0.72, 0.42), vec3(1., 0.95, 0.85), exp(-r * 6.)), a * smoothstep(1., 0.6, r));
}`;
const UV_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export function createGalaxy(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const rand = rng(3);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const past = data.days.filter((d) => !d.future);
  const n = past.length;
  const maxMin = Math.max(60, ...past.map((d) => d.minutes));

  // where each day sits before the galaxy turns
  const centers = past.map((_, i) => {
    const u = i / (n - 1);
    const r = 0.55 + (RIM - 0.55) * Math.pow(u, 0.85);
    const th = (i % 2) * Math.PI + r * 1.25;
    return new Vector3(Math.cos(th) * r, 0, Math.sin(th) * r);
  });

  const pos: number[] = [];
  const ctr: number[] = [];
  const col: number[] = [];
  const seed: number[] = [];
  const day: number[] = [];
  const star = (c: Vector3, spread: number, thick: number, color: number[], bright: number, d: number) => {
    pos.push(gauss() * spread, gauss() * thick, gauss() * spread);
    ctr.push(c.x, c.y, c.z);
    col.push(color[0], color[1], color[2]);
    seed.push(rand(), rand(), bright);
    day.push(d);
  };
  past.forEach((d, i) => {
    const color = d.top ? rgb(SECTION_HEX[d.top]) : [0.62, 0.66, 0.78];
    const k = d.minutes ? 4 + Math.round((d.minutes / maxMin) * 34) : 1;
    for (let j = 0; j < k; j++) star(centers[i], 0.1 + 0.13 * Math.sqrt(k / 38), 0.06, color, d.minutes ? 0.55 + 0.4 * rand() : 0.3, i);
  });
  // the haze along the arms, and the bulge
  const haze = Math.min(innerWidth, innerHeight) < 700 ? 3500 : 7000;
  for (let j = 0; j < haze; j++) {
    const c = centers[(rand() * n) | 0];
    star(c, 0.5, 0.1, [0.45, 0.55, 0.95], 0.12 + rand() * 0.2, -1);
  }
  const origin = new Vector3();
  for (let j = 0; j < 1400; j++) star(origin, 0.5, 0.28, [1, 0.8, 0.55], 0.1 + rand() * 0.2, -1);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('aCenter', new BufferAttribute(new Float32Array(ctr), 3));
  geo.setAttribute('aColor', new BufferAttribute(new Float32Array(col), 3));
  geo.setAttribute('aSeed', new BufferAttribute(new Float32Array(seed), 3));
  geo.setAttribute('aDay', new BufferAttribute(new Float32Array(day), 1));
  const uniforms = { uTime: { value: 0 }, uOpen: { value: 0 }, uSize: { value: 30 }, uSel: { value: -5 } };
  const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending });
  const stars = new Points(geo, mat);
  stars.frustumCulled = false;

  const coreGeo = new PlaneGeometry(3.2, 3.2);
  const coreMat = new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: CORE_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending });
  const core = new Mesh(coreGeo, coreMat);

  const scene = new Scene();
  scene.add(core, stars);
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  const label = makeLabels(ctx.overlay, [{ text: ' ', sub: ' ' }]);
  const labelEl = ctx.overlay.lastElementChild as HTMLElement;

  let yaw = 0.3;
  let yawVel = 0;
  let pitch = 0.72;
  let intro = 0;
  let sel = -1;
  let time = 0;
  let w = 1;
  let h = 1;
  let dist = 12;
  const v = new Vector3();
  const now = (i: number, out: Vector3) => {
    const c = centers[i];
    const a = spinAt(Math.hypot(c.x, c.z), time);
    return out.set(c.x * Math.cos(a) - c.z * Math.sin(a), 0, c.x * Math.sin(a) + c.z * Math.cos(a));
  };

  const overview = () => ctx.hud({ kicker: `${data.active} days logged`, title: 'Every day a star', value: fmtHours(data.total), sub: 'A year ago is near the core and this week is at the rim · brighter clusters are longer days', color: '#ffe2bd' });
  const select = (i: number) => {
    sel = i;
    uniforms.uSel.value = i < 0 ? -5 : i;
    if (i < 0) return overview();
    const d = past[i];
    const top = d.top ? sectionInfo(d.top) : null;
    labelEl.firstChild!.textContent = d.minutes ? fmtSpan(d.minutes) : 'Day off';
    (labelEl.lastElementChild as HTMLElement).textContent = `${Number(d.date.slice(8))} ${longDay(d.date).split(' ')[2].slice(0, 3)}`;
    ctx.hud({
      kicker: longDay(d.date),
      title: d.minutes ? (top ? top.name : 'Logged') : 'Nothing logged',
      value: d.minutes ? fmtSpan(d.minutes) : '—',
      sub: d.minutes ? (top ? `Most of it was ${top.full.toLowerCase()}` : 'Time outside the sections') : 'A dark patch between the stars',
      color: d.top ? SECTION_HEX[d.top] : '#c9ccd4',
      section: d.top ?? undefined,
    });
  };
  overview();

  return {
    resize(nw, nh, dpr) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const t = Math.tan((camera.fov * Math.PI) / 360);
      dist = Math.max(9.5, Math.min(h > w ? 21 : 40, (RIM * 1.05) / (t * camera.aspect)));
      uniforms.uSize.value = h * dpr * 0.075;
    },
    frame(t, dt) {
      time = t * (ctx.reduced ? 0.15 : 1);
      uniforms.uTime.value = time;
      intro = Math.min(1, intro + dt / (ctx.reduced ? 0.01 : 3.4));
      uniforms.uOpen.value = smooth(intro);
      if (!ctx.reduced) yaw += dt * 0.02;
      yaw += yawVel * dt;
      yawVel = damp(yawVel, 0, 3, dt);
      const tilt = pitch + (ctx.pointer.inside ? ctx.pointer.y * 0.12 : 0);
      const lookY = h > w ? -2.6 : -0.2;
      camera.position.set(Math.sin(yaw) * Math.cos(tilt) * dist, Math.sin(tilt) * dist + lookY, Math.cos(yaw) * Math.cos(tilt) * dist);
      camera.lookAt(0, lookY, 0);
      core.quaternion.copy(camera.quaternion);
      if (sel >= 0) {
        now(sel, v);
        const s = project(camera, v.x, 0.35, v.z);
        label.place(0, ((s.x + 1) / 2) * w, ((1 - s.y) / 2) * h - 14, 0.8, 1);
      } else label.place(0, 0, 0, 1, 0);
      renderer.render(scene, camera);
    },
    drag(dx, dy) {
      yawVel = -dx * 0.2;
      yaw -= dx * 0.005;
      pitch = Math.max(0.25, Math.min(1.4, pitch + dy * 0.004));
    },
    tap(x, y) {
      let hit = -1;
      let best = 0.045;
      for (let i = 0; i < n; i++) {
        now(i, v);
        const s = project(camera, v.x, v.y, v.z);
        const d = Math.hypot((s.x - x) * (w / h), s.y - y);
        if (s.z < 1 && d < best) {
          best = d;
          hit = i;
        }
      }
      select(hit === sel ? -1 : hit);
    },
    dispose() {
      label.dispose();
      geo.dispose();
      mat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    },
  };
}
