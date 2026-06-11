# `sync:mods` — mod recommendations

Populates `src/data/mod-recommendations.json`, the map that powers the in-app
**recommendation wizard**: per character, the most-used **set loadouts** and the
most common **primary per variable slot** (arrow/triangle/circle/cross), each
with a usage share. The app works without it — members are edited by hand and the
wizard button simply stays hidden — and the committed JSON ships as `{}`.

```bash
# Preferred: aggregate real Kyber rosters from a self-hosted swgoh-comlink
COMLINK_URL=http://localhost:3200 npm run sync:mods
COMLINK_URL=http://localhost:3200 npm run sync:mods -- --sample=500

# Fallback: swgoh.gg meta report (Cloudflare-protected, best-effort)
npm run sync:mods -- --provider=swgoh.gg --filter=guilds_100_gp
```

## Output shape

```jsonc
{
  "aayla-secura": {
    "setOptions": [
      { "sets": ["speed", "health"], "usage": 0.62 },
      { "sets": ["speed", "criticalChance"], "usage": 0.18 }
    ],
    "primaryOptions": {
      "arrow": [{ "stat": "speed", "usage": 0.91 }],
      "triangle": [{ "stat": "criticalDamage", "usage": 0.74 }],
      "circle": [{ "stat": "protectionPct", "usage": 0.55 }],
      "cross": [{ "stat": "potency", "usage": 0.48 }]
    }
  }
}
```

`usage` is a fraction in `[0, 1]`. Up to 4 options are kept per list. Only the
four variable-primary slots appear (square/diamond primaries are fixed).

## Providers

### comlink (preferred) — `src/features/sync/providers/comlink-mod-provider.ts`

[swgoh-comlink](https://github.com/swgoh-utils/swgoh-comlink) proxies the official
Capital Games game API and returns **raw** rosters, not pre-aggregated metas, so
the provider builds the stats itself:

1. `/getLeaderboard` (GAC, Kyber league) → top player ids.
2. `/player` per player → equipped mods (`equippedStatMod`).
3. Aggregate per character: count set loadouts and per-slot primaries, rank,
   keep the top 4 with a usage fraction.

`--sample=N` caps how many rosters are fetched (rate-limit friendly; default 200).
Mod set/slot are decoded from each mod's `definitionId` (`[set][rarity][slot]`)
and the primary from `primaryStat.stat.unitStatId`. **Not yet exercised against a
live instance** (same caveat as the other comlink providers) — tune the field
reads against real payloads if needed.

### swgoh.gg (fallback) — `src/features/sync/providers/swgoh-gg-mod-provider.ts`

Reads the public [Mod Meta Report](https://swgoh.gg/stats/mod-meta-report/). It
sits behind Cloudflare (`403` from challenged networks) and the exact top-1000
Kyber cut is a premium slice; `guilds_100_gp` is the closest public proxy. The
parser is tolerant but unverified, and it can only emit single-set loadouts (the
public report exposes per-set frequencies, not full combos).

## Files

- `scripts/sync-mods.ts` — entrypoint (`--provider=`, `--sample=`, `--filter=`).
- `src/features/sync/providers/comlink-mod-provider.ts` — comlink aggregation.
- `src/features/sync/providers/swgoh-gg-mod-provider.ts` — swgoh.gg fallback.
- `src/features/mods/domain/mod-recommendation-provider.ts` — provider interface.
- `src/data/mod-recommendations.json` — output (keyed by character slug).
- `src/services/mod-recommendation-service.ts` — app-side reader (`get`, `hasRecommendation`).
- `src/features/mods/components/mod-recommendation-wizard.tsx` — the wizard UI.
- `src/features/mods/domain/recommendation.ts` — `buildRecommendedMods()` overlay.
- apply wiring: `applyRecommendation` in `src/stores/squad-store.ts`.
