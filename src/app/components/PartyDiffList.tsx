/**
 * 党の一覧。右端に、小選挙区と比例代表それぞれの差（議席率 − 得票率）を並べる。
 */

import { useEffect, useRef } from "react";
import { points } from "../data/format.ts";
import type { Palette } from "../data/load.ts";
import { SYSTEMS, type PartyRow, type Result } from "../data/parties.ts";

const diff = (r: Result | null) => (r === null ? "—" : points(r.seatShare - r.voteShare, ""));

export function PartyDiffList({
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
  const boxRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // 選んだ行が見えるよう、一覧の枠の中だけをスクロールする。scrollIntoView はページごと動かすので、
  // 一覧が本文の下に回る狭い画面では、開いた途端にページの末尾へ飛んでしまう。
  useEffect(() => {
    const box = boxRef.current;
    const el = selectedRef.current;
    if (box === null || el === null || box.scrollHeight <= box.clientHeight) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top) box.scrollTop += r.top - b.top;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
  }, [selected]);

  return (
    <div ref={boxRef} className="min-h-0 flex-1 overflow-y-auto">
      <ul className="flex flex-col">
        {rows.map((row) => {
          const isSelected = row.party === selected;
          return (
            <li key={row.party}>
              <button
                type="button"
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(row.party)}
                aria-pressed={isSelected}
                title={row.party}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-[3px] text-left transition-colors duration-150 ${
                  isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
                }`}
              >
                <span
                  aria-hidden
                  className="size-[9px] shrink-0 rounded-[2px]"
                  style={{ backgroundColor: palette(row.party).base }}
                />
                <span className={`min-w-0 flex-1 truncate text-[12px] ${isSelected ? "font-semibold text-ink" : "text-muted"}`}>
                  {row.party}
                </span>
                {SYSTEMS.map((s) => (
                  <span
                    key={s}
                    className={`tnum w-[3.4rem] shrink-0 text-right text-[11px] ${isSelected ? "text-ink" : "text-faint"}`}
                  >
                    {diff(row[s])}
                  </span>
                ))}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
