# Phase 2 — Real data sync + Template export

This phase extends the existing SWGOH Squad Builder without rebuilding it. It adds
a local-first data pipeline and a professional PNG export, plus future-facing
architecture for relic stats and datacrons.

## Philosophy: local-first

The frontend never queries an external source at request time. Everything is
normalized and stored locally; the app consumes only its own files.

```
External Source (swgoh.gg)
        │
   CharacterProvider          src/features/sync/providers/swgoh-gg-provider.ts
        │
   Normalizer                 src/features/sync/normalizer.ts
        │
   Local Storage              src/data/characters.json  +  public/assets/characters/*.webp
        │
   Frontend (CharacterIndex)  src/features/characters/domain/character-index.ts
```

## ModDefinition — single source of truth

[`src/features/mods/constants/mod-definitions.ts`](../src/features/mods/constants/mod-definitions.ts)
centralizes every mod rule: icon, i18n name/tooltip keys, fixed primary, allowed
primaries and allowed secondaries. The editor, the table header, the validations
([`mod-rules.ts`](../src/features/mods/constants/mod-rules.ts)) and the PNG export
all derive from it — update a rule once and the whole app follows.
[`stat-definitions.ts`](../src/features/mods/constants/stat-definitions.ts) does the
same for stats (label key + percent flag).

## Data sync

### Command

```bash
npm run sync                          # default provider (github), incremental
npm run sync:force                    # re-download avatars and rewrite everything
npm run sync -- --provider=swgoh.gg   # swgoh.gg API (Cloudflare-protected)
COMLINK_URL=http://localhost:3200 npm run sync -- --provider=comlink
```

### What it does

1. Fetches all characters via the selected `CharacterProvider`.
2. Downloads each portrait and stores it as an optimized 128px `.webp` with `sharp`.
3. Normalizes id / name / alignment / factions.
4. Writes `src/data/characters.json` and an incremental manifest
   (`src/data/.sync-manifest.json`, hash + avatar flag + timestamp).

Incremental updates use a SHA-1 content hash per character: unchanged entries are
skipped and existing avatars are never re-downloaded (unless `--force`). A real
run produces ~332 characters and their local avatars.

### Providers (swappable source)

All implement [`CharacterProvider`](../src/features/sync/domain/character-provider.ts);
the rest of the pipeline is source-agnostic. Priority when choosing a source:
official APIs → public APIs → public data → controlled scraping.

| Provider   | `--provider` | Source                                                              | Notes                                                                    |
| ---------- | ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| GitHub     | `github` (default) | [`jmiln/SWGoHBot`](https://github.com/jmiln/SWGoHBot) `data/characters.json` via raw.githubusercontent.com | Reachable from restricted networks; ships portrait URLs (`game-assets.swgoh.gg`). |
| swgoh.gg   | `swgoh.gg`   | `https://swgoh.gg/api/characters/`                                   | Official-ish public API, but behind Cloudflare — may return `403`.       |
| comlink    | `comlink`    | self-hosted [`swgoh-comlink`](https://github.com/swgoh-utils/swgoh-comlink) | Experimental. Proxies the official CG game API; needs `COMLINK_URL` and resolves names from the localization bundle. |

> **Why GitHub is the default:** swgoh.gg sits behind Cloudflare bot protection and
> returns `403` from challenged networks (or behind a TLS-intercepting proxy).
> swgoh-comlink isn't a hosted API — it must be self-hosted. The GitHub dataset is
> public, reachable, and already carries portrait URLs, so `npm run sync` works
> out of the box. Avatars are always rendered from local files; if one is missing
> the UI falls back to gradient initials.

### Search index

[`CharacterIndex`](../src/features/characters/domain/character-index.ts) precomputes
lookups by id, faction and alignment plus accent-insensitive free-text search.
[`characterService`](../src/services/character-service.ts) exposes it to the app.

## Template export (PNG)

- **Button**: `Export Template` in the squad toolbar
  ([`export-button.tsx`](../src/features/export/components/export-button.tsx)).
- **Preview**: a modal renders the full 1600px card scaled to fit, with
  Download / Cancel
  ([`export-preview-dialog.tsx`](../src/features/export/components/export-preview-dialog.tsx)).
- **Card**: a premium, share-ready infographic (fixed dark palette so the output
  looks identical regardless of the app theme) showing, per character, the avatar,
  name, factions, all 6 mods (primary highlighted + secondaries) and datacron notes
  ([`squad-export-card.tsx`](../src/features/export/components/squad-export-card.tsx)).
  It reuses `ModDefinition` for icons/labels.
- **Engine**: `html-to-image` (chosen over html2canvas / dom-to-image for fidelity)
  behind the [`ImageExporter`](../src/features/export/domain/image-exporter.ts)
  abstraction. `supportedFormats` is `["png"]`; the contract already includes
  `jpg`/`pdf` so they can be added without touching callers.
- **Persistence**: export preferences + last export metadata are saved to
  `localStorage`
  ([`export-preferences.ts`](../src/features/export/stores/export-preferences.ts)).

### Designed for later

The abstraction supports adding: export of a single character, multiple squads at
once, and PDF output — by extending `ImageExporter` and the card props, with no
changes to existing consumers.

## Future-facing architecture (structure only, no data yet)

- **Relic stats**: [`CharacterStats` / `RelicStat`](../src/types/stats.ts) +
  [`StatsProvider`](../src/features/stats/domain/stats-provider.ts) (null impl).
- **Datacrons**: [`DatacronSet` / `DatacronTier`](../src/types/datacron.ts) +
  [`DatacronProvider`](../src/features/datacrons/domain/datacron-provider.ts)
  (null impl). Set / level / bonus / alignment / faction are modelled.

## Feature layout

```
src/features/
├─ sync/        domain (CharacterProvider), providers, normalizer, avatar-downloader, cache, sync-service
├─ export/      domain (ImageExporter), services, components, hooks, stores
├─ characters/  domain (CharacterIndex), components, data
├─ stats/       domain (StatsProvider stub)
└─ datacrons/   domain (DatacronProvider stub)
```
