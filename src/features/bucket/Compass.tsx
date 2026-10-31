/**
 * The dream compass: one spoke per bucket-list section, the gold shape is how much is on the
 * list there, the red one how much is crossed off. Empty spokes are the unexplored directions.
 */
import { BUCKET_SECTIONS, type BucketSectionId } from '../../domain/bucket/sections';

const R = 74;
const C = 100;

export function Compass({ counts }: { counts: Map<BucketSectionId, { open: number; done: number }> }) {
  const n = BUCKET_SECTIONS.length;
  const max = Math.max(1, ...[...counts.values()].map((c) => c.open + c.done));
  const at = (i: number, r: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  };
  // a little off the centre even at zero, so the shape stays a shape
  const shape = (v: (id: BucketSectionId) => number) =>
    BUCKET_SECTIONS.map((s, i) => at(i, 6 + (R - 6) * Math.sqrt(v(s.id) / max)).map((p) => p.toFixed(1)).join(',')).join(' ');
  const total = (id: BucketSectionId) => (counts.get(id)?.open ?? 0) + (counts.get(id)?.done ?? 0);
  const done = (id: BucketSectionId) => counts.get(id)?.done ?? 0;
  const label = BUCKET_SECTIONS.filter((s) => total(s.id))
    .map((s) => `${s.name} ${total(s.id)}`)
    .join(', ');
  return (
    <svg className="bk-compass" viewBox="0 0 200 200" role="img" aria-label={`Dream compass: ${label || 'empty'}`}>
      {[0.34, 0.67, 1].map((f) => (
        <polygon key={f} className="bk-compass__ring" points={BUCKET_SECTIONS.map((_, i) => at(i, R * f).join(',')).join(' ')} />
      ))}
      {BUCKET_SECTIONS.map((s, i) => {
        const [x, y] = at(i, R);
        return <line key={s.id} className="bk-compass__spoke" x1={C} y1={C} x2={x} y2={y} />;
      })}
      <polygon className="bk-compass__all" points={shape(total)} />
      <polygon className="bk-compass__done" points={shape(done)} />
      {BUCKET_SECTIONS.map((s, i) => {
        const [x, y] = at(i, R + 15);
        const on = total(s.id) > 0;
        return (
          <text key={s.id} x={x} y={y} className={`bk-compass__k${on ? '' : ' is-off'}`} style={{ fill: on ? s.color : undefined }} textAnchor="middle" dominantBaseline="central">
            {s.kanji}
          </text>
        );
      })}
      <circle cx={C} cy={C} r="3" className="bk-compass__hub" />
    </svg>
  );
}
