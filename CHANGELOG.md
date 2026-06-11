# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases are cut with the `/deploy` command, which bumps the patch version, moves
the entries below into a dated, versioned section, and pushes.

## [Unreleased]

## [0.1.1] - 2026-06-11

### Added

- Mod recommendation **wizard**: on adding a character it opens automatically (or
  via the row button), proposing the most-used set loadouts and per-slot primaries
  with usage %, all editable afterwards.
- Offline **baseline mod provider** so the wizard covers the whole roster without
  a reachable data source, plus a **comlink** provider that aggregates real Kyber
  rosters when `COMLINK_URL` is set.
- Infographic **PNG export**: a responsive card grid, one card per character.
- Loading **spinner** in the character dropdown while the roster mounts.
- **Automated weekly data sync** GitHub Action (characters / datacrons / mods),
  gated by lint + typecheck, that commits refreshed data.
- Small global **footer** with the app version and `by makario85`.

### Changed

- `ModRecommendation` now stores ranked `setOptions` / `primaryOptions` with usage
  shares instead of a single recommendation.
- Selecting a character no longer auto-fills mods; the wizard applies choices.
