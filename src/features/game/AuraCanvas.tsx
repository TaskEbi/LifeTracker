/** A canvas that draws one aura: looping, or a single still frame (the index, reduced motion). */
import { useEffect, useRef } from 'react';
import { drawAura } from './auraFx';

export const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/**
 * Size a canvas to its box (at up to 2× for sharp screens) and call `draw` every frame, or once when
 * `animate` is off. `draw` gets seconds since it started and the box in CSS pixels.
 */
export function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void, animate: boolean, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const t0 = performance.now();
    const frame = (still?: boolean) => {
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, still ? 2.5 : (performance.now() - t0) / 1000, w, h);
    };
    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.round(r.width);
      h = Math.round(r.height);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      if (!animate) frame(true);
    };
    size();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(size);
    ro?.observe(cv);
    if (animate) {
      const loop = () => {
        frame();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, ...deps]);
  return ref;
}

export function AuraCanvas({ id, pass = 'both', animate = true, scale = 0.27, className }: { id: string | null | undefined; pass?: 'back' | 'front' | 'both'; animate?: boolean; scale?: number; className?: string }) {
  const moving = animate && !reducedMotion();
  const ref = useCanvasLoop(
    (ctx, t, w, h) => {
      if (id) drawAura(ctx, id, t, w / 2, h / 2, Math.min(w, h) * scale, pass);
    },
    moving && !!id,
    [id, pass, scale],
  );
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
