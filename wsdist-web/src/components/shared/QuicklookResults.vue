<script setup lang="ts">
import { watchEffect } from 'vue'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'

const simulationStore = useSimulationStore()
const characterStore = useCharacterStore()
const buffStore = useBuffStore()
const gearStore = useGearStore()

let timer: ReturnType<typeof setTimeout> | null = null

watchEffect(() => {
  // Touch reactive dependencies so the effect re-runs on any relevant change
  const _ = JSON.stringify(characterStore.abilities)
  const _a = characterStore.mainJob
  const _b = characterStore.subJob
  const _c = characterStore.masterLevel
  const _d = characterStore.wsName
  const _e = characterStore.wsThreshold
  const _f = JSON.stringify(characterStore.quicklookGearset)
  const _g = JSON.stringify(characterStore.enemy)
  const _h = buffStore.brdEnabled
  const _i = buffStore.corEnabled
  const _j = buffStore.geoEnabled
  const _k = buffStore.whmEnabled
  const _l = buffStore.food
  const _m = JSON.stringify(buffStore.songs)
  const _n = JSON.stringify(buffStore.rolls)
  const _o = JSON.stringify(buffStore.bubbles)
  const _p = gearStore.loaded
  void [_, _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p]

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => simulationStore.runQuicklook(), 200)
})

function fmt0(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '—'
  return Math.round(v).toLocaleString()
}

function fmt1(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '—'
  return v.toFixed(1)
}
</script>

<template>
  <div class="quicklook-results">
    <div class="result-card">
      <div class="result-label">WS Damage</div>
      <div class="result-value">{{ fmt0(simulationStore.quicklookResults?.wsDamage) }}</div>
    </div>
    <div class="result-card">
      <div class="result-label">TP Round Dmg</div>
      <div class="result-value">{{ fmt0(simulationStore.quicklookResults?.tpRoundDamage) }}</div>
    </div>
    <div class="result-card">
      <div class="result-label">Time/WS (s)</div>
      <div class="result-value">{{ fmt1(simulationStore.quicklookResults?.timePerWs) }}</div>
    </div>
    <div class="result-card">
      <div class="result-label">DPS</div>
      <div class="result-value">{{ fmt1(simulationStore.quicklookResults?.dps) }}</div>
    </div>
  </div>
</template>

<style scoped>
.quicklook-results {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: #0d1226;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  justify-content: flex-start;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 16px;
  background: #16213e;
  border: 1px solid #2a3a6a;
  border-radius: 4px;
  min-width: 100px;
}

.result-label {
  font-size: 0.68rem;
  color: #8888aa;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #a0e0ff;
  margin-top: 2px;
}
</style>
