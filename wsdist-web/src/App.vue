<script setup lang="ts">
import { onMounted } from 'vue'
import { useGearStore } from '@/stores/useGearStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import JobEnemyTab from '@/components/tabs/JobEnemyTab.vue'
import BuffsTab from '@/components/tabs/BuffsTab.vue'
import ResultsTab from '@/components/tabs/ResultsTab.vue'
import AutomatonTab from '@/components/tabs/AutomatonTab.vue'

const gearStore = useGearStore()
const characterStore = useCharacterStore()

onMounted(async () => {
  await gearStore.loadGearData()
})
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <h1>FFXI Damage Simulator</h1>
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
  </div>
</template>

<style>
.app-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 8px;
}

.app-header h1 {
  font-size: 1.2rem;
  font-weight: 600;
  padding: 8px 0;
  color: #a0c4ff;
}

.app-tabs {
  width: 100%;
}
</style>
