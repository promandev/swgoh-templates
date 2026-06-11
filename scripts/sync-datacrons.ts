/**
 * Datacron set sync. Populates `src/data/datacrons.json` (the list the in-app
 * datacron modal offers as a dropdown). The modal also works without this, via
 * manual set entry.
 *
 * Provider selection (default: github — reachable from restricted networks and
 * the only source that carries the enriched abilities + stat pool):
 *   npm run sync:datacrons
 *   npm run sync:datacrons -- --provider=swgoh.gg
 *   COMLINK_URL=http://localhost:3200 npm run sync:datacrons -- --provider=comlink
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DatacronProvider } from "../src/features/datacrons/domain/datacron-provider";
import { ComlinkDatacronProvider } from "../src/features/sync/providers/comlink-datacron-provider";
import { GithubDatacronProvider } from "../src/features/sync/providers/github-datacron-provider";
import { SwgohGgDatacronProvider } from "../src/features/sync/providers/swgoh-gg-datacron-provider";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function createProvider(name: string): DatacronProvider {
  switch (name) {
    case "github":
      return new GithubDatacronProvider();
    case "comlink": {
      const url = process.env.COMLINK_URL;
      if (!url) {
        throw new Error("Set COMLINK_URL to use the comlink provider.");
      }
      return new ComlinkDatacronProvider(
        url.replace(/\/$/, ""),
        process.env.COMLINK_ACCESS_KEY,
        process.env.COMLINK_SECRET_KEY,
      );
    }
    case "swgoh.gg":
      return new SwgohGgDatacronProvider();
    default:
      throw new Error(`Unknown provider "${name}"`);
  }
}

async function main(): Promise<void> {
  const provider = createProvider(getArg("provider") ?? "github");
  console.log(`Provider: ${provider.name}`);

  const sets = await provider.getSets();
  sets.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const dataFile = path.join(process.cwd(), "src", "data", "datacrons.json");
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(sets, null, 2)}\n`, "utf8");

  console.log(`Done. ${sets.length} datacron sets written.`);
  if (sets.length === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Datacron sync failed:", error);
  process.exitCode = 1;
});
