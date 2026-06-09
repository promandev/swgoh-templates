# SWGOH Squad Builder

Personal, production-ready tool to design and document **Star Wars: Galaxy of Heroes** squad templates: team composition, mod configuration (primary + secondaries with hand-typed values), target stats and datacron notes.

Built with a premium, professional UI (Linear / Vercel / Raycast inspired) — not a game-style interface.

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **next-intl** — full i18n (EN / ES), zero hardcoded strings
- **Zustand** (+ `persist`) — global state, auto-saved to `localStorage`
- **next-themes** — light / dark with persistent selector
- **Framer Motion** — micro-animations
- **Lucide** — icons

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 (it redirects to your locale, e.g. `/en`).

> Note: if `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (TLS interception by a corporate proxy / antivirus), prefix commands with `NODE_OPTIONS="--use-system-ca"`.

### Scripts

| Script               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the dev server                                 |
| `npm run build`      | Production build                                     |
| `npm run start`      | Serve the production build                           |
| `npm run lint`       | Run ESLint                                           |
| `npm run sync`       | Sync characters + avatars from swgoh.gg (incremental)|
| `npm run sync:force` | Re-download avatars and rewrite all data             |

## Architecture

Feature-based, Clean Architecture, SOLID. The UI derives every option and validation from a single source of truth for mod rules.

```
src/
├─ app/[locale]/          # Localized App Router routes
├─ components/
│  ├─ layout/             # Header, theme toggle, locale switcher
│  ├─ providers/          # Theme provider
│  └─ ui/                 # shadcn/ui primitives
├─ features/
│  ├─ squads/             # Builder, table/cards, sidebar, toolbar, store hooks
│  ├─ characters/         # Searchable combobox, avatar, mock catalogue
│  ├─ mods/               # Mod cell + editor, stat select, RULES (constants)
│  └─ datacrons/          # Datacron notes field
├─ i18n/                  # next-intl routing / navigation / request config
├─ messages/              # en.json, es.json (all visible text)
├─ services/              # Character service (mock today, API-ready)
├─ stores/                # Zustand squad store (persisted)
├─ types/                 # Character, Squad, SquadMember, Mods
└─ utils/                 # id, avatar, format helpers
```

## Responsive layout

Hybrid, mobile-first:

- **Desktop**: a table — `Character | Square | Arrow | Diamond | Triangle | Circle | Cross | Datacron`.
- **Mobile/tablet**: the same data as stacked cards (one per character).

A single markup adapts via Tailwind responsive classes (`md:contents`), so there is no duplication.

## SWGOH mod rules (validated)

All rules live in [`src/features/mods/constants/mod-rules.ts`](src/features/mods/constants/mod-rules.ts):

| Slot     | Primary                                                                       |
| -------- | ----------------------------------------------------------------------------- |
| Square   | **Offense %** (fixed, not editable)                                           |
| Diamond  | **Defense** (fixed, not editable)                                             |
| Circle   | Health %, Protection %                                                         |
| Arrow    | Speed, Accuracy, Crit. Avoidance, Health %, Protection %, Offense %, Defense % |
| Triangle | Crit. Damage, Crit. Chance, Health %, Protection %, Offense %, Defense %       |
| Cross    | Potency, Tenacity, Health %, Protection %, Offense %, Defense %                |

- Up to **4 secondaries** per mod.
- A secondary can't duplicate another secondary **or** the slot's primary (impossible combinations are filtered out of the dropdowns).
- The user types each stat value by hand; the stat type is chosen from a dropdown.

## Data persistence

Squads, active selection, theme and language are restored automatically on reload (`localStorage` + cookie locale).

## Internationalization

Add a language by creating `src/messages/<locale>.json` and adding the locale to [`src/i18n/routing.ts`](src/i18n/routing.ts). No code changes required elsewhere.

## Phase 2 — Local data sync & PNG export

The app is local-first: the frontend only ever reads its own normalized data, never a remote source at request time.

- **`npm run sync`** pulls the full roster (~332 characters) + avatars behind a swappable `CharacterProvider`, stores portraits as local `.webp`, and writes `src/data/characters.json`. Incremental via a hash/timestamp manifest. Providers: `github` (default, reachable), `swgoh.gg`, and self-hosted `comlink`.
- **Export Template** button on each squad opens a preview modal and downloads a premium 1600px PNG infographic (via `html-to-image`, behind an `ImageExporter` abstraction ready for JPG/PDF).
- Future-facing models for relic stats and datacrons are scaffolded.

See [docs/PHASE-2.md](docs/PHASE-2.md) for the full technical write-up.

> The default `github` provider works out of the box. swgoh.gg is behind Cloudflare (may `403`); swgoh-comlink must be self-hosted (`COMLINK_URL`). Either way the app falls back to gradient initials when an avatar is missing.
