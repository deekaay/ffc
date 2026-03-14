/**
 * Magic damage calculations.
 * Port of nuking.py (active functions only — the commented-out nuking() function is excluded).
 */

/** EnSpell (Enfire, Enthunder, etc.) damage per hit. */
export function getEnspellDamage(
  enhancingMagicSkill: number,
  enspellDamagePercent: number,
  enspellDamage: number,
): number {
  let damage: number
  if (enhancingMagicSkill < 600) {
    damage = Math.trunc((enhancingMagicSkill - 223) / 7.70) + 29
  } else {
    damage = Math.trunc((enhancingMagicSkill - 202.5) / 8.05) + 29
  }
  damage += enspellDamage
  damage *= (1 + enspellDamagePercent / 100)
  return damage
}

/** Magic accuracy bonus from player stat vs enemy stat (dINT/dMND). */
export function getDstatMacc(playerStat: number, enemyStat: number): number {
  const dstat = playerStat - enemyStat
  if (dstat <= -70)       return -30
  if (dstat <= -30)       return 0.25 * dstat - 12.5
  if (dstat <= -10)       return 0.5 * dstat - 5.0
  if (dstat <= 10)        return 1.0 * dstat
  if (dstat <= 30)        return 0.5 * dstat + 5.0
  if (dstat <= 70)        return 0.25 * dstat + 12.5
  return 30
}

/** Magic hit rate from player magic accuracy vs enemy magic evasion. */
export function getMagicHitRate(playerMacc: number, enemyMeva = 0): number {
  const dMacc = playerMacc - enemyMeva
  let rate = dMacc < 0
    ? 0.50 + Math.trunc(dMacc / 2) / 100
    : 0.50 + Math.trunc(dMacc) / 100
  if (rate > 0.95) rate = 0.95
  if (rate < 0)    rate = 0
  return rate
}

/** Stochastic resist state for single magic hit (Monte Carlo use). */
export function getResistState(magicHitRate: number): number {
  let resistState = 1.0
  for (let k = 0; k < 3; k++) {
    if (Math.random() < magicHitRate) break
    resistState *= 0.5
  }
  return resistState
}

/** Average resist coefficient from magic hit rate (deterministic). */
export function getResistStateAverage(magicHitRate: number): number {
  return (
    magicHitRate +
    0.500 * magicHitRate * (1 - magicHitRate) +
    0.250 * magicHitRate * Math.pow(1 - magicHitRate, 2) +
    0.125 * Math.pow(1 - magicHitRate, 3)
  )
}
