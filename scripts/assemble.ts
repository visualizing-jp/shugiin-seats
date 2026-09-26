/**
 * 兄弟サイトの配信データと第41〜43回の手起こしから、制度 × 回 × 党の得票と議席を組み立てる。
 * build.ts（配信データを書く）と verify.ts（突き合わせる）が同じ組み立てを使う。
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { EraJson, System, SystemCube } from "../src/lib/data/cube.ts";
import { ELECTIONS, FIRST_SIBLING_SEATS } from "../src/lib/data/elections.ts";
import { siblingPath, type Sibling } from "./fetch-data.ts";

const MANUAL = resolve(import.meta.dirname, "../data/seats-41-43.json");

/** election-shugiin-timeseries の era.json。votes[党][回]、届出のない回は null。 */
interface VotesJson {
  elections: number[];
  smd: { parties: string[]; totals: number[]; votes: (number | null)[][] };
  pr: { parties: string[]; totals: number[]; votes: (number | null)[][] };
}

/** shugiin-candidates の national.json。counts.win[制度][党][回] は [新男, 新女, 前男, 前女, 元男, 元女]。 */
interface WinnersJson {
  elections: number[];
  parties: string[];
  counts: { win: Record<System, number[][][]> };
}

interface ManualJson {
  elections: Record<string, Record<System, Record<string, number>>>;
}

export const SYSTEMS: System[] = ["smd", "pr"];

/** 積み上げの一番上に置く。 */
const LAST = ["諸派", "無所属"];

const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;
const sibling = <T>(site: Sibling, file: string) => readJson<T>(siblingPath(site, file));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export async function readHues(): Promise<Record<string, number>> {
  return sibling<Record<string, number>>("timeseries", "palette");
}

/** 回 → 党 → 議席。第44回からは兄弟サイトの当選人数、それより前は手起こし。 */
function seatsOf(n: number, system: System, winners: WinnersJson, manual: ManualJson): Map<string, number> {
  if (n < FIRST_SIBLING_SEATS) {
    const m = manual.elections[String(n)]?.[system];
    if (m === undefined) throw new Error(`第${n}回 ${system}: 手起こしの議席がない`);
    return new Map(Object.entries(m));
  }
  const e = winners.elections.indexOf(n);
  if (e < 0) throw new Error(`第${n}回: 兄弟サイトの当選人数にない`);
  return new Map(winners.parties.map((p, i) => [p, sum(winners.counts.win[system][i]![e]!)]));
}

export async function assemble(): Promise<EraJson> {
  const votes = await sibling<VotesJson>("timeseries", "era");
  const winners = await sibling<WinnersJson>("candidates", "national");
  const manual = await readJson<ManualJson>(MANUAL);

  const elections = ELECTIONS.map((e) => e.n);
  const missing = elections.filter((n) => !votes.elections.includes(n));
  if (missing.length > 0) throw new Error(`兄弟サイトの得票にない回: ${missing.join("、")}`);

  // 党の並びは、両制度の全回の得票率の合計が大きい順。無所属・諸派は最後。
  const weight = new Map<string, number>();
  for (const system of SYSTEMS) {
    const cube = votes[system];
    cube.parties.forEach((p, i) =>
      elections.forEach((n) => {
        const e = votes.elections.indexOf(n);
        const v = cube.votes[i]![e];
        if (v !== null && v !== undefined) weight.set(p, (weight.get(p) ?? 0) + v / cube.totals[e]!);
      }),
    );
  }
  const rank = (p: string) => LAST.indexOf(p);
  const parties = [...weight.keys()].sort((a, b) => rank(a) - rank(b) || weight.get(b)! - weight.get(a)!);

  const cubeOf = (system: System): SystemCube => {
    const src = votes[system];
    const cols = elections.map((n) => votes.elections.indexOf(n));
    const seats = elections.map((n) => seatsOf(n, system, winners, manual));
    const votesOf = (p: string, e: number) => {
      const i = src.parties.indexOf(p);
      return i < 0 ? null : (src.votes[i]![cols[e]!] ?? null);
    };
    return {
      totals: cols.map((c) => src.totals[c]!),
      votes: parties.map((p) => elections.map((_, e) => votesOf(p, e))),
      seats: parties.map((p) =>
        elections.map((n, e) => {
          const s = seats[e]!.get(p) ?? 0;
          if (votesOf(p, e) !== null) return s;
          if (s > 0) throw new Error(`第${n}回 ${system}: ${p}は得票がないのに${s}議席`);
          return null;
        }),
      ),
    };
  };

  return { elections, parties, smd: cubeOf("smd"), pr: cubeOf("pr") };
}

/** 手起こし・兄弟サイトの表にあって、得票の表にない党（得票側で名前が違う）。 */
export async function unmatchedSeatParties(): Promise<string[]> {
  const votes = await sibling<VotesJson>("timeseries", "era");
  const winners = await sibling<WinnersJson>("candidates", "national");
  const manual = await readJson<ManualJson>(MANUAL);
  const out: string[] = [];
  for (const { n } of ELECTIONS) {
    for (const system of SYSTEMS) {
      const e = votes.elections.indexOf(n);
      const voted = new Set(votes[system].parties.filter((_, i) => votes[system].votes[i]![e] !== null));
      for (const [p, s] of seatsOf(n, system, winners, manual)) {
        // 兄弟サイトの当選人数の表は、その回に候補のない党も 0 で並べる。
        if (!voted.has(p) && (n < FIRST_SIBLING_SEATS || s > 0)) out.push(`第${n}回 ${system} ${p}`);
      }
    }
  }
  return out;
}
