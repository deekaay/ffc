<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import type { Gearset } from '@/types/gear'
import { useGearStore } from '@/stores/useGearStore'
import { encodeGearset, decodeGearset } from '@/utils/gearsetCodec'

const props = defineProps<{
  gearset: Gearset
  title: string
}>()

const emit = defineEmits<{
  import: [gearset: Gearset]
}>()

const gearStore = useGearStore()

// ── Copy ────────────────────────────────────────────────────────────────────
const copied = ref(false)

function onCopy() {
  const encoded = encodeGearset(props.gearset)
  navigator.clipboard.writeText(encoded)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

// ── Import ───────────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const pastedString = ref('')
const decodeError = ref('')
const unknownNames = ref<string[]>([])

function openImport() {
  pastedString.value = ''
  decodeError.value = ''
  unknownNames.value = []
  dialogVisible.value = true
}

function onImport() {
  decodeError.value = ''
  unknownNames.value = []
  const result = decodeGearset(pastedString.value.trim(), gearStore.allGear)
  if (!result) {
    decodeError.value = 'Invalid gearset string.'
    return
  }
  unknownNames.value = result.unknownNames
  emit('import', result.gearset)
  dialogVisible.value = false
}
</script>

<template>
  <div class="gearset-io">
    <Button
      :label="copied ? 'Copied!' : 'Copy'"
      size="small"
      class="io-btn"
      :severity="copied ? 'success' : 'secondary'"
      @click="onCopy"
    />
    <Button
      label="Import"
      size="small"
      class="io-btn"
      severity="secondary"
      :disabled="!gearStore.loaded"
      @click="openImport"
    />
  </div>

  <Dialog
    v-model:visible="dialogVisible"
    :header="`Import ${title}`"
    modal
    :style="{ width: '420px' }"
  >
    <div class="import-body">
      <Textarea
        v-model="pastedString"
        rows="3"
        placeholder="Paste encoded gearset string here..."
        class="import-textarea"
        autofocus
      />
      <div v-if="decodeError" class="io-error">{{ decodeError }}</div>
      <div v-if="unknownNames.length" class="io-warn">
        {{ unknownNames.length }} item(s) not found and cleared:
        {{ unknownNames.join(', ') }}
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" severity="secondary" @click="dialogVisible = false" />
      <Button label="Import" :disabled="!pastedString.trim()" @click="onImport" />
    </template>
  </Dialog>
</template>

<style scoped>
.gearset-io {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.io-btn {
  font-size: 0.68rem !important;
  padding: 2px 8px !important;
  height: 22px;
}

.import-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.import-textarea {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  resize: vertical;
}

.io-error {
  color: #ff6b6b;
  font-size: 0.78rem;
}

.io-warn {
  color: #ffd166;
  font-size: 0.78rem;
}
</style>
