<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import type { Player } from '@/types/player'

const simStore = useSimulationStore()
const charStore = useCharacterStore()
const buffStore = useBuffStore()

const players = ref<{ quicklook: Player | null; tp: Player | null; ws: Player | null }>({
  quicklook: null, tp: null, ws: null,
})

let timer: ReturnType<typeof setTimeout> | null = null

watchEffect(() => {
  JSON.stringify(charStore.quicklookGearset)
  JSON.stringify(charStore.tpGearset)
  JSON.stringify(charStore.wsGearset)
  JSON.stringify(charStore.abilities)
  charStore.mainJob; charStore.subJob; charStore.masterLevel
  JSON.stringify(charStore.enemy)
  buffStore.brdEnabled; buffStore.corEnabled; buffStore.geoEnabled; buffStore.whmEnabled
  JSON.stringify(buffStore.songs); JSON.stringify(buffStore.rolls); JSON.stringify(buffStore.bubbles)
  buffStore.food; buffStore.soulVoice; buffStore.marcato; buffStore.bolster; buffStore.blazeOfGlory
  buffStore.shellV; buffStore.hasteSpell; buffStore.diaSpell; buffStore.stormSpell

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      players.value = {
        quicklook: simStore.buildCurrentPlayer('quicklook'),
        tp: simStore.buildCurrentPlayer('tp'),
        ws: simStore.buildCurrentPlayer('ws'),
      }
    } catch (e) {
      console.error('PlayerStats build failed:', e)
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
      { label: 'Attack (Main)',    key: 'Attack1', format: fmt },
      { label: 'Attack (Sub)',     key: 'Attack2', format: fmt },
      { label: 'Ranged Attack',    key: 'Ranged Attack', format: fmt },
      { label: 'Accuracy (Main)',  key: 'Accuracy1' },
      { label: 'Accuracy (Sub)',   key: 'Accuracy2' },
      { label: 'Ranged Accuracy',  key: 'Ranged Accuracy' },
      { label: 'Magic Accuracy',   key: 'Magic Accuracy' },
    ],
  },
  {
    label: 'DMG & Delay',
    rows: [
      { label: 'DMG (Main)',       key: 'DMG1' },
      { label: 'DMG (Sub)',        key: 'DMG2' },
      { label: 'Ranged DMG',       key: 'Ranged DMG' },
      { label: 'Delay (Main)',     key: 'Delay1' },
      { label: 'Delay (Sub)',      key: 'Delay2' },
      { label: 'Delay Reduction',  key: 'Delay Reduction', format: pct },
    ],
  },
  {
    label: 'Multi-Attack',
    rows: [
      { label: 'DA %',             key: 'DA',       format: pct },
      { label: 'TA %',             key: 'TA',       format: pct },
      { label: 'QA %',             key: 'QA',       format: pct },
      { label: 'OA2 (Main)',       key: 'OA2 main', format: pct },
      { label: 'OA3 (Main)',       key: 'OA3 main', format: pct },
      { label: 'OA2 (Sub)',        key: 'OA2 sub',  format: pct },
      { label: 'OA3 (Sub)',        key: 'OA3 sub',  format: pct },
      { label: 'Daken %',          key: 'Daken',    format: pct },
      { label: 'Kick Attacks %',   key: 'Kick Attacks', format: pct },
      { label: 'Zanshin %',        key: 'Zanshin',  format: pct },
    ],
  },
  {
    label: 'Critical',
    rows: [
      { label: 'Crit Rate',        key: 'Crit Rate',    format: pct },
      { label: 'Crit Damage',      key: 'Crit Damage',  format: pct },
    ],
  },
  {
    label: 'Haste',
    rows: [
      { label: 'Gear Haste',       key: 'Gear Haste',   format: pct },
      { label: 'JA Haste',         key: 'JA Haste',     format: pct },
      { label: 'Magic Haste',      key: 'Magic Haste',  format: pct },
    ],
  },
  {
    label: 'WS & Misc',
    rows: [
      { label: 'Store TP',         key: 'Store TP' },
      { label: 'TP Bonus',         key: 'TP Bonus' },
      { label: 'WS Damage %',      key: 'Weapon Skill Damage' },
      { label: 'PDL (Gear)',       key: 'PDL' },
      { label: 'PDL (Trait)',      key: 'PDL Trait' },
      { label: 'Subtle Blow',      key: 'Subtle Blow' },
      { label: 'Skillchain Bonus', key: 'Skillchain Bonus' },
      { label: 'Magic Burst Dmg',  key: 'Magic Burst Damage Trait' },
      { label: 'Dual Wield',       key: 'Dual Wield' },
    ],
  },
]

function getVal(player: Player | null, key: string): unknown {
  return player?.stats[key]
}
</script>

<template>
  <div class="stats-tab">
    <table class="stats-table">
      <thead>
        <tr>
          <th class="col-stat">Stat</th>
          <th class="col-val">Quicklook</th>
          <th class="col-val">TP Set</th>
          <th class="col-val">WS Set</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in STAT_GROUPS" :key="group.label">
          <tr class="group-header">
            <td colspan="4">{{ group.label }}</td>
          </tr>
          <tr v-for="row in group.rows" :key="row.key">
            <td class="stat-label">{{ row.label }}</td>
            <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.quicklook, row.key)) }}</td>
            <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.tp, row.key)) }}</td>
            <td class="stat-val">{{ (row.format ?? fmt)(getVal(players.ws, row.key)) }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.stats-tab {
  padding: 12px;
  overflow-x: auto;
}

.stats-table {
  border-collapse: collapse;
  font-size: 0.82rem;
  width: 100%;
  max-width: 700px;
}

.stats-table th {
  padding: 6px 12px;
  background: #16213e;
  color: #a0c4ff;
  text-align: center;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-stat { text-align: left !important; min-width: 160px; }
.col-val { min-width: 100px; }

.group-header td {
  padding: 8px 12px 4px;
  color: #6699cc;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #111126;
  border-top: 1px solid #333;
}

tr:nth-child(even):not(.group-header) {
  background: #13132a;
}

.stat-label { padding: 3px 12px; color: #ccc; }
.stat-val {
  padding: 3px 12px;
  text-align: center;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
}
</style>
