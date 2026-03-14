<script setup lang="ts">
import { computed } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import JobSelector from '@/components/shared/JobSelector.vue'
import EnemyPanel from '@/components/shared/EnemyPanel.vue'
import BuffPanel from '@/components/shared/BuffPanel.vue'
import QuicklookResults from '@/components/shared/QuicklookResults.vue'
import GearPanel from '@/components/shared/GearPanel.vue'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'

const characterStore = useCharacterStore()
const buffStore = useBuffStore()

// ── Ability helpers ──────────────────────────────────────────────────────────
function abBool(key: string) {
  return computed({
    get: () => !!(characterStore.abilities[key]),
    set: (v: boolean) => { characterStore.abilities[key] = v },
  })
}

function abNum(key: string) {
  return computed({
    get: () => (characterStore.abilities[key] as number) ?? 0,
    set: (v: number | null) => { characterStore.abilities[key] = v ?? 0 },
  })
}

// WAR
const berserk   = abBool('Berserk')
const aggressor = abBool('Aggressor')

// MNK
const focus     = abBool('Focus')
const footwork  = abBool('Footwork')
const impetus   = abBool('Impetus')

// DRK
const lastResort = abBool('Last Resort')
const endark2    = abBool('Endark II')

// SAM
const hasso = abBool('Hasso')

// THF
const sneakAttack = abBool('Sneak Attack')
const trickAttack = abBool('Trick Attack')

// DNC
const buildingFlourish = abBool('Building Flourish')
const saberDance       = abBool('Saber Dance')

// Cross-job
const bloodRage = abBool('Blood Rage')
const warcry    = abBool('Warcry')

// Enspells / misc
const enspell    = abBool('EnSpell')
const enlight2   = abBool('Enlight II')
const composure  = abBool('Composure')

// RNG
const velocityShot = abBool('Velocity Shot')
const doubleShot   = abBool('Double Shot')

// COR
const tripleShot = abBool('Triple Shot')

// NIN
const innin = abBool('Innin')

// Aftermath
const aftermath = abNum('Aftermath')

// Enhancing Skill
const enhancingSkill = abNum('Enhancing Skill')

// Storm spell select (mirrors buffStore.stormSpell for convenience)
const stormOptions = computed(() => {
  const keys = buffStore.buffsData ? Object.keys(buffStore.buffsData.whm).filter((k) => k.toLowerCase().includes('storm')) : []
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})

const stormModel = computed({
  get: () => buffStore.stormSpell,
  set: (v: string) => { buffStore.stormSpell = v },
})

// ── Gear ─────────────────────────────────────────────────────────────────────
function onGearUpdate(slot: import('@/types/gear').GearSlotName, item: import('@/types/gear').GearItem) {
  characterStore.setGear('quicklook', slot, item)
}
</script>

<template>
  <div class="inputs-tab">
    <!-- Main grid -->
    <div class="main-grid">
      <!-- LEFT: Job selector + Abilities -->
      <div class="col col-left">
        <JobSelector />

        <div class="abilities-panel">
          <div class="section-title">Abilities</div>

          <div class="ability-group">
            <div class="group-label">WAR</div>
            <label><input type="checkbox" v-model="berserk" /> Berserk</label>
            <label><input type="checkbox" v-model="aggressor" /> Aggressor</label>
          </div>

          <div class="ability-group">
            <div class="group-label">MNK</div>
            <label><input type="checkbox" v-model="focus" /> Focus</label>
            <label><input type="checkbox" v-model="footwork" /> Footwork</label>
            <label><input type="checkbox" v-model="impetus" /> Impetus</label>
          </div>

          <div class="ability-group">
            <div class="group-label">DRK</div>
            <label><input type="checkbox" v-model="lastResort" /> Last Resort</label>
            <label><input type="checkbox" v-model="endark2" /> Endark II</label>
          </div>

          <div class="ability-group">
            <div class="group-label">SAM</div>
            <label><input type="checkbox" v-model="hasso" /> Hasso</label>
          </div>

          <div class="ability-group">
            <div class="group-label">THF</div>
            <label><input type="checkbox" v-model="sneakAttack" /> Sneak Attack</label>
            <label><input type="checkbox" v-model="trickAttack" /> Trick Attack</label>
          </div>

          <div class="ability-group">
            <div class="group-label">DNC</div>
            <label><input type="checkbox" v-model="buildingFlourish" /> Building Flourish</label>
            <label><input type="checkbox" v-model="saberDance" /> Saber Dance</label>
          </div>

          <div class="ability-group">
            <div class="group-label">RNG</div>
            <label><input type="checkbox" v-model="velocityShot" /> Velocity Shot</label>
            <label><input type="checkbox" v-model="doubleShot" /> Double Shot</label>
          </div>

          <div class="ability-group">
            <div class="group-label">COR</div>
            <label><input type="checkbox" v-model="tripleShot" /> Triple Shot</label>
          </div>

          <div class="ability-group">
            <div class="group-label">NIN</div>
            <label><input type="checkbox" v-model="innin" /> Innin</label>
          </div>

          <div class="ability-group">
            <div class="group-label">Cross</div>
            <label><input type="checkbox" v-model="bloodRage" /> Blood Rage</label>
            <label><input type="checkbox" v-model="warcry" /> Warcry</label>
          </div>

          <div class="ability-group">
            <div class="group-label">Misc</div>
            <label><input type="checkbox" v-model="enspell" /> EnSpell</label>
            <label><input type="checkbox" v-model="enlight2" /> Enlight II</label>
            <label><input type="checkbox" v-model="composure" /> Composure</label>
          </div>

          <div class="field-row mt4">
            <label>Aftermath</label>
            <InputNumber
              v-model="aftermath"
              :min="0"
              :max="3"
              :step="1"
              show-buttons
              class="compact-input"
            />
          </div>

          <div class="field-row mt4">
            <label>Enhancing Skill</label>
            <InputNumber
              v-model="enhancingSkill"
              :min="0"
              :max="600"
              :step="1"
              class="compact-input"
            />
          </div>

          <div class="field-row mt4">
            <label>Storm Spell</label>
            <Select
              v-model="stormModel"
              :options="stormOptions"
              option-label="label"
              option-value="value"
              class="compact-select"
            />
          </div>
        </div>
      </div>

      <!-- MIDDLE: Enemy panel -->
      <div class="col col-middle">
        <EnemyPanel />
      </div>

      <!-- RIGHT: Gear panel -->
      <div class="col col-right">
        <GearPanel
          context="quicklook"
          :gearset="characterStore.quicklookGearset"
          :job-code="characterStore.mainJob"
          title="Quicklook Gear"
          @update:gear="onGearUpdate"
        />
      </div>
    </div>

    <!-- BUFFS full-width -->
    <div class="full-row">
      <BuffPanel />
    </div>

    <!-- QUICKLOOK RESULTS full-width -->
    <div class="full-row">
      <QuicklookResults />
    </div>
  </div>
</template>

<style scoped>
.inputs-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  color: #e0e0e0;
  min-height: 0;
}

.main-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-left {
  flex: 0 0 220px;
}

.col-middle {
  flex: 0 0 260px;
}

.col-right {
  flex: 1 1 360px;
  min-width: 320px;
}

.full-row {
  width: 100%;
}

/* Abilities panel */
.abilities-panel {
  padding: 8px;
  background: #16213e;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a0c4ff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.ability-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  border-bottom: 1px solid #1e2c50;
}

.group-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6680aa;
  width: 36px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.ability-group label {
  font-size: 0.73rem;
  color: #c0c0d8;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  white-space: nowrap;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-row label {
  font-size: 0.73rem;
  color: #a0a0c0;
  width: 100px;
  flex-shrink: 0;
}

.compact-input {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
}

.compact-select {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
}

.mt4 {
  margin-top: 4px;
}

@media (max-width: 768px) {
  .col-left,
  .col-middle,
  .col-right {
    flex: 1 1 100%;
    min-width: 0;
  }
}
</style>
