/**
 * Physical damage dealt for a single attack.
 * Port of get_phys_damage.py
 * https://www.bg-wiki.com/ffxi/Weapon_Skill_Damage
 */

/**
 * Stochastic version — used in simulation runs.
 * n=0 means this is the first main-hand hit (wsd and finisher bonuses apply).
 */
export function getPhysDamage(
  wpnDmg: number,
  fstrWpn: number,
  wsc: number,
  pdif: number,
  ftp: number,
  crit: boolean,
  critDmg: number,
  wsd: number,
  wsBonus: number,
  wsTrait: number,
  n: number,
  sneakAttackBonus = 0,
  trickAttackBonus = 0,
  climacticFlourishBonus = 0,
  strikingFlourishBonus = 0,
  ternaryFlourishBonus = 0,
): number {
  const isFirst = n === 0 ? 1 : 0
  const base = Math.trunc(
    (wpnDmg + fstrWpn + wsc) * ftp * (1 + wsd * isFirst) * (1 + wsBonus) * (1 + wsTrait)
    + sneakAttackBonus * isFirst
    + trickAttackBonus * isFirst
    + climacticFlourishBonus * isFirst
    + strikingFlourishBonus * isFirst
    + ternaryFlourishBonus * isFirst,
  )
  return base * pdif * (1 + (crit ? 1 : 0) * Math.min(critDmg, 1.0))
}

/**
 * Deterministic average version — used for quicklook.
 * wsd always applies (no per-hit distinction needed for averages).
 */
export function getAvgPhysDamage(
  wpnDmg: number,
  fstrWpn: number,
  wsc: number,
  pdif: number,
  ftp: number,
  critRate: number,
  critDmg: number,
  wsd: number,
  wsBonus: number,
  wsTrait: number,
  sneakAttackBonus = 0,
  trickAttackBonus = 0,
  climacticFlourishBonus = 0,
  strikingFlourishBonus = 0,
  ternaryFlourishBonus = 0,
): number {
  const base = Math.trunc(
    (wpnDmg + fstrWpn + wsc) * ftp * (1 + wsd) * (1 + wsBonus) * (1 + wsTrait)
    + sneakAttackBonus + trickAttackBonus
    + climacticFlourishBonus + strikingFlourishBonus + ternaryFlourishBonus,
  )
  return base * pdif * (1 + Math.min(critRate, 1.0) * Math.min(critDmg, 1.0))
}
