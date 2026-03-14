<script setup lang="ts">
import { computed } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import BuffPanel from '@/components/shared/BuffPanel.vue'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'

const characterStore = useCharacterStore()
const buffStore = useBuffStore()

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

const berserk          = abBool('Berserk')
const aggressor        = abBool('Aggressor')
const focus            = abBool('Focus')
const footwork         = abBool('Footwork')
const impetus          = abBool('Impetus')
const lastResort       = abBool('Last Resort')
const endark2          = abBool('Endark II')
const hasso            = abBool('Hasso')
const sneakAttack      = abBool('Sneak Attack')
const trickAttack      = abBool('Trick Attack')
const buildingFlourish = abBool('Building Flourish')
const saberDance       = abBool('Saber Dance')
const velocityShot     = abBool('Velocity Shot')
const doubleShot       = abBool('Double Shot')
const tripleShot       = abBool('Triple Shot')
const innin            = abBool('Innin')
const bloodRage        = abBool('Blood Rage')
const warcry           = abBool('Warcry')
const enspell          = abBool('EnSpell')
const enlight2         = abBool('Enlight II')
const composure        = abBool('Composure')
const aftermath        = abNum('Aftermath')
const enhancingSkill   = abNum('Enhancing Skill')

const stormOptions = computed(() => {
  const keys = buffStore.buffsData
    ? Object.keys(buffStore.buffsData.whm).filter((k) => k.toLowerCase().includes('storm'))
    : []
  return [{ label: 'None', value: 'None' }, ...keys.map((k) => ({ label: k, value: k }))]
})

const stormModel = computed({
  get: () => buffStore.stormSpell,
  set: (v: string) => { buffStore.stormSpell = v },
})
</script>

<template>
  <div class="buffs-tab">
    <div class="buffs-layout">
      <!-- Abilities -->
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
          <InputNumber v-model="aftermath" :min="0" :max="3" :step="1" show-buttons class="compact-input" />
        </div>
        <div class="field-row mt4">
          <label>Enhancing Skill</label>
          <InputNumber v-model="enhancingSkill" :min="0" :max="600" :step="1" class="compact-input" />
        </div>
        <div class="field-row mt4">
          <label>Storm Spell</label>
          <Select v-model="stormModel" :options="stormOptions" option-label="label" option-value="value" class="compact-select" />
        </div>
      </div>

      <!-- Support job buffs -->
      <div class="buff-panel-wrapper">
        <BuffPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.buffs-tab {
  padding: 10px;
  color: #e0e0e0;
}

.buffs-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.abilities-panel {
  flex: 0 0 220px;
  padding: 8px;
  background: #16213e;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.buff-panel-wrapper {
  flex: 1 1 400px;
  min-width: 0;
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

.compact-input  { flex: 1; min-width: 0; font-size: 0.78rem; }
.compact-select { flex: 1; min-width: 0; font-size: 0.78rem; }
.mt4 { margin-top: 4px; }
</style>
