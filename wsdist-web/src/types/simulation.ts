export interface QuicklookResults {
  wsDamage: number
  tpRoundDamage: number
  timePerWs: number
  dps: number
  wsDmgBreakdown: Record<string, number>
}

export interface SimulationResults {
  totalDamage: number
  tpDamage: number
  wsDamage: number
  dps: number
  timeData: number[]
  damageData: number[]
  tpDamageData: number[]
  wsDamageData: number[]
  avgTpDmg: number
  avgWsDmg: number
  avgWsTp: number
}
