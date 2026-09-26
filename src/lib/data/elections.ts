/**
 * 対象とする総選挙の目録。出典の正本は docs/data-sources.md。
 *
 * 小選挙区比例代表並立制の第41回（1996年）から。これより前は制度が違い、得票と議席の関係を同じ尺度で比べられない。
 */

export type Edition = "確定" | "速報";

export interface Election {
  n: number;
  date: string;
  edition: Edition;
  /** 定数（小選挙区・比例代表）。 */
  seats: { smd: number; pr: number };
}

const S500 = { smd: 300, pr: 200 };
const S480 = { smd: 300, pr: 180 };
const S475 = { smd: 295, pr: 180 };
const S465 = { smd: 289, pr: 176 };

export const ELECTIONS: Election[] = [
  { n: 41, date: "1996-10-20", edition: "確定", seats: S500 },
  { n: 42, date: "2000-06-25", edition: "確定", seats: S480 },
  { n: 43, date: "2003-11-09", edition: "確定", seats: S480 },
  { n: 44, date: "2005-09-11", edition: "確定", seats: S480 },
  { n: 45, date: "2009-08-30", edition: "確定", seats: S480 },
  { n: 46, date: "2012-12-16", edition: "確定", seats: S480 },
  { n: 47, date: "2014-12-14", edition: "確定", seats: S475 },
  { n: 48, date: "2017-10-22", edition: "確定", seats: S465 },
  { n: 49, date: "2021-10-31", edition: "確定", seats: S465 },
  { n: 50, date: "2024-10-27", edition: "速報", seats: S465 },
  { n: 51, date: "2026-02-08", edition: "速報", seats: S465 },
];

/** 議席を兄弟サイト（候補者と当選者）の表から取る最初の回。これより前は data/seats-41-43.json の手起こし。 */
export const FIRST_SIBLING_SEATS = 44;
