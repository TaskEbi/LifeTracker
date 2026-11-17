/**
 * A bot that plays the Cosmos and logs when each layer is first reached. Not part of the normal
 * test run: `COSMOS_BOT=1 npx vitest run cosmos.bot --silent=false`. Use it before moving any
 * tuning number in cosmos.ts.
 *
 *   COSMOS_BOT_HOURS=80    how long to play
 *   COSMOS_BOT_CASUAL=1    play an hour, then leave the app shut for three (a person, not a machine)
 *   NO_STARS, NO_DAILY, NO_BOUNTY, NO_LAB, NO_ORR=1   leave one of the side systems alone, to see what it adds
 *   COSMOS_BOT_DEBUG=1 (an hourly line), COSMOS_BOT_EARLY=1 (every 10 s for the first two minutes)
 *
 * While playing it buys everything it can every step, taps three times a second until the
 * auto-tapper comes, catches four shooting stars in five, keeps research running, claims bounties
 * and the daily alignment, and resets a layer when doing so would at least double what it holds
 * (or after a while), like the automation does.
 */
import { describe, it } from 'vitest';
import * as C from './cosmos';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const ext = { sections: 1, streak: 3, level: 5 };
const HOURS = Number(env.COSMOS_BOT_HOURS ?? 80);
const CASUAL = !!env.COSMOS_BOT_CASUAL;

describe.skipIf(!env.COSMOS_BOT)('cosmos bot', () => {
  it('plays', () => {
    const t0 = Date.UTC(2026, 10, 1, 8);
    let s = C.freshCosmos(t0);
    const log: string[] = [];
    const seen = new Set<string>();
    const mark = (k: string, t: number) => {
      if (seen.has(k)) return;
      seen.add(k);
      log.push(`${((t - t0) / 3600_000).toFixed(2).padStart(7)} h  ${k}`);
    };
    let chalStart = 0;
    let bestRun = 0;
    let coolUntil = 0;
    let nextStar = t0 + 90_000;
    let rnd = 1;
    const random = () => {
      rnd = (rnd * 16807) % 2147483647;
      return rnd / 2147483647;
    };
    const end = t0 + HOURS * 3600_000;
    let t = t0;
    let playing = 0;
    while (t < end) {
      const h = (t - t0) / 3600_000;
      // Casual: an hour on, three hours shut.
      if (CASUAL && playing >= 3600_000) {
        t += 3 * 3600_000;
        playing = 0;
        s = C.settle(s, t, ext).save;
        nextStar = t + 90_000;
        continue;
      }
      const dt = h < 3 ? 1000 : h < 20 ? 5000 : 15000;
      t += dt;
      playing += dt;
      const rate = C.rateNow(s, ext, t);
      s = C.settle(s, t, ext).save;
      // A person taps three times a second until the auto-tapper comes.
      if (!C.autoTaps(s)) for (let i = 0; i < 3 * (dt / 1000); i++) s = C.tap(s, t, ext, random()).save;
      if (t >= nextStar && !env.NO_STARS) {
        if (random() < 0.8) s = C.catchStar(s, t, ext, random()).save;
        nextStar = t + C.starGap(s) * 1000 * (0.6 + 0.8 * random());
      }
      const day = new Date(t).toISOString().slice(0, 10);
      if (!env.NO_DAILY) s = C.claimDaily(s, day, t) ?? s;
      s = C.fillBoard(s, rate);
      if (!env.NO_BOUNTY) for (const b of [...s.bounties]) s = C.claimBounty(s, b.n, rate) ?? s;
      // Research: the shortest that can start.
      if (!env.NO_LAB) for (const r of [...C.LABS].sort((a, b) => a.mins - b.mins)) s = C.startLab(s, r.id, t) ?? s;
      for (let k = 0; k < (env.NO_ORR ? 0 : 20); k++) {
        const u = [...C.ORRERY].filter((x) => (s.orr[x.id] ?? 0) < x.max).sort((a, b) => C.levelCost(a, s.orr[a.id] ?? 0) - C.levelCost(b, s.orr[b.id] ?? 0))[0];
        const next = u && C.buyOrr(s, u.id);
        if (!next) break;
        s = next;
      }
      // Buy everything.
      s = C.buyEveryUp(s) ?? s;
      s = C.buyAllBodies(s) ?? s;
      for (let pass = 0; pass < 3; pass++) for (const n of C.NODES) s = C.buyNode(s, n.id) ?? s;
      s = C.buyEveryVoid(s) ?? s;
      // Ascensions: save up for Enlightenment once the Second Sun is lit.
      s = C.buyAsc(s, 'twin') ?? C.buyAsc(s, 'bodhi') ?? s;
      for (const a of C.ASCS) if (s.asc.bodhi || s.eon - C.levelCost(a, s.asc[a.id] ?? 0) >= 60) s = C.buyAsc(s, a.id) ?? s;
      for (let k = 0; k < 20; k++) {
        const r = [...C.RELICS].sort((a, b) => C.relicCost(a, s.relics[a.id] ?? 0) - C.relicCost(b, s.relics[b.id] ?? 0)).find((x) => (s.relics[x.id] ?? 0) < C.RELIC_MAX);
        if (!r) break;
        const next = C.buyRelic(s, r.id);
        if (!next) break;
        s = next;
      }
      const pref = ['mirror', 'glass', 'chart', 'lantern', 'crown', 'abacus', 'fork', 'metro', 'vault', 'dice', 'anchor', 'lure', 'compass', 'quill'];
      const want = pref.filter((id) => (s.relics[id] ?? 0) > 0).slice(0, C.relicSlots(s));
      if (want.join() !== s.worn.join()) s = { ...s, worn: want };
      // Challenges: try the easiest tier left when an ordinary run has gone far past its goal; give up after 20 minutes.
      if (s.chal) {
        if (t - chalStart > 1_200_000) {
          s = C.leaveChal(s) ?? s;
          bestRun = 0;
          coolUntil = t + 1_800_000;
        }
      } else if (C.chalsOpen(s) && t > coolUntil) {
        bestRun = Math.max(bestRun, s.runDust);
        const c = C.CHALLENGES.filter((x) => C.chalTier(s, x.id) < C.chalMax(s)).sort((a, b) => C.chalGoal(a, C.chalTier(s, a.id), s) - C.chalGoal(b, C.chalTier(s, b.id), s))[0];
        if (c && C.chalGoal(c, C.chalTier(s, c.id), s) < bestRun ** 0.8) {
          s = C.enterChal(s, c.id, t) ?? s;
          chalStart = t;
        }
      }
      // The Celestial Tree, cheapest first.
      for (let k = 0; k < 30; k++) {
        const u = [...C.TREE].filter((x) => (s.tree[x.id] ?? 0) < x.max).sort((a, b) => C.levelCost(a, s.tree[a.id] ?? 0) - C.levelCost(b, s.tree[b.id] ?? 0))[0];
        const next = u && C.buyTree(s, u.id);
        if (!next) break;
        s = next;
      }
      // The Ladder, highest rung first: climb when it would double what that rung holds, or after a while.
      let climbed = false;
      for (let n = C.LADDER_TO; n >= C.LADDER_FROM && !climbed; n--) {
        const g = C.rungGain(s, n);
        if (g >= 1 && g >= C.rungOf(s, n).run) {
          s = C.climb(s, n, t) ?? s;
          climbed = true;
        }
      }
      for (let n = C.LADDER_FROM; n <= C.LADDER_TO; n++) s = C.buyEveryRungUp(s, n) ?? s;
      // Resets: the highest layer that would double what it pays, or after a while.
      const before = s;
      if (climbed) bestRun = 0;
      else if (C.eonGain(s) >= 1) s = C.transcend(s, t) ?? s;
      else if (C.galGain(s) >= 1 && (C.galGain(s) >= s.galRun || t - s.bangAt > 1_800_000)) s = C.bang(s, t) ?? s;
      else if (C.darkGain(s) >= 1 && (C.darkGain(s) >= s.darkRun || t - s.colAt > 600_000)) s = C.collapse(s, t) ?? s;
      else if (C.lightGain(s) >= 1 && (C.lightGain(s) >= s.lightRun || t - s.runAt > 120_000)) s = C.ignite(s, t) ?? s;
      if (s.collapsesAll !== before.collapsesAll || s.bangsAll !== before.bangsAll) bestRun = 0;
      s = C.check(s).save;
      if (s.ignitesAll >= 1) mark('Ignite 1', t);
      if (s.ignitesAll >= 10) mark('Ignite 10', t);
      if (s.collapsesAll >= 1) mark('Collapse 1', t);
      if (s.collapsesAll >= 10) mark('Collapse 10', t);
      const tiers = Object.values(s.chals).reduce((a, n) => a + n, 0);
      for (const n of [1, 10, 20, 30, 40]) if (tiers >= n) mark(`${n} challenge tiers`, t);
      if (s.nodes.length >= C.NODES.length) mark('whole constellation', t);
      if (s.bangsAll >= 1) mark('Big Bang 1', t);
      if (s.bangsAll >= 10) mark('Big Bang 10', t);
      const relics = Object.keys(s.relics).length;
      if (relics >= 5) mark('5 relics', t);
      if (relics >= C.RELICS.length) mark('every relic', t);
      for (const n of [1, 2, 5, 10, 20]) if (s.transcends >= n) mark(`Transcend ${n}`, t);
      if (s.asc.bodhi) mark('Enlightenment', t);
      for (let n = C.LADDER_FROM; n <= C.LADDER_TO; n++) if (C.rungOf(s, n).nAll >= 1) mark(`layer ${n} (${C.rungDef(n)!.verb})`, t);
      for (const n of [10, 30, 50, 70]) if (s.done.length >= n) mark(`${n} feats`, t);
      for (const n of [5, 10, 20]) if (s.labs.length >= n) mark(`${n} research`, t);
      if (s.labs.length >= C.LABS.length) mark('all research', t);
      for (const n of [50, 200, 500]) if (s.shardsAll >= n) mark(`${n} shards earned`, t);
      if (C.ORRERY.every((u) => (s.orr[u.id] ?? 0) >= u.max)) mark('Orrery complete', t);
      if (env.COSMOS_BOT_LADDER && t - t0 > 12.85 * 3600_000 && t - t0 < 13.2 * 3600_000 && (t - t0) % 60_000 < dt)
        log.push(`${((t - t0) / 3600_000).toFixed(3)}h eonRun ${C.fmt(s.eonRun)} eg ${C.fmt(C.eonGain(s))} alt ${C.fmt(C.altitude(s))} | ` + [5, 6, 7, 8, 9, 10].map((n) => `${n}: c ${C.fmt(C.rungOf(s, n).run)} g ${C.fmt(C.rungGain(s, n))} m ${C.fmt(C.rungMult(s, n))} need ${C.fmt(C.rungNeed(n))} ups ${C.rungOf(s, n).ups.join('/')}`).join(' | '));
      if (env.COSMOS_BOT_EARLY && t - t0 <= 120_000 && (t - t0) % 10_000 === 0) log.push(`${(t - t0) / 1000}s run ${C.fmt(s.runDust)} rate ${C.fmt(C.rateNow(s, ext, t))} tap ${C.fmt(C.tapValue(s, ext, t))} shards ${s.shards} orr ${JSON.stringify(s.orr)} ups ${JSON.stringify(s.ups)} parts ${C.dustParts(s, ext, t).filter((p) => p.mult > 1).map((p) => `${p.name}=${C.fmt(p.mult)}`).join(",")} bounties ${s.bountiesDone}`);
      if (env.COSMOS_BOT_DEBUG && Math.floor((t - dt - t0) / 3600_000) !== Math.floor((t - t0) / 3600_000))
        log.push(`h${Math.round(h)} dust ${C.fmt(s.runDust)} light ${C.fmt(s.lightRun)} lg ${C.fmt(C.lightGain(s))} dark ${C.fmt(s.darkRun)} dg ${C.fmt(C.darkGain(s))} gal ${C.fmt(s.galRun)} gg ${C.fmt(C.galGain(s))} chal ${s.chal} col ${s.collapsesAll} ig ${s.ignitesAll} shards ${s.shardsAll}`);
    }
    log.push(`top ${C.topLayer(s)}, cores ${C.coresEarned(s)}, tree ${JSON.stringify(s.tree)}, ladder ${s.ladder.map((r) => `${r.nAll}:${C.fmt(r.run)}`).join(' ')}`);
    log.push(`transcends ${s.transcends}, eon ${s.eon}/${s.eonAll}, asc ${JSON.stringify(s.asc)}, need ${C.fmt(C.needTranscend(s))}, galRun ${C.fmt(s.galRun)}`);
    log.push(`feats ${s.done.length}/${C.FEATS.length}, research ${s.labs.length}/${C.LABS.length}, shards ${s.shardsAll}, bounties ${s.bountiesDone}, stars ${s.caught}, tiers ${JSON.stringify(s.chals)}, orrery ${JSON.stringify(s.orr)}`);
    console.log(log.join('\n'));
  });
});
