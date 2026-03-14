export interface WeaponSkillResult {
  ftp: number
  ftpRep: boolean
  wsc: number
  nhits: number
  skillchains: string[]
  magical: boolean
  hybrid: boolean
  element: string | null
  dSTAT: number
  ftpHybrid: number
  critRate: number
  critWs: boolean
  // TP-scaled attack / accuracy values (post-bonus)
  playerAttack1: number
  playerAttack2: number
  playerAccuracy1: number
  playerAccuracy2: number
  playerRangedAccuracy: number
  playerRangedAttack: number
  // TP-scaled enemy defense
  enemyDef: number
}
