/**
 * The Cosmos' sky, drawn on a canvas: a field of stars and drifting nebulae, the core you tap (a
 * cloud of dust until it's first lit, then a star whose colour follows how much it has gathered),
 * every kind of body you own on its own tilted orbit, and, as the layers are reached, a black hole
 * with its disc, a spiral galaxy behind everything, rings of light, and at the very end, gold.
 */

export interface SkyView {
  /** 0 dust, 1 lit, 2 collapsed, 3 banged, 4 transcended, 5 enlightened. */
  era: number;
  /** log10 of the dust gathered this run. */
  heat: number;
  /** How many of each body, in the order they're sold. */
  bodies: number[];
  /** A challenge is being run: the sky dims. */
  dim: boolean;
}

interface Mote {
  a: number;
  r: number;
  v: number;
  born: number;
  hue: number;
}
interface Ring {
  born: number;
  layer: number;
}

const TAU = Math.PI * 2;

/** A small fixed random sequence, so the stars are in the same places every time. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const r = rng(77);
  return Array.from({ length: 170 }, () => ({ x: r(), y: r(), z: 0.25 + r() * 0.75, ph: r() * TAU, warm: r() }));
})();
const CLOUDS = (() => {
  const r = rng(1203);
  return Array.from({ length: 7 }, (_, i) => ({ x: r(), y: r(), s: 0.35 + r() * 0.4, ph: r() * TAU, k: i % 3 }));
})();
const ARMS = (() => {
  const r = rng(404);
  return Array.from({ length: 420 }, (_, i) => {
    const arm = i % 3;
    const d = Math.sqrt(r());
    return { arm, d, off: (r() - 0.5) * 0.5 * (1.2 - d), size: 0.4 + r() * 1.1, b: 0.3 + r() * 0.7 };
  });
})();

/** Sky colours by era: top, bottom, and three nebula tints. */
const PALETTE: { top: string; bot: string; neb: [string, string, string] }[] = [
  { top: '#0b0d1f', bot: '#1a1426', neb: ['120,110,160', '90,80,120', '150,120,110'] },
  { top: '#070b22', bot: '#1b1030', neb: ['255,150,70', '90,120,255', '255,90,140'] },
  { top: '#06040f', bot: '#170a2b', neb: ['150,70,255', '60,40,160', '255,70,170'] },
  { top: '#03101c', bot: '#160a2e', neb: ['40,210,230', '255,80,200', '110,90,255'] },
  { top: '#0d0a24', bot: '#231244', neb: ['200,170,255', '120,220,255', '255,190,240'] },
  { top: '#1a1103', bot: '#33200a', neb: ['255,200,90', '255,150,60', '255,235,170'] },
];

/** A star's colour from how hot it runs: ember, orange, yellow, white, blue. */
function starHue(heat: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [255, 120, 60]],
    [12, [255, 170, 70]],
    [25, [255, 225, 130]],
    [45, [255, 250, 235]],
    [80, [190, 220, 255]],
    [140, [140, 180, 255]],
    [220, [200, 150, 255]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (heat <= stops[i][0]) {
      const [h0, c0] = stops[i - 1];
      const [h1, c1] = stops[i];
      const k = (heat - h0) / (h1 - h0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return stops[stops.length - 1][1];
}
const rgb = (c: [number, number, number], a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// ─── the ten bodies ─────────────────────────────────────────────────────────

type Draw = (ctx: CanvasRenderingContext2D, s: number, t: number, toStar: number) => void;

function shadedDisc(ctx: CanvasRenderingContext2D, r: number, light: string, mid: string, dark: string, toStar: number) {
  const lx = Math.cos(toStar) * r * 0.45;
  const ly = Math.sin(toStar) * r * 0.45;
  const g = ctx.createRadialGradient(lx, ly, r * 0.1, 0, 0, r);
  g.addColorStop(0, light);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
}

const BODY_ART: Draw[] = [
  // Mote Net: a kite of silk with threads.
  (ctx, s, t) => {
    ctx.rotate(Math.sin(t * 0.7) * 0.3);
    ctx.fillStyle = 'rgba(190,220,255,0.28)';
    ctx.strokeStyle = 'rgba(220,235,255,0.9)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.moveTo(-s * 0.8, 0);
    ctx.lineTo(s * 0.8, 0);
    ctx.moveTo(-s * 0.4, -s * 0.5);
    ctx.lineTo(s * 0.4, s * 0.5);
    ctx.moveTo(s * 0.4, -s * 0.5);
    ctx.lineTo(-s * 0.4, s * 0.5);
    ctx.stroke();
  },
  // Comet Catcher: an icy head, a tail blown away from the star.
  (ctx, s, _t, toStar) => {
    ctx.save();
    ctx.rotate(toStar + Math.PI);
    const g = ctx.createLinearGradient(0, 0, s * 4.5, 0);
    g.addColorStop(0, 'rgba(170,235,255,0.75)');
    g.addColorStop(1, 'rgba(170,235,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.quadraticCurveTo(s * 2.4, -s * 0.2, s * 4.5, 0);
    ctx.quadraticCurveTo(s * 2.4, s * 0.2, 0, s * 0.55);
    ctx.fill();
    ctx.restore();
    glow(ctx, 0, 0, s * 1.3, 'rgba(210,245,255,0.9)', 'rgba(210,245,255,0)');
    ctx.fillStyle = '#f2fbff';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, TAU);
    ctx.fill();
  },
  // Asteroid Mill: three tumbling rocks.
  (ctx, s, t) => {
    const rocks: [number, number, number][] = [
      [-0.6, 0.15, 0.62],
      [0.55, -0.35, 0.5],
      [0.3, 0.6, 0.36],
    ];
    rocks.forEach(([x, y, k], i) => {
      ctx.save();
      ctx.translate(x * s, y * s);
      ctx.rotate(t * (0.6 + i * 0.3));
      ctx.fillStyle = i === 1 ? '#8d7f73' : '#a39384';
      ctx.beginPath();
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * TAU;
        const r = s * k * (0.75 + ((j * 37 + i * 11) % 10) / 28);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(40,30,25,0.45)';
      ctx.beginPath();
      ctx.arc(s * k * 0.2, s * k * 0.1, s * k * 0.22, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  },
  // Moon Quarry: a cratered moon.
  (ctx, s, _t, toStar) => {
    shadedDisc(ctx, s, '#f4f1e6', '#b9b5a8', '#4b4a52', toStar);
    ctx.fillStyle = 'rgba(60,58,70,0.4)';
    for (const [x, y, r] of [[-0.3, -0.25, 0.24], [0.35, 0.1, 0.18], [-0.05, 0.45, 0.14], [0.2, -0.5, 0.1]]) {
      ctx.beginPath();
      ctx.arc(x * s, y * s, r * s, 0, TAU);
      ctx.fill();
    }
  },
  // Ringworks: a planet and its rings.
  (ctx, s, _t, toStar) => {
    ctx.save();
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(240,215,170,0.55)';
    ctx.lineWidth = s * 0.28;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.9, s * 0.55, 0, Math.PI, TAU);
    ctx.stroke();
    ctx.restore();
    shadedDisc(ctx, s, '#ffe9b8', '#d9a35a', '#5a3a1e', toStar);
    ctx.save();
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(250,230,190,0.85)';
    ctx.lineWidth = s * 0.28;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.9, s * 0.55, 0, 0, Math.PI);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,90,60,0.6)';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.9, s * 0.55, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  },
  // Storm Siphon: a banded giant with a storm.
  (ctx, s, t, toStar) => {
    shadedDisc(ctx, s, '#ffd9b0', '#d98a5c', '#4a2118', toStar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, TAU);
    ctx.clip();
    ctx.globalAlpha = 0.4;
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = i % 2 ? '#8a3f2a' : '#ffe6c8';
      ctx.fillRect(-s, i * s * 0.28 - s * 0.07 + Math.sin(t * 0.5 + i) * s * 0.02, s * 2, s * 0.13);
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#b3371f';
    ctx.beginPath();
    ctx.ellipse(s * 0.3, s * 0.3, s * 0.28, s * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
  // Dyson Petal: a flower of mirrors.
  (ctx, s, t) => {
    ctx.rotate(t * 0.4);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(TAU / 6);
      const g = ctx.createLinearGradient(0, 0, 0, -s * 1.3);
      g.addColorStop(0, 'rgba(255,170,220,0.9)');
      g.addColorStop(1, 'rgba(255,240,250,0.9)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.5, -s * 0.7, 0, -s * 1.3);
      ctx.quadraticCurveTo(-s * 0.5, -s * 0.7, 0, 0);
      ctx.fill();
    }
    glow(ctx, 0, 0, s * 0.5, 'rgba(255,255,255,1)', 'rgba(255,220,120,0)');
  },
  // Pulsar Loom: a hard white point with two sweeping beams.
  (ctx, s, t) => {
    ctx.save();
    ctx.rotate(t * 5);
    const g = ctx.createLinearGradient(-s * 3.2, 0, s * 3.2, 0);
    g.addColorStop(0, 'rgba(120,255,230,0)');
    g.addColorStop(0.5, 'rgba(200,255,245,0.95)');
    g.addColorStop(1, 'rgba(120,255,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s * 3.2, -s * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 3.2, s * 0.3);
    ctx.moveTo(s * 3.2, -s * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 3.2, s * 0.3);
    ctx.fill();
    ctx.restore();
    glow(ctx, 0, 0, s * 1.1, 'rgba(255,255,255,1)', 'rgba(120,255,230,0)');
  },
  // Quasar Wheel: a spinning disc with a jet through it.
  (ctx, s, t) => {
    const jet = ctx.createLinearGradient(0, -s * 3, 0, s * 3);
    jet.addColorStop(0, 'rgba(150,170,255,0)');
    jet.addColorStop(0.5, 'rgba(230,235,255,0.95)');
    jet.addColorStop(1, 'rgba(150,170,255,0)');
    ctx.fillStyle = jet;
    ctx.fillRect(-s * 0.16, -s * 3, s * 0.32, s * 6);
    ctx.save();
    ctx.scale(1, 0.4);
    ctx.rotate(t * 2);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(TAU / 8);
      ctx.strokeStyle = i % 2 ? 'rgba(255,190,120,0.9)' : 'rgba(255,240,200,0.9)';
      ctx.lineWidth = s * 0.22;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.3, 0, 0.6);
      ctx.stroke();
    }
    ctx.restore();
    glow(ctx, 0, 0, s * 0.7, 'rgba(255,255,255,1)', 'rgba(255,200,120,0)');
  },
  // World Tree: a crown of light on a trunk.
  (ctx, s, t) => {
    ctx.strokeStyle = '#c9a56a';
    ctx.lineWidth = s * 0.26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 1.2);
    ctx.lineTo(0, -s * 0.1);
    ctx.moveTo(0, s * 0.4);
    ctx.lineTo(-s * 0.6, -s * 0.2);
    ctx.moveTo(0, s * 0.2);
    ctx.lineTo(s * 0.6, -s * 0.3);
    ctx.stroke();
    for (const [x, y, r] of [[0, -0.7, 0.8], [-0.7, -0.4, 0.55], [0.7, -0.45, 0.55]]) {
      glow(ctx, x * s, y * s, r * s * (1 + Math.sin(t * 1.5 + x) * 0.06), 'rgba(170,255,170,0.95)', 'rgba(60,200,120,0)');
    }
    ctx.fillStyle = 'rgba(255,255,220,0.9)';
    for (let i = 0; i < 5; i++) {
      const a = t * 0.6 + i * 1.3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.9, -s * 0.6 + Math.sin(a * 1.3) * s * 0.5, s * 0.09, 0, TAU);
      ctx.fill();
    }
  },
];

/** One body by itself, centred at the origin (for the list beside the sky). */
export function drawBody(ctx: CanvasRenderingContext2D, i: number, size: number, t: number) {
  BODY_ART[i]?.(ctx, size, t, -2.3);
}

// ─── the sky ────────────────────────────────────────────────────────────────

export interface Sky {
  draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, v: SkyView): void;
  /** Dust flies in to the core. */
  tap(bright: boolean): void;
  /** A shockwave, coloured by the layer just done. */
  burst(layer: number): void;
}

const BURST = ['255,220,140', '255,200,90', '170,90,255', '90,230,255', '255,255,255'];

export function createSky(): Sky {
  let motes: Mote[] = [];
  let rings: Ring[] = [];
  let now = 0;
  let kick = 0;

  function background(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, v: SkyView) {
    const p = PALETTE[Math.min(v.era, PALETTE.length - 1)];
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, p.top);
    bg.addColorStop(1, p.bot);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    for (const c of CLOUDS) {
      const x = (c.x + Math.sin(t * 0.03 + c.ph) * 0.05) * w;
      const y = (c.y + Math.cos(t * 0.025 + c.ph) * 0.06) * h;
      const r = c.s * Math.max(w, h) * 0.6;
      const a = (v.era === 0 ? 0.07 : 0.11) * (v.dim ? 0.4 : 1) * (0.8 + Math.sin(t * 0.2 + c.ph) * 0.2);
      glow(ctx, x, y, r, `rgba(${p.neb[c.k]},${a})`, `rgba(${p.neb[c.k]},0)`);
    }

    // A spiral galaxy far behind, once there are galaxies.
    if (v.era >= 3) {
      const gx = w * 0.5;
      const gy = h * 0.5;
      const R = Math.min(w, h) * 0.78;
      for (const s of ARMS) {
        const a = s.arm * (TAU / 3) + s.d * 4.2 + s.off + t * 0.02;
        const x = gx + Math.cos(a) * s.d * R;
        const y = gy + Math.sin(a) * s.d * R * 0.42;
        ctx.fillStyle = `rgba(${p.neb[s.arm]},${0.28 * s.b * (1.1 - s.d)})`;
        ctx.fillRect(x, y, s.size, s.size);
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    for (const s of STARS) {
      const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + s.z) + s.ph);
      const x = ((s.x * w + t * s.z * 1.2) % (w + 4)) - 2;
      const size = s.z * 1.5;
      ctx.fillStyle = s.warm > 0.8 ? `rgba(255,220,180,${tw * s.z})` : s.warm < 0.15 ? `rgba(170,200,255,${tw * s.z})` : `rgba(255,255,255,${tw * s.z * 0.9})`;
      ctx.fillRect(x, s.y * h, size, size);
      if (s.z > 0.93) {
        ctx.fillStyle = `rgba(255,255,255,${tw * 0.35})`;
        ctx.fillRect(x - 2.5, s.y * h + size / 2 - 0.3, 5 + size, 0.6);
        ctx.fillRect(x + size / 2 - 0.3, s.y * h - 2.5, 0.6, 5 + size);
      }
    }
  }

  /** The black hole that the first Collapse leaves, up and to the right. */
  function blackHole(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
    const x = w * 0.84;
    const y = h * 0.2;
    const r = Math.min(w, h) * 0.055;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.4);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const g = ctx.createLinearGradient(-r * 3.2, 0, r * 3.2, 0);
      g.addColorStop(0, 'rgba(255,120,60,0)');
      g.addColorStop(0.3 + 0.1 * Math.sin(t + i), 'rgba(255,190,110,0.5)');
      g.addColorStop(0.7, 'rgba(200,120,255,0.45)');
      g.addColorStop(1, 'rgba(120,80,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = r * (0.5 - i * 0.13);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * (2.6 - i * 0.35), r * (0.75 - i * 0.1), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,190,0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.06, 0, TAU);
    ctx.stroke();
    // The near side of the disc crosses in front.
    const g = ctx.createLinearGradient(-r * 2.6, 0, r * 2.6, 0);
    g.addColorStop(0, 'rgba(255,150,80,0)');
    g.addColorStop(0.5, 'rgba(255,220,170,0.8)');
    g.addColorStop(1, 'rgba(190,120,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.4, r * 0.62, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.restore();
  }

  function core(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, R: number, v: SkyView) {
    const beat = 1 + Math.sin(t * 2.2) * 0.03 + kick * 0.12;
    if (v.era === 0) {
      // Not lit yet: a slow whirl of dust around a faint ember that warms as dust is gathered.
      const warm = Math.min(1, v.heat / 9);
      glow(ctx, cx, cy, R * (1.5 + warm) * beat, `rgba(255,${150 + warm * 60},${90 + warm * 40},${0.12 + warm * 0.4})`, 'rgba(255,150,90,0)');
      const r = rng(9);
      for (let i = 0; i < 90; i++) {
        const d = 0.25 + r() * 1.25;
        const a = r() * TAU + t * (0.5 / d) * (0.6 + warm);
        const x = cx + Math.cos(a) * d * R;
        const y = cy + Math.sin(a) * d * R * 0.55;
        ctx.fillStyle = `rgba(${200 + r() * 55},${170 + r() * 50},${150 + r() * 60},${0.25 + r() * 0.5})`;
        const sz = 0.6 + r() * 1.6;
        ctx.fillRect(x, y, sz, sz);
      }
      glow(ctx, cx, cy, R * 0.34 * beat, `rgba(255,235,200,${0.35 + warm * 0.6})`, 'rgba(255,170,90,0)');
      return;
    }
    const gold = v.era >= 5;
    const c: [number, number, number] = gold ? [255, 215, 110] : starHue(v.heat);
    const size = R * (0.55 + Math.min(0.45, v.heat / 400)) * beat;
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, size * 4.2, rgb(c, 0.2), rgb(c, 0));
    // Corona: long thin rays that turn slowly, and short ones that flicker.
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + t * 0.08;
      const len = size * (2.1 + Math.sin(t * 1.3 + i * 2.1) * 0.5 + (i % 2) * 0.7);
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, rgb(c, 0.5));
      g.addColorStop(1, rgb(c, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = size * (i % 2 ? 0.1 : 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    const body = ctx.createRadialGradient(cx - size * 0.25, cy - size * 0.25, size * 0.05, cx, cy, size);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.45, rgb(c));
    body.addColorStop(1, rgb([c[0] * 0.75, c[1] * 0.55, c[2] * 0.5]));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, TAU);
    ctx.fill();
    // Granulation: bright cells drifting across the face.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + t * 0.25;
      const d = size * (0.2 + ((i * 53) % 60) / 100);
      glow(ctx, cx + Math.cos(a) * d, cy + Math.sin(a * 1.2) * d, size * 0.3, 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)');
    }
    ctx.restore();
    ctx.strokeStyle = rgb(c, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, size + 1.5, 0, TAU);
    ctx.stroke();
    // Past the top: rings of light, turning against each other.
    if (v.era >= 4) {
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < 3; i++) {
        ctx.rotate(t * (i % 2 ? -0.12 : 0.1));
        ctx.strokeStyle = gold ? `rgba(255,225,140,${0.5 - i * 0.12})` : `rgba(220,200,255,${0.45 - i * 0.1})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2 + i * 3, 5 + i * 2]);
        ctx.beginPath();
        ctx.arc(0, 0, size * (1.5 + i * 0.42), 0, TAU);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function orbits(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, w: number, h: number, v: SkyView, front: boolean) {
    const kinds = v.bodies.map((n, i) => ({ n, i })).filter((b) => b.n > 0);
    if (!kinds.length) return;
    const rx0 = Math.min(w * 0.17, h * 0.3);
    const rx1 = Math.min(w * 0.47, h * 1.05);
    kinds.forEach((b, k) => {
      const f = kinds.length === 1 ? 0.3 : k / (kinds.length - 1);
      const rx = rx0 + (rx1 - rx0) * f;
      const ry = rx * 0.34;
      const tilt = -0.18 + (b.i % 3) * 0.09;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.strokeStyle = `rgba(255,255,255,${front ? 0.2 : 0.09})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.stroke();
      const count = Math.min(4, 1 + Math.floor(Math.log2(b.n + 1) / 2.5));
      const size = Math.max(3.2, Math.min(w, h) * (0.02 + b.i * 0.0022));
      for (let j = 0; j < count; j++) {
        const a = t * (0.5 / (0.6 + f * 1.6)) * (b.i % 2 ? -1 : 1) + (j / count) * TAU + b.i * 1.7;
        const y = Math.sin(a) * ry;
        if (y >= 0 !== front) continue;
        const x = Math.cos(a) * rx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-tilt);
        const depth = 0.8 + (y / ry) * 0.2;
        BODY_ART[b.i]?.(ctx, size * depth, t + j, Math.atan2(-y, -x));
        ctx.restore();
      }
      ctx.restore();
    });
  }

  return {
    tap(bright) {
      kick = 1;
      const n = bright ? 14 : 6;
      for (let i = 0; i < n && motes.length < 120; i++) motes.push({ a: Math.random() * TAU, r: 1.6 + Math.random() * 1.2, v: 0.8 + Math.random() * 0.8, born: now, hue: bright ? 50 : 25 + Math.random() * 25 });
    },
    burst(layer) {
      rings.push({ born: now, layer });
      kick = 2;
    },
    draw(ctx, t, w, h, v) {
      now = t;
      kick = Math.max(0, kick - 0.06);
      const cx = w / 2;
      const cy = h * 0.52;
      const R = Math.min(w, h) * 0.13;
      background(ctx, t, w, h, v);
      if (v.era >= 2) blackHole(ctx, t, w, h);
      if (v.dim) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, w, h);
      }
      orbits(ctx, t, cx, cy, w, h, v, false);
      core(ctx, t, cx, cy, R, v);
      orbits(ctx, t, cx, cy, w, h, v, true);

      // Dust flying in from a tap.
      ctx.globalCompositeOperation = 'lighter';
      motes = motes.filter((m) => {
        const age = (t - m.born) * m.v;
        if (age >= 1) return false;
        const d = m.r * (1 - age) ** 1.6 * R * 1.6;
        const a = m.a + age * 3.2;
        ctx.fillStyle = `hsla(${m.hue},100%,${70 + age * 20}%,${Math.min(1, age * 4) * (1 - age * 0.3)})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 1.6 * (1 - age * 0.5), 0, TAU);
        ctx.fill();
        return true;
      });
      // Shockwaves.
      rings = rings.filter((r) => {
        const age = (t - r.born) / 1.4;
        if (age >= 1) return false;
        const col = BURST[r.layer] ?? BURST[0];
        const rad = Math.max(w, h) * 0.9 * age ** 0.6;
        ctx.strokeStyle = `rgba(${col},${(1 - age) * 0.9})`;
        ctx.lineWidth = 2 + (1 - age) * 14;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad, rad * 0.6, 0, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(${col},${Math.max(0, 0.55 - age * 1.6)})`;
        ctx.fillRect(0, 0, w, h);
        return true;
      });
      ctx.globalCompositeOperation = 'source-over';

      // A soft vignette keeps the numbers readable.
      const vg = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    },
  };
}
