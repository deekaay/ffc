/**
 * Weapon skill properties: TP scaling, hit count, FTP replication, WSC, etc.
 * Port of weaponskill_info.py
 *
 * Author of original: Kastra (Asura server)
 */
import { interp3 } from '@/calc/interp'
import { getDexCrit } from '@/calc/getDexCrit'
import type { WeaponSkillResult } from '@/types/weaponskill'

export function getWeaponskillInfo(
  wsName: string,
  tp: number,
  playerStats: Record<string, unknown>,
  enemyStats: Record<string, unknown>,
  wscBonus: Array<[string, number]>,
  _dualWield: boolean,
  mainWpnName: string,
): WeaponSkillResult {
  const ps = (k: string) => (playerStats[k] as number) ?? 0
  const es = (k: string) => (enemyStats[k] as number) ?? 0

  let pAtk1 = ps('Attack1')
  let pAtk2 = ps('Attack2')
  let pAcc1 = ps('Accuracy1')
  let pAcc2 = ps('Accuracy2')
  let pRangedAcc = ps('Ranged Accuracy')
  let pRangedAtk = ps('Ranged Attack')
  const eDef0 = es('Base Defense')
  let eDef = es('Defense')

  const base_tp: [number, number, number] = [1000, 2000, 3000]

  let critRate = 0
  let critWs = false
  let hybrid = false
  let magical = false
  let dSTAT = 0
  let element: string | null = null
  let ftpHybrid = 0

  let ftp = 0
  let ftpRep = false
  let wsc = 0
  let nhits = 0
  let skillchains: string[] = []

  // Naegling: +13% attack (protect, shell, haste, songx4, rollx2, signet)
  if (mainWpnName === 'Naegling') {
    const ws_atk_modifier = 0.13
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
  } else if (mainWpnName === 'Nandaka') {
    // Nandaka lowers enemy defense by ~3% (dia, slow, paralyze)
    eDef -= 0.03 * eDef0
  }

  // ─── Sword ───────────────────────────────────────────────────────────────────
  if (wsName === 'Fast Blade') {
    const base_ftp: [number, number, number] = [1.0, 1.5, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('DEX'))
    nhits = 2
    skillchains = ['Scission']
  } else if (wsName === 'Burning Blade') {
    const base_ftp: [number, number, number] = [1.0, 2.09765625, 3.3984375]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Fire'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Liquefaction']
  } else if (wsName === 'Red Lotus Blade') {
    const base_ftp: [number, number, number] = [1.0, 2.3828125, 3.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Fire'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Liquefaction', 'Detonation']
  } else if (wsName === 'Shining Blade') {
    const base_ftp: [number, number, number] = [1.125, 2.22265625, 3.5234375]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = 0
    skillchains = ['Scission']
  } else if (wsName === 'Seraph Blade') {
    const base_ftp: [number, number, number] = [1.125, 2.625, 4.125]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = 0
    skillchains = ['Scission']
  } else if (wsName === 'Circle Blade') {
    ftp = 1.0
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Reverberation', 'Impaction']
  } else if (wsName === 'Swift Blade') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.5
    ftpRep = true
    wsc = 0.5 * (ps('STR') + ps('MND'))
    nhits = 3
    skillchains = ['Gravitation']
  } else if (wsName === 'Savage Blade') {
    const base_ftp: [number, number, number] = [4.0, 10.25, 13.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('STR') + ps('MND'))
    nhits = 2
    skillchains = ['Fragmentation', 'Scission']
  } else if (wsName === 'Sanguine Blade') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.5 * ps('MND') + 0.3 * ps('STR')
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) * 2
    skillchains = ['None']
  } else if (wsName === 'Requiescat') {
    const atk_boost: [number, number, number] = [-0.2, -0.1, 0.0]
    const ws_atk_modifier = interp3(tp, base_tp, atk_boost)
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    ftp = 1.0
    ftpRep = true
    wsc = 0.85 * ps('MND')
    nhits = 5
    skillchains = ['Aeonic', 'Gravitation', 'Scission']
  } else if (wsName === 'Knights of Round') {
    ftp = 5.0
    ftpRep = false
    wsc = 0.4 * (ps('MND') + ps('STR'))
    nhits = 1
    skillchains = ['Light', 'Fusion']
  } else if (wsName === 'Chant du Cygne') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.15, 0.25, 0.4]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.6328125
    ftpRep = true
    wsc = 0.8 * ps('DEX')
    nhits = 3
    skillchains = ['Light', 'Distortion']
  } else if (wsName === 'Death Blossom') {
    ftp = 4.0
    ftpRep = false
    wsc = 0.5 * ps('MND') + 0.3 * ps('STR')
    nhits = 3
    skillchains = ['Fragmentation', 'Distortion']
  } else if (wsName === 'Expiacion') {
    const base_ftp: [number, number, number] = [3.796875, 9.390625, 12.1875]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('INT')) + 0.2 * ps('DEX')
    nhits = 2
    skillchains = ['Distortion', 'Scission']
  } else if (wsName === 'Fast Blade II') {
    const base_ftp: [number, number, number] = [1.8, 3.5, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.8 * ps('DEX')
    nhits = 2
    skillchains = ['Fusion']
  } else if (wsName === 'Imperator') {
    const base_ftp: [number, number, number] = [3.75, 7.5, 11.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.7 * (ps('DEX') + ps('MND'))
    nhits = 1
    skillchains = ['Detonation', 'Compression', 'Distortion']

  // ─── Katana ──────────────────────────────────────────────────────────────────
  } else if (wsName === 'Blade: Retsu') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * ps('DEX') + 0.2 * ps('STR')
    nhits = 2
    skillchains = ['Scission']
  } else if (wsName === 'Blade: Teki') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.375, 2.25]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('INT'))
    nhits = 1
    element = 'Water'
    skillchains = ['Reverberation']
  } else if (wsName === 'Blade: To') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.5, 2.5]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    element = 'Ice'
    skillchains = ['Induration', 'Detonation']
  } else if (wsName === 'Blade: Chi') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.375, 2.25]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('INT'))
    nhits = 2
    element = 'Earth'
    skillchains = ['Impaction', 'Transfixion']
  } else if (wsName === 'Blade: Ei') {
    const base_ftp: [number, number, number] = [1.0, 3.0, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Compression']
  } else if (wsName === 'Blade: Jin') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.25, 0.5]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.375
    ftpRep = true
    wsc = 0.3 * (ps('DEX') + ps('STR'))
    nhits = 3
    skillchains = ['Detonation', 'Impaction']
  } else if (wsName === 'Blade: Ten') {
    const base_ftp: [number, number, number] = [4.5, 11.5, 15.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('DEX'))
    nhits = 1
    skillchains = ['Gravitation']
  } else if (wsName === 'Blade: Ku') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.25
    ftpRep = true
    wsc = 0.3 * (ps('STR') + ps('DEX'))
    nhits = 5
    skillchains = ['Gravitation', 'Transfixion']
  } else if (wsName === 'Blade: Yu') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.4 * (ps('DEX') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Water'
    dSTAT = 0
    skillchains = ['Reverberation', 'Scission']
  } else if (wsName === 'Blade: Kamu') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * (ps('INT') + ps('STR'))
    nhits = 1
    const ws_atk_modifier = 1.25
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    eDef -= 0.25 * eDef0
    skillchains = ['Fragmentation', 'Compression']
  } else if (wsName === 'Blade: Shun') {
    const atk_boost: [number, number, number] = [1.0, 2.0, 3.0]
    const ws_atk_modifier = interp3(tp, base_tp, atk_boost) - 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    ftp = 1.0
    ftpRep = true
    wsc = 0.85 * ps('DEX')
    nhits = 5
    skillchains = ['Aeonic', 'Fusion', 'Impaction']
  } else if (wsName === 'Blade: Metsu') {
    ftp = 5.0
    ftpRep = false
    wsc = 0.8 * ps('DEX')
    nhits = 1
    skillchains = ['Darkness', 'Fragmentation']
  } else if (wsName === 'Blade: Hi') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.15, 0.2, 0.25]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 5.0
    ftpRep = false
    wsc = 0.8 * ps('AGI')
    nhits = 1
    skillchains = []
  } else if (wsName === 'Zesho Meppo') {
    const base_ftp: [number, number, number] = [4.0, 10.0, 18.715]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.25 * (ps('DEX') + ps('AGI'))
    nhits = 4
    skillchains = ['Induration', 'Reverberation', 'Fusion']

  // ─── Dagger ───────────────────────────────────────────────────────────────────
  } else if (wsName === 'Viper Bite') {
    ftp = 1.0
    ftpRep = false
    const ws_atk_modifier = 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    wsc = 1.0 * ps('DEX')
    nhits = 2
    skillchains = ['Scission']
  } else if (wsName === 'Dancing Edge') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.1875
    ftpRep = false
    wsc = 0.4 * (ps('CHR') + ps('DEX'))
    nhits = 5
    skillchains = ['Scission', 'Detonation']
  } else if (wsName === 'Shark Bite') {
    const base_ftp: [number, number, number] = [4.5, 6.8, 8.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('AGI') + ps('DEX'))
    nhits = 2
    skillchains = ['Fragmentation']
  } else if (wsName === 'Evisceration') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.25, 0.5]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.25
    ftpRep = true
    wsc = 0.5 * ps('DEX')
    nhits = 5
    skillchains = ['Gravitation', 'Transfixion']
  } else if (wsName === 'Aeolian Edge') {
    const base_ftp: [number, number, number] = [2.0, 3.0, 4.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('DEX') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Wind'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Scission', 'Detonation', 'Impaction']
  } else if (wsName === 'Exenterator') {
    ftp = 1.0
    ftpRep = true
    wsc = 0.85 * ps('AGI')
    nhits = 4
    skillchains = ['Aeonic', 'Gravitation', 'Transfixion']
  } else if (wsName === 'Mercy Stroke') {
    ftp = 5.0
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 1
    skillchains = ['Darkness', 'Gravitation']
  } else if (wsName === "Rudra's Storm") {
    const base_ftp: [number, number, number] = [5.0, 10.19, 13.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.8 * ps('DEX')
    nhits = 1
    skillchains = ['Darkness', 'Distortion']
  } else if (wsName === 'Mandalic Stab') {
    const base_ftp: [number, number, number] = [4.0, 6.09, 8.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.75
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    wsc = 0.6 * ps('DEX')
    nhits = 1
    skillchains = ['Fusion', 'Compression']
  } else if (wsName === 'Mordant Rime') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 5.0
    ftpRep = false
    wsc = 0.7 * ps('CHR') + 0.3 * ps('DEX')
    nhits = 2
    skillchains = ['Fragmentation', 'Distortion']
  } else if (wsName === 'Pyrrhic Kleos') {
    ftp = 1.75
    ftpRep = true
    wsc = 0.4 * (ps('STR') + ps('DEX'))
    nhits = 4
    skillchains = ['Distortion', 'Scission']
  } else if (wsName === 'Ruthless Stroke') {
    const base_ftp: [number, number, number] = [5.375, 14.0, 23.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.25 * (ps('DEX') + ps('AGI'))
    nhits = 4
    skillchains = ['Liquefaction', 'Impaction', 'Fragmentation']

  // ─── Polearm ──────────────────────────────────────────────────────────────────
  } else if (wsName === 'Double Thrust') {
    const base_ftp: [number, number, number] = [1.0, 1.5, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('DEX'))
    nhits = 2
    skillchains = ['Transfixion']
  } else if (wsName === 'Thunder Thrust') {
    const base_ftp: [number, number, number] = [1.5, 2.0, 2.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Thunder'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Transfixion', 'Impaction']
  } else if (wsName === 'Raiden Thrust') {
    const base_ftp: [number, number, number] = [1.0, 2.0, 3.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Thunder'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Transfixion', 'Impaction']
  } else if (wsName === 'Penta Thrust') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    pAcc1 += interp3(tp, base_tp, acc_boost)
    ftp = 1.0
    ftpRep = false
    wsc = 0.2 * (ps('STR') + ps('DEX'))
    nhits = 5
    const ws_atk_modifier = -0.125
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    skillchains = ['Compression']
  } else if (wsName === 'Wheeling Thrust') {
    ftp = 1.75
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.5, 0.625, 0.75]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Scission']
  } else if (wsName === 'Impulse Drive') {
    const base_ftp: [number, number, number] = [1.0, 3.0, 5.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 2
    skillchains = ['Gravitation', 'Induration']
  } else if (wsName === 'Sonic Thrust') {
    const base_ftp: [number, number, number] = [3.0, 3.7, 4.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('DEX') + ps('STR'))
    nhits = 1
    skillchains = ['Transfixion', 'Scission']
  } else if (wsName === 'Stardiver') {
    const base_ftp: [number, number, number] = [0.75, 1.25, 1.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.85 * ps('STR')
    nhits = 4
    skillchains = ['Aeonic', 'Gravitation', 'Transfixion']
  } else if (wsName === 'Geirskogul') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.8 * ps('DEX')
    nhits = 1
    skillchains = ['Light', 'Distortion']
  } else if (wsName === "Camlann's Torment") {
    ftp = 3.0
    ftpRep = false
    wsc = 0.6 * (ps('VIT') + ps('STR'))
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.125, 0.375, 0.625]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === 'Drakesbane') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.25, 0.4]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 4
    const ws_atk_modifier = 0.8125 - 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    skillchains = ['Fusion', 'Transfixion']
  } else if (wsName === 'Diarmuid') {
    const base_ftp: [number, number, number] = [2.17, 5.36, 8.55]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.55 * (ps('STR') + ps('VIT'))
    nhits = 2
    skillchains = ['Transfixion', 'Scission', 'Gravitation']

  // ─── Great Katana ─────────────────────────────────────────────────────────────
  } else if (wsName === 'Tachi: Enpi') {
    const base_ftp: [number, number, number] = [1.0, 1.5, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 2
    skillchains = ['Transfixion', 'Scission']
  } else if (wsName === 'Tachi: Goten') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.5, 2.5]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 1
    element = 'Thunder'
    skillchains = ['Transfixion', 'Impaction']
  } else if (wsName === 'Tachi: Kagero') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.5, 2.5]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.75 * ps('STR')
    nhits = 1
    element = 'Fire'
    skillchains = ['Liquefaction']
  } else if (wsName === 'Tachi: Koki') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.5, 2.5]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.3 * ps('MND') + 0.5 * ps('STR')
    nhits = 1
    element = 'Light'
    skillchains = ['Reverberation', 'Impaction']
  } else if (wsName === 'Tachi: Jinpu') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.5, 2.5]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.3 * ps('STR')
    nhits = 2
    element = 'Wind'
    skillchains = ['Scission', 'Detonation']
  } else if (wsName === 'Tachi: Yukikaze') {
    const base_ftp: [number, number, number] = [1.5625, 2.6875, 4.125]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.75 * ps('STR')
    nhits = 1
    skillchains = ['Induration', 'Detonation']
  } else if (wsName === 'Tachi: Gekko') {
    const base_ftp: [number, number, number] = [1.5625, 2.6875, 4.125]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.75 * ps('STR')
    nhits = 1
    skillchains = ['Distortion', 'Reverberation']
  } else if (wsName === 'Tachi: Kasha') {
    const base_ftp: [number, number, number] = [1.5625, 2.6875, 4.125]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.65
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.75 * ps('STR')
    nhits = 1
    skillchains = ['Fusion', 'Compression']
  } else if (wsName === 'Tachi: Ageha') {
    ftp = 2.625
    ftpRep = false
    wsc = 0.6 * ps('CHR') + 0.4 * ps('STR')
    nhits = 1
    skillchains = ['Compression', 'Scission']
  } else if (wsName === 'Tachi: Shoha') {
    const base_ftp: [number, number, number] = [1.375, 2.1875, 2.6875]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 1.375
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.85 * ps('STR')
    nhits = 2
    skillchains = ['Aeonic', 'Fragmentation', 'Compression']
  } else if (wsName === 'Tachi: Kaiten') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 1
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === 'Tachi: Fudo') {
    const base_ftp: [number, number, number] = [3.75, 5.75, 8.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 1
    skillchains = ['Light', 'Distortion']
  } else if (wsName === 'Tachi: Rana') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    pAcc1 += interp3(tp, base_tp, acc_boost)
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 3
    skillchains = ['Gravitation', 'Induration']
  } else if (wsName === 'Tachi: Mumei') {
    const base_ftp: [number, number, number] = [3.66, 7.33, 11.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('STR') + ps('DEX'))
    nhits = 1
    skillchains = ['Detonation', 'Compression', 'Distortion']

  // ─── Scythe ───────────────────────────────────────────────────────────────────
  } else if (wsName === 'Slice') {
    const base_ftp: [number, number, number] = [1.5, 1.75, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Scission']
  } else if (wsName === 'Dark Harvest') {
    const base_ftp: [number, number, number] = [1.0, 2.0, 2.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Reverberation']
  } else if (wsName === 'Shadow of Death') {
    const base_ftp: [number, number, number] = [1.0, 4.17, 8.6]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Induration', 'Reverberation']
  } else if (wsName === 'Nightmare Scythe') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('MND'))
    nhits = 1
    skillchains = ['Compression', 'Scission']
  } else if (wsName === 'Spinning Scythe') {
    ftp = 1.0
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Reverberation', 'Scission']
  } else if (wsName === 'Cross Reaper') {
    const base_ftp: [number, number, number] = [2.0, 4.0, 7.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('MND'))
    nhits = 2
    skillchains = ['Distortion']
  } else if (wsName === 'Guillotine') {
    ftp = 0.875
    ftpRep = false
    wsc = 0.3 * ps('STR') + 0.5 * ps('MND')
    nhits = 4
    skillchains = ['Induration']
  } else if (wsName === 'Spiral Hell') {
    const base_ftp: [number, number, number] = [1.375, 2.75, 4.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('STR') + ps('INT'))
    nhits = 1
    skillchains = ['Distortion', 'Scission']
  } else if (wsName === 'Infernal Scythe') {
    ftp = 3.5
    ftpRep = false
    wsc = 0.7 * ps('INT') + 0.3 * ps('STR')
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = 0
    skillchains = ['Compression', 'Reverberation']
  } else if (wsName === 'Entropy') {
    const base_ftp: [number, number, number] = [0.75, 1.25, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.85 * ps('INT')
    nhits = 4
    skillchains = ['Aeonic', 'Gravitation', 'Reverberation']
  } else if (wsName === 'Catastrophe') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    skillchains = ['Darkness', 'Gravitation']
  } else if (wsName === 'Quietus') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.6 * (ps('MND') + ps('STR'))
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.1, 0.3, 0.5]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Darkness', 'Distortion']
  } else if (wsName === 'Insurgency') {
    const base_ftp: [number, number, number] = [0.5, 3.25, 6.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.2 * (ps('STR') + ps('INT'))
    nhits = 4
    skillchains = ['Fusion', 'Compression']
  } else if (wsName === 'Origin') {
    const base_ftp: [number, number, number] = [3.0, 6.25, 9.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * (ps('INT') + ps('STR'))
    nhits = 1
    skillchains = ['Induration', 'Reverberation', 'Fusion']

  // ─── Great Sword ──────────────────────────────────────────────────────────────
  } else if (wsName === 'Hard Slash') {
    const base_ftp: [number, number, number] = [1.5, 1.75, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('AGI'))
    nhits = 2
    skillchains = ['Scission']
  } else if (wsName === 'Freezebite') {
    const base_ftp: [number, number, number] = [1.5, 3.5, 6.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Ice'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Induration', 'Detonation']
  } else if (wsName === 'Shockwave') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('MND'))
    nhits = 1
    skillchains = ['Reverberation']
  } else if (wsName === 'Sickle Moon') {
    const base_ftp: [number, number, number] = [1.5, 2.0, 2.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('AGI'))
    nhits = 1
    skillchains = ['Scission', 'Impaction']
  } else if (wsName === 'Spinning Slash') {
    const base_ftp: [number, number, number] = [2.5, 3.0, 3.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.3 * (ps('STR') + ps('INT'))
    nhits = 1
    skillchains = ['Fragmentation']
  } else if (wsName === 'Ground Strike') {
    const base_ftp: [number, number, number] = [1.5, 1.75, 3.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('INT') + ps('STR'))
    nhits = 1
    const ws_atk_modifier = 0.75
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    skillchains = ['Fragmentation', 'Distortion']
  } else if (wsName === 'Herculean Slash') {
    ftp = 3.5
    ftpRep = false
    wsc = 0.8 * ps('VIT')
    nhits = 1
    magical = true
    element = 'Ice'
    dSTAT = 0
    skillchains = ['Induration', 'Impaction', 'Detonation']
  } else if (wsName === 'Resolution') {
    const base_ftp: [number, number, number] = [0.71875, 1.5, 2.25]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.85 * ps('STR')
    nhits = 5
    const ws_atk_modifier = -0.15
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    skillchains = ['Aeonic', 'Light', 'Fragmentation', 'Scission']
  } else if (wsName === 'Scourge') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Light', 'Fusion']
  } else if (wsName === 'Torcleaver') {
    const base_ftp: [number, number, number] = [4.75, 7.5, 9.765625]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.8 * ps('VIT')
    nhits = 1
    skillchains = ['Light', 'Distortion']
  } else if (wsName === 'Dimidiation') {
    const base_ftp: [number, number, number] = [2.25, 4.5, 6.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.25
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.8 * ps('DEX')
    nhits = 2
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === 'Fimbulvetr') {
    const base_ftp: [number, number, number] = [3.3, 6.6, 9.9]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Detonation', 'Compression', 'Distortion']

  // ─── Club ─────────────────────────────────────────────────────────────────────
  } else if (wsName === 'Shining Strike') {
    const base_ftp: [number, number, number] = [1.625, 3.0, 4.625]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = 0
    skillchains = ['Impaction']
  } else if (wsName === 'Seraph Strike') {
    const base_ftp: [number, number, number] = [2.125, 3.675, 6.125]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = 0
    skillchains = ['Impaction']
  } else if (wsName === 'Skullbreaker') {
    ftp = 1.0
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Induration', 'Reverberation']
  } else if (wsName === 'True Strike') {
    critWs = true
    critRate = 1.0
    const acc_boost: [number, number, number] = [-60, -30, 0]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.0
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    const ws_atk_modifier = 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    skillchains = ['Detonation', 'Impaction']
  } else if (wsName === 'Judgment') {
    const base_ftp: [number, number, number] = [3.5, 8.75, 12.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('MND') + ps('STR'))
    nhits = 1
    skillchains = ['Impaction']
  } else if (wsName === 'Hexa Strike') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.175, 0.25]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.125
    ftpRep = true
    wsc = 0.3 * (ps('MND') + ps('STR'))
    nhits = 6
    skillchains = ['Fusion']
  } else if (wsName === 'Black Halo') {
    const base_ftp: [number, number, number] = [3.0, 7.25, 9.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.7 * ps('MND') + 0.3 * ps('STR')
    nhits = 2
    skillchains = ['Fragmentation', 'Compression']
  } else if (wsName === 'Realmrazer') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 0.9
    ftpRep = true
    wsc = 0.85 * ps('MND')
    nhits = 7
    skillchains = ['Aeonic', 'Fusion', 'Impaction']
  } else if (wsName === 'Randgrith') {
    ftp = 4.25
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === 'Mystic Boon') {
    const base_ftp: [number, number, number] = [2.5, 4.0, 7.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.7 * ps('MND') + 0.3 * ps('STR')
    nhits = 1
    skillchains = ['None']
  } else if (wsName === 'Exudation') {
    const atk_boost: [number, number, number] = [1.5, 3.625, 4.75]
    const ws_atk_modifier = interp3(tp, base_tp, atk_boost) - 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    ftp = 2.8
    ftpRep = false
    wsc = 0.5 * (ps('MND') + ps('INT'))
    nhits = 1
    skillchains = ['Darkness', 'Fragmentation']
  } else if (wsName === 'Dagda') {
    const base_ftp: [number, number, number] = [1, 2, 3]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.0 * ps('DEX')
    nhits = 2
    skillchains = ['Transfixion', 'Scission', 'Gravitation']

  // ─── Great Axe ───────────────────────────────────────────────────────────────
  } else if (wsName === 'Shield Break') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Impaction']
  } else if (wsName === 'Iron Tempest') {
    const atk_boost: [number, number, number] = [1.0, 1.2, 1.5]
    const ws_atk_modifier = interp3(tp, base_tp, atk_boost) - 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 1
    skillchains = ['Scission']
  } else if (wsName === 'Armor Break') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Impaction']
  } else if (wsName === 'Weapon Break') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Impaction']
  } else if (wsName === 'Raging Rush') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.15, 0.3, 0.5]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 3
    skillchains = ['Induration', 'Reverberation']
  } else if (wsName === 'Full Break') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Distortion']
  } else if (wsName === 'Steel Cyclone') {
    const base_ftp: [number, number, number] = [1.5, 2.5, 4.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Distortion', 'Detonation']
  } else if (wsName === 'Fell Cleave') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 1
    skillchains = ['Impaction', 'Scission', 'detonation']
  } else if (wsName === 'Upheaval') {
    const base_ftp: [number, number, number] = [1.0, 3.5, 6.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.85 * ps('VIT')
    nhits = 4
    skillchains = ['Aeonic', 'Fusion', 'Compression']
  } else if (wsName === 'Metatron Torment') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 1
    skillchains = ['Light', 'Fusion']
  } else if (wsName === "Ukko's Fury") {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.2, 0.35, 0.55]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 2.0
    ftpRep = false
    wsc = 0.8 * ps('STR')
    nhits = 2
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === "King's Justice") {
    const base_ftp: [number, number, number] = [1.0, 3.0, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 3
    skillchains = ['Fragmentation', 'Scission']
  } else if (wsName === 'Disaster') {
    const base_ftp: [number, number, number] = [3.05, 6.1, 9.15]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Transfixion', 'Scission', 'Gravitation']

  // ─── Axe ──────────────────────────────────────────────────────────────────────
  } else if (wsName === 'Raging Axe') {
    const base_ftp: [number, number, number] = [1.0, 1.5, 2.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 2
    skillchains = ['Detonation', 'Impaction']
  } else if (wsName === 'Spinning Axe') {
    const base_ftp: [number, number, number] = [2.0, 2.5, 3.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 2
    skillchains = ['Liquefaction', 'Scission', 'Impaction']
  } else if (wsName === 'Rampage') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.0, 0.2, 0.4]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.0
    ftpRep = true
    wsc = 0.5 * ps('STR')
    nhits = 5
    skillchains = ['Scission']
  } else if (wsName === 'Calamity') {
    const base_ftp: [number, number, number] = [2.5, 6.5, 10.375]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * (ps('STR') + ps('VIT'))
    nhits = 1
    skillchains = ['Scission', 'Impaction']
  } else if (wsName === 'Mistral Axe') {
    const base_ftp: [number, number, number] = [4.0, 10.5, 13.625]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 1
    skillchains = ['Fusion']
  } else if (wsName === 'Decimation') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.75
    ftpRep = true
    wsc = 0.5 * ps('STR')
    nhits = 3
    skillchains = ['Fusion', 'Reverberation']
  } else if (wsName === 'Bora Axe') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 4.5
    ftpRep = false
    wsc = 1.0 * ps('DEX')
    nhits = 1
    skillchains = ['Scission', 'Detonation']
  } else if (wsName === 'Ruinator') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    const ws_atk_modifier = 0.1
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    if (pAtk2 > 0) {
      pAtk2 -= ps('Food Attack')
      pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
      pAtk2 += ps('Food Attack')
    }
    ftp = 1.0
    ftpRep = true
    wsc = 0.85 * ps('STR')
    nhits = 4
    skillchains = ['Aeonic', 'Distortion', 'Detonation']
  } else if (wsName === 'Onslaught') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.8 * ps('DEX')
    nhits = 1
    skillchains = ['Darkness', 'Gravitation']
  } else if (wsName === 'Cloudsplitter') {
    const base_ftp: [number, number, number] = [3.75, 6.69921875, 8.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Thunder'
    dSTAT = 0
    skillchains = ['Darkness', 'Fragmentation']
  } else if (wsName === 'Primal Rend') {
    const base_ftp: [number, number, number] = [3.0625, 5.8359375, 7.5625]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * ps('CHR') + 0.3 * ps('DEX')
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = (ps('CHR') - es('INT')) * 1.5 > 651 ? 651 : (ps('CHR') - es('INT')) * 1.5
    skillchains = ['Gravitation', 'Reverberation']
  } else if (wsName === 'Blitz') {
    const base_ftp: [number, number, number] = [1.5, 7.0, 12.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.32 * (ps('DEX') + ps('STR'))
    nhits = 5
    skillchains = ['Liquefaction', 'Impaction', 'Fragmentation']

  // ─── Archery ──────────────────────────────────────────────────────────────────
  } else if (wsName === 'Flaming Arrow') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.55, 2.1]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    element = 'Fire'
    skillchains = ['Liquefaction', 'Transfixion']
  } else if (wsName === 'Piercing Arrow') {
    ftp = 1.0
    ftpRep = true
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.0, 0.35, 0.5]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Reverberation', 'Transfixion']
  } else if (wsName === 'Dulling Arrow') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.2, 0.25]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += ((ps('AGI') - es('AGI')) / 10) / 100
    ftp = 1.0
    ftpRep = false
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    skillchains = ['Liquefaction', 'Transfixion']
  } else if (wsName === 'Sidewinder') {
    const acc_boost: [number, number, number] = [-50, -20, 0]
    pRangedAcc += interp3(tp, base_tp, acc_boost)
    ftp = 5.0
    ftpRep = false
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    skillchains = ['Reverberation', 'Transfixion', 'Detonation']
  } else if (wsName === 'Blast Arrow') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    pRangedAcc += interp3(tp, base_tp, acc_boost)
    ftp = 2.0
    ftpRep = false
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    skillchains = ['Induration', 'Transfixion']
  } else if (wsName === 'Empyreal Arrow') {
    const ws_atk_modifier = 1.0
    pRangedAtk -= ps('Food Ranged Attack')
    pRangedAtk *= (1 + ps('Ranged Attack%') + ws_atk_modifier) / (1 + ps('Ranged Attack%'))
    pRangedAtk += ps('Food Ranged Attack')
    const base_ftp: [number, number, number] = [1.5, 2.5, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * ps('AGI') + 0.2 * ps('STR')
    nhits = 1
    skillchains = ['Fusion', 'Transfixion']
  } else if (wsName === 'Refulgent Arrow') {
    const base_ftp: [number, number, number] = [3.0, 4.25, 7.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.6 * ps('STR')
    nhits = 1
    skillchains = ['Reverberation', 'Transfixion']
  } else if (wsName === 'Apex Arrow') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.85 * ps('AGI')
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.15, 0.3, 0.45]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Aeonic', 'Fragmentation', 'Transfixion']
  } else if (wsName === 'Namas Arrow') {
    ftp = 2.75
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('AGI'))
    nhits = 1
    skillchains = ['Light', 'Distortion']
  } else if (wsName === "Jishnu's Radiance") {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.15, 0.2, 0.25]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += ((ps('AGI') - es('AGI')) / 10) / 100
    ftp = 1.75
    ftpRep = true
    wsc = 0.8 * ps('DEX')
    nhits = 3
    skillchains = ['Light', 'Fusion']
  } else if (wsName === 'Sarv') {
    const base_ftp: [number, number, number] = [2.75, 5.5, 8.25]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.65 * (ps('STR') + ps('AGI'))
    nhits = 1
    skillchains = ['Transfixion', 'Scission', 'Gravitation']

  // ─── Marksmanship ─────────────────────────────────────────────────────────────
  } else if (wsName === 'Hot Shot') {
    hybrid = true
    const base_ftp: [number, number, number] = [0.5, 1.55, 2.1]
    ftpHybrid = interp3(tp, base_tp, base_ftp)
    ftp = 1.0
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    element = 'Fire'
    skillchains = ['Liquefaction', 'Transfixion']
  } else if (wsName === 'Split Shot') {
    ftp = 1.0
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    const base_enemy_def_scaling: [number, number, number] = [0.0, 0.35, 0.5]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Reverberation', 'Transfixion']
  } else if (wsName === 'Sniper Shot') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.2, 0.25]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += ((ps('AGI') - es('AGI')) / 10) / 100
    ftp = 1.0
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    skillchains = ['Liquefaction', 'Transfixion']
  } else if (wsName === 'Slug Shot') {
    const acc_boost: [number, number, number] = [-50, -20, 0]
    pRangedAcc += interp3(tp, base_tp, acc_boost)
    ftp = 5.0
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    skillchains = ['Reverberation', 'Transfixion', 'Detonation']
  } else if (wsName === 'Blast Shot') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    pRangedAcc += interp3(tp, base_tp, acc_boost)
    ftp = 2.0
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    skillchains = ['Induration', 'Transfixion']
  } else if (wsName === 'Detonator') {
    const ws_atk_modifier = 1.0
    pRangedAtk -= ps('Food Ranged Attack')
    pRangedAtk *= (1 + ps('Ranged Attack%') + ws_atk_modifier) / (1 + ps('Ranged Attack%'))
    pRangedAtk += ps('Food Ranged Attack')
    const base_ftp: [number, number, number] = [1.5, 2.5, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.7 * ps('AGI')
    nhits = 1
    skillchains = ['Fusion', 'Transfixion']
  } else if (wsName === 'Last Stand') {
    const base_ftp: [number, number, number] = [2.0, 3.0, 4.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.85 * ps('AGI')
    nhits = 2
    skillchains = ['Aeonic', 'Fusion', 'Reverberation']
  } else if (wsName === 'Coronach') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.4 * (ps('DEX') + ps('AGI'))
    nhits = 1
    skillchains = ['Darkness', 'Fragmentation']
  } else if (wsName === 'Wildfire') {
    ftp = 5.5
    ftpRep = false
    wsc = 0.6 * ps('AGI')
    nhits = 1
    magical = true
    element = 'Fire'
    dSTAT = (ps('AGI') - es('INT')) * 2 > 1276 ? 1276 : (ps('AGI') - es('INT')) * 2
    skillchains = ['Darkness', 'Gravitation']
  } else if (wsName === 'Trueflight') {
    const base_ftp: [number, number, number] = [3.890625, 6.4921875, 9.671875]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 1.0 * ps('AGI')
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = (ps('AGI') - es('INT')) * 2
    skillchains = ['Fragmentation', 'Scission']
  } else if (wsName === 'Leaden Salute') {
    const base_ftp: [number, number, number] = [4.0, 6.7, 10.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 1.0 * ps('AGI')
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('AGI') - es('INT')) * 2
    skillchains = ['Gravitation', 'Transfixion']
  } else if (wsName === 'Terminus') {
    const base_ftp: [number, number, number] = [2.5, 5.0, 7.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.7 * (ps('DEX') + ps('AGI'))
    nhits = 1
    skillchains = ['Induration', 'Reverberation', 'Fusion']

  // ─── Staff ────────────────────────────────────────────────────────────────────
  } else if (wsName === 'Heavy Swing') {
    const base_ftp: [number, number, number] = [1.0, 1.25, 2.25]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Impaction']
  } else if (wsName === 'Rock Crusher') {
    const base_ftp: [number, number, number] = [1.0, 2.0, 2.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Earth'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Impaction']
  } else if (wsName === 'Earth Crusher') {
    const base_ftp: [number, number, number] = [1.0, 2.3125, 3.625]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Earth'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Detonation', 'Impaction']
  } else if (wsName === 'Starburst') {
    const base_ftp: [number, number, number] = [1.0, 2.0, 2.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Compression', 'Reverberation']
  } else if (wsName === 'Sunburst') {
    const base_ftp: [number, number, number] = [1.0, 2.5, 4.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('MND'))
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Compression', 'Reverberation']
  } else if (wsName === 'Shell Crusher') {
    ftp = 1.0
    ftpRep = false
    wsc = 1.0 * ps('STR')
    nhits = 1
    skillchains = ['Detonation']
  } else if (wsName === 'Full Swing') {
    const base_ftp: [number, number, number] = [1.0, 3.0, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.5 * ps('STR')
    nhits = 1
    skillchains = ['Liquefaction', 'Impaction']
  } else if (wsName === 'Retribution') {
    const base_ftp: [number, number, number] = [2.0, 2.5, 3.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 0.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    wsc = 0.5 * ps('MND') + 0.3 * ps('STR')
    nhits = 1
    skillchains = ['Gravitation', 'Reverberation']
  } else if (wsName === 'Cataclysm') {
    const base_ftp: [number, number, number] = [2.75, 4.0, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.3 * (ps('STR') + ps('INT'))
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) / 2 + 8 > 32 ? 32 : (ps('INT') - es('INT')) / 2 + 8
    skillchains = ['Compression', 'Reverberation']
  } else if (wsName === 'Shattersoul') {
    ftp = 1.375
    ftpRep = false
    wsc = 0.85 * ps('INT')
    nhits = 3
    skillchains = ['Aeonic', 'Gravitation', 'Induration']
  } else if (wsName === 'Vidohunir') {
    ftp = 1.75
    ftpRep = false
    wsc = 0.8 * ps('INT')
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('INT') - es('INT')) * 2
    skillchains = ['Fragmentation', 'Distortion']
  } else if (wsName === 'Omniscience') {
    ftp = 2.0
    ftpRep = false
    wsc = 0.8 * ps('MND')
    nhits = 1
    magical = true
    element = 'Dark'
    dSTAT = (ps('MND') - es('MND')) * 2
    skillchains = ['Gravitation', 'Transfixion']
  } else if (wsName === 'Garland of Bliss') {
    ftp = 2.25
    ftpRep = false
    wsc = 0.7 * ps('MND') + 0.3 * ps('STR')
    nhits = 1
    magical = true
    element = 'Light'
    dSTAT = (ps('MND') - es('MND')) * 2
    skillchains = ['Fusion', 'Reverberation']
  } else if (wsName === 'Gate of Tartarus') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.8 * ps('INT')
    nhits = 1
    skillchains = ['Darkness', 'Distortion']
  } else if (wsName === 'Oshala') {
    const base_ftp: [number, number, number] = [3.945, 7.894, 11.839]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.45 * (ps('INT') + ps('MND'))
    nhits = 1
    skillchains = ['Induration', 'Reverberation', 'Fusion']

  // ─── Hand-to-Hand ─────────────────────────────────────────────────────────────
  // Note: nhits is reduced by 1 (off-hand attack handled as dual-wield).
  } else if (wsName === 'Combo') {
    const base_ftp: [number, number, number] = [1.0, 2.4, 3.4]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.3 * (ps('STR') + ps('DEX'))
    nhits = 3 - 1
    skillchains = ['Impaction']
  } else if (wsName === 'One Inch Punch') {
    ftp = 1.0
    ftpRep = true
    wsc = 1.0 * ps('VIT')
    nhits = 2 - 1
    const base_enemy_def_scaling: [number, number, number] = [0.0, 0.25, 0.5]
    eDef -= eDef0 * interp3(tp, base_tp, base_enemy_def_scaling)
    skillchains = ['Compression']
  } else if (wsName === 'Raging Fists') {
    const base_ftp: [number, number, number] = [1.0, 2.1875, 3.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.3 * (ps('STR') + ps('DEX'))
    nhits = 5 - 1
    skillchains = ['Impaction']
  } else if (wsName === 'Spinning Attack') {
    ftp = 1.0
    ftpRep = true
    wsc = 1.0 * ps('STR')
    nhits = 2 - 1
    skillchains = ['Liquefaction', 'Impaction']
  } else if (wsName === 'Howling Fist') {
    const base_ftp: [number, number, number] = [2.05, 3.55, 5.75]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.5 * ps('VIT') + 0.2 * ps('STR')
    nhits = 2 - 1
    const ws_atk_modifier = 0.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk2 += ps('Food Attack')
    skillchains = ['Tranfixion', 'Impaction']
  } else if (wsName === 'Dragon Kick') {
    const base_ftp: [number, number, number] = [1.7, 3.0, 5.0]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.5 * (ps('VIT') + ps('STR'))
    nhits = 2 - 1
    const ws_atk_modifier = ps('Kick Attacks Attack%')
    pAtk1 -= ps('Food Attack')
    pAtk1 /= (1 + ps('Attack%'))
    pAtk1 += ps('Footwork') ? ps('Kick Attacks Attack') : 0
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier)
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 /= (1 + ps('Attack%'))
    pAtk2 += ps('Footwork') ? ps('Kick Attacks Attack') : 0
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier)
    pAtk2 += ps('Food Attack')
    skillchains = ['Fragmentation']
  } else if (wsName === 'Asuran Fists') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.25
    ftpRep = true
    wsc = 0.15 * (ps('VIT') + ps('STR'))
    nhits = 8 - 1
    skillchains = ['Gravitation', 'Liquefaction']
  } else if (wsName === 'Tornado Kick') {
    const base_ftp: [number, number, number] = [1.7, 2.8, 4.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = true
    wsc = 0.4 * (ps('VIT') + ps('STR'))
    nhits = 3 - 1
    const ws_atk_modifier = ps('Kick Attacks Attack%')
    pAtk1 -= ps('Food Attack')
    pAtk1 /= (1 + ps('Attack%'))
    pAtk1 += ps('Footwork') ? ps('Kick Attacks Attack') : 0
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier)
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 /= (1 + ps('Attack%'))
    pAtk2 += ps('Footwork') ? ps('Kick Attacks Attack') : 0
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier)
    pAtk2 += ps('Food Attack')
    skillchains = ['Induration', 'Impaction', 'Detonation']
  } else if (wsName === 'Shijin Spiral') {
    const acc_boost: [number, number, number] = [0, 20, 40]
    const acc_bonus = interp3(tp, base_tp, acc_boost)
    pAcc1 += acc_bonus
    pAcc2 += acc_bonus
    ftp = 1.5
    ftpRep = true
    wsc = 0.85 * ps('DEX')
    nhits = 5 - 1
    const ws_atk_modifier = 0.05
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk2 += ps('Food Attack')
    skillchains = ['Aeonic', 'Fusion', 'Reverberation']
  } else if (wsName === 'Final Heaven') {
    ftp = 3.0
    ftpRep = false
    wsc = 0.8 * ps('VIT')
    nhits = 2 - 1
    skillchains = ['Light', 'Fusion']
  } else if (wsName === 'Victory Smite') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.1, 0.25, 0.45]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.5
    ftpRep = true
    wsc = 0.8 * ps('STR')
    nhits = 4 - 1
    skillchains = ['Light', 'Fragmentation']
  } else if (wsName === "Ascetic's Fury") {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.2, 0.3, 0.5]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.0
    ftpRep = true
    wsc = 0.5 * (ps('STR') + ps('VIT'))
    nhits = 2 - 1
    const ws_atk_modifier = 1.0
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk2 += ps('Food Attack')
    skillchains = ['Fusion', 'Transfixion']
  } else if (wsName === 'Stringing Pummel') {
    critWs = true
    critRate += ps('Crit Rate') / 100
    const crit_boost: [number, number, number] = [0.15, 0.3, 0.45]
    critRate += interp3(tp, base_tp, crit_boost)
    critRate += getDexCrit(ps('DEX'), es('AGI'))
    ftp = 1.0
    ftpRep = true
    wsc = 0.32 * (ps('STR') + ps('VIT'))
    nhits = 6 - 1
    skillchains = ['Gravitation', 'Liquefaction']
  } else if (wsName === 'Maru Kala') {
    const base_ftp: [number, number, number] = [3.0, 7.0, 11.5]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    wsc = 0.4 * (ps('STR') + ps('DEX'))
    nhits = 2
    skillchains = ['Detonation', 'Compression', 'Distortion']
  } else if (wsName === 'Dragon Blow') {
    const base_ftp: [number, number, number] = [3.675, 7.0, 10.4375]
    ftp = interp3(tp, base_tp, base_ftp)
    ftpRep = false
    const ws_atk_modifier = 1.5
    pAtk1 -= ps('Food Attack')
    pAtk1 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk1 += ps('Food Attack')
    pAtk2 -= ps('Food Attack')
    pAtk2 *= (1 + ps('Attack%') + ws_atk_modifier) / (1 + ps('Attack%'))
    pAtk2 += ps('Food Attack')
    wsc = 0.85 * ps('DEX')
    nhits = 2
    skillchains = ['Distortion']
  }

  // ─── Post-chain: Shining One ──────────────────────────────────────────────────
  const shiningOneExcluded = [
    'Flaming Arrow', 'Namas Arrow', 'Apex Arrow', 'Refulgent Arrow', 'Empyreal Arrow',
    'Sidewinder', 'Piercing Arrow', "Jishnu's Radiance", 'Blast Arrow', 'Hot Shot',
    'Coronach', 'Last Stand', 'Detonator', 'Blast Shot', 'Slug Shot', 'Split Shot',
  ]
  if (mainWpnName === 'Shining One' && !shiningOneExcluded.includes(wsName)) {
    if (!critWs) {
      critRate += ps('Crit Rate') / 100
      critRate += getDexCrit(ps('DEX'), es('AGI'))
    }
    const crit_boost: [number, number, number] = [0.05, 0.10, 0.15]
    critRate += interp3(tp, [1000, 2000, 3000], crit_boost)
  }

  // Mighty Strikes: force 100% crit rate
  if (ps('Mighty Strikes')) {
    critRate = 1.0
  }

  // Clamp enemy defense to minimum 1
  if (eDef < 1) eDef = 1

  // Add WSC bonuses from Utu Grip, Crepuscular Knife, etc.
  for (const [stat, pct] of wscBonus) {
    wsc += (ps(stat) * pct) / 100
  }

  return {
    ftp,
    ftpRep,
    wsc,
    nhits,
    skillchains,
    magical,
    hybrid,
    element,
    dSTAT,
    ftpHybrid,
    critRate,
    critWs,
    playerAttack1: pAtk1,
    playerAttack2: pAtk2,
    playerAccuracy1: pAcc1,
    playerAccuracy2: pAcc2,
    playerRangedAccuracy: pRangedAcc,
    playerRangedAttack: pRangedAtk,
    enemyDef: eDef,
  }
}
