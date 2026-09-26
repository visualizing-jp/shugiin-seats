/**
 * 選挙ビュー。1回の選挙で、各党の得票率がどれだけの議席率になったかを、小選挙区と比例代表で並べる。
 */

import { use, useMemo } from "react";
import { loadEra, loadPalette } from "../data/load.ts";
import { election, index, longDate, num, pct, points } from "../data/format.ts";
import { SYSTEMS, SYSTEM_LABEL, flows, gallagher, majorParties, rowsAt } from "../data/parties.ts";
import { ElectionSelect } from "../components/ElectionSelect.tsx";
import { PartyTable } from "../components/PartyTable.tsx";
import { Preliminary } from "../components/Preliminary.tsx";
import { VoteSeatFlow } from "../components/VoteSeatFlow.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

export function ElectionView() {
  const era = use(loadEra());
  const palette = use(loadPalette());
  const last = era.elections.at(-1)!;

  const [focusParam, setFocus] = useUrlState<string>("n", String(last), (v) => era.elections.includes(Number(v)));
  const [party, setParty] = useUrlState<string>("party", "", (v) => era.parties.includes(v));
  const focus = Number(focusParam);
  const e = era.elections.indexOf(focus);
  const seats = election(focus).seats;

  const major = useMemo(() => ({ smd: majorParties(era, "smd"), pr: majorParties(era, "pr") }), [era]);

  const rows = useMemo(() => rowsAt(era, e), [era, e]);

  const selected = rows.some((r) => r.party === party) ? party : "";
  const pick = rows.find((r) => r.party === selected);
  const toggle = (p: string) => setParty(p === selected ? "" : p);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <main className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <h1 className="text-[19px] font-semibold tracking-tight">得票率と議席率</h1>
          <ElectionSelect elections={era.elections} value={focus} onChange={(n) => setFocus(String(n))} />
        </header>

        <p className="tnum min-h-9 pb-3 text-[12.5px]">
          <span className="font-semibold">
            第{focus}回 {longDate(focus)}
          </span>
          {election(focus).edition === "速報" && <Preliminary />}
          {pick === undefined ? (
            <span className="text-muted">
              {party !== "" && party !== selected ? ` · ${party}はこの回に届出がない` : " · 帯か表の党を押すと、その党だけを濃くする"}
            </span>
          ) : (
            <>
              <span className="text-muted"> · </span>
              <span
                aria-hidden
                className="mr-1 inline-block size-[9px] rounded-[2px] align-baseline"
                style={{ backgroundColor: palette(pick.party).base }}
              />
              <span className="font-semibold">{pick.party}</span>
              {SYSTEMS.map((s) => {
                const r = pick[s];
                return (
                  <span key={s} className="text-muted">
                    {r === null
                      ? ` · ${SYSTEM_LABEL[s]} 届出なし`
                      : ` · ${SYSTEM_LABEL[s]} 得票率 ${pct(r.voteShare)} → 議席率 ${pct(r.seatShare)}（${num(r.seats)}議席、${points(r.seatShare - r.voteShare)}）`}
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setParty("")}
                className="ml-2 cursor-pointer rounded border border-rule px-1.5 py-px text-[11px] text-muted transition-[color,border-color,transform] duration-150 ease-out hover:border-rule-strong hover:text-ink active:scale-[0.97]"
              >
                解除
              </button>
            </>
          )}
        </p>

        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
          {SYSTEMS.map((s) => (
            <section key={s} className="min-w-0">
              <h2 className="tnum flex items-baseline justify-between border-b border-rule pb-1.5 text-[13px] font-semibold">
                <span>
                  {SYSTEM_LABEL[s]}
                  <span className="ml-2 text-[11px] font-normal text-muted">定数 {seats[s]}</span>
                </span>
                <span className="text-[11px] font-normal text-muted">
                  ずれの大きさ <span className="font-semibold text-ink">{index(gallagher(era, s, e))}</span>
                </span>
              </h2>
              <VoteSeatFlow
                flows={flows(era, s, e, major[s], selected, palette)}
                highlighted={selected}
                onSelect={toggle}
                label={`第${focus}回の${SYSTEM_LABEL[s]}の党派別の得票率と議席率`}
              />
            </section>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="pb-2 text-[13px] font-semibold">党ごとの得票率と議席率</h2>
          <PartyTable rows={rows} selected={selected} onSelect={toggle} palette={palette} />
        </section>

        <ul className="mt-5 flex flex-col gap-1 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          <li>
            得票率は、党の得票 ÷ 有効投票数。議席率は、党の当選者 ÷ 定数。差は議席率 − 得票率で、プラスなら票の割合より多くの議席を得た。
          </li>
          <li>
            小選挙区は1つの選挙区で1人だけが当選するので、選挙区ごとの1位に票が集まった党ほど議席が多くなる。比例代表は11ブロックごとにドント式で議席を分けるので、得票率に近い議席率になるが、ブロックの定数が小さいほど大きい党に寄る。
          </li>
          <li>
            小選挙区の得票率は、候補を立てた選挙区だけの票の全国での割合。候補を立てない選挙区の多い党は、支持の広さより低く出る。
          </li>
          <li>
            ずれの大きさは Gallagher の最小二乗指数（√(½ Σ(得票率 − 議席率)²)、ポイント）。0 なら全党が得票率どおりの議席。党ごとに数え、諸派・無所属はそれぞれ1つとみなす。
          </li>
          <li>「その他」は、この制度で全国の得票率も議席率も一度も2%に届かなかった党。表から選ぶと分けて表示する。</li>
        </ul>
      </main>
    </div>
  );
}
