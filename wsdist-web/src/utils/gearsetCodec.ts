/**
 * Gearset export/import codec.
 * Encodes a 16-slot Gearset to/from a compact ASCII string that survives clipboard copy/paste.
 *
 * Format (before base64): "v1|Name2_0|Name2_1|...|Name2_15"
 *   - 16 positional slots in SLOT_ORDER
 *   - Empty slots encoded as "None"
 *   - The whole payload is btoa-encoded and prefixed with "wsd1:"
 */

import type { GearItem, GearSlotName, Gearset } from '@/types/gear'

export const SLOT_ORDER: GearSlotName[] = [
  'main', 'sub', 'ranged', 'ammo',
  'head', 'neck', 'ear1', 'ear2',
  'body', 'hands', 'ring1', 'ring2',
  'back', 'waist', 'legs', 'feet',
]

const PREFIX = 'wsd1:'
const EMPTY_ITEM: GearItem = { Name: 'None', Name2: 'None', Jobs: [] }

export function encodeGearset(gearset: Gearset): string {
  const parts = ['v1', ...SLOT_ORDER.map(slot => gearset[slot]?.Name2 || 'None')]
  return PREFIX + btoa(parts.join('|'))
}

export interface DecodeResult {
  gearset: Gearset
  unknownNames: string[]
}

export function decodeGearset(
  encoded: string,
  allGear: Record<string, GearItem>,
): DecodeResult | null {
  if (!encoded.startsWith(PREFIX)) return null
  try {
    const payload = atob(encoded.slice(PREFIX.length))
    const parts = payload.split('|')
    if (parts[0] !== 'v1' || parts.length !== 17) return null

    const unknownNames: string[] = []
    const gs = {} as Gearset
    for (let i = 0; i < 16; i++) {
      const name2 = parts[i + 1]
      const slot = SLOT_ORDER[i]
      if (name2 === 'None') {
        gs[slot] = { ...EMPTY_ITEM }
      } else if (allGear[name2]) {
        gs[slot] = allGear[name2]
      } else {
        unknownNames.push(name2)
        gs[slot] = { ...EMPTY_ITEM }
      }
    }
    return { gearset: gs, unknownNames }
  } catch {
    return null
  }
}
