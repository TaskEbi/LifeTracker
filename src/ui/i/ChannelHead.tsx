import type { ReactNode } from 'react';
import { useProgress, useSectionStreaks } from '../../data/lt';
import type { SectionId } from '../../data/types';
import { sectionInfo } from '../../domain/sections';
import { sectionRankFor } from '../../domain/progress/engine';
import { ChannelBar } from '../../app/Shell';
import { navigate } from '../../app/router';
import { accent, Seg } from './bits';
import { Icon } from './Icon';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** The way out of every section: same place, same words, whatever the section looks like. */
export function HomeLink() {
  return (
    <button type="button" className="i-home" onClick={() => navigate('home')}>
      <Icon name="left" size={18} />
      <span>Home</span>
    </button>
  );
}

/**
 * Channel strip (phone) and the section's heading: way home, name, level, streak. `art` is the
 * section's own illustration (features/<section>/Art.tsx), drawn behind the heading.
 */
export function ChannelHead({ id, sub, art }: { id: SectionId; sub?: string; art?: ReactNode }) {
  const info = sectionInfo(id);
  const lv = useProgress().sections[id];
  const streak = useSectionStreaks()[id];
  return (
    <>
      <ChannelBar current={id} />
      <header className="i-chhead" style={accent(id)}>
        {art ?? <span className="i-chhead__art" aria-hidden="true" />}
        <span className="i-chhead__kanji" aria-hidden="true">
          {info.kanji}
        </span>
        <HomeLink />
        <div className="i-chhead__t">
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
