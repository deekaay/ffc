export interface SetResults {
  wsDamage: number
  tpRoundDamage: number
  timePerWs: number
  dps: number
  autoAttackDps: number
  wsDps: number
  wsDmgBreakdown: Record<string, number>
}
