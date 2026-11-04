/**
 * The robot, dressed: aura behind, the body (a chassis or the drone's forms), headgear on its head,
 * a companion beside it, and a paint job over everything. Art is loaded on first use, so the drawings
 * nobody is wearing aren't in the first bundle.
 */
import { useEffect, useId, useState, type ReactElement } from 'react';
import { chassisById, PAINTS } from '../../../domain/game/catalog';
import type { Loadout } from '../../../domain/game/wallet';
import { DRONE_FORMS, STAGES } from '../../../domain/progress/engine';
import { DroneArt, droneHead } from '../Drone';
import type { BotDesign, BotRegistry } from './types';
import './robot.css';

type GroupId = 'forms' | 'folklore' | 'toys' | 'cosmic' | 'tribute' | 'event' | 'gear';

const LOADERS: Record<Exclude<GroupId, 'gear'>, () => Promise<BotRegistry>> = {
  forms: () => import('./forms').then((m) => m.FORMS),
  folklore: () => import('./chassisFolklore').then((m) => m.FOLKLORE),
  toys: () => import('./chassisToys').then((m) => m.TOYS),
  cosmic: () => import('./chassisCosmic').then((m) => m.COSMIC),
  tribute: () => import('./chassisTribute').then((m) => m.TRIBUTE),
  event: () => import('./chassisEvent').then((m) => m.EVENT),
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

export function BodyArt({ stage, chassis, mk, c, c2, uid, still, happy, head }: { stage: number; chassis: string; mk: 1 | 2 | 3; c: string; c2: string; uid: string; still: boolean; happy: boolean; head?: (h: BotDesign['head']) => ReactElement | null }) {
  const ch = chassis === 'drone' ? null : chassisById(chassis);
  const reg = useRegistry(ch ? ch.group : null);
  const form = useFormDesign(ch ? 0 : stage);
  const design = ch ? (reg?.[ch.id] ?? null) : form;
  if (design) {
    return (
      <g className={still ? undefined : 'i-hover'}>
        <design.Art c={c} c2={c2} uid={uid} still={still} happy={happy} mk={ch ? mk : 3} />
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
  const paint = look.paint ? PAINTS.find((p) => p.id === look.paint) : null;
  const c = paint?.c ?? ch?.c ?? STAGES[s].c;
  const c2 = paint?.c2 ?? ch?.c2 ?? STAGES[s].c2;
  const gear = useGear(!!(look.hat || look.pet || look.aura));
  const Hat = look.hat ? gear?.HAT_ART[look.hat] : null;
  const Pet = look.pet ? gear?.PET_ART[look.pet] : null;
  const Aura = look.aura ? gear?.AURA_ART[look.aura] : null;
  const name = ch?.name ?? `${STAGES[s].name} form`;
  return (
    <svg
      className={`rb${paint?.fx ? ` rb--${paint.fx}` : ''}${still ? ' rb--still' : ''}`}
      viewBox="0 0 200 200"
      role={label ? 'img' : undefined}
      aria-label={label ? `${name}, your character` : undefined}
      aria-hidden={label ? undefined : true}
    >
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
