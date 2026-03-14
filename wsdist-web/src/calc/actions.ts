/**
 * Simulation logic: average attack round, average weapon skill, and 2-hour simulation loop.
 * Port of actions.py
 *
 * Author of original: Kastra (Asura server)
 */

import type { Player } from '@/types/player'
import type { EnemyStats } from '@/types/enemy'

import { getHitRate } from '@/calc/getHitRate'
import { getPdifMelee, getPdifRanged, getAvgPdifMelee, getAvgPdifRanged } from '@/calc/getPdif'
import { getPhysDamage, getAvgPhysDamage } from '@/calc/getPhysDamage'
import { getFstr, getFstr2 } from '@/calc/getFstr'
import { getTp } from '@/calc/getTp'
import { getDelayTiming } from '@/calc/getDelayTiming'
import { getDexCrit } from '@/calc/getDexCrit'
import { getWeaponskillInfo } from '@/calc/weaponskillInfo'
import { getMaRate3 } from '@/calc/getMaRate'
import { getWeaponBonus } from '@/calc/weaponBonus'
import { getEnspellDamage, getDstatMacc, getMagicHitRate, getResistState, getResistStateAverage } from '@/calc/nuking'

// ---------------------------------------------------------------------------
// Helper accessors
// ---------------------------------------------------------------------------

/** Read a numeric player stat (defaults to 0). */
function ps(p: Player, k: string): number {
  return (p.stats[k] as number) ?? 0
}

/** Read a player ability (coerced to boolean). */
function pa(p: Player, k: string): boolean {
  return !!(p.abilities[k] ?? false)
}

/** Read a numeric enemy stat (defaults to 0). */
function es(e: EnemyStats, k: string): number {
  return (e[k as keyof EnemyStats] as number) ?? 0
}

/** Fisher-Yates in-place shuffle (reserved for future use). */
export function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.trunc(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AttackRoundResult {
  physicalDamage: number
  tpReturn: number
  magicalDamage: number
}

export interface WeaponSkillResult2 {
  damage: number
  tpAfter: number
}

export interface SimulationResults {
  totalDamage: number
  tpDamage: number
  wsDamage: number
  timeSeconds: number
  avgTpDmg: number
  avgWsDmg: number
  avgWsTp: number
  tpDps: number
  wsDps: number
  totalDps: number
  timeList: number[]
  damageList: number[]
  tpDamageList: number[]
  wsDamageList: number[]
  tpTimeList: number[]
  wsTimeList: number[]
  physDmgList: number[]
  magicDmgList: number[]
}

// ---------------------------------------------------------------------------
// averageAttackRound
// ---------------------------------------------------------------------------

/**
 * Calculate the damage dealt from a typical attack round.
 *
 * When simulation=true the function rolls each hit stochastically.
 * When simulation=false it returns averaged/expected values.
 *
 * Returns AttackRoundResult.  In the non-simulation branch tpReturn contains
 * the *per-round* average TP gained (used as input_metric "Time to WS").
 */
export function averageAttackRound(
  player: Player,
  enemy: EnemyStats,
  startingTp: number,
  wsThreshold: number,
  simulation: boolean,
): AttackRoundResult {
  const dualWield =
    (player.gearset['sub'].Type === 'Weapon') ||
    (player.gearset['main']['Skill Type'] === 'Hand-to-Hand')

  const enemyDefense = enemy.Defense
  const enemyEvasion = enemy.Evasion

  // Multi-attack rates
  const qa = Math.min(ps(player, 'QA') / 100, 1.0)
  const ta = Math.min(ps(player, 'TA') / 100, 1.0)
  const da = Math.min(ps(player, 'DA') / 100, 1.0)

  const oa8Main = ps(player, 'OA8 main') / 100
  const oa7Main = ps(player, 'OA7 main') / 100
  const oa6Main = ps(player, 'OA6 main') / 100
  const oa5Main = ps(player, 'OA5 main') / 100
  const oa4Main = ps(player, 'OA4 main') / 100
  const oa3Main = ps(player, 'OA3 main') / 100
  const oa2Main = ps(player, 'OA2 main') / 100

  const oa8Sub = ps(player, 'OA8 sub') / 100
  const oa7Sub = ps(player, 'OA7 sub') / 100
  const oa6Sub = ps(player, 'OA6 sub') / 100
  const oa5Sub = ps(player, 'OA5 sub') / 100
  const oa4Sub = ps(player, 'OA4 sub') / 100
  const oa3Sub = ps(player, 'OA3 sub') / 100
  const oa2Sub = ps(player, 'OA2 sub') / 100

  // OA list for getMaRate3: [oa3_main, oa2_main, oa8_sub..oa2_sub]
  const oaList = [
    ps(player, 'OA3 main') / 100,
    ps(player, 'OA2 main') / 100,
    ps(player, 'OA8 sub') / 100,
    ps(player, 'OA7 sub') / 100,
    ps(player, 'OA6 sub') / 100,
    ps(player, 'OA5 sub') / 100,
    ps(player, 'OA4 sub') / 100,
    ps(player, 'OA3 sub') / 100,
    ps(player, 'OA2 sub') / 100,
  ]

  // Follow-up attack
  const fuaMain = ps(player, 'FUA main') / 100
  const fuaSub  = ps(player, 'FUA sub') / 100
  const fuaList = [fuaMain, fuaSub]

  const taDmg = ps(player, 'TA Damage%') / 100
  const daDmg = ps(player, 'DA Damage%') / 100

  const pdlGear  = ps(player, 'PDL') / 100
  const pdlTrait = ps(player, 'PDL Trait') / 100

  const critRate0 = (ps(player, 'Crit Rate') / 100) + getDexCrit(ps(player, 'DEX'), es(enemy, 'AGI'))
  const critDmg   = ps(player, 'Crit Damage') / 100

  // Tauret crit bonus (low-TP auto-attacks)
  let critRate = critRate0 + 0.5 * (1 - startingTp / 3000) * (player.gearset['main'].Name === 'Tauret' ? 1 : 0)
  critRate = Math.min(critRate, 1.0)

  // Karambit +50 STP on crits
  const stp = ps(player, 'Store TP') / 100 + (50 / 100) * critRate * (player.gearset['main'].Name === 'Karambit' ? 1 : 0)

  // Delay / mdelay
  const baseDelay = (ps(player, 'Delay1') + ps(player, 'Delay2')) / 2
  const mdelay = (baseDelay - ps(player, 'Martial Arts')) * (1 - ps(player, 'Dual Wield') / 100)

  // Weapon damage
  const mainDmg = ps(player, 'DMG1')
  const subDmg  = ps(player, 'DMG2')
  const fstrMain = getFstr(mainDmg, ps(player, 'STR'), es(enemy, 'VIT'))
  const fstrSub  = getFstr(subDmg,  ps(player, 'STR'), es(enemy, 'VIT'))

  const attack1   = ps(player, 'Attack1')
  const attack2_0 = ps(player, 'Attack2')

  const oneHandedSkills = ['Axe', 'Club', 'Dagger', 'Sword', 'Katana']
  const twoHandedSkills = ['Great Sword', 'Great Katana', 'Great Axe', 'Polearm', 'Scythe', 'Staff']

  const mainSkillType = (player.gearset['main']['Skill Type'] as string) ?? ''
  const subSkillTypeRaw = (player.gearset['sub']['Skill Type'] as string | undefined)
  const subSkillType = mainSkillType === 'Hand-to-Hand' ? 'Hand-to-Hand' : (subSkillTypeRaw ?? '')
  const attack2 = mainSkillType === 'Hand-to-Hand' ? attack1 : attack2_0

  const hitRateCapMain = (oneHandedSkills.includes(mainSkillType) || mainSkillType === 'Hand-to-Hand') ? 0.99 : 0.95
  const hitRateCapSub  = subSkillType === 'Hand-to-Hand' ? 0.99 : 0.95

  const hitRate11 = getHitRate(attack1,  enemyEvasion, hitRateCapMain)
  let   hitRate12 = getHitRate(attack1,  enemyEvasion, hitRateCapMain)
  let   hitRate21 = getHitRate(attack2,  enemyEvasion, hitRateCapSub)
  let   hitRate22 = getHitRate(attack2,  enemyEvasion, hitRateCapSub)

  if (!dualWield) { hitRate21 = 0; hitRate22 = 0 }

  void [[hitRate11, hitRate21], [hitRate12, hitRate22]] // hitRateMatrix used only in non-simulation path

  // Daken
  const daken = Math.min(ps(player, 'Daken') / 100, 1.0)
  const ammoDmg   = ps(player, 'Ammo DMG')
  const fstrAmmo  = getFstr2(ammoDmg, ps(player, 'STR'), es(enemy, 'VIT'))
  const ammoDelay = ps(player, 'Ammo Delay')
  const rangedAccuracy = ps(player, 'Ranged Accuracy') + (daken > 0 ? 100 : 0)
  const rangedAttack   = ps(player, 'Ranged Attack')
  const ammoSkillType  = (player.gearset['ammo']['Skill Type'] as string) ?? 'None'
  const hitRateCapRanged = pa(player, 'Sharpshot') ? 0.99 : 0.95
  const hitRateRanged = getHitRate(rangedAccuracy, enemyEvasion, hitRateCapRanged)

  // Kick attacks
  const kickDmg = ps(player, 'Kick DMG')
  const fstrKick = getFstr(kickDmg, ps(player, 'STR'), es(enemy, 'VIT'))
  const kickAttacks = Math.min(ps(player, 'Kick Attacks') / 100, 1.0)

  // Zanshin
  const zanshin = Math.min(ps(player, 'Zanshin') / 100, 1.0)
  const zanhasso = ps(player, 'Zanhasso') / 100
  const zanshinHitRate = getHitRate(attack1 + 34, enemyEvasion, 0.95)
  const zanshinOa2 = ps(player, 'Zanshin OA2') / 100

  // EnSpell
  const enhancingMagicSkill = ps(player, 'Enhancing Skill') || (player.abilities['Enhancing Skill'] as number) || 0
  const enspellActive = pa(player, 'EnSpell') || pa(player, 'Endark II') || pa(player, 'Enlight II')
  let mainEnspellDamage = 0
  let subEnspellDamage  = 0

  if (pa(player, 'EnSpell')) {
    const enspellDamagePctMain = ps(player, 'EnSpell Damage% main') + ps(player, 'EnSpell Damage%')
    const enspellDamagePctSub  = ps(player, 'EnSpell Damage% sub')  + ps(player, 'EnSpell Damage%')
    const enspellDmgMain = ps(player, 'EnSpell Damage main') + ps(player, 'EnSpell Damage')
    const enspellDmgSub  = ps(player, 'EnSpell Damage sub')  + ps(player, 'EnSpell Damage')
    const magicCritRate2 = ps(player, 'Magic Crit Rate II') / 100

    const activeStorm = player.abilities['Storm spell']
    let dayweather = 0
    if (activeStorm && activeStorm !== 'None' && player.gearset['waist'].Name === 'Hachirin-no-Obi') {
      dayweather = (activeStorm as string).includes('II') ? 0.25 : 0.10
    }

    const elements = ['Earth', 'Water', 'Wind', 'Fire', 'Ice', 'Thunder']
    const elemBonus = elements.reduce((max, el) => Math.max(max, ps(player, `${el} Elemental Bonus`)), 0) / 100
    const elemMagicAtkBonus = elemBonus + ps(player, 'Elemental Bonus') / 100

    mainEnspellDamage = getEnspellDamage(enhancingMagicSkill, enspellDamagePctMain, enspellDmgMain)
      * (1 + dayweather) * (1 + elemMagicAtkBonus)
      * (1.0 + 0.25 * (Math.random() < magicCritRate2 ? 1 : 0))
    subEnspellDamage = getEnspellDamage(enhancingMagicSkill, enspellDamagePctSub, enspellDmgSub)
      * (1 + dayweather) * (1 + elemMagicAtkBonus)
      * (1.0 + 0.25 * (Math.random() < magicCritRate2 ? 1 : 0))

  } else if (pa(player, 'Enlight II')) {
    const enlightPotency = 0.8
    const sk = enhancingMagicSkill
    let raw: number
    if (sk <= 500) {
      raw = 2 * ((sk + 85) / 13) + (sk + 85) / 26
    } else {
      raw = 2 * ((sk + 400) / 20) + (sk + 400) / 40
    }
    mainEnspellDamage = Math.trunc(raw * enlightPotency) + 20

  } else if (pa(player, 'Endark II')) {
    const endarkPotency = 0.8
    mainEnspellDamage = Math.trunc(((enhancingMagicSkill + 20) / 13 + 5) * 2.5 * endarkPotency) + 20
  }

  // Aftermath
  const aftermath = (player.abilities['Aftermath'] as number) || 0
  const empyreanWeapons = ['Verethragna','Twashtar','Almace','Caladbolg','Farsha','Ukonvasara','Redemption','Kannagi','Rhongomiant','Gambanteinn','Masamune','Hvergelmir']
  const empyreanAm = [0.3, 0.4, 0.5]
  let empyreanAmDmgBonus = 1.0
  if (empyreanWeapons.includes(player.gearset['main'].Name) && aftermath > 0) {
    empyreanAmDmgBonus += 2 * empyreanAm[aftermath - 1]
  }

  // Relic hidden damage
  const relicWeapons30 = ['Spharai','Mandau','Excalibur','Kikoku','Mjollnir']
  const relicWeapons25 = ['Ragnarok','Guttler','Gungnir','Amanomurakumo','Claustrum']
  const relicWeapons20 = ['Bravura','Apocalypse']
  let relicHiddenDmgBonus = 1.0
  if (relicWeapons30.includes(player.gearset['main'].Name)) relicHiddenDmgBonus += 2 * 0.13
  else if (relicWeapons25.includes(player.gearset['main'].Name)) relicHiddenDmgBonus += 1.5 * 0.16
  else if (relicWeapons20.includes(player.gearset['main'].Name)) relicHiddenDmgBonus += 1.0 * 0.2

  // Prime hidden damage
  const primeWeapons3 = ['Varga Purnikawa V','Mpu Gandring V','Caliburnus V','Helheim V','Spalirisos V','Laphria V','Foenaria V','Gae Buide V','Dokoku V','Kusanagi no Tsurugi V','Lorg Mor V','Opashoro V']
  const primeWeapons2 = ['Varga Purnikawa IV','Mpu Gandring IV','Caliburnus IV','Helheim IV','Spalirisos IV','Laphria IV','Foenaria IV','Gae Buide IV','Dokoku IV','Kusanagi no Tsurugi IV','Lorg Mor IV','Opashoro IV']
  let primeHiddenDmgBonus = 1.0
  if (primeWeapons3.includes(player.gearset['main'].Name2)) primeHiddenDmgBonus += 2 * 0.3
  else if (primeWeapons2.includes(player.gearset['main'].Name2)) primeHiddenDmgBonus += 1.0 * 0.3

  // Dragon Fangs kick damage bonus
  const dragonFangsKickProcRate = 0.2
  let dragonFangsKickDmgBonus = 1.0
  if (player.gearset['main'].Name2 === 'Dragon Fangs') {
    dragonFangsKickDmgBonus += 1.0 * dragonFangsKickProcRate
  }

  // -----------------------------------------------------------------------
  // Simulation branch
  // -----------------------------------------------------------------------

  if (simulation) {
    let physicalDamage = 0
    let magicalDamage  = 0
    let tpReturn       = 0

    let mainHitDamage  = 0
    let subHitDamage   = 0
    let zanshinDamage  = 0
    let kickAtkDamage  = 0
    let dakenDamage    = 0

    let mainHitConnects = false
    let mainMaProc      = false

    // Pre-roll multi-attack for main and off-hand
    const qaProcMain = Math.random() < qa
    const taProcMain = (Math.random() < ta) && !qaProcMain
    const daProcMain = (Math.random() < da) && !qaProcMain && !taProcMain
    const qaProcSub  = Math.random() < qa
    const taProcSub  = (Math.random() < ta) && !qaProcSub
    const daProcSub  = (Math.random() < da) && !qaProcSub && !taProcSub

    let attemptedHits = 0

    // ---- Main-hand first hit ----
    attemptedHits++
    if (Math.random() < hitRate11) {
      mainHitConnects = true
      const [pdif, crit] = getPdifMelee(attack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)

      const mainName = player.gearset['main'].Name
      const main2   = player.gearset['main'].Name2
      let phys = getPhysDamage(mainDmg, fstrMain, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
        * (1.0 + 2.0 * (Math.random() < 0.13 && relicWeapons30.includes(mainName) ? 1 : 0))
        * (1.0 + 1.5 * (Math.random() < 0.16 && relicWeapons25.includes(mainName) ? 1 : 0))
        * (1.0 + 1.0 * (Math.random() < 0.2  && relicWeapons20.includes(mainName) ? 1 : 0))
        * (1.0 + 2.0 * (Math.random() < 0.3  && primeWeapons3.includes(main2)     ? 1 : 0))
        * (1.0 + 1.0 * (Math.random() < 0.3  && primeWeapons2.includes(main2)     ? 1 : 0))
        * (1.0 + 2.0 * (aftermath > 0 && empyreanWeapons.includes(mainName) && Math.random() < empyreanAm[aftermath - 1] ? 1 : 0))
        * (1 + daDmg * (daProcMain ? 1 : 0))
        * (1 + taDmg * (taProcMain ? 1 : 0))
      mainHitDamage += phys

      const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
      tpReturn += tpPh

      if (enspellActive) {
        magicalDamage += mainEnspellDamage
      }
    }

    // ---- Off-hand first hit ----
    if (dualWield) {
      attemptedHits++
      if (Math.random() < hitRate21) {
        const [pdif, crit] = getPdifMelee(attack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
        let phys = getPhysDamage(subDmg, fstrSub, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
          * (1 + daDmg * (daProcSub ? 1 : 0))
          * (1 + taDmg * (taProcSub ? 1 : 0))
        subHitDamage += phys

        const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
        tpReturn += tpPh

        if (enspellActive) {
          magicalDamage += subEnspellDamage
        }
      }
    }

    // ---- Main-hand multi-attack ----
    const mainMultiHitBonus = (
      bonusHits: number,
      dmgMult: number,
    ) => {
      for (let i = 0; i < bonusHits; i++) {
        if (attemptedHits >= 8) break
        attemptedHits++
        if (Math.random() < hitRate12) {
          const [pdif, crit] = getPdifMelee(attack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
          const mainName = player.gearset['main'].Name
          let phys = getPhysDamage(mainDmg, fstrMain, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
            * (1.0 + 2.0 * (aftermath > 0 && empyreanWeapons.includes(mainName) && Math.random() < empyreanAm[aftermath - 1] ? 1 : 0))
            * dmgMult
          mainHitDamage += phys

          const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
          tpReturn += tpPh

          if (enspellActive) {
            magicalDamage += mainEnspellDamage
          }
        }
      }
    }

    if (qaProcMain) {
      mainMaProc = true
      mainMultiHitBonus(3, 1)
    } else if (taProcMain) {
      mainMaProc = true
      mainMultiHitBonus(2, 1 + taDmg)
    } else if (daProcMain) {
      mainMaProc = true
      mainMultiHitBonus(1, 1 + daDmg)
    } else if (Math.random() < oa8Main) {
      mainMaProc = true; mainMultiHitBonus(7, 1)
    } else if (Math.random() < oa7Main) {
      mainMaProc = true; mainMultiHitBonus(6, 1)
    } else if (Math.random() < oa6Main) {
      mainMaProc = true; mainMultiHitBonus(5, 1)
    } else if (Math.random() < oa5Main) {
      mainMaProc = true; mainMultiHitBonus(4, 1)
    } else if (Math.random() < oa4Main) {
      mainMaProc = true; mainMultiHitBonus(3, 1)
    } else if (Math.random() < oa3Main) {
      mainMaProc = true; mainMultiHitBonus(2, 1)
    } else if (Math.random() < oa2Main) {
      mainMaProc = true; mainMultiHitBonus(1, 1)
    }
    physicalDamage += mainHitDamage

    // ---- Off-hand multi-attack ----
    if (dualWield && attemptedHits < 8) {
      const subMultiHitBonus = (bonusHits: number, dmgMult: number) => {
        for (let i = 0; i < bonusHits; i++) {
          if (attemptedHits >= 8) break
          attemptedHits++
          if (Math.random() < hitRate22) {
            const [pdif, crit] = getPdifMelee(attack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
            let phys = getPhysDamage(subDmg, fstrSub, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0) * dmgMult
            subHitDamage += phys

            const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
            tpReturn += tpPh

            if (enspellActive) {
              magicalDamage += subEnspellDamage
            }
          }
        }
      }

      if (qaProcSub) {
        subMultiHitBonus(3, 1)
      } else if (taProcSub) {
        subMultiHitBonus(2, 1 + taDmg)
      } else if (daProcSub) {
        subMultiHitBonus(1, 1 + daDmg)
      } else if (Math.random() < oa8Sub) {
        subMultiHitBonus(7, 1)
      } else if (Math.random() < oa7Sub) {
        subMultiHitBonus(6, 1)
      } else if (Math.random() < oa6Sub) {
        subMultiHitBonus(5, 1)
      } else if (Math.random() < oa5Sub) {
        subMultiHitBonus(4, 1)
      } else if (Math.random() < oa4Sub) {
        subMultiHitBonus(3, 1)
      } else if (Math.random() < oa3Sub) {
        subMultiHitBonus(2, 1)
      } else if (Math.random() < oa2Sub) {
        subMultiHitBonus(1, 1)
      }
      physicalDamage += subHitDamage
    }

    // ---- Zanshin ----
    if (attemptedHits < 8) {
      if (
        (!mainHitConnects || Math.random() < zanhasso) &&
        !dualWield &&
        twoHandedSkills.includes(mainSkillType)
      ) {
        if (!mainMaProc) {
          const mainName = player.gearset['main'].Name
          const doZanshinHit = () => {
            if (attemptedHits >= 8) return
            attemptedHits++
            if (Math.random() < zanshinHitRate) {
              const [pdif, crit] = getPdifMelee(attack1 + ps(player, 'Zanshin Attack'), mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
              let phys = getPhysDamage(mainDmg, fstrMain, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
                * (1.0 + 2.0 * (aftermath > 0 && empyreanWeapons.includes(mainName) && Math.random() < empyreanAm[aftermath - 1] ? 1 : 0))
              zanshinDamage += phys

              const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp, player.mainJob === 'sam')
              tpReturn += tpPh

              if (enspellActive) {
                magicalDamage += mainEnspellDamage
              }
            }
          }

          if (Math.random() < zanshinOa2) {
            doZanshinHit()
            doZanshinHit()
          } else if (Math.random() < zanshin) {
            doZanshinHit()
          }
        }
      }
    }
    physicalDamage += zanshinDamage

    // ---- Kick attacks ----
    if (attemptedHits < 8 && mainSkillType === 'Hand-to-Hand' && Math.random() < kickAttacks) {
      attemptedHits++
      if (Math.random() < hitRate11) {
        const [pdif, crit] = getPdifMelee(attack1 + ps(player, 'Kick Attacks Attack'), mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
        const phys = getPhysDamage(kickDmg, fstrKick, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
        kickAtkDamage = phys * (1 + (Math.random() < dragonFangsKickProcRate ? 1 : 0))

        const tpPh = getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
        tpReturn += tpPh

        if (enspellActive) {
          magicalDamage += mainEnspellDamage
        }
      }
    }
    physicalDamage += kickAtkDamage

    // ---- Daken ----
    if (attemptedHits < 8 && ammoSkillType === 'Throwing' && Math.random() < daken) {
      attemptedHits++
      if (Math.random() < hitRateRanged) {
        const [pdif, crit] = getPdifRanged(rangedAttack, ammoSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
        const phys = getPhysDamage(ammoDmg, fstrAmmo, 0, pdif, 1.0, crit, critDmg, 0, 0, 0, 0)
        dakenDamage = phys

        const tpPh = getTp(1, ammoDelay, stp)
        tpReturn += tpPh
      }
    }
    physicalDamage += dakenDamage

    return { physicalDamage, tpReturn, magicalDamage }
  }

  // -----------------------------------------------------------------------
  // Non-simulation (average) branch
  // -----------------------------------------------------------------------

  const strikingFlourish   = pa(player, 'Striking Flourish')
  const ternaryFlourish    = pa(player, 'Ternary Flourish')
  const climacticFlourish  = pa(player, 'Climactic Flourish')
  const sneakAttack        = pa(player, 'Sneak Attack')
  const trickAttack        = pa(player, 'Trick Attack')

  let hr11Eff = hitRate11
  let hr21Eff = hitRate21
  if (sneakAttack || trickAttack) {
    hr11Eff = 1.0
    hr21Eff = 1.0
  }

  const [mainHits, subHits, dakenHitsAvg, kickAttackHits, zanshinHits] = getMaRate3(
    player.mainJob,
    1, // nhits
    qa, ta, da,
    oaList,
    fuaList,
    dualWield,
    [[hr11Eff, hr21Eff], [hitRate12, hitRate22]],
    hitRateRanged,
    daken,
    kickAttacks,
    zanshin,
    zanhasso,
    zanshinHitRate,
    zanshinOa2,
    strikingFlourish,
    ternaryFlourish,
    true,
  )

  let magicalDamage = 0
  if (pa(player, 'EnSpell')) {
    const enspellDamagePctMain = ps(player, 'EnSpell Damage% main') + ps(player, 'EnSpell Damage%')
    const enspellDamagePctSub  = ps(player, 'EnSpell Damage% sub')  + ps(player, 'EnSpell Damage%')
    const enspellDmgMain = ps(player, 'EnSpell Damage main') + ps(player, 'EnSpell Damage')
    const enspellDmgSub  = ps(player, 'EnSpell Damage sub')  + ps(player, 'EnSpell Damage')
    const magicCritRate2 = ps(player, 'Magic Crit Rate II') / 100

    const activeStorm = player.abilities['Storm spell']
    let dayweather = 0
    if (activeStorm && activeStorm !== 'None' && player.gearset['waist'].Name === 'Hachirin-no-Obi') {
      dayweather = (activeStorm as string).includes('II') ? 0.25 : 0.10
    }
    const elements = ['Earth', 'Water', 'Wind', 'Fire', 'Ice', 'Thunder']
    const elemBonus = elements.reduce((max, el) => Math.max(max, ps(player, `${el} Elemental Bonus`)), 0) / 100
    const elemMagicAtkBonus = elemBonus + ps(player, 'Elemental Bonus') / 100

    const esd = (pct: number, flat: number) => getEnspellDamage(enhancingMagicSkill, pct, flat)
    magicalDamage += mainHits * esd(enspellDamagePctMain, enspellDmgMain)
    magicalDamage += subHits  * esd(enspellDamagePctSub,  enspellDmgSub)
    magicalDamage += kickAttackHits * esd(enspellDamagePctMain, enspellDmgMain)
    magicalDamage += zanshinHits    * esd(enspellDamagePctMain, enspellDmgMain)
    magicalDamage *= (1 + dayweather)
    magicalDamage *= (1 + elemMagicAtkBonus)
    magicalDamage *= (1 + 0.25 * magicCritRate2)
  }

  let tpPerAttackRound = 0
  tpPerAttackRound += getTp(mainHits + subHits + kickAttackHits, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
  tpPerAttackRound += getTp(zanshinHits, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp, player.mainJob === 'sam')
  tpPerAttackRound += getTp(dakenHitsAvg, ammoDelay, stp)
  tpPerAttackRound = Math.max(0, tpPerAttackRound)

  const timePerAttackRound = Math.max(0, getDelayTiming(
    ps(player, 'Delay1'),
    dualWield && mainSkillType !== 'Hand-to-Hand' ? ps(player, 'Delay2') : 0,
    ps(player, 'Dual Wield') / 100,
    ps(player, 'Martial Arts'),
    ps(player, 'Magic Haste'),
    ps(player, 'JA Haste'),
    ps(player, 'Gear Haste'),
  ))

  // Add passive TP from Regain
  const regainTp = ps(player, 'Dual Wield') * (player.gearset['main'].Name === 'Gokotai' ? 1 : 0) + ps(player, 'Regain')
  tpPerAttackRound += (timePerAttackRound / 3) * regainTp

  let timePerWs: number
  if (tpPerAttackRound === 0) {
    timePerWs = 9999
  } else {
    const attacksPerWs = (wsThreshold - startingTp) / tpPerAttackRound
    timePerWs = timePerAttackRound * attacksPerWs
  }

  // Average physical damage
  let physicalDamage = 0

  const mainHitPdif   = getAvgPdifMelee(attack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
  let mainHitDamageAvg = getAvgPhysDamage(mainDmg, fstrMain, 0, mainHitPdif, 1.0, critRate, critDmg, 0, 0, 0)
  mainHitDamageAvg *= (player.gearset['main'].Name !== 'Verethragna' ? empyreanAmDmgBonus : 1.0)
  physicalDamage += mainHits * mainHitDamageAvg

  // First hit correction
  const sneakAtkBonus      = (ps(player, 'DEX') * (1 + ps(player, 'Sneak Attack Bonus') / 100)) * (sneakAttack && player.mainJob === 'thf' ? 1 : 0)
  const trickAtkBonus      = (ps(player, 'AGI') * (1 + ps(player, 'Trick Attack Bonus') / 100)) * (trickAttack && player.mainJob === 'thf' ? 1 : 0)
  const climacticFlBonus   = (0.5 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (climacticFlourish ? 1 : 0)
  const strikingFlBonus    = (1.0 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (strikingFlourish ? 1 : 0)
  const ternaryFlBonus     = (1.0 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (ternaryFlourish ? 1 : 0)

  const climacticCritDmg   = ps(player, 'Climactic Crit Damage') / 100 * (climacticFlourish ? 1 : 0)
  const strikingCritRate   = ps(player, 'Striking Crit Rate') / 100 * (strikingFlourish ? 1 : 0)
  const vajraBonusCritDmg  = 0.3 * ((player.gearset['main'].Name === 'Vajra' && (sneakAttack || trickAttack)) ? 1 : 0)

  const firstMainCritRate  = (sneakAttack || trickAttack || climacticFlourish) ? 1.0 : (critRate + strikingCritRate * (critRate > 0 ? 1 : 0))
  const adjustedCritDmg    = (critDmg + vajraBonusCritDmg) * (1 + climacticCritDmg)

  const firstMainHitPdif   = getAvgPdifMelee(attack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, Math.min(firstMainCritRate, 1.0))
  const firstMainHitDmg    = getAvgPhysDamage(mainDmg, fstrMain, 0, firstMainHitPdif, 1.0, Math.min(firstMainCritRate, 1.0), adjustedCritDmg, 0, 0, 0, sneakAtkBonus, trickAtkBonus, climacticFlBonus, strikingFlBonus, ternaryFlBonus)
    * relicHiddenDmgBonus
    * empyreanAmDmgBonus
    * primeHiddenDmgBonus

  physicalDamage += (firstMainHitDmg * hr11Eff - mainHitDamageAvg * hr11Eff)

  if (strikingFlourish) {
    const sfCritRate = Math.min(critRate + strikingCritRate * (critRate > 0 ? 1 : 0), 1.0)
    const sfPdif     = getAvgPdifMelee(attack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, sfCritRate)
    const sfDaDmg    = getAvgPhysDamage(mainDmg, fstrMain, 0, sfPdif, 1.0, sfCritRate, critDmg, 0, 0, 0, sneakAtkBonus, trickAtkBonus, climacticFlBonus, strikingFlBonus, ternaryFlBonus)
    physicalDamage  += (sfDaDmg - mainHitDamageAvg) * hr11Eff
  }

  // Off-hand average
  const offhandPdif  = getAvgPdifMelee(attack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
  const offhandDmg   = getAvgPhysDamage(subDmg, fstrSub, 0, offhandPdif, 1.0, critRate, critDmg, 0, 0, 0)
  physicalDamage    += offhandDmg * subHits

  physicalDamage *= (1 + daDmg * da) * (1 + taDmg * ta)

  // Kick attacks average
  const kaPdif   = getAvgPdifMelee(attack1 + ps(player, 'Kick Attacks Attack'), mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
  const kaDmgAvg = getAvgPhysDamage(kickDmg, fstrKick, 0, kaPdif, 1.0, critRate, critDmg, 0, 0, 0) * dragonFangsKickDmgBonus
  physicalDamage += kaDmgAvg * kickAttackHits

  // Daken average
  const dakenPdif  = getAvgPdifRanged(rangedAttack, ammoSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
  const dakenDmgAvg = getAvgPhysDamage(ammoDmg, fstrAmmo, 0, dakenPdif, 1.0, critRate, critDmg, 0, 0, 0)
  physicalDamage   += dakenHitsAvg * dakenDmgAvg / empyreanAmDmgBonus

  // Zanshin average
  const zanshinPdif  = getAvgPdifMelee(attack1 + ps(player, 'Zanshin Attack'), mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
  const zanshinDmgAvg = getAvgPhysDamage(mainDmg, fstrMain, 0, zanshinPdif, 1.0, critRate, critDmg, 0, 0, 0) * empyreanAmDmgBonus
  physicalDamage     += zanshinHits * zanshinDmgAvg

  // Return tpReturn = timePerWs for "Time to WS" metric used by simulation
  return { physicalDamage, tpReturn: timePerWs, magicalDamage }
}

// ---------------------------------------------------------------------------
// averageWs
// ---------------------------------------------------------------------------

/**
 * Calculate average weapon skill damage.
 * Returns damage dealt and TP after the weapon skill.
 */
export function averageWs(
  player: Player,
  enemy: EnemyStats,
  wsName: string,
  inputTp: number,
  wsType: string,
  simulation: boolean,
): WeaponSkillResult2 {
  const tpBonus = ps(player, 'TP Bonus')
  const baseTp  = inputTp
  const tp      = Math.max(1000, Math.min(3000, inputTp + tpBonus))

  const dualWield =
    (player.gearset['sub'].Type === 'Weapon') ||
    (player.gearset['main']['Skill Type'] === 'Hand-to-Hand')

  const hoverShot = pa(player, 'Hover Shot') && wsType === 'ranged'

  const mainWpnName = player.gearset['main'].Name
  const wscBonus = (player.stats['WSC'] as Array<[string, number]>) ?? []

  const wsInfo = getWeaponskillInfo(
    wsName,
    tp,
    player.stats as Record<string, unknown>,
    enemy as unknown as Record<string, unknown>,
    wscBonus,
    dualWield,
    mainWpnName,
  )

  const nhits     = wsInfo.nhits
  const wsc       = wsInfo.wsc
  let   ftp       = wsInfo.ftp
  const ftpRep    = wsInfo.ftpRep
  let   ftpHybrid = wsInfo.ftpHybrid
  const element   = wsInfo.element ?? ''
  const hybrid    = wsInfo.hybrid
  const magical   = wsInfo.magical
  const wsDSTAT   = wsInfo.dSTAT ?? 0

  let critRate = Math.min(wsInfo.critRate, 1.0)

  ftp += ps(player, 'ftp')
  if (hybrid) ftpHybrid += ps(player, 'ftp')
  const ftp2 = ftpRep ? ftp : 1.0

  const qa = Math.min(ps(player, 'QA') / 100, 1.0)
  const ta = Math.min(ps(player, 'TA') / 100, 1.0)
  const da = Math.min(ps(player, 'DA') / 100, 1.0)

  const oaList = [
    ps(player, 'OA3 main') / 100,
    ps(player, 'OA2 main') / 100,
    ps(player, 'OA8 sub') / 100,
    ps(player, 'OA7 sub') / 100,
    ps(player, 'OA6 sub') / 100,
    ps(player, 'OA5 sub') / 100,
    ps(player, 'OA4 sub') / 100,
    ps(player, 'OA3 sub') / 100,
    ps(player, 'OA2 sub') / 100,
  ]

  const fuaList = [0, 0]

  const pdlGear  = ps(player, 'PDL') / 100
  const pdlTrait = ps(player, 'PDL Trait') / 100

  const wsd      = ps(player, 'Weapon Skill Damage') / 100
  const wsTrait  = ps(player, 'Weapon Skill Damage Trait') / 100
  const wsBonus  = getWeaponBonus(player.gearset['main'].Name2, player.gearset['ranged'].Name2, wsName)

  const critDmg = ps(player, 'Crit Damage') / 100
  const stp     = ps(player, 'Store TP') / 100

  const enemyDefense  = wsInfo.enemyDef
  const enemyEvasion  = enemy.Evasion

  const baseDelay = (ps(player, 'Delay1') + ps(player, 'Delay2')) / 2
  const mdelay    = (baseDelay - ps(player, 'Martial Arts')) * (1 - ps(player, 'Dual Wield') / 100)
  const rangedDelay = ps(player, 'Ranged Delay')
  const ammoDelay   = ps(player, 'Ammo Delay')

  let physicalDamage = 0
  let magicalDamage  = 0
  let tpReturn       = 0

  const mainSkillType = (player.gearset['main']['Skill Type'] as string) ?? ''
  const subSkillTypeRaw = (player.gearset['sub']['Skill Type'] as string | undefined)
  const subSkillType = mainSkillType === 'Hand-to-Hand' ? 'Hand-to-Hand' : (subSkillTypeRaw ?? '')

  const magicAccBase = ps(player, 'Magic Accuracy') + ps(player, 'main Magic Accuracy Skill') + (hoverShot ? 100 : 0)
  let   magicAcc     = magicAccBase

  const oneHandedSkills = ['Axe', 'Club', 'Dagger', 'Sword', 'Katana']

  if (wsType === 'melee' && !magical) {

    const mainDmg = (pa(player, 'Footwork') && (wsName === 'Tornado Kick' || wsName === 'Dragon Kick'))
      ? ps(player, 'Kick DMG') : ps(player, 'DMG1')
    const subDmg  = (pa(player, 'Footwork') && (wsName === 'Tornado Kick' || wsName === 'Dragon Kick'))
      ? ps(player, 'Kick DMG') : ps(player, 'DMG2')
    const fstrMain = getFstr(mainDmg, ps(player, 'STR'), es(enemy, 'VIT'))
    const fstrSub  = getFstr(subDmg,  ps(player, 'STR'), es(enemy, 'VIT'))

    const playerAttack1 = wsInfo.playerAttack1
    const playerAttack2_0 = wsInfo.playerAttack2
    const playerAccuracy1 = wsInfo.playerAccuracy1
    const playerAccuracy2 = wsInfo.playerAccuracy2

    const accuracy1 = playerAccuracy1 + ps(player, 'Weapon Skill Accuracy')
    const accuracy2 = playerAccuracy2 + ps(player, 'Weapon Skill Accuracy')

    const hitRateCapMain = (oneHandedSkills.includes(mainSkillType) || mainSkillType === 'Hand-to-Hand') ? 0.99 : 0.95
    const hitRateCapSub  = subSkillType === 'Hand-to-Hand' ? 0.99 : 0.95

    let hitRate11 = getHitRate(accuracy1 + 100, enemyEvasion, hitRateCapMain)
    let hitRate12 = getHitRate(accuracy1,       enemyEvasion, hitRateCapMain)
    let hitRate21 = getHitRate(accuracy2 + 100, enemyEvasion, hitRateCapSub)
    let hitRate22 = getHitRate(accuracy2,       enemyEvasion, hitRateCapSub)

    if (!dualWield) { hitRate21 = 0; hitRate22 = 0 }

    const playerAttack2 = mainSkillType === 'Hand-to-Hand' ? playerAttack1 : playerAttack2_0

    if (!simulation) {

      const strikingFlourish  = pa(player, 'Striking Flourish')
      const ternaryFlourish   = pa(player, 'Ternary Flourish')
      const climacticFlourish = pa(player, 'Climactic Flourish')
      const sneakAttack       = pa(player, 'Sneak Attack')
      const trickAttack       = pa(player, 'Trick Attack')

      let hr11Eff = hitRate11
      let hr21Eff = hitRate21
      if (sneakAttack || trickAttack) { hr11Eff = 1.0; hr21Eff = 1.0 }

      const sneakAtkBonus    = (ps(player, 'DEX') * (1 + ps(player, 'Sneak Attack Bonus') / 100)) * (sneakAttack ? 1 : 0)
      const trickAtkBonus    = (ps(player, 'AGI') * (1 + ps(player, 'Trick Attack Bonus') / 100)) * (trickAttack ? 1 : 0)
      const climacticFlBonus = (0.5 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (climacticFlourish ? 1 : 0)
      const strikingFlBonus  = (1.0 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (strikingFlourish ? 1 : 0)
      const ternaryFlBonus   = (1.0 * ps(player, 'CHR') * (1 + ps(player, 'Flourish CHR%') / 100)) * (ternaryFlourish ? 1 : 0)

      const climacticCritDmg = ps(player, 'Climactic Crit Damage') / 100 * (climacticFlourish ? 1 : 0)
      const strikingCritRate = ps(player, 'Striking Crit Rate') / 100 * (strikingFlourish ? 1 : 0)
      const vajraBonusCritDmg = 0.3 * (player.gearset['main'].Name === 'Vajra' && (sneakAttack || trickAttack) ? 1 : 0)

      let firstMainCritRate = (sneakAttack || trickAttack || climacticFlourish) ? 1.0 : (critRate + strikingCritRate * (critRate > 0 ? 1 : 0))
      firstMainCritRate = Math.min(firstMainCritRate, 1.0)
      const adjustedCritDmg = (critDmg + vajraBonusCritDmg) * (1 + climacticCritDmg)

      const [mainHits, subHits] = getMaRate3(
        player.mainJob, nhits, qa, ta, da,
        oaList, fuaList, dualWield,
        [[hr11Eff, hr21Eff], [hitRate12, hitRate22]],
        0, 0, 0, 0, 0, 0, 0,
        strikingFlourish, ternaryFlourish, false,
      )

      const mainHitPdif   = getAvgPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
      const mainHitDmgAvg = getAvgPhysDamage(mainDmg, fstrMain, wsc, mainHitPdif, ftp2, critRate, critDmg, 0, wsBonus, wsTrait)
      physicalDamage += mainHits * mainHitDmgAvg

      const firstMainPdif  = getAvgPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, firstMainCritRate)
      const firstMainDmg   = getAvgPhysDamage(mainDmg, fstrMain, wsc, firstMainPdif, ftp, firstMainCritRate, adjustedCritDmg, wsd, wsBonus, wsTrait, sneakAtkBonus, trickAtkBonus, climacticFlBonus, strikingFlBonus, ternaryFlBonus)
      physicalDamage += (firstMainDmg * hr11Eff - mainHitDmgAvg * hr11Eff)

      if (strikingFlourish) {
        const sfCritRate = Math.min(critRate + strikingCritRate * (critRate > 0 ? 1 : 0), 1.0)
        const sfPdif     = getAvgPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, sfCritRate)
        const sfDaDmg    = getAvgPhysDamage(mainDmg, fstrMain, wsc, sfPdif, ftp2, sfCritRate, critDmg, 0, wsBonus, wsTrait)
        physicalDamage  += (sfDaDmg - mainHitDmgAvg) * hr11Eff
      }

      const offhandPdif = getAvgPdifMelee(playerAttack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
      const offhandDmg  = getAvgPhysDamage(subDmg, fstrSub, wsc, offhandPdif, ftp2, critRate, critDmg, 0, wsBonus, wsTrait)
      physicalDamage   += offhandDmg * subHits

      tpReturn += getTp(hr11Eff, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
      tpReturn += getTp(hr21Eff, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
      tpReturn += 10 * (1 + stp) * (mainHits + subHits - hr11Eff - hr21Eff)
      tpReturn += baseTp * (0.01 * (player.gearset['neck'].Name === 'Fotia Gorget' ? 1 : 0)) * (0.01 * (player.gearset['waist'].Name === 'Fotia Belt' ? 1 : 0))
      tpReturn += 95 * Math.min(1, ps(player, 'Conserve TP') / 100)

    } else { // simulation WS melee

      // In the simulation, one-hit bonuses (SA/TA/Flourish) are not applied
      const sneakAtkBonus    = 0
      const trickAtkBonus    = 0
      const climacticFlBonus = 0
      const strikingFlBonus  = 0
      const ternaryFlBonus   = 0

      const firstMainCritRate = critRate
      const adjustedCritDmg   = critDmg

      let attemptedHits = 0

      // First main-hand hit
      attemptedHits++
      if (Math.random() < hitRate11) {
        const [pdif, crit] = getPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, firstMainCritRate)
        const phys = getPhysDamage(mainDmg, fstrMain, wsc, pdif, ftp, crit, adjustedCritDmg, wsd, wsBonus, wsTrait, 0, sneakAtkBonus, trickAtkBonus, climacticFlBonus, strikingFlBonus, ternaryFlBonus)
        physicalDamage += phys
        tpReturn += getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
      }

      // First off-hand hit
      if (dualWield) {
        attemptedHits++
        if (Math.random() < hitRate21) {
          const [pdif, crit] = getPdifMelee(playerAttack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
          const phys = getPhysDamage(subDmg, fstrSub, wsc, pdif, ftp2, crit, critDmg, 0, wsBonus, wsTrait, 0)
          physicalDamage += phys
          tpReturn += getTp(1, mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay, stp)
        }
      }

      // nhits-1 additional main-hand hits
      for (let i = 0; i < nhits - 1; i++) {
        if (attemptedHits >= 8) break
        attemptedHits++
        if (Math.random() < hitRate12) {
          const [pdif, crit] = getPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
          const phys = getPhysDamage(mainDmg, fstrMain, wsc, pdif, ftp2, crit, critDmg, 0, wsBonus, wsTrait, 0)
          physicalDamage += phys
          tpReturn += 10 * (1 + stp)
        }
      }

      // Multi-attack checks for main-hand (up to 2 checks for multi-hit non-DW WSs)
      const mainHandMultiChecks = (!dualWield && nhits > 1) ? 2 : 1
      for (let k = 0; k < mainHandMultiChecks; k++) {
        if (attemptedHits >= 8) break

        const doMainMulti = (bonusHits: number) => {
          for (let i = 0; i < bonusHits; i++) {
            if (attemptedHits >= 8) break
            attemptedHits++
            if (Math.random() < hitRate12) {
              const [pdif, crit] = getPdifMelee(playerAttack1, mainSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
              const phys = getPhysDamage(mainDmg, fstrMain, wsc, pdif, ftp2, crit, critDmg, 0, wsBonus, wsTrait, 0)
              physicalDamage += phys
              tpReturn += 10 * (1 + stp)
            }
          }
        }

        if (Math.random() < qa)       { doMainMulti(3) }
        else if (Math.random() < ta)  { doMainMulti(2) }
        else if (Math.random() < da)  { doMainMulti(1) }
        else if (Math.random() < ps(player, 'OA8 main') / 100) { doMainMulti(7) }
        else if (Math.random() < ps(player, 'OA7 main') / 100) { doMainMulti(6) }
        else if (Math.random() < ps(player, 'OA6 main') / 100) { doMainMulti(5) }
        else if (Math.random() < ps(player, 'OA5 main') / 100) { doMainMulti(4) }
        else if (Math.random() < ps(player, 'OA4 main') / 100) { doMainMulti(3) }
        else if (Math.random() < ps(player, 'OA3 main') / 100) { doMainMulti(2) }
        else if (Math.random() < ps(player, 'OA2 main') / 100) { doMainMulti(1) }
      }

      // Off-hand multi-attack
      if (dualWield && attemptedHits < 8) {
        const doSubMulti = (bonusHits: number) => {
          for (let i = 0; i < bonusHits; i++) {
            if (attemptedHits >= 8) break
            attemptedHits++
            if (Math.random() < hitRate22) {
              const [pdif, crit] = getPdifMelee(playerAttack2, subSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
              const phys = getPhysDamage(subDmg, fstrSub, wsc, pdif, ftp2, crit, critDmg, 0, wsBonus, wsTrait, 0)
              physicalDamage += phys
              tpReturn += 10 * (1 + stp)
            }
          }
        }

        if (Math.random() < qa)       { doSubMulti(3) }
        else if (Math.random() < ta)  { doSubMulti(2) }
        else if (Math.random() < da)  { doSubMulti(1) }
        else if (Math.random() < ps(player, 'OA8 sub') / 100) { doSubMulti(7) }
        else if (Math.random() < ps(player, 'OA7 sub') / 100) { doSubMulti(6) }
        else if (Math.random() < ps(player, 'OA6 sub') / 100) { doSubMulti(5) }
        else if (Math.random() < ps(player, 'OA5 sub') / 100) { doSubMulti(4) }
        else if (Math.random() < ps(player, 'OA4 sub') / 100) { doSubMulti(3) }
        else if (Math.random() < ps(player, 'OA3 sub') / 100) { doSubMulti(2) }
        else if (Math.random() < ps(player, 'OA2 sub') / 100) { doSubMulti(1) }
      }

      // Fotia
      const fotiaChance = (player.gearset['neck'].Name === 'Fotia Gorget' ? 0.01 : 0) +
                          (player.gearset['waist'].Name === 'Fotia Belt' ? 0.01 : 0)
      if (Math.random() < fotiaChance) {
        tpReturn += baseTp
      }

      // Conserve TP
      const conserveTpChance = ps(player, 'Conserve TP') / 100
      if (Math.random() < conserveTpChance) {
        tpReturn += Math.trunc(Math.random() * (200 - 10) + 10)
      }
    }

  } else if (wsType === 'ranged' && !magical) {

    const rangedDmg = ps(player, 'Ranged DMG')
    const ammoDmg   = ps(player, 'Ammo DMG')
    const fstrRng   = getFstr2(rangedDmg, ps(player, 'STR'), es(enemy, 'VIT'))

    const playerRangedAcc = wsInfo.playerRangedAccuracy
    const playerRangedAtk = wsInfo.playerRangedAttack

    const sharpshot = pa(player, 'Sharpshot')
    const trueShot  = ps(player, 'True Shot') / 100
    critRate += ps(player, 'Ranged Crit Rate') / 100
    critRate  = Math.min(critRate, 1.0)

    const rangedSkillType = (player.gearset['ranged']['Skill Type'] as string) ?? ''

    const rangedAccuracy = playerRangedAcc + ps(player, 'Weapon Skill Accuracy')
    const hitRateCapRanged = sharpshot ? 0.99 : 0.95
    const hitRateRanged1   = getHitRate(rangedAccuracy + 100, enemyEvasion, hitRateCapRanged)
    const hitRateRanged2   = getHitRate(rangedAccuracy,       enemyEvasion, hitRateCapRanged)

    if (!simulation) {

      const avgPdifRng     = getAvgPdifRanged(playerRangedAtk, rangedSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
      const rangedHitDmg   = getAvgPhysDamage(rangedDmg + ammoDmg, fstrRng, wsc, avgPdifRng, ftp,  critRate, critDmg, wsd, wsBonus, wsTrait) * (1 + (hoverShot ? 1 : 0))
      const rangedHitDmg2  = getAvgPhysDamage(rangedDmg + ammoDmg, fstrRng, wsc, avgPdifRng, ftp2, critRate, critDmg, 0,   wsBonus, wsTrait) * (1 + (hoverShot ? 1 : 0))

      physicalDamage += rangedHitDmg * hitRateRanged1 + rangedHitDmg2 * hitRateRanged2 * (nhits - 1)
      physicalDamage *= (1 + trueShot)

      tpReturn += getTp(hitRateRanged1, rangedDelay + ammoDelay, stp)
      tpReturn += 10 * (1 + stp) * (nhits - 1) * hitRateRanged2

    } else {

      let attemptedHits = 0

      attemptedHits++
      if (Math.random() < hitRateRanged1) {
        const [pdif, crit] = getPdifRanged(playerRangedAtk, rangedSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
        const phys = getPhysDamage(rangedDmg + ammoDmg, fstrRng, wsc, pdif, ftp, crit, critDmg, wsd, wsBonus, wsTrait, 0)
          * (1 + (hoverShot ? 1 : 0)) * (1 + trueShot)
        physicalDamage += phys
        tpReturn += getTp(1, rangedDelay + ammoDelay, stp)
      }

      for (let i = 0; i < nhits - 1; i++) {
        if (attemptedHits >= 8) break
        attemptedHits++
        if (Math.random() < hitRateRanged2) {
          const [pdif, crit] = getPdifRanged(playerRangedAtk, rangedSkillType, pdlTrait, pdlGear, enemyDefense, critRate)
          const phys = getPhysDamage(rangedDmg + ammoDmg, fstrRng, wsc, pdif, ftp2, crit, critDmg, 0, wsBonus, wsTrait, 1)
            * (1 + (hoverShot ? 1 : 0)) * (1 + trueShot)
          physicalDamage += phys
          tpReturn += 10 * (1 + stp)
        }
      }
    }
  }

  let totalDamage = physicalDamage

  // ---- Magical / Hybrid portion ----
  if (hybrid || magical) {
    const magicDmgStat    = ps(player, 'Magic Damage')
    const magicAtk        = ps(player, 'Magic Attack')
    const enemyMagicDef   = es(enemy, 'Magic Defense')
    const enemyMagicEva   = es(enemy, 'Magic Evasion')
    const dstatMacc       = getDstatMacc(ps(player, 'INT'), es(enemy, 'INT'))
    magicAcc += dstatMacc
    const magicHitRate    = enemyMagicEva > 0 ? getMagicHitRate(magicAcc, enemyMagicEva) : 1.0

    const magicCritRate2  = ps(player, 'Magic Crit Rate II') / 100
    const magicCrit2      = simulation ? (Math.random() < magicCritRate2) : false

    let baseMagicalDamage: number

    if (hybrid) {
      baseMagicalDamage = physicalDamage * ftpHybrid + magicDmgStat
    } else {
      // purely magical WS
      const weaponLevel = 119
      baseMagicalDamage = Math.trunc(
        ((152 + Math.trunc((weaponLevel - 99) * 2.45) + wsc) * ftp) *
        (1 + ps(player, 'Elemental WS Damage%') / 100) + wsDSTAT + magicDmgStat
      )

      const magicDelayForTp = (wsType === 'melee')
        ? (mainSkillType === 'Hand-to-Hand' ? mdelay / 2 : mdelay)
        : (rangedDelay + ammoDelay)
      tpReturn = getTp(magicHitRate, magicDelayForTp, stp)
    }

    const resistState = simulation ? getResistState(magicHitRate) : getResistStateAverage(magicHitRate)
    const magicAtkRatio = (100 + magicAtk) / (100 + enemyMagicDef)

    const elemMagicAtkBonus = 1 + (ps(player, `${element.charAt(0).toUpperCase() + element.slice(1)} Elemental Bonus`) / 100 + ps(player, 'Elemental Bonus') / 100)

    let dayweatherBonus = 1.0
    const stormElements: Record<string, string> = {
      'Sandstorm II':'earth','Rainstorm II':'water','Windstorm II':'wind','Firestorm II':'fire',
      'Hailstorm II':'ice','Thunderstorm II':'thunder','Aurorastorm II':'light','Voidstorm II':'dark',
      'Sandstorm':'earth','Rainstorm':'water','Windstorm':'wind','Firestorm':'fire',
      'Hailstorm':'ice','Thunderstorm':'thunder','Aurorastorm':'light','Voidstorm':'dark',
    }
    const activeStorm = player.abilities['Storm spell']
    if (player.gearset['waist'].Name === 'Hachirin-no-Obi' && activeStorm && activeStorm !== 'None') {
      if (element.toLowerCase() === stormElements[activeStorm as string]) {
        dayweatherBonus = (activeStorm as string).includes('II') ? 1.25 : 1.1
      }
    }

    const klimaformBonus = 1.0 + (pa(player, 'Klimaform') ? ps(player, 'Klimaform Damage%') / 100 : 0)

    const enemyMdt = es(enemy, 'Magic Damage Taken')

    const affinity = 1 + 0.05 * ps(player, `${element} Affinity`) + 0.05 * (ps(player, `${element} Affinity`) > 0 ? 1 : 0)

    const trueShot = ps(player, 'True Shot') / 100
    const magicCritMult = simulation ? (1 + 0.25 * (magicCrit2 ? 1 : 0)) : (1 + 0.25 * magicCritRate2)

    const magicMultiplier = resistState * magicAtkRatio * elemMagicAtkBonus * dayweatherBonus * klimaformBonus * (1 - enemyMdt / 100) * affinity * magicCritMult

    magicalDamage = baseMagicalDamage * magicMultiplier
    magicalDamage *= (1 + wsd) * (1 + wsBonus) * (1 + wsTrait) * (1 + (hoverShot ? 1 : 0)) * (1 + trueShot * (hybrid ? 1 : 0) * (wsType === 'ranged' ? 1 : 0))

    totalDamage += magicalDamage
  }

  // Cap at 99999 if setting enabled
  if (simulation && pa(player, '99999')) {
    totalDamage = Math.min(totalDamage, 99999)
  }

  if (simulation) {
    return { damage: totalDamage, tpAfter: tpReturn }
  }

  return { damage: totalDamage, tpAfter: tpReturn }
}

// ---------------------------------------------------------------------------
// runSimulation — 2-hour simulation loop
// ---------------------------------------------------------------------------

export function runSimulation(
  playerTp: Player,
  playerWs: Player,
  enemy: EnemyStats,
  wsThreshold: number,
  wsName: string,
  wsType: string,
  onProgress?: (pct: number) => void,
): SimulationResults {

  const dualWield =
    ((playerTp.gearset['sub'].Type === 'Weapon') || (playerTp.gearset['main']['Skill Type'] === 'Hand-to-Hand')) &&
    ((playerWs.gearset['sub'].Type === 'Weapon') || (playerWs.gearset['main']['Skill Type'] === 'Hand-to-Hand'))

  const timePerAttackRound = getDelayTiming(
    ps(playerTp, 'Delay1'),
    dualWield && playerWs.gearset['main']['Skill Type'] !== 'Hand-to-Hand' ? ps(playerTp, 'Delay2') : 0,
    ps(playerTp, 'Dual Wield') / 100,
    ps(playerTp, 'Martial Arts'),
    ps(playerTp, 'Magic Haste'),
    ps(playerTp, 'JA Haste'),
    ps(playerTp, 'Gear Haste'),
  )

  const regainTp = ps(playerTp, 'Dual Wield') * (playerTp.gearset['main'].Name === 'Gokotai' ? 1 : 0) + ps(playerTp, 'Regain')
  const regainWs = ps(playerWs, 'Dual Wield') * (playerWs.gearset['main'].Name === 'Gokotai' ? 1 : 0) + ps(playerWs, 'Regain')

  let time   = 0
  let tp     = 0
  let damage = 0

  let tpDamage = 0
  let wsDamage = 0

  const totalTime = 2 * 3600 // seconds

  const avgTpDmgList: number[]  = []
  const avgWsDmgList: number[]  = []
  const avgWsTpList: number[]   = []

  const damageList:    number[] = []
  const timeList:      number[] = []
  const physDmgList:   number[] = []
  const magicDmgList:  number[] = []
  const tpDamageList:  number[] = []
  const tpTimeList:    number[] = []
  const wsDamageList:  number[] = []
  const wsTimeList:    number[] = []

  let iter = 0

  while (time < totalTime) {

    while (tp < wsThreshold) {
      const tpRound = averageAttackRound(playerTp, enemy, tp, wsThreshold, true)
      const physDmg  = tpRound.physicalDamage
      const tpReturn = tpRound.tpReturn
      const magicDmg = tpRound.magicalDamage

      damage   += physDmg + magicDmg
      tpDamage += physDmg + magicDmg
      tp       += tpReturn

      const regainBonus = Math.round((timePerAttackRound / 3) * regainTp * 10) / 10
      tp   += regainBonus
      time += timePerAttackRound

      avgTpDmgList.push(physDmg + magicDmg)
      physDmgList.push(physDmg)
      magicDmgList.push(magicDmg)
      damageList.push(damage)
      timeList.push(time)
      tpDamageList.push(tpDamage)
      tpTimeList.push(time)

      iter++
      if (onProgress && iter % 100 === 0) {
        onProgress((time / totalTime) * 100)
      }
    }

    const wsSim = averageWs(playerWs, enemy, wsName, tp, wsType, true)
    avgWsTpList.push(tp)

    damage   += wsSim.damage
    wsDamage += wsSim.damage
    tp        = wsSim.tpAfter
    time     += 2.0 // forced 2s delay after WS

    const regainWsBonus = Math.round((2.0 / 3) * regainWs * 10) / 10
    tp += regainWsBonus

    avgWsDmgList.push(wsSim.damage)
    damageList.push(damage)
    timeList.push(time)
    wsDamageList.push(wsDamage)
    wsTimeList.push(time)
  }

  const avgTp    = avgTpDmgList.length > 0 ? avgTpDmgList.reduce((a, b) => a + b, 0) / avgTpDmgList.length : 0
  const avgWs    = avgWsDmgList.length > 0 ? avgWsDmgList.reduce((a, b) => a + b, 0) / avgWsDmgList.length : 0
  const avgWsTp0 = avgWsTpList.length  > 0 ? avgWsTpList.reduce((a, b) => a + b, 0)  / avgWsTpList.length  : 0

  return {
    totalDamage: damage,
    tpDamage,
    wsDamage,
    timeSeconds: time,
    avgTpDmg: avgTp,
    avgWsDmg: avgWs,
    avgWsTp: avgWsTp0,
    tpDps:    time > 0 ? tpDamage / time : 0,
    wsDps:    time > 0 ? wsDamage / time : 0,
    totalDps: time > 0 ? damage   / time : 0,
    timeList,
    damageList,
    tpDamageList,
    wsDamageList,
    tpTimeList,
    wsTimeList,
    physDmgList,
    magicDmgList,
  }
}
