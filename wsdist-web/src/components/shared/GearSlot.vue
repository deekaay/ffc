<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const sortKey = ref<'name' | 'dmg'>('name')

const displayList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const equippedName = props.item.Name

  let items = availableItems.value.filter(i => {
    if (i.Name === equippedName) return false  // exclude equipped; shown as pinned row
    if (!q) return true
    return i.Name.toLowerCase().includes(q) || (i.Name2 ?? '').toLowerCase().includes(q)
  })

  if (sortKey.value === 'name') {
    items = [...items].sort((a, b) => a.Name.localeCompare(b.Name))
  } else {
    // dmg high→low; items without DMG sort to the end
    items = [...items].sort((a, b) => (b.DMG ?? -1) - (a.DMG ?? -1))
  }

  return items
})

const focusedIndex = ref(0)

const focusedItem = computed((): GearItem | null => {
  if (focusedIndex.value === 0) return null
  return displayList.value[focusedIndex.value - 1] ?? null
})

function detailStats(item: GearItem): { label: string; value: string }[] {
  return STAT_DISPLAY
    .filter(stat => item[stat] !== undefined && item[stat] !== 0)
    .map(stat => {
      const val = item[stat]
      const formatted = typeof val === 'number' && val > 0 ? `+${val}` : String(val)
      return { label: stat, value: formatted }
    })
}

watch(dialogVisible, (open) => {
  if (!open) return
  searchQuery.value = ''
  sortKey.value = 'name'
  focusedIndex.value = 0
})

watch([searchQuery, sortKey], () => {
  if (dialogVisible.value) focusedIndex.value = 0
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

// @ts-ignore — used by confirmFocused() added in Task 4
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
      :style="{ width: '720px', maxHeight: '80vh' }"
      class="gear-dialog"
    >
      <div class="gear-picker-body">

        <!-- Left column: search + sort + list -->
        <div class="gear-list-col">
          <div class="sort-bar">
            <span class="sort-bar-label">Sort:</span>
            <button
              class="sort-pill"
              :class="{ active: sortKey === 'name' }"
              @click="sortKey = 'name'"
            >Name</button>
            <button
              class="sort-pill"
              :class="{ active: sortKey === 'dmg' }"
              @click="sortKey = 'dmg'"
            >DMG</button>
          </div>
          <InputText
            v-model="searchQuery"
            placeholder="Search items..."
            class="gear-search"
            autofocus
          />
          <div class="gear-item-list">
            <!-- Pinned equipped row -->
            <button
              v-if="item.Name !== 'None'"
              class="gear-item-row equipped-pin"
              :title="formatStats(item)"
              @click="pickItem(item)"
            >
              <span class="equipped-badge">ON</span>
              <img
                v-if="iconUrl"
                :src="iconUrl"
                class="gear-icon-sm"
                loading="lazy"
              />
              <span class="gear-item-name">{{ item.Name }}</span>
              <span class="gear-item-stats">{{ formatStats(item).replace(/\n/g, '  ') }}</span>
            </button>
            <!-- None row -->
            <button
              class="gear-item-row"
              :class="{ focused: focusedIndex === 0 }"
              @click="focusedIndex = 0"
            >
              <span class="gear-item-name">None</span>
            </button>
            <!-- Item rows -->
            <button
              v-for="(gi, i) in displayList"
              :key="gi.Name2 ?? gi.Name"
              class="gear-item-row"
              :class="{ focused: focusedIndex === i + 1 }"
              :title="formatStats(gi)"
              @click="focusedIndex = i + 1"
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
          <!-- Keyboard hint -->
          <div class="keyboard-hint">↑↓ navigate &nbsp;·&nbsp; Enter equip &nbsp;·&nbsp; Esc close</div>
        </div>

        <!-- Right column: detail pane -->
        <div class="gear-detail-col">
          <template v-if="focusedItem">
            <div class="detail-name">{{ focusedItem.Name }}</div>
            <div class="detail-meta">{{ focusedItem.Type ?? 'Equipment' }}</div>
            <div class="detail-stats-list">
              <div
                v-for="s in detailStats(focusedItem)"
                :key="s.label"
                class="detail-stat-row"
              >
                <span class="detail-stat-label">{{ s.label }}</span>
                <span class="detail-stat-value">{{ s.value }}</span>
              </div>
            </div>
          </template>
          <div v-else class="detail-placeholder">
            Select an item to see stats
          </div>
        </div>

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
  width: 40px;
  height: 40px;
  border: 1px solid #2e3f6a;
  background: #131e38;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 1px;
  transition: border-color 0.15s, background 0.15s;
}

.gear-slot-btn:hover {
  border-color: #5580cc;
  background: #1a2a4a;
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
  flex: 1;
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
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 0.82rem;
  width: 100%;
}

.gear-item-row:hover {
  background: #1e2e50;
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

.sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.sort-bar-label {
  font-size: 0.72rem;
  color: #8899bb;
}

.sort-pill {
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid #2e3f6a;
  background: transparent;
  color: #888;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}

.sort-pill.active {
  border-color: #5580cc;
  background: #1a2a4a;
  color: #a0c4ff;
}

.gear-item-row.equipped-pin {
  background: #1e3a20;
  border: 1px solid #3a6040;
  border-radius: 3px;
}

.equipped-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #7acc88;
  background: #1a4020;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}

.gear-item-row.focused {
  background: #1a3660;
  border: 1px solid #5580cc;
  outline: none;
}

/* ── Two-column picker layout ─────────────────── */
.gear-picker-body {
  display: flex;
  gap: 0;
  height: 480px;
}

.gear-list-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  padding: 4px 8px 8px;
  border-right: 1px solid #2e3f6a;
  min-width: 0;
}

.gear-detail-col {
  width: 220px;
  flex-shrink: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.detail-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #a0c4ff;
}

.detail-meta {
  font-size: 0.75rem;
  color: #8899bb;
}

.detail-stats-list {
  border-top: 1px solid #2e3f6a;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
}

.detail-stat-label {
  color: #8899bb;
}

.detail-stat-value {
  color: #e0e0e0;
}

.detail-placeholder {
  font-size: 0.78rem;
  color: #555;
  text-align: center;
  margin-top: 40px;
}

.keyboard-hint {
  font-size: 0.68rem;
  color: #555;
  border-top: 1px solid #1e2e50;
  padding-top: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}
</style>
