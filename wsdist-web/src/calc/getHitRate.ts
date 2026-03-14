/**
 * Physical hit rate from accuracy stat.
 * Port of get_hit_rate.py
 * https://www.bg-wiki.com/ffxi/Hit_Rate
 */
export function getHitRate(
  playerAccuracy: number,
  enemyEvasion: number,
  hitRateCap: number,
): number {
  const HIT_RATE_FLOOR = 0.2
  let hitRate = (75 + 0.5 * (playerAccuracy - enemyEvasion)) / 100
  if (hitRate > hitRateCap) hitRate = hitRateCap
  else if (hitRate < HIT_RATE_FLOOR) hitRate = HIT_RATE_FLOOR
  return hitRate
}
