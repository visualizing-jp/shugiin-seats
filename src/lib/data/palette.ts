/**
 * ツール全体の配色ルール。色空間は CIE HCL（d3-color の hcl）。兄弟サイト（election-shugiin-timeseries）と同じ。
 *
 * - 色相は党を表す。党の色相は兄弟サイトが全国の得票から決めたもの（data/sibling/timeseries/palette.json）を使う。
 * - 量は長さ・幅で表し、全党を同じ基準明度で塗る。
 * - 彩度は sRGB の色域に収めるためだけに下げる。
 * - 党でないもの（諸派・無所属・その他）は無彩色。
 */

import { hcl } from "d3-color";

export const NEUTRAL = new Set(["諸派", "無所属", "その他"]);

/** 全国の得票率か議席率が、一度でもこれに届いた党を主要な党とする。届かない党は積み上げで「その他」にまとめる。 */
export const MINOR = 0.02;

export const BASE_L = 58;
const BASE_C = 55;

/** 明度と色相を保ったまま、表示できるまで彩度を下げる。 */
function fit(h: number, c: number, l: number): string {
  let chroma = c;
  while (chroma > 0 && !hcl(h, chroma, l).displayable()) chroma -= 1;
  return hcl(h, Math.max(0, chroma), l).formatHex();
}

/** 棒・一覧で使う党の色（全党同じ明度）。無彩色の党は hue = null。 */
export function baseColor(hue: number | null): string {
  return hue === null ? fit(0, 0, BASE_L) : fit(hue, BASE_C, BASE_L);
}

/** 強調しない要素。明度を紙色へ寄せ、彩度を落とす。全画面で同じ割合。 */
export function fadedColor(hue: number | null): string {
  return fit(hue ?? 0, hue === null ? 0 : BASE_C * 0.3, BASE_L + (94 - BASE_L) * 0.75);
}

/** 党の色一式。画面はこれだけを使う。 */
export interface PartyColors {
  base: string;
  faded: string;
  hue: number | null;
}

export function colorsOf(hues: Record<string, number>, party: string): PartyColors {
  const hue = NEUTRAL.has(party) ? null : (hues[party] ?? null);
  return { base: baseColor(hue), faded: fadedColor(hue), hue };
}
