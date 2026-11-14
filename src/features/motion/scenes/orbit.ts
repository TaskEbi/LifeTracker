/**
 * Orbit 軌: your level as a sun and the twelve sections as its planets. The busiest section sits
 * closest in, higher levels are bigger worlds, and the highest wears a ring. Tap a planet to fly to it.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, LineBasicMaterial, LineLoop, Mesh, PerspectiveCamera, PlaneGeometry, Points, RingGeometry, Scene, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { fmtHours } from '../../../domain/motion/model';
import { damp, GLSL_NOISE, GOLD, makeLabels, project, rng, SECTION_HEX, smooth, vec, type StageCtx, type StageScene } from '../stage';

const SUN_VERT = /* glsl */ `
varying vec3 vP, vN, vV;
void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const SUN_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vP, vN, vV;
${GLSL_NOISE}
void main(){
  float n = snoise(vP * 4.5 + vec3(0., uTime * 0.12, 0.)) * 0.6 + snoise(vP * 11. - vec3(uTime * 0.2, 0., 0.)) * 0.4;
  float ndv = max(dot(normalize(vN), normalize(vV)), 0.);
  vec3 col = mix(vec3(1., 0.42, 0.08), vec3(1., 0.86, 0.45), smoothstep(-0.5, 0.6, n));
  col += vec3(1., 0.95, 0.8) * smoothstep(0.35, 0.9, n) * 0.5;
  col *= 0.75 + 0.5 * ndv;
  col += vec3(1., 0.6, 0.2) * pow(1. - ndv, 2.) * 0.8;
  gl_FragColor = vec4(col, 1.);
}`;
const HALO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.;
  float r = length(p);
  float a = atan(p.y, p.x);
  float rays = 0.75 + 0.25 * sin(a * 9. + uTime * 0.3) * sin(a * 5. - uTime * 0.2);
  float g = exp(-r * 4.2) * 1.1 * rays + exp(-r * r * 60.) * 0.6;
  gl_FragColor = vec4(uColor, g * smoothstep(1., 0.6, r));
}`;
const UV_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

const PLANET_VERT = /* glsl */ `
varying vec3 vP, vN, vW;
void main(){ vP = position; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const PLANET_FRAG = /* glsl */ `
uniform vec3 uColor, uSun;
uniform float uSeed, uLit;
varying vec3 vP, vN, vW;
${GLSL_NOISE}
void main(){
  vec3 n = normalize(vN);
  vec3 L = normalize(uSun - vW);
  vec3 V = normalize(cameraPosition - vW);
  float diff = max(dot(n, L), 0.);
  float bands = snoise(vec3(vP.y * 9. + uSeed, vP.x * 1.5, vP.z * 1.5 + uSeed)) * 0.5 + 0.5;
  vec3 base = mix(uColor * 0.55, mix(uColor, vec3(1.), 0.35), bands);
  float ndv = max(dot(n, V), 0.);
  vec3 col = base * (0.035 + 1.15 * diff);
  col += uColor * pow(1. - ndv, 2.6) * (0.25 + 0.9 * diff) ;       // air at the limb
  col += vec3(1.) * pow(max(dot(reflect(-L, n), V), 0.), 40.) * 0.35 * diff;
  col += uColor * uLit * 0.25;
  gl_FragColor = vec4(col, 1.);
}`;
const RING_FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
varying float vR;
void main(){
  float bands = 0.55 + 0.45 * sin(vR * 60.) * sin(vR * 23.);
  gl_FragColor = vec4(mix(uColor, vec3(1.), 0.4), 0.5 * bands * smoothstep(0., 0.08, vR) * smoothstep(1., 0.9, vR));
}`;
const RING_VERT = /* glsl */ `
uniform vec2 uSpan;
varying float vR;
void main(){ vR = (length(position.xy) - uSpan.x) / (uSpan.y - uSpan.x); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export function createOrbit(ctx: StageCtx): StageScene {
  const { data, renderer } = ctx;
  const rand = rng(11);
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 200);
  const system = new Group();
  system.rotation.x = 0.46;
  scene.add(system);
  const time = { value: 0 };
  const sunPos = { value: new Vector3() };
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const sunGeo = keep(new SphereGeometry(0.5, 48, 32));
  const sun = new Mesh(sunGeo, keep(new ShaderMaterial({ vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, uniforms: { uTime: time } })));
  system.add(sun);
  const halo = new Mesh(keep(new PlaneGeometry(5.5, 5.5)), keep(new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: HALO_FRAG, uniforms: { uColor: { value: vec('#ffb347') }, uTime: time }, transparent: true, depthWrite: false, blending: AdditiveBlending })));
  halo.renderOrder = 5;
  scene.add(halo);

  // stars on a far shell
  const S = 1100;
  const sp = new Float32Array(S * 3);
  for (let i = 0; i < S; i++) {
    const u = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = 60 + rand() * 30;
    const q = Math.sqrt(1 - u * u);
    sp.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3);
  }
  const starGeo = keep(new BufferGeometry());
  starGeo.setAttribute('position', new BufferAttribute(sp, 3));
  const starMat = keep(
    new ShaderMaterial({
      vertexShader: 'uniform float uSize; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float s = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453); gl_PointSize = uSize * (0.5 + s * 1.6); vA = 0.25 + 0.6 * s; }',
      fragmentShader: 'varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.8, 0.85, 1., smoothstep(0.5, 0., r) * vA); }',
      uniforms: { uSize: { value: 2 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  scene.add(new Points(starGeo, starMat));

  const order = [...data.sections].sort((a, b) => b.minutes - a.minutes || b.level - a.level);
  const topLevel = Math.max(...order.map((s) => s.level));
  const ball = keep(new SphereGeometry(1, 40, 28));
  const circle = keep(new BufferGeometry());
  const cp = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) cp.set([Math.cos((i / 200) * Math.PI * 2), 0, Math.sin((i / 200) * Math.PI * 2)], i * 3);
  circle.setAttribute('position', new BufferAttribute(cp, 3));
  let ringed = false;
  const planets = order.map((s, i) => {
    const hex = SECTION_HEX[s.id];
    const a = 1.15 + i * 0.36;
    const r = Math.min(0.26, 0.075 + 0.011 * s.level);
    const mat = keep(new ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, uniforms: { uColor: { value: vec(hex) }, uSun: sunPos, uSeed: { value: i * 7.3 }, uLit: { value: 0 } } }));
    const mesh = new Mesh(ball, mat);
    mesh.scale.setScalar(r);
    system.add(mesh);
    const lineMat = keep(new LineBasicMaterial({ color: hex, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false }));
    const line = new LineLoop(circle, lineMat);
    line.scale.setScalar(a);
    system.add(line);
    if (!ringed && s.level === topLevel) {
      ringed = true;
      const ring = new Mesh(keep(new RingGeometry(1.5, 2.4, 64)), keep(new ShaderMaterial({ vertexShader: RING_VERT, fragmentShader: RING_FRAG, uniforms: { uColor: { value: vec(hex) }, uSpan: { value: [1.5, 2.4] } }, transparent: true, depthWrite: false, side: DoubleSide })));
      ring.rotation.x = Math.PI / 2 - 0.35;
      ring.rotation.y = 0.2;
      mesh.add(ring);
    }
    return { s, hex, a, r, mesh, mat, lineMat, angle: rand() * Math.PI * 2, speed: 0.55 / Math.pow(a, 1.5), world: new Vector3() };
  });

  const labels = makeLabels(ctx.overlay, [...planets.map((p) => ({ text: p.s.kanji, color: p.hex })), { text: String(data.level), sub: 'level', color: '#3b1600' }]);

  let yaw = 0;
  let yawVel = 0;
  let sel = -1;
  let zoom = 0;
  let intro = 0;
  let w = 1;
  let h = 1;
  let far = 14;
  const look = new Vector3();
  const lookTo = new Vector3();

  const overview = () => ctx.hud({ kicker: 'Twelve sections', title: 'In orbit', value: `LV ${data.level}`, sub: 'The busiest section sits closest to the sun · higher levels are bigger worlds', color: GOLD });
  const select = (i: number) => {
    sel = i;
    if (i < 0) return overview();
    const p = planets[i];
    ctx.hud({ kicker: `${p.s.code} · orbit ${i + 1}`, title: p.s.name, value: `LV ${p.s.level}`, sub: p.s.minutes ? `${fmtHours(p.s.minutes)} in the last year · ${Math.round(p.s.pct * 100)}% to LV ${p.s.level + 1}` : `${Math.round(p.s.pct * 100)}% of the way to LV ${p.s.level + 1}`, color: p.hex, section: p.s.id });
  };
  overview();

  return {
    resize(nw, nh, dpr) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const t = Math.tan((camera.fov * Math.PI) / 360);
      far = Math.min(h > w ? 15.5 : 30, 5.4 / (t * camera.aspect));
      far = Math.max(far, 11);
      starMat.uniforms.uSize.value = 2 * dpr;
    },
    frame(t, dt) {
      time.value = t;
      intro = Math.min(1, intro + dt / 2.6);
      const open = smooth(intro);
      if (!ctx.reduced && sel < 0) yaw += dt * 0.04;
      yaw += yawVel * dt;
      yawVel = damp(yawVel, 0, 3, dt);
      system.rotation.y = yaw;
      system.rotation.x = 0.46 + (ctx.pointer.inside ? ctx.pointer.y * 0.08 : 0);
      const k = ctx.reduced ? 0.2 : 1;
      planets.forEach((p, i) => {
        p.angle += dt * p.speed * k * (sel === i ? 0.25 : 1);
        const a = p.a * (0.3 + 0.7 * open);
        p.mesh.position.set(Math.cos(p.angle) * a, 0, Math.sin(p.angle) * a);
        p.mesh.rotation.y += dt * 0.4;
        p.mat.uniforms.uLit.value = damp(p.mat.uniforms.uLit.value, sel === i ? 1 : 0, 6, dt);
        p.lineMat.opacity = damp(p.lineMat.opacity, (sel === i ? 0.7 : sel < 0 ? 0.2 : 0.08) * open, 6, dt);
      });
      system.updateMatrixWorld(true);
      for (const p of planets) p.mesh.getWorldPosition(p.world);

      zoom = damp(zoom, sel >= 0 ? 1 : 0, 3.2, dt);
      if (sel >= 0) lookTo.copy(planets[sel].world);
      else lookTo.set(0, h > w ? -1.3 : -0.3, 0);
      look.lerp(lookTo, 1 - Math.exp(-4 * dt));
      const dist = far + (1 - open) * 8 - zoom * (far - 3.4);
      camera.position.set(look.x * 0.6, look.y + 1.2 + (1 - zoom) * 1.4, look.z + dist);
      camera.lookAt(look);
      halo.quaternion.copy(camera.quaternion);

      const lab = (i: number, v: Vector3, lift: number, size: number, alpha: number) => {
        const s = project(camera, v.x, v.y + lift, v.z);
        labels.place(i, ((s.x + 1) / 2) * w, ((1 - s.y) / 2) * h, size, s.z < 1 ? alpha : 0);
      };
      planets.forEach((p, i) => {
        const depth = camera.position.distanceTo(p.world);
        lab(i, p.world, p.r + 0.2, Math.max(0.5, Math.min(1.5, 11 / depth)) * (sel === i ? 1.3 : 1), open * (sel < 0 || sel === i ? 0.95 : 0.3));
      });
      lab(planets.length, sun.position, 0, 1.1, open * (1 - zoom) * 0.95);
      renderer.render(scene, camera);
    },
    drag(dx) {
      yawVel = dx * 0.2;
      yaw += dx * 0.005;
    },
    tap(x, y) {
      let hit = -1;
      let best = 0.09;
      planets.forEach((p, i) => {
        const s = project(camera, p.world.x, p.world.y, p.world.z);
        const d = Math.hypot((s.x - x) * (w / h), s.y - y);
        if (s.z < 1 && d < best) {
          best = d;
          hit = i;
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
