/**
 * The notes' inline markup, parsed to a small tree (no HTML strings):
 *   **bold**   `code`   x^2  x^{n+1}   v_0  u_{n+1}
 * A single character after ^ or _ is raised or lowered; braces take more. Inside `code` nothing
 * is parsed, so pseudocode can use ^ and _ freely.
 */
export type Inline = string | { k: 'b' | 'sup' | 'sub'; c: Inline[] } | { k: 'code'; t: string };

const SINGLE = /[A-Za-z0-9+\-−∞]/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push(text);
    text = '';
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end > i) {
        flush();
        out.push({ k: 'b', c: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (ch === '`') {
      const end = src.indexOf('`', i + 1);
      if (end > i) {
        flush();
        out.push({ k: 'code', t: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if ((ch === '^' || ch === '_') && i > 0 && src[i - 1] !== ' ') {
      const k = ch === '^' ? 'sup' : 'sub';
      if (src[i + 1] === '{') {
        const end = src.indexOf('}', i + 2);
        if (end > i) {
          flush();
          out.push({ k, c: parseInline(src.slice(i + 2, end)) });
          i = end + 1;
          continue;
        }
      } else if (src[i + 1] && SINGLE.test(src[i + 1])) {
        flush();
        out.push({ k, c: [src[i + 1]] });
        i += 2;
        continue;
      }
    }
    text += ch;
    i++;
  }
  flush();
  return out;
}

/** The text with the markup taken out, for search and labels. */
export function plain(src: string): string {
  const walk = (n: Inline[]): string => n.map((x) => (typeof x === 'string' ? x : x.k === 'code' ? x.t : walk(x.c))).join('');
  return walk(parseInline(src));
}
