import { defineStore } from 'pinia'
import type { SongSlot, RollSlot, BubbleSlot } from '@/types/buffs'

// ---------------------------------------------------------------------------
// Type definitions for buffs.json data
// ---------------------------------------------------------------------------
interface BrdBuffEntry {
  [stat: string]: [number, number]
}
interface CorBuffEntry {
  [stat: string]: [Record<string, number>, number, number]
}
interface GeoBuffEntry {
  [stat: string]: [number, number]
}
type WhmBuffEntry = Record<string, number>

interface BuffsData {
  brd: Record<string, BrdBuffEntry>
  brd_song_limits: Record<string, number>
  cor: Record<string, CorBuffEntry>
  cor_debuffs: Record<string, Record<string, number>>
  geo: Record<string, GeoBuffEntry>
  geo_debuffs: Record<string, Record<string, [number, number]>>
  whm: Record<string, WhmBuffEntry>
  whm_debuffs: Record<string, WhmBuffEntry>
  misc_debuffs: Record<string, Record<string, number>>
}

let cachedBuffsData: BuffsData | null = null
async function loadBuffsData(): Promise<BuffsData> {
  if (cachedBuffsData) return cachedBuffsData
  const base = import.meta.env.BASE_URL
  const res = await fetch(`${base}data/buffs.json`)
  cachedBuffsData = await res.json()
  return cachedBuffsData!
}

export const useBuffStore = defineStore('buffs', {
  state: () => ({
    // Buff data source (loaded at runtime)
    buffsData: null as BuffsData | null,

    // BRD
    songs: [
      { name: 'None' }, { name: 'None' }, { name: 'None' }, { name: 'None' },
    ] as SongSlot[],
    soulVoice: false,
    marcato: false,
    songBonus: 0,          // e.g. 7 means "Songs +7"

    // COR
    rolls: [
      { name: 'None', value: 'V' },
      { name: 'None', value: 'V' },
      { name: 'None', value: 'V' },
      { name: 'None', value: 'V' },
    ] as RollSlot[],
    rollBonus: 0,           // e.g. 7 means "Rolls +7"
    crookedCards: false,
    jobBonus: false,
    lightShot: false,

    // GEO
    bubbles: [
      { type: 'Indi' as const, name: 'None' },
      { type: 'Geo' as const, name: 'None' },
      { type: 'Entrust' as const, name: 'None' },
    ] as BubbleSlot[],
    bolster: false,
    blazeOfGlory: false,
    bubbleBonus: 0,         // e.g. 5 means "Bubbles +5"
    bubblePotency: 70,      // % of debuff potency (0–100)

    // WHM
    hasteSpell: 'None' as string,
    diaSpell: 'None' as string,
    boostSpell: 'None' as string,
    stormSpell: 'None' as string,
    shellV: false,

    // Food (item Name2 key)
    food: 'None' as string,
  }),

  getters: {
    /**
     * Returns a structured { brd, cor, geo, whm, food } buffs object
     * suitable for passing directly to buildPlayer().
     * Also returns a flat debuffs dict for adjusting enemy stats.
     */
    aggregatedBuffs(state): {
      buffs: Record<string, Record<string, number>>
      debuffs: Record<string, number>
    } {
      const data = state.buffsData
      if (!data) return { buffs: { brd: {}, cor: {}, geo: {}, whm: {}, food: {} }, debuffs: {} }

      const buffs: Record<string, Record<string, number>> = {
        brd: {}, cor: {}, geo: {}, whm: {}, food: {},
      }
      const debuffs: Record<string, number> = {}

      const add = (target: Record<string, number>, stat: string, val: number) => {
        target[stat] = (target[stat] ?? 0) + val
      }

      // -----------------------------------------------------------------------
      // BRD buffs
      // -----------------------------------------------------------------------
      for (let i = 0; i < state.songs.length; i++) {
        const songName = state.songs[i].name
        if (!songName || songName === 'None') continue
        const entry = data.brd[songName]
        if (!entry) continue
        const songBonusLimit = data.brd_song_limits[songName] ?? 99
        const sv = 1.0 + +state.soulVoice
        const marcatoMult = (i === 0 && state.marcato) ? 1.5 : 1.0
        const bonus = Math.min(songBonusLimit, state.songBonus)
        for (const stat of Object.keys(entry)) {
          const vals = entry[stat]
          const minuetAtk = (songName.toLowerCase().includes('minuet') && (stat === 'Attack' || stat === 'Ranged Attack')) ? 20 : 0
          const val = sv * marcatoMult * (vals[0] + bonus * vals[1]) + minuetAtk
          add(buffs.brd, stat, val)
        }
      }
      buffs.brd['Attack'] = Math.trunc(buffs.brd['Attack'] ?? 0)
      buffs.brd['Ranged Attack'] = Math.trunc(buffs.brd['Ranged Attack'] ?? 0)

      // -----------------------------------------------------------------------
      // COR buffs
      // -----------------------------------------------------------------------
      for (let i = 0; i < state.rolls.length; i++) {
        const rollName = state.rolls[i].name.split(' ')[0] // strip trailing words
        if (!rollName || rollName === 'None') continue
        const entry = data.cor[rollName]
        if (!entry) continue
        const rollVal = state.rolls[i].value // "I"..."XI"
        const crookedMult = (i === 0 || i === 2) && state.crookedCards ? 1.2 : 1.0
        for (const stat of Object.keys(entry)) {
          const vals = entry[stat]
          const base = vals[0][rollVal] ?? 0
          const bonusIncrement = vals[1]
          const jobBonusVal = state.jobBonus ? vals[2] : 0
          const val = crookedMult * (base + state.rollBonus * bonusIncrement + jobBonusVal)
          add(buffs.cor, stat, val)
        }
      }

      // COR debuff: Light Shot (requires Dia spell set)
      if (state.lightShot && state.diaSpell.toLowerCase().includes('dia')) {
        const lightShot = data.cor_debuffs['Light Shot']
        if (lightShot) {
          for (const stat of Object.keys(lightShot)) add(debuffs, stat, lightShot[stat])
        }
      }

      // -----------------------------------------------------------------------
      // GEO buffs and debuffs
      // -----------------------------------------------------------------------
      for (const bubble of state.bubbles) {
        const bubbleName = bubble.name
        if (!bubbleName || bubbleName === 'None') continue
        const isEntrust = bubble.type === 'Entrust'
        const bonus = isEntrust ? 0 : state.bubbleBonus
        const bolsterMult = !isEntrust && state.bolster ? 2.0 : 1.0
        const bogMult = bubble.type === 'Geo' && state.blazeOfGlory ? 1.5 : 1.0

        const geoEntry = data.geo[bubbleName]
        if (geoEntry) {
          for (const stat of Object.keys(geoEntry)) {
            const vals = geoEntry[stat]
            add(buffs.geo, stat, bolsterMult * bogMult * (vals[0] + bonus * vals[1]))
          }
        }

        const geoDebuffEntry = data.geo_debuffs[bubbleName]
        if (geoDebuffEntry) {
          const potency = state.bubblePotency / 100
          for (const stat of Object.keys(geoDebuffEntry)) {
            const vals = geoDebuffEntry[stat]
            add(debuffs, stat, bolsterMult * bogMult * (vals[0] + bonus * vals[1]) * potency)
          }
        }
      }

      // -----------------------------------------------------------------------
      // WHM buffs and debuffs
      // -----------------------------------------------------------------------
      const activeSpells = [state.hasteSpell, state.diaSpell, state.boostSpell, state.stormSpell]
      for (const spellName of activeSpells) {
        if (!spellName || spellName === 'None') continue
        const whmEntry = data.whm[spellName]
        if (whmEntry) {
          for (const stat of Object.keys(whmEntry)) add(buffs.whm, stat, whmEntry[stat])
        }
        const whmDebuffEntry = data.whm_debuffs?.[spellName]
        if (whmDebuffEntry) {
          for (const stat of Object.keys(whmDebuffEntry)) add(debuffs, stat, whmDebuffEntry[stat])
        }
      }
      if (state.shellV) {
        const shellEntry = data.whm?.['Shell V']
        if (shellEntry) {
          for (const stat of Object.keys(shellEntry)) add(buffs.whm, stat, shellEntry[stat])
        }
      }
      // Store the storm spell name for use in enspell damage calculation
      if (state.stormSpell && state.stormSpell !== 'None') {
        buffs.whm['_stormSpell'] = 1  // marker; actual name stored separately
      }

      // -----------------------------------------------------------------------
      // Food
      // -----------------------------------------------------------------------
      // Food is handled by the character store (it reads it from allFood and
      // injects it as buffs.food). The buff store only tracks the selection.

      return { buffs, debuffs }
    },
  },

  actions: {
    async ensureBuffsLoaded() {
      if (!this.buffsData) {
        this.buffsData = await loadBuffsData()
      }
    },
  },

  persist: {
    key: 'wsdist-buffs',
    storage: localStorage,
    pick: [
      'songs','soulVoice','marcato','songBonus',
      'rolls','rollBonus','crookedCards','jobBonus','lightShot',
      'bubbles','bolster','blazeOfGlory','bubbleBonus','bubblePotency',
      'hasteSpell','diaSpell','boostSpell','stormSpell','shellV',
      'food',
    ],
  },
})
