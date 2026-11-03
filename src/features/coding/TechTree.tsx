/** /coding/tree: every topic on the road to IOI, what rests on what, and what to learn next. */
import { useMemo } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { navigate } from '../../app/router';
import { prefValue, setPref, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { isUnlocked, nextTopics, normaliseSkills, SKILL_LEVELS, TIER_NAME, tierProgress, topicById, TOPICS, type Skills, type Topic, type TopicTier } from '../../domain/hq/techTree';
import { relativeDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, H2, Picks, Seg, Source } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Sheet } from '../../ui/i/Sheet';
import { CodingArt } from './Art';
import './tree.css';

const useSkills = (): Skills => {
  const st = useStore(data, (s) => s.lt_prefs);
  return useMemo(() => normaliseSkills(st.get('tech_tree')?.deleted_at ? undefined : st.get('tech_tree')?.value), [st]);
};

function TopicSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const skills = useSkills();
  const t = topicById(spec.id as string)!;
  const s = skills[t.id];
  const set = (level: string) => setPref('tech_tree', { ...normaliseSkills(prefValue(data.get(), 'tech_tree')), [t.id]: { level: Number(level), on: today } });
  return (
    <Sheet title={t.name} onClose={closeSheet} accent="coding" footer={<button type="button" className="i-btn i-btn--sig i-btn--block" onClick={closeSheet}>Done</button>}>
      <p className="i-note">{t.use}.</p>
      <Picks label="How well do you know it" value={String(s?.level ?? 0)} onChange={set} options={SKILL_LEVELS.map((l) => ({ id: String(l.v), label: l.name }))} />
      {t.needs.length > 0 && (
        <p className="i-note">
          Rests on: {t.needs.map((n) => `${topicById(n)!.name}${(skills[n]?.level ?? 0) >= 2 ? ' ✓' : ''}`).join(', ')}
        </p>
      )}
      {s?.on && <p className="i-note">Last touched: {relativeDay(s.on, today)}</p>}
      <p className="i-note">“Can code it” means from a blank file, without looking it up. “Contest ready” means you spot when to use it.</p>
    </Sheet>
  );
}
registerSheet('tech-topic', TopicSheet);

function Node({ t, skills }: { t: Topic; skills: Skills }) {
  const level = skills[t.id]?.level ?? 0;
  const open = isUnlocked(t, skills);
  return (
    <button type="button" className={`tt-node is-l${level}${open ? '' : ' is-locked'}`} onClick={() => openSheet({ type: 'tech-topic', id: t.id })} aria-label={`${t.name}: ${SKILL_LEVELS[level].name}${open ? '' : ', foundations not there yet'}`}>
      <span className="tt-node__pips" aria-hidden="true">
        {[1, 2, 3].map((v) => (
          <i key={v} className={level >= v ? 'is-on' : ''} />
        ))}
      </span>
      {t.name}
    </button>
  );
}

export function TechTree() {
  const skills = useSkills();
  const next = useMemo(() => nextTopics(skills), [skills]);
  const tiers = [1, 2, 3, 4] as TopicTier[];
  return (
    <div style={accent('coding')}>
      <ChannelHead id="coding" sub="tech tree" art={<CodingArt />} />
      <button type="button" className="i-link" onClick={() => navigate('coding')}>
        ◀ Back to the road
      </button>
      <H2 aside="foundations first">Learn next</H2>
      <div className="i-pnl i-pnl--flush">
        {next.map((t) => (
          <button key={t.id} type="button" className="i-row" onClick={() => openSheet({ type: 'tech-topic', id: t.id })}>
            <span className="i-row__t">
              <b>{t.name}</b>
              <small>{t.use}</small>
            </span>
            <span className="i-tag">{TIER_NAME[t.tier]}</span>
          </button>
        ))}
        {!next.length && <p className="i-note" style={{ padding: '12px 0' }}>Everything open is contest ready. Go and win something.</p>}
      </div>
      {tiers.map((tier) => {
        const p = tierProgress(skills, tier);
        return (
          <section key={tier} aria-label={TIER_NAME[tier]}>
            <H2 aside={`${p.done}/${p.total}`}>{TIER_NAME[tier]}</H2>
            <Seg pct={p.done / p.total} n={p.total} thin label={`${TIER_NAME[tier]} progress`} />
            <div className="tt-grid">
              {TOPICS.filter((t) => t.tier === tier).map((t) => (
                <Node key={t.id} t={t} skills={skills} />
              ))}
            </div>
          </section>
        );
      })}
      <Source kind="off">Your own rating, one tap each. The tiers are a rough guide to the usual order of learning, not an official syllabus.</Source>
    </div>
  );
}
