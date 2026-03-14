<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import GearPanel from '@/components/shared/GearPanel.vue'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import type { GearSlotName, GearItem } from '@/types/gear'

import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const simulationStore = useSimulationStore()
const characterStore = useCharacterStore()

function onGearUpdate(context: 'tp' | 'ws', slot: GearSlotName, item: GearItem) {
  characterStore.setGear(context, slot, item)
}

const results = computed(() => simulationStore.simulationResults)

// Sample arrays down to max 500 points
function sampleArray(arr: number[], maxPoints = 500): number[] {
  if (arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  const out: number[] = []
  for (let i = 0; i < arr.length; i += step) out.push(arr[i])
  return out
}

const chartData = computed(() => {
  const r = results.value
  if (!r) return null

  const timeArr = sampleArray(r.timeData)
  const dmgArr = sampleArray(r.damageData)
  const tpArr = sampleArray(r.tpDamageData)
  const wsArr = sampleArray(r.wsDamageData)

  const labels = timeArr.map((t) => t.toFixed(1))

  // Convert cumulative damage to DPS at each sample point
  const dpsSeries = dmgArr.map((d, i) => (timeArr[i] > 0 ? d / timeArr[i] : 0))
  const tpDpsSeries = tpArr.map((d, i) => (timeArr[i] > 0 ? d / timeArr[i] : 0))
  const wsDpsSeries = wsArr.map((d, i) => (timeArr[i] > 0 ? d / timeArr[i] : 0))

  return {
    labels,
    datasets: [
      {
        label: 'Total DPS',
        data: dpsSeries,
        borderColor: '#a0c4ff',
        backgroundColor: 'rgba(160,196,255,0.1)',
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: 'TP DPS',
        data: tpDpsSeries,
        borderColor: '#90e0b0',
        backgroundColor: 'rgba(144,224,176,0.1)',
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: 'WS DPS',
        data: wsDpsSeries,
        borderColor: '#ffb3a7',
        backgroundColor: 'rgba(255,179,167,0.1)',
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  animation: false as const,
  plugins: {
    legend: { labels: { color: '#e0e0e0', font: { size: 11 } } },
    title: {
      display: true,
      text: 'DPS over Time',
      color: '#a0c4ff',
      font: { size: 13 },
    },
  },
  scales: {
    x: {
      ticks: { color: '#888', maxTicksLimit: 10 },
      grid: { color: '#1e2c50' },
      title: { display: true, text: 'Time (s)', color: '#888' },
    },
    y: {
      ticks: { color: '#888' },
      grid: { color: '#1e2c50' },
      title: { display: true, text: 'DPS', color: '#888' },
    },
  },
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
</script>

<template>
  <div class="sims-tab">
    <!-- Gear panels side by side -->
    <div class="gear-row">
      <div class="gear-col">
        <GearPanel
          context="tp"
          :gearset="characterStore.tpGearset"
          :job-code="characterStore.mainJob"
          title="TP Set"
          @update:gear="(slot, item) => onGearUpdate('tp', slot, item)"
        />
      </div>
      <div class="gear-col">
        <GearPanel
          context="ws"
          :gearset="characterStore.wsGearset"
          :job-code="characterStore.mainJob"
          title="WS Set"
          @update:gear="(slot, item) => onGearUpdate('ws', slot, item)"
        />
      </div>
    </div>

    <!-- Run button -->
    <div class="controls-row">
      <Button
        label="Run 2-Hour Simulation"
        :disabled="simulationStore.simulationRunning"
        severity="primary"
        @click="simulationStore.runSimulation()"
      />
      <Button
        v-if="simulationStore.simulationRunning"
        label="Cancel"
        severity="secondary"
        @click="simulationStore.cancelSimulation()"
      />
    </div>

    <!-- Progress bar -->
    <div v-if="simulationStore.simulationRunning || simulationStore.simulationProgress > 0" class="progress-row">
      <ProgressBar :value="simulationStore.simulationProgress" class="sim-progress" />
    </div>

    <!-- Results -->
    <div v-if="results" class="results-section">
      <div class="section-title">Simulation Results</div>

      <table class="stats-table">
        <tbody>
          <tr>
            <td class="stat-label">Total DPS</td>
            <td class="stat-value">{{ fmt(results.dps) }}</td>
            <td class="stat-label">TP DPS</td>
            <td class="stat-value">{{ fmt(results.tpDamage / (results.totalDamage / results.dps || 1)) }}</td>
            <td class="stat-label">WS DPS</td>
            <td class="stat-value">{{ fmt(results.wsDamage / (results.totalDamage / results.dps || 1)) }}</td>
          </tr>
          <tr>
            <td class="stat-label">Total Damage</td>
            <td class="stat-value">{{ results.totalDamage.toLocaleString() }}</td>
            <td class="stat-label">TP Damage</td>
            <td class="stat-value">{{ results.tpDamage.toLocaleString() }}</td>
            <td class="stat-label">WS Damage</td>
            <td class="stat-value">{{ results.wsDamage.toLocaleString() }}</td>
          </tr>
          <tr>
            <td class="stat-label">Avg Dmg/Attack</td>
            <td class="stat-value">{{ fmt(results.avgTpDmg) }}</td>
            <td class="stat-label">Avg WS Damage</td>
            <td class="stat-value">{{ fmt(results.avgWsDmg) }}</td>
            <td class="stat-label">Avg TP at WS</td>
            <td class="stat-value">{{ fmt(results.avgWsTp) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Chart -->
      <div v-if="chartData" class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sims-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  color: #e0e0e0;
  background: #1a1a2e;
  min-height: 0;
}

.gear-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.gear-col {
  flex: 0 0 auto;
}

.controls-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.progress-row {
  width: 100%;
  max-width: 600px;
}

.sim-progress {
  height: 18px;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-table {
  border-collapse: collapse;
  background: #16213e;
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.82rem;
  width: auto;
}

.stats-table tr:nth-child(even) {
  background: #1a2540;
}

.stats-table td {
  padding: 5px 10px;
  border: 1px solid #1e2c50;
}

.stat-label {
  color: #a0a0c0;
  font-weight: 600;
  white-space: nowrap;
}

.stat-value {
  color: #e0e0ff;
  text-align: right;
  min-width: 80px;
}

.chart-wrapper {
  background: #16213e;
  border: 1px solid #1e2c50;
  border-radius: 6px;
  padding: 10px;
  max-width: 800px;
}
</style>
