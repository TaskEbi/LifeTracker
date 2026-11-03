/**
 * Soundscapes for focus mode, generated on the device, so nothing has to be downloaded. Brown noise
 * for masking, rain, a fire, and a slow tick. The choice is kept per device. Browsers only let sound
 * start from a tap, so after a reload it stays off until you choose it again.
 */
export const SOUNDS = [
  { id: 'off', label: 'Silence' },
  { id: 'brown', label: 'Brown noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'fire', label: 'Fire' },
  { id: 'tick', label: 'Clock' },
] as const;
export type SoundId = (typeof SOUNDS)[number]['id'];

const KEY = 'lifetracker-focus-sound';
export function savedSound(): SoundId {
  try {
    const v = localStorage.getItem(KEY);
    return SOUNDS.some((s) => s.id === v) ? (v as SoundId) : 'off';
  } catch {
    return 'off';
  }
}

let ctx: AudioContext | null = null;
let stopCurrent: (() => void) | null = null;
let playing: SoundId = 'off';

export const currentSound = () => playing;

function noiseBuffer(c: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const b = c.createBuffer(2, c.sampleRate * seconds, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
  }
  return b;
}

function loop(c: AudioContext, buffer: AudioBuffer, into: AudioNode) {
  const s = c.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  s.connect(into);
  s.start();
  return s;
}

function build(id: Exclude<SoundId, 'off'>, c: AudioContext, out: GainNode): () => void {
  const stops: (() => void)[] = [];
  if (id === 'brown') {
    const s = loop(c, noiseBuffer(c, 6, true), out);
    stops.push(() => s.stop());
  } else if (id === 'rain') {
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = c.createGain();
    g.gain.value = 0.28;
    hp.connect(lp).connect(g).connect(out);
    const s = loop(c, noiseBuffer(c, 5, false), hp);
    const low = c.createGain();
    low.gain.value = 0.6;
    low.connect(out);
    const s2 = loop(c, noiseBuffer(c, 6, true), low);
    stops.push(() => s.stop(), () => s2.stop());
  } else if (id === 'fire') {
    const low = c.createGain();
    low.gain.value = 0.9;
    low.connect(out);
    const s = loop(c, noiseBuffer(c, 7, true), low);
    stops.push(() => s.stop());
    // Crackles: short bursts of filtered noise at random moments.
    const burst = noiseBuffer(c, 1, false);
    let alive = true;
    const crackle = () => {
      if (!alive) return;
      const src = c.createBufferSource();
      src.buffer = burst;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200 + Math.random() * 3800;
      const g = c.createGain();
      const t = c.currentTime;
      g.gain.setValueAtTime(0.06 + Math.random() * 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + Math.random() * 0.05);
      src.connect(bp).connect(g).connect(out);
      src.start(t, Math.random() * 0.9, 0.1);
      window.setTimeout(crackle, 40 + Math.random() * 420);
    };
    crackle();
    stops.push(() => (alive = false));
  } else {
    let n = 0;
    let next = c.currentTime + 0.05;
    const t = window.setInterval(() => {
      while (next < c.currentTime + 0.2) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'square';
        o.frequency.value = n % 2 ? 1900 : 2300;
        g.gain.setValueAtTime(0.1, next);
        g.gain.exponentialRampToValueAtTime(0.001, next + 0.018);
        o.connect(g).connect(out);
        o.start(next);
        o.stop(next + 0.03);
        next += 1;
        n++;
      }
    }, 100);
    stops.push(() => window.clearInterval(t));
  }
  return () => stops.forEach((s) => s());
}

/** Change the sound. Call from a tap. Returns false if the browser wouldn't play it. */
export function setSound(id: SoundId, remember = true): boolean {
  stopCurrent?.();
  stopCurrent = null;
  playing = 'off';
  if (remember) {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* remembered for this visit only */
    }
  }
  if (id === 'off') return true;
  try {
    ctx ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    void ctx.resume();
    const c = ctx;
    const out = c.createGain();
    out.gain.setValueAtTime(0, c.currentTime);
    out.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.6);
    out.connect(c.destination);
    const stop = build(id, c, out);
    stopCurrent = () => {
      const t = c.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.3);
      window.setTimeout(() => {
        stop();
        out.disconnect();
      }, 340);
    };
    playing = id;
    return true;
  } catch {
    return false;
  }
}

/** Stop playing, without changing the choice for next time. */
export const stopSound = () => setSound('off', false);
