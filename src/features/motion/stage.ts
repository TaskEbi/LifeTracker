/**
 * What every Motion scene shares: the contract with the page, the palette, and a few drawing helpers.
 * A scene owns its three.js objects and frees them in dispose(); the page owns the renderer and the loop.
 */
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, Vector3, type PerspectiveCamera, type WebGLRenderer } from 'three';
import type { SectionId } from '../../data/types';
import type { MotionData } from '../../domain/motion/model';

/** The words beside the scene. A scene sends a new one only when what it shows changes. */
export interface Hud {
  kicker: string;
  title: string;
  value: string;
  sub: string;
  color: string;
  /** Set when the thing in focus is a section, so the page can offer to open it. */
  section?: SectionId;
}

export interface StageCtx {
  renderer: WebGLRenderer;
  data: MotionData;
  /** Pointer in normalised device coordinates (−1…1, y up); `inside` is false until it has moved over the stage. */
  pointer: { x: number; y: number; inside: boolean };
  /** The device asks for less motion: no auto-play, slower drift. */
  reduced: boolean;
  /** A layer over the canvas for labels a scene positions itself. */
  overlay: HTMLElement;
  hud(h: Hud): void;
}

export interface StageScene {
  /** Fraction of the device's pixels to draw at (heavy shaders ask for fewer). */
  pixelScale?: number;
  resize(w: number, h: number, dpr: number): void;
  frame(t: number, dt: number): void;
  tap?(x: number, y: number): void;
  drag?(dx: number, dy: number): void;
  dragEnd?(): void;
  dispose(): void;
}

export type SceneId = 'core' | 'deck' | 'year' | 'fusion' | 'orbit' | 'ridges' | 'prism' | 'galaxy' | 'tunnel';
export const SCENES: { id: SceneId; kanji: string; name: string; hint: string }[] = [
  { id: 'core', kanji: '核', name: 'Core', hint: 'Tap to change · move to stir' },
  { id: 'deck', kanji: '札', name: 'Deck', hint: 'Drag to spin · tap a card to flip it' },
  { id: 'year', kanji: '年', name: 'Year', hint: 'Drag along the year · tap a day' },
  { id: 'fusion', kanji: '融', name: 'Fusion', hint: 'Drag to turn · tap a drop' },
  { id: 'orbit', kanji: '軌', name: 'Orbit', hint: 'Drag to turn · tap a planet' },
  { id: 'ridges', kanji: '峰', name: 'Ridges', hint: 'Drag to turn · tap a ridge' },
  { id: 'prism', kanji: '晶', name: 'Prism', hint: 'Drag to roll · tap a face' },
  { id: 'galaxy', kanji: '星', name: 'Galaxy', hint: 'Drag to turn · tap a day' },
  { id: 'tunnel', kanji: '門', name: 'Tunnel', hint: 'Move to steer · tap to boost' },
];

/** The stage is always dark, so sections use their bright colours whatever the app's theme is. */
export const SECTION_HEX: Record<SectionId, string> = {
  violin: '#ff9b45',
  coding: '#7095ff',
  sports: '#3dd196',
  gym: '#ff6b60',
  study: '#aa8dff',
  chess: '#c9d2dc',
  sleep: '#8290ff',
  screen: '#ff7ab8',
  cabinet: '#e0bc72',
  future: '#ffb000',
  reading: '#56c2e6',
  maths: '#ff5a7a',
};
export const GOLD = '#ffd27a';

/** '#rrggbb' → 0–1 components as written (sRGB), for shaders that draw straight to the screen. */
export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const vec = (hex: string) => new Vector3(...rgb(hex));

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
/** Frame-rate independent approach: `rate` is how much of the gap closes per second, roughly. */
export const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const FONT_KANJI = '"Shippori Mincho", "Zen Kaku Gothic New", serif';
export const FONT_GOTHIC = '"Zen Kaku Gothic New", sans-serif';
export const FONT_DISPLAY = '"Dela Gothic One", "Zen Kaku Gothic New", sans-serif';
export const FONT_MONO = '"M PLUS 1 Code", ui-monospace, monospace';

let fontsAsked = false;
/** The page's own faces, and every glyph the canvases will draw (CJK fonts arrive in pieces). */
export async function loadStageFonts(kanji: string): Promise<void> {
  if (!fontsAsked) {
    fontsAsked = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@800&family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(link);
    await new Promise<void>((done) => {
      link.onload = () => done();
      link.onerror = () => done();
      setTimeout(done, 1500);
    });
  }
  const wants = [
    document.fonts.load(`800 80px "Shippori Mincho"`, kanji),
    document.fonts.load(`900 80px "Zen Kaku Gothic New"`, kanji),
    document.fonts.load(`80px "Dela Gothic One"`, '0123456789LV'),
    document.fonts.load(`500 20px "M PLUS 1 Code"`, 'CH0123456789'),
    document.fonts.load(`italic 40px "Instrument Serif"`, 'Motion'),
  ];
  // Offline, or a slow network: draw with what there is rather than wait.
  await Promise.race([Promise.allSettled(wants), new Promise((r) => setTimeout(r, 2500))]);
}

export function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

export function textureOf(canvas: HTMLCanvasElement, renderer: WebGLRenderer): CanvasTexture {
  const t = new CanvasTexture(canvas);
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

const tmp = new Vector3();
/** Where a world point lands on screen, in NDC; z > 1 means behind the camera. */
export function project(camera: PerspectiveCamera, x: number, y: number, z: number): { x: number; y: number; z: number } {
  tmp.set(x, y, z).project(camera);
  return { x: tmp.x, y: tmp.y, z: tmp.z };
}

/** Simplex noise (Ashima / Ian McEwan, MIT), shared by the shaders that need it. */
export const GLSL_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** A glyph in white on a clear square, for sprites and planes that tint it. */
export function glyphCanvas(text: string, size = 256, font = FONT_GOTHIC, weight = '900'): HTMLCanvasElement {
  const [c, g] = canvas2d(size, size);
  g.font = `${weight} ${size * 0.74}px ${font}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.fillText(text, size / 2, size * 0.54);
  return c;
}

/** Labels over the canvas that a scene moves each frame (kanji pinned to things in its world). */
export function makeLabels(overlay: HTMLElement, items: { text: string; sub?: string; color?: string }[]) {
  const els = items.map((it) => {
    const el = document.createElement('span');
    el.className = 'mo-label';
    el.textContent = it.text;
    if (it.color) el.style.color = it.color;
    if (it.sub) {
      const sm = document.createElement('small');
      sm.textContent = it.sub;
      el.appendChild(sm);
    }
    el.style.opacity = '0';
    overlay.appendChild(el);
    return el;
  });
  return {
    /** x and y in CSS pixels from the stage's top left. */
    place(i: number, x: number, y: number, scale = 1, opacity = 1) {
      const st = els[i].style;
      st.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      st.opacity = opacity.toFixed(2);
    },
    dispose() {
      for (const el of els) el.remove();
    },
  };
}
