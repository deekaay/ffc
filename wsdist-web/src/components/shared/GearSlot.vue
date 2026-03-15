<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import type { GearItem, GearSlotName } from '@/types/gear'
import { useGearStore } from '@/stores/useGearStore'

const props = defineProps<{
  slotName: GearSlotName
  item: GearItem
  jobCode: string
  label?: string
}>()

const emit = defineEmits<{
  select: [item: GearItem]
}>()

const gearStore = useGearStore()
const dialogVisible = ref(false)
const searchQuery = ref('')

const iconUrl = computed(() => {
  const name = props.item?.Name2 ?? props.item?.Name
  if (!name || name === 'None') return null
  return gearStore.getIconUrl(name) ?? gearStore.getIconUrl(props.item.Name)
})

const availableItems = computed(() => {
  return gearStore.getGearForJob(props.slotName, props.jobCode)
})

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return availableItems.value
  return availableItems.value.filter(i =>
    i.Name.toLowerCase().includes(q) || (i.Name2 && i.Name2.toLowerCase().includes(q))
  )
})

const STAT_DISPLAY = [
  'DMG','Delay','STR','DEX','VIT','AGI','INT','MND','CHR',
  'Attack','Accuracy','Ranged Attack','Ranged Accuracy','Magic Attack','Magic Accuracy',
  'Crit Rate','Crit Damage','DA','TA','Store TP','Haste','Magic Haste','Gear Haste',
  'Weapon Skill Damage','PDL','EnSpell Damage','EnSpell Damage%',
]

function formatStats(item: GearItem): string {
  const parts: string[] = []
  for (const stat of STAT_DISPLAY) {
    const val = item[stat]
    if (val !== undefined && val !== 0) {
      parts.push(`${stat}: ${typeof val === 'number' && val > 0 ? '+' : ''}${val}`)
    }
  }
  return parts.join('\n') || 'No combat stats'
}

const emptyItem: GearItem = { Name: 'None', Name2: 'None', Jobs: [] }

function pickItem(item: GearItem) {
  emit('select', item)
  dialogVisible.value = false
}
</script>

<template>
  <div class="gear-slot">
    <div class="gear-slot-label" v-if="label">{{ label }}</div>
    <button
      class="gear-slot-btn"
      :title="formatStats(item)"
      @click="dialogVisible = true"
    >
      <img
        v-if="iconUrl"
        :src="iconUrl"
        :alt="item.Name"
        class="gear-icon"
        loading="lazy"
      />
      <span v-else class="gear-slot-empty">{{ item.Name === 'None' ? '—' : item.Name.substring(0, 2) }}</span>
    </button>

    <Dialog
      v-model:visible="dialogVisible"
      :header="`${label ?? slotName} — ${jobCode.toUpperCase()}`"
      modal
      :style="{ width: '500px', maxHeight: '80vh' }"
      class="gear-dialog"
    >
      <InputText
        v-model="searchQuery"
        placeholder="Search items..."
        class="gear-search"
        autofocus
      />
      <div class="gear-item-list">
        <button class="gear-item-row" @click="pickItem(emptyItem)">
          <span class="gear-item-name">None</span>
        </button>
        <button
          v-for="gi in filteredItems"
          :key="gi.Name2 ?? gi.Name"
          class="gear-item-row"
          :class="{ selected: gi.Name === item.Name }"
          :title="formatStats(gi)"
          @click="pickItem(gi)"
        >
          <img
            v-if="gearStore.getIconUrl(gi.Name2 ?? gi.Name)"
            :src="gearStore.getIconUrl(gi.Name2 ?? gi.Name)!"
            class="gear-icon-sm"
            loading="lazy"
          />
          <span class="gear-item-name">{{ gi.Name }}</span>
          <span class="gear-item-stats">{{ formatStats(gi).replace(/\n/g, '  ') }}</span>
        </button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.gear-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.gear-slot-label {
  font-size: 0.65rem;
  color: #aaa;
  text-transform: uppercase;
}

.gear-slot-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #444;
  background: #1e1e3a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  padding: 1px;
  transition: border-color 0.15s;
}

.gear-slot-btn:hover {
  border-color: #6699cc;
}

.gear-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.gear-slot-empty {
  font-size: 0.6rem;
  color: #666;
}

.gear-search {
  width: 100%;
  margin-bottom: 8px;
}

.gear-item-list {
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.gear-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 0.82rem;
  width: 100%;
}

.gear-item-row:hover {
  background: #2a2a4a;
}

.gear-item-row.selected {
  background: #1a3a5a;
}

.gear-icon-sm {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.gear-item-name {
  font-weight: 500;
  min-width: 140px;
}

.gear-item-stats {
  color: #888;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
