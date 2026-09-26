/**
 * 兄弟サイトの配信データ（data/sibling）と第41〜43回の手起こし（data/seats-41-43.json）だけを入力に、
 * 配信データを public/data/ に書き出す。
 *
 *   npm run data
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NEUTRAL } from "../src/lib/data/palette.ts";
import { assemble, readHues } from "./assemble.ts";

const OUT_DIR = resolve(import.meta.dirname, "../public/data");

async function writeJson(name: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await writeFile(resolve(OUT_DIR, `${name}.json`), json);
  console.log(`  ${name}.json  ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
}

const era = await assemble();
const hues = await readHues();

const missing = era.parties.filter((p) => !NEUTRAL.has(p) && !(p in hues));
if (missing.length > 0) throw new Error(`兄弟サイトの palette.json に色相のない党: ${missing.join("、")}`);

await mkdir(OUT_DIR, { recursive: true });
await writeJson("era", era);
await writeJson("palette", Object.fromEntries(era.parties.filter((p) => p in hues).map((p) => [p, hues[p]])));
