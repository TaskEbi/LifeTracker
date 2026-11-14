/**
 * Prism 晶: a twelve-sided crystal, one face per section, with each kanji set a little way inside
 * the glass so it shifts as the crystal turns. Drag to roll it; let go and it settles on the nearest
 * face. Tap a face to bring it round.
 */
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, DodecahedronGeometry, FrontSide, Group, Matrix4, Mesh, PerspectiveCamera, PlaneGeometry, Points, Quaternion, Raycaster, Scene, ShaderMaterial, Vector2, Vector3 } from 'three';
import { fmtHours } from '../../../domain/motion/model';
import { canvas2d, FONT_KANJI, FONT_MONO, rgb, rng, SECTION_HEX, smooth, textureOf, vec, type StageCtx, type StageScene } from '../stage';

const SIZE = 1.3;
const TILE = 256;

const VERT = /* glsl */ `
attribute float aFace;
attribute vec2 aLocal;
attribute vec3 aColor, aRight, aUp;
varying vec2 vLocal, vTile;
varying vec3 vColor, vN, vW, vR, vU;
varying float vFace;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz;
  mat3 m = mat3(modelMatrix);
  vN = normalize(m * normal); vR = normalize(m * aRight); vU = normalize(m * aUp);
  vLocal = aLocal; vColor = aColor; vFace = aFace;
  vTile = vec2(mod(aFace, 4.), floor(aFace / 4.));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uSel, uBack, uTime;
varying vec2 vLocal, vTile;
varying vec3 vColor, vN, vW, vR, vU;
varying float vFace;
float ink(vec2 p){
  vec2 t = p / 1.5 + 0.5;
  if (t.x < 0. || t.x > 1. || t.y < 0. || t.y > 1.) return 0.;
  return texture2D(uAtlas, vec2((vTile.x + t.x) / 4., 1. - (vTile.y + 1. - t.y) / 3.)).a;
}
void main(){
  vec3 N = normalize(vN) * (uBack > 0.5 ? -1. : 1.);
  vec3 V = normalize(cameraPosition - vW);
  float ndv = clamp(dot(N, V), 0., 1.);
  float fres = pow(1. - ndv, 2.4);
  // how far this point is from the face's edge (a pentagon with a corner at the top)
  float a = atan(vLocal.x, vLocal.y);
  float sector = mod(a + 0.6283185, 1.2566371) - 0.6283185;
  float edge = 0.809 - length(vLocal) * cos(sector);
  float line = smoothstep(0.02, 0.004, edge);
  float bevel = smoothstep(0.2, 0., edge);
  // the kanji sits inside the glass: seen at an angle it slides, and a fainter copy lies deeper
  vec2 lean = vec2(dot(V, normalize(vR)), dot(V, normalize(vU))) / max(ndv, 0.35);
  float on = 1. - step(0.5, abs(vFace - uSel));
  float k1 = ink(vLocal - lean * 0.10);
  float k2 = ink(vLocal - lean * 0.24);
  vec3 R = reflect(-V, N);
  float skyl = smoothstep(0.1, 1., R.y);
  float glare = pow(max(dot(R, normalize(vec3(0.5, 0.7, 0.5))), 0.), 24.);
  vec3 col = vColor * (0.025 + 0.07 * skyl);
  col += vColor * fres * 0.5;
  col += vColor * bevel * bevel * 0.3;
  col += mix(vColor, vec3(1.), 0.55) * line * 0.9;
  col += glare * 0.4;
  col += mix(vColor, vec3(1.), 0.75) * k1 * (0.45 + 0.75 * on);
  col += vColor * k2 * 0.3;
  float alpha = clamp(0.3 + fres * 0.35 + bevel * 0.2 + line + k1 + glare, 0., 1.);
  if (uBack > 0.5) { col *= 0.6; alpha = clamp(0.25 + line * 0.8 + k1 * 0.4, 0., 1.); }
  gl_FragColor = vec4(col, alpha);
}`;

const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float r = length(vUv - 0.5) * 2.;
  gl_FragColor = vec4(uColor, (exp(-r * r * 5.) * 0.55 + exp(-r * 2.2) * 0.22) * smoothstep(1., 0.7, r));
}`;
const UV_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export function createPrism(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const rand = rng(5);
  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 60);

  // one square of the atlas per section: the kanji, and the level under it
  const [atlasCanvas, g] = canvas2d(TILE * 4, TILE * 3);
  g.textAlign = 'center';
  g.fillStyle = '#fff';
  data.sections.forEach((s, i) => {
    const cx = (i % 4) * TILE + TILE / 2;
    const cy = Math.floor(i / 4) * TILE;
    g.textBaseline = 'middle';
    g.font = `800 ${TILE * 0.56}px ${FONT_KANJI}`;
    g.fillText(s.kanji, cx, cy + TILE * 0.46);
    g.font = `500 ${TILE * 0.085}px ${FONT_MONO}`;
    (g as unknown as { letterSpacing: string }).letterSpacing = '4px';
    g.fillText(`LV ${s.level}`, cx + 2, cy + TILE * 0.82);
    (g as unknown as { letterSpacing: string }).letterSpacing = '0px';
  });
  const atlas = textureOf(atlasCanvas, renderer);

  // each pentagon is three triangles in a row; give every vertex its face's colour and its place on the face
  const geo = new DodecahedronGeometry(SIZE, 0);
  const pos = geo.getAttribute('position');
  const count = pos.count;
  const aFace = new Float32Array(count);
  const aLocal = new Float32Array(count * 2);
  const aColor = new Float32Array(count * 3);
  const aRight = new Float32Array(count * 3);
  const aUp = new Float32Array(count * 3);
  const faces: { n: Vector3; up: Vector3; right: Vector3; quat: Quaternion }[] = [];
  const p = new Vector3();
  for (let f = 0; f < 12; f++) {
    const pts: Vector3[] = [];
    for (let v = 0; v < 9; v++) {
      p.fromBufferAttribute(pos, f * 9 + v);
      if (!pts.some((q) => q.distanceTo(p) < 1e-4)) pts.push(p.clone());
    }
    const c = pts.reduce((acc, q) => acc.add(q), new Vector3()).multiplyScalar(1 / pts.length);
    const n = c.clone().normalize();
    const up = pts[0].clone().sub(c);
    const radius = up.length();
    up.normalize();
    const right = new Vector3().crossVectors(up, n).normalize();
    // the turn that brings this face to the camera with its kanji upright
    const quat = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, n).transpose());
    faces.push({ n, up, right, quat });
    const col = rgb(SECTION_HEX[data.sections[f].id]);
    for (let v = 0; v < 9; v++) {
      const i = f * 9 + v;
      p.fromBufferAttribute(pos, i).sub(c);
      aFace[i] = f;
      aLocal.set([p.dot(right) / radius, p.dot(up) / radius], i * 2);
      aColor.set(col, i * 3);
      aRight.set([right.x, right.y, right.z], i * 3);
      aUp.set([up.x, up.y, up.z], i * 3);
    }
  }
  geo.setAttribute('aFace', new BufferAttribute(aFace, 1));
  geo.setAttribute('aLocal', new BufferAttribute(aLocal, 2));
  geo.setAttribute('aColor', new BufferAttribute(aColor, 3));
  geo.setAttribute('aRight', new BufferAttribute(aRight, 3));
  geo.setAttribute('aUp', new BufferAttribute(aUp, 3));

  const time = { value: 0 };
  const uSel = { value: 0 };
  const mk = (back: boolean) =>
    new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uAtlas: { value: atlas }, uSel, uBack: { value: back ? 1 : 0 }, uTime: time }, side: back ? BackSide : FrontSide, transparent: true, depthWrite: false, ...(back ? { blending: AdditiveBlending } : {}) });
  const backMat = mk(true);
  const frontMat = mk(false);
  const crystal = new Group();
  const inner = new Mesh(geo, backMat);
  const outer = new Mesh(geo, frontMat);
  outer.renderOrder = 2;
  crystal.add(inner, outer);
  scene.add(crystal);

  const glowColor = { value: vec(SECTION_HEX[data.sections[0].id]) };
  const glowTo = new Vector3().copy(glowColor.value);
  const glowGeo = new PlaneGeometry(7, 7);
  const glowMat = new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: glowColor }, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
  const glow = new Mesh(glowGeo, glowMat);
  glow.position.z = -1.5;
  glow.renderOrder = -1;
  scene.add(glow);

  // motes circling the crystal
  const M = 260;
  const mp = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.9 + rand() * 2.2;
    mp.set([Math.cos(a) * r, (rand() - 0.5) * 3.4, Math.sin(a) * r], i * 3);
  }
  const moteGeo = new BufferGeometry();
  moteGeo.setAttribute('position', new BufferAttribute(mp, 3));
  const moteMat = new ShaderMaterial({
    vertexShader: 'uniform float uSize; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float s = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453); gl_PointSize = uSize * (0.4 + s) / -mv.z; vA = 0.2 + 0.5 * s; }',
    fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(mix(uColor, vec3(1.), 0.5), smoothstep(0.5, 0., r) * vA); }',
    uniforms: { uSize: { value: 30 }, uColor: glowColor },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const motes = new Points(moteGeo, moteMat);
  scene.add(motes);

  const quat = new Quaternion().setFromAxisAngle(new Vector3(0.6, 0.8, 0).normalize(), 2.4);
  const quatTo = faces[0].quat.clone();
  const wobble = new Quaternion();
  const turn = new Quaternion();
  const axisX = new Vector3(1, 0, 0);
  const axisY = new Vector3(0, 1, 0);
  const toCam = new Vector3(0, 0, 1);
  const tmp = new Vector3();
  const ray = new Raycaster();
  const v2 = new Vector2();
  let sel = -1;
  let free = false;
  let idle = 4;
  let since = 0;
  let intro = 0;
  let h = 1;
  let w = 1;

  const select = (f: number) => {
    since = 0;
    quatTo.copy(faces[f].quat);
    if (f === sel) return;
    sel = f;
    uSel.value = f;
    const s = data.sections[f];
    glowTo.set(...rgb(SECTION_HEX[s.id]));
    ctx.hud({ kicker: `${s.code} · face ${f + 1} of 12`, title: s.name, value: `LV ${s.level}`, sub: s.minutes ? `${fmtHours(s.minutes)} in the last year · ${Math.round(s.pct * 100)}% to LV ${s.level + 1}` : `${Math.round(s.pct * 100)}% of the way to LV ${s.level + 1}`, color: SECTION_HEX[s.id], section: s.id });
  };
  const facing = () => {
    let best = 0;
    let bestD = -2;
    faces.forEach((f, i) => {
      const d = tmp.copy(f.n).applyQuaternion(quat).dot(toCam);
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  select(0);

  return {
    resize(nw, nh, dpr) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      const portrait = h > w;
      const dist = Math.max((SIZE * 1.25) / (t * camera.aspect), (SIZE * 1.9) / t);
      const look = portrait ? -0.75 : -0.1;
      camera.position.set(0, look, dist);
      camera.lookAt(0, look, 0);
      camera.updateProjectionMatrix();
      moteMat.uniforms.uSize.value = h * dpr * 0.03;
    },
    frame(t, dt) {
      time.value = t;
      idle += dt;
      since += dt;
      intro = Math.min(1, intro + dt / 1.8);
      if (free && idle > 0.9) {
        free = false;
        select(facing());
      }
      if (!free) {
        if (!ctx.reduced && idle > 8 && since > 4.2) select((sel + 5) % 12);
        quat.slerp(quatTo, 1 - Math.exp(-3.4 * dt));
      }
      // never quite still: the crystal leans with the pointer, or sways by itself
      const px = ctx.pointer.inside ? ctx.pointer.x : Math.sin(t * 0.6) * 0.5;
      const py = ctx.pointer.inside ? ctx.pointer.y : Math.cos(t * 0.45) * 0.4;
      wobble.setFromAxisAngle(axisY, px * 0.42).multiply(turn.setFromAxisAngle(axisX, -py * 0.3));
      crystal.quaternion.copy(wobble).multiply(quat);
      crystal.scale.setScalar(0.6 + 0.4 * smooth(intro));
      crystal.position.y = Math.sin(t * 0.8) * 0.04;
      glowColor.value.lerp(glowTo, 1 - Math.exp(-3 * dt));
      motes.rotation.y = t * 0.05;
      renderer.render(scene, camera);
    },
    drag(dx, dy) {
      free = true;
      idle = 0;
      quat.premultiply(turn.setFromAxisAngle(axisY, dx * 0.008)).premultiply(turn.setFromAxisAngle(axisX, dy * 0.008));
    },
    dragEnd() {
      idle = 0.5;
    },
    tap(x, y) {
      idle = 0;
      ray.setFromCamera(v2.set(x, y), camera);
      const hit = ray.intersectObject(outer, false)[0];
      if (hit?.faceIndex != null) select(Math.floor(hit.faceIndex / 3));
    },
    dispose() {
      geo.dispose();
      glowGeo.dispose();
      moteGeo.dispose();
      backMat.dispose();
      frontMat.dispose();
      glowMat.dispose();
      moteMat.dispose();
      atlas.dispose();
    },
  };
}
