export interface QuicklookResults {
  wsDamage: number
  tpRoundDamage: number
  timePerWs: number
  dps: number
  wsDmgBreakdown: Record<string, number>
}
