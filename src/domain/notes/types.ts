/**
 * Study notes: compact revision notes for every topic of the AS and A2 units, written in a small
 * markup so the content files stay short. See `markup.ts` for the inline syntax.
 */
export type SubjectId = 'physics' | 'maths' | 'further' | 'cs';

export type FigId = 'vt' | 'projectile' | 'moments' | 'stress' | 'wave' | 'standing' | 'photo' | 'circuit' | 'unitcircle' | 'tangent' | 'area' | 'normal' | 'argand' | 'newton' | 'fde' | 'gp';

export type Block =
  | string
  | { k: 'h'; t: string }
  | { k: 'ul' | 'ol'; items: string[] }
  | { k: 'f'; lines: string[] }
  | { k: 'tbl'; head: string[]; rows: string[][] }
  | { k: 'tip' | 'trap'; t: string }
  | { k: 'code'; t: string }
  | { k: 'fig'; id: FigId; cap: string };

export interface NoteSection {
  id: string;
  title: string;
  body: Block[];
}

export interface NoteTopic {
  id: string;
  /** Spec reference shown on the disc and in the index, e.g. "U1 · 1" or "9618 · 4". */
  ref: string;
  title: string;
  /** The title broken into the hero's lines. */
  lines: string[];
  covers: string;
  /** One thing to remember, shown under the disc. */
  hook: string;
  terms: { t: string; d: string }[];
  sections: NoteSection[];
  /** A fuller treatment elsewhere (the CS revision site). */
  link?: { label: string; href: string };
}

export interface NoteUnit {
  id: string;
  code: string;
  name: string;
  /** An A2 unit: shown after the AS units, which are the ones being sat this year. */
  a2?: boolean;
  topics: NoteTopic[];
}

export interface NoteSubject {
  id: SubjectId;
  name: string;
  /** The name Study sessions and past papers use. */
  study: string;
  board: string;
  hue: number;
  units: NoteUnit[];
}

// ── helpers the content files write with ──

export const h = (t: string): Block => ({ k: 'h', t });
export const ul = (...items: string[]): Block => ({ k: 'ul', items });
export const ol = (...items: string[]): Block => ({ k: 'ol', items });
export const f = (...lines: string[]): Block => ({ k: 'f', lines });
export const tbl = (head: string[], ...rows: string[][]): Block => ({ k: 'tbl', head, rows });
export const tip = (t: string): Block => ({ k: 'tip', t });
export const trap = (t: string): Block => ({ k: 'trap', t });
export const code = (t: string): Block => ({ k: 'code', t });
export const fig = (id: FigId, cap: string): Block => ({ k: 'fig', id, cap });

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const sec = (title: string, ...body: Block[]): NoteSection => ({ id: slug(title), title, body });

/** Splits a title into two balanced lines for the hero. */
export function titleLines(title: string): string[] {
  const words = title.split(' ');
  if (words.length < 2) return [title];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/**
 * A topic. `terms` are "Term: definition" strings; `lines` come from the title unless given.
 */
export function topic(id: string, ref: string, title: string, covers: string, hook: string, terms: string[], sections: NoteSection[], extra: Partial<Pick<NoteTopic, 'link' | 'lines'>> = {}): NoteTopic {
  return {
    id,
    ref,
    title,
    lines: extra.lines ?? titleLines(title),
    covers,
    hook,
    terms: terms.map((s) => {
      const i = s.indexOf(': ');
      return { t: s.slice(0, i), d: s.slice(i + 2) };
    }),
    sections,
    link: extra.link,
  };
}
