/**
 * 配信データ（public/data/*.json）の型。scripts/build.ts が書き、画面が読む。
 * 回のメタ情報（執行日・版・定数）は elections.ts を正本とし、ここには回番号だけ持つ。
 */

export type System = "smd" | "pr";

/**
 * 1つの制度の全国値。totals[回] は有効投票数、votes[党][回] は得票数、seats[党][回] は議席数。
 * その回にその制度で届出のない党は、votes も seats も null。届出があって当選のない党の seats は 0。
 */
export interface SystemCube {
  totals: number[];
  votes: (number | null)[][];
  seats: (number | null)[][];
}

/** parties は両制度で共通の並び（積み上げの底から）。 */
export interface EraJson {
  elections: number[];
  parties: string[];
  smd: SystemCube;
  pr: SystemCube;
}
