/**
 * Multi-attack rate calculation.
 * Port of get_ma_rate.py
 *
 * Returns [mainHits, subHits, dakenHits, kickAttackHits, zanshinHits]
 */
export function getMaRate3(
  mainJob: string,
  nhits: number,
  qa: number,
  ta: number,
  da: number,
  oaList: number[],   // [oa3_main, oa2_main, oa8_sub, oa7_sub, oa6_sub, oa5_sub, oa4_sub, oa3_sub, oa2_sub]
  fuaList: number[],  // fua values (unused in current formula — included for signature parity)
  dualWield: boolean,
  hitrateMatrix: [[number, number], [number, number]],  // [[hr11, hr21], [hr12, hr22]]
  rangedHitrate2: number,
  daken: number,
  kickAttacks: number,
  zanshin: number,
  zanhasso: number,
  zanshinHitrate: number,
  zanshinOa2: number,
  strikingFlourish = false,
  ternaryFlourish = false,
  tpRound = false,
): [number, number, number, number, number] {
  void fuaList // reserved for future use

  let mainHits = 0
  let subHits = 0
  let dakenHits = 0
  let kickAttackHits = 0

  const hr11 = hitrateMatrix[0][0]
  const hr21 = hitrateMatrix[0][1]
  const hr12 = hitrateMatrix[1][0]
  const hr22 = hitrateMatrix[1][1]

  mainHits += 1 * hr11
  mainHits += (nhits - 1) * hr12

  if (dualWield && mainHits + subHits < 8) {
    subHits += 1 * hr21
  }

  let qaMain: number, taMain: number, daMain: number
  if (strikingFlourish) {
    qaMain = 0; taMain = 0; daMain = 1
  } else if (ternaryFlourish) {
    qaMain = 0; taMain = 1; daMain = 0
  } else {
    qaMain = qa; taMain = ta; daMain = da
  }

  const oa3Main = oaList[0]
  const oa2Main = oaList[1]
  const oa8Sub  = oaList[2]
  const oa7Sub  = oaList[3]
  const oa6Sub  = oaList[4]
  const oa5Sub  = oaList[5]
  const oa4Sub  = oaList[6]
  const oa3Sub  = oaList[7]
  const oa2Sub  = oaList[8]

  const cap = (n: number) => Math.max(0, Math.min(n, 8 - (mainHits + subHits)))

  mainHits += (
    cap(3) * qaMain +
    cap(2) * (1 - qaMain) * taMain +
    cap(1) * (1 - qaMain) * (1 - taMain) * daMain +
    cap(2) * (1 - qaMain) * (1 - taMain) * (1 - daMain) * oa3Main +
    cap(1) * (1 - qaMain) * (1 - taMain) * (1 - daMain) * (1 - oa3Main) * oa2Main
  ) * hr12

  // Zanshin (SAM only, TP rounds only)
  const zanshinHrEffective = tpRound ? zanshinHitrate : 0
  const zanshinBonus =
    (1 - qaMain) * (1 - taMain) * (1 - daMain) * (1 - oa3Main) * (1 - oa2Main) *
    (1 - hr12) * zanshin * zanshinOa2 * 2 +
    (1 - qaMain) * (1 - taMain) * (1 - daMain) * (1 - oa3Main) * (1 - oa2Main) *
    (1 - hr12) * zanshin * (1 - zanshinOa2)

  const zanshinSamBonus = mainJob.toLowerCase() === 'sam'
    ? (
        (1 - qaMain) * (1 - taMain) * (1 - daMain) * (1 - oa3Main) * (1 - oa2Main) *
        hr12 * zanhasso * zanshinOa2 * 2 +
        (1 - qaMain) * (1 - taMain) * (1 - daMain) * (1 - oa3Main) * (1 - oa2Main) *
        hr12 * zanhasso * (1 - zanshinOa2)
      )
    : 0

  const zanshinHits = (zanshinBonus + zanshinSamBonus) * zanshinHrEffective

  if (dualWield) {
    const capS = (n: number) => Math.max(0, Math.min(n, 8 - (subHits + mainHits)))
    subHits += (
      capS(3) * qa +
      capS(2) * (1 - qa) * ta +
      capS(1) * (1 - qa) * (1 - ta) * da +
      capS(7) * (1 - qa) * (1 - ta) * (1 - da) * oa8Sub +
      capS(6) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * oa7Sub +
      capS(5) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * (1 - oa7Sub) * oa6Sub +
      capS(4) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * (1 - oa7Sub) * (1 - oa6Sub) * oa5Sub +
      capS(3) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * (1 - oa7Sub) * (1 - oa6Sub) * (1 - oa5Sub) * oa4Sub +
      capS(2) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * (1 - oa7Sub) * (1 - oa6Sub) * (1 - oa5Sub) * (1 - oa4Sub) * oa3Sub +
      capS(1) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa8Sub) * (1 - oa7Sub) * (1 - oa6Sub) * (1 - oa5Sub) * (1 - oa4Sub) * (1 - oa3Sub) * oa2Sub
    ) * hr22
  } else if (nhits > 1) {
    const capM2 = (n: number) => Math.max(0, Math.min(n, 8 - (subHits + mainHits)))
    mainHits += (
      capM2(3) * qa +
      capM2(2) * (1 - qa) * ta +
      capM2(1) * (1 - qa) * (1 - ta) * da +
      capM2(2) * (1 - qa) * (1 - ta) * (1 - da) * oa3Main +
      capM2(1) * (1 - qa) * (1 - ta) * (1 - da) * (1 - oa3Main) * oa2Main
    ) * hr12
  }

  if (tpRound) {
    const remainingHits = 8 - (mainHits + subHits)
    kickAttackHits += Math.min(Math.max(0, remainingHits), 1.0) * kickAttacks * hr12
    dakenHits += Math.min(Math.max(0, remainingHits - kickAttacks), 1.0) * daken * rangedHitrate2
  }

  return [mainHits, subHits, dakenHits, kickAttackHits, zanshinHits]
}
