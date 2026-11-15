/**
 * The robot, dressed: aura behind, the body (a chassis or the drone's forms), headgear on its head,
 * a companion beside it, and a paint job over everything. Art is loaded on first use, so the drawings
 * nobody is wearing aren't in the first bundle.
 */
import { useEffect, useId, useState, type CSSProperties, type ReactElement } from 'react';
import { chassisById, PAINTS, type ChassisGroup } from '../../../domain/game/catalog';
import { wornSkin, type Loadout } from '../../../domain/game/wallet';
import { DRONE_FORMS, STAGES } from '../../../domain/progress/engine';
import { DroneArt, droneHead } from '../Drone';
import type { BotDesign, BotRegistry } from './types';
import './robot.css';

type GroupId = 'forms' | ChassisGroup | 'gear';

const LOADERS: Record<Exclude<GroupId, 'gear'>, () => Promise<BotRegistry>> = {
  forms: () => import('./forms').then((m) => m.FORMS),
  folklore: () => import('./chassisFolklore').then((m) => m.FOLKLORE),
  toys: () => import('./chassisToys').then((m) => m.TOYS),
  cosmic: () => import('./chassisCosmic').then((m) => m.COSMIC),
  tribute: () => import('./chassisTribute').then((m) => m.TRIBUTE),
  event: () => import('./chassisEvent').then((m) => m.EVENT),
  secret: () => import('./chassisSecret').then((m) => m.SECRET),
  samurai: () => import('./chassisSamurai').then((m) => m.SAMURAI),
  mecha: () => import('./chassisMecha').then((m) => m.MECHA),
  guardians: () => import('./chassisGuardians').then((m) => m.GUARDIANS),
  engines: () => import('./chassisEngines').then((m) => m.ENGINES),
  heavens: () => import('./chassisHeavens').then((m) => m.HEAVENS),
};

const loaded = new Map<string, BotRegistry>();
const loading = new Map<string, Promise<BotRegistry>>();

function useRegistry(group: Exclude<GroupId, 'gear'> | null): BotRegistry | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!group || loaded.has(group)) return;
    let live = true;
    const p = loading.get(group) ?? LOADERS[group]();
    loading.set(group, p);
    p.then((r) => {
      loaded.set(group, r);
      if (live) tick((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [group]);
  return group ? (loaded.get(group) ?? null) : null;
}

type GearModule = typeof import('./gear');
let gearMod: GearModule | null = null;
let gearLoading: Promise<GearModule> | null = null;

function useGear(needed: boolean): GearModule | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!needed || gearMod) return;
    let live = true;
    gearLoading ??= import('./gear');
    gearLoading.then((m) => {
      gearMod = m;
      if (live) tick((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [needed]);
  return needed ? gearMod : null;
}

const formKey = (s: number) => STAGES[s].name.toLowerCase().replace(/ /g, '');

/** A form's drawing and where its head is, once loaded. */
export function useFormDesign(stage: number): BotDesign | null {
  const reg = useRegistry(stage >= DRONE_FORMS ? 'forms' : null);
  return reg?.[formKey(stage)] ?? null;
}

export function BodyArt({ stage, chassis, mk, c, c2, uid, still, happy, head, metal }: { stage: number; chassis: string; mk: 1 | 2 | 3; c: string; c2: string; uid: string; still: boolean; happy: boolean; head?: (h: BotDesign['head']) => ReactElement | null; metal?: string }) {
  const ch = chassis === 'drone' ? null : chassisById(chassis);
  const reg = useRegistry(ch ? ch.group : null);
  const form = useFormDesign(ch ? 0 : stage);
  const design = ch ? (reg?.[ch.id] ?? null) : form;
  if (design) {
    return (
      <g className={still ? undefined : 'i-hover'}>
        <g filter={metal} style={metal ? ({ '--fg': '#17120a' } as CSSProperties) : undefined}>
          <design.Art c={c} c2={c2} uid={uid} still={still} happy={happy} mk={ch ? mk : 3} />
        </g>
        {head?.(design.head)}
      </g>
    );
  }
  // The drone itself, and what shows for a moment while a drawing loads.
  const s = ch ? 0 : Math.min(stage, DRONE_FORMS - 1);
  return (
    <>
      <DroneArt s={s} c={c} c2={c2} uid={uid} still={still} happy={happy} />
      {head?.(droneHead(s))}
    </>
  );
}

export function Robot({ stage, look, still = false, happy = false, label = true, mk }: { stage: number; look: Loadout; still?: boolean; happy?: boolean; label?: boolean; mk?: 1 | 2 | 3 }) {
  const uid = `r${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const s = Math.max(0, Math.min(STAGES.length - 1, stage));
  const ch = look.chassis === 'drone' ? null : chassisById(look.chassis);
  const skin = ch ? wornSkin(look) : null;
  // A True Silver or True Gold body is cast in metal: its own colours set the light and shade, so a paint job doesn't apply.
  const paint = look.paint && !skin ? PAINTS.find((p) => p.id === look.paint) : null;
  const c = paint?.c ?? ch?.c ?? STAGES[s].c;
  const c2 = paint?.c2 ?? ch?.c2 ?? STAGES[s].c2;
  const gear = useGear(!!(look.hat || look.pet || look.aura));
  const Hat = look.hat ? gear?.HAT_ART[look.hat] : null;
  const Pet = look.pet ? gear?.PET_ART[look.pet] : null;
  const Aura = look.aura ? gear?.AURA_ART[look.aura] : null;
  const name = ch?.name ?? `${STAGES[s].name} form`;
  return (
    <svg
      className={`rb${paint?.fx ? ` rb--${paint.fx}` : ''}${skin ? ` rb--true rb--true-${skin}` : ''}${still ? ' rb--still' : ''}`}
      viewBox="0 0 200 200"
      role={label ? 'img' : undefined}
      aria-label={label ? `${name}, your character` : undefined}
      aria-hidden={label ? undefined : true}
    >
      {skin && <MetalDefs id={`${uid}m`} skin={skin} still={still} />}
      {Aura && <Aura c={c} c2={c2} uid={`${uid}a`} still={still} />}
      <BodyArt
        stage={s}
        chassis={look.chassis}
        mk={mk ?? (ch ? 1 : 3)}
        c={c}
        c2={c2}
        uid={uid}
        still={still}
        happy={happy}
        metal={skin ? `url(#${uid}m)` : undefined}
        head={
          Hat
            ? (h) => (
                <g transform={`translate(${h.x} ${h.y}) scale(${h.s})`}>
                  <Hat c={c} c2={c2} uid={`${uid}h`} still={still} />
                </g>
              )
            : undefined
        }
      />
      {skin && <Glints skin={skin} still={still} />}
      {Pet && (
        <g className="rb__pet">
          <g transform="translate(168 62) scale(1.15)">
            <Pet c={c} c2={c2} uid={`${uid}p`} still={still} />
          </g>
        </g>
      )}
    </svg>
  );
}

// ─── True Silver and True Gold ──────────────────────────────────────────────

/** Luminance → metal: dark to light, the stops of each metal's ramp (R, G, B). */
const RAMP = {
  silver: ['0.07 0.26 0.50 0.74 0.91 1', '0.08 0.29 0.54 0.78 0.93 1', '0.11 0.34 0.60 0.84 0.97 1'],
  gold: ['0.10 0.34 0.62 0.86 0.98 1', '0.05 0.19 0.40 0.62 0.82 0.96', '0.01 0.03 0.07 0.18 0.42 0.78'],
} as const;

/**
 * The metal: the drawing turned to its light and shade, mapped onto the metal's ramp, then lit from
 * one side so every edge catches a highlight. When it moves, the light swings slowly across.
 */
function MetalDefs({ id, skin, still }: { id: string; skin: 'silver' | 'gold'; still: boolean }) {
  const [r, g, b] = RAMP[skin];
  const calm = still || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  return (
    <defs>
      <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0 0 0 1 0" result="lum" />
        <feComponentTransfer in="lum" result="cast">
          <feFuncR type="table" tableValues={r} />
          <feFuncG type="table" tableValues={g} />
          <feFuncB type="table" tableValues={b} />
        </feComponentTransfer>
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="bump" />
        <feSpecularLighting in="bump" surfaceScale="4" specularConstant="1.05" specularExponent="16" lightingColor={skin === 'gold' ? '#fff3c4' : '#ffffff'} result="spec">
          <feDistantLight azimuth="235" elevation="48">{!calm && <animate attributeName="azimuth" values="200;330;200" dur="6s" repeatCount="indefinite" />}</feDistantLight>
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="shine" />
        <feComposite in="cast" in2="shine" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" result="lit" />
        <feComposite in="lit" in2="SourceAlpha" operator="in" />
      </filter>
    </defs>
  );
}

const GLINTS: [number, number, number, number][] = [
  [52, 58, 7, 0],
  [148, 92, 5, 0.9],
  [70, 150, 4.5, 1.7],
  [136, 40, 6, 2.4],
  [118, 142, 4, 3.1],
];
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

/** Little four-point glints over a metal body; two stay lit on a still thumbnail. */
function Glints({ skin, still }: { skin: 'silver' | 'gold'; still: boolean }) {
  const fill = skin === 'gold' ? '#fff6cf' : '#ffffff';
  return (
    <g className="rb__glints" aria-hidden="true" pointerEvents="none">
      {(still ? GLINTS.slice(0, 2) : GLINTS).map(([x, y, r, d]) => (
        <path key={`${x}-${y}`} className={still ? undefined : 'rb__glint'} d={sparkle(x, y, r)} fill={fill} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${d}s` }} />
      ))}
    </g>
  );
}
