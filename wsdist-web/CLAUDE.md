# CLAUDE.md — wsdist-web Agent Context

This file is for AI agents and developers picking up work on this codebase. Read it before touching anything.

## What this is

`wsdist-web` is a TypeScript/Vue 3 SPA port of `wsdist_beta`, a Python/Tkinter FFXI damage simulator. The Python source (`wsdist_beta/`) lives in the same repository root and is the authoritative reference for all calculation logic. Both projects share the same repo; on a typical local checkout they sit at `../wsdist_beta/` relative to this directory.

## How the app works (big picture)

The user fills in three tabs left-to-right:

1. **Job & Enemy** — pick main job, sub job, master level, enemy preset, WS threshold
2. **Buffs** — job abilities + BRD/COR/GEO/WHM/food buffs
3. **Results** — three gear panels (Quicklook / TP / WS sets), a player stats table, and live quicklook DPS numbers

All state lives in four Pinia stores. Calculation is pure TypeScript in `src/calc/`. No backend, no server.

## Store responsibilities

| Store | What it owns |
|---|---|
| `useGearStore` | Fetches all JSON data on mount. Provides `getGearForJob(slotName, jobCode)` and `getIconUrl(name)`. Source of truth for available items. |
| `useCharacterStore` | Main/sub job, master level, three gearsets, enemy config, WS name, WS threshold, job abilities dict. Has `setMainJob` / `setSubJob` actions. Persisted. |
| `useBuffStore` | BRD songs, COR rolls, GEO bubbles, WHM spells, food, ability flags. `aggregatedBuffs` getter returns a flat stat-delta object consumed by `createPlayer`. Persisted. |
| `useSimulationStore` | Calls `buildCurrentPlayer()` → `runQuicklook()` → stores `quicklookResults`. No Web Worker. |

## Critical gotchas

### DO NOT name a Vue prop `slot`

Vue 3 intercepts `:slot` as the dynamic named-slot directive (legacy Vue 2 syntax still supported in v3). If you pass `:slot="someValue"` to a component it **does not** reach `props.slot` — the prop will be `undefined` with no warning. This caused the Results tab to render blank.

**The fix:** `GearSlot.vue` uses `slotName` as the prop name. `GearPanel.vue` passes `:slot-name="cell.slot"`. Keep it this way.

### WS list comes from a static map, not the gear JSON

`public/data/gear/all_gear.json` has no `WS: true` field on any item. Do not try to derive the WS list from gear data. The authoritative source is `src/data/weaponskillsByJob.ts` which has static arrays per job. If you need to add WSes, edit that file.

### Job codes are lowercase two-letter strings

`war`, `mnk`, `whm`, `blm`, `rdm`, `thf`, `pld`, `drk`, `bst`, `brd`, `rng`, `sam`, `nin`, `drg`, `smn`, `blu`, `cor`, `pup`, `dnc`, `sch`, `geo`, `run`. Store state, JSON data, and all calc functions use this convention throughout.

### `createPlayer` is a pure function

`src/calc/createPlayer.ts` has no imports from Vue or Pinia. It takes plain parameters and returns a `Player` object. Keep it that way — this is what makes the calc pipeline testable and safe for Web Workers.

### Buff enable flags were removed intentionally

`useBuffStore` used to have `brdEnabled`, `corEnabled`, `geoEnabled`, `whmEnabled` booleans that guarded buff computation. These were removed — all buff sections always compute. Users set unwanted sources to "None". Do not re-add these flags.

## File/component conventions

- `src/types/` — interfaces and type aliases only. No functions, no imports from calc or stores.
- `src/calc/` — pure functions only. No Vue reactivity, no Pinia, no `fetch`.
- `src/stores/` — Pinia stores. May import from `src/calc/` and `src/types/`.
- `src/components/shared/` — reusable components used across multiple tabs.
- `src/components/tabs/` — one file per tab, imported only by `App.vue`.

## Where to look in the Python source

When a calc module produces wrong numbers, the Python reference is in `../wsdist_beta/` (repo root, next to `wsdist-web/`):

| TS file | Python source |
|---|---|
| `calc/createPlayer.ts` | `create_player.py` (most complex — job ability interactions lines 230–700+) |
| `calc/weaponskillInfo.ts` | `weaponskill_info.py` (~1,837-line if/elif chain) |
| `calc/actions.ts` | `actions.py` (attack round logic, quicklook) |
| `calc/getFstr.ts` | `get_fstr.py` |
| `calc/getPdif.ts` | `get_pdif.py` |
| `calc/nuking.ts` | `nuking.py` |
| `stores/useBuffStore.ts` | `gui_main.py` — `aggregate_buffs` method |

## Open PRs (as of 2026-03-14)

- **PR #1** `feat/buffs-tab-reorganize` — tab reorganization, abilities moved to Buffs tab, buff enable flags removed
- **PR #2** `feat/ws-by-job` — WS dropdown fixed with static job→WS mapping

Neither is merged to `main` yet. This docs branch (`docs/initial`) was cut from `main` before those PRs, so the code on `main` predates both changes.

## Git workflow

- Branch per feature: `git checkout -b feat/my-feature`
- Commit after each meaningful milestone
- Open a PR when the feature is done: `gh pr create`
- Never force-push to `main`

## Known missing features / future work

- TP and WS gearsets on the Results tab are visible but don't yet influence the Quicklook DPS number — only the Quicklook gearset is fed into `runQuicklook()`. Full TP/WS set simulation (attack round loop) was removed when the 2-hour simulation feature was cut; it could be re-added as a Web Worker.
- The optimizer feature was removed entirely. If re-adding, it needs its own Pinia store (`useOptimizerStore`) and a Web Worker (`optimizerWorker.ts`). The Python reference is `wsdist.py` → `build_set`.
- `AutomatonTab.vue` exists but may need additional attachment logic from `pup_attachments.json`.
- `chart.js` and `vue-chartjs` are bundled but not used in the current UI.
