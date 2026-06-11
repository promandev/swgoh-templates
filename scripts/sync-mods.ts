/**
 * Mod recommendation sync. Populates `src/data/mod-recommendations.json` — the
 * map that powers the in-app recommendation wizard (top set loadouts + per-slot
 * primaries with usage %). The app works without it (members are filled in by
 * hand and the wizard simply stays hidden); a sync just enables the wizard.
 *
 * Preferred source: a self-hosted swgoh-comlink instance, which aggregates real
 * Kyber rosters into usage stats. Set `COMLINK_URL` and it is used by default.
 * Without it, falls back to the (Cloudflare-protected, best-effort) swgoh.gg
 * meta report — run that from an unrestricted network.
 *
 *   npm run sync:mods                                                    # baseline defaults (all characters, offline)
 *   COMLINK_URL=http://localhost:3200 npm run sync:mods                  # real Kyber stats via comlink
 *   COMLINK_URL=http://localhost:3200 npm run sync:mods -- --sample=500
 *   npm run sync:mods -- --provider=swgoh.gg --filter=guilds_100_gp      # swgoh.gg fallback
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ModRecommendationProvider } from "../src/features/mods/domain/mod-recommendation-provider";
import { ComlinkModProvider } from "../src/features/sync/providers/comlink-mod-provider";
import { DefaultModProvider } from "../src/features/sync/providers/default-mod-provider";
import { SwgohGgModProvider } from "../src/features/sync/providers/swgoh-gg-mod-provider";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function createProvider(): ModRecommendationProvider {
  const comlinkUrl = process.env.COMLINK_URL;
  // Default to comlink when configured, else the offline baseline that always
  // covers the full roster. swgoh.gg stays available as an explicit opt-in.
  const provider = getArg("provider") ?? (comlinkUrl ? "comlink" : "defaults");

  if (provider === "comlink") {
    if (!comlinkUrl) {
      throw new Error("COMLINK_URL is required for --provider=comlink");
    }
    const sample = Number(getArg("sample") ?? 200);
    return new ComlinkModProvider(comlinkUrl, sample);
  }
  if (provider === "swgoh.gg") {
    return new SwgohGgModProvider(getArg("filter") ?? "all");
  }
  return new DefaultModProvider();
}

async function main(): Promise<void> {
  const provider = createProvider();
  console.log(`Provider: ${provider.name}`);

  const recommendations = await provider.getRecommendations();
  const sorted = Object.fromEntries(
    Object.entries(recommendations).sort(([a], [b]) => a.localeCompare(b)),
  );

  const dataFile = path.join(
    process.cwd(),
    "src",
    "data",
    "mod-recommendations.json",
  );
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  const count = Object.keys(sorted).length;
  console.log(`Done. ${count} character recommendations written.`);
  if (count === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Mod sync failed:", error);
  process.exitCode = 1;
});
