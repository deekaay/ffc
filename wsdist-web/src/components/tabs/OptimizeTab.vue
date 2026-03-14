<script setup lang="ts">
import { computed } from 'vue'
import { useGearStore, GEAR_SLOTS } from '@/stores/useGearStore'
import { useCharacterStore } from '@/stores/useCharacterStore'

const gearStore = useGearStore()
const charStore = useCharacterStore()

const slotCounts = computed(() =>
  GEAR_SLOTS.map(slot => ({
    slot,
    count: gearStore.getGearForJob(slot, charStore.mainJob).length,
  }))
)
</script>

<template>
  <div class="optimize-tab">
    <div class="coming-soon-banner">
      Optimizer — coming soon
    </div>
    <p class="coming-soon-sub">
      The optimizer will iterate through all gear combinations for selected slots and find the set
      that maximizes DPS (or another chosen metric).
    </p>

    <div class="slot-preview">
      <h3>Available items by slot ({{ charStore.mainJob.toUpperCase() }})</h3>
      <div class="slot-grid">
        <div v-for="{ slot, count } in slotCounts" :key="slot" class="slot-card">
          <span class="slot-name">{{ slot }}</span>
          <span class="slot-count">{{ count }} items</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.optimize-tab {
  padding: 24px;
  max-width: 800px;
}

.coming-soon-banner {
  font-size: 1.3rem;
  font-weight: 600;
  color: #a0c4ff;
  margin-bottom: 8px;
}

.coming-soon-sub {
  color: #999;
  margin-bottom: 24px;
  line-height: 1.5;
}

.slot-preview h3 {
  font-size: 0.85rem;
  color: #6699cc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.slot-card {
  background: #16213e;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-name {
  font-size: 0.75rem;
  color: #aaa;
  text-transform: uppercase;
}

.slot-count {
  font-size: 0.9rem;
  color: #e0e0e0;
  font-weight: 600;
}
</style>
