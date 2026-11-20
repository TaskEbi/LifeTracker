/**
 * What the Chandlery's supplies do to a question. A helped answer still counts as right, but the
 * card moves only as far as Easy proves, it scores half and it isn't "right first time".
 */
import { country, distractors, qtype, shuffle, type Question, type Rng } from './model';

/** Fifty-fifty: half the wrong answers go (at least one stays); typing or the whole map becomes four to choose from. */
export function halve(q: Question, rng: Rng = Math.random): Question {
  const t = qtype(q.type)!;
  if (q.options) {
    const wrong = q.options.filter((id) => id !== q.id);
    const drop = new Set(shuffle(wrong, rng).slice(0, Math.min(wrong.length - 1, Math.ceil(wrong.length / 2))));
    return { ...q, options: q.options.filter((id) => !drop.has(id)) };
  }
  const flagInvolved = t.show === 'flag' || t.answer === 'flag';
  return { ...q, options: shuffle([q.id, ...distractors(q.id, 3, 'normal', flagInvolved, rng)], rng), typed: false };
}

export interface Clue {
  text: string;
  /** A wrong answer to take away. */
  drop?: string;
  /** Somewhere to point the map at (a neighbour, never the country itself). */
  near?: string;
}

const letters = (s: string) => s.replace(/[^\p{L}]/gu, '').length;

/** The spyglass: where it is and how the answer starts. */
export function clue(q: Question, rng: Rng = Math.random): Clue {
  const t = qtype(q.type)!;
  const c = country(q.id);
  if (t.answer === 'cap') {
    const cap = c.cap.split(',')[0].trim();
    return { text: `The capital starts with “${cap[0]}” and has ${letters(cap)} letters.` };
  }
  if (t.answer === 'map') return { text: `Look in ${c.sub}. The map is pointed at a neighbour.`, near: c.near[0] };
  if (t.answer === 'flag') {
    const wrong = (q.options ?? []).filter((id) => id !== q.id);
    return { text: `${c.name} is in ${c.sub}. One wrong flag is gone.`, drop: wrong.length > 1 ? shuffle(wrong, rng)[0] : undefined };
  }
  return { text: `It’s in ${c.sub}. The name starts with “${c.name[0]}” and has ${letters(c.name)} letters.` };
}
