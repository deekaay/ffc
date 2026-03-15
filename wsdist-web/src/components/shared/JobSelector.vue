<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useCharacterStore, JOB_NAMES, JOBS_DICT } from '@/stores/useCharacterStore'
import { WS_BY_JOB, DEFAULT_WS_BY_JOB } from '@/data/weaponskillsByJob'

const characterStore = useCharacterStore()

const jobOptions = JOB_NAMES.map((name) => ({
  label: name,
  value: JOBS_DICT[name],
}))

const wsNameOptions = computed(() => {
  const list = WS_BY_JOB[characterStore.mainJob as keyof typeof WS_BY_JOB] ?? []
  return list.map((n) => ({ label: n, value: n }))
})

function enforceWsName(jobCode: string) {
  const available = WS_BY_JOB[jobCode as keyof typeof WS_BY_JOB] ?? []
  if (!available.includes(characterStore.wsName)) {
    characterStore.wsName = DEFAULT_WS_BY_JOB[jobCode as keyof typeof DEFAULT_WS_BY_JOB]
      ?? available[0]
      ?? ''
  }
}

// On mount, validate any persisted wsName against the current job
onMounted(() => enforceWsName(characterStore.mainJob))

const mainJobModel = computed({
  get: () => characterStore.mainJob,
  set: (v: string) => {
    characterStore.setMainJob(v)
    enforceWsName(v)
  },
})

const subJobModel = computed({
  get: () => characterStore.subJob,
  set: (v: string) => characterStore.setSubJob(v),
})

const masterLevelModel = computed({
  get: () => characterStore.masterLevel,
  set: (v: number | null) => { characterStore.masterLevel = v ?? 0 },
})

const wsThresholdModel = computed({
  get: () => characterStore.wsThreshold,
  set: (v: number | null) => { characterStore.wsThreshold = v ?? 1000 },
})

const wsNameModel = computed({
  get: () => characterStore.wsName,
  set: (v: string) => { characterStore.wsName = v },
})
</script>

<template>
  <div class="job-selector">
    <div class="section-title">Job / WS</div>
    <div class="field-row">
      <label>Main Job</label>
      <Select
        v-model="mainJobModel"
        :options="jobOptions"
        option-label="label"
        option-value="value"
        class="compact-select"
      />
    </div>
    <div class="field-row">
      <label>Sub Job</label>
      <Select
        v-model="subJobModel"
        :options="jobOptions"
        option-label="label"
        option-value="value"
        class="compact-select"
      />
    </div>
    <div class="field-row">
      <label>Master Level</label>
      <InputNumber
        v-model="masterLevelModel"
        :min="0"
        :max="50"
        :step="1"
        show-buttons
        class="compact-input"
      />
    </div>
    <div class="field-row">
      <label>WS Threshold</label>
      <InputNumber
        v-model="wsThresholdModel"
        :min="1000"
        :max="3000"
        :step="100"
        show-buttons
        class="compact-input"
      />
    </div>
    <div class="field-row">
      <label>Weapon Skill</label>
      <Select
        v-model="wsNameModel"
        :options="wsNameOptions"
        option-label="label"
        option-value="value"
        editable
        class="compact-select ws-select"
      />
    </div>
  </div>
</template>

<style scoped>
.job-selector {
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

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-row label {
  font-size: 0.75rem;
  color: #a0a0c0;
  width: 96px;
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
  font-size: 0.8rem;
}

.ws-select {
  min-width: 160px;
}
</style>
