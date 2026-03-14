/**
 * PDIF calculations for physical damage.
 * Port of get_pdif.py
 * https://www.bg-wiki.com/ffxi/PDIF
 */

function pdifBaseCap(wpnTypeSkill: string): number {
  if (['Katana', 'Dagger', 'Sword', 'Axe', 'Club'].includes(wpnTypeSkill)) return 3.25
  if (['Great Katana', 'Hand-to-Hand'].includes(wpnTypeSkill)) return 3.5
  if (['Great Sword', 'Staff', 'Great Axe', 'Polearm'].includes(wpnTypeSkill)) return 3.75
  if (wpnTypeSkill === 'Scythe') return 4.0
  return 3.25 // fallback
}

function meleeQratioLimits(wratio: number): [number, number] {
  let upper: number, lower: number

  if (wratio < 0.5)       upper = wratio + 0.5
  else if (wratio < 0.7)  upper = 1
  else if (wratio < 1.2)  upper = wratio + 0.3
  else if (wratio < 1.5)  upper = 1.25 * wratio
  else                    upper = wratio + 0.375

  if (wratio < 0.38)      lower = 0
  else if (wratio < 1.25) lower = (1176 / 1024) * wratio - (448 / 1024)
  else if (wratio < 1.51) lower = 1
  else if (wratio < 2.44) lower = (1176 / 1024) * wratio - (755 / 1024)
  else                    lower = wratio - 0.375

  return [lower, upper]
}

/** Stochastic PDIF for simulation runs. Returns [pdif, isCrit]. */
export function getPdifMelee(
  playerAttack: number,
  wpnTypeSkill: string,
  pdlTrait: number,
  pdlGear = 0,
  enemyDefense = 1300,
  critRate = 0,
): [number, boolean] {
  const pdifCap = (pdifBaseCap(wpnTypeSkill) + pdlTrait) * (1 + pdlGear)
  const crit = Math.random() < critRate
  const ratio = playerAttack / enemyDefense
  const wratio = crit ? ratio + 1 : ratio

  const [lower, upper] = meleeQratioLimits(wratio)
  let qratio = lower + Math.random() * (upper - lower)

  let pdif: number
  if (qratio <= 0) pdif = 0
  else if (qratio >= pdifCap) pdif = pdifCap
  else pdif = qratio

  if (crit) pdif += 1.0
  pdif *= 1.00 + Math.random() * 0.05

  return [pdif, crit]
}

/** Deterministic average PDIF for quicklook. */
export function getAvgPdifMelee(
  playerAttack: number,
  wpnTypeSkill: string,
  pdlTrait: number,
  pdlGear = 0,
  enemyDefense = 1300,
  critRate = 0,
): number {
  const pdifCap = (pdifBaseCap(wpnTypeSkill) + pdlTrait) * (1 + pdlGear)
  const ratio = playerAttack / enemyDefense
  const clampedCritRate = Math.min(critRate, 1.0)
  const wratio = ratio + 1.0 * clampedCritRate

  const [lower, upper] = meleeQratioLimits(wratio)
  const qratio = 0.5 * (upper + lower)

  let pdif: number
  if (qratio <= 0) pdif = 0
  else if (qratio >= pdifCap) pdif = pdifCap
  else pdif = qratio

  pdif += 1.0 * clampedCritRate
  pdif *= 1.025

  return pdif
}

/** Stochastic PDIF for ranged attacks. Returns [pdif, isCrit]. */
export function getPdifRanged(
  playerRangedAttack: number,
  wpnTypeSkill: string,
  pdlTrait: number,
  pdlGear: number,
  enemyDefense = 1300,
  critRate = 0,
): [number, boolean] {
  const pdifBaseCap = wpnTypeSkill === 'Marksmanship' ? 3.5 : 3.25
  const pdifCap = (pdifBaseCap + pdlTrait) * (1 + pdlGear)
  const crit = Math.random() < critRate
  const wratio = playerRangedAttack / enemyDefense

  let upper: number, lower: number
  if (wratio < 0.9)      { upper = wratio * (10 / 9); lower = wratio }
  else if (wratio < 1.1) { upper = 1; lower = 1 }
  else                   { upper = wratio; lower = wratio * (20 / 19) - (3 / 19) }

  let qratio = lower + Math.random() * (upper - lower)
  let pdif: number
  if (qratio <= 0) pdif = 0
  else if (qratio >= pdifCap) pdif = pdifCap
  else pdif = qratio

  if (crit) pdif *= 1.25

  return [pdif, crit]
}

/** Deterministic average PDIF for ranged quicklook. */
export function getAvgPdifRanged(
  playerRangedAttack: number,
  wpnTypeSkill: string,
  pdlTrait: number,
  pdlGear: number,
  enemyDefense = 1300,
  critRate = 0,
): number {
  const pdifBaseCap = wpnTypeSkill === 'Marksmanship' ? 3.5 : 3.25
  const pdifCap = (pdifBaseCap + pdlTrait) * (1 + pdlGear)
  const wratio = playerRangedAttack / enemyDefense

  let upper: number, lower: number
  if (wratio < 0.9)      { upper = wratio * (10 / 9); lower = wratio }
  else if (wratio < 1.1) { upper = 1; lower = 1 }
  else                   { upper = wratio; lower = wratio * (20 / 19) - (3 / 19) }

  const qratio = 0.5 * (lower + upper)
  let pdif: number
  if (qratio <= 0) pdif = 0
  else if (qratio >= pdifCap) pdif = pdifCap
  else pdif = qratio

  const clampedCrit = Math.min(critRate, 1.0)
  pdif *= (1 + 0.25 * clampedCrit)

  return pdif
}
