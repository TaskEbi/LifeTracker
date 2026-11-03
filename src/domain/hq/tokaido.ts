/**
 * 東海道, the Tōkaidō: run the old road from Edo to Kyoto. Every kilometre you log moves you along
 * the 53 stations of the road Hiroshige painted. Distances are worked out from the traditional ri
 * between the post towns, so they're close to the old road, not to today's. It includes the seven-ri
 * crossing by boat from Miya to Kuwana, which you'll have to run.
 */

export interface Station {
  n: number;
  name: string;
  ja: string;
  /** From Nihonbashi. */
  km: number;
  note?: string;
}

export const STATIONS: Station[] = [
  { n: 0, name: 'Nihonbashi', ja: '日本橋', km: 0, note: 'Edo. Every road in Japan is measured from this bridge.' },
  { n: 1, name: 'Shinagawa', ja: '品川', km: 7.9 },
  { n: 2, name: 'Kawasaki', ja: '川崎', km: 17.7 },
  { n: 3, name: 'Kanagawa', ja: '神奈川', km: 27.5 },
  { n: 4, name: 'Hodogaya', ja: '保土ヶ谷', km: 32.4 },
  { n: 5, name: 'Totsuka', ja: '戸塚', km: 41.2, note: 'About a marathon out of Edo. Travellers often spent their first night here.' },
  { n: 6, name: 'Fujisawa', ja: '藤沢', km: 49.0 },
  { n: 7, name: 'Hiratsuka', ja: '平塚', km: 62.7 },
  { n: 8, name: 'Ōiso', ja: '大磯', km: 65.6 },
  { n: 9, name: 'Odawara', ja: '小田原', km: 81.3, note: 'The castle town at the foot of the Hakone pass.' },
  { n: 10, name: 'Hakone', ja: '箱根', km: 97.8, note: 'The hardest climb on the road, with a guard post at the top.' },
  { n: 11, name: 'Mishima', ja: '三島', km: 112.6 },
  { n: 12, name: 'Numazu', ja: '沼津', km: 118.5 },
  { n: 13, name: 'Hara', ja: '原', km: 124.4, note: 'Mount Fuji fills the sky from here.' },
  { n: 14, name: 'Yoshiwara', ja: '吉原', km: 136.2 },
  { n: 15, name: 'Kanbara', ja: '蒲原', km: 147.3, note: 'Hiroshige painted it under snow, in a town where it hardly ever snows.' },
  { n: 16, name: 'Yui', ja: '由比', km: 151.2, note: 'Satta Pass, with the road’s most famous view of Fuji over the sea.' },
  { n: 17, name: 'Okitsu', ja: '興津', km: 160.4 },
  { n: 18, name: 'Ejiri', ja: '江尻', km: 164.5 },
  { n: 19, name: 'Fuchū', ja: '府中', km: 175.0 },
  { n: 20, name: 'Mariko', ja: '鞠子', km: 180.6, note: 'Famous for its grated yam soup, then and now.' },
  { n: 21, name: 'Okabe', ja: '岡部', km: 188.4 },
  { n: 22, name: 'Fujieda', ja: '藤枝', km: 195.1 },
  { n: 23, name: 'Shimada', ja: '島田', km: 203.8, note: 'The Ōi river had no bridge. You were carried across on someone’s shoulders.' },
  { n: 24, name: 'Kanaya', ja: '金谷', km: 207.7 },
  { n: 25, name: 'Nissaka', ja: '日坂', km: 214.2 },
  { n: 26, name: 'Kakegawa', ja: '掛川', km: 221.3 },
  { n: 27, name: 'Fukuroi', ja: '袋井', km: 230.9, note: 'The exact middle station of the 53.' },
  { n: 28, name: 'Mitsuke', ja: '見附', km: 236.7 },
  { n: 29, name: 'Hamamatsu', ja: '浜松', km: 253.1 },
  { n: 30, name: 'Maisaka', ja: '舞阪', km: 264.1 },
  { n: 31, name: 'Arai', ja: '新居', km: 270.0 },
  { n: 32, name: 'Shirasuka', ja: '白須賀', km: 276.5 },
  { n: 33, name: 'Futagawa', ja: '二川', km: 282.3 },
  { n: 34, name: 'Yoshida', ja: '吉田', km: 288.4 },
  { n: 35, name: 'Goyu', ja: '御油', km: 298.6 },
  { n: 36, name: 'Akasaka', ja: '赤坂', km: 300.3, note: 'The two closest stations on the road. A breather.' },
  { n: 37, name: 'Fujikawa', ja: '藤川', km: 309.1 },
  { n: 38, name: 'Okazaki', ja: '岡崎', km: 315.7 },
  { n: 39, name: 'Chiryū', ja: '池鯉鮒', km: 330.7 },
  { n: 40, name: 'Narumi', ja: '鳴海', km: 341.7 },
  { n: 41, name: 'Miya', ja: '宮', km: 348.2, note: 'The road ended at the sea. Travellers took a boat from here.' },
  { n: 42, name: 'Kuwana', ja: '桑名', km: 375.7, note: 'Seven ri across the bay, on foot this time.' },
  { n: 43, name: 'Yokkaichi', ja: '四日市', km: 388.3 },
  { n: 44, name: 'Ishiyakushi', ja: '石薬師', km: 399.0 },
  { n: 45, name: 'Shōno', ja: '庄野', km: 401.7 },
  { n: 46, name: 'Kameyama', ja: '亀山', km: 409.5 },
  { n: 47, name: 'Seki', ja: '関', km: 415.4 },
  { n: 48, name: 'Sakashita', ja: '坂下', km: 421.9, note: 'The Suzuka pass, the last big climb.' },
  { n: 49, name: 'Tsuchiyama', ja: '土山', km: 431.7 },
  { n: 50, name: 'Minakuchi', ja: '水口', km: 442.2 },
  { n: 51, name: 'Ishibe', ja: '石部', km: 455.9 },
  { n: 52, name: 'Kusatsu', ja: '草津', km: 467.7 },
  { n: 53, name: 'Ōtsu', ja: '大津', km: 482.1, note: 'The last station, on Lake Biwa.' },
  { n: 54, name: 'Kyoto', ja: '京都', km: 493.9, note: 'Sanjō Bridge. You’ve run from Edo to Kyoto.' },
];

export const ROAD_KM = STATIONS[STATIONS.length - 1].km;

export interface Journey {
  /** How many times you've reached Kyoto. */
  trips: number;
  /** Distance on the current trip. */
  km: number;
  last: Station;
  next: Station | null;
  toNext: number;
  /** Stations reached on this trip (not counting the bridge you left from). */
  passed: number;
  pct: number;
}

export function journey(totalKm: number): Journey {
  const trips = Math.floor(totalKm / ROAD_KM);
  const km = totalKm - trips * ROAD_KM;
  const idx = STATIONS.reduce((best, s, i) => (s.km <= km ? i : best), 0);
  const last = STATIONS[idx];
  const next = STATIONS[idx + 1] ?? null;
  return { trips, km, last, next, toNext: next ? Math.round((next.km - km) * 10) / 10 : 0, passed: idx, pct: km / ROAD_KM };
}
