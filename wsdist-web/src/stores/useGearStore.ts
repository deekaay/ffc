import { defineStore } from 'pinia'
import type { GearItem, GearSlotName } from '@/types/gear'

export const GEAR_SLOTS: GearSlotName[] = [
  'main', 'sub', 'ranged', 'ammo',
  'head', 'neck', 'ear1', 'ear2',
  'body', 'hands', 'ring1', 'ring2',
  'back', 'waist', 'legs', 'feet',
]

export const useGearStore = defineStore('gear', {
  state: () => ({
    gearBySlot: {} as Record<string, GearItem[]>,
    allGear: {} as Record<string, GearItem>,
    allFood: {} as Record<string, GearItem>,
    itemIds: {} as Record<string, number>,
    loaded: false,
  }),

  actions: {
    async loadGearData() {
      if (this.loaded) return
      try {
        const base = import.meta.env.BASE_URL

        const slotFiles: Record<string, string> = {
          main: 'mains', sub: 'subs', ranged: 'ranged', ammo: 'ammos',
          head: 'heads', neck: 'necks', ear1: 'ears', ear2: 'ears',
          body: 'bodies', hands: 'hands', ring1: 'rings', ring2: 'rings',
          back: 'backs', waist: 'waists', legs: 'legs', feet: 'feet',
        }

        const uniqueFiles = [...new Set(Object.values(slotFiles))]
        const fetched: Record<string, GearItem[]> = {}

        await Promise.all(
          uniqueFiles.map(async (file) => {
            const res = await fetch(`${base}data/gear/${file}.json`)
            fetched[file] = res.ok ? await res.json() : []
          })
        )

        for (const [slot, file] of Object.entries(slotFiles)) {
          this.gearBySlot[slot] = fetched[file] ?? []
        }

        const [allRes, idsRes, foodRes] = await Promise.all([
          fetch(`${base}data/gear/all_gear.json`),
          fetch(`${base}data/item_ids.json`),
          fetch(`${base}data/gear/foods.json`),
        ])

        if (allRes.ok) this.allGear = await allRes.json()
        if (idsRes.ok) this.itemIds = await idsRes.json()
        if (foodRes.ok) {
          const foods: GearItem[] = await foodRes.json()
          foods.forEach((f) => { this.allFood[f.Name2 ?? f.Name] = f })
        }

        this.loaded = true
      } catch (e) {
        console.error('Failed to load gear data:', e)
      }
    },

    getGearForJob(slot: GearSlotName, jobCode: string): GearItem[] {
      const items = this.gearBySlot[slot] ?? []
      if (!jobCode || jobCode === 'None') return items
      return items.filter((item) => {
        if (!item.Jobs || item.Jobs.length === 0) return true
        return item.Jobs.includes(jobCode.toLowerCase())
      })
    },

    getIconUrl(itemName: string): string | null {
      const id = this.itemIds[itemName.toLowerCase()]
      if (!id) return null
      return `${import.meta.env.BASE_URL}icons32/${id}.png`
    },
  },
})
