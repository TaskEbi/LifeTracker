/**
 * Motion 動: nine 3D scenes drawn from what you've logged. The page owns the WebGL renderer, the
 * frame loop and the pointer; each scene (scenes/*.ts) builds its own world and reports what it is
 * showing through the HUD. Nothing is stored. Loads in its own chunk, with three.js.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { WebGLRenderer } from 'three';
import { navigate, useRoute } from '../../app/router';
import { progressInput, progressOf, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { buildMotion } from '../../domain/motion/model';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { createCore } from './scenes/core';
import { createDeck } from './scenes/deck';
import { createFusion } from './scenes/fusion';
import { createGalaxy } from './scenes/galaxy';
import { createOrbit } from './scenes/orbit';
import { createPrism } from './scenes/prism';
import { createRidges } from './scenes/ridges';
import { createTunnel } from './scenes/tunnel';
import { createYear } from './scenes/year';
import { loadStageFonts, SCENES, type Hud, type SceneId, type StageCtx, type StageScene } from './stage';
import './motion.css';

const MAKE: Record<SceneId, (ctx: StageCtx) => StageScene> = { core: createCore, deck: createDeck, year: createYear, fusion: createFusion, orbit: createOrbit, ridges: createRidges, prism: createPrism, galaxy: createGalaxy, tunnel: createTunnel };
const sceneOf = (rest: string[]): SceneId => SCENES.find((s) => s.id === rest[0])?.id ?? 'core';

function useMotionData() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => {
    const input = progressInput(st, today);
    const p = progressOf(st, today);
    return buildMotion({ today, entries: input.entries, topicSection: input.topicSection, sections: p.sections, overall: p.overall, streak: p.streak.n });
  }, [st, today]);
}

interface Runtime {
  renderer: WebGLRenderer;
  scene: StageScene | null;
  pointer: StageCtx['pointer'];
  fit: () => void;
}

export default function MotionPage() {
  const route = useRoute();
  const [sceneId, setSceneId] = useState<SceneId>(() => sceneOf(route.rest));
  const motion = useMotionData();
  const [hud, setHud] = useState<Hud | null>(null);
  const [failed, setFailed] = useState(false);
  const [fonts, setFonts] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rt = useRef<Runtime | null>(null);
  const info = SCENES.find((s) => s.id === sceneId)!;

  useEffect(() => {
    let live = true;
    const kanji = motion.sections.map((s) => s.kanji).join('') + SCENES.map((s) => s.kanji).join('');
    void loadStageFonts(kanji).then(() => live && setFonts(true));
    return () => {
      live = false;
    };
    // the glyphs don't change while the page is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the renderer, the loop and the pointer live as long as the page
  useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setClearColor(0x050507, 1);
    const run: Runtime = {
      renderer,
      scene: null,
      pointer: { x: 0, y: 0, inside: false },
      fit: () => {
        const w = root.clientWidth;
        const h = root.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2) * (run.scene?.pixelScale ?? 1);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        run.scene?.resize(w, h, dpr);
      },
    };
    rt.current = run;
    const ro = new ResizeObserver(run.fit);
    ro.observe(root);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      run.scene?.frame(t, dt);
    };
    raf = requestAnimationFrame(loop);

    // a press that barely moves is a tap; anything further is a drag
    let down: { x: number; y: number; id: number; dragging: boolean } | null = null;
    const ndc = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      run.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      run.pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      run.pointer.inside = true;
    };
    const onDown = (e: PointerEvent) => {
      ndc(e);
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      ndc(e);
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!down.dragging && Math.hypot(dx, dy) < 7) return;
      down.dragging = true;
      down.x = e.clientX;
      down.y = e.clientY;
      run.scene?.drag?.(dx, dy);
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      if (down.dragging) run.scene?.dragEnd?.();
      else run.scene?.tap?.(run.pointer.x, run.pointer.y);
      down = null;
      // a finger that lifts is gone; a mouse is still over the stage
      if (e.pointerType !== 'mouse') run.pointer.inside = false;
    };
    const onLeave = () => {
      if (!down) run.pointer.inside = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      run.scene?.dispose();
      run.scene = null;
      renderer.dispose();
      rt.current = null;
    };
  }, []);

  // the scene: built when the fonts are in, rebuilt when the scene or the numbers change
  useEffect(() => {
    const run = rt.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!run || !canvas || !overlay || !fonts) return;
    canvas.classList.remove('is-in');
    let scene: StageScene;
    try {
      scene = MAKE[sceneId]({
        renderer: run.renderer,
        data: motion,
        pointer: run.pointer,
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        overlay,
        hud: setHud,
      });
    } catch (err) {
      console.error(err);
      setFailed(true);
      return;
    }
    run.scene = scene;
    run.fit();
    const id = requestAnimationFrame(() => canvas.classList.add('is-in'));
    return () => {
      cancelAnimationFrame(id);
      if (run.scene === scene) run.scene = null;
      scene.dispose();
      overlay.replaceChildren();
    };
  }, [sceneId, fonts, motion]);

  // nine tabs don't always fit: keep the one showing in view
  useEffect(() => {
    // (scrollIntoView would also scroll the stage itself, which is wider than the screen on a desktop)
    const tab = rootRef.current?.querySelector<HTMLElement>('.mo-tab[aria-current]');
    const strip = tab?.parentElement;
    if (tab && strip) strip.scrollLeft = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
  }, [sceneId]);

  const pick = (id: SceneId) => {
    if (id === sceneId) return;
    setHud(null);
    setSceneId(id);
    // keep the address in step without leaving the page (a reload comes back to this scene)
    const path = id === 'core' ? '/motion' : `/motion/${id}`;
    history.replaceState({ path }, '', path);
  };

  const open = hud?.section;
  return (
    <div className="mo" ref={rootRef} style={{ '--mo-c': hud?.color ?? '#ffffff' } as CSSProperties}>
      <canvas ref={canvasRef} className="mo-canvas" role="img" aria-label={`${info.name}: a 3D scene drawn from what you have logged`} />
      <div className="mo-overlay" ref={overlayRef} aria-hidden="true" />
      <div className="mo-shade" aria-hidden="true" />
      <div className="mo-grain" aria-hidden="true" />

      <header className="mo-top">
        <button type="button" className="mo-back" onClick={() => navigate('home', ['more'])} aria-label="Back to Home">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M14 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="mo-title">
          Motion <span aria-hidden="true">動</span>
        </h1>
        {motion.sample && (
          <span className="mo-sample" title="Fewer than five days are logged, so the scenes use made-up numbers">
            Sample data
          </span>
        )}
      </header>

      {failed ? (
        <p className="mo-fail">This browser couldn’t start 3D drawing here, so there is nothing to show. The rest of the app is unaffected.</p>
      ) : (
        hud && (
          <section className="mo-hud" aria-live="polite" key={`${sceneId}:${hud.kicker}:${hud.title}:${hud.value}`}>
            <p className="mo-kicker">{hud.kicker}</p>
            <h2 className="mo-name">{hud.title}</h2>
            <p className="mo-value">{hud.value}</p>
            <p className="mo-sub">{hud.sub}</p>
            {open && (
              <button type="button" className="mo-open" onClick={() => navigate(open)}>
                Open {sectionInfo(open).name}
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </section>
        )
      )}

      <div className="mo-foot">
        {!failed && <p className="mo-hint">{info.hint}</p>}
        <nav className="mo-tabs" aria-label="Scenes">
          {SCENES.map((s) => (
            <button key={s.id} type="button" className="mo-tab" aria-current={s.id === sceneId ? 'page' : undefined} onClick={() => pick(s.id)}>
              <span className="mo-tab__k" aria-hidden="true">
                {s.kanji}
              </span>
              <span className="mo-tab__n">{s.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
