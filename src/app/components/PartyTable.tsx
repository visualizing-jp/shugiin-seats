/**
 * 1回の党ごとの得票率・議席・議席率・差を、小選挙区と比例代表で並べる。
 * 差（議席率 − 得票率）には、0 を中心にした短い棒を添える。尺度は表の中の最大の差。
 */

import type { System } from "../../lib/data/cube.ts";
import { num, pct, points } from "../data/format.ts";
import type { Palette } from "../data/load.ts";
import { SYSTEMS, SYSTEM_LABEL, type PartyRow, type Result } from "../data/parties.ts";

function Diff({ r, max }: { r: Result; max: number }) {
  const d = r.seatShare - r.voteShare;
  const w = (Math.abs(d) / max) * 50;
  return (
    <span className="flex items-center justify-end gap-2">
      <span>{points(d, "")}</span>
      <span aria-hidden className="relative h-[9px] w-[56px] shrink-0">
        <span className="absolute inset-y-0 left-1/2 w-px bg-rule-strong" />
        <span
          className="absolute inset-y-[1px] bg-ink/55"
          style={d >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
        />
      </span>
    </span>
  );
}

export function PartyTable({
  rows,
  selected,
  onSelect,
  palette,
}: {
  rows: PartyRow[];
  selected: string;
  onSelect: (party: string) => void;
  palette: Palette;
}) {
  const max = Math.max(
    0.001,
    ...rows.flatMap((row) => SYSTEMS.flatMap((s) => (row[s] === null ? [] : [Math.abs(row[s]!.seatShare - row[s]!.voteShare)]))),
  );
  const cells = (r: Result | null, s: System) =>
    r === null ? (
      <td key={s} colSpan={4} className="border-l border-rule px-2 text-center text-faint">
        届出なし
      </td>
    ) : (
      [
        <td key={`${s}v`} className="border-l border-rule px-2 text-right">
          {pct(r.voteShare)}
        </td>,
        <td key={`${s}n`} className="px-2 text-right text-muted">
          {num(r.seats)}
        </td>,
        <td key={`${s}s`} className="px-2 text-right">
          {pct(r.seatShare)}
        </td>,
        <td key={`${s}d`} className="px-2 text-right">
          <Diff r={r} max={max} />
        </td>,
      ]
    );

  return (
    <div className="overflow-x-auto">
      <table className="tnum w-full min-w-[760px] border-collapse text-[12px]">
        <thead className="text-[10.5px] text-faint">
          <tr>
            <th rowSpan={2} className="px-2 pb-1 text-left align-bottom font-semibold">
              党
            </th>
            {SYSTEMS.map((s) => (
              <th key={s} colSpan={4} className="border-l border-rule px-2 pt-1 text-left font-semibold text-muted">
                {SYSTEM_LABEL[s]}
              </th>
            ))}
            <th rowSpan={2} className="border-l border-rule px-2 pb-1 text-right align-bottom font-normal">
              議席計
            </th>
          </tr>
          <tr className="border-b border-rule">
            {SYSTEMS.map((s) => [
              <th key={`${s}v`} className="border-l border-rule px-2 pb-1 text-right font-normal">
                得票率
              </th>,
              <th key={`${s}n`} className="px-2 pb-1 text-right font-normal">
                議席
              </th>,
              <th key={`${s}s`} className="px-2 pb-1 text-right font-normal">
                議席率
              </th>,
              <th key={`${s}d`} className="px-2 pb-1 text-right font-normal">
                差（ポイント）
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.party === selected;
            const c = palette(row.party);
            return (
              <tr
                key={row.party}
                onClick={() => onSelect(row.party)}
                className={`cursor-pointer border-b border-rule/70 transition-colors duration-150 ${
                  isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
                } ${selected === "" || isSelected ? "text-ink" : "text-muted"}`}
              >
                <td className="max-w-[16rem] px-2 py-[5px]">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    className="flex w-full min-w-0 cursor-pointer items-center gap-2 text-left"
                  >
                    <span aria-hidden className="size-[9px] shrink-0 rounded-[2px]" style={{ backgroundColor: c.base }} />
                    <span className={`truncate ${isSelected ? "font-semibold" : ""}`}>{row.party}</span>
                  </button>
                </td>
                {SYSTEMS.map((s) => cells(row[s], s))}
                <td className="border-l border-rule px-2 text-right font-semibold">
                  {num((row.smd?.seats ?? 0) + (row.pr?.seats ?? 0))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
