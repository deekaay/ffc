<script setup lang="ts">
import { watchEffect } from 'vue'
import GearPanel from '@/components/shared/GearPanel.vue'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'
import type { Player } from '@/types/player'
import type { GearSlotName, GearItem } from '@/types/gear'
import type { GearContext } from '@/stores/useCharacterStore'

const simStore = useSimulationStore()
const charStore = useCharacterStore()
const buffStore = useBuffStore()
const gearStore = useGearStore()

function onGearUpdate(context: GearContext, slot: GearSlotName, item: GearItem) {
  charStore.setGear(context, slot, item)
}

let timer: ReturnType<typeof setTimeout> | null = null

watchEffect((onCleanup) => {
  // Character state
  JSON.stringify(charStore.tpGearset)
  JSON.stringify(charStore.wsGearset)
  JSON.stringify(charStore.tpGearset2)
  JSON.stringify(charStore.wsGearset2)
  JSON.stringify(charStore.abilities)
  charStore.mainJob; charStore.subJob; charStore.masterLevel
  charStore.wsName; charStore.wsThreshold
  JSON.stringify(charStore.enemy)
  // Buff state — access aggregatedBuffs so all underlying buff fields
  // are tracked automatically; no need to enumerate them individually
  buffStore.aggregatedBuffs
  buffStore.food // food is applied separately in buildCurrentPlayer
  // Re-run once gear data finishes loading so food stats appear correctly
  gearStore.loaded

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      simStore.runPair(1)
      simStore.runPair(2)
    } catch (e) {
      console.error('Results build failed:', e)
    }
  }, 300)

  onCleanup(() => { if (timer) clearTimeout(timer) })
})

function fmt(val: unknown): string {
  if (val === undefined || val === null) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return Number.isInteger(val) ? String(val) : val.toFixed(1)
  return String(val)
}

function pct(val: unknown): string {
  if (typeof val !== 'number') return '—'
  return (val * 100).toFixed(1) + '%'
}

function getVal(player: Player | null, key: string): unknown {
  return player?.stats[key]
}

function fmt0(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '—'
  return Math.round(v).toLocaleString()
}

function fmt1(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '—'
  return v.toFixed(1)
}

const STAT_GROUPS: { label: string; rows: { label: string; key: string; format?: (v: unknown) => string }[] }[] = [
  {
    label: 'Primary Stats',
    rows: [
      { label: 'STR', key: 'STR' }, { label: 'DEX', key: 'DEX' },
      { label: 'VIT', key: 'VIT' }, { label: 'AGI', key: 'AGI' },
      { label: 'INT', key: 'INT' }, { label: 'MND', key: 'MND' }, { label: 'CHR', key: 'CHR' },
    ],
  },
  {
    label: 'Attack & Accuracy',
    rows: [
      { label: 'Attack (Main)',   key: 'Attack1',        format: fmt },
      { label: 'Attack (Sub)',    key: 'Attack2',        format: fmt },
      { label: 'Ranged Attack',   key: 'Ranged Attack',  format: fmt },
      { label: 'Accuracy (Main)', key: 'Accuracy1' },
      { label: 'Accuracy (Sub)',  key: 'Accuracy2' },
      { label: 'Ranged Accuracy', key: 'Ranged Accuracy' },
      { label: 'Magic Accuracy',  key: 'Magic Accuracy' },
    ],
  },
  {
    label: 'DMG & Delay',
    rows: [
      { label: 'DMG (Main)',      key: 'DMG1' },
      { label: 'DMG (Sub)',       key: 'DMG2' },
      { label: 'Ranged DMG',      key: 'Ranged DMG' },
      { label: 'Delay (Main)',    key: 'Delay1' },
      { label: 'Delay (Sub)',     key: 'Delay2' },
      { label: 'Delay Reduction', key: 'Delay Reduction', format: pct },
    ],
  },
  {
    label: 'Multi-Attack',
    rows: [
      { label: 'DA %',            key: 'DA',           format: pct },
      { label: 'TA %',            key: 'TA',           format: pct },
      { label: 'QA %',            key: 'QA',           format: pct },
      { label: 'OA2 (Main)',      key: 'OA2 main',     format: pct },
      { label: 'OA3 (Main)',      key: 'OA3 main',     format: pct },
      { label: 'OA2 (Sub)',       key: 'OA2 sub',      format: pct },
      { label: 'OA3 (Sub)',       key: 'OA3 sub',      format: pct },
      { label: 'Daken %',         key: 'Daken',        format: pct },
      { label: 'Kick Attacks %',  key: 'Kick Attacks', format: pct },
      { label: 'Zanshin %',       key: 'Zanshin',      format: pct },
    ],
  },
  {
    label: 'Critical',
    rows: [
      { label: 'Crit Rate',   key: 'Crit Rate',   format: pct },
      { label: 'Crit Damage', key: 'Crit Damage', format: pct },
    ],
  },
  {
    label: 'Haste',
    rows: [
      { label: 'Gear Haste',  key: 'Gear Haste',  format: pct },
      { label: 'JA Haste',    key: 'JA Haste',    format: pct },
      { label: 'Magic Haste', key: 'Magic Haste', format: pct },
    ],
  },
  {
    label: 'WS & Misc',
    rows: [
      { label: 'Store TP',        key: 'Store TP' },
      { label: 'TP Bonus',        key: 'TP Bonus' },
      { label: 'WS Damage %',     key: 'Weapon Skill Damage' },
      { label: 'PDL (Gear)',       key: 'PDL' },
      { label: 'PDL (Trait)',      key: 'PDL Trait' },
      { label: 'Subtle Blow',      key: 'Subtle Blow' },
      { label: 'SC Bonus',         key: 'Skillchain Bonus' },
      { label: 'MB Damage',        key: 'Magic Burst Damage Trait' },
      { label: 'Dual Wield',       key: 'Dual Wield' },
    ],
  },
]
</script>

<template>
  <div class="results-tab">

    <!-- Top row: Set 1 | Set 2 | Results -->
    <div class="top-row">

      <!-- Set 1 -->
      <div class="set-panel">
        <div class="set-panel-header">Set 1</div>
        <div class="set-grids">
          <GearPanel
            context="tp1"
            :gearset="charStore.tpGearset"
            :job-code="charStore.mainJob"
            title="TP Set"
            @update:gear="(slot, item) => onGearUpdate('tp1', slot, item)"
          />
          <GearPanel
            context="ws1"
            :gearset="charStore.wsGearset"
            :job-code="charStore.mainJob"
            title="WS Set"
            @update:gear="(slot, item) => onGearUpdate('ws1', slot, item)"
          />
        </div>
      </div>

      <!-- Set 2 -->
      <div class="set-panel">
        <div class="set-panel-header">Set 2</div>
        <div class="set-grids">
          <GearPanel
            context="tp2"
            :gearset="charStore.tpGearset2"
            :job-code="charStore.mainJob"
            title="TP Set"
            @update:gear="(slot, item) => onGearUpdate('tp2', slot, item)"
          />
          <GearPanel
            context="ws2"
            :gearset="charStore.wsGearset2"
            :job-code="charStore.mainJob"
            title="WS Set"
            @update:gear="(slot, item) => onGearUpdate('ws2', slot, item)"
          />
        </div>
      </div>

      <!-- Results column -->
      <div class="results-column">
        <!-- Set 1 results -->
        <div class="dps-card">
          <div class="dps-card-title">Set 1</div>
          <div class="metric-row">
            <span class="metric-label">WS Damage</span>
            <span class="metric-value">{{ fmt0(simStore.set1Results?.wsDamage) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">TP Round</span>
            <span class="metric-value">{{ fmt0(simStore.set1Results?.tpRoundDamage) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Time/WS (s)</span>
            <span class="metric-value">{{ fmt1(simStore.set1Results?.timePerWs) }}</span>
          </div>
          <div class="metric-row dps-row">
            <span class="metric-label">DPS</span>
            <span class="metric-value dps-value">{{ fmt1(simStore.set1Results?.dps) }}</span>
          </div>
        </div>

        <!-- Set 2 results -->
        <div class="dps-card">
          <div class="dps-card-title">Set 2</div>
          <div class="metric-row">
            <span class="metric-label">WS Damage</span>
            <span class="metric-value">{{ fmt0(simStore.set2Results?.wsDamage) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">TP Round</span>
            <span class="metric-value">{{ fmt0(simStore.set2Results?.tpRoundDamage) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Time/WS (s)</span>
            <span class="metric-value">{{ fmt1(simStore.set2Results?.timePerWs) }}</span>
          </div>
          <div class="metric-row dps-row">
            <span class="metric-label">DPS</span>
            <span class="metric-value dps-value">{{ fmt1(simStore.set2Results?.dps) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Stats table -->
    <div class="stats-wrapper">
      <table class="stats-table">
        <thead>
          <tr>
            <th class="col-stat">Stat</th>
            <th class="col-val">TP Set 1</th>
            <th class="col-val">WS Set 1</th>
            <th class="col-val">TP Set 2</th>
            <th class="col-val">WS Set 2</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in STAT_GROUPS" :key="group.label">
            <tr class="group-header">
              <td colspan="5">{{ group.label }}</td>
            </tr>
            <tr v-for="row in group.rows" :key="row.key">
              <td class="stat-label">{{ row.label }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(simStore.players.tp1, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(simStore.players.ws1, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(simStore.players.tp2, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(simStore.players.ws2, row.key)) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.results-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px;
  color: #e0e0e0;
}

/* ── Top row layout ───────────────────────────────── */
.top-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

/* ── Set panels ───────────────────────────────────── */
.set-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  background: #0f1a2e;
  border: 1px solid #2e3f6a;
  border-radius: 6px;
}

.set-panel-header {
  font-size: 0.72rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.set-grids {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

/* ── Results column ───────────────────────────────── */
.results-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: flex-start;
}

.dps-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: #0f1a2e;
  border: 1px solid #2e3f6a;
  border-radius: 6px;
  min-width: 160px;
}

.dps-card-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 4px;
  border-bottom: 1px solid #2e3f6a;
  padding-bottom: 4px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.metric-label {
  font-size: 0.72rem;
  color: #8899bb;
}

.metric-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #c8e0ff;
  font-family: 'Courier New', monospace;
}

.dps-row {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #2e3f6a;
}

.dps-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #7dd8ff;
}

/* ── Stats table ──────────────────────────────────── */
.stats-wrapper {
  overflow-x: auto;
}

.stats-table {
  border-collapse: collapse;
  font-size: 0.82rem;
  width: 100%;
  max-width: 820px;
}

.stats-table th {
  padding: 7px 12px;
  background: #1a2a50;
  color: #c8dcff;
  text-align: center;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 2px solid #3a4e80;
}

.col-stat { text-align: left !important; min-width: 150px; }
.col-val  { min-width: 90px; }

.group-header td {
  padding: 10px 12px 4px;
  color: #90b8ff;
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #0c1428;
  border-top: 1px solid #2e3f6a;
}

tbody tr:not(.group-header) {
  background: #111c35;
}

tbody tr:not(.group-header):nth-child(even) {
  background: #0d1628;
}

tbody tr:not(.group-header):hover {
  background: #1a2a4a;
}

.stat-label {
  padding: 4px 12px;
  color: #d0d8f0;
  font-weight: 500;
}

.stat-val {
  padding: 4px 12px;
  text-align: center;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}
</style>
