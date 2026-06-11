/**
 * Character sync entry point. Run with `npm run sync` (or `npm run sync:force`).
 *
 * Provider selection (default: github):
 *   npm run sync                          # github dataset (reachable, has images)
 *   npm run sync -- --provider=swgoh.gg   # swgoh.gg API (Cloudflare-protected)
 *   COMLINK_URL=http://localhost:3200 npm run sync -- --provider=comlink
 *
 * External Source → Normalizer → Local Storage:
 *   - src/data/characters.json      normalized catalogue consumed by the app
 *   - public/assets/characters/*    locally-stored .webp avatars
 *   - src/data/.sync-manifest.json  incremental cache (hash + avatar + time)
 */
import path from "node:path";

import type { CharacterProvider } from "../src/features/sync/domain/character-provider";
import { AvatarDownloader } from "../src/features/sync/avatar-downloader";
import { SyncCache } from "../src/features/sync/cache";
import { ComlinkProvider } from "../src/features/sync/providers/comlink-provider";
import { SwgohBotDataProvider } from "../src/features/sync/providers/swgoh-bot-data-provider";
import { SwgohGgProvider } from "../src/features/sync/providers/swgoh-gg-provider";
import { SyncService } from "../src/features/sync/sync-service";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function createProvider(name: string): CharacterProvider {
  switch (name) {
    case "swgoh.gg":
      return new SwgohGgProvider();
    case "comlink": {
      const url = process.env.COMLINK_URL;
      if (!url) {
        throw new Error(
          "Set COMLINK_URL to use the comlink provider (self-hosted swgoh-comlink).",
        );
      }
      return new ComlinkProvider(
        url.replace(/\/$/, ""),
        process.env.COMLINK_ACCESS_KEY,
        process.env.COMLINK_SECRET_KEY,
      );
    }
    case "github":
      return new SwgohBotDataProvider();
    default:
      throw new Error(`Unknown provider "${name}"`);
  }
}

async function main(): Promise<void> {
  const root = process.cwd();
  const force = process.argv.includes("--force");
  const providerName = getArg("provider") ?? "github";
  const provider = createProvider(providerName);

  const service = new SyncService({
    provider,
    downloader: new AvatarDownloader(
      path.join(root, "public", "assets", "characters"),
    ),
    cache: new SyncCache(path.join(root, "src", "data", ".sync-manifest.json")),
    dataFile: path.join(root, "src", "data", "characters.json"),
    logger: (message) => console.log(message),
  });

  console.log(`Provider: ${provider.name}`);
  const result = await service.run({ force });
  if (result.total === 0) {
    console.warn("No characters were returned by the provider.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
