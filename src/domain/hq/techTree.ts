/**
 * 技術の木, the tech tree: the topics of competitive programming, each resting on others, from what
 * JOI's first round asks up to IOI. You say how well you know each; it shows what to learn next,
 * meaning a topic whose foundations you've got, the least recently touched first. The tiers are a
 * rough guide to the usual order of learning, not an official syllabus.
 */

export type TopicTier = 1 | 2 | 3 | 4;
export const TIER_NAME: Record<TopicTier, string> = { 1: 'Foundations', 2: 'JOI qualifiers', 3: 'JOI final', 4: 'Camp and IOI' };

export interface Topic {
  id: string;
  name: string;
  tier: TopicTier;
  needs: string[];
  /** One line on what it's for. */
  use: string;
}

export const TOPICS: Topic[] = [
  { id: 'impl', name: 'Implementation', tier: 1, needs: [], use: 'Turn a statement into correct code, quickly' },
  { id: 'complexity', name: 'Complexity', tier: 1, needs: [], use: 'Know if it’ll pass before you write it' },
  { id: 'sort', name: 'Sorting', tier: 1, needs: ['impl'], use: 'Custom orders, coordinate compression' },
  { id: 'prefix', name: 'Prefix sums', tier: 1, needs: ['impl'], use: 'Range sums in O(1), 2D too' },
  { id: 'brute', name: 'Complete search', tier: 1, needs: ['impl', 'complexity'], use: 'Subtasks are free marks: bitmask and recursion' },
  { id: 'bsearch', name: 'Binary search', tier: 1, needs: ['sort'], use: 'On arrays, and on the answer' },
  { id: 'greedy', name: 'Greedy', tier: 2, needs: ['sort'], use: 'And how to prove it, or break it' },
  { id: 'twoptr', name: 'Two pointers', tier: 2, needs: ['sort', 'prefix'], use: 'Sliding windows' },
  { id: 'stl', name: 'Sets, maps, heaps', tier: 2, needs: ['complexity'], use: 'The standard library is half the contest' },
  { id: 'dp', name: 'DP basics', tier: 2, needs: ['brute'], use: 'States and transitions' },
  { id: 'knapsack', name: 'Knapsack', tier: 2, needs: ['dp'], use: 'The pattern behind many DPs' },
  { id: 'lis', name: 'LIS and LCS', tier: 2, needs: ['dp', 'bsearch'], use: 'Classic sequence DPs' },
  { id: 'bfs', name: 'BFS and DFS', tier: 2, needs: ['impl'], use: 'Grids and graphs' },
  { id: 'dijkstra', name: 'Shortest paths', tier: 2, needs: ['bfs', 'stl'], use: 'Dijkstra, Floyd–Warshall, Bellman–Ford' },
  { id: 'dsu', name: 'Union-find', tier: 2, needs: ['bfs'], use: 'Connectivity, fast' },
  { id: 'mst', name: 'Spanning trees', tier: 2, needs: ['dsu', 'sort'], use: 'Kruskal and Prim' },
  { id: 'topo', name: 'Topological sort', tier: 2, needs: ['bfs'], use: 'DAGs, and DP on them' },
  { id: 'number', name: 'Number theory', tier: 2, needs: ['complexity'], use: 'GCD, sieve, modular inverse' },
  { id: 'combi', name: 'Combinatorics', tier: 3, needs: ['number', 'dp'], use: 'Counting mod p' },
  { id: 'bit', name: 'Fenwick tree', tier: 3, needs: ['prefix'], use: 'Point update, prefix query' },
  { id: 'segtree', name: 'Segment tree', tier: 3, needs: ['bit', 'bsearch'], use: 'Range queries of nearly anything' },
  { id: 'lazy', name: 'Lazy propagation', tier: 3, needs: ['segtree'], use: 'Range updates too' },
  { id: 'sparse', name: 'Sparse table', tier: 3, needs: ['prefix'], use: 'Static range minimum in O(1)' },
  { id: 'treedp', name: 'Tree DP', tier: 3, needs: ['dp', 'bfs'], use: 'Subtrees, then rerooting' },
  { id: 'lca', name: 'LCA and doubling', tier: 3, needs: ['treedp', 'sparse'], use: 'Paths on trees' },
  { id: 'euler', name: 'Euler tour', tier: 3, needs: ['treedp', 'bit'], use: 'Subtrees as ranges' },
  { id: 'intdp', name: 'Interval DP', tier: 3, needs: ['knapsack'], use: 'Merging ranges' },
  { id: 'bitdp', name: 'Bitmask DP', tier: 3, needs: ['knapsack'], use: 'Small n, big state' },
  { id: 'scc', name: 'SCC and 2-SAT', tier: 3, needs: ['topo'], use: 'Strong components' },
  { id: 'bridges', name: 'Bridges, cut points', tier: 3, needs: ['bfs'], use: 'Low-link' },
  { id: 'hash', name: 'String hashing', tier: 3, needs: ['number'], use: 'Compare substrings in O(1)' },
  { id: 'kmp', name: 'KMP and Z', tier: 3, needs: ['twoptr'], use: 'Pattern matching' },
  { id: 'trie', name: 'Trie', tier: 3, needs: ['treedp'], use: 'Strings and XOR' },
  { id: 'sqrt', name: 'Sqrt decomposition', tier: 3, needs: ['prefix', 'complexity'], use: 'Mo’s algorithm' },
  { id: 'cht', name: 'Convex hull trick', tier: 4, needs: ['intdp', 'bsearch'], use: 'Faster DP transitions' },
  { id: 'dnc', name: 'D&C optimisation', tier: 4, needs: ['intdp'], use: 'Monotone optimum' },
  { id: 'digit', name: 'Digit DP', tier: 4, needs: ['bitdp'], use: 'Counting numbers with a property' },
  { id: 'hld', name: 'Heavy-light', tier: 4, needs: ['lca', 'lazy'], use: 'Path queries' },
  { id: 'centroid', name: 'Centroid decomposition', tier: 4, needs: ['treedp'], use: 'Paths through a centre' },
  { id: 'persistent', name: 'Persistent trees', tier: 4, needs: ['lazy'], use: 'Queries on past versions' },
  { id: 'sufarr', name: 'Suffix array', tier: 4, needs: ['hash', 'kmp'], use: 'All substrings, sorted' },
  { id: 'geom', name: 'Computational geometry', tier: 4, needs: ['sort'], use: 'Cross products, convex hull' },
  { id: 'flow', name: 'Flows and matching', tier: 4, needs: ['dijkstra'], use: 'Cuts and assignments' },
  { id: 'fft', name: 'FFT', tier: 4, needs: ['number', 'combi'], use: 'Fast convolution' },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

export const SKILL_LEVELS = [
  { v: 0, name: 'Not yet' },
  { v: 1, name: 'Read about it' },
  { v: 2, name: 'Can code it' },
  { v: 3, name: 'Contest ready' },
] as const;

export interface SkillState {
  level: number;
  /** When you last touched it. */
  on: string | null;
}
export type Skills = Record<string, SkillState>;

export function normaliseSkills(v: unknown): Skills {
  if (!v || typeof v !== 'object') return {};
  const out: Skills = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const s = raw as Partial<SkillState> | null;
    if (topicById(k) && s && typeof s.level === 'number') out[k] = { level: Math.max(0, Math.min(3, s.level)), on: typeof s.on === 'string' ? s.on : null };
  }
  return out;
}

const levelOf = (s: Skills, id: string) => s[id]?.level ?? 0;

/** Its foundations are at least code-able. */
export const isUnlocked = (t: Topic, s: Skills) => t.needs.every((n) => levelOf(s, n) >= 2);

/** What to work on next: unlocked and not yet contest-ready; earliest tier first, then least recently touched. */
export function nextTopics(s: Skills, limit = 3): Topic[] {
  return TOPICS.filter((t) => levelOf(s, t.id) < 3 && isUnlocked(t, s))
    .sort((a, b) => a.tier - b.tier || levelOf(s, a.id) - levelOf(s, b.id) || (s[a.id]?.on ?? '').localeCompare(s[b.id]?.on ?? ''))
    .slice(0, limit);
}

/** Share of a tier that's at least code-able. */
export function tierProgress(s: Skills, tier: TopicTier): { done: number; total: number } {
  const list = TOPICS.filter((t) => t.tier === tier);
  return { done: list.filter((t) => levelOf(s, t.id) >= 2).length, total: list.length };
}
