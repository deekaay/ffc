<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import GearPanel from '@/components/shared/GearPanel.vue'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import type { Player } from '@/types/player'
import type { GearSlotName, GearItem } from '@/types/gear'
import type { GearContext } from '@/stores/useCharacterStore'

const simStore = useSimulationStore()
const charStore = useCharacterStore()
const buffStore = useBuffStore()

function onGearUpdate(context: GearContext, slot: GearSlotName, item: GearItem) {
  charStore.setGear(context, slot, item)
}

// ── Player stats ──────────────────────────────────────────────────────────────
const players = ref<{ tp1: Player | null; ws1: Player | null; tp2: Player | null; ws2: Player | null }>({
  tp1: null, ws1: null, tp2: null, ws2: null,
})

let timer: ReturnType<typeof setTimeout> | null = null

watchEffect(() => {
  JSON.stringify(charStore.tpGearset)
  JSON.stringify(charStore.wsGearset)
  JSON.stringify(charStore.tpGearset2)
  JSON.stringify(charStore.wsGearset2)
  JSON.stringify(charStore.abilities)
  charStore.mainJob; charStore.subJob; charStore.masterLevel
  charStore.wsName; charStore.wsThreshold
  JSON.stringify(charStore.enemy)
  JSON.stringify(buffStore.songs); JSON.stringify(buffStore.rolls); JSON.stringify(buffStore.bubbles)
  buffStore.food; buffStore.soulVoice; buffStore.marcato; buffStore.bolster; buffStore.blazeOfGlory
  buffStore.shellV; buffStore.hasteSpell; buffStore.diaSpell; buffStore.stormSpell

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      players.value = {
        tp1: simStore.buildCurrentPlayer('tp1'),
        ws1: simStore.buildCurrentPlayer('ws1'),
        tp2: simStore.buildCurrentPlayer('tp2'),
        ws2: simStore.buildCurrentPlayer('ws2'),
      }
      simStore.runPair(1)
      simStore.runPair(2)
    } catch (e) {
      console.error('Results build failed:', e)
    }
  }, 300)
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
      { label: 'DA %',            key: 'DA',         format: pct },
      { label: 'TA %',            key: 'TA',         format: pct },
      { label: 'QA %',            key: 'QA',         format: pct },
      { label: 'OA2 (Main)',      key: 'OA2 main',   format: pct },
      { label: 'OA3 (Main)',      key: 'OA3 main',   format: pct },
      { label: 'OA2 (Sub)',       key: 'OA2 sub',    format: pct },
      { label: 'OA3 (Sub)',       key: 'OA3 sub',    format: pct },
      { label: 'Daken %',         key: 'Daken',      format: pct },
      { label: 'Kick Attacks %',  key: 'Kick Attacks', format: pct },
      { label: 'Zanshin %',       key: 'Zanshin',    format: pct },
    ],
  },
  {
    label: 'Critical',
    rows: [
      { label: 'Crit Rate',       key: 'Crit Rate',   format: pct },
      { label: 'Crit Damage',     key: 'Crit Damage', format: pct },
    ],
  },
  {
    label: 'Haste',
    rows: [
      { label: 'Gear Haste',      key: 'Gear Haste',  format: pct },
      { label: 'JA Haste',        key: 'JA Haste',    format: pct },
      { label: 'Magic Haste',     key: 'Magic Haste', format: pct },
    ],
  },
  {
    label: 'WS & Misc',
    rows: [
      { label: 'Store TP',         key: 'Store TP' },
      { label: 'TP Bonus',         key: 'TP Bonus' },
      { label: 'WS Damage %',      key: 'Weapon Skill Damage' },
      { label: 'PDL (Gear)',        key: 'PDL' },
      { label: 'PDL (Trait)',       key: 'PDL Trait' },
      { label: 'Subtle Blow',       key: 'Subtle Blow' },
      { label: 'Skillchain Bonus',  key: 'Skillchain Bonus' },
      { label: 'Magic Burst Dmg',   key: 'Magic Burst Damage Trait' },
      { label: 'Dual Wield',        key: 'Dual Wield' },
    ],
  },
]
</script>

<template>
  <div class="results-tab">

    <!-- Two set pairs side by side -->
    <div class="pairs-row">

      <!-- Set 1 -->
      <div class="set-block">
        <div class="set-label">Set 1</div>
        <div class="set-panels">
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
        <div class="dps-results">
          <div class="result-card">
            <div class="result-label">WS Damage</div>
            <div class="result-value">{{ fmt0(simStore.set1Results?.wsDamage) }}</div>
          </div>
          <div class="result-card">
            <div class="result-label">TP Round Dmg</div>
            <div class="result-value">{{ fmt0(simStore.set1Results?.tpRoundDamage) }}</div>
          </div>
          <div class="result-card">
            <div class="result-label">Time/WS (s)</div>
            <div class="result-value">{{ fmt1(simStore.set1Results?.timePerWs) }}</div>
          </div>
          <div class="result-card highlight">
            <div class="result-label">DPS</div>
            <div class="result-value">{{ fmt1(simStore.set1Results?.dps) }}</div>
          </div>
        </div>
      </div>

      <!-- Set 2 -->
      <div class="set-block">
        <div class="set-label">Set 2</div>
        <div class="set-panels">
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
        <div class="dps-results">
          <div class="result-card">
            <div class="result-label">WS Damage</div>
            <div class="result-value">{{ fmt0(simStore.set2Results?.wsDamage) }}</div>
          </div>
          <div class="result-card">
            <div class="result-label">TP Round Dmg</div>
            <div class="result-value">{{ fmt0(simStore.set2Results?.tpRoundDamage) }}</div>
          </div>
          <div class="result-card">
            <div class="result-label">Time/WS (s)</div>
            <div class="result-value">{{ fmt1(simStore.set2Results?.timePerWs) }}</div>
          </div>
          <div class="result-card highlight">
            <div class="result-label">DPS</div>
            <div class="result-value">{{ fmt1(simStore.set2Results?.dps) }}</div>
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
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.tp1, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.ws1, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.tp2, row.key)) }}</td>
              <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.ws2, row.key)) }}</td>
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
  gap: 12px;
  padding: 10px;
  color: #e0e0e0;
}

.pairs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.set-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.set-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.set-panels {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.dps-results {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 12px;
  background: #16213e;
  border: 1px solid #2a3a6a;
  border-radius: 4px;
  min-width: 80px;
}

.result-card.highlight {
  border-color: #4a6aaa;
  background: #1a2a4e;
}

.result-label {
  font-size: 0.65rem;
  color: #8888aa;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #a0e0ff;
  margin-top: 2px;
}

.stats-wrapper {
  overflow-x: auto;
}

.stats-table {
  border-collapse: collapse;
  font-size: 0.82rem;
  width: 100%;
  max-width: 860px;
}

.stats-table th {
  padding: 6px 10px;
  background: #16213e;
  color: #a0c4ff;
  text-align: center;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-stat { text-align: left !important; min-width: 160px; }
.col-val  { min-width: 90px; }

.group-header td {
  padding: 8px 10px 4px;
  color: #6699cc;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #111126;
  border-top: 1px solid #333;
}

tr:nth-child(even):not(.group-header) { background: #13132a; }

.stat-label { padding: 3px 10px; color: #ccc; }
.stat-val {
  padding: 3px 10px;
  text-align: center;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
}
</style>
