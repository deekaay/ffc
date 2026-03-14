/**
 * fSTR calculations for melee and ranged attacks.
 * Port of get_fstr.py
 * https://www.bg-wiki.com/ffxi/FSTR
 */

export function getFstr(dmg: number, playerStr: number, enemyVit: number): number {
  const dstr = playerStr - enemyVit
  let fstr: number

  if (dstr <= -22)      fstr = (dstr + 13) / 4
  else if (dstr <= -16) fstr = (dstr + 12) / 4
  else if (dstr <= -8)  fstr = (dstr + 10) / 4
  else if (dstr <= -3)  fstr = (dstr + 9) / 4
  else if (dstr <= 0)   fstr = (dstr + 8) / 4
  else if (dstr <= 5)   fstr = (dstr + 7) / 4
  else if (dstr < 12)   fstr = (dstr + 6) / 4
  else                  fstr = (dstr + 4) / 4

  const lo = -dmg / 9
  const hi = 8 + dmg / 9
  if (fstr < lo) fstr = lo
  else if (fstr > hi) fstr = hi

  return fstr
}

export function getFstr2(rngDmg: number, playerStr: number, enemyVit: number): number {
  const wpnRank = rngDmg / 9
  let dstr = playerStr - enemyVit

  const dstrLower = -(7 + 2 * wpnRank) * 2
  const dstrUpper = (14 + 2 * wpnRank) * 2

  if (dstr < dstrLower) dstr = dstrLower
  if (dstr > dstrUpper) dstr = dstrUpper

  let fstr: number
  if (dstr <= -22)      fstr = (dstr + 13) / 2
  else if (dstr <= -16) fstr = (dstr + 12) / 2
  else if (dstr <= -8)  fstr = (dstr + 10) / 2
  else if (dstr <= -3)  fstr = (dstr + 9) / 2
  else if (dstr <= 0)   fstr = (dstr + 8) / 2
  else if (dstr <= 5)   fstr = (dstr + 7) / 2
  else if (dstr < 12)   fstr = (dstr + 6) / 2
  else                  fstr = (dstr + 4) / 2

  const lo = -2 * wpnRank
  const hi = 2 * (wpnRank + 8)
  if (fstr < lo) fstr = lo
  if (fstr > hi) fstr = hi

  return fstr
}
