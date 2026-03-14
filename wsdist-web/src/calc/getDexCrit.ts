/**
 * Critical hit rate bonus from player DEX vs enemy AGI.
 * Port of get_dex_crit.py
 * https://www.bg-wiki.com/ffxi/Critical_Hit_Rate
 */
export function getDexCrit(playerDex: number, enemyAgi: number): number {
  const ddex = playerDex - enemyAgi

  if (ddex <= 6)  return 0.00
  if (ddex <= 13) return 0.01
  if (ddex <= 19) return 0.02
  if (ddex <= 29) return 0.03
  if (ddex <= 39) return 0.04

  const check = (ddex - 35) / 100
  return check <= 0.15 ? check : 0.15
}
