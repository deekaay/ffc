<script setup lang="ts">
import { onMounted } from 'vue'
import { useGearStore } from '@/stores/useGearStore'
import { useCharacterStore } from '@/stores/useCharacterStore'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputsTab from '@/components/tabs/InputsTab.vue'
import SimulationsTab from '@/components/tabs/SimulationsTab.vue'
import PlayerStatsTab from '@/components/tabs/PlayerStatsTab.vue'
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
        <Tab value="0">Inputs / Quicklook</Tab>
        <Tab value="1">Simulations</Tab>
        <Tab value="2">Player Stats</Tab>
        <Tab v-if="characterStore.mainJob === 'pup'" value="3">Automaton</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0"><InputsTab /></TabPanel>
        <TabPanel value="1"><SimulationsTab /></TabPanel>
        <TabPanel value="2"><PlayerStatsTab /></TabPanel>
        <TabPanel v-if="characterStore.mainJob === 'pup'" value="3"><AutomatonTab /></TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  min-height: 100vh;
}

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

.tab-placeholder {
  padding: 24px;
  color: #888;
  font-style: italic;
}
</style>
