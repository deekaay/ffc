import { defineStore } from 'pinia'
import type { Gearset, GearItem, GearSlotName } from '@/types/gear'
import type { EnemyDef } from '@/types/enemy'

export type JobCode =
  | 'war' | 'mnk' | 'whm' | 'blm' | 'rdm' | 'thf'
  | 'pld' | 'drk' | 'bst' | 'brd' | 'rng' | 'sam'
  | 'nin' | 'drg' | 'smn' | 'blu' | 'cor' | 'pup'
  | 'dnc' | 'sch' | 'geo' | 'run'

export const JOBS_DICT: Record<string, JobCode> = {
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

export type GearContext = 'tp1' | 'ws1' | 'tp2' | 'ws2'

export const useCharacterStore = defineStore('character', {
  state: () => ({
    mainJob: 'sam' as JobCode,
    subJob: 'war' as JobCode,
    mainJobLevel: 99,
    subJobLevel: 49,
    masterLevel: 0,
    odysseyRank: '0',

    tpGearset:  emptyGearset() as Gearset,
    wsGearset:  emptyGearset() as Gearset,
    tpGearset2: emptyGearset() as Gearset,
    wsGearset2: emptyGearset() as Gearset,

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
    setMainJob(jobCode: JobCode) {
      this.mainJob = jobCode
    },
    setSubJob(jobCode: JobCode) {
      this.subJob = jobCode
    },
    setGear(context: GearContext, slot: GearSlotName, item: GearItem) {
      const gs = context === 'tp1' ? this.tpGearset
               : context === 'ws1' ? this.wsGearset
               : context === 'tp2' ? this.tpGearset2
               : this.wsGearset2
      gs[slot] = item
    },
    copyGearset(from: GearContext, to: GearContext) {
      const pick = (c: GearContext) =>
        c === 'tp1' ? this.tpGearset  : c === 'ws1' ? this.wsGearset :
        c === 'tp2' ? this.tpGearset2 : this.wsGearset2
      const src = pick(from)
      const dst = pick(to)
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
