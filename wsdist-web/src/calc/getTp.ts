/**
 * TP return from attack rounds and weapon skills.
 * Port of get_tp.py
 */
export function getTp(swings: number, mdelay: number, stp: number, zanshin = false): number {
  let baseTp: number

  if (mdelay <= 180)      baseTp = Math.trunc(61 + ((mdelay - 180) * 63 / 360))
  else if (mdelay <= 540) baseTp = Math.trunc(61 + ((mdelay - 180) * 88 / 360))
  else if (mdelay <= 630) baseTp = Math.trunc(149 + ((mdelay - 540) * 20 / 360))
  else if (mdelay <= 720) baseTp = Math.trunc(154 + ((mdelay - 630) * 28 / 360))
  else if (mdelay <= 900) baseTp = Math.trunc(161 + ((mdelay - 720) * 24 / 360))
  else                    baseTp = Math.trunc(173 + ((mdelay - 900) * 28 / 360))

  // +30 TP per Ikishoten merit (5 merits max) on SAM, applied before Store TP
  const zanshinBonus = 30 * 5 * (zanshin ? 1 : 0)
  baseTp += zanshinBonus

  return swings * Math.trunc(baseTp * (1 + stp))
}
