<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import GearPanel from '@/components/shared/GearPanel.vue'
import { fetchEquipmentSet } from '@/composables/useEquipmentSetApi'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useGearStore } from '@/stores/useGearStore'
import type { Gearset, GearSlotName, GearItem } from '@/types/gear'

const props = defineProps<{ initialKey?: string }>()

const characterStore = useCharacterStore()
const gearStore = useGearStore()

const keyInput = ref('')
const loadedGearset = ref<Gearset | null>(null)
const loadedKey = ref('')
const loading = ref(false)
const error = ref('')
const warning = ref('')
const copiedToClipboard = ref(false)
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (copyResetTimer) clearTimeout(copyResetTimer)
})

onMounted(() => {
  if (props.initialKey) doLoad(props.initialKey)
})

async function doLoad(key: string) {
  const trimmed = key.trim()
  if (!trimmed) return
  loading.value = true
  error.value = ''
  warning.value = ''
  loadedGearset.value = null
  loadedKey.value = ''
  try {
    const result = await fetchEquipmentSet(trimmed, gearStore.allGear)
    loadedGearset.value = result.gearset
    loadedKey.value = trimmed
    if (result.unknownNames.length > 0) {
      warning.value = `Unknown items (shown as empty): ${result.unknownNames.join(', ')}`
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Load failed'
  } finally {
    loading.value = false
  }
}

function onGearUpdate(slot: GearSlotName, item: GearItem) {
  if (loadedGearset.value) {
    loadedGearset.value = { ...loadedGearset.value, [slot]: item }
  }
}

async function copyShareUrl() {
  const url = `${window.location.origin}${window.location.pathname}#set/${loadedKey.value}`
  try {
    await navigator.clipboard.writeText(url)
    copiedToClipboard.value = true
    if (copyResetTimer) clearTimeout(copyResetTimer)
    copyResetTimer = setTimeout(() => { copiedToClipboard.value = false }, 1500)
  } catch {
    error.value = 'Clipboard write failed — copy the URL manually.'
  }
}
</script>

<template>
  <div class="item-sets-tab">
    <div class="load-row">
      <InputText v-model="keyInput" placeholder="Enter set key…" @keyup.enter="doLoad(keyInput)" />
      <Button label="Load" :loading="loading" @click="doLoad(keyInput)" />
    </div>
    <div v-if="error" class="load-error">{{ error }}</div>
    <div v-if="warning" class="load-warning">{{ warning }}</div>

    <template v-if="loadedGearset">
      <div class="loaded-header">
        <span class="loaded-key">{{ loadedKey }}</span>
        <Button
          :label="copiedToClipboard ? 'Copied!' : 'Copy Share URL'"
          icon="pi pi-copy"
          size="small"
          text
          @click="copyShareUrl"
        />
      </div>

      <GearPanel
        context="tp1"
        :gearset="loadedGearset"
        :job-code="characterStore.mainJob"
        @update:gear="onGearUpdate"
      />

      <div class="apply-row">
        <span class="apply-label">Apply to:</span>
        <Button label="TP Set 1" size="small" @click="characterStore.replaceGearset('tp1', loadedGearset)" />
        <Button label="WS Set 1" size="small" @click="characterStore.replaceGearset('ws1', loadedGearset)" />
        <Button label="TP Set 2" size="small" @click="characterStore.replaceGearset('tp2', loadedGearset)" />
        <Button label="WS Set 2" size="small" @click="characterStore.replaceGearset('ws2', loadedGearset)" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.item-sets-tab {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: #e0e0e0;
}

.load-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.load-error {
  color: #ff8080;
  font-size: 0.78rem;
}

.load-warning {
  color: #fbbf24;
  font-size: 0.78rem;
}

.loaded-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.loaded-key {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #a0c4ff;
}

.apply-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.apply-label {
  font-size: 0.9rem;
  color: #8899bb;
}
</style>
