import { ELECTIONS, type Election } from "../../lib/data/elections.ts";

const int = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function num(n: number): string {
  return int.format(n);
}

/** 万票単位（四捨五入）。 */
export function man(n: number): string {
  return `${int.format(Math.round(n / 1e4))}万票`;
}

/** 割合。小数第1位まで。 */
export function pct(share: number): string {
  return `${one.format(share * 100)}%`;
}

/** 割合の差（符号つき、ポイント）。unit を外すと数だけ。 */
export function points(diff: number, unit = "ポイント"): string {
  const v = Math.round(diff * 1000) / 10;
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${one.format(Math.abs(v))}${unit}`;
}

/** 指数（ポイント、小数第1位）。 */
export function index(v: number): string {
  return one.format(v * 100);
}

const BY_N = new Map(ELECTIONS.map((e) => [e.n, e]));

export function election(n: number): Election {
  const e = BY_N.get(n);
  if (e === undefined) throw new Error(`第${n}回は目録にない`);
  return e;
}

export function year(n: number): string {
  return election(n).date.slice(0, 4);
}

export function longDate(n: number): string {
  const [y, m, d] = election(n).date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
