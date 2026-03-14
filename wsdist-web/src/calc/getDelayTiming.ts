/**
 * Real-world time (seconds) between attack rounds.
 * Port of get_delay_timing.py
 */
export function getDelayTiming(
  delay1: number,
  delay2: number,
  dw: number,
  marts: number,
  magicHaste: number,
  jaHaste: number,
  gearHaste: number,
): number {
  // Apply haste caps
  const gearHasteCapped  = Math.min(gearHaste,  256 / 1024)
  const magicHasteCapped = Math.min(magicHaste, 448 / 1024)
  const jaHasteCapped    = Math.min(jaHaste,    256 / 1024)
  const totalHaste = gearHasteCapped + magicHasteCapped + jaHasteCapped

  const delay = delay1 + delay2
  let rdelay = (delay - marts) * (1 - dw) * (1 - totalHaste)

  // -80% delay cap
  const delayFloor = 0.2 * delay
  if (rdelay < delayFloor) rdelay = delayFloor

  // tpa = time per attack in seconds (60 delay = 1 second)
  return rdelay / 60
}
