import type { GearItem, GearSlotName, Gearset } from '@/types/gear'
import { isValidKey, packGearset, unpackGearset } from './useAppStateApi'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const EQUIPMENT_SET_HASH_PREFIX = 'set/'

export function isEquipmentSetHash(hash: string): boolean {
  return (
    hash.startsWith(EQUIPMENT_SET_HASH_PREFIX) &&
    isValidKey(hash.slice(EQUIPMENT_SET_HASH_PREFIX.length))
  )
}

export function extractSetKey(hash: string): string {
  return hash.slice(EQUIPMENT_SET_HASH_PREFIX.length)
}

export async function saveEquipmentSet(gearset: Gearset): Promise<string> {
  const slots = packGearset(gearset)
  const res = await fetch(`${API_BASE}/api/equipment-set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  })
  if (!res.ok) throw new Error(`Save failed: ${res.status}`)
  const data = await res.json()
  return data.key as string
}

export async function fetchEquipmentSet(
  key: string,
  allGear: Record<string, GearItem>,
): Promise<{ gearset: Gearset; unknownNames: string[] }> {
  const res = await fetch(`${API_BASE}/api/equipment-set/${encodeURIComponent(key)}`)
  if (res.status === 404) throw new Error(`Set key "${key}" not found.`)
  if (!res.ok) throw new Error(`Load failed: ${res.status}`)
  const data = await res.json()
  return unpackGearset(data.slots as Record<GearSlotName, string>, allGear)
}
