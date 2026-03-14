<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useCharacterStore } from '@/stores/useCharacterStore'
import type { EnemyDef } from '@/types/enemy'

const characterStore = useCharacterStore()

const presetEnemies = ref<EnemyDef[]>([])
const selectedPreset = ref<string>('Custom')

const presetOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  try {
    const base = import.meta.env.BASE_URL
    const res = await fetch(`${base}data/enemies.json`)
    if (res.ok) {
      const data: EnemyDef[] = await res.json()
      presetEnemies.value = data
      presetOptions.value = [
        { label: 'Custom', value: 'Custom' },
        ...data.map((e) => ({ label: `${e.Name} (Lv${e.Level})`, value: e.Name })),
      ]
    }
  } catch (e) {
    console.error('Failed to load enemies:', e)
  }
})

function onPresetSelect(name: string) {
  selectedPreset.value = name
  if (name === 'Custom') return
  const found = presetEnemies.value.find((e) => e.Name === name)
  if (found) {
    characterStore.setEnemy(found)
  }
}

const STAT_FIELDS: { key: keyof EnemyDef; label: string }[] = [
  { key: 'Defense', label: 'Defense' },
  { key: 'Evasion', label: 'Evasion' },
  { key: 'VIT', label: 'VIT' },
  { key: 'AGI', label: 'AGI' },
  { key: 'INT', label: 'INT' },
  { key: 'MND', label: 'MND' },
  { key: 'Magic Evasion', label: 'Magic Evasion' },
  { key: 'Magic Defense', label: 'Magic Defense' },
]

function getEnemyStat(key: keyof EnemyDef): number {
  return (characterStore.enemy[key] as number) ?? 0
}

function setEnemyStat(key: keyof EnemyDef, val: number | null) {
  ;(characterStore.enemy as Record<string, unknown>)[key] = val ?? 0
  selectedPreset.value = 'Custom'
}
</script>

<template>
  <div class="enemy-panel">
    <div class="section-title">Enemy</div>
    <div class="field-row">
      <label>Preset</label>
      <Select
        :model-value="selectedPreset"
        :options="presetOptions"
        option-label="label"
        option-value="value"
        class="compact-select"
        @update:model-value="onPresetSelect"
      />
    </div>
    <div class="stat-grid">
      <div v-for="field in STAT_FIELDS" :key="field.key" class="field-row">
        <label>{{ field.label }}</label>
        <InputNumber
          :model-value="getEnemyStat(field.key)"
          :min="0"
          :step="1"
          class="compact-input"
          @update:model-value="(v) => setEnemyStat(field.key, v)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.enemy-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #16213e;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-row label {
  font-size: 0.73rem;
  color: #a0a0c0;
  width: 80px;
  flex-shrink: 0;
}

.compact-select {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
}

.compact-input {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
}
</style>
