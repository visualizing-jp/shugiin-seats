/**
 * 得票と議席の組み立て。色は配色ルール（lib/data/palette.ts）から受け取る。
 */

import type { EraJson, System } from "../../lib/data/cube.ts";
import { MINOR } from "../../lib/data/palette.ts";
import { election } from "./format.ts";
import type { Palette } from "./load.ts";

export const SYSTEMS: System[] = ["smd", "pr"];
export const SYSTEM_LABEL: Record<System, string> = { smd: "小選挙区", pr: "比例代表" };

export const OTHER = "その他";

/** 無所属・諸派は「その他」に混ぜず、いつも独立した系列として一番上に置く。 */
export const TRAILING = ["諸派", "無所属"];

export interface Result {
  votes: number;
  seats: number;
  /** 得票 ÷ 有効投票数。 */
  voteShare: number;
  /** 議席 ÷ 定数。 */
  seatShare: number;
}

/** 回 e・党 i の結果。その制度で届出がなければ null。 */
export function resultOf(era: EraJson, system: System, i: number, e: number): Result | null {
  const cube = era[system];
  const votes = cube.votes[i]![e];
  if (votes === null || votes === undefined) return null;
  const seats = cube.seats[i]![e]!;
  return {
    votes,
    seats,
    voteShare: votes / cube.totals[e]!,
    seatShare: seats / election(era.elections[e]!).seats[system],
  };
}

/** その回に届出のあった党の結果。 */
export function resultsAt(era: EraJson, system: System, e: number): { party: string; r: Result }[] {
  return era.parties.flatMap((party, i) => {
    const r = resultOf(era, system, i, e);
    return r === null ? [] : [{ party, r }];
  });
}

export interface PartyRow {
  party: string;
  smd: Result | null;
  pr: Result | null;
}

/** その回にどちらかの制度で届出のあった党。議席の合計が多い順、同じなら得票率の合計が大きい順。諸派・無所属は最後。 */
export function rowsAt(era: EraJson, e: number): PartyRow[] {
  const total = (r: PartyRow) => (r.smd?.seats ?? 0) + (r.pr?.seats ?? 0);
  const votes = (r: PartyRow) => (r.smd?.voteShare ?? 0) + (r.pr?.voteShare ?? 0);
  const rank = (r: PartyRow) => TRAILING.indexOf(r.party);
  return era.parties
    .map((party, i) => ({ party, smd: resultOf(era, "smd", i, e), pr: resultOf(era, "pr", i, e) }))
    .filter((r) => r.smd !== null || r.pr !== null)
    .sort((a, b) => rank(a) - rank(b) || total(b) - total(a) || votes(b) - votes(a));
}

/** 「その他」にまとめない党。この制度で全国の得票率か議席率が一度でも MINOR に届いた党。 */
export function majorParties(era: EraJson, system: System): Set<string> {
  return new Set(
    era.parties.filter(
      (p, i) =>
        TRAILING.includes(p) ||
        era.elections.some((_, e) => {
          const r = resultOf(era, system, i, e);
          return r !== null && (r.voteShare >= MINOR || r.seatShare >= MINOR);
        }),
    ),
  );
}

export interface Flow {
  key: string;
  voteShare: number;
  seatShare: number;
  votes: number;
  seats: number;
  color: string;
  /** 他の党を強調しているときの色。 */
  faded: string;
}

/**
 * 1回・1制度の得票と議席の積み上げ（下から）。主要な党 → 選択中の小党 → その他 → 諸派・無所属。
 * 得票側と議席側で同じ並びにするので、党の帯が交差しない。
 */
export function flows(era: EraJson, system: System, e: number, major: Set<string>, selected: string, palette: Palette): Flow[] {
  const flow = (key: string, r: Result): Flow => {
    const c = palette(key);
    return { key, ...r, color: c.base, faded: c.faded };
  };
  const main: Flow[] = [];
  const trailing: Flow[] = [];
  let pickedMinor: Flow | null = null;
  const other: Result = { votes: 0, seats: 0, voteShare: 0, seatShare: 0 };
  for (const { party, r } of resultsAt(era, system, e)) {
    if (TRAILING.includes(party)) trailing.push(flow(party, r));
    else if (major.has(party)) main.push(flow(party, r));
    else if (party === selected) pickedMinor = flow(party, r);
    else {
      other.votes += r.votes;
      other.seats += r.seats;
      other.voteShare += r.voteShare;
      other.seatShare += r.seatShare;
    }
  }
  return [
    ...main,
    ...(pickedMinor === null ? [] : [pickedMinor]),
    ...(other.votes > 0 ? [flow(OTHER, other)] : []),
    ...trailing,
  ];
}

/**
 * 票と議席のずれの大きさ（Gallagher の最小二乗指数）。√(½ Σ (得票率 − 議席率)²)。
 * 党ごとに数え、諸派・無所属はそれぞれ1つの党とみなす。
 * 出典: Gallagher, M. (1991). Proportionality, disproportionality and electoral systems. Electoral Studies, 10(1), 33–51.
 */
export function gallagher(era: EraJson, system: System, e: number): number {
  const sq = resultsAt(era, system, e).reduce((a, { r }) => a + (r.voteShare - r.seatShare) ** 2, 0);
  return Math.sqrt(sq / 2);
}
