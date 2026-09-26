# 衆議院選挙で、得た票はどれだけ議席になったか

総務省「衆議院議員総選挙・最高裁判所裁判官国民審査結果調」をもとに、1996年以降の総選挙で各党の得票率がどれだけの議席率になったかを、小選挙区と比例代表で比べるダッシュボード。

visualizing.jp スタンドアロン（dataviz.jp サブスクツールではない）。
兄弟サイト: [衆議院選挙で、どの党がどれだけ票を得てきたか](https://election-shugiin-timeseries.visualizing.jp/)（[election-shugiin-timeseries](https://github.com/visualizing-jp/election-shugiin-timeseries)）、[衆議院選挙で、誰が立候補し、誰が当選したか](https://election-shugiin-candidates.visualizing.jp/)（[shugiin-candidates](https://github.com/visualizing-jp/shugiin-candidates)）、[衆議院選挙で、どれだけの人が投票したか](https://election-shugiin-turnout.visualizing.jp/)（[shugiin-turnout](https://github.com/visualizing-jp/shugiin-turnout)）。
得票は1本目、議席は2本目のデータをそのままつなぐ。

想定URL: https://election-shugiin-seats.visualizing.jp

## ビュー

| ビュー | 内容 |
| --- | --- |
| 選挙 | 選んだ回の、得票率の100%棒から議席率の100%棒へ党ごとに帯でつないだ図（小選挙区・比例代表を並べる）と、党ごとの得票率・議席・議席率・差の表 |
| 推移 | 選んだ党の得票率と議席率（第41〜51回、1996–2026）を制度別に。全党の票と議席のずれの大きさ（Gallagher 指数）の推移 |

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## 開発

```bash
npm install
npm run fetch && npm run verify && npm run data
npm run dev
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 兄弟サイトの配信データを GitHub から `data/sibling/` に写す |
| `npm run verify` | 議席の党と得票の党のつながり、議席の和と定数の突き合わせ |
| `npm run data` | `data/sibling/` と第41〜43回の手起こし（`data/seats-41-43.json`）から配信用 JSON を `public/data/` に書き出す |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

配色のルールは `src/lib/data/palette.ts`（色相＝党、CIE HCL）。党の色相は兄弟サイトの `palette.json` をそのまま使うので、シリーズのどのサイトでも同じ党が同じ色になる。

`data/sibling/`・`data/seats-41-43.json`・`public/data/` は追跡する。

## GitHub Pages / DNS

- `.github/workflows/pages.yml` で Pages にデプロイする。
- カスタムドメイン `election-shugiin-seats.visualizing.jp` は `public/CNAME` に置いた。Pages 設定と visualizing.jp 側 DNS（既存シリーズと同じ運用）で登録する。
- Google Analytics の測定ID（`src/app/analytics.ts`）はシリーズ共通（表紙 japan-election と同じ）。
