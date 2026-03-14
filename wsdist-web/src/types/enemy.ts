export interface EnemyDef {
  Name: string
  Level: number
  Defense: number
  Evasion: number
  VIT: number
  AGI: number
  INT: number
  MND: number
  CHR: number
  'Magic Evasion': number
  'Magic Defense': number
  'Magic DT%': number
  Location: string
}

export interface EnemyStats {
  Defense: number
  'Base Defense': number
  Evasion: number
  VIT: number
  AGI: number
  INT: number
  MND: number
  CHR: number
  'Magic Evasion': number
  'Magic Defense': number
  'Magic Damage Taken': number
}
