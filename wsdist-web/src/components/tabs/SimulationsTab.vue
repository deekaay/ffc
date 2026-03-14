<script setup lang="ts">
import GearPanel from '@/components/shared/GearPanel.vue'
import { useCharacterStore } from '@/stores/useCharacterStore'
import type { GearSlotName, GearItem } from '@/types/gear'

const characterStore = useCharacterStore()

function onGearUpdate(context: 'tp' | 'ws', slot: GearSlotName, item: GearItem) {
  characterStore.setGear(context, slot, item)
}
</script>

<template>
  <div class="sims-tab">
    <div class="gear-row">
      <div class="gear-col">
        <GearPanel
          context="tp"
          :gearset="characterStore.tpGearset"
          :job-code="characterStore.mainJob"
          title="TP Set"
          @update:gear="(slot, item) => onGearUpdate('tp', slot, item)"
        />
      </div>
      <div class="gear-col">
        <GearPanel
          context="ws"
          :gearset="characterStore.wsGearset"
          :job-code="characterStore.mainJob"
          title="WS Set"
          @update:gear="(slot, item) => onGearUpdate('ws', slot, item)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sims-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  color: #e0e0e0;
  background: #1a1a2e;
  min-height: 0;
}

.gear-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.gear-col {
  flex: 0 0 auto;
}
</style>
