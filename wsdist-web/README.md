# wsdist-web

A Final Fantasy XI damage simulator — Vue 3 SPA ported from the Python/Tkinter desktop app `wsdist_beta`. Runs entirely in the browser as a static site; no backend required.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Vue 3 + Vite 8 + TypeScript |
| UI components | PrimeVue 4 (Aura theme) |
| State management | Pinia 3 + pinia-plugin-persistedstate |
| Static data | JSON files served from `public/data/` |
| Item icons | PNG sprites from `public/icons32/` |
| Charts | chart.js + vue-chartjs (bundled, currently unused in UI) |

## Getting Started

```bash
cd wsdist-web
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check + vite build → dist/
npm run preview    # serve dist/ locally
```

The build output is fully static — drop `dist/` on any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages). `vite.config.ts` sets `base: './'` for subdirectory-compatible deployment.

## Project Structure

```
wsdist-web/
├── public/
│   ├── data/
│   │   ├── gear/               # per-slot item lists (JSON arrays)
│   │   │   ├── all_gear.json   # flat dict keyed by Name2, used for icon lookup
│   │   │   ├── mains.json, subs.json, heads.json, bodies.json, ...
│   │   │   └── foods.json
│   │   ├── buffs.json          # BRD/COR/GEO/WHM buff option definitions
│   │   ├── enemies.json        # enemy preset library
│   │   ├── item_ids.json       # Name → integer ID (for icon filename lookup)
│   │   └── pup_attachments.json
│   └── icons32/                # 32×32 PNG icons, filename = item ID (e.g. 12345.png)
├── src/
│   ├── main.ts                 # app bootstrap, PrimeVue + Pinia setup
│   ├── App.vue                 # root TabView: Job & Enemy / Buffs / Results / Automaton
│   ├── types/                  # TypeScript interfaces only (no logic)
│   │   ├── gear.ts             # GearItem, GearSlotName, Gearset
│   │   ├── player.ts           # Player, PlayerStats
│   │   ├── enemy.ts            # EnemyDef
│   │   ├── buffs.ts            # BuffSet, AggregatedBuffs
│   │   ├── weaponskill.ts      # WeaponSkillInfo
│   │   └── simulation.ts       # SetResults
│   ├── stores/
│   │   ├── useGearStore.ts         # gear data loading + icon URL lookup
│   │   ├── useCharacterStore.ts    # job, gearsets (4 contexts), enemy, WS params
│   │   ├── useBuffStore.ts         # songs/rolls/bubbles/WHM/food + aggregation
│   │   └── useSimulationStore.ts   # runPair(1|2) computation, built Player objects
│   ├── calc/                   # pure TypeScript calculation modules (no Vue/Pinia)
│   │   ├── interp.ts           # 3-point linear interpolation (replaces np.interp)
│   │   ├── getFstr.ts          # fSTR / fSTR2 melee bonus
│   │   ├── getHitRate.ts       # melee hit rate formula
│   │   ├── getTp.ts            # TP per hit from delay
│   │   ├── getDelayTiming.ts   # haste caps, delay, attack timing
│   │   ├── getDexCrit.ts       # critical hit rate from dDEX
│   │   ├── getPdif.ts          # pDIF melee/ranged damage variance
│   │   ├── getPhysDamage.ts    # combined physical WS damage
│   │   ├── getDintMv.ts        # dINT/dMND magic damage multipliers
│   │   ├── getMaRate.ts        # magic accuracy / resist tier distribution
│   │   ├── nuking.ts           # enspell, quickdraw, elemental nuke damage
│   │   ├── weaponBonus.ts      # weapon-specific WS damage bonuses
│   │   ├── createPlayer.ts     # builds a full Player object from store state
│   │   ├── weaponskillInfo.ts  # WS parameters for every weapon skill
│   │   └── actions.ts          # attack round logic + quicklook computation
│   └── components/
│       ├── tabs/
│       │   ├── JobEnemyTab.vue     # Tab 0: job selector + enemy panel
│       │   ├── BuffsTab.vue        # Tab 1: job abilities (WAR/MNK/DRK/SAM/etc) + buff panel
│       │   ├── ResultsTab.vue      # Tab 2: two Set pairs + results column + stats table
│       │   └── AutomatonTab.vue    # Tab 3: PUP-only puppet configuration
│       └── shared/
│           ├── JobSelector.vue      # main job / sub job / master level / WS selector
│           ├── EnemyPanel.vue       # enemy preset + manual stat overrides
│           ├── BuffPanel.vue        # BRD songs / COR rolls / GEO bubbles / WHM / food
│           ├── GearSlot.vue         # single 32×32 item slot button + picker dialog
│           └── GearPanel.vue        # 4×4 paperdoll grid of GearSlots
```

## Data Flow

```
public/data/*.json
       │
       ▼
useGearStore (fetch on mount)
useBuffStore ──────┐
useCharacterStore ─┤──► useSimulationStore.runPair(1|2)
                   │            │
             createPlayer()     │     (calls calc/* modules)
                                ▼
                     set1Results / set2Results
                     players.tp1/ws1/tp2/ws2
                     (displayed in ResultsTab, debounced 300ms)
```

## Gear Contexts

There are four independent gearsets, each a full 16-slot `Gearset` record:

| Context key | Used for |
|---|---|
| `tpGearset` | TP-phase set for Set 1 |
| `wsGearset` | Weapon-skill set for Set 1 |
| `tpGearset2` | TP-phase set for Set 2 |
| `wsGearset2` | Weapon-skill set for Set 2 |

All four gearsets are persisted per job via `pinia-plugin-persistedstate`.

## Buff Aggregation

`useBuffStore.aggregatedBuffs` returns a flat stat-delta object combining:

- **BRD**: up to 4 songs; scales with CHR + instrument skill; Soul Voice / Marcato doublers
- **COR**: up to 4 rolls; Crooked Cards bonus; Light Shot auto-applies if WHM is in party
- **GEO**: up to 3 indi/geo bubbles; scales with Bolster, Blaze of Glory, Ecliptic Attrition
- **WHM**: Haste II, Embrava, Boost-STR/DEX/AGI/MND/INT/CHR
- **Food**: flat stat bonuses from `foods.json`

All sections always compute — set options to "None" when a buff source is absent.

## Weapon Skills

Available WSes per job are defined in `src/data/weaponskillsByJob.ts` as static arrays grouped by weapon type. `DEFAULT_WS_BY_JOB` provides a sensible default per job. `JobSelector` auto-switches the selected WS when the main job changes, falling back to the job default if the current WS is not available.

## Key Implementation Notes

### `:slot` is a reserved Vue 3 attribute

Do **not** use `slot` as a component prop name. Vue 3 intercepts `:slot` as a dynamic named-slot directive before it reaches the component's props, causing `props.slot === undefined` at runtime with no warning or error. `GearSlot` uses `slotName` as the prop name; `GearPanel` passes `:slot-name="cell.slot"`.

### Job codes are lowercase

All job identifiers in stores and data are lowercase two-letter codes: `war`, `mnk`, `whm`, `blm`, `rdm`, `thf`, `pld`, `drk`, `bst`, `brd`, `rng`, `sam`, `nin`, `drg`, `smn`, `blu`, `cor`, `pup`, `dnc`, `sch`, `geo`, `run`.

### `createPlayer` is a pure function

`src/calc/createPlayer.ts` takes raw parameters and returns a complete `Player` object with all stats computed. It has no side effects and no Vue/Pinia imports — safe to call from a Web Worker if needed.

### Calculation module dependency order

```
interp → getFstr, getHitRate, getTp, getDelayTiming, getDexCrit
getPdif → interp
getPhysDamage → getFstr, getPdif
getMaRate → interp
nuking → getMaRate, getDintMv
weaponBonus → (standalone)
weaponskillInfo → interp, weaponBonus
createPlayer → getDelayTiming
actions → all of the above
```

## Persistence

`pinia-plugin-persistedstate` saves to `localStorage`:

| Store | localStorage key |
|---|---|
| `useCharacterStore` | `wsdist-character` |
| `useBuffStore` | `wsdist-buffs` |

Gear selections, job, buff settings, and enemy config all survive page refresh.

## Adding a New Weapon Skill

1. Add the WS name to the appropriate skill-type array in `src/data/weaponskillsByJob.ts`
2. Add it to every job's entry in `WS_BY_JOB` that can use that weapon
3. Add the WS parameter branch in `src/calc/weaponskillInfo.ts` (follow existing pattern)
4. Optionally update `DEFAULT_WS_BY_JOB` for relevant jobs

## Adding a New Gear Slot

1. Add the slot name to `GearSlotName` in `src/types/gear.ts`
2. Add a default empty item in `useCharacterStore` for all four gearset initialisations
3. Add the slot to the appropriate row in `GearPanel.vue`'s `SLOT_LAYOUT`
4. Add a JSON data file to `public/data/gear/` and fetch it in `useGearStore.loadGearData()`
