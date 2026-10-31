/**
 * Each section is its own designed space: its own fonts, colours, surfaces and entrance. The look
 * lives in `src/features/<section>/theme.css`, scoped to `.i-shell[data-sect='<section>']`, so one
 * section's tokens never reach another or Home (which keeps the chosen colour theme).
 * This file only loads a section's web fonts the first time it is opened.
 */
import type { SectionId } from '../data/types';

/** A section, or another page with a space of its own. */
export type LookId = SectionId | 'bucket';

// Variable families are asked for as weight ranges: given single weights, Google serves the same
// variable file per weight and WebKit draws its default (often hairline) instance.
const FONTS: Record<LookId, string> = {
  violin: 'family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400',
  coding: 'family=VT323&family=JetBrains+Mono:wght@100..800',
  sports: 'family=Zilla+Slab:wght@400;500;600;700&family=Archivo:wght@100..900',
  gym: 'family=Black+Ops+One&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700',
  study: 'family=Caveat:wght@400..700&family=Source+Sans+3:wght@200..900&family=IBM+Plex+Mono:wght@400;500',
  chess: 'family=UnifrakturMaguntia&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400',
  sleep: 'family=Instrument+Serif:ital@0;1&family=Lexend:wght@100..900',
  screen: 'family=Zen+Maru+Gothic:wght@400;500;700&family=Manrope:wght@200..800',
  bucket: 'family=Shippori+Mincho:wght@500;700;800&family=Yuji+Syuku',
  cabinet: 'family=Kalam:wght@400;700&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&family=Courier+Prime:wght@400;700',
};

const loaded = new Set<LookId>();

export function loadSectionFonts(id: LookId) {
  if (loaded.has(id)) return;
  loaded.add(id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS[id]}&display=swap`;
  link.dataset.sect = id;
  document.head.appendChild(link);
}
