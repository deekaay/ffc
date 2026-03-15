<script setup lang="ts">
import { computed } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import JobSelector from '@/components/shared/JobSelector.vue'
import EnemyPanel from '@/components/shared/EnemyPanel.vue'
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

// Returns true when any of the given job codes matches main or sub job
function visibleFor(...jobs: string[]) {
  return computed(() =>
    jobs.includes(characterStore.mainJob) || jobs.includes(characterStore.subJob)
  )
}

const showWar = visibleFor('war')
const showMnk = visibleFor('mnk')
const showDrk = visibleFor('drk')
const showSam = visibleFor('sam')
const showThf = visibleFor('thf')
const showDnc = visibleFor('dnc')
const showRng = visibleFor('rng')
const showCor = visibleFor('cor')
const showNin = visibleFor('nin')
const showRdm = visibleFor('rdm')
const showPld = visibleFor('pld')
const showRun = visibleFor('run')
const showSch = visibleFor('sch')
const showGeo = visibleFor('geo')
const showBst = visibleFor('bst')
const showBlm = visibleFor('blm')
const showSmn = visibleFor('smn')

// WAR
const berserk          = abBool('Berserk')
const aggressor        = abBool('Aggressor')
const bloodRage        = abBool('Blood Rage')
const mightyStrikes    = abBool('Mighty Strikes')
const warcry           = abBool('Warcry')
const warcrySub        = abBool('Warcry (sub)')

// MNK
const focus            = abBool('Focus')
const footwork         = abBool('Footwork')
const impetus          = abBool('Impetus')

// DRK
const lastResort       = abBool('Last Resort')
const endark2          = abBool('Endark II')

// SAM
const hasso            = abBool('Hasso')
const overwhelm        = abBool('Overwhelm')

// THF
const sneakAttack      = abBool('Sneak Attack')
const trickAttack      = abBool('Trick Attack')

// DNC
const buildingFlourish = abBool('Building Flourish')
const saberDance       = abBool('Saber Dance')
const closedPosition   = abBool('Closed Position')
const hasteSambaSub    = abBool('Haste Samba (sub)')

// RNG
const velocityShot     = abBool('Velocity Shot')
const doubleShot       = abBool('Double Shot')
const barrage          = abBool('Barrage')
const hoverShot        = abBool('Hover Shot')
const sharpshot        = abBool('Sharpshot')
const trueShot         = abBool('True Shot')

// COR
const tripleShot       = abBool('Triple Shot')
const conspirator      = abBool('Conspirator')

// NIN
const innin            = abBool('Innin')
const futae            = abBool('Futae')
const sange            = abBool('Sange')

// RDM
const enspell          = abBool('EnSpell')
const composure        = abBool('Composure')
const temperII         = abBool('Temper II')
const chainspell       = abBool('Chainspell')

// PLD
const enlight2         = abBool('Enlight II')
const divineEmblem     = abBool('Divine Emblem')

// RUN
const temper           = abBool('Temper')
const swordplay        = abBool('Swordplay')

// SCH
const ebullience       = abBool('Ebullience')
const enlightenment    = abBool('Enlightenment')
const klimaform        = abBool('Klimaform')

// GEO
const theurgicFocus    = abBool('Theurgic Focus')

// BST
const rage             = abBool('Rage')
const frenziedRage     = abBool('Frenzied Rage')

// BLM
const manafont         = abBool('Manafont')
const manawell         = abBool('Manawell')

// SMN
const ifritsFavor      = abBool("Ifrit's Favor")
const shivasFavor      = abBool("Shiva's Favor")
const ramuhsFavor      = abBool("Ramuh's Favor")

// All-job party buffs
const mightyGuard      = abBool('Mighty Guard')
const crimsonHowl      = abBool('Crimson Howl')
const crystalBlessing  = abBool('Crystal Blessing')
const naturesMeditation = abBool("Nature's Meditation")
const hasteSamba       = abBool('Haste Samba')

// Numeric
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
  <div class="job-enemy-tab">
    <div class="main-grid">
      <div class="col col-left">
        <JobSelector />

        <div class="abilities-panel">
          <div class="section-title">Abilities</div>

          <div v-if="showWar" class="ability-group">
            <div class="group-label">WAR</div>
            <label><input type="checkbox" v-model="berserk" /> Berserk</label>
            <label><input type="checkbox" v-model="aggressor" /> Aggressor</label>
            <label><input type="checkbox" v-model="warcry" /> Warcry</label>
            <label><input type="checkbox" v-model="mightyStrikes" /> Mighty Strikes</label>
            <label><input type="checkbox" v-model="bloodRage" /> Blood Rage</label>
            <label><input type="checkbox" v-model="warcrySub" /> Warcry (sub)</label>
          </div>

          <div v-if="showMnk" class="ability-group">
            <div class="group-label">MNK</div>
            <label><input type="checkbox" v-model="focus" /> Focus</label>
            <label><input type="checkbox" v-model="footwork" /> Footwork</label>
            <label><input type="checkbox" v-model="impetus" /> Impetus</label>
          </div>

          <div v-if="showDrk" class="ability-group">
            <div class="group-label">DRK</div>
            <label><input type="checkbox" v-model="lastResort" /> Last Resort</label>
            <label><input type="checkbox" v-model="endark2" /> Endark II</label>
          </div>

          <div v-if="showSam" class="ability-group">
            <div class="group-label">SAM</div>
            <label><input type="checkbox" v-model="hasso" /> Hasso</label>
            <label><input type="checkbox" v-model="overwhelm" /> Overwhelm</label>
          </div>

          <div v-if="showThf" class="ability-group">
            <div class="group-label">THF</div>
            <label><input type="checkbox" v-model="sneakAttack" /> Sneak Attack</label>
            <label><input type="checkbox" v-model="trickAttack" /> Trick Attack</label>
          </div>

          <div v-if="showDnc" class="ability-group">
            <div class="group-label">DNC</div>
            <label><input type="checkbox" v-model="buildingFlourish" /> Building Flourish</label>
            <label><input type="checkbox" v-model="saberDance" /> Saber Dance</label>
            <label><input type="checkbox" v-model="closedPosition" /> Closed Position</label>
            <label><input type="checkbox" v-model="hasteSambaSub" /> Haste Samba (sub)</label>
          </div>

          <div v-if="showRng" class="ability-group">
            <div class="group-label">RNG</div>
            <label><input type="checkbox" v-model="velocityShot" /> Velocity Shot</label>
            <label><input type="checkbox" v-model="doubleShot" /> Double Shot</label>
            <label><input type="checkbox" v-model="barrage" /> Barrage</label>
            <label><input type="checkbox" v-model="hoverShot" /> Hover Shot</label>
            <label><input type="checkbox" v-model="sharpshot" /> Sharpshot</label>
            <label><input type="checkbox" v-model="trueShot" /> True Shot</label>
          </div>

          <div v-if="showCor" class="ability-group">
            <div class="group-label">COR</div>
            <label><input type="checkbox" v-model="tripleShot" /> Triple Shot</label>
            <label><input type="checkbox" v-model="conspirator" /> Conspirator</label>
            <label><input type="checkbox" v-model="trueShot" /> True Shot</label>
          </div>

          <div v-if="showNin" class="ability-group">
            <div class="group-label">NIN</div>
            <label><input type="checkbox" v-model="innin" /> Innin</label>
            <label><input type="checkbox" v-model="futae" /> Futae</label>
            <label><input type="checkbox" v-model="sange" /> Sange</label>
          </div>

          <div v-if="showRdm" class="ability-group">
            <div class="group-label">RDM</div>
            <label><input type="checkbox" v-model="enspell" /> EnSpell</label>
            <label><input type="checkbox" v-model="composure" /> Composure</label>
            <label><input type="checkbox" v-model="temperII" /> Temper II</label>
            <label><input type="checkbox" v-model="chainspell" /> Chainspell</label>
          </div>

          <div v-if="showPld" class="ability-group">
            <div class="group-label">PLD</div>
            <label><input type="checkbox" v-model="enlight2" /> Enlight II</label>
            <label><input type="checkbox" v-model="divineEmblem" /> Divine Emblem</label>
          </div>

          <div v-if="showRun" class="ability-group">
            <div class="group-label">RUN</div>
            <label><input type="checkbox" v-model="temper" /> Temper</label>
            <label><input type="checkbox" v-model="swordplay" /> Swordplay</label>
          </div>

          <div v-if="showSch" class="ability-group">
            <div class="group-label">SCH</div>
            <label><input type="checkbox" v-model="ebullience" /> Ebullience</label>
            <label><input type="checkbox" v-model="enlightenment" /> Enlightenment</label>
            <label><input type="checkbox" v-model="klimaform" /> Klimaform</label>
          </div>

          <div v-if="showGeo" class="ability-group">
            <div class="group-label">GEO</div>
            <label><input type="checkbox" v-model="theurgicFocus" /> Theurgic Focus</label>
          </div>

          <div v-if="showBst" class="ability-group">
            <div class="group-label">BST</div>
            <label><input type="checkbox" v-model="rage" /> Rage</label>
            <label><input type="checkbox" v-model="frenziedRage" /> Frenzied Rage</label>
          </div>

          <div v-if="showBlm" class="ability-group">
            <div class="group-label">BLM</div>
            <label><input type="checkbox" v-model="manafont" /> Manafont</label>
            <label><input type="checkbox" v-model="manawell" /> Manawell</label>
          </div>

          <div v-if="showSmn" class="ability-group">
            <div class="group-label">SMN</div>
            <label><input type="checkbox" v-model="ifritsFavor" /> Ifrit's Favor</label>
            <label><input type="checkbox" v-model="shivasFavor" /> Shiva's Favor</label>
            <label><input type="checkbox" v-model="ramuhsFavor" /> Ramuh's Favor</label>
          </div>

          <div class="ability-group">
            <div class="group-label">All</div>
            <label><input type="checkbox" v-model="mightyGuard" /> Mighty Guard</label>
            <label><input type="checkbox" v-model="crimsonHowl" /> Crimson Howl</label>
            <label><input type="checkbox" v-model="crystalBlessing" /> Crystal Blessing</label>
            <label><input type="checkbox" v-model="naturesMeditation" /> Nature's Med.</label>
            <label><input type="checkbox" v-model="hasteSamba" /> Haste Samba</label>
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
      </div>

      <div class="col col-right">
        <EnemyPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.job-enemy-tab {
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

.col-left  { flex: 0 0 220px; }
.col-right { flex: 0 0 260px; }

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

.compact-input  { flex: 1; min-width: 0; font-size: 0.78rem; }
.compact-select { flex: 1; min-width: 0; font-size: 0.78rem; }
.mt4 { margin-top: 4px; }

@media (max-width: 600px) {
  .col-left, .col-right { flex: 1 1 100%; }
}
</style>
