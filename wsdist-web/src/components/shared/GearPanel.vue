<script setup lang="ts">
import GearSlot from './GearSlot.vue'
import type { Gearset, GearSlotName, GearItem } from '@/types/gear'
import type { GearContext } from '@/stores/useCharacterStore'

const props = defineProps<{
  context: GearContext
  gearset: Gearset
  jobCode: string
  title?: string
}>()

const emit = defineEmits<{
  'update:gear': [slot: GearSlotName, item: GearItem]
}>()

// Slot layout matching the FFXI paperdoll
const SLOT_LAYOUT: { slot: GearSlotName; label: string }[][] = [
  [
    { slot: 'main',   label: 'Main'   },
    { slot: 'sub',    label: 'Sub'    },
    { slot: 'ranged', label: 'Ranged' },
    { slot: 'ammo',   label: 'Ammo'   },
  ],
  [
    { slot: 'head',   label: 'Head'   },
    { slot: 'neck',   label: 'Neck'   },
    { slot: 'ear1',   label: 'Ear 1'  },
    { slot: 'ear2',   label: 'Ear 2'  },
  ],
  [
    { slot: 'body',   label: 'Body'   },
    { slot: 'hands',  label: 'Hands'  },
    { slot: 'ring1',  label: 'Ring 1' },
    { slot: 'ring2',  label: 'Ring 2' },
  ],
  [
    { slot: 'back',   label: 'Back'   },
    { slot: 'waist',  label: 'Waist'  },
    { slot: 'legs',   label: 'Legs'   },
    { slot: 'feet',   label: 'Feet'   },
  ],
]

function onSelect(slot: GearSlotName, item: GearItem) {
  emit('update:gear', slot, item)
}
</script>

<template>
  <div class="gear-panel">
    <div v-if="title" class="gear-panel-title">{{ title }}</div>
    <div class="gear-grid">
      <div v-for="(row, ri) in SLOT_LAYOUT" :key="ri" class="gear-row">
        <GearSlot
          v-for="cell in row"
          :key="cell.slot"
          :slot="cell.slot"
          :item="gearset[cell.slot]"
          :job-code="jobCode"
          :label="cell.label"
          @select="(item) => onSelect(cell.slot, item)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gear-panel {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
}

.gear-panel-title {
  font-size: 0.75rem;
  color: #a0c4ff;
  font-weight: 600;
  text-align: center;
}

.gear-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gear-row {
  display: flex;
  gap: 4px;
}
</style>
