/**
 * Disc labels, poster backdrops, the hand-drawn scribble and the torn-paper edge, after the CS
 * revision site. Everything is an SVG string drawn from a seeded generator, so a topic's disc
 * looks the same on every visit.
 */
type Rng = () => number;

export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const n1 = (x: number) => x.toFixed(1);

/** Catmull-Rom through points, as a smooth cubic path. */
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

interface Look {
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  label: string;
  labelInk: string;
}

/** Three tonal families (dark, saturated, pale) around the subject's hue. */
function lookOf(seed: number, hue: number): Look {
  const r = rng(seed);
  const h = Math.round(hue + (r() - 0.5) * 70 + 360) % 360;
  const h2 = (h + 150 + Math.round(r() * 60)) % 360;
  const kind = Math.floor(r() * 3);
  if (kind === 0) return { bg: `hsl(${h} 38% 22%)`, bg2: `hsl(${h} 45% 10%)`, ink: `hsl(${h2} 70% 78%)`, soft: `hsl(${h} 30% 60% / .45)`, label: `hsl(${h2} 60% 86%)`, labelInk: `hsl(${h} 45% 14%)` };
  if (kind === 1) return { bg: `hsl(${h} 72% 46%)`, bg2: `hsl(${h} 78% 30%)`, ink: `hsl(${h} 80% 13%)`, soft: `hsl(${h} 90% 88% / .5)`, label: `hsl(${h} 30% 94%)`, labelInk: `hsl(${h} 70% 18%)` };
  return { bg: `hsl(${h2} 38% 88%)`, bg2: `hsl(${h2} 30% 74%)`, ink: `hsl(${h} 62% 32%)`, soft: `hsl(${h2} 45% 42% / .4)`, label: `hsl(${h} 58% 30%)`, labelInk: `hsl(${h2} 40% 94%)` };
}

type Pattern = (w: number, h: number, r: Rng, c: Look) => string;

const PATTERNS: Pattern[] = [
  // rings spreading from a corner
  (w, h, r, c) => {
    const ox = w * (0.1 + r() * 0.2);
    const oy = h * (0.75 + r() * 0.3);
    let s = '';
    for (let i = 1; i < 26; i++) s += `<circle cx="${n1(ox)}" cy="${n1(oy)}" r="${i * w * 0.045}" fill="none" stroke="${i % 3 ? c.soft : c.ink}" stroke-width="${i % 3 ? 1.2 : 2.6}"/>`;
    return s;
  },
  // a field of waves
  (w, h, r, c) => {
    let s = '';
    for (let k = 0; k < 13; k++) {
      const y = (k + 0.5) * (h / 13);
      const amp = h * (0.012 + r() * 0.03);
      const len = w / (2 + Math.floor(r() * 4));
      const pts: [number, number][] = [];
      for (let x = -len; x <= w + len; x += len / 4) pts.push([x, y + Math.sin((x / len) * Math.PI * 2 + k) * amp]);
      s += `<path d="${smooth(pts)}" fill="none" stroke="${k % 4 === 1 ? c.ink : c.soft}" stroke-width="${k % 4 === 1 ? 3 : 1.4}"/>`;
    }
    return s;
  },
  // diagonal stripes and one bold bar
  (w, h, r, c) => {
    let s = '';
    const gap = w * 0.05;
    for (let i = -h; i < w + h; i += gap) s += `<line x1="${n1(i)}" y1="0" x2="${n1(i - h * 0.8)}" y2="${h}" stroke="${c.soft}" stroke-width="1.4"/>`;
    return `${s}<rect x="${-w * 0.2}" y="${h * (0.3 + r() * 0.4)}" width="${w * 1.4}" height="${h * 0.085}" fill="${c.ink}" transform="rotate(${-6 - r() * 10} ${w / 2} ${h / 2})"/>`;
  },
  // nodes joined to their nearest neighbours
  (w, h, r, c) => {
    const pts = Array.from({ length: Math.round((w * h) / 3600) }, () => [r() * w, r() * h, r()]);
    let s = '';
    pts.forEach((p, i) => {
      pts
        .map((q, j) => [j, (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2])
        .filter((x) => x[0] !== i)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .forEach(([j]) => {
          s += `<line x1="${n1(p[0])}" y1="${n1(p[1])}" x2="${n1(pts[j][0])}" y2="${n1(pts[j][1])}" stroke="${c.soft}" stroke-width="1.2"/>`;
        });
    });
    pts.forEach((p) => {
      s += p[2] > 0.86 ? `<rect x="${n1(p[0] - 5)}" y="${n1(p[1] - 5)}" width="10" height="10" fill="${c.ink}"/>` : `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(1.6 + p[2] * 2.6)}" fill="${c.ink}"/>`;
    });
    return s;
  },
  // a dot grid that swells towards one corner
  (w, h, r, c) => {
    let s = '';
    const step = w * 0.052;
    const fx = r() * w;
    const fy = r() * h;
    for (let y = step / 2; y < h; y += step)
      for (let x = step / 2; x < w; x += step) {
        const d = Math.hypot(x - fx, y - fy) / Math.hypot(w, h);
        s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(step * (0.42 - d * 0.5))}" fill="${d < 0.25 ? c.ink : c.soft}"/>`;
      }
    return s;
  },
  // rays from a point
  (w, h, r, c) => {
    const ox = w * (0.3 + r() * 0.4);
    const oy = h * (0.3 + r() * 0.4);
    let s = '';
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      s += `<line x1="${n1(ox)}" y1="${n1(oy)}" x2="${n1(ox + Math.cos(a) * w * 1.5)}" y2="${n1(oy + Math.sin(a) * w * 1.5)}" stroke="${i % 4 ? c.soft : c.ink}" stroke-width="${i % 4 ? 1.2 : 3}"/>`;
    }
    return s;
  },
  // thick broken arcs
  (w, h, r, c) => {
    let s = '';
    for (let i = 0; i < 14; i++) {
      const rad = w * (0.1 + i * 0.05);
      const a0 = r() * Math.PI * 2;
      const a1 = a0 + 0.8 + r() * 2.6;
      const p = (a: number) => `${n1(w / 2 + Math.cos(a) * rad)},${n1(h / 2 + Math.sin(a) * rad)}`;
      s += `<path d="M${p(a0)} A${n1(rad)},${n1(rad)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}" fill="none" stroke="${i % 3 ? c.soft : c.ink}" stroke-width="${n1(w * (0.008 + r() * 0.022))}" stroke-linecap="round"/>`;
    }
    return s;
  },
  // punched blocks, like a tape of bits
  (w, h, r, c) => {
    let s = '';
    const cell = w * 0.058;
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) if (r() > 0.56) s += `<rect x="${n1(x + 2)}" y="${n1(y + 2)}" width="${n1(cell - 4)}" height="${n1(cell - 4)}" fill="${r() > 0.8 ? c.ink : c.soft}"/>`;
    return s;
  },
];

const ENT: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ENT[ch] ?? ch);

/** The printed face of a disc: pattern, the title running round the edge, a label ring at the hub. */
export function discFace(key: string, hue: number, title: string, ref: string): string {
  const seed = hashOf(key);
  const c = lookOf(seed, hue);
  const r = rng(seed ^ 0x9e3779b9);
  const pattern = PATTERNS[seed % PATTERNS.length](400, 400, r, c);
  const id = `nt${seed.toString(36)}`;
  const text = `${title.toUpperCase()} · ${ref.toUpperCase()} · `;
  const ring = text.repeat(Math.max(1, Math.round(118 / text.length)));
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}g" cx="42%" cy="36%" r="75%"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.bg2}"/></radialGradient><path id="${id}p" d="M200,200 m-176,0 a176,176 0 1,1 352,0 a176,176 0 1,1 -352,0"/></defs><rect width="400" height="400" fill="url(#${id}g)"/>${pattern}<circle cx="200" cy="200" r="100" fill="${c.label}"/><circle cx="200" cy="200" r="100" fill="none" stroke="${c.labelInk}" stroke-width="1" opacity=".5"/><text font-family="Geist, Helvetica, Arial, sans-serif" font-size="10.5" font-weight="600" letter-spacing="2.4" fill="${c.ink}"><textPath href="#${id}p" textLength="1098">${esc(ring)}</textPath></text><text x="200" y="122" text-anchor="middle" font-family="Geist Mono, Consolas, monospace" font-size="10" letter-spacing="1.5" fill="${c.labelInk}">${esc(ref.toUpperCase())}</text><text x="200" y="286" text-anchor="middle" font-family="Geist Mono, Consolas, monospace" font-size="8" letter-spacing="2" fill="${c.labelInk}" opacity=".75">STUDY EDITION</text></svg>`;
}

/** A wide backdrop in the same colours as the topic's disc. */
export function posterArt(key: string, hue: number): string {
  const seed = hashOf(key);
  const c = lookOf(seed, hue);
  const r = rng(seed ^ 0x51ed270b);
  const w = 1600;
  const h = 800;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="${w}" height="${h}" fill="${c.bg2}"/><g opacity=".8">${PATTERNS[seed % PATTERNS.length](w, h, r, c)}</g><rect width="${w}" height="${h}" fill="#0b0b0a" opacity=".42"/></svg>`;
}

/** The pen outline drawn round the active disc. */
export function scribble(seed: number): string {
  const r = rng(seed || 7);
  const pts: [number, number][] = [];
  const start = -2.4 + r() * 0.6;
  for (let i = 0; i <= 46; i++) {
    const t = i / 46;
    const a = start + t * 1.78 * Math.PI * 2;
    const rx = 46 + Math.sin(t * 9 + r()) * 1.6 + (t > 0.55 ? 2.2 : 0) + (r() - 0.5) * 1.2;
    const ry = 44.5 + Math.cos(t * 7) * 1.8 + (t > 0.55 ? 1.6 : 0) + (r() - 0.5) * 1.2;
    pts.push([50 + Math.cos(a) * rx + (t - 0.5) * 2.4, 50 + Math.sin(a) * ry + (t - 0.5) * -1.4]);
  }
  return `<svg class="nt-scribble" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1000" vector-effect="non-scaling-stroke" d="${smooth(pts)}"/></svg>`;
}

/** The torn edge of the paper above a poster. */
export function tear(seed: number): string {
  const r = rng(seed || 3);
  const W = 1600;
  let d = '';
  let first = 0;
  for (let x = W; x >= 0; x -= 16) {
    const hill = 128 - 100 * Math.exp(-(((x - W * (0.48 + (r() - 0.5) * 0.02)) / 380) ** 2)) - 26 * Math.exp(-(((x - 300) / 150) ** 2)) - 30 * Math.exp(-(((x - 1250) / 170) ** 2));
    const y = Math.max(4, hill + (r() - 0.5) * 12 + Math.sin(x / 37) * 4);
    if (x === W) first = y;
    d += ` L${x},${n1(y)}`;
  }
  return `<svg viewBox="0 0 ${W} 150" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 L${W},0 L${W},${n1(first)}${d} Z" fill="currentColor"/></svg>`;
}

/** The whole disc: face, sheen, glare, rim, hub, and optionally the scribble. */
export function discHtml(face: string, scribbleSeed?: number): string {
  return `<div class="nt-tilt"><div class="nt-mouse"><div class="nt-disc"><div class="nt-face"><div class="nt-art">${face}</div></div><div class="nt-sheen"></div><div class="nt-glare"></div><div class="nt-rim"></div><div class="nt-hub"></div></div>${scribbleSeed != null ? scribble(scribbleSeed) : ''}</div></div>`;
}
