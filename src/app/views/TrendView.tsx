/**
 * 推移ビュー。選んだ党の得票率と議席率を、第41回（1996年）から回ごとに、小選挙区と比例代表で並べる。
 * 下に、全党の票と議席のずれの大きさの推移を置く。
 */

import { use, useMemo } from "react";
import { loadEra, loadPalette } from "../data/load.ts";
import { election, index, longDate, num, pct, points } from "../data/format.ts";
import { SYSTEMS, SYSTEM_LABEL, gallagher, resultOf, rowsAt, type Result } from "../data/parties.ts";
import { ColumnChart, type Slot } from "../components/ColumnChart.tsx";
import { ElectionSelect } from "../components/ElectionSelect.tsx";
import { PartyDiffList } from "../components/PartyDiffList.tsx";
import { Preliminary } from "../components/Preliminary.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const share = (v: number) => `${Math.round(v * 100)}%`;

/** 1回に2本の棒を並べる位置。 */
function pair({ x0, bw }: Slot) {
  const gap = Math.max(1.5, bw * 0.06);
  const w = (bw - gap) / 2;
  return { w, left: x0, right: x0 + w + gap };
}

/** 数字（最大「+36.6」≒ 26px）を棒ごとに書ける幅。狭いときは焦点の回だけに書く。 */
const labelled = (slot: Slot) => slot.isFocused || slot.bw >= 30;

export function TrendView() {
  const era = use(loadEra());
  const palette = use(loadPalette());
  const last = era.elections.at(-1)!;

  const [focusParam, setFocus] = useUrlState<string>("n", String(last), (v) => era.elections.includes(Number(v)));
  const [party, setParty] = useUrlState<string>("party", "", (v) => era.parties.includes(v));
  const focus = Number(focusParam);
  const fe = era.elections.indexOf(focus);

  const rows = useMemo(() => rowsAt(era, fe), [era, fe]);
  // 党を選んでいなければ、その回に最も議席の多い党。
  const current = party !== "" ? party : rows[0]!.party;
  const pi = era.parties.indexOf(current);
  const c = palette(current);

  const results = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s, era.elections.map((_, e) => resultOf(era, s, pi, e))])) as Record<(typeof SYSTEMS)[number], (Result | null)[]>,
    [era, pi],
  );
  const max = Math.max(0.1, ...SYSTEMS.flatMap((s) => results[s].flatMap((r) => (r === null ? [] : [r.voteShare, r.seatShare]))));

  const indices = useMemo(
    () => era.elections.map((_, e) => ({ smd: gallagher(era, "smd", e), pr: gallagher(era, "pr", e) })),
    [era],
  );
  const maxIndex = Math.max(...indices.map((g) => Math.max(g.smd, g.pr)));
  const onFocus = (n: number) => setFocus(String(n));

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:self-start">
        <h2 className="flex items-baseline gap-2 px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          <span className="flex-1">第{focus}回 議席率 − 得票率</span>
          {SYSTEMS.map((s) => (
            <span key={s} className="w-[3.4rem] text-right font-normal">
              {SYSTEM_LABEL[s]}
            </span>
          ))}
        </h2>
        <PartyDiffList rows={rows} selected={current} onSelect={setParty} palette={palette} />
        <p className="mt-2 border-t border-rule px-2 pt-2 text-[10.5px] leading-relaxed text-faint">
          党を選ぶと、その党の推移をグラフに出す。一覧は選んだ回に届出のあった党。回は右上の選択か、棒を押して変える。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <h1 className="flex items-center gap-2 text-[19px] font-semibold tracking-tight">
            <span aria-hidden className="inline-block size-[11px] rounded-[2px]" style={{ backgroundColor: c.base }} />
            {current}の得票率と議席率
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-[9px] w-[9px] rounded-[2px]" style={{ backgroundColor: c.faded }} />
                得票率
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-[9px] w-[9px] rounded-[2px]" style={{ backgroundColor: c.base }} />
                議席率
              </span>
            </span>
            <ElectionSelect elections={era.elections} value={focus} onChange={onFocus} />
          </div>
        </header>

        <p className="tnum min-h-9 pb-3 text-[12.5px]">
          <span className="font-semibold">
            第{focus}回 {longDate(focus)}
          </span>
          {election(focus).edition === "速報" && <Preliminary />}
          {SYSTEMS.map((s) => {
            const r = results[s][fe] ?? null;
            return (
              <span key={s} className="text-muted">
                {r === null
                  ? ` · ${SYSTEM_LABEL[s]} 届出なし`
                  : ` · ${SYSTEM_LABEL[s]} ${pct(r.voteShare)} → ${pct(r.seatShare)}（${num(r.seats)}議席、${points(r.seatShare - r.voteShare)}）`}
              </span>
            );
          })}
        </p>

        {SYSTEMS.map((s) => (
          <section key={s} className="pb-4">
            <h2 className="text-[13px] font-semibold">{SYSTEM_LABEL[s]}</h2>
            <ColumnChart
              elections={era.elections}
              focused={focus}
              onFocus={onFocus}
              max={max}
              tick={share}
              height={220}
              label={`${current}の${SYSTEM_LABEL[s]}の得票率と議席率の推移`}
            >
              {(slot) => {
                const r = results[s][slot.e] ?? null;
                if (r === null) return null;
                const { w, left, right } = pair(slot);
                const { y } = slot;
                const d = r.seatShare - r.voteShare;
                return (
                  <>
                    <title>{`第${slot.n}回 ${SYSTEM_LABEL[s]} 得票率 ${pct(r.voteShare)} → 議席率 ${pct(r.seatShare)}（${num(r.seats)}議席）`}</title>
                    <rect x={left} width={w} y={y(r.voteShare)} height={Math.max(0, y(0) - y(r.voteShare))} fill={c.faded} />
                    <rect x={right} width={w} y={y(r.seatShare)} height={Math.max(0, y(0) - y(r.seatShare))} fill={c.base} />
                    {labelled(slot) && (
                      <text
                        x={slot.x0 + slot.bw / 2}
                        y={y(Math.max(r.voteShare, r.seatShare)) - 4}
                        textAnchor="middle"
                        className={`tnum pointer-events-none text-[9.5px] font-semibold ${slot.isFocused ? "fill-ink" : "fill-muted"}`}
                      >
                        {points(d, "")}
                      </text>
                    )}
                  </>
                );
              }}
            </ColumnChart>
          </section>
        ))}

        <section className="border-t border-rule pt-4">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-semibold">票と議席のずれの大きさ（全党）</h2>
            <span className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-[9px] rounded-[2px] bg-ink/70" />
                小選挙区 {index(indices[fe]!.smd)}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-[9px] rounded-[2px] bg-ink/25" />
                比例代表 {index(indices[fe]!.pr)}
              </span>
            </span>
          </header>
          <ColumnChart
            elections={era.elections}
            focused={focus}
            onFocus={onFocus}
            max={maxIndex}
            tick={(v) => index(v).replace(".0", "")}
            height={180}
            label="小選挙区と比例代表の、票と議席のずれの大きさ（Gallagher の最小二乗指数）の推移"
          >
            {(slot) => {
              const g = indices[slot.e]!;
              const { w, left, right } = pair(slot);
              const { y } = slot;
              return (
                <>
                  <title>{`第${slot.n}回 ずれの大きさ 小選挙区 ${index(g.smd)} · 比例代表 ${index(g.pr)}`}</title>
                  <rect x={left} width={w} y={y(g.smd)} height={Math.max(0, y(0) - y(g.smd))} className="fill-ink/70" />
                  <rect x={right} width={w} y={y(g.pr)} height={Math.max(0, y(0) - y(g.pr))} className="fill-ink/25" />
                  {labelled(slot) && (
                    <text
                      x={left + w / 2}
                      y={y(g.smd) - 4}
                      textAnchor="middle"
                      className={`tnum pointer-events-none text-[9.5px] font-semibold ${slot.isFocused ? "fill-ink" : "fill-muted"}`}
                    >
                      {index(g.smd)}
                    </text>
                  )}
                </>
              );
            }}
          </ColumnChart>
        </section>

        <ul className="mt-5 flex flex-col gap-1 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          <li>
            淡い棒が得票率（党の得票 ÷ 有効投票数）、濃い棒が議席率（党の当選者 ÷ 定数）。棒の上の数は差（議席率 − 得票率、ポイント）。
          </li>
          <li>
            ずれの大きさは Gallagher の最小二乗指数（√(½ Σ(得票率 − 議席率)²)、ポイント）。0 なら全党が得票率どおりの議席。党ごとに数え、諸派・無所属はそれぞれ1つとみなす。
          </li>
          <li>
            定数は第41回 500（小選挙区300・比例200）、第42〜46回 480（300・180）、第47回 475（295・180）、第48回以降 465（289・176）。割合で比べるので、定数の変化は議席率に織り込まれている。
          </li>
          <li>
            党名が同じなら同じ系列として並べる。第46回と第48回以降の日本維新の会、第48回と第49回以降の立憲民主党は、名前が同じ別の政党。前身・後継の党はつながない。
          </li>
        </ul>
      </main>
    </div>
  );
}
