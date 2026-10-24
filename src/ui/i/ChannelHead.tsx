import { useProgress, useSectionStreaks } from '../../data/lt';
import type { SectionId } from '../../data/types';
import { sectionInfo } from '../../domain/sections';
import { sectionRankFor } from '../../domain/progress/engine';
import { ChannelBar } from '../../app/Shell';
import { accent, Seg } from './bits';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Channel strip (phone) and the section's heading: code, name, level, streak. */
export function ChannelHead({ id, sub }: { id: SectionId; sub?: string }) {
  const info = sectionInfo(id);
  const lv = useProgress().sections[id];
  const streak = useSectionStreaks()[id];
  return (
    <>
      <ChannelBar current={id} />
      <header className="i-chhead" style={accent(id)}>
        <div>
          <span className="i-chhead__k">
            {info.code} · {sub ?? info.sub}
          </span>
          <h1>{info.full}</h1>
          <span className="i-chhead__rank">{sectionRankFor(lv.level)}</span>
          {streak && streak.n > 0 && (
            <p className="i-chhead__sub">
              {streak.n} {streak.label}
            </p>
          )}
        </div>
        <div className="i-chhead__lv">
          LVL<b>{pad2(lv.level)}</b>
          {lv.into}/{lv.need} XP
        </div>
        <Seg pct={lv.pct} label={`${info.full} level progress`} />
      </header>
    </>
  );
}
