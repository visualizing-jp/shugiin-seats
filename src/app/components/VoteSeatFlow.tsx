/**
 * 1回・1制度の、得票率の100%棒（左）から議席率の100%棒（右）へ、党ごとに帯でつなぐ。
 *
 * 帯の太さが左右で同じなら、票がそのまま同じ割合の議席になったことを表す。右で太る党は票より多く、
 * 細る党は票より少ない議席を得た。党の並びは左右で同じなので、帯は交差しない。
 */

import { scaleLinear } from "d3-scale";
import { man, num, pct, points } from "../data/format.ts";
import { OTHER, type Flow } from "../data/parties.ts";
import { useWidth } from "../hooks/useWidth.ts";

/** 数字を書く最小の区分の高さ（px）。10.5px の字が隣の数字と重ならない。 */
const MIN_LABEL = 12;

/** 議席の側に書く党名の最大の字数。長い名前は表で読む。 */
const NAME_CHARS = 7;

const shortName = (s: string) => ([...s].length > NAME_CHARS ? `${[...s].slice(0, NAME_CHARS - 1).join("")}…` : s);

export function VoteSeatFlow({
  flows,
  highlighted,
  onSelect,
  height = 380,
  label,
}: {
  flows: Flow[];
  /** 空文字はすべての党を同じ濃さで描く。 */
  highlighted: string;
  onSelect: (party: string) => void;
  height?: number;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const M = { top: 22, bottom: 4 };
  // 党名は得票の側に書く。議席がほとんどない党も、帯をたどれば名前に行き着く。
  const leftLabel = Math.min(128, Math.max(104, width * 0.24));
  const bar = Math.min(30, Math.max(18, width * 0.05));
  const rightLabel = 84;
  const xv = leftLabel;
  const xs = Math.max(xv + bar + 40, width - rightLabel - bar);

  const y = scaleLinear().domain([0, 1]).range([height - M.bottom, M.top]);

  let accV = 0;
  let accS = 0;
  const placed = flows.map((f) => {
    const v0 = accV;
    const s0 = accS;
    accV += f.voteShare;
    accS += f.seatShare;
    return { f, vb: y(v0), vt: y(accV), sb: y(s0), st: y(accS) };
  });

  const emphasized = (key: string) => highlighted === "" || key === highlighted;
  const mx = (xv + bar + xs) / 2;

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          <text x={xv + bar / 2} y={M.top - 9} textAnchor="middle" className="fill-muted text-[10.5px]">
            得票率
          </text>
          <text x={xs + bar / 2} y={M.top - 9} textAnchor="middle" className="fill-muted text-[10.5px]">
            議席率
          </text>

          {placed.map(({ f, vb, vt, sb, st }) => {
            const on = emphasized(f.key);
            const picked = highlighted !== "" && f.key === highlighted;
            const selectable = f.key !== OTHER;
            const x1 = xv + bar;
            return (
              <g
                key={f.key}
                onClick={selectable ? () => onSelect(f.key) : undefined}
                className={selectable ? "cursor-pointer" : undefined}
              >
                <title>
                  {`${f.key}  得票 ${man(f.votes)}（${pct(f.voteShare)}）→ 議席 ${num(f.seats)}（${pct(f.seatShare)}）  差 ${points(f.seatShare - f.voteShare)}`}
                </title>
                <path
                  d={`M${x1},${vt}C${mx},${vt} ${mx},${st} ${xs},${st}L${xs},${sb}C${mx},${sb} ${mx},${vb} ${x1},${vb}Z`}
                  fill={picked ? f.color : f.faded}
                  opacity={picked ? 0.5 : on ? 0.85 : 0.3}
                  className="transition-[fill,opacity] duration-150 ease-out"
                />
                <rect
                  x={xv}
                  width={bar}
                  y={vt}
                  height={Math.max(0, vb - vt - 0.5)}
                  fill={on ? f.color : f.faded}
                  className="transition-[fill] duration-150 ease-out"
                />
                <rect
                  x={xs}
                  width={bar}
                  y={st}
                  height={Math.max(0, sb - st - 0.5)}
                  fill={on ? f.color : f.faded}
                  className="transition-[fill] duration-150 ease-out"
                />
                {vb - vt >= MIN_LABEL && (
                  <text x={xv - 5} y={(vt + vb) / 2} dy="0.34em" textAnchor="end" className="tnum text-[10.5px]">
                    <tspan className={on ? "fill-muted" : "fill-faint"}>{shortName(f.key)}</tspan>
                    <tspan dx="5" className={`${on ? "fill-ink" : "fill-faint"} ${picked ? "font-semibold" : ""}`}>
                      {pct(f.voteShare)}
                    </tspan>
                  </text>
                )}
                {sb - st >= MIN_LABEL && (
                  <text x={xs + bar + 5} y={(st + sb) / 2} dy="0.34em" className="tnum text-[10.5px]">
                    <tspan className={`${on ? "fill-ink" : "fill-faint"} ${picked ? "font-semibold" : ""}`}>
                      {pct(f.seatShare)}
                    </tspan>
                    <tspan dx="4" className="fill-faint">
                      {num(f.seats)}議席
                    </tspan>
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
