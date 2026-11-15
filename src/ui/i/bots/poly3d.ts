/**
 * A very small 3D renderer for robot art: convex solids made of flat faces, turned, lit from one
 * side and drawn back to front as SVG polygons. Used by Vertex (chassisAtelier.tsx), the one body
 * that is really three-dimensional. Model space: x right, y up, z towards the viewer, in the art's
 * own pixels, with the origin at the middle of the body.
 */
export type V3 = readonly [number, number, number];
export type Tone = 'c' | 'c2' | 'k' | 's' | 'glow';

interface Face {
  v: V3[];
  tone: Tone;
  /** Drawn at full colour whatever the light: eyes, cores. */
  lit?: boolean;
  /** Seen from both sides (a wing). */
  two?: boolean;
  /** Decals sit on a solid's surface: higher layers are drawn after the solid's own faces. */
  layer: number;
}
type Raw = Omit<Face, 'layer'> & { layer?: number; out?: V3 };

export interface Solid {
  faces: Face[];
  /** Its middle: solids are drawn in order of this point's depth. */
  o: V3;
  /** Circles the body: turns per time, where it starts, and how far it bobs. */
  orbit?: { speed: number; phase: number; bob: number };
}
export interface Mesh {
  solids: Solid[];
  count: number;
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mid = (v: V3[]): V3 => {
  let x = 0, y = 0, z = 0;
  for (const p of v) (x += p[0]), (y += p[1]), (z += p[2]);
  return [x / v.length, y / v.length, z / v.length];
};

/** A solid from its faces, each wound so its normal points away from the middle (or along `out`). */
export function solid(raw: Raw[], o?: V3): Solid {
  const centre = o ?? mid(raw.flatMap((f) => f.v));
  const faces = raw.map(({ out, ...f }): Face => {
    const n = cross(sub(f.v[1], f.v[0]), sub(f.v[2], f.v[0]));
    const want = out ?? sub(mid(f.v), centre);
    return { ...f, layer: f.layer ?? 0, v: dot(n, want) < 0 ? [...f.v].reverse() : f.v };
  });
  return { faces, o: centre };
}

/** A box, `w` × `h` × `d` at its base; `tx`/`tz` scale the top for a taper. */
export function box(x: number, y: number, z: number, w: number, h: number, d: number, tone: Tone, o: { tx?: number; tz?: number; top?: Tone } = {}): Solid {
  const a = w / 2, b = h / 2, e = d / 2, A = a * (o.tx ?? 1), E = e * (o.tz ?? 1);
  const p: V3[] = [
    [x - a, y - b, z - e], [x + a, y - b, z - e], [x + a, y - b, z + e], [x - a, y - b, z + e],
    [x - A, y + b, z - E], [x + A, y + b, z - E], [x + A, y + b, z + E], [x - A, y + b, z + E],
  ];
  const q = (i: number[], t: Tone = tone): Raw => ({ v: i.map((k) => p[k]), tone: t });
  return solid([q([0, 1, 2, 3]), q([4, 5, 6, 7], o.top), q([0, 1, 5, 4]), q([1, 2, 6, 5]), q([2, 3, 7, 6]), q([3, 0, 4, 7])], [x, y, z]);
}

/** An n-sided prism, frustum or pyramid (`rt` = 0) along an axis. */
export function prism(x: number, y: number, z: number, r: number, h: number, n: number, tone: Tone, o: { rt?: number; axis?: 'x' | 'y' | 'z'; rot?: number; lit?: boolean; cap?: Tone } = {}): Solid {
  const rt = o.rt ?? r;
  const at = (rad: number, i: number, ly: number): V3 => {
    const a = (o.rot ?? 0) + (2 * Math.PI * i) / n;
    const lx = rad * Math.cos(a), lz = rad * Math.sin(a);
    return o.axis === 'z' ? [x + lx, y + lz, z + ly] : o.axis === 'x' ? [x + ly, y + lx, z + lz] : [x + lx, y + ly, z + lz];
  };
  const lo = Array.from({ length: n }, (_, i) => at(r, i, -h / 2));
  const hi = Array.from({ length: n }, (_, i) => at(rt, i, h / 2));
  const raw: Raw[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    raw.push({ v: rt > 0 ? [lo[i], lo[j], hi[j], hi[i]] : [lo[i], lo[j], hi[0]], tone, lit: o.lit });
  }
  if (r > 0) raw.push({ v: lo, tone: o.cap ?? tone, lit: o.lit });
  if (rt > 0) raw.push({ v: hi, tone: o.cap ?? tone, lit: o.lit });
  return solid(raw, o.axis === 'z' ? [x, y, z] : [x, y, z]);
}

/** A gem: two four-sided pyramids base to base. */
export function octa(x: number, y: number, z: number, r: number, h: number, tone: Tone, lit = false): Solid {
  const top: V3 = [x, y + h, z], bot: V3 = [x, y - h, z];
  const ring: V3[] = [[x + r, y, z], [x, y, z + r], [x - r, y, z], [x, y, z - r]];
  const raw: Raw[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    raw.push({ v: [ring[i], ring[j], top], tone, lit }, { v: [ring[j], ring[i], bot], tone, lit });
  }
  return solid(raw, [x, y, z]);
}

/** Flat pieces on a solid's surface (`out` is the way they face), or loose two-sided ones. */
export const withDecals = (s: Solid, decals: Raw[]): Solid => ({ ...s, faces: [...s.faces, ...solid(decals, s.o).faces] });

export const meshOf = (solids: Solid[]): Mesh => ({ solids, count: solids.reduce((n, s) => n + s.faces.length, 0) });

// ─── drawing ────────────────────────────────────────────────────────────────

const PITCH = 0.27;
const CP = Math.cos(PITCH), SP = Math.sin(PITCH);
/** Camera distance, scale and where the model's origin lands in the 200 × 200 box. */
const D = 520, S = 1.13, CX = 100, CY = 103;
const LIGHT: V3 = (() => {
  const l: V3 = [-0.5, 0.72, 0.6];
  const k = Math.hypot(...l);
  return [l[0] / k, l[1] / k, l[2] / k];
})();

export interface Poly {
  p: string;
  f: string;
}

/** Colours for a palette: each tone at a brightness, as a CSS colour (cached). */
export function shader(pal: Record<Tone, string>) {
  const cache = new Map<string, string>();
  return (tone: Tone, i: number): string => {
    const q = Math.round(i * 24);
    const key = `${tone}${q}`;
    let f = cache.get(key);
    if (!f) {
      const v = q / 24;
      f = v <= 1 ? `color-mix(in srgb, ${pal[tone]} ${Math.round(v * 100)}%, #0a1030)` : `color-mix(in srgb, ${pal[tone]} ${Math.round((2 - v) * 100)}%, #fff)`;
      cache.set(key, f);
    }
    return f;
  };
}

/** One picture of the mesh, turned by `yaw` at time `t` (seconds): polygons, back to front. */
export function frame(mesh: Mesh, yaw: number, t: number, shade: (tone: Tone, i: number) => string, pal: Record<Tone, string>): Poly[] {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const out: { z: number; polys: { z: number; layer: number; p: string; f: string }[] }[] = [];
  for (const s of mesh.solids) {
    let ca = 1, sa = 0, lift = 0;
    if (s.orbit) {
      const a = s.orbit.phase + s.orbit.speed * t;
      ca = Math.cos(a);
      sa = Math.sin(a);
      lift = s.orbit.bob * Math.sin(t * 1.7 + s.orbit.phase * 3);
    }
    const tf = (p: V3): V3 => {
      const x0 = p[0] * ca + p[2] * sa, z0 = -p[0] * sa + p[2] * ca, y0 = p[1] + lift;
      const x = x0 * cy + z0 * sy, z1 = -x0 * sy + z0 * cy;
      return [x, y0 * CP - z1 * SP, y0 * SP + z1 * CP];
    };
    const polys: { z: number; layer: number; p: string; f: string }[] = [];
    for (const f of s.faces) {
      const v = f.v.map(tf);
      let n = cross(sub(v[1], v[0]), sub(v[2], v[0]));
      const m = mid(v);
      if (dot(n, [-m[0], -m[1], D - m[2]]) <= 0) {
        if (!f.two) continue;
        n = [-n[0], -n[1], -n[2]];
      }
      const len = Math.hypot(n[0], n[1], n[2]) || 1;
      const i = f.lit ? 1 : 0.46 + 0.7 * Math.max(0, dot(n, LIGHT) / len);
      let p = '';
      for (const q of v) {
        const k = (D / (D - q[2])) * S;
        p += `${(CX + q[0] * k).toFixed(1)},${(CY - q[1] * k).toFixed(1)} `;
      }
      polys.push({ z: m[2], layer: f.layer, p, f: f.lit ? pal[f.tone] : shade(f.tone, i) });
    }
    polys.sort((a, b) => a.layer - b.layer || a.z - b.z);
    out.push({ z: tf(s.o)[2], polys });
  }
  out.sort((a, b) => a.z - b.z);
  return out.flatMap((s) => s.polys);
}

// ─── Vertex: the model ──────────────────────────────────────────────────────

/** The low-poly robot. Front is +z; feet stand at y = −70, the head's top is at y = 54. */
export function vertexMesh(mk: 1 | 2 | 3, happy: boolean): Mesh {
  const out: Solid[] = [];
  const both = (f: (side: 1 | -1) => Solid[]) => out.push(...f(1), ...f(-1));

  // legs
  both((s) => [
    box(s * 12, -66.5, 4, 17, 7, 27, 'k', { tx: 0.86, tz: 0.8 }),
    box(s * 12, -53, 0, 15, 20, 17, 'c', { tx: 0.8, tz: 0.8 }),
    box(s * 12, -36, 0, 11, 14, 12, 'k'),
    box(s * 12, -43.5, 7.5, 9, 7, 4, 'c2'),
  ]);
  out.push(box(0, -24, 0, 36, 11, 21, 'k', { tx: 0.9, tz: 0.9 }));
  out.push(box(0, -23, 10.5, 12, 8, 3, 'c2'));

  // torso: narrow at the waist, broad at the chest, then a sloped collar
  const chest = box(0, -4, 0, 34, 30, 22, 'c', { tx: 1.5, tz: 1.36 });
  out.push(chest, box(0, 14.5, 0, 51, 7, 30, 'c', { tx: 0.62, tz: 0.7, top: 'k' }));
  out.push(prism(0, 0, 14.2, 7.5, 5, 6, 'glow', { axis: 'z', lit: true, rot: Math.PI / 6 }));
  both((s) => [box(s * 15, -9, 13, 9, 3, 2, 'k'), box(s * 15, -14, 12.4, 9, 3, 2, 'k')]);
  out.push(prism(0, 20.5, 0, 5.5, 5, 6, 'k'));

  // head: two tapered blocks, so it reads as a cut gem
  const zf = (y: number) => 14 + 0.105 * (y - 22);
  const P = (x: number, y: number, lift: number): V3 => [x, y, zf(y) + lift];
  const lens = (v: V3[]): Raw => ({ v, tone: 'glow', lit: true, layer: 2, out: [0, 0, 1] });
  // smiling eyes are a chevron: two convex pieces, since a face must be convex to be wound reliably
  const eye = (s: 1 | -1): Raw[] =>
    happy
      ? [lens([P(s * 3.5, 29, 0.7), P(s * 8, 36.5, 0.7), P(s * 8, 33, 0.7), P(s * 5.6, 29, 0.7)]), lens([P(s * 8, 36.5, 0.7), P(s * 12.5, 29, 0.7), P(s * 10.4, 29, 0.7), P(s * 8, 33, 0.7)])]
      : [lens([P(s * 4.5, 28.5, 0.7), P(s * 11.5, 28.5, 0.7), P(s * 11.5, 36, 0.7), P(s * 4.5, 36, 0.7)])];
  out.push(
    withDecals(box(0, 32, 0, 34, 20, 28, 'c2', { tx: 1.2, tz: 1.15 }), [
      { v: [P(-15.5, 25.5, 0.35), P(15.5, 25.5, 0.35), P(17, 39, 0.35), P(-17, 39, 0.35)], tone: 'k', layer: 1, out: [0, 0, 1] },
      ...eye(1),
      ...eye(-1),
    ]),
    box(0, 48, 0, 40.8, 12, 32.2, 'c2', { tx: 0.72, tz: 0.72, top: 'c' }),
  );
  both((s) => [prism(s * 21.5, 34, 0, 6, 4, 6, 'k', { axis: 'x', cap: 'glow' })]);

  // arms
  both((s) => [
    box(s * 33, 7, 0, 15, 14, 17, 'c2', { tx: 0.7, tz: 0.7 }),
    box(s * 35, -8, 0, 9, 17, 10, 'k'),
    box(s * 36.5, -28, 1, 13, 22, 14, 'c', { tx: 0.78, tz: 0.78 }),
    box(s * 36.5, -43, 1, 10, 8, 10, 'k', { tx: 1.1, tz: 1.1 }),
  ]);

  if (mk >= 2) {
    both((s) => [prism(s * 34, 21, 0, 12, 15, 4, 'c', { rt: 0, rot: Math.PI / 4 })]);
    out.push(box(0, 0, -19, 30, 24, 11, 'k', { tx: 0.8, tz: 0.9 }));
    both((s) => [prism(s * 8.5, -14, -20, 6.5, 9, 6, 's', { rt: 3.5 }), prism(s * 8.5, -19.5, -20, 4.5, 3, 6, 'glow', { lit: true })]);
    out.push(box(24, 52, -2, 2, 22, 2, 's'), octa(24, 66, -2, 3.4, 4.6, 'glow', true));
  }
  if (mk >= 3) {
    // wings of loose triangles, a platform, and three gems going round
    const wing = (s: 1 | -1): Solid =>
      solid(
        [
          { v: [[s * 12, 14, -24], [s * 68, 46, -38], [s * 52, 8, -33]], tone: 'c2', two: true },
          { v: [[s * 13, 4, -24], [s * 60, -2, -35], [s * 42, -26, -31]], tone: 'c', two: true },
          { v: [[s * 12, -6, -24], [s * 34, -34, -30], [s * 20, -44, -28]], tone: 'c2', two: true },
        ],
        [s * 40, 8, -32],
      );
    out.push(wing(1), wing(-1));
    const ring = (r: number, y: number): V3[] => Array.from({ length: 8 }, (_, i) => [r * Math.cos((Math.PI * (i + 0.5)) / 4), y, r * Math.sin((Math.PI * (i + 0.5)) / 4)] as V3);
    // the platform is under everything, so it is always drawn first
    out.push({
      ...withDecals(prism(0, -73.5, 0, 46, 5, 8, 'k', { rot: Math.PI / 8, rt: 50 }), [
        { v: ring(44, -70.9), tone: 'glow', lit: true, layer: 1, out: [0, 1, 0] },
        { v: ring(39, -70.8), tone: 'k', layer: 2, out: [0, 1, 0] },
      ]),
      o: [0, -400, 0],
    });
    for (const [i, y] of [26, -8, 44].entries()) out.push({ ...octa(64, y, 0, 4.6, 6.6, i === 1 ? 'c' : 'glow', i !== 1), orbit: { speed: 1.1, phase: (i * 2 * Math.PI) / 3, bob: 3 } });
  }
  return meshOf(out);
}
