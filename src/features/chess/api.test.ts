import { describe, expect, it } from 'vitest';
import { parseGame, parseStats, timeByDay } from './api';

const pgn = '[UTCDate "2026.10.23"]\n[StartTime "13:26:21"]\n[EndDate "2026.10.23"]\n[EndTime "13:33:14"]\n\n1. d4';
const raw = (over: Record<string, unknown> = {}) => ({
  url: 'https://www.chess.com/game/live/1',
  end_time: 1792762394,
  time_control: '180+2',
  time_class: 'blitz',
  rules: 'chess',
  rated: true,
  pgn,
  eco: 'https://www.chess.com/openings/English-Defense',
  white: { username: 'GM_TaskTaskPro', rating: 1158, result: 'checkmated' },
  black: { username: 'rav_1000', rating: 653, result: 'win' },
  ...over,
});

describe('chess.com parsing', () => {
  it('reads ratings by time control', () => {
    const s = parseStats({ chess_rapid: { last: { rating: 1445 }, best: { rating: 1571 }, record: { win: 375, loss: 346, draw: 34 } }, chess_blitz: { last: { rating: 1158 } }, tactics: { highest: { rating: 2007 } }, puzzle_rush: { best: { score: 31 } } });
    expect(s.ratings.map((r) => [r.tc, r.rating])).toEqual([['rapid', 1445], ['blitz', 1158]]);
    expect(s).toMatchObject({ tactics: 2007, rush: 31 });
  });

  it('reads a game from my side, with its length from the PGN', () => {
    const g = parseGame(raw(), 'gm_tasktaskpro')!;
    expect(g).toMatchObject({ white: true, result: 'loss', rating: 1158, opponent: 'rav_1000', seconds: 413, opening: 'English Defense' });
    expect(parseGame(raw({ white: { username: 'rav_1000', rating: 700, result: 'repetition' }, black: { username: 'gm_tasktaskpro', rating: 1100, result: 'repetition' } }), 'GM_TaskTaskPro')?.result).toBe('draw');
    expect(parseGame(raw(), 'someone_else')).toBeNull();
    expect(parseGame(raw({ rules: 'chess960' }), 'gm_tasktaskpro')).toBeNull();
    expect(parseGame(raw({ time_class: 'daily' }), 'gm_tasktaskpro')?.seconds).toBeNull();
  });

  it('adds up live game time per day', () => {
    const g = parseGame(raw(), 'gm_tasktaskpro')!;
    const out = timeByDay([g, g], (iso) => iso.slice(0, 10));
    expect([...out]).toEqual([['2026-10-23', { seconds: 826, games: 2 }]]);
  });
});

describe('opening names', () => {
  it('drops the move list chess.com appends', () => {
    const g = parseGame({ rules: 'chess', time_class: 'blitz', eco: 'https://www.chess.com/openings/Caro-Kann-Defense-Two-Knights-Line...6.Bb5-Nc6', white: { username: 'me', result: 'win' }, black: { username: 'x', result: 'resigned' } }, 'me');
    expect(g?.opening).toBe('Caro Kann Defense Two Knights Line');
  });
});
