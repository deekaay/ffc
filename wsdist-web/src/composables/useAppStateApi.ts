import type { GearSlotName, GearItem, Gearset } from '@/types/gear'
import type { EnemyDef } from '@/types/enemy'
import type { SongSlot, RollSlot, BubbleSlot } from '@/types/buffs'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

const SLOT_ORDER: GearSlotName[] = [
  'main', 'sub', 'ranged', 'ammo',
  'head', 'neck', 'ear1', 'ear2',
  'body', 'hands', 'ring1', 'ring2',
  'back', 'waist', 'legs', 'feet',
]

// ---------------------------------------------------------------------------
// State shape stored in MongoDB (opaque to the API)
// ---------------------------------------------------------------------------
export interface SavedAppState {
  v: 1
  character: {
    mainJob: string
    subJob: string
    mainJobLevel: number
    subJobLevel: number
    masterLevel: number
    odysseyRank: string
    tp1: Record<GearSlotName, string>
    ws1: Record<GearSlotName, string>
    tp2: Record<GearSlotName, string>
    ws2: Record<GearSlotName, string>
    enemy: EnemyDef
    wsName: string
    wsThreshold: number
    abilities: Record<string, boolean | number | string>
  }
  buffs: {
    brdEnabled: boolean
    songs: SongSlot[]
    soulVoice: boolean
    marcato: boolean
    songBonus: number
    corEnabled: boolean
    rolls: RollSlot[]
    rollBonus: number
    crookedCards: boolean
    jobBonus: boolean
    lightShot: boolean
    geoEnabled: boolean
    bubbles: BubbleSlot[]
    bolster: boolean
    blazeOfGlory: boolean
    bubbleBonus: number
    bubblePotency: number
    whmEnabled: boolean
    hasteSpell: string
    diaSpell: string
    boostSpell: string
    stormSpell: string
    shellV: boolean
    food: string
  }
}

// ---------------------------------------------------------------------------
// Gearset serialisation helpers
// ---------------------------------------------------------------------------
function packGearset(gs: Gearset): Record<GearSlotName, string> {
  const out = {} as Record<GearSlotName, string>
  for (const slot of SLOT_ORDER) out[slot] = gs[slot]?.Name2 || 'None'
  return out
}

function unpackGearset(
  packed: Record<GearSlotName, string>,
  allGear: Record<string, GearItem>,
): { gearset: Gearset; unknownNames: string[] } {
  const gearset = {} as Gearset
  const unknownNames: string[] = []
  const empty: GearItem = { Name: 'None', Name2: 'None', Jobs: [] }
  for (const slot of SLOT_ORDER) {
    const name2 = packed[slot] || 'None'
    if (name2 === 'None') {
      gearset[slot] = { ...empty }
    } else if (allGear[name2]) {
      gearset[slot] = allGear[name2]
    } else {
      unknownNames.push(name2)
      gearset[slot] = { ...empty }
    }
  }
  return { gearset, unknownNames }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export async function saveAppState(state: SavedAppState): Promise<string> {
  const res = await fetch(`${API_BASE}/api/app-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (!res.ok) throw new Error(`Save failed: ${res.status}`)
  const data = await res.json()
  return data.key as string
}

export async function fetchAppState(key: string): Promise<SavedAppState | null> {
  const res = await fetch(`${API_BASE}/api/app-state/${encodeURIComponent(key)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Load failed: ${res.status}`)
  const data = await res.json()
  return data.state as SavedAppState
}

// ---------------------------------------------------------------------------
// Key validation
// ---------------------------------------------------------------------------
const KEY_RE = /^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[a-z]+$/

export function isValidKey(s: string): boolean {
  return KEY_RE.test(s)
}

// ---------------------------------------------------------------------------
// Composable — exposes helpers used by App.vue
// ---------------------------------------------------------------------------
export function useAppStateApi() {
  return { packGearset, unpackGearset, saveAppState, fetchAppState, isValidKey }
}
