import type { Gearset } from './gear'

export interface PlayerStats {
  STR: number
  DEX: number
  VIT: number
  AGI: number
  INT: number
  MND: number
  CHR: number
  Attack1: number
  Attack2: number
  'Ranged Attack': number
  Accuracy1: number
  Accuracy2: number
  'Ranged Accuracy': number
  Delay1: number
  Delay2: number
  DMG1: number
  DMG2: number
  'Crit Rate': number
  'Store TP': number
  'Gear Haste': number
  'JA Haste': number
  'Magic Haste': number
  [key: string]: number | boolean | unknown
}

export interface Player {
  mainJob: string
  subJob: string
  masterLevel: number
  mainJobLevel: number
  subJobLevel: number
  gearset: Gearset
  buffs: Record<string, unknown>
  abilities: Record<string, boolean | number | string>
  stats: PlayerStats
}
