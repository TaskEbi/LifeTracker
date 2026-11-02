/**
 * Going into a section, two slashed panels in its colour close over the page with its kanji and
 * split open onto the new room, about half a second, like a cut in an anime. Nothing waits for it:
 * the page underneath is already there, and it can't be tapped. Full mode only; Settings →
 * Celebrations can turn it off.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { SECTION_IDS, type SectionId } from '../data/types';
import { sectionInfo, SYSTEM_KANJI } from '../domain/sections';
import { fxPrefs, fxStore, playStyle } from '../ui/i/fx/celebrate';
import type { RouteName } from './router';
import './doors.css';

const DOOR_MS = 560;

export function Doors({ name }: { name: RouteName }) {
  const prev = useRef(name);
  const [door, setDoor] = useState<{ key: number; kanji: string; label: string; color: string } | null>(null);
  const n = useRef(0);
  useLayoutEffect(() => {
    if (prev.current === name) return;
    prev.current = name;
    const isSection = (SECTION_IDS as readonly string[]).includes(name);
    if ((!isSection && name !== 'bucket') || fxStore.get().mode !== 'full' || !fxPrefs.get().doors || playStyle() !== 'full') {
      setDoor(null);
      return;
    }
    const info = isSection ? sectionInfo(name as SectionId) : null;
    setDoor({ key: ++n.current, kanji: info?.kanji ?? SYSTEM_KANJI.bucket, label: info?.full ?? 'Bucket list', color: isSection ? `var(--c-${name})` : '#ffc94d' });
    const t = window.setTimeout(() => setDoor(null), DOOR_MS);
    return () => window.clearTimeout(t);
  }, [name]);
  if (!door) return null;
  return (
    <div className="dr" key={door.key} style={{ '--dc': door.color } as CSSProperties} aria-hidden="true">
      <i className="dr__p dr__p--a" />
      <i className="dr__p dr__p--b" />
      <i className="dr__slash" />
      <span className="dr__k">{door.kanji}</span>
      <span className="dr__l">{door.label}</span>
    </div>
  );
}
