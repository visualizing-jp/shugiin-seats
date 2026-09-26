/**
 * 回ごとの列の枠。目盛り・年・速報の印と、列を押して回を選ぶ操作を受け持ち、列の中身は呼び出し側が描く。
 *
 * 選挙は年次の連続系列ではないので、回は等間隔に置き、回と回のあいだを線でつながない（兄弟サイトと同じ）。
 */

import type { ReactNode } from "react";
import { scaleBand, scaleLinear, type ScaleLinear } from "d3-scale";
import { election, year } from "../data/format.ts";
import { useWidth } from "../hooks/useWidth.ts";

export interface Slot {
  n: number;
  e: number;
  /** 列の左端と幅。 */
  x0: number;
  bw: number;
  isFocused: boolean;
  y: ScaleLinear<number, number>;
}

export function ColumnChart({
  elections,
  focused,
  onFocus,
  max,
  tick,
  height = 240,
  label,
  children,
}: {
  elections: number[];
  focused: number;
  onFocus: (n: number) => void;
  /** 縦軸の上端（目盛りは nice で丸める）。 */
  max: number;
  tick: (v: number) => string;
  height?: number;
  label: string;
  children: (slot: Slot) => ReactNode;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const M = { left: 40, right: 6, top: 14, bottom: 36 };
  const right = Math.max(M.left + 1, width - M.right);

  const band = scaleBand<number>().domain(elections).range([M.left, right]).paddingInner(0.28).paddingOuter(0.1);
  const y = scaleLinear().domain([0, max]).nice(4).range([height - M.bottom, M.top]);
  const ticks = y.ticks(4);
  // 年の文字（10.5px で4桁 ≒ 26px）が隣と重ならない間引き。
  const every = Math.max(1, Math.ceil(30 / band.step()));
  const fi = elections.indexOf(focused);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          {ticks.map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x1={M.left} x2={width - M.right} className="stroke-rule" />
              <text x={M.left - 6} dy="0.32em" textAnchor="end" className="tnum fill-faint text-[10px]">
                {tick(t)}
              </text>
            </g>
          ))}

          {elections.map((n, e) => {
            const x0 = band(n)!;
            const cx = x0 + band.bandwidth() / 2;
            const isFocused = n === focused;
            const hit = band.step() * 0.96;
            // 焦点の回の年はいつも書き、その両隣の間引きの年は重なるので書かない。
            const showYear = e === fi || (e % every === 0 && Math.abs(e - fi) >= every);
            return (
              <g
                key={n}
                role="button"
                tabIndex={0}
                aria-pressed={isFocused}
                aria-label={`第${n}回（${year(n)}年）`}
                onClick={() => onFocus(n)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onFocus(n);
                  }
                }}
                className="group cursor-pointer outline-none"
              >
                <rect
                  x={cx - hit / 2}
                  width={hit}
                  y={M.top - 12}
                  height={height - M.top + 12 - 2}
                  rx={4}
                  className={`group-focus-visible:stroke-ink group-focus-visible:stroke-2 ${
                    isFocused ? "fill-ink/[0.045]" : "fill-transparent hover:fill-ink/[0.025]"
                  }`}
                />
                {children({ n, e, x0, bw: band.bandwidth(), isFocused, y })}
                {showYear && (
                  <text
                    x={cx}
                    y={height - M.bottom + 16}
                    textAnchor="middle"
                    className={`tnum text-[10.5px] ${isFocused ? "fill-ink font-semibold" : "fill-muted"}`}
                  >
                    {year(n)}
                  </text>
                )}
                {election(n).edition === "速報" && (every === 1 || isFocused) && (
                  <text x={cx} y={height - M.bottom + 28} textAnchor="middle" className="fill-ink text-[9px] font-semibold">
                    速報
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
