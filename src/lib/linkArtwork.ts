import type { Item } from '../data/types';
import { hostOf } from './detectKind';
import { hash } from './random';

export type ArtworkTheme = 'orbit' | 'network' | 'sound' | 'landscape' | 'books' | 'design' | 'abstract';

const THEMES: { theme: ArtworkTheme; label: string; match: RegExp }[] = [
  { theme: 'orbit', label: 'Farther out', match: /\b(space|cosmos|cosmic|universe|astronomy|nasa|planet|voyager|earth|galaxy|stars?|apollo)\b/i },
  { theme: 'sound', label: 'Good vibrations', match: /\b(music|jazz|piano|violin|orchestra|symphony|album|song|records?|spotify|soundcloud|bach|mozart|beethoven)\b/i },
  { theme: 'network', label: 'Connected ideas', match: /\b(code|coding|programming|algorithm|algorithms|computer|computing|machine|machines|ai|neural|transformer|attention|information|math|mathematics|github|arxiv|ioi|joi)\b/i },
  { theme: 'landscape', label: 'Out in the world', match: /\b(nature|garden|plants?|forest|ocean|mountains?|travel|hiking|landscape|environment|climate|ecology)\b/i },
  { theme: 'design', label: 'Form & feeling', match: /\b(design|art|artwork|architecture|creative|creativity|typography|photography|rams|vitsoe|vitso[eœ]|eames)\b/i },
  { theme: 'books', label: 'Between the lines', match: /\b(books?|reading|literature|poetry|poems?|writing|essay|essays|philosophy|history|stories|story)\b/i },
];

/** Use saved context only: no network requests, generated files or changes to the collection. */
export function artworkFor(item: Item, roomName = '') {
  if (!item.url || item.kind === 'quote' || item.kind === 'note' || item.kind === 'photo') return null;
  const domain = hostOf(item.url);
  const context = [item.title, item.creator, item.tags.join(' '), item.preview?.site_name, domain].join(' ');
  // Specific exhibit metadata wins over a broadly named room.
  const found = THEMES.find((t) => t.match.test(context)) ?? THEMES.find((t) => t.match.test(roomName));
  const theme = found?.theme ?? (item.kind === 'music' ? 'sound' : item.kind === 'paper' ? 'network' : 'abstract');
  return {
    theme,
    label: found?.label ?? (theme === 'sound' ? 'Good vibrations' : theme === 'network' ? 'Connected ideas' : 'A little discovery'),
    domain,
    variant: hash(item.url) % 3,
  };
}
