<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGearStore } from '@/stores/useGearStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import JobEnemyTab from '@/components/tabs/JobEnemyTab.vue'
import BuffsTab from '@/components/tabs/BuffsTab.vue'
import ResultsTab from '@/components/tabs/ResultsTab.vue'
import AutomatonTab from '@/components/tabs/AutomatonTab.vue'
import {
  useAppStateApi,
  type SavedAppState,
} from '@/composables/useAppStateApi'

const gearStore = useGearStore()
const characterStore = useCharacterStore()
const buffStore = useBuffStore()
const { packGearset, unpackGearset, saveAppState, fetchAppState, isValidKey } = useAppStateApi()

// ─── Share dialog state ───────────────────────────────────────────────────────
const shareDialogVisible = ref(false)
const shareUrl = ref('')
const saving = ref(false)
const saveError = ref('')
const loadError = ref('')
const copiedToClipboard = ref(false)

// ─── Build a SavedAppState snapshot from current stores ───────────────────────
function buildSnapshot(): SavedAppState {
  const c = characterStore
  const b = buffStore
  return {
    v: 1,
    character: {
      mainJob: c.mainJob,
      subJob: c.subJob,
      mainJobLevel: c.mainJobLevel,
      subJobLevel: c.subJobLevel,
      masterLevel: c.masterLevel,
      odysseyRank: c.odysseyRank,
      tp1: packGearset(c.tpGearset),
      ws1: packGearset(c.wsGearset),
      tp2: packGearset(c.tpGearset2),
      ws2: packGearset(c.wsGearset2),
      enemy: { ...c.enemy },
      wsName: c.wsName,
      wsThreshold: c.wsThreshold,
      abilities: { ...c.abilities },
    },
    buffs: {
      brdEnabled: b.brdEnabled,
      songs: JSON.parse(JSON.stringify(b.songs)),
      soulVoice: b.soulVoice,
      marcato: b.marcato,
      songBonus: b.songBonus,
      corEnabled: b.corEnabled,
      rolls: JSON.parse(JSON.stringify(b.rolls)),
      rollBonus: b.rollBonus,
      crookedCards: b.crookedCards,
      jobBonus: b.jobBonus,
      lightShot: b.lightShot,
      geoEnabled: b.geoEnabled,
      bubbles: JSON.parse(JSON.stringify(b.bubbles)),
      bolster: b.bolster,
      blazeOfGlory: b.blazeOfGlory,
      bubbleBonus: b.bubbleBonus,
      bubblePotency: b.bubblePotency,
      whmEnabled: b.whmEnabled,
      hasteSpell: b.hasteSpell,
      diaSpell: b.diaSpell,
      boostSpell: b.boostSpell,
      stormSpell: b.stormSpell,
      shellV: b.shellV,
      food: b.food,
    },
  }
}

// ─── Apply a loaded snapshot to the stores ────────────────────────────────────
function applySnapshot(snap: SavedAppState) {
  const c = characterStore
  const b = buffStore

  // Character
  c.mainJob = snap.character.mainJob as typeof c.mainJob
  c.subJob = snap.character.subJob as typeof c.subJob
  c.mainJobLevel = snap.character.mainJobLevel
  c.subJobLevel = snap.character.subJobLevel
  c.masterLevel = snap.character.masterLevel
  c.odysseyRank = snap.character.odysseyRank

  const allGear = gearStore.allGear
  c.replaceGearset('tp1', unpackGearset(snap.character.tp1, allGear).gearset)
  c.replaceGearset('ws1', unpackGearset(snap.character.ws1, allGear).gearset)
  c.replaceGearset('tp2', unpackGearset(snap.character.tp2, allGear).gearset)
  c.replaceGearset('ws2', unpackGearset(snap.character.ws2, allGear).gearset)

  c.enemy = { ...snap.character.enemy }
  c.wsName = snap.character.wsName
  c.wsThreshold = snap.character.wsThreshold
  c.abilities = { ...snap.character.abilities }

  // Buffs
  const bs = snap.buffs
  b.brdEnabled = bs.brdEnabled
  b.songs = JSON.parse(JSON.stringify(bs.songs))
  b.soulVoice = bs.soulVoice
  b.marcato = bs.marcato
  b.songBonus = bs.songBonus
  b.corEnabled = bs.corEnabled
  b.rolls = JSON.parse(JSON.stringify(bs.rolls))
  b.rollBonus = bs.rollBonus
  b.crookedCards = bs.crookedCards
  b.jobBonus = bs.jobBonus
  b.lightShot = bs.lightShot
  b.geoEnabled = bs.geoEnabled
  b.bubbles = JSON.parse(JSON.stringify(bs.bubbles))
  b.bolster = bs.bolster
  b.blazeOfGlory = bs.blazeOfGlory
  b.bubbleBonus = bs.bubbleBonus
  b.bubblePotency = bs.bubblePotency
  b.whmEnabled = bs.whmEnabled
  b.hasteSpell = bs.hasteSpell
  b.diaSpell = bs.diaSpell
  b.boostSpell = bs.boostSpell
  b.stormSpell = bs.stormSpell
  b.shellV = bs.shellV
  b.food = bs.food
}

// ─── Save & Share ─────────────────────────────────────────────────────────────
async function onSaveAndShare() {
  saving.value = true
  saveError.value = ''
  try {
    const key = await saveAppState(buildSnapshot())
    window.location.hash = key
    shareUrl.value = `${window.location.origin}${window.location.pathname}#${key}`
    shareDialogVisible.value = true
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    saving.value = false
  }
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copiedToClipboard.value = true
    setTimeout(() => { copiedToClipboard.value = false }, 1500)
  } catch {
    saveError.value = 'Clipboard write failed — please copy the URL manually.'
  }
}

// ─── Load state from URL hash on mount ───────────────────────────────────────
onMounted(async () => {
  await gearStore.loadGearData()

  const hash = window.location.hash.replace(/^#/, '').trim()
  if (!isValidKey(hash)) return

  if (!gearStore.loaded) {
    loadError.value = 'Gear data failed to load; cannot restore saved state.'
    return
  }

  try {
    const snap = await fetchAppState(hash)
    if (snap) {
      applySnapshot(snap)
    } else {
      loadError.value = `State key "${hash}" not found.`
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Load failed'
  }
})
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <h1>FFXI Damage Simulator</h1>
      <div class="header-actions">
        <span v-if="loadError" class="load-error">{{ loadError }}</span>
        <span v-if="saveError" class="load-error">{{ saveError }}</span>
        <Button
          label="Save & Share"
          icon="pi pi-share-alt"
          size="small"
          severity="secondary"
          :loading="saving"
          @click="onSaveAndShare"
        />
      </div>
    </div>

    <Tabs value="0" class="app-tabs">
      <TabList>
        <Tab value="0">Job &amp; Enemy</Tab>
        <Tab value="1">Buffs</Tab>
        <Tab value="2">Results</Tab>
        <Tab v-if="characterStore.mainJob === 'pup'" value="3">Automaton</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0"><JobEnemyTab /></TabPanel>
        <TabPanel value="1"><BuffsTab /></TabPanel>
        <TabPanel value="2"><ResultsTab /></TabPanel>
        <TabPanel v-if="characterStore.mainJob === 'pup'" value="3"><AutomatonTab /></TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Share dialog -->
    <Dialog
      v-model:visible="shareDialogVisible"
      header="Share This Setup"
      modal
      :style="{ width: '420px' }"
    >
      <p class="share-hint">Anyone with this link can load your current setup:</p>
      <div class="share-url-row">
        <span class="share-url-text">{{ shareUrl }}</span>
        <Button
          :label="copiedToClipboard ? 'Copied!' : 'Copy'"
          icon="pi pi-copy"
          size="small"
          @click="copyShareUrl"
        />
      </div>
    </Dialog>
  </div>
</template>

<style>
.app-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 8px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
}

.app-header h1 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #a0c4ff;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.load-error {
  font-size: 0.78rem;
  color: #ff8080;
}

.app-tabs {
  width: 100%;
}

.share-hint {
  font-size: 0.85rem;
  color: #a0b8d8;
  margin: 0 0 10px;
}

.share-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0c1428;
  border: 1px solid #2e3f6a;
  border-radius: 4px;
  padding: 6px 10px;
}

.share-url-text {
  flex: 1;
  font-size: 0.78rem;
  font-family: 'Courier New', monospace;
  color: #c8e0ff;
  word-break: break-all;
}
</style>
