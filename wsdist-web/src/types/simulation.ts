export type TpThreshold = 1000 | 2000 | 3000

export interface ThresholdComparisonRow {
  threshold: TpThreshold
  wsDamage: number
  timePerWs: number
  dps: number
  isOptimal: boolean
}

export interface SetResults {
  wsDamage: number
  tpRoundDamage: number
  timePerWs: number
  dps: number
  autoAttackDps: number
  wsDps: number
  wsDmgBreakdown: Record<string, number>
  thresholdComparisons: ThresholdComparisonRow[]
  optimalThreshold: TpThreshold
}
