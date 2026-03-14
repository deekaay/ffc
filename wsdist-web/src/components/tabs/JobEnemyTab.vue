<script setup lang="ts">
import JobSelector from '@/components/shared/JobSelector.vue'
import EnemyPanel from '@/components/shared/EnemyPanel.vue'
</script>

<template>
  <div class="job-enemy-tab">
    <div class="main-grid">
      <div class="col">
        <JobSelector />
      </div>
      <div class="col">
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
  flex: 0 0 auto;
}

@media (max-width: 600px) {
  .col { flex: 1 1 100%; }
}
</style>
