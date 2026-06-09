import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Character } from "@/types";
import { AvatarDownloader } from "./avatar-downloader";
import { SyncCache, hashCharacter, type Manifest } from "./cache";
import type { CharacterProvider } from "./domain/character-provider";
import { toCharacter } from "./normalizer";

export interface SyncOptions {
  /** Re-download avatars and rewrite data even when unchanged. */
  force?: boolean;
}

export interface SyncResult {
  total: number;
  added: number;
  updated: number;
  unchanged: number;
  avatarsDownloaded: number;
  avatarsFailed: number;
}

export interface SyncServiceDeps {
  provider: CharacterProvider;
  downloader: AvatarDownloader;
  cache: SyncCache;
  /** Absolute path to the generated `characters.json`. */
  dataFile: string;
  logger?: (message: string) => void;
}

/**
 * Orchestrates the External Source → Normalizer → Local Storage pipeline:
 * fetch characters, download missing avatars, normalize, and write local data +
 * an incremental manifest. The frontend then consumes only the local files.
 */
export class SyncService {
  private readonly log: (message: string) => void;

  constructor(private readonly deps: SyncServiceDeps) {
    this.log = deps.logger ?? (() => {});
  }

  async run(options: SyncOptions = {}): Promise<SyncResult> {
    const { provider, downloader, cache, dataFile } = this.deps;
    this.log(`Fetching characters from ${provider.name}…`);

    const sourceCharacters = await provider.getCharacters();
    const manifest = await cache.read();

    const result: SyncResult = {
      total: sourceCharacters.length,
      added: 0,
      updated: 0,
      unchanged: 0,
      avatarsDownloaded: 0,
      avatarsFailed: 0,
    };

    const characters: Character[] = [];
    const nextManifest: Manifest = {};

    for (const source of sourceCharacters) {
      const hash = hashCharacter(source);
      const previous = manifest[source.id];
      const changed = !previous || previous.hash !== hash;

      let avatarOk = (previous?.avatar ?? false) && (await downloader.exists(source.id));
      const needsAvatar = Boolean(source.imageUrl) && (options.force || !avatarOk);

      if (source.imageUrl && needsAvatar) {
        try {
          await downloader.download(source.id, source.imageUrl);
          avatarOk = true;
          result.avatarsDownloaded += 1;
        } catch (error) {
          result.avatarsFailed += 1;
          this.log(
            `  ! avatar failed for ${source.id}: ${(error as Error).message}`,
          );
          avatarOk = await downloader.exists(source.id);
        }
      }

      characters.push(
        toCharacter(source, avatarOk ? downloader.publicPath(source.id) : ""),
      );
      nextManifest[source.id] = {
        hash,
        avatar: avatarOk,
        updatedAt: new Date().toISOString(),
      };

      if (!previous) result.added += 1;
      else if (changed) result.updated += 1;
      else result.unchanged += 1;
    }

    characters.sort((a, b) => a.name.localeCompare(b.name));

    await mkdir(path.dirname(dataFile), { recursive: true });
    await writeFile(dataFile, `${JSON.stringify(characters, null, 2)}\n`, "utf8");
    await cache.write(nextManifest);

    this.log(
      `Done. ${result.total} characters (` +
        `${result.added} added, ${result.updated} updated, ${result.unchanged} unchanged). ` +
        `Avatars: ${result.avatarsDownloaded} downloaded, ${result.avatarsFailed} failed.`,
    );

    return result;
  }
}
