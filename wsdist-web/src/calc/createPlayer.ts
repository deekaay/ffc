/**
 * Port of create_player.py — builds a Player object from job/gear/buff/ability inputs.
 * All logic is pure (no Vue, no side effects).
 */
import type { Player, PlayerStats } from '@/types/player'
import type { Gearset, GearItem } from '@/types/gear'
import type { EnemyStats } from '@/types/enemy'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the numeric value of a stat, defaulting to 0. */
function gs(stats: Record<string, unknown>, key: string): number {
  return (stats[key] as number) ?? 0
}

/** Return whether an ability is truthy, defaulting to false. */
function ab(abilities: Record<string, boolean | number | string>, key: string): boolean {
  return !!(abilities[key] ?? false)
}

/** Return an ability as a number, defaulting to 0. */
function an(abilities: Record<string, boolean | number | string>, key: string): number {
  return (abilities[key] as number) ?? 0
}

// ---------------------------------------------------------------------------
// buildEnemy
// ---------------------------------------------------------------------------

export function buildEnemy(enemy: Record<string, unknown>): EnemyStats {
  const ignore = new Set(['Name', 'Location'])
  const stats: Record<string, unknown> = {}
  for (const stat of Object.keys(enemy)) {
    if (!ignore.has(stat)) stats[stat] = enemy[stat]
  }
  return stats as unknown as EnemyStats
}

// ---------------------------------------------------------------------------
// buildPlayer
// ---------------------------------------------------------------------------

export function buildPlayer(
  mainJob: string,
  subJob: string,
  masterLevel: number,
  gearset: Gearset,
  buffs: Record<string, Record<string, number>>,
  abilities: Record<string, boolean | number | string>,
): Player {
  const mj = mainJob.toLowerCase()
  const sj = subJob.toLowerCase()
  const ml = masterLevel > 50 ? 50 : masterLevel < 0 ? 0 : masterLevel

  const mainJobLevel = 99
  const subJobLevel = Math.trunc(mainJobLevel / 2) + Math.trunc(ml / 5)

  const stats: Record<string, unknown> = {}

  addBaseStats(stats, mj, sj, subJobLevel, ml, abilities)
  addGearStats(stats, mj, gearset)
  addBuffs(stats, mj, sj, subJobLevel, ml, gearset, buffs, abilities)
  finalizeStats(stats, mj, gearset, abilities)

  const sortedStats: Record<string, unknown> = {}
  for (const k of Object.keys(stats).sort()) sortedStats[k] = stats[k]

  return {
    mainJob: mj,
    subJob: sj,
    masterLevel: ml,
    mainJobLevel,
    subJobLevel,
    gearset,
    buffs,
    abilities,
    stats: sortedStats as unknown as PlayerStats,
  }
}

// ---------------------------------------------------------------------------
// getSkillAccuracy
// ---------------------------------------------------------------------------

function getSkillAccuracy(skillLevel: number): number {
  let acc = 0
  if (skillLevel > 200) {
    acc += Math.trunc((Math.min(skillLevel, 400) - 200) * 0.9) + 200
  } else {
    acc += skillLevel
  }
  if (skillLevel > 400) acc += Math.trunc((Math.min(skillLevel, 600) - 400) * 0.8)
  if (skillLevel > 600) acc += Math.trunc((skillLevel - 600) * 0.9)
  return acc
}

// ---------------------------------------------------------------------------
// addBaseStats
// ---------------------------------------------------------------------------

function addBaseStats(
  stats: Record<string, unknown>,
  mj: string,
  sj: string,
  subJobLevel: number,
  ml: number,
  abilities: Record<string, boolean | number | string>,
): void {
  const jobParameters: Record<string, Record<string, number>> = {
    war: { STR: 97, DEX: 93, VIT: 90, AGI: 93, INT: 84, MND: 84, CHR: 87 },
    mnk: { STR: 93, DEX: 95, VIT: 97, AGI: 84, INT: 81, MND: 90, CHR: 87 },
    whm: { STR: 90, DEX: 84, VIT: 90, AGI: 87, INT: 87, MND: 97, CHR: 93 },
    blm: { STR: 84, DEX: 93, VIT: 84, AGI: 93, INT: 97, MND: 87, CHR: 90 },
    rdm: { STR: 90, DEX: 90, VIT: 87, AGI: 87, INT: 93, MND: 93, CHR: 90 },
    thf: { STR: 90, DEX: 97, VIT: 90, AGI: 95, INT: 93, MND: 81, CHR: 81 },
    pld: { STR: 95, DEX: 87, VIT: 97, AGI: 81, INT: 81, MND: 93, CHR: 93 },
    drk: { STR: 97, DEX: 93, VIT: 93, AGI: 90, INT: 93, MND: 81, CHR: 81 },
    bst: { STR: 90, DEX: 97, VIT: 90, AGI: 95, INT: 93, MND: 81, CHR: 81 },
    brd: { STR: 90, DEX: 90, VIT: 90, AGI: 84, INT: 90, MND: 90, CHR: 95 },
    rng: { STR: 87, DEX: 90, VIT: 90, AGI: 97, INT: 87, MND: 90, CHR: 87 },
    smn: { STR: 84, DEX: 87, VIT: 84, AGI: 90, INT: 95, MND: 95, CHR: 95 },
    sam: { STR: 93, DEX: 93, VIT: 93, AGI: 90, INT: 87, MND: 87, CHR: 90 },
    nin: { STR: 93, DEX: 95, VIT: 93, AGI: 95, INT: 90, MND: 81, CHR: 84 },
    drg: { STR: 95, DEX: 90, VIT: 93, AGI: 90, INT: 84, MND: 87, CHR: 93 },
    blu: { STR: 87, DEX: 87, VIT: 87, AGI: 87, INT: 87, MND: 87, CHR: 87 },
    cor: { STR: 87, DEX: 93, VIT: 87, AGI: 95, INT: 93, MND: 87, CHR: 87 },
    pup: { STR: 87, DEX: 95, VIT: 90, AGI: 93, INT: 87, MND: 84, CHR: 93 },
    dnc: { STR: 90, DEX: 93, VIT: 87, AGI: 95, INT: 84, MND: 84, CHR: 95 },
    sch: { STR: 84, DEX: 90, VIT: 87, AGI: 90, INT: 95, MND: 90, CHR: 93 },
    geo: { STR: 84, DEX: 90, VIT: 90, AGI: 87, INT: 95, MND: 95, CHR: 87 },
    run: { STR: 93, DEX: 90, VIT: 87, AGI: 95, INT: 90, MND: 90, CHR: 84 },
  }
  const subjobParameters: Record<string, Record<string, number>> = {
    war: { STR: 15, DEX: 12, VIT: 10, AGI: 12, INT: 7, MND: 7, CHR: 9 },
    mnk: { STR: 12, DEX: 13, VIT: 15, AGI: 7, INT: 6, MND: 10, CHR: 9 },
    whm: { STR: 10, DEX: 7, VIT: 10, AGI: 9, INT: 9, MND: 15, CHR: 12 },
    blm: { STR: 7, DEX: 12, VIT: 7, AGI: 12, INT: 15, MND: 9, CHR: 10 },
    rdm: { STR: 10, DEX: 10, VIT: 9, AGI: 9, INT: 12, MND: 12, CHR: 10 },
    thf: { STR: 10, DEX: 15, VIT: 10, AGI: 13, INT: 12, MND: 6, CHR: 6 },
    pld: { STR: 13, DEX: 9, VIT: 15, AGI: 6, INT: 6, MND: 12, CHR: 12 },
    drk: { STR: 15, DEX: 12, VIT: 12, AGI: 10, INT: 12, MND: 6, CHR: 6 },
    bst: { STR: 9, DEX: 9, VIT: 9, AGI: 9, INT: 9, MND: 9, CHR: 9 },
    brd: { STR: 9, DEX: 9, VIT: 9, AGI: 9, INT: 9, MND: 9, CHR: 9 },
    rng: { STR: 9, DEX: 10, VIT: 10, AGI: 15, INT: 9, MND: 10, CHR: 9 },
    smn: { STR: 7, DEX: 9, VIT: 7, AGI: 10, INT: 13, MND: 13, CHR: 13 },
    sam: { STR: 12, DEX: 12, VIT: 12, AGI: 10, INT: 9, MND: 9, CHR: 10 },
    nin: { STR: 12, DEX: 13, VIT: 12, AGI: 13, INT: 10, MND: 6, CHR: 7 },
    drg: { STR: 13, DEX: 10, VIT: 12, AGI: 10, INT: 7, MND: 9, CHR: 12 },
    blu: { STR: 9, DEX: 9, VIT: 9, AGI: 9, INT: 9, MND: 9, CHR: 9 },
    cor: { STR: 9, DEX: 12, VIT: 9, AGI: 13, INT: 12, MND: 9, CHR: 9 },
    pup: { STR: 9, DEX: 13, VIT: 10, AGI: 12, INT: 9, MND: 7, CHR: 12 },
    dnc: { STR: 10, DEX: 12, VIT: 9, AGI: 13, INT: 7, MND: 7, CHR: 13 },
    sch: { STR: 7, DEX: 9, VIT: 8, AGI: 9, INT: 13, MND: 9, CHR: 11 },
    geo: { STR: 7, DEX: 10, VIT: 10, AGI: 8, INT: 13, MND: 13, CHR: 9 },
    run: { STR: 12, DEX: 10, VIT: 9, AGI: 13, INT: 10, MND: 10, CHR: 7 },
    none: { STR: 0, DEX: 0, VIT: 0, AGI: 0, INT: 0, MND: 0, CHR: 0 },
  }

  const mjParams = jobParameters[mj] ?? jobParameters['war']
  const sjParams = subjobParameters[sj] ?? subjobParameters['none']
  for (const stat of Object.keys(mjParams)) {
    stats[stat] = gs(stats, stat) + mjParams[stat] + sjParams[stat] + ml
  }

  // Traits: format { traitName: { jobCode: [[levelThreshold, value], ...], ... } }
  const traits: Record<string, Record<string, number[][]>> = {
    Accuracy: { rng: [[96,73],[86,60],[70,48],[50,35],[30,22],[10,10]], drg: [[76,35],[60,22],[30,10]], dnc: [[76,35],[60,22],[30,10]], run: [[90,35],[70,22],[50,10]] },
    'Ranged Accuracy': { rng: [[96,73],[86,60],[70,48],[50,35],[30,22],[10,10]], drg: [[76,35],[60,22],[30,10]], dnc: [[76,35],[60,22],[30,10]], run: [[90,35],[70,22],[50,10]] },
    Attack: { drk: [[99,96],[91,84],[83,72],[76,60],[70,48],[50,35],[30,22],[10,10]], war: [[91,35],[65,22],[30,10]], drg: [[91,22],[10,10]] },
    'Ranged Attack': { drk: [[99,96],[91,84],[83,72],[76,60],[70,48],[50,35],[30,22],[10,10]], war: [[91,35],[65,22],[30,10]], drg: [[91,22],[10,10]] },
    Barrage: { rng: [[90,6],[70,5],[50,4],[30,3]] },
    'Conserve TP': { drg: [[97,26],[84,24],[71,21],[58,18],[45,15]], dnc: [[97,21],[87,17],[77,15]], rng: [[91,18],[80,15]] },
    'Crit Damage': { thf: [[97,14],[91,11],[84,8],[78,5]], dnc: [[99,11],[88,8],[80,5]], drk: [[95,8],[85,5]] },
    Daken: { nin: [[95,40],[70,35],[55,30],[40,25],[25,20]] },
    'PDL Trait': { drk: [[80,50],[70,40],[55,30],[40,20],[20,10]], mnk: [[90,30],[60,20],[30,10]], rng: [[90,30],[60,20],[30,10]], drg: [[90,30],[60,20],[30,10]], war: [[80,20],[40,10]], sam: [[80,20],[40,10]], bst: [[90,20],[45,10]], pup: [[90,20],[45,10]], dnc: [[90,20],[45,10]], thf: [[50,10]], nin: [[50,10]], rdm: [[60,10]] },
    'Ranged Crit Damage': { rng: [[99,45],[90,40],[80,35],[70,30],[60,20],[50,10]] },
    DA: { war: [[99,18],[85,16],[75,14],[50,12],[25,10]] },
    'Dual Wield': { nin: [[85,35],[65,30],[45,25],[25,15],[10,10]], dnc: [[80,30],[60,25],[40,15],[20,10]], thf: [[98,25],[90,15],[83,10]] },
    Evasion: { thf: [[88,72],[76,60],[70,48],[50,35],[30,22],[10,10]], dnc: [[86,48],[75,35],[45,22],[15,10]], pup: [[76,48],[60,35],[40,22],[20,10]] },
    Fencer: { war: [[97,5],[84,4],[71,3],[58,2],[45,1]], bst: [[94,3],[87,2],[80,1]], brd: [[95,2],[85,1]] },
    'Kick Attacks': { mnk: [[76,14],[71,12],[51,10]] },
    'Magic Burst Damage Trait': { blm: [[97,13],[84,11],[71,9],[58,7],[45,5]], sch: [[99,7],[89,7],[79,5]], nin: [[90,7],[80,5]], rdm: [[95,7],[85,5]] },
    'Magic Attack': { blm: [[91,40],[81,36],[70,32],[50,28],[30,24],[10,20]], rdm: [[86,28],[40,24],[20,20]] },
    'Magic Defense': { run: [[99,22],[91,20],[76,18],[70,16],[50,14],[30,12],[10,10]], whm: [[91,20],[81,18],[70,16],[50,14],[30,12],[10,10]], rdm: [[96,14],[45,12],[25,10]] },
    'Martial Arts': { mnk: [[82,200],[75,180],[61,160],[46,140],[31,120],[16,100],[1,80]], pup: [[97,160],[87,140],[75,120],[50,100],[25,80]] },
    'Occult Acumen': { drk: [[97,125],[84,100],[71,75],[58,50],[45,25]], sch: [[98,75],[88,50],[78,25]], blm: [[95,50],[85,25]] },
    Recycle: { rng: [[50,30],[35,20],[20,10]], cor: [[90,30],[65,20],[35,10]] },
    'Skillchain Bonus': { dnc: [[97,23],[84,20],[71,16],[58,12],[45,8]], sam: [[98,16],[88,12],[78,8]], nin: [[95,12],[85,8]], mnk: [[95,12],[85,8]] },
    Smite: { drk: [[95,5],[75,4],[55,3],[35,2],[15,1]], war: [[95,3],[65,2],[35,1]], mnk: [[80,2],[40,1]], drg: [[80,2],[40,1]], pup: [[40,1]] },
    'Store TP': { sam: [[90,30],[70,25],[50,20],[30,15],[10,10]] },
    'Subtle Blow': { mnk: [[91,25],[65,20],[40,15],[25,10],[5,5]], nin: [[75,25],[60,20],[45,15],[30,10],[15,5]], dnc: [[86,20],[65,15],[45,10],[25,5]] },
    TA: { thf: [[95,6],[55,5]] },
    'True Shot': { rng: [[98,7],[88,5],[78,3]], cor: [[95,5],[85,3]] },
    'Weapon Skill Damage Trait': { drg: [[95,21],[85,19],[75,17],[65,13],[55,10],[45,7]] },
    Zanshin: { sam: [[95,50],[75,45],[50,35],[35,25],[20,15]] },
  }

  for (const trait of Object.keys(traits)) {
    const mjTiers = traits[trait][mj]
    if (mjTiers) {
      for (const [lvl, val] of mjTiers) {
        if (99 >= lvl) {
          stats[trait] = gs(stats, trait) + val
          break
        }
      }
    }
    const sjTiers = traits[trait][sj]
    if (sjTiers) {
      for (const [lvl, val] of sjTiers) {
        if (trait === 'DA' && mj === 'dnc' && sj === 'war' && ab(abilities, 'Saber Dance')) break
        if (subJobLevel >= lvl) {
          stats[trait] = Math.max(gs(stats, trait), val)
          break
        }
      }
    }
  }

  if (mj === 'bst') stats['Accuracy'] = gs(stats, 'Accuracy') + 50

  stats['Ranged Attack'] = gs(stats, 'Ranged Attack') + 0

  // Combat skills for Lv99 main job
  const jobCombatStats: Record<string, Record<string, number>> = {
    war: { 'Hand-to-Hand Skill':334,'Dagger Skill':388,'Sword Skill':398,'Great Sword Skill':404,'Axe Skill':417,'Great Axe Skill':424,'Scythe Skill':404,'Polearm Skill':388,'Club Skill':388,'Staff Skill':398,'Archery Skill':334,'Marksmanship Skill':334,'Throwing Skill':334,'Evasion Skill':373 },
    mnk: { 'Hand-to-Hand Skill':424,'Staff Skill':398,'Club Skill':378,'Throwing Skill':300,'Evasion Skill':404 },
    whm: { 'Club Skill':404,'Staff Skill':378,'Throwing Skill':300,'Evasion Skill':300,'Divine Magic Skill':417 },
    blm: { 'Dagger Skill':334,'Scythe Skill':300,'Club Skill':378,'Staff Skill':388,'Throwing Skill':334,'Evasion Skill':300,'Elemental Magic Skill':424,'Dark Magic Skill':417 },
    rdm: { 'Dagger Skill':398,'Sword Skill':398,'Club Skill':334,'Archery Skill':334,'Throwing Skill':265,'Evasion Skill':334,'Divine Magic Skill':300,'Elemental Magic Skill':378,'Dark Magic Skill':300 },
    thf: { 'Hand-to-Hand Skill':300,'Dagger Skill':424,'Sword Skill':334,'Club Skill':300,'Archery Skill':368,'Marksmanship Skill':378,'Throwing Skill':334,'Evasion Skill':424 },
    pld: { 'Sword Skill':424,'Club Skill':417,'Staff Skill':417,'Great Sword Skill':398,'Dagger Skill':368,'Polearm Skill':300,'Evasion Skill':373,'Divine Magic Skill':404 },
    drk: { 'Dagger Skill':373,'Sword Skill':388,'Great Sword Skill':417,'Axe Skill':388,'Great Axe Skill':388,'Scythe Skill':424,'Club Skill':368,'Marksmanship Skill':300,'Evasion Skill':373,'Elemental Magic Skill':404,'Dark Magic Skill':417 },
    bst: { 'Dagger Skill':378,'Sword Skill':300,'Axe Skill':424,'Scythe Skill':368,'Club Skill':334,'Evasion Skill':373 },
    brd: { 'Dagger Skill':388,'Sword Skill':368,'Club Skill':334,'Staff Skill':378,'Throwing Skill':300,'Evasion Skill':334 },
    rng: { 'Dagger Skill':388,'Sword Skill':334,'Axe Skill':388,'Club Skill':300,'Archery Skill':424,'Marksmanship Skill':424,'Throwing Skill':368,'Evasion Skill':300 },
    smn: { 'Dagger Skill':300,'Club Skill':378,'Staff Skill':398,'Evasion Skill':300,'Summoning Magic Skill':417 },
    sam: { 'Dagger Skill':300,'Sword Skill':378,'Polearm Skill':388,'Great Katana Skill':424,'Club Skill':300,'Archery Skill':378,'Throwing Skill':378,'Evasion Skill':404 },
    nin: { 'Hand-to-Hand Skill':300,'Dagger Skill':378,'Sword Skill':373,'Katana Skill':424,'Great Katana Skill':368,'Club Skill':300,'Archery Skill':300,'Marksmanship Skill':373,'Throwing Skill':424,'Evasion Skill':417,'Ninjutsu Skill':417 },
    drg: { 'Dagger Skill':300,'Sword Skill':368,'Polearm Skill':424,'Club Skill':300,'Staff Skill':388,'Evasion Skill':388 },
    blu: { 'Sword Skill':424,'Club Skill':388,'Evasion Skill':368,'Blue Magic Skill':424 },
    cor: { 'Dagger Skill':404,'Sword Skill':388,'Marksmanship Skill':398,'Throwing Skill':378,'Evasion Skill':334 },
    pup: { 'Hand-to-Hand Skill':424,'Dagger Skill':368,'Club Skill':334,'Throwing Skill':378,'Evasion Skill':398 },
    dnc: { 'Dagger Skill':424,'Hand-to-Hand Skill':334,'Sword Skill':334,'Throwing Skill':378,'Evasion Skill':404 },
    sch: { 'Dagger Skill':334,'Club Skill':378,'Staff Skill':378,'Throwing Skill':334,'Evasion Skill':300,'Divine Magic Skill':404,'Elemental Magic Skill':404,'Dark Magic Skill':404 },
    geo: { 'Club Skill':404,'Staff Skill':378,'Dagger Skill':368,'Evasion Skill':334,'Elemental Magic Skill':404,'Dark Skill':373 },
    run: { 'Great Sword Skill':424,'Sword Skill':417,'Great Axe Skill':398,'Axe Skill':388,'Club Skill':368,'Evasion Skill':404,'Divine Magic Skill':398 },
  }
  const cs = jobCombatStats[mj] ?? {}
  for (const stat of Object.keys(cs)) {
    stats[stat] = gs(stats, stat) + cs[stat] + ml
  }

  // +16 to all combat skills from merits
  const allCombatSkills = ['Hand-to-Hand Skill','Dagger Skill','Sword Skill','Great Sword Skill','Axe Skill','Great Axe Skill','Scythe Skill','Polearm Skill','Katana Skill','Great Katana Skill','Club Skill','Staff Skill','Archery Skill','Marksmanship Skill','Throwing Skill','Evasion Skill','Divine Magic Skill','Elemental Magic Skill','Dark Magic Skill','Ninjutsu Skill','Summoning Magic Skill','Blue Magic Skill']
  for (const stat of allCombatSkills) {
    stats[stat] = gs(stats, stat) + 16
  }

  // Job merits
  const overwhelm = +(ab(abilities, 'Overwhelm'))
  const closedPos = +(ab(abilities, 'Closed Position'))
  const jobMeritStats: Record<string, Record<string, number>> = {
    war: { DA: 5 },
    mnk: { 'Kick Attacks': 5 },
    whm: {},
    blm: { 'Magic Attack': 10, 'Magic Accuracy': 25 },
    rdm: { 'Magic Accuracy': 40, 'EnSpell Damage': 15 },
    thf: { TA: 5, Accuracy: 15, 'Ranged Accuracy': 15 },
    pld: {},
    drk: {},
    bst: {},
    brd: {},
    rng: { Recycle: 25 },
    smn: {},
    sam: { Zanshin: 5, 'Store TP': 10, 'Weapon Skill Damage': 19 * overwhelm },
    nin: { 'Subtle Blow': 5, 'Ninjutsu Magic Accuracy': 25, 'Ninjutsu Magic Attack': 30, 'Ninjutsu Magic Damage': 0 },
    drg: {},
    blu: {},
    cor: {},
    pup: {},
    dnc: { Accuracy: 15 * closedPos, Evasion: 15 * closedPos },
    sch: { 'Helix Magic Accuracy': 15, 'Helix Magic Attack': 10 },
    geo: {},
    run: {},
  }
  const jm = jobMeritStats[mj] ?? {}
  for (const stat of Object.keys(jm)) {
    stats[stat] = gs(stats, stat) + jm[stat]
  }

  // +5% base crit + 5% merits
  stats['Crit Rate'] = gs(stats, 'Crit Rate') + 5 + 5

  // Job mastery stats (job gifts + job points)
  const jobMasteryStats: Record<string, Record<string, number>> = {
    war: { Accuracy:26,'Ranged Accuracy':26,Attack:70,'Ranged Attack':70,'Magic Accuracy':36,'Fencer TP Bonus':230,'Crit Rate':10,'Crit Damage':10,DA:10,Evasion:36,'Magic Evasion':36,'Weapon Skill Damage':3 },
    mnk: { Accuracy:41,'Ranged Accuracy':41,Attack:40,'Ranged Attack':40,'Magic Accuracy':36,Evasion:42,'Magic Evasion':36,'Subtle Blow':10,'Martial Arts':10,'Kick Attacks Attack':40,'Kick Attacks Accuracy':20 },
    whm: { Accuracy:14,'Ranged Accuracy':14,'Magic Accuracy':70,'Magic Attack':22,'Magic Defense':50,'Divine Magic Skill':36 },
    blm: { 'Magic Burst Damage Trait':43,'Magic Damage':43,'Magic Defense':14,'Magic Attack':50,'Magic Evasion':42,'Magic Accuracy':32,'Elemental Magic Skill':36,'Dark Magic Skill':36 },
    rdm: { 'Magic Attack':48,'Magic Accuracy':90,'Magic Defense':28,'Magic Evasion':56,Accuracy:22,'Ranged Accuracy':22,'EnSpell Damage':23 },
    thf: { 'Sneak Attack Bonus':20,'Trick Attack Bonus':20,Attack:50,'Ranged Attack':50,Evasion:70,Accuracy:36,'Ranged Accuracy':36,'Magic Evasion':36,'Magic Accuracy':36,TA:8,'Crit Damage':8,'Dual Wield':5,'TA Attack':20 },
    pld: { Accuracy:28,'Ranged Accuracy':28,Attack:28,'Ranged Attack':28,Evasion:22,'Magic Evasion':42,'Divine Magic Skill':36,'Magic Accuracy':42 },
    drk: { Attack:106,'Ranged Attack':106,Evasion:22,'Magic Evasion':36,Accuracy:22,'Ranged Accuracy':22,'Magic Accuracy':42,'Dark Magic Skill':36,'Crit Damage':8,'Weapon Skill Damage':8 },
    bst: { Attack:70,'Ranged Attack':70,Accuracy:36,'Ranged Accuracy':36,'Magic Evasion':36,'Magic Accuracy':36,'Fencer TP Bonus':230,Evasion:36 },
    brd: { Evasion:22,Accuracy:21,'Ranged Accuracy':21,'Magic Defense':15,'Magic Evasion':36,'Magic Accuracy':36 },
    rng: { 'Double Shot':20,Attack:70,'Ranged Attack':70,Evasion:14,Accuracy:70,'Ranged Accuracy':70,'Magic Evasion':36,'Conserve TP':15,'True Shot':8,'Ranged Crit Damage':8,Barrage:1,'Barrage Ranged Attack':60 },
    smn: { 'Magic Defense':22,'Magic Evasion':22,Evasion:22,'Summoning Magic Skill':36 },
    sam: { Attack:70,'Ranged Attack':70,Evasion:36,Accuracy:36,'Ranged Accuracy':36,'Magic Evasion':36,Zanshin:10,'Zanshin Attack':40,'Store TP':8,'Skillchain Bonus':8 },
    nin: { 'Ninjutsu Magic Damage':40,'Ninjutsu Magic Accuracy':20,Attack:70,'Ranged Attack':70,Evasion:64,Accuracy:56,'Ranged Accuracy':56,'Magic Attack':28,'Magic Evasion':50,'Magic Accuracy':50,'Ninjutsu Skill':36,Daken:14,'Weapon Skill Damage':5 },
    drg: { Attack:70,'Ranged Attack':70,Evasion:36,Accuracy:64,'Ranged Accuracy':64,'Magic Evasion':36,'Crit Damage':8 },
    blu: { Attack:70,'Ranged Attack':70,Evasion:36,Accuracy:36,'Ranged Accuracy':36,'Magic Defense':36,'Magic Attack':36,'Magic Evasion':36,'Blue Magic Skill':36 },
    cor: { 'Triple Shot':20,'True Shot':6,'Ranged Accuracy':56,Attack:36,'Ranged Attack':36,Accuracy:36,Evasion:22,'Magic Attack':14,'Magic Evasion':36,'Magic Accuracy':36,'Quick Draw Damage':40 },
    pup: { 'Martial Arts':40,Attack:42,'Ranged Attack':42,Evasion:56,Accuracy:50,'Ranged Accuracy':50,'Magic Evasion':36,'Magic Accuracy':36 },
    dnc: { 'Flourish CHR%':20,'Building Flourish WSD':20,Attack:42,'Ranged Attack':42,Evasion:64,Accuracy:64,'Ranged Accuracy':64,'Magic Evasion':36,'Magic Accuracy':36,'Subtle Blow':13,'Crit Damage':8,'Skillchain Bonus':8,'Dual Wield':5 },
    sch: { 'Magic Defense':22,'Magic Attack':36,'Magic Evasion':42,'Magic Accuracy':42,'Dark Magic Skill':36,'Elemental Magic Skill':36,'Magic Burst Damage Trait':13 },
    geo: { 'Magic Accuracy':50,'Magic Attack':62,'Magic Defense':28,'Magic Evasion':50,'Elemental Magic Skill':36,'Dark Magic Skill':36,'Magic Damage':13 },
    run: { 'Lunge Bonus':20,Attack:50,'Ranged Attack':50,Evasion:56,Accuracy:56,'Ranged Accuracy':56,'Magic Defense':56,'Magic Evasion':70,'Magic Accuracy':36 },
  }
  const jmas = jobMasteryStats[mj] ?? {}
  for (const stat of Object.keys(jmas)) {
    stats[stat] = gs(stats, stat) + jmas[stat]
  }

  // Job-specific always-active spells/abilities
  if (mj === 'rdm') {
    const enhSkill = an(abilities, 'Enhancing Skill')
    const t2ta = ab(abilities, 'Temper II') ? Math.min(40, Math.max(0, Math.trunc((enhSkill - 300) / 10))) : 0
    stats['TA'] = gs(stats, 'TA') + t2ta
  }

  if (mj === 'run') {
    const enhSkill = an(abilities, 'Enhancing Skill')
    let t1da = Math.max(0, Math.trunc((enhSkill - 300) / 10))
    if (t1da < 5) t1da = 5
    stats['DA'] = gs(stats, 'DA') + t1da * +ab(abilities, 'Temper')
  }

  if (mj === 'sch' || sj === 'sch') {
    stats['Elemental Magic Skill'] = Math.max(gs(stats, 'Elemental Magic Skill'), 404 + 16)
    stats['Dark Magic Skill'] = Math.max(gs(stats, 'Dark Magic Skill'), 404 + 16)
    stats['Divine Magic Skill'] = Math.max(gs(stats, 'Divine Magic Skill'), 404 + 16)
  }

  if (mj === 'blu') {
    stats['Accuracy'] = gs(stats, 'Accuracy') + 48
    stats['Ranged Accuracy'] = gs(stats, 'Ranged Accuracy') + 48
    stats['Magic Accuracy'] = gs(stats, 'Magic Accuracy') + 36
    stats['Store TP'] = gs(stats, 'Store TP') + 30
    stats['Dual Wield'] = gs(stats, 'Dual Wield') + 25
    stats['TA'] = gs(stats, 'TA') + 5
    stats['Crit Damage'] = gs(stats, 'Crit Damage') + 11
    stats['Skillchain Bonus'] = gs(stats, 'Skillchain Bonus') + 16
    stats['STR'] = gs(stats, 'STR') + 5 + 4 + 3 + 2 - 3
    stats['DEX'] = gs(stats, 'DEX') + 8 + 6 + 2 + 4 + 4 + 1 + 8 + 4
    stats['VIT'] = gs(stats, 'VIT') + 4 + 7 + 4
    stats['AGI'] = gs(stats, 'AGI') + 5 + 2 + 1
    stats['MND'] = gs(stats, 'MND') + 4 + 2
    stats['INT'] = gs(stats, 'INT') + 4 - 1
    stats['CHR'] = gs(stats, 'CHR') + 1 + 5 - 2
  }

  if (mj === 'drg') {
    stats['Wyvern Bonus Attack%'] = true
    stats['Weapon Skill Damage Trait'] = gs(stats, 'Weapon Skill Damage Trait') + 10
    stats['JA Haste'] = gs(stats, 'JA Haste') + 10
    stats['DA'] = gs(stats, 'DA') + 15
    stats['Attack'] = gs(stats, 'Attack') + 40
  }

  if (mj === 'nin') {
    stats['Store TP'] = gs(stats, 'Store TP') + 10
    stats['Subtle Blow'] = gs(stats, 'Subtle Blow') + 10
  }
}

// ---------------------------------------------------------------------------
// addGearStats
// ---------------------------------------------------------------------------

function addGearStats(
  stats: Record<string, unknown>,
  mj: string,
  gearset: Gearset,
): void {
  const ignoreStats = new Set(['Name','Name2','Type','DMG','Delay','Jobs','Skill Type','Rank'])
  const ignoreMainSubSkills = new Set(['Hand-to-Hand Skill','Dagger Skill','Sword Skill','Great Sword Skill','Axe Skill','Great Axe Skill','Scythe Skill','Polearm Skill','Katana Skill','Great Katana Skill','Club Skill','Staff Skill','Evasion Skill','Divine Magic Skill','Elemental Magic Skill','Dark Magic Skill','Ninjutsu Skill','Summoning Magic Skill','Blue Magic Skill','Magic Accuracy Skill'])
  const oaxStats = new Set(['FUA','OA8','OA7','OA6','OA5','OA4','OA3','OA2','EnSpell Damage','EnSpell Damage%'])

  for (const slot of Object.keys(gearset) as (keyof Gearset)[]) {
    const item = gearset[slot] as GearItem
    for (const stat of Object.keys(item)) {
      if (stat === 'Triple Shot' && mj === 'rng') continue
      if (stat === 'Double Shot' && mj === 'cor') continue
      if (ignoreStats.has(stat)) continue

      if ((slot === 'main' || slot === 'sub') && ignoreMainSubSkills.has(stat)) {
        stats[`${slot} ${stat}`] = gs(stats, `${slot} ${stat}`) + (item[stat] as number)
      } else if (oaxStats.has(stat) && (slot === 'main' || slot === 'sub')) {
        stats[`${stat} ${slot}`] = gs(stats, `${stat} ${slot}`) + (item[stat] as number)
      } else if (stat === 'WSC') {
        const existing = (stats['WSC'] as string[]) ?? []
        stats['WSC'] = [...existing, item[stat] as string]
      } else {
        stats[stat] = gs(stats, stat) + (item[stat] as number)
      }
    }
  }

  // Set bonus counters
  let mummuCount = 0, flammaCount = 0, mallquisCount = 0, ayanmoCount = 0
  let regalRingCount = 0, regalEarringCount = 0, adhemarCount = 0
  let amalricCount = 0, lustratioCount = 0, ryuoCount = 0

  const afArmor: Record<string, string> = {
    war:'pummeler',mnk:'anchorite',whm:'theophany',blm:'spaekona',rdm:'atrophy',thf:'pillager',
    pld:'reverence',drk:'ignominy',bst:'totomic',brd:'brioso',rng:'orion',sam:'wakido',nin:'hachiya',
    drg:'vishap',smn:'convoker',blu:'assimilator',cor:'laksamana',pup:'foire',dnc:'maxixi',
    sch:'academic',geo:'geomancy',run:'runeist',
  }

  const armorSlots: (keyof Gearset)[] = ['head','body','hands','legs','feet','ring1','ring2']
  const bodySlots: (keyof Gearset)[] = ['head','body','hands','legs','feet']

  for (const slot of Object.keys(gearset) as (keyof Gearset)[]) {
    const name = (gearset[slot] as GearItem)['Name'] as string
    if (name.includes('Adhemar') && name.includes('+1')) adhemarCount++
    if (name.includes('Amalric') && name.includes('+1')) amalricCount++
    if (name.includes('Lustratio') && name.includes('+1')) lustratioCount++
    if (name.includes('Ryuo') && name.includes('+1')) ryuoCount++

    const ring1 = (gearset['ring1'] as GearItem)['Name'] as string
    const ring2 = (gearset['ring2'] as GearItem)['Name'] as string
    const ear1 = (gearset['ear1'] as GearItem)['Name'] as string
    const ear2 = (gearset['ear2'] as GearItem)['Name'] as string
    const af = afArmor[mj] ?? ''

    if ((ring1 === 'Regal Ring' || ring2 === 'Regal Ring') && bodySlots.includes(slot)) {
      if (af && name.toLowerCase().includes(af)) regalRingCount++
    }
    if ((ear1 === 'Regal Earring' || ear2 === 'Regal Earring') && bodySlots.includes(slot)) {
      if (af && name.toLowerCase().includes(af)) regalEarringCount++
    }

    if (name.includes('Flamma') && armorSlots.includes(slot)) flammaCount++
    if (name.includes('Mallquis') && armorSlots.includes(slot)) mallquisCount++
    if (name.includes('Ayanmo') && armorSlots.includes(slot)) ayanmoCount++
    if (name.includes('Mummu') && armorSlots.includes(slot)) mummuCount++
  }

  mallquisCount = Math.min(mallquisCount, 5)
  ayanmoCount = Math.min(ayanmoCount, 5)
  flammaCount = Math.min(flammaCount, 5)
  mummuCount = Math.min(mummuCount, 5)
  regalRingCount = Math.min(regalRingCount, 5)
  regalEarringCount = Math.min(regalEarringCount, 5)

  const setBonus = (count: number, min: number, val: number) => count >= min ? (count - 1) * val : 0

  stats['STR'] = gs(stats,'STR') + setBonus(ayanmoCount,2,8) + setBonus(flammaCount,2,8)
  stats['DEX'] = gs(stats,'DEX') + setBonus(mummuCount,2,8) + setBonus(flammaCount,2,8)
  stats['VIT'] = gs(stats,'VIT') + setBonus(mummuCount,2,8) + setBonus(flammaCount,2,8) + setBonus(ayanmoCount,2,8) + setBonus(mallquisCount,2,8)
  stats['AGI'] = gs(stats,'AGI') + setBonus(mummuCount,2,8)
  stats['INT'] = gs(stats,'INT') + setBonus(mallquisCount,2,8)
  stats['MND'] = gs(stats,'MND') + setBonus(mallquisCount,2,8) + setBonus(ayanmoCount,2,8)
  stats['CHR'] = gs(stats,'CHR') + setBonus(mummuCount,2,8)
  stats['Crit Rate'] = gs(stats,'Crit Rate') + (adhemarCount > 1 ? adhemarCount * 2 : 0)
  stats['Magic Attack'] = gs(stats,'Magic Attack') + (amalricCount >= 2 ? amalricCount * 10 : 0)
  stats['Weapon Skill Damage'] = gs(stats,'Weapon Skill Damage') + (lustratioCount >= 2 ? lustratioCount * 2 : 0)
  stats['Attack'] = gs(stats,'Attack') + (ryuoCount >= 2 ? ryuoCount * 10 : 0)
  stats['Accuracy'] = gs(stats,'Accuracy') + (regalRingCount + regalEarringCount) * 15
  stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + (regalRingCount + regalEarringCount) * 15
  stats['Magic Accuracy'] = gs(stats,'Magic Accuracy') + (regalRingCount + regalEarringCount) * 15
}

// ---------------------------------------------------------------------------
// addBuffs
// ---------------------------------------------------------------------------

function addBuffs(
  stats: Record<string, unknown>,
  mj: string,
  sj: string,
  subJobLevel: number,
  ml: number,
  gearset: Gearset,
  buffs: Record<string, Record<string, number>>,
  abilities: Record<string, boolean | number | string>,
): void {
  // Unused but kept for sub_job_level parity with Python
  void subJobLevel

  const ignoreStats = new Set(['Name','Name2','Type','DMG','Delay','Jobs','Skill Type','Rank'])
  for (const source of Object.keys(buffs)) {
    for (const stat of Object.keys(buffs[source])) {
      if (!ignoreStats.has(stat)) {
        stats[stat] = gs(stats, stat) + buffs[source][stat]
      }
    }
  }

  const jobs = [mj, sj]
  const two_handed = ['Great Sword','Great Katana','Great Axe','Polearm','Scythe','Staff']

  const mainName = (gearset['main'] as GearItem)['Name'] as string
  const mainSkillType = (gearset['main'] as GearItem)['Skill Type'] as string ?? 'None'
  const subType = (gearset['sub'] as GearItem)['Type'] as string ?? 'None'
  const bodyName = (gearset['body'] as GearItem)['Name'] as string
  const handsName = (gearset['hands'] as GearItem)['Name'] as string
  const feetName = (gearset['feet'] as GearItem)['Name'] as string
  const backName = (gearset['back'] as GearItem)['Name'] as string
  const ammoType = (gearset['ammo'] as GearItem)['Type'] as string ?? 'None'

  // WAR
  if (jobs.includes('war')) {
    if (ab(abilities, 'Berserk')) {
      stats['Attack%'] = gs(stats,'Attack%') + 0.25 + 0.085 * +(mainName === 'Conqueror') + (100/1024) * +(mj === 'war')
      stats['Attack'] = gs(stats,'Attack') + 40 * +(mj === 'war')
      stats['Crit Rate'] = gs(stats,'Crit Rate') + 14 * +(mainName === 'Conqueror')
    }
    if (ab(abilities, 'Aggressor')) {
      stats['Accuracy'] = gs(stats,'Accuracy') + 25 + 20 * +(mj === 'war')
    }
    if (mj === 'war') {
      if (ab(abilities, 'Mighty Strikes')) {
        stats['Crit Rate'] = 100
        stats['Accuracy'] = gs(stats,'Accuracy') + 40
      }
    }
  }

  // MNK
  if (jobs.includes('mnk')) {
    if (mj === 'mnk') {
      if (ab(abilities, 'Focus')) {
        stats['Crit Rate'] = gs(stats,'Crit Rate') + 20
        stats['Accuracy'] = gs(stats,'Accuracy') + 100 + 20
      }
      if (ab(abilities, 'Footwork')) {
        stats['Kick Attacks'] = gs(stats,'Kick Attacks') + 20
        const kaBhikku = bodyName === 'Bhikku Gaiters +2' ? 130/1024 : 160/1024
        stats['Kick Attacks Attack%'] = gs(stats,'Kick Attacks Attack%') + 100/1024 + kaBhikku
        stats['Kick Attacks DMG'] = gs(stats,'Kick Attacks DMG') + 20 + 20
      }
      if (ab(abilities, 'Impetus')) {
        const imp = 0.9
        stats['Crit Rate'] = gs(stats,'Crit Rate') + 50 * imp
        stats['Attack'] = gs(stats,'Attack') + (100 + 40) * imp
        stats['Crit Damage'] = gs(stats,'Crit Damage') + 50 * imp * +(bodyName.includes('Bhikku Cyclas'))
        stats['Accuracy'] = gs(stats,'Accuracy') + 100 * imp * +(bodyName.includes('Bhikku Cyclas'))
      }
    }
    if (sj === 'mnk') {
      if (ab(abilities, 'Focus')) {
        const scale = 1 - (99 - subJobLevel) / 100
        stats['Crit Rate'] = gs(stats,'Crit Rate') + 20 * scale
        stats['Accuracy'] = gs(stats,'Accuracy') + 100 * scale
      }
    }
  }

  // BLM
  if (jobs.includes('blm')) {
    if (mj === 'blm') {
      if (ab(abilities, 'Manafont')) stats['Magic Damage'] = gs(stats,'Magic Damage') + 60
      if (ab(abilities, 'Manawell')) stats['Magic Damage'] = gs(stats,'Magic Damage') + 20
    }
  }

  // RDM
  if (jobs.includes('rdm')) {
    if (mj === 'rdm') {
      if (ab(abilities, 'Chainspell')) stats['Magic Damage'] = gs(stats,'Magic Damage') + 40
      if (ab(abilities, 'Composure')) {
        stats['Accuracy'] = gs(stats,'Accuracy') + 20 + 50
        stats['EnSpell Damage%'] = gs(stats,'EnSpell Damage%') + 200
      }
    }
  }

  // THF
  if (jobs.includes('thf')) {
    if (mj === 'thf') {
      if (ab(abilities, 'Conspirator')) {
        stats['Accuracy'] = gs(stats,'Accuracy') + 25 + 20
        stats['Subtle Blow'] = gs(stats,'Subtle Blow') + 50
        stats['Attack'] = gs(stats,'Attack') + 25 * +(bodyName.includes("Skulker's Vest"))
      }
    }
  }

  // PLD
  if (jobs.includes('pld')) {
    if (mj === 'pld') {
      if (ab(abilities, 'Divine Emblem')) {
        stats['Magic Damage'] = gs(stats,'Magic Damage') + 40
      }
      if (ab(abilities, 'Enlight II')) {
        const divSkill = Math.max(0, an(abilities, 'Enhancing Skill'))
        let enlightAcc: number
        if (divSkill <= 500) {
          enlightAcc = 2 * Math.trunc((divSkill + 85) / 13) + Math.trunc((divSkill + 85) / 26)
        } else {
          enlightAcc = 2 * Math.trunc((divSkill + 400) / 20) + Math.trunc((divSkill + 400) / 40)
        }
        stats['Accuracy'] = gs(stats,'Accuracy') + enlightAcc * 0.80 + 20
      }
    }
  }

  // DRK
  if (jobs.includes('drk')) {
    if (ab(abilities, 'Last Resort')) {
      stats['Attack%'] = gs(stats,'Attack%') + 256/1024 + 100/1024 * +(mj === 'drk')
      stats['Attack'] = gs(stats,'Attack') + 40 * +(mj === 'drk')
      if (two_handed.includes(mainSkillType)) {
        stats['JA Haste'] = gs(stats,'JA Haste') + 15 + 10 * +(mj === 'drk')
      }
    }
    if (mj === 'drk') {
      if (ab(abilities, 'Endark II')) {
        const darkSkill = an(abilities, 'Enhancing Skill')
        stats['Accuracy'] = gs(stats,'Accuracy') + 20
        stats['Attack'] = gs(stats,'Attack') + ((darkSkill + 20) / 13 + 5) * 2.5 * 0.80 + 20
      }
    }
  }

  // RNG
  if (jobs.includes('rng')) {
    if (ab(abilities, 'Sharpshot')) {
      stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + 40
      stats['Ranged Attack'] = gs(stats,'Ranged Attack') + 40 * +(mj === 'rng')
    }
    if (mj === 'rng') {
      if (ab(abilities, 'Barrage')) stats['Ranged Attack'] = gs(stats,'Ranged Attack') + 60
      if (ab(abilities, 'Velocity Shot')) {
        stats['Ranged Attack'] = gs(stats,'Ranged Attack') + 40
        stats['JA Haste'] = gs(stats,'JA Haste') - 15
        stats['Ranged Attack%'] = gs(stats,'Ranged Attack%') + 152/1024
          + 112/1024 * +(bodyName === 'Amini Caban +3')
          + 92/1024 * +(bodyName === 'Amini Caban +2')
          + 20/1024 * +(backName.includes('Belenus'))
      }
      if (ab(abilities, 'Double Shot')) {
        stats['Double Shot'] = gs(stats,'Double Shot') + 40 + 5 * +(bodyName.includes('Arcadian Jerkin'))
        if (bodyName.includes('Arcadian Jerkin')) {
          stats['Triple Shot'] = gs(stats,'Double Shot') / 2
          stats['Double Shot'] = gs(stats,'Double Shot') / 2
        }
      } else {
        stats['Double Shot'] = 0 + 5 * +(bodyName.includes('Arcadian Jerkin'))
        stats['Triple Shot'] = 0
      }
      if (ab(abilities, 'Hover Shot')) {
        stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + 100
      }
    }
  }

  // SAM
  if (jobs.includes('sam')) {
    if (ab(abilities, 'Hasso') && two_handed.includes(mainSkillType)) {
      if (mj === 'sam') {
        stats['STR'] = gs(stats,'STR') + 14 + 20
        const zan = gs(stats,'Zanshin')
        stats['Zanshin'] = zan > 100 ? 100 : zan
        stats['Zanhasso'] = gs(stats,'Zanshin') * 0.35
      } else {
        stats['STR'] = gs(stats,'STR') + Math.trunc(ml / 7)
      }
      stats['JA Haste'] = gs(stats,'JA Haste') + 10 + gs(stats,'Hasso+ JA Haste')
      stats['Accuracy'] = gs(stats,'Accuracy') + 10
    }
  }

  // NIN
  if (mj === 'nin') {
    if (ab(abilities, 'Sange') && ammoType === 'Shuriken') {
      stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + 100
      stats['Daken'] = 100
    }
    if (ab(abilities, 'Innin')) {
      const ip = 0.7
      stats['Accuracy'] = gs(stats,'Accuracy') + 20
      stats['Skillchain Bonus'] = gs(stats,'Skillchain Bonus') + 5
      stats['Magic Burst Damage Trait'] = gs(stats,'Magic Burst Damage Trait') + 5
      stats['Crit Rate'] = gs(stats,'Crit Rate') + (ip * (30 - 10) + 10)
      stats['Evasion'] = gs(stats,'Evasion') + (ip * (-30 - -10) + -10)
      stats['DA'] = gs(stats,'DA') + gs(stats,'Innin DA%')
    }
    if (ab(abilities, 'Futae')) {
      stats['Ninjutsu Magic Damage'] = gs(stats,'Ninjutsu Magic Damage') + 100
    }
  }

  // COR
  if (mj === 'cor') {
    if (ab(abilities, 'Triple Shot')) {
      stats['Triple Shot'] = gs(stats,'Triple Shot') + 40
      if (handsName.includes('Lanun Gants')) {
        stats['Quad Shot'] = gs(stats,'Triple Shot') / 2
        stats['Triple Shot'] = gs(stats,'Triple Shot') / 2
      }
    } else {
      stats['Triple Shot'] = 0
      stats['Quad Shot'] = 0
    }
  }

  // DNC
  if (mj === 'dnc') {
    if (ab(abilities, 'Building Flourish')) {
      stats['Crit Rate'] = gs(stats,'Crit Rate') + 10
      stats['Accuracy'] = gs(stats,'Accuracy') + 40
      stats['Attack%'] = gs(stats,'Attack%') + 0.25
      stats['Weapon Skill Damage'] = gs(stats,'Weapon Skill Damage') + gs(stats,'Building Flourish WSD')
    }
    if (ab(abilities, 'Saber Dance')) {
      stats['DA'] = gs(stats,'DA') + 25
    }
    if (ab(abilities, 'Closed Position')) {
      const dncFeet = feetName === 'Horos Toe Shoes +3' || feetName === 'Horos Toe Shoes +4'
      stats['Store TP'] = gs(stats,'Store TP') + 3 * 5 * +dncFeet
    }
  }

  // SCH
  if (mj === 'sch') {
    if (ab(abilities, 'Ebullience')) stats['Magic damage'] = gs(stats,'Magic Damage') + 40
    if (ab(abilities, 'Enlightenment')) {
      stats['INT'] = gs(stats,'INT') + 20
      stats['MND'] = gs(stats,'MND') + 20
    }
  }
  if (mj === 'sch' || sj === 'sch') {
    if (ab(abilities, 'Klimaform')) stats['Magic Accuracy'] = gs(stats,'Magic Accuracy') + 15
  }

  // GEO
  if (mj === 'geo') {
    if (ab(abilities, 'Theurgic Focus')) {
      stats['-ra Magic Attack'] = gs(stats,'-ra Magic Attack') + 50
      stats['-ra Magic damage'] = gs(stats,'-ra Magic Damage') + 60
    }
  }

  // RUN
  if (jobs.includes('run')) {
    if (ab(abilities, 'Swordplay')) {
      stats['Accuracy'] = gs(stats,'Accuracy') + 60 * 0.9
      stats['Evasion'] = gs(stats,'Evasion') + 60 * 0.9
    }
  }

  // BST
  if (mj === 'bst') {
    if (ab(abilities, 'Rage')) stats['Attack%'] = gs(stats,'Attack%') + 0.50
    if (ab(abilities, 'Frenzied Rage')) stats['Attack%'] = gs(stats,'Attack%') + 0.25
  }

  // PUP
  if (mj === 'pup') {
    if (mainName === 'Dragon Fangs') stats['Kick Attacks'] = gs(stats,'Kick Attacks') + 14
  }

  // Smite (2-handed or H2H)
  if ([...two_handed, 'Hand-to-Hand'].includes(mainSkillType)) {
    const smiteLvl = gs(stats,'Smite')
    const smiteMap: Record<number, number> = { 5:304/1024, 4:256/1024, 3:204/1024, 2:152/1024, 1:100/1024, 0:0 }
    stats['Attack%'] = gs(stats,'Attack%') + (smiteMap[smiteLvl] ?? 0)
  }

  // Fencer (1H non-H2H with shield/empty sub)
  if ((subType === 'Shield' || subType === 'None') && mainSkillType !== 'Hand-to-Hand' && !two_handed.includes(mainSkillType)) {
    const fLvl = Math.min(gs(stats,'Fencer'), 8)
    const fMap: Record<number, [number, number]> = { 0:[0,0],1:[200,3],2:[300,5],3:[400,7],4:[450,9],5:[500,10],6:[550,11],7:[600,12],8:[630,13] }
    const fb = fMap[fLvl] ?? [0,0]
    stats['TP Bonus'] = gs(stats,'TP Bonus') + fb[0] + gs(stats,'Fencer TP Bonus')
    stats['Crit Rate'] = gs(stats,'Crit Rate') + fb[1]
  }

  // Aftermath
  const aftermathLevel = an(abilities, 'Aftermath')
  const rangedName = (gearset['ranged'] as GearItem)['Name'] as string
  const mainName2 = (gearset['main'] as GearItem)['Name2'] as string ?? mainName

  if (aftermathLevel > 0) {
    // Relic aftermath
    const relicMap: Record<string, [string, number][]> = {
      Mandau: [['Crit Rate',5],['Crit Damage',5]],
      Ragnarok: [['Crit Rate',10],['Accuracy',15]],
      Guttler: [['Attack%',100/1024]],
      Bravura: [['DT',-20]],
      Apocalypse: [['JA Haste',10],['Accuracy',15]],
      Gungnir: [['Attack%',50/1024],['DA',5]],
      Kikoku: [['Attack%',100/1024],['Subtle Blow',10]],
      Amanomurakumo: [['Zanshin',10],['Store TP',10]],
      Mjollnir: [['Accuracy',20],['Magic Accuracy',20]],
      Claustrum: [['DT',-20]],
      Spharai: [['Kick Attacks',15],['Subtle Blow',10]],
    }
    if (mainName in relicMap) {
      for (const [stat, val] of relicMap[mainName]) {
        stats[stat] = gs(stats,stat) + val
      }
    }
    if (rangedName === 'Yoichinoyumi') stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + 30
    if (rangedName === 'Annihilator') stats['Ranged Attack%'] = gs(stats,'Ranged Attack%') + 100/1024

    // Mythic aftermath
    const mythicScaling = 0.85
    const myth99max = (99 - 40) * mythicScaling + 40
    const myth49max = (49 - 30) * mythicScaling + 30
    const mythicAmDict: Record<string, [string, number][]> = {
      Conqueror: [['Accuracy',myth49max],['Attack',myth99max]],
      Glanzfaust: [['Accuracy',myth49max],['Attack',myth99max]],
      Vajra: [['Accuracy',myth49max],['Attack',myth99max]],
      Gastraphetes: [['Ranged Accuracy',myth49max],['Ranged Attack',myth99max]],
      'Death Penalty': [['Ranged Accuracy',myth49max],['Ranged Attack',myth99max]],
      Burtgang: [['Accuracy',myth49max],['Attack',myth99max]],
      Liberator: [['Accuracy',myth49max],['Attack',myth99max]],
      Aymur: [['Accuracy',myth49max],['Attack',myth99max]],
      Kogarasumaru: [['Accuracy',myth49max],['Attack',myth99max]],
      Nagi: [['Accuracy',myth49max],['Attack',myth99max]],
      Nirvana: [['Accuracy',myth49max],['Attack',myth99max]],
      Ryunohige: [['Accuracy',myth49max],['Attack',myth99max]],
      Tizona: [['Accuracy',myth49max],['Magic Accuracy',myth49max]],
      Carnwenhan: [['Magic Accuracy',myth49max],['Accuracy',myth49max]],
      Yagrush: [['Magic Accuracy',myth49max],['Accuracy',myth49max]],
      Laevateinn: [['Magic Accuracy',myth49max],['Magic Attack',myth49max]],
      Tupsimati: [['Magic Accuracy',myth49max],['Magic Attack',myth49max]],
      Idris: [['Magic Accuracy',myth49max],['Magic Attack',myth49max]],
      Murgleis: [['Magic Accuracy',myth49max],['Magic Attack',myth49max]],
      Kenkonken: [['Accuracy',myth49max],['Attack',myth99max]],
      Terpsichore: [['Accuracy',myth49max],['Attack',myth99max]],
      Epeolatry: [['Accuracy',myth49max],['Attack',myth99max]],
    }
    if (mainName in mythicAmDict) {
      if (aftermathLevel === 3) {
        stats['OA2 main'] = gs(stats,'OA2 main') + 40
        stats['OA3 main'] = gs(stats,'OA3 main') + 20
      } else {
        const entry = mythicAmDict[mainName][aftermathLevel - 1]
        if (entry) stats[entry[0]] = gs(stats,entry[0]) + entry[1]
      }
    }
    if (rangedName in mythicAmDict && aftermathLevel in [1, 2]) {
      const entry = mythicAmDict[rangedName][aftermathLevel - 1]
      if (entry) stats[entry[0]] = gs(stats,entry[0]) + entry[1]
    }

    // Prime weapon aftermath
    const primeWeapons = ['Caliburnus','Dokoku','Earp','Foenaria','Gae Buide','Helheim','Kusanagi-no-Tsurugi','Laphria','Lorg Mor','Mpu Gandring','Opashoro','Pinaka','Spalirisos','Varga Purnikawa']
    if (primeWeapons.includes(mainName)) {
      const stage = mainName2.split(' ').pop() ?? 'IV'
      const pdlTable: Record<string, number[]> = { IV: [4,7,10], V: [6,9,12] }
      const mdmgTable: Record<string, number[]> = { IV: [20,20,20], V: [30,30,30] }
      const matkTable: Record<string, number[]> = { IV: [20,20,20], V: [30,30,30] }
      const pp = 0.6
      const pdlT = pdlTable[stage] ?? pdlTable['IV']
      const mdmgT = mdmgTable[stage] ?? mdmgTable['IV']
      const matkT = matkTable[stage] ?? matkTable['IV']

      let primePdl = 0, primeMdmg = 0, primeMatk = 0
      if (aftermathLevel === 1) {
        primePdl = (pdlT[1] - pdlT[0]) * pp + pdlT[0]
        primeMdmg = (mdmgT[1] - mdmgT[0]) * pp + mdmgT[0]
        primeMatk = (matkT[1] - matkT[0]) * pp + matkT[0]
      } else if (aftermathLevel === 2) {
        primePdl = (pdlT[2] - pdlT[1]) * pp + pdlT[1]
        primeMdmg = (mdmgT[2] - mdmgT[1]) * pp + mdmgT[1]
        primeMatk = (matkT[2] - matkT[1]) * pp + matkT[1]
      } else if (aftermathLevel === 3) {
        primePdl = pdlT[2]
        primeMdmg = mdmgT[2]
        primeMatk = matkT[2]
      }

      const primeAmDict: Record<string, [string, number][]> = {
        Caliburnus: [['PDL',primePdl]], Dokoku: [['PDL',primePdl]], Earp: [['PDL',primePdl]],
        Foenaria: [['PDL',primePdl]], 'Gae Buide': [['PDL',primePdl]], Helheim: [['PDL',primePdl]],
        'Kusanagi-no-Tsurugi': [['PDL',primePdl]], Laphria: [['PDL',primePdl]],
        'Lorg Mor': [['Magic Damage',primeMdmg]], 'Mpu Gandring': [['PDL',primePdl]],
        Opashoro: [['Magic Damage',primeMdmg],['Magic Attack',primeMatk]],
        Pinaka: [['PDL',primePdl]], Spalirisos: [['PDL',primePdl]], 'Varga Purnikawa': [['PDL',primePdl]],
      }
      if (mainName in primeAmDict) {
        for (const [stat, val] of primeAmDict[mainName]) {
          stats[stat] = gs(stats,stat) + val
        }
      }
    }
  }

  // Cross-job abilities
  if (ab(abilities, 'Blood Rage')) {
    stats['Crit Rate'] = gs(stats,'Crit Rate') + 20 + 20 * +(mj === 'war')
  }

  if (ab(abilities, 'Warcry')) {
    stats['Attack%'] = gs(stats,'Attack%') + Math.trunc(99/4 + 4.75) / 256
    stats['TP Bonus'] = gs(stats,'TP Bonus') + 500 + 200
    if (mj === 'war') stats['Attack'] = gs(stats,'Attack') + 60
  }

  if (ab(abilities, 'Warcry (sub)')) {
    stats['Attack%'] = gs(stats,'Attack%') + Math.trunc(ml / 4 + 4.75) / 256
  }

  if (ab(abilities, 'Crimson Howl')) {
    stats['Attack%'] = gs(stats,'Attack%') + Math.trunc(99/4 + 4.75) / 256
  }

  if (ab(abilities, 'Crystal Blessing')) stats['TP Bonus'] = gs(stats,'TP Bonus') + 250
  if (ab(abilities, "Ifrit's Favor")) stats['DA'] = gs(stats,'DA') + 25
  if (ab(abilities, "Shiva's Favor")) stats['Magic Attack'] = gs(stats,'Magic Attack') + 39
  if (ab(abilities, "Ramuh's Favor")) stats['Crit Rate'] = gs(stats,'Crit Rate') + 23

  if (ab(abilities, 'Haste Samba')) {
    stats['JA Haste'] = gs(stats,'JA Haste') + 10.1
  } else if (ab(abilities, 'Haste Samba (sub)')) {
    stats['JA Haste'] = gs(stats,'JA Haste') + 5.1
  }

  if (ab(abilities, "Nature's Meditation")) stats['Attack%'] = gs(stats,'Attack%') + 52/256
  if (ab(abilities, 'Mighty Guard')) {
    stats['Magic Haste'] = gs(stats,'Magic Haste') + 0.15
    stats['Magic Defense'] = gs(stats,'Magic Defense') + 15
  }
}

// ---------------------------------------------------------------------------
// finalizeStats
// ---------------------------------------------------------------------------

function finalizeStats(
  stats: Record<string, unknown>,
  mj: string,
  gearset: Gearset,
  abilities: Record<string, boolean | number | string>,
): void {
  const mainItem = gearset['main'] as GearItem
  const subItem = gearset['sub'] as GearItem
  const rangedItem = gearset['ranged'] as GearItem
  const ammoItem = gearset['ammo'] as GearItem

  const mainSkillType = (mainItem['Skill Type'] as string) ?? 'None'
  const subSkillType = (subItem['Skill Type'] as string) ?? 'None'
  const subType = (subItem['Type'] as string) ?? 'None'
  const rangedSkillType = (rangedItem['Skill Type'] as string) ?? 'None'
  const ammoSkillType = (ammoItem['Skill Type'] as string) ?? 'None'
  const ammoType = (ammoItem['Type'] as string) ?? 'None'
  const rangedType = (rangedItem['Type'] as string) ?? 'None'

  const two_handed = ['Great Sword','Great Katana','Great Axe','Polearm','Scythe','Staff']
  const dualWield = subType === 'Weapon' || mainSkillType === 'Hand-to-Hand'

  // Evasion from AGI and Evasion Skill
  const evaSkill = gs(stats,'Evasion Skill')
  stats['Evasion'] = gs(stats,'Evasion')
    + Math.trunc(0.5 * gs(stats,'AGI'))
    + (evaSkill > 300 ? 300 + 0.8 * (evaSkill - 300) : evaSkill)

  // Attack
  const mainSkillKey = mainSkillType + ' Skill'
  const subSkillKey = subSkillType + ' Skill'
  stats['Attack1'] = 8 + gs(stats,mainSkillKey) + gs(stats,'STR') + gs(stats,'Attack') + gs(stats,`main ${mainSkillKey}`)
  stats['Attack2'] = 8 + gs(stats,subSkillKey) + Math.trunc(0.5 * gs(stats,'STR')) + gs(stats,'Attack') + gs(stats,`sub ${subSkillKey}`)

  // Ranged Attack
  const rangedSkillKey = rangedSkillType + ' Skill'
  const ammoSkillKey = ammoSkillType + ' Skill'
  if (ammoSkillType === 'Throwing Skill') {
    stats['Ranged Attack'] = gs(stats,'Ranged Attack') + 8 + gs(stats,'Throwing Skill') + gs(stats,'STR')
  } else if (rangedSkillType === 'Marksmanship Skill' || rangedSkillType === 'Archery Skill') {
    stats['Ranged Attack'] = gs(stats,'Ranged Attack') + 8 + gs(stats,rangedSkillKey) + gs(stats,'STR')
  } else {
    stats['Ranged Attack'] = 0
  }

  // Attack%
  stats['Attack1'] = (stats['Attack1'] as number) * (1 + gs(stats,'Attack%'))
  stats['Attack2'] = (stats['Attack2'] as number) * (1 + gs(stats,'Attack%'))
  stats['Ranged Attack'] = gs(stats,'Ranged Attack') * (1 + gs(stats,'Ranged Attack%'))

  // Food attack (applied after Attack%)
  stats['Attack1'] = gs(stats,'Attack1') + gs(stats,'Food Attack')
  stats['Attack2'] = gs(stats,'Attack2') + gs(stats,'Food Attack')
  stats['Ranged Attack'] = gs(stats,'Ranged Attack') + gs(stats,'Food Ranged Attack')

  // Accuracy
  const mainSkillLevel = gs(stats,mainSkillKey) + gs(stats,`main ${mainSkillKey}`)
  const subSkillLevel = gs(stats,subSkillKey) + gs(stats,`sub ${subSkillKey}`)
  const rangedSkillLevel = gs(stats,rangedSkillKey)
  const ammoSkillLevel = gs(stats,ammoSkillKey)

  stats['Accuracy1'] = Math.trunc(0.75 * gs(stats,'DEX')) + gs(stats,'Accuracy') + getSkillAccuracy(mainSkillLevel)
  stats['Accuracy2'] = Math.trunc(0.75 * gs(stats,'DEX')) + gs(stats,'Accuracy') + getSkillAccuracy(subSkillLevel)

  if (ammoSkillType === 'Throwing Skill') {
    stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + Math.trunc(0.75 * gs(stats,'AGI')) + getSkillAccuracy(ammoSkillLevel)
  } else if (rangedSkillType === 'Marksmanship Skill' || rangedSkillType === 'Archery Skill') {
    stats['Ranged Accuracy'] = gs(stats,'Ranged Accuracy') + Math.trunc(0.75 * gs(stats,'AGI')) + getSkillAccuracy(rangedSkillLevel)
  }

  // Delay and DMG
  const martialArts = gs(stats,'Martial Arts')
  stats['Delay1'] = (mainItem['Delay'] as number) ?? (480 - martialArts)
  stats['Delay2'] = (subItem['Delay'] as number) ?? gs(stats,'Delay1')
  stats['Ranged Delay'] = (rangedItem['Delay'] as number) ?? 0
  stats['Ammo Delay'] = (ammoItem['Delay'] as number) ?? 0

  stats['DMG1'] = (mainItem['DMG'] as number) ?? 0
  stats['DMG2'] = (subItem['DMG'] as number) ?? 0
  stats['Ranged DMG'] = (rangedItem['DMG'] as number) ?? 0
  stats['Ammo DMG'] = (ammoItem['DMG'] as number) ?? 0

  // Zero-out inapplicable stats
  if (ammoType !== 'Shuriken' || mj !== 'nin') stats['Daken'] = 0
  if (mainSkillType !== 'Hand-to-Hand') {
    stats['Kick Attacks'] = 0
    stats['Martial Arts'] = 0
  }
  if (!two_handed.includes(mainSkillType)) stats['Zanshin'] = 0
  if (!['Gun','Bow','Crossbow'].includes(rangedType) && !['Bullet','Arrow','Bolt','Shuriken'].includes(ammoType)) {
    stats['Ranged Attack'] = 0
    stats['Ranged Accuracy'] = 0
  }
  if (!ab(abilities, 'True Shot')) stats['True Shot'] = 0

  // Off-hand when not dual wielding
  if (!dualWield) {
    stats['Attack2'] = 0
    stats['Accuracy2'] = 0
    stats['Delay2'] = stats['Delay1']
    stats['Dual Wield'] = 0
  }

  // Haste
  const gearHastePct = gs(stats,'Gear Haste') / 102.4
  const jaHastePct = gs(stats,'JA Haste') / 102.4
  const magicHaste = gs(stats,'Magic Haste')
  stats['Gear Haste'] = gearHastePct
  stats['JA Haste'] = jaHastePct
  stats['Magic Haste'] = magicHaste

  const cappedGear = Math.min(gearHastePct, 0.25)
  const cappedJa = Math.min(jaHastePct, 0.25)
  const cappedMagic = Math.min(magicHaste, 448/1024)
  const totalHaste = cappedGear + cappedJa + cappedMagic

  // H2H special case
  if (mainSkillType === 'Hand-to-Hand') {
    stats['Accuracy2'] = stats['Accuracy1']
    ;(gearset['sub'] as GearItem)['Skill Type'] = mainSkillType

    const h2hSkill = gs(stats,'Hand-to-Hand Skill') + gs(stats,'main Hand-to-Hand Skill')
    const baseDmg = 3 + Math.trunc(h2hSkill * 0.11)
    stats['DMG1'] = baseDmg + gs(stats,'DMG1')
    stats['DMG2'] = stats['DMG1']

    if (ab(abilities, 'Footwork')) {
      stats['Kick DMG'] = gs(stats,'DMG1') + gs(stats,'Kick Attacks DMG')
    } else {
      stats['Kick DMG'] = baseDmg + gs(stats,'Kick Attacks DMG')
    }

    const baseDelay0 = 480
    stats['Delay1'] = gs(stats,'Delay1') + baseDelay0
    stats['Delay2'] = stats['Delay1']
    const baseDelay = gs(stats,'Delay1')
    stats['Dual Wield'] = 0
    const reducedDelay = (baseDelay - martialArts) * (1 - totalHaste)
    stats['Delay Reduction'] = Math.min(1 - reducedDelay / baseDelay, 0.8)
  } else {
    stats['Kick DMG'] = 0
    const baseDelay = (gs(stats,'Delay1') + gs(stats,'Delay2')) / 2
    const reducedDelay = baseDelay * (1 - gs(stats,'Dual Wield') / 100) * (1 - totalHaste)
    const delayReduction = 1 - reducedDelay / baseDelay
    stats['Delay Reduction'] = Math.min(delayReduction, 0.8)
  }
}
