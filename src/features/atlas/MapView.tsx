/**
 * The Atlas map: one continent or the world as an SVG you can pinch, drag and zoom. Countries can
 * be lit, marked right or wrong, or offered as a few to choose from; small ones get a ring that
 * stays finger-sized however far you zoom. Each map is its own chunk, loaded when first shown.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { contName, country, type ViewId } from '../../domain/atlas/model';

export interface MapData {
  w: number;
  h: number;
  /** Land that isn't part of this view's countries. */
  ctx: string;
  shapes: Record<string, string>;
  /** x, y, ring?, then the bounding box. */
  pts: Record<string, [number, number, number, number, number, number, number]>;
}

const LOAD: Record<ViewId, () => Promise<{ default: string }>> = {
  world: () => import('./maps/world'),
  africa: () => import('./maps/africa'),
  asia: () => import('./maps/asia'),
  europe: () => import('./maps/europe'),
  namerica: () => import('./maps/namerica'),
  samerica: () => import('./maps/samerica'),
  oceania: () => import('./maps/oceania'),
};
const cache = new Map<ViewId, Promise<MapData>>();
export function loadMap(view: ViewId): Promise<MapData> {
  let p = cache.get(view);
  if (!p) {
    p = LOAD[view]().then((m) => JSON.parse(m.default) as MapData);
    // a failed load (offline, say) can be tried again
    p.catch(() => cache.delete(view));
    cache.set(view, p);
  }
  return p;
}

export function useMap(view: ViewId): MapData | null | 'failed' {
  const [got, setGot] = useState<{ view: ViewId; data: MapData | 'failed' } | null>(null);
  useEffect(() => {
    let on = true;
    loadMap(view).then(
      (data) => on && setGot({ view, data }),
      () => on && setGot({ view, data: 'failed' }),
    );
    return () => {
      on = false;
    };
  }, [view]);
  return got && got.view === view ? got.data : null;
}

export type MapMark = 'hl' | 'ok' | 'bad';
interface VB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function MapView({
  view,
  marks,
  cands,
  onPick,
  focus,
  overlay,
  small,
}: {
  view: ViewId;
  marks?: Record<string, MapMark>;
  /** Only these can be tapped, and they are lit. */
  cands?: string[] | null;
  onPick?: (id: string) => void;
  /** Zoom to this country; null shows the whole map. */
  focus?: string | null;
  /** Drawn over the map in its own units (a voyage's route, say). */
  overlay?: (map: MapData) => ReactNode;
  /** A shorter map, for a chart above something else. */
  small?: boolean;
}) {
  const data = useMap(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const vb = useRef<VB>({ x: 0, y: 0, w: 1000, h: 1000 });
  const anim = useRef(0);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const candRef = useRef(cands);
  candRef.current = cands;
  const V = data && data !== 'failed' ? data : null;

  const api = useMemo(() => {
    const setVB = (n: VB) => {
      const svg = svgRef.current;
      if (!svg || !V) return;
      vb.current = n;
      svg.setAttribute('viewBox', `${n.x.toFixed(2)} ${n.y.toFixed(2)} ${n.w.toFixed(2)} ${n.h.toFixed(2)}`);
      svg.classList.toggle('is-zoomed', n.w < V.w * 0.999);
      // rings keep their size on screen
      const px = n.w / Math.max(svg.clientWidth, 1);
      const base = (view === 'world' ? 4.5 : 6) * px;
      for (const m of svg.querySelectorAll<SVGCircleElement>('.at-mk')) m.setAttribute('r', (/is-(hl|ok|bad|cand)/.test(m.getAttribute('class') ?? '') ? base * 1.7 : base).toFixed(2));
    };
    const clamp = (x: number, y: number, w: number): VB => {
      if (!V) return vb.current;
      const cw = Math.max(V.w / 16, Math.min(V.w, w));
      const ch = (cw * V.h) / V.w;
      return { x: Math.max(0, Math.min(V.w - cw, x)), y: Math.max(0, Math.min(V.h - ch, y)), w: cw, h: ch };
    };
    const tween = (t: VB) => {
      cancelAnimationFrame(anim.current);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setVB(t);
      const f = { ...vb.current };
      const t0 = performance.now();
      const step = (now: number) => {
        let k = Math.min(1, (now - t0) / 380);
        k = 1 - (1 - k) ** 3;
        setVB({ x: f.x + (t.x - f.x) * k, y: f.y + (t.y - f.y) * k, w: f.w + (t.w - f.w) * k, h: f.h + (t.h - f.h) * k });
        if (k < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    };
    const fit = () => V && tween({ x: 0, y: 0, w: V.w, h: V.h });
    const focusOn = (id: string) => {
      const p = V?.pts[id];
      if (!V || !p) return fit();
      let bw = p[5] - p[3];
      let bh = p[6] - p[4];
      let cx = (p[3] + p[5]) / 2;
      let cy = (p[4] + p[6]) / 2;
      if (p[2]) {
        cx = p[0];
        cy = p[1];
        bw = bh = 12;
      }
      const w = Math.max(bw * 2.6, (bh * 2.6 * V.w) / V.h, V.w * 0.26);
      if (w > V.w * 0.8) return fit();
      tween(clamp(cx - w / 2, cy - (w * V.h) / V.w / 2, w));
    };
    const toSvg = (x: number, y: number) => {
      const svg = svgRef.current!;
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0, k: 1 };
      const p = new DOMPoint(x, y).matrixTransform(m.inverse());
      return { x: p.x, y: p.y, k: 1 / m.a };
    };
    const zoomAt = (f: number, cx: number, cy: number) => {
      if (!V) return;
      const w = Math.max(V.w / 16, Math.min(V.w, vb.current.w * f));
      const k = w / vb.current.w;
      cancelAnimationFrame(anim.current);
      setVB(clamp(cx - (cx - vb.current.x) * k, cy - (cy - vb.current.y) * k, w));
    };
    const zoomBy = (f: number) => {
      const c = vb.current;
      const w = V ? Math.max(V.w / 16, Math.min(V.w, c.w * f)) : c.w;
      tween(clamp(c.x - (w - c.w) / 2, c.y - ((w - c.w) * c.h) / c.w / 2, w));
    };
    return { setVB, clamp, fit, focusOn, toSvg, zoomAt, zoomBy };
  }, [V, view]);

  // a new map starts whole; then follow the focus
  useLayoutEffect(() => {
    if (!V) return;
    cancelAnimationFrame(anim.current);
    api.setVB({ x: 0, y: 0, w: V.w, h: V.h });
    return () => cancelAnimationFrame(anim.current);
  }, [V, api]);
  useEffect(() => {
    if (!V) return;
    if (focus) api.focusOn(focus);
    else api.fit();
  }, [V, api, focus]);
  // marked rings are drawn larger
  useLayoutEffect(() => {
    if (V) api.setVB(vb.current);
  }, [V, api, marks, cands]);

  // pointer: drag to pan when zoomed, pinch to zoom, tap to pick
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !V) return;
    const ptrs = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; vx: number; vy: number } | null = null;
    let pinch: { d: number; w: number; cx: number; cy: number } | null = null;
    let moved = false;
    const two = () => {
      const [a, b] = [...ptrs.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const down = (e: PointerEvent) => {
      if (e.button) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        moved = false;
        drag = { x: e.clientX, y: e.clientY, vx: vb.current.x, vy: vb.current.y };
      } else if (ptrs.size === 2) {
        moved = true;
        drag = null;
        const t = two();
        const c = api.toSvg(t.x, t.y);
        pinch = { d: t.d, w: vb.current.w, cx: c.x, cy: c.y };
      }
    };
    const move = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size >= 2) {
        const t = two();
        const w = Math.max(V.w / 16, Math.min(V.w, (pinch.w * pinch.d) / t.d));
        const k = w / vb.current.w;
        cancelAnimationFrame(anim.current);
        api.setVB(api.clamp(pinch.cx - (pinch.cx - vb.current.x) * k, pinch.cy - (pinch.cy - vb.current.y) * k, w));
        return;
      }
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (moved && vb.current.w < V.w * 0.999) {
          const k = api.toSvg(0, 0).k;
          cancelAnimationFrame(anim.current);
          api.setVB(api.clamp(drag.vx - dx * k, drag.vy - dy * k, vb.current.w));
        }
      }
    };
    const end = (e: PointerEvent, cancel: boolean) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size) return;
      drag = null;
      if (moved || cancel || !pickRef.current) return;
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-id]');
      const id = el && svg.contains(el) ? el.getAttribute('data-id') : null;
      if (id && (!candRef.current || candRef.current.includes(id))) pickRef.current(id);
    };
    const up = (e: PointerEvent) => end(e, false);
    const cancel = (e: PointerEvent) => end(e, true);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = api.toSvg(e.clientX, e.clientY);
      api.zoomAt(e.deltaY > 0 ? 1.2 : 1 / 1.2, p.x, p.y);
    };
    svg.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => {
      svg.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      svg.removeEventListener('wheel', wheel);
    };
  }, [V, api]);

  const layers = useMemo(() => {
    if (!V) return null;
    const cls = (base: string, id: string) => {
      const m = marks?.[id];
      if (m) return `${base} is-${m}`;
      if (cands) return cands.includes(id) ? `${base} is-cand` : `${base} is-dim`;
      return base;
    };
    const rings = Object.entries(V.pts).filter(([, p]) => p[2]);
    // marked rings, and the ones to choose from, are drawn last, on top of their neighbours
    const top = (id: string) => (marks?.[id] ? 2 : cands?.includes(id) ? 1 : 0);
    rings.sort((a, b) => top(a[0]) - top(b[0]));
    return (
      <>
        <path className="at-ctx" d={V.ctx} />
        <g>
          {Object.entries(V.shapes).map(([id, d]) => (
            <path key={id} className={cls('at-land', id)} data-id={id} d={d} />
          ))}
        </g>
        <g>
          {rings.map(([id, p]) => (
            <circle key={id} className={cls('at-mk', id)} data-id={id} cx={p[0]} cy={p[1]} r={6} />
          ))}
        </g>
        {overlay && <g className="at-over">{overlay(V)}</g>}
      </>
    );
  }, [V, marks, cands, overlay]);

  if (data === 'failed') return <p className="at-mapfail">The map couldn’t load. Check the connection and open this page again.</p>;
  const lit = marks ? Object.keys(marks).find((id) => marks[id] === 'hl') : undefined;
  return (
    <figure className={`at-map${small ? ' at-map--small' : ''}`} data-pick={onPick ? '' : undefined}>
      <svg ref={svgRef} role="img" aria-label={`Map of ${view === 'world' ? 'the world' : contName(view)}${lit && !onPick ? ', one country lit' : ''}`} style={V ? { aspectRatio: `${V.w} / ${V.h}` } : undefined}>
        {layers}
      </svg>
      {!V && <p className="at-map__wait">Loading the map…</p>}
      {V && (
        <div className="at-map__zoom">
          <button type="button" aria-label="Zoom in" onClick={() => api.zoomBy(0.6)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => api.zoomBy(1 / 0.6)}>
            −
          </button>
          <button type="button" aria-label="Show the whole map" onClick={() => api.fit()}>
            ⤢
          </button>
        </div>
      )}
    </figure>
  );
}

/** One country's outline on its own, with nothing around it to give it away. */
export function Outline({ id }: { id: string }) {
  const c = country(id);
  const data = useMap(c.cont);
  if (data === 'failed') return <p className="at-mapfail">The outline couldn’t load.</p>;
  const d = data?.shapes[id];
  const p = data?.pts[id];
  if (!data || !d || !p) return <div className="at-outline" aria-busy="true" />;
  const pad = Math.max(p[5] - p[3], p[6] - p[4]) * 0.08 + 1;
  return (
    <div className="at-outline">
      <svg viewBox={`${p[3] - pad} ${p[4] - pad} ${p[5] - p[3] + pad * 2} ${p[6] - p[4] + pad * 2}`} role="img" aria-label="The outline of a country">
        <path d={d} />
      </svg>
    </div>
  );
}
