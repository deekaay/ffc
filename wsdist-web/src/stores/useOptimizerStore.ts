import { defineStore } from 'pinia'
import type { Gearset, GearSlotName } from '@/types/gear'

export const useOptimizerStore = defineStore('optimizer', {
  state: () => ({
    selectedSlots: {} as Record<GearSlotName, string[]>,
    actionType: 'weapon skill' as string,
    pdtRequirement: 0,
    mdtRequirement: 0,
    metric: 'avg_ws_dmg',
    running: false,
    progress: '',
    iterations: 10,
    bestSet: null as Gearset | null,
    bestMetric: 0,
    swapLog: [] as string[],
  }),

  actions: {
    startOptimize() {
      // Stub — Web Worker launch in Phase 7
    },
    cancelOptimize() {
      this.running = false
    },
    equipBestSet() {
      // Stub — copies bestSet to character store
    },
  },
})
