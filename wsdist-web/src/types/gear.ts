export interface GearItem {
  Name: string
  Name2: string
  Type?: string
  'Skill Type'?: string
  DMG?: number
  Delay?: number
  Jobs: string[]
  Rank?: number
  [key: string]: unknown
}

export type GearSlotName =
  | 'main' | 'sub' | 'ranged' | 'ammo'
  | 'head' | 'neck' | 'ear1' | 'ear2'
  | 'body' | 'hands' | 'ring1' | 'ring2'
  | 'back' | 'waist' | 'legs' | 'feet'

export type Gearset = Record<GearSlotName, GearItem>

