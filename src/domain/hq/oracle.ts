/**
 * 神託, the oracle: write down what you think will happen and how sure you are, then find out how
 * good your judgement is. Rows are lt_records (kind `hq_prediction`). Scored with the Brier score
 * (0 is perfect, 0.25 is what always saying 50% gets) and a calibration curve.
 */
import type { LtRecord } from '../../data/types';

export interface Prediction {
  id: string;
  claim: string;
  /** How sure, 50–99%. */
  confidence: number;
  by: string;
  madeOn: string;
  outcome: boolean | null;
  resolvedOn: string | null;
  note: string;
}

export const CONFIDENCES = [50, 60, 70, 80, 90, 95, 99];

export function predictionOf(r: LtRecord): Prediction | null {
  if (r.deleted_at || r.kind !== 'hq_prediction') return null;
  const d = r.data;
  if (typeof d.claim !== 'string' || typeof d.by !== 'string') return null;
  return {
    id: r.id,
    claim: d.claim,
    confidence: typeof d.confidence === 'number' ? Math.max(50, Math.min(99, d.confidence)) : 60,
    by: d.by,
    madeOn: typeof d.madeOn === 'string' ? d.madeOn : r.created_at.slice(0, 10),
    outcome: d.outcome === true || d.outcome === false ? d.outcome : null,
    resolvedOn: typeof d.resolvedOn === 'string' ? d.resolvedOn : null,
    note: typeof d.note === 'string' ? d.note : '',
  };
}

export const isDue = (p: Prediction, today: string) => p.outcome == null && p.by <= today;

export interface CalibrationBin {
  /** e.g. 70 for 70–79%. */
  from: number;
  to: number;
  n: number;
  /** What you said on average. */
  said: number;
  /** How often it happened. */
  hit: number;
}

export interface Calibration {
  n: number;
  brier: number | null;
  bins: CalibrationBin[];
  /** Average confidence minus hit rate, in points: above 0 means too sure. */
  bias: number | null;
  verdict: string;
}

const BINS: [number, number][] = [[50, 59], [60, 69], [70, 79], [80, 89], [90, 99]];
export const MIN_FOR_VERDICT = 5;

export function calibration(all: Prediction[]): Calibration {
  const done = all.filter((p) => p.outcome != null);
  if (!done.length) return { n: 0, brier: null, bins: [], bias: null, verdict: 'Nothing resolved yet. The first few are the hardest to write down.' };
  const brier = done.reduce((s, p) => s + (p.confidence / 100 - (p.outcome ? 1 : 0)) ** 2, 0) / done.length;
  const bins = BINS.map(([from, to]) => {
    const list = done.filter((p) => p.confidence >= from && p.confidence <= to);
    return {
      from,
      to,
      n: list.length,
      said: list.length ? list.reduce((s, p) => s + p.confidence, 0) / list.length : 0,
      hit: list.length ? (list.filter((p) => p.outcome).length / list.length) * 100 : 0,
    };
  }).filter((b) => b.n > 0);
  const said = done.reduce((s, p) => s + p.confidence, 0) / done.length;
  const hit = (done.filter((p) => p.outcome).length / done.length) * 100;
  const bias = said - hit;
  let verdict: string;
  if (done.length < MIN_FOR_VERDICT) verdict = `${MIN_FOR_VERDICT - done.length} more resolved before it’s worth reading anything into this.`;
  else if (bias > 10) verdict = `Too sure of yourself: you say ${Math.round(said)}% and it happens ${Math.round(hit)}% of the time.`;
  else if (bias < -10) verdict = `Too modest: you say ${Math.round(said)}% and it happens ${Math.round(hit)}% of the time.`;
  else verdict = `Well calibrated: you say ${Math.round(said)}% and it happens ${Math.round(hit)}% of the time.`;
  return { n: done.length, brier, bins, bias, verdict };
}
