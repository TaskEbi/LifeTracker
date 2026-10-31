/**
 * Ideas like yours: a hand of six from the idea library, picked to match the list. Tap + to add
 * one to its section; Shuffle deals a new hand. Nothing goes on the list until it is tapped.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import type { LtBucket } from '../../data/types';
import { toast } from '../../data/ui';
import { suggestIdeas } from '../../domain/bucket/ideas';
import { bucketSection, type BucketSectionId } from '../../domain/bucket/sections';
import { Icon } from '../../ui/i/Icon';
import { addBucket } from './actions';

export function Ideas({ items, section }: { items: LtBucket[]; section: BucketSectionId | null }) {
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / 86_400_000));
  const [leaving, setLeaving] = useState<string | null>(null);
  const hand = useMemo(() => suggestIdeas(items, { n: 6, seed, section }), [items, seed, section]);
  const where = section ? bucketSection(section) : null;

  const take = (title: string, cat: BucketSectionId) => {
    if (leaving) return;
    setLeaving(title);
    window.setTimeout(() => {
      setLeaving(null);
      const { added } = addBucket([title], { cat });
      const s = bucketSection(cat);
      toast(added.length ? `Added to ${s.kanji} ${s.name}` : 'Already on your list');
    }, 260);
  };

  return (
    <section className="bk-ideas" aria-labelledby="bk-ideas-h">
      <div className="bk-ideas__top">
        <h2 id="bk-ideas-h" className="bk-h2">
          <span aria-hidden="true">閃</span> {where ? `Ideas for ${where.name.toLowerCase()}` : 'Ideas like yours'}
        </h2>
        <button type="button" className="bk-ideas__shuffle" onClick={() => setSeed((s) => s + 1)} disabled={!hand.length}>
          <span aria-hidden="true">↻</span> Shuffle
        </button>
      </div>
      {hand.length ? (
        <ul className="bk-ideas__deck" key={seed} aria-label="Ideas">
          {hand.map((idea, i) => {
            const s = bucketSection(idea.section);
            return (
              <li key={idea.title} className={`bk-idea${leaving === idea.title ? ' is-leaving' : ''}`} style={{ '--sc': s.color, '--i': i } as CSSProperties}>
                <span className="bk-idea__k" aria-hidden="true">
                  {s.kanji}
                </span>
                <b>{idea.title}</b>
                <small>{idea.like ? `like “${idea.like}”` : `more ${s.short.toLowerCase()}`}</small>
                <button type="button" className="bk-idea__add" onClick={() => take(idea.title, idea.section)} aria-label={`Add idea: ${idea.title}`}>
                  <Icon name="plus" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="i-note">You’ve taken every idea here. Your own are better anyway.</p>
      )}
    </section>
  );
}
