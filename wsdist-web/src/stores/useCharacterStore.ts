import { defineStore } from 'pinia'
import type { Gearset, GearItem, GearSlotName } from '@/types/gear'
import type { EnemyDef } from '@/types/enemy'

export const JOBS_DICT: Record<string, string> = {
  'Ninja': 'nin', 'Dark Knight': 'drk', 'Scholar': 'sch', 'Red Mage': 'rdm',
  'Black Mage': 'blm', 'Samurai': 'sam', 'Dragoon': 'drg', 'White Mage': 'whm',
  'Warrior': 'war', 'Corsair': 'cor', 'Bard': 'brd', 'Thief': 'thf',
  'Monk': 'mnk', 'Dancer': 'dnc', 'Beastmaster': 'bst', 'Rune Fencer': 'run',
  'Ranger': 'rng', 'Puppetmaster': 'pup', 'Blue Mage': 'blu', 'Geomancer': 'geo',
  'Paladin': 'pld', 'Summoner': 'smn',
}

export const JOB_NAMES = Object.keys(JOBS_DICT).sort()

function emptyGearset(): Gearset {
  const slots: GearSlotName[] = [
    'main', 'sub', 'ranged', 'ammo',
    'head', 'neck', 'ear1', 'ear2',
    'body', 'hands', 'ring1', 'ring2',
    'back', 'waist', 'legs', 'feet',
  ]
  const gs = {} as Gearset
  for (const s of slots) gs[s] = { Name: 'None', Name2: 'None', Jobs: [] }
  return gs
}

const DEFAULT_ENEMY: EnemyDef = {
  Name: 'Apex Monster',
  Level: 135,
  Defense: 1000,
  Evasion: 1200,
  VIT: 120,
  AGI: 120,
  INT: 120,
  MND: 120,
  CHR: 120,
  'Magic Evasion': 591,
  'Magic Defense': 0,
  'Magic DT%': 0,
  Location: 'Odyssey',
}

export const useCharacterStore = defineStore('character', {
  state: () => ({
    mainJob: 'sam',
    subJob: 'war',
    mainJobLevel: 99,
    subJobLevel: 49,
    masterLevel: 0,
    odysseyRank: '0',

    quicklookGearset: emptyGearset() as Gearset,
    tpGearset: emptyGearset() as Gearset,
    wsGearset: emptyGearset() as Gearset,

    enemy: { ...DEFAULT_ENEMY } as EnemyDef,
    wsName: 'Tachi: Fudo',
    wsThreshold: 1000,

    abilities: {} as Record<string, boolean | number | string>,
  }),

  getters: {
    mainJobName(state): string {
      return Object.entries(JOBS_DICT).find(([, v]) => v === state.mainJob)?.[0] ?? state.mainJob
    },
    subJobName(state): string {
      return Object.entries(JOBS_DICT).find(([, v]) => v === state.subJob)?.[0] ?? state.subJob
    },
  },

  actions: {
    setMainJob(jobCode: string) {
      this.mainJob = jobCode
    },
    setSubJob(jobCode: string) {
      this.subJob = jobCode
    },
    setGear(context: 'quicklook' | 'tp' | 'ws', slot: GearSlotName, item: GearItem) {
      const gs = context === 'tp' ? this.tpGearset : context === 'ws' ? this.wsGearset : this.quicklookGearset
      gs[slot] = item
    },
    copyGearset(from: 'quicklook' | 'tp' | 'ws', to: 'quicklook' | 'tp' | 'ws') {
      const src = from === 'tp' ? this.tpGearset : from === 'ws' ? this.wsGearset : this.quicklookGearset
      const dst = to === 'tp' ? this.tpGearset : to === 'ws' ? this.wsGearset : this.quicklookGearset
      for (const slot in src) dst[slot as GearSlotName] = { ...src[slot as GearSlotName] }
    },
    setEnemy(enemy: EnemyDef) {
      this.enemy = { ...enemy }
    },
  },

  persist: {
    key: 'wsdist-character',
    storage: localStorage,
  },
})
