<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'

const buffStore = useBuffStore()
const gearStore = useGearStore()

onMounted(async () => {
  await buffStore.ensureBuffsLoaded()
})

// ── BRD ──────────────────────────────────────────────────────────────────────
const brdSongOptions = computed(() => {
  const keys = buffStore.buffsData ? Object.keys(buffStore.buffsData.brd) : []
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})

// ── COR ──────────────────────────────────────────────────────────────────────
const corRollOptions = computed(() => {
  const keys = buffStore.buffsData ? Object.keys(buffStore.buffsData.cor) : []
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})

const ROLL_VALUES = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'].map((v) => ({ label: v, value: v }))

// ── GEO ──────────────────────────────────────────────────────────────────────
const geoBubbleOptions = computed(() => {
  const keys = buffStore.buffsData
    ? [...new Set([...Object.keys(buffStore.buffsData.geo), ...Object.keys(buffStore.buffsData.geo_debuffs)])]
    : []
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})

// ── WHM ──────────────────────────────────────────────────────────────────────
const whmSpellOptions = computed(() => {
  const keys = buffStore.buffsData ? Object.keys(buffStore.buffsData.whm) : []
  return [{ label: 'None', value: 'None' }, ...keys.filter((k) => k !== 'Shell V').map((k) => ({ label: k, value: k }))]
})

// ── Food ─────────────────────────────────────────────────────────────────────
const foodOptions = computed(() => {
  const keys = Object.keys(gearStore.allFood)
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})
</script>

<template>
  <div class="buff-panel">
    <!-- BRD ------------------------------------------------------------------>
    <div class="buff-section">
      <div class="section-header">
        <input type="checkbox" v-model="buffStore.brdEnabled" id="brd-enable" />
        <label for="brd-enable" class="section-title">BRD</label>
      </div>
      <div v-show="buffStore.brdEnabled" class="section-body">
        <div class="songs-grid">
          <div v-for="(song, i) in buffStore.songs" :key="i" class="field-row">
            <label class="slot-label">Song {{ i + 1 }}</label>
            <Select
              v-model="song.name"
              :options="brdSongOptions"
              option-label="label"
              option-value="value"
              class="compact-select"
            />
          </div>
        </div>
        <div class="checkbox-row">
          <label><input type="checkbox" v-model="buffStore.soulVoice" /> Soul Voice</label>
          <label><input type="checkbox" v-model="buffStore.marcato" /> Marcato</label>
        </div>
        <div class="field-row">
          <label>Songs Bonus</label>
          <InputNumber v-model="buffStore.songBonus" :min="0" :max="11" :step="1" show-buttons class="compact-input" />
        </div>
      </div>
    </div>

    <!-- COR ------------------------------------------------------------------>
    <div class="buff-section">
      <div class="section-header">
        <input type="checkbox" v-model="buffStore.corEnabled" id="cor-enable" />
        <label for="cor-enable" class="section-title">COR</label>
      </div>
      <div v-show="buffStore.corEnabled" class="section-body">
        <div class="rolls-grid">
          <div v-for="(roll, i) in buffStore.rolls" :key="i" class="roll-row">
            <label class="slot-label">Roll {{ i + 1 }}</label>
            <Select
              v-model="roll.name"
              :options="corRollOptions"
              option-label="label"
              option-value="value"
              class="compact-select"
            />
            <Select
              v-model="roll.value"
              :options="ROLL_VALUES"
              option-label="label"
              option-value="value"
              class="value-select"
            />
          </div>
        </div>
        <div class="checkbox-row">
          <label><input type="checkbox" v-model="buffStore.crookedCards" /> Crooked Cards</label>
          <label><input type="checkbox" v-model="buffStore.jobBonus" /> Job Bonus</label>
        </div>
        <div class="field-row">
          <label>Rolls Bonus</label>
          <InputNumber v-model="buffStore.rollBonus" :min="0" :max="11" :step="1" show-buttons class="compact-input" />
        </div>
      </div>
    </div>

    <!-- GEO ------------------------------------------------------------------>
    <div class="buff-section">
      <div class="section-header">
        <input type="checkbox" v-model="buffStore.geoEnabled" id="geo-enable" />
        <label for="geo-enable" class="section-title">GEO</label>
      </div>
      <div v-show="buffStore.geoEnabled" class="section-body">
        <div class="bubbles-grid">
          <div v-for="(bubble, i) in buffStore.bubbles" :key="i" class="field-row">
            <label class="slot-label">{{ bubble.type }}</label>
            <Select
              v-model="bubble.name"
              :options="geoBubbleOptions"
              option-label="label"
              option-value="value"
              class="compact-select"
            />
          </div>
        </div>
        <div class="checkbox-row">
          <label><input type="checkbox" v-model="buffStore.bolster" /> Bolster</label>
          <label><input type="checkbox" v-model="buffStore.blazeOfGlory" /> Blaze of Glory</label>
        </div>
        <div class="two-col">
          <div class="field-row">
            <label>Bubbles Bonus</label>
            <InputNumber v-model="buffStore.bubbleBonus" :min="0" :max="11" :step="1" show-buttons class="compact-input" />
          </div>
          <div class="field-row">
            <label>Debuff Potency %</label>
            <InputNumber v-model="buffStore.bubblePotency" :min="0" :max="100" :step="5" show-buttons class="compact-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- WHM ------------------------------------------------------------------>
    <div class="buff-section">
      <div class="section-header">
        <input type="checkbox" v-model="buffStore.whmEnabled" id="whm-enable" />
        <label for="whm-enable" class="section-title">WHM</label>
      </div>
      <div v-show="buffStore.whmEnabled" class="section-body">
        <div class="whm-grid">
          <div class="field-row">
            <label>Haste</label>
            <Select v-model="buffStore.hasteSpell" :options="whmSpellOptions" option-label="label" option-value="value" class="compact-select" />
          </div>
          <div class="field-row">
            <label>Dia</label>
            <Select v-model="buffStore.diaSpell" :options="whmSpellOptions" option-label="label" option-value="value" class="compact-select" />
          </div>
          <div class="field-row">
            <label>Boost</label>
            <Select v-model="buffStore.boostSpell" :options="whmSpellOptions" option-label="label" option-value="value" class="compact-select" />
          </div>
          <div class="field-row">
            <label>Storm</label>
            <Select v-model="buffStore.stormSpell" :options="whmSpellOptions" option-label="label" option-value="value" class="compact-select" />
          </div>
        </div>
        <div class="checkbox-row">
          <label><input type="checkbox" v-model="buffStore.shellV" /> Shell V</label>
        </div>
      </div>
    </div>

    <!-- Food ----------------------------------------------------------------->
    <div class="buff-section buff-section--inline">
      <span class="section-title">Food</span>
      <Select
        v-model="buffStore.food"
        :options="foodOptions"
        option-label="label"
        option-value="value"
        class="compact-select food-select"
      />
    </div>
  </div>
</template>

<style scoped>
.buff-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: #16213e;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
}

.buff-section {
  flex: 1 1 220px;
  min-width: 200px;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  padding: 6px;
  background: #12183a;
}

.buff-section--inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.songs-grid,
.rolls-grid,
.bubbles-grid,
.whm-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-row label {
  font-size: 0.73rem;
  color: #a0a0c0;
  width: 88px;
  flex-shrink: 0;
}

.slot-label {
  font-size: 0.72rem;
  color: #a0a0c0;
  width: 52px;
  flex-shrink: 0;
}

.compact-select {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
}

.compact-input {
  width: 120px;
  font-size: 0.78rem;
}

.value-select {
  width: 64px;
  flex-shrink: 0;
  font-size: 0.78rem;
}

.roll-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 2px 0;
}

.checkbox-row label {
  font-size: 0.73rem;
  color: #c0c0d8;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.two-col {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.food-select {
  min-width: 160px;
}
</style>
