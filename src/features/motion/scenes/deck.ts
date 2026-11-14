/**
 * Deck 札: every section as a foil card on a ring. Drag to spin it, tap the front card to turn it
 * over (the back has the numbers), tap another to bring it round. The cards are drawn on canvases
 * from the same figures the app shows; the foil, the glare and the reflections are a shader.
 */
import { AdditiveBlending, DoubleSide, Group, Mesh, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, ShaderMaterial, Vector2, Vector3, type Texture } from 'three';
import { fmtHours, fmtSpan, type MotionSection } from '../../../domain/motion/model';
import { canvas2d, damp, FONT_DISPLAY, FONT_GOTHIC, FONT_KANJI, FONT_MONO, GLSL_NOISE, rgb, SECTION_HEX, smooth, textureOf, vec, type StageCtx, type StageScene } from '../stage';

const CW = 512;
const CH = 728;
const CARD_W = 1;
const CARD_H = (CARD_W * CH) / CW;
const R = 2.7;
const FLOOR = -0.92;

const mixHex = (hex: string, k: number, to = 0) => {
  const [r, g, b] = rgb(hex).map((v) => Math.round((v * (1 - k) + to * k) * 255));
  return `rgb(${r} ${g} ${b})`;
};
const alpha = (hex: string, a: number) => {
  const [r, g, b] = rgb(hex).map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b} / ${a})`;
};

function spaced(g: CanvasRenderingContext2D, px: number) {
  // not in every browser yet; the cards read fine without it
  (g as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

function drawFront(s: MotionSection, hex: string): HTMLCanvasElement {
  const [c, g] = canvas2d(CW, CH);
  const bg = g.createLinearGradient(0, 0, CW * 0.6, CH);
  bg.addColorStop(0, mixHex(hex, 0.7));
  bg.addColorStop(0.55, mixHex(hex, 0.9));
  bg.addColorStop(1, '#08080b');
  g.fillStyle = bg;
  g.fillRect(0, 0, CW, CH);
  const halo = g.createRadialGradient(CW / 2, 330, 10, CW / 2, 330, 330);
  halo.addColorStop(0, alpha(hex, 0.42));
  halo.addColorStop(1, alpha(hex, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, CW, CH);
  // hairlines, like the guilloche on a banknote
  g.strokeStyle = 'rgb(255 255 255 / 0.045)';
  g.lineWidth = 1;
  for (let i = -CH; i < CW; i += 9) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + CH, CH);
    g.stroke();
  }
  g.strokeStyle = alpha(hex, 0.55);
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(18, 18, CW - 36, CH - 36, 18);
  g.stroke();

  g.textBaseline = 'alphabetic';
  g.fillStyle = 'rgb(255 255 255 / 0.72)';
  g.font = `500 19px ${FONT_MONO}`;
  spaced(g, 4);
  g.textAlign = 'left';
  g.fillText(s.code, 44, 70);
  g.fillText('LV', 44, 100);
  spaced(g, 0);
  g.textAlign = 'right';
  g.fillStyle = '#fff';
  g.font = `64px ${FONT_DISPLAY}`;
  g.fillText(String(s.level), CW - 42, 104);

  // the kanji, lit from above
  g.textAlign = 'center';
  g.font = `800 300px ${FONT_KANJI}`;
  g.shadowColor = hex;
  g.shadowBlur = 60;
  const ink = g.createLinearGradient(0, 200, 0, 470);
  ink.addColorStop(0, '#ffffff');
  ink.addColorStop(1, mixHex(hex, 0.25, 1));
  g.fillStyle = ink;
  g.fillText(s.kanji, CW / 2, 440);
  g.shadowBlur = 0;

  g.fillStyle = '#fff';
  g.font = `900 30px ${FONT_GOTHIC}`;
  spaced(g, 10);
  g.fillText(s.name.toUpperCase(), CW / 2 + 5, 540);
  spaced(g, 0);

  const x0 = 60;
  const x1 = CW - 60;
  g.fillStyle = 'rgb(255 255 255 / 0.14)';
  g.fillRect(x0, 580, x1 - x0, 4);
  g.fillStyle = hex;
  g.shadowColor = hex;
  g.shadowBlur = 14;
  g.fillRect(x0, 580, (x1 - x0) * s.pct, 4);
  g.shadowBlur = 0;
  g.font = `500 17px ${FONT_MONO}`;
  spaced(g, 2);
  g.fillStyle = 'rgb(255 255 255 / 0.62)';
  g.textAlign = 'left';
  g.fillText(`${Math.round(s.pct * 100)}% TO LV ${s.level + 1}`, x0, 618);
  g.textAlign = 'right';
  g.fillText(s.minutes ? `${fmtHours(s.minutes).toUpperCase()} / YEAR` : 'NO TIMED LOG', x1, 618);
  g.textAlign = 'center';
  g.fillStyle = alpha(hex, 0.9);
  g.fillText('LIFETRACKER', CW / 2, 676);
  return c;
}

function drawBack(s: MotionSection, hex: string): HTMLCanvasElement {
  const [c, g] = canvas2d(CW, CH);
  g.fillStyle = '#09090c';
  g.fillRect(0, 0, CW, CH);
  const halo = g.createRadialGradient(CW / 2, 210, 10, CW / 2, 210, 380);
  halo.addColorStop(0, alpha(hex, 0.3));
  halo.addColorStop(1, alpha(hex, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, CW, CH);
  g.strokeStyle = alpha(hex, 0.55);
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(18, 18, CW - 36, CH - 36, 18);
  g.stroke();
  // the seal
  g.lineWidth = 1.5;
  for (const [r, a] of [
    [112, 0.8],
    [102, 0.25],
    [140, 0.14],
  ] as const) {
    g.strokeStyle = alpha(hex, a);
    g.beginPath();
    g.arc(CW / 2, 210, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = i % 5 ? 118 : 116;
    g.strokeStyle = alpha(hex, i % 5 ? 0.3 : 0.8);
    g.beginPath();
    g.moveTo(CW / 2 + Math.cos(a) * r0, 210 + Math.sin(a) * r0);
    g.lineTo(CW / 2 + Math.cos(a) * 126, 210 + Math.sin(a) * 126);
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  g.font = `800 132px ${FONT_KANJI}`;
  g.fillText(s.kanji, CW / 2, 258);

  const rows: [string, string][] = [
    ['LEVEL', String(s.level)],
    ['LAST YEAR', s.minutes ? fmtHours(s.minutes) : '—'],
    ['LAST 7 DAYS', s.week ? fmtSpan(s.week) : '—'],
    ['TO NEXT', `${Math.round(s.pct * 100)}%`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 430 + i * 66;
    g.fillStyle = 'rgb(255 255 255 / 0.12)';
    g.fillRect(56, y - 46, CW - 112, 1);
    g.textAlign = 'left';
    g.fillStyle = 'rgb(255 255 255 / 0.6)';
    g.font = `500 17px ${FONT_MONO}`;
    spaced(g, 3);
    g.fillText(k, 56, y - 8);
    spaced(g, 0);
    g.textAlign = 'right';
    g.fillStyle = i === 0 ? hex : '#fff';
    g.font = `36px ${FONT_DISPLAY}`;
    g.fillText(v, CW - 56, y - 4);
  });
  g.textAlign = 'center';
  g.fillStyle = 'rgb(255 255 255 / 0.5)';
  g.font = `500 15px ${FONT_MONO}`;
  spaced(g, 4);
  g.fillText(`${s.code} · ${s.name.toUpperCase()}`, CW / 2, 680);
  spaced(g, 0);
  return c;
}

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CARD_FRAG = /* glsl */ `
uniform sampler2D uFront, uBack;
uniform vec3 uColor;
uniform float uTime, uDim, uMirror, uFoil, uAspect;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main(){
  vec2 p = (vUv - 0.5) * vec2(1., uAspect);
  float d = rbox(p, vec2(0.5, uAspect * 0.5), 0.055);
  float aa = fwidth(d) + 0.0005;
  float mask = 1. - smoothstep(-aa, aa, d);
  if (mask < 0.01) discard;
  bool front = gl_FrontFacing;
  if (uMirror > 0.5) front = !front;
  vec3 N = normalize(vN) * (front ? 1. : -1.);
  vec3 V = normalize(cameraPosition - vW);
  vec2 uv = vUv;
  if (!front) uv.x = 1. - uv.x;
  vec3 tex = front ? texture2D(uFront, uv).rgb : texture2D(uBack, uv).rgb;
  float lum = dot(tex, vec3(0.3, 0.5, 0.2));
  float ndv = clamp(dot(N, V), 0., 1.);
  // foil: a rainbow that slides across as the card tilts, strongest on the bright ink
  float tilt = N.x * 1.5 + N.y * 1.1;
  float band = uv.x * 0.9 + uv.y * 0.55 + tilt * 2.4 + uTime * 0.025;
  vec3 holo = 0.5 + 0.5 * cos(6.2831 * (band * 1.35 + vec3(0., 0.33, 0.67)));
  float engrave = 0.62 + 0.38 * sin((uv.x - uv.y * 1.42) * 260.);
  float amount = (0.05 + 0.5 * smoothstep(0.3, 0.95, lum)) * (0.45 + 1.5 * pow(1. - ndv, 1.3));
  vec3 col = tex + holo * amount * engrave * uFoil;
  // a soft bar of glare crossing the card
  float g = uv.x + uv.y * 0.32 - (0.66 + tilt * 2.7);
  col += smoothstep(0.24, 0., abs(g)) * 0.13 * uFoil;
  // the lit edge
  col += uColor * smoothstep(-0.022, 0., d) * 0.75;
  col *= uDim;
  float a = mask;
  if (uMirror > 0.5) a *= 0.34 * pow(1. - vUv.y, 2.2);
  gl_FragColor = vec4(col, a);
}`;

const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

const BG_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
${GLSL_NOISE}
void main(){
  vec2 p = vUv - 0.5;
  float n = snoise(vec3(p.x * 2.4, p.y * 3.2, uTime * 0.045));
  float n2 = snoise(vec3(p.x * 5. + 9., p.y * 1.5, uTime * 0.07));
  float curtain = exp(-pow((p.y + 0.02 + n * 0.07) * 4.6, 2.)) * (0.55 + 0.45 * n2);
  float core = exp(-dot(p, p) * 9.);
  vec3 col = vec3(0.018, 0.018, 0.026) + uColor * (curtain * 0.3 + core * 0.2);
  gl_FragColor = vec4(col, 1.);
}`;

const FLOOR_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.;
  float r = length(p);
  float pool = exp(-r * r * 9.) * 0.55;
  float rings = smoothstep(0.92, 1., sin(r * 46. - uTime * 0.6) * 0.5 + 0.5) * exp(-r * 3.2) * 0.22;
  gl_FragColor = vec4(uColor * (pool + rings), 1.);
}`;

export function createDeck(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const n = data.sections.length;
  const step = (Math.PI * 2) / n;
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 80);
  const textures: Texture[] = [];
  const materials: ShaderMaterial[] = [];
  const geo = new PlaneGeometry(CARD_W, CARD_H);
  const time = { value: 0 };
  const glow = { value: vec(SECTION_HEX[data.sections[0].id]) };

  const bgMat = new ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: { uColor: glow, uTime: time }, depthTest: false, depthWrite: false });
  const bgGeo = new PlaneGeometry(60, 34);
  const bg = new Mesh(bgGeo, bgMat);
  bg.position.z = -16;
  bg.renderOrder = -10;
  scene.add(bg);

  const floorMat = new ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: FLOOR_FRAG, uniforms: { uColor: glow, uTime: time }, depthTest: false, depthWrite: false, transparent: true, blending: AdditiveBlending });
  const floorGeo = new PlaneGeometry(9, 9);
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR, 0.2);
  floor.renderOrder = -5;
  scene.add(floor);

  const ring = new Group();
  scene.add(ring);
  const cards = data.sections.map((s) => {
    const hex = SECTION_HEX[s.id];
    const front = textureOf(drawFront(s, hex), renderer);
    const back = textureOf(drawBack(s, hex), renderer);
    textures.push(front, back);
    const make = (mirror: boolean) => {
      const m = new ShaderMaterial({
        vertexShader: CARD_VERT,
        fragmentShader: CARD_FRAG,
        uniforms: { uFront: { value: front }, uBack: { value: back }, uColor: { value: vec(hex) }, uTime: time, uDim: { value: 1 }, uMirror: { value: mirror ? 1 : 0 }, uFoil: { value: 1 }, uAspect: { value: CARD_H / CARD_W } },
        side: DoubleSide,
        transparent: true,
        depthWrite: !mirror,
      });
      materials.push(m);
      return m;
    };
    const mesh = new Mesh(geo, make(false));
    const mirror = new Mesh(geo, make(true));
    mirror.renderOrder = -2;
    ring.add(mesh, mirror);
    return { s, hex, mesh, mirror, flip: 0, flipped: false };
  });

  let rot = 0;
  let target = 0;
  let vel = 0;
  let dragging = false;
  let idle = 2;
  let auto = 0;
  let focus = -1;
  let tiltX = 0;
  let tiltY = 0;
  let w = 1;
  let h = 1;
  let intro = 0;
  const glowTo = new Vector3();
  const ray = new Raycaster();
  const v2 = new Vector2();

  const setFocus = (i: number) => {
    if (i === focus) return;
    if (focus >= 0) cards[focus].flipped = false;
    focus = i;
    const c = cards[i];
    glowTo.set(...rgb(c.hex));
    ctx.hud({
      kicker: `${c.s.code} · ${c.s.kanji}`,
      title: c.s.name,
      value: `LV ${c.s.level}`,
      sub: c.s.minutes ? `${fmtHours(c.s.minutes)} in the last year${c.s.week ? ` · ${fmtSpan(c.s.week)} in the last 7 days` : ''}` : `${Math.round(c.s.pct * 100)}% of the way to LV ${c.s.level + 1}`,
      color: c.hex,
      section: c.s.id,
    });
  };
  setFocus(0);
  glow.value.copy(glowTo);

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      const portrait = h > w;
      // the front card takes about two thirds of a phone's width, or half a wide screen's height
      const dist = portrait ? (CARD_W * 1.16) / 0.66 / 2 / (t * camera.aspect) : (CARD_H * 1.16) / 0.5 / 2 / t;
      const look = portrait ? -0.62 : -0.18;
      camera.position.set(0, look + 0.5, dist + 0.55);
      camera.lookAt(0, look, 0);
      camera.updateProjectionMatrix();
    },
    frame(t, dt) {
      time.value = t;
      idle += dt;
      intro = Math.min(1, intro + dt / 1.6);
      if (!dragging) {
        if (!ctx.reduced && idle > 7) {
          auto += dt;
          if (auto > 3.4) {
            auto = 0;
            target -= step;
          }
        }
        rot = damp(rot, target, 5.5, dt);
      }
      vel = damp(vel, 0, 6, dt);
      const spin = (1 - smooth(intro)) * -2.4; // the ring turns into place as the scene opens
      setFocus((((Math.round(-rot / step) % n) + n) % n) | 0);
      glow.value.lerp(glowTo, 1 - Math.exp(-3 * dt));

      const px = ctx.pointer.inside ? ctx.pointer.x : Math.sin(t * 0.5) * 0.35;
      const py = ctx.pointer.inside ? ctx.pointer.y : Math.cos(t * 0.37) * 0.25;
      tiltY = damp(tiltY, px * 0.34, 5, dt);
      tiltX = damp(tiltX, -py * 0.2, 5, dt);

      cards.forEach((c, i) => {
        let a = i * step + rot + spin;
        a = a - Math.round(a / (Math.PI * 2)) * Math.PI * 2; // −π…π, 0 at the front
        const f = smooth(1 - Math.abs(a) / step);
        c.flip = damp(c.flip, c.flipped ? Math.PI : 0, 7, dt);
        const y = f * (0.05 + Math.sin(t * 1.1) * 0.025) - (1 - smooth(intro)) * 0.4;
        const z = Math.cos(a) * R - R + f * 0.55;
        const sc = 1 + f * 0.16;
        c.mesh.position.set(Math.sin(a) * R, y, z);
        c.mesh.rotation.set(tiltX * f, a + c.flip + tiltY * f, 0);
        c.mesh.scale.setScalar(sc);
        c.mirror.position.set(c.mesh.position.x, 2 * FLOOR - y, z);
        c.mirror.rotation.set(-tiltX * f, a + c.flip + tiltY * f, 0);
        c.mirror.scale.set(sc, -sc, sc);
        // cards at the back fall into the dark
        const depth = (z + 2 * R) / (2 * R + 0.55);
        const dim = (0.07 + 0.93 * Math.pow(Math.max(0, depth), 2.4)) * smooth(intro * 1.4);
        (c.mesh.material as ShaderMaterial).uniforms.uDim.value = dim;
        (c.mirror.material as ShaderMaterial).uniforms.uDim.value = dim;
        (c.mesh.material as ShaderMaterial).uniforms.uFoil.value = 0.35 + 0.65 * f;
      });
      renderer.render(scene, camera);
    },
    drag(dx) {
      dragging = true;
      idle = 0;
      auto = 0;
      const k = 2.2 / Math.min(w, 900);
      rot += dx * k;
      vel = dx * k;
    },
    dragEnd() {
      dragging = false;
      // a flick carries on past the next card or two
      target = Math.round((rot + vel * 9) / step) * step;
    },
    tap(x, y) {
      idle = 0;
      auto = 0;
      ray.setFromCamera(v2.set(x, y), camera);
      const hit = ray.intersectObjects(
        cards.map((c) => c.mesh),
        false,
      )[0];
      if (!hit) return;
      const i = cards.findIndex((c) => c.mesh === hit.object);
      if (i === focus) cards[i].flipped = !cards[i].flipped;
      else {
        const want = -i * step;
        target = want + Math.round((rot - want) / (Math.PI * 2)) * Math.PI * 2;
      }
    },
    dispose() {
      geo.dispose();
      bgGeo.dispose();
      floorGeo.dispose();
      bgMat.dispose();
      floorMat.dispose();
      for (const m of materials) m.dispose();
      for (const tx of textures) tx.dispose();
    },
  };
}
