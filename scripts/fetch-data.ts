/**
 * 兄弟サイトの配信データを GitHub（main）から data/sibling/ に写す。毎回取り直して上書きする。
 *
 *   npm run fetch
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const SIBLING_DIR = resolve(import.meta.dirname, "../data/sibling");

/** 兄弟サイト → リポジトリと、写す配信データ（public/data/*.json）。 */
export const SIBLINGS = {
  timeseries: { repo: "visualizing-jp/election-shugiin-timeseries", files: ["era", "palette"] },
  candidates: { repo: "visualizing-jp/shugiin-candidates", files: ["national"] },
} as const;

export type Sibling = keyof typeof SIBLINGS;

export function siblingPath(site: Sibling, file: string): string {
  return resolve(SIBLING_DIR, site, `${file}.json`);
}

async function main(): Promise<void> {
  for (const [site, { repo, files }] of Object.entries(SIBLINGS)) {
    for (const file of files) {
      const url = `https://raw.githubusercontent.com/${repo}/main/public/data/${file}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const path = siblingPath(site as Sibling, file);
      await mkdir(resolve(path, ".."), { recursive: true });
      await writeFile(path, await res.text());
      console.log(`  ${site}/${file}.json`);
    }
  }
}

if (import.meta.main) await main();
