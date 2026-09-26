/**
 * 組み立てた得票と議席の突き合わせ。合わなければ止める。
 *
 *   npm run verify
 *
 * - 議席の党が、どれも同じ回・同じ制度の得票の表にある（党名が同じ文字列でつながる）。
 * - 制度ごとの議席の和 = 定数。
 * - 党の得票の和 ≤ 有効投票数（得票の表の按分票による端数の差だけを許す）。
 */

import type { System } from "../src/lib/data/cube.ts";
import { ELECTIONS } from "../src/lib/data/elections.ts";
import { assemble, SYSTEMS, unmatchedSeatParties } from "./assemble.ts";

const LABEL: Record<System, string> = { smd: "小選挙区", pr: "比例代表" };
const errors: string[] = [];

const unmatched = await unmatchedSeatParties();
if (unmatched.length > 0) errors.push(`得票の表にない議席の党: ${unmatched.join("、")}`);

const era = await assemble();
era.elections.forEach((n, e) => {
  const seats = ELECTIONS.find((x) => x.n === n)!.seats;
  for (const system of SYSTEMS) {
    const cube = era[system];
    const won = cube.seats.reduce((a, row) => a + (row[e] ?? 0), 0);
    if (won !== seats[system]) errors.push(`第${n}回 ${LABEL[system]}: 議席の和 ${won} ≠ 定数 ${seats[system]}`);
    const voted = cube.votes.reduce((a, row) => a + (row[e] ?? 0), 0);
    if (voted - cube.totals[e]! > 0.01) errors.push(`第${n}回 ${LABEL[system]}: 得票の和 ${voted} > 有効投票 ${cube.totals[e]}`);
  }
  console.log(`  第${n}回  小選挙区 ${seats.smd}  比例代表 ${seats.pr}`);
});

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log("✓ 議席の党はすべて得票の表にあり、議席の和は定数と一致");
