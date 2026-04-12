<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useGearStore } from '@/stores/useGearStore'
import { fetchEquipmentSet } from '@/composables/useEquipmentSetApi'
import GearPanel from '@/components/shared/GearPanel.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import type { Gearset, GearSlotName, GearItem } from '@/types/gear'
import type { GearContext } from '@/stores/useCharacterStore'

const props = withDefaults(defineProps<{ initialKey?: string }>(), { initialKey: '' })

const charStore = useCharacterStore()
const gearStore = useGearStore()

const keyInput = ref('')
const loadedGearset = ref<Gearset | null>(null)
const loadedKey = ref('')
const loading = ref(false)
const error = ref('')
const copiedToClipboard = ref(false)

async function doLoad(key: string) {
  const trimmed = key.trim()
  if (!trimmed) return
  if (!gearStore.loaded) {
    error.value = 'Gear data is still loading — please try again in a moment.'
    return
  }
  loading.value = true
  error.value = ''
  copiedToClipboard.value = false
  loadedGearset.value = null
  loadedKey.value = ''
  try {
    const { gearset, unknownNames } = await fetchEquipmentSet(trimmed, gearStore.allGear)
    loadedGearset.value = gearset
    loadedKey.value = trimmed
    if (unknownNames.length > 0) {
      error.value = `Warning: unknown items ignored — ${unknownNames.join(', ')}`
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Load failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.initialKey) {
    keyInput.value = props.initialKey
    doLoad(props.initialKey)
  }
})

function onLocalGearUpdate(slot: GearSlotName, item: GearItem) {
  if (loadedGearset.value) {
    loadedGearset.value[slot] = item
  }
}

function applyTo(ctx: GearContext) {
  if (loadedGearset.value) {
    charStore.replaceGearset(ctx, loadedGearset.value)
  }
}

async function copyShareUrl() {
  error.value = ''
  const url = `${window.location.origin}${window.location.pathname}#set/${loadedKey.value}`
  try {
    await navigator.clipboard.writeText(url)
    copiedToClipboard.value = true
    setTimeout(() => { copiedToClipboard.value = false }, 1500)
  } catch {
    error.value = 'Clipboard write failed — copy the URL manually.'
  }
}
</script>

<template>
  <div class="item-sets-tab">

    <!-- Load bar -->
    <div class="load-bar">
      <InputText
        v-model="keyInput"
        placeholder="Paste a set key…"
        size="small"
        class="key-input"
        @keydown.enter="doLoad(keyInput)"
      />
      <Button
        label="Load"
        icon="pi pi-download"
        size="small"
        severity="secondary"
        :loading="loading"
        :disabled="!keyInput.trim()"
        @click="doLoad(keyInput)"
      />
    </div>

    <!-- Error / warning -->
    <span v-if="error" class="sets-message" :class="{ warning: error.startsWith('Warning') }">
      {{ error }}
    </span>

    <!-- Loaded set -->
    <template v-if="loadedGearset">
      <div class="loaded-header">
        <span class="loaded-key">{{ loadedKey }}</span>
        <Button
          :label="copiedToClipboard ? 'Copied!' : 'Copy Share URL'"
          icon="pi pi-copy"
          size="small"
          text
          severity="secondary"
          @click="copyShareUrl"
        />
      </div>

      <!-- context is required by GearPanel but not used for filtering; 'tp1' is a safe placeholder -->
      <GearPanel
        context="tp1"
        :gearset="loadedGearset"
        :job-code="charStore.mainJob"
        title="Loaded Set"
        @update:gear="onLocalGearUpdate"
      />

      <div class="apply-bar">
        <span class="apply-label">Apply to:</span>
        <Button label="TP Set 1" size="small" severity="secondary" @click="applyTo('tp1')" />
        <Button label="WS Set 1" size="small" severity="secondary" @click="applyTo('ws1')" />
        <Button label="TP Set 2" size="small" severity="secondary" @click="applyTo('tp2')" />
        <Button label="WS Set 2" size="small" severity="secondary" @click="applyTo('ws2')" />
      </div>
    </template>

  </div>
</template>

<style scoped>
.item-sets-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  color: #e0e0e0;
}

.load-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.key-input {
  width: 320px;
  font-size: 0.85rem;
}

.sets-message {
  font-size: 0.8rem;
  color: #ff8080;
}

.sets-message.warning {
  color: #ffcc66;
}

.loaded-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #2e3f6a;
}

.loaded-key {
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  color: #a0c4ff;
}

.apply-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.apply-label {
  font-size: 0.78rem;
  color: #8899bb;
}
</style>
