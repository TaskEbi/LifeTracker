import type { ReactElement } from 'react';

/**
 * What every piece of robot art gets. Everything is drawn in a 200 × 200 viewBox, with the feet
 * around y = 180 and the body centred near (100, 100), so any design fits every frame in the app.
 */
export interface BotArtProps {
  /** Main colour. A paint job replaces it, so use it (not a fixed colour) for the body's identity. */
  c: string;
  /** Second colour. */
  c2: string;
  /** Unique per instance: prefix gradient and filter ids with it. */
  uid: string;
  /** No animation (thumbnails in a grid). */
  still: boolean;
  /** Smiling. */
  happy: boolean;
  /** 1, 2 or 3. Mk II and III keep what came before and add to it. */
  mk: 1 | 2 | 3;
}

export interface BotDesign {
  Art: (p: BotArtProps) => ReactElement;
  /** Where headgear sits: the top-centre of its head, and how big the head is (1 = 60 px wide). */
  head: { x: number; y: number; s: number };
}

export type BotRegistry = Record<string, BotDesign>;

/** Headgear: drawn around the origin, sitting on y = 0 and going up, 60 px wide at scale 1. */
export type HatArt = (p: { c: string; c2: string; uid: string; still: boolean }) => ReactElement;
/** A companion: drawn around the origin within ±16. Robot.tsx moves it. */
export type PetArt = (p: { c: string; c2: string; uid: string; still: boolean }) => ReactElement;
/** An aura: drawn in the same 200 × 200 box. Behind the robot, or `front` for what falls past it. */
export type AuraArt = (p: { c: string; c2: string; uid: string; still: boolean }) => ReactElement;
