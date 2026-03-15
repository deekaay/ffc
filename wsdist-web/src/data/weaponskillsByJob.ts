import type { JobCode } from '@/stores/useCharacterStore'

const H2H = [
  'Combo', 'One Inch Punch', 'Raging Fists', 'Spinning Attack', 'Howling Fist',
  'Dragon Kick', 'Asuran Fists', 'Tornado Kick', 'Blitz', 'Stringing Pummel',
  'Victory Smite', 'Shijin Spiral', 'Final Heaven',
]
const DAGGER = [
  'Viper Bite', 'Dancing Edge', 'Death Blossom', 'Aeolian Edge', 'Evisceration',
  'Exenterator', 'Shark Bite', 'Pyrrhic Kleos', 'Mordant Rime',
]
const SWORD = [
  'Fast Blade', 'Burning Blade', 'Red Lotus Blade', 'Seraph Blade',
  'Shining Blade', 'Savage Blade', 'Expiacion', 'Sanguine Blade',
  'Chant du Cygne', 'Requiescat', 'Dimidiation',
]
const CLUB = [
  'Shining Strike', 'Seraph Strike', 'Black Halo', 'Hexa Strike', 'Judgment',
  'Retribution', 'Realmrazer', 'Mystic Boon', 'Exudation',
]
const GREAT_SWORD = [
  'Hard Slash', 'Armor Break', 'Weapon Break', 'Shield Break', 'Full Break',
  'Ground Strike', 'Spinning Slash', 'Herculean Slash', 'Resolution',
]
const AXE = [
  'Raging Axe', 'Spinning Axe', 'Rampage', 'Mistral Axe',
  'Decimation', 'Calamity', 'Ruinator', 'Bora Axe',
]
const GREAT_AXE = [
  'Heavy Swing', 'Raging Rush', 'Upheaval', 'Fell Cleave', 'Steel Cyclone', 'Onslaught',
]
const SCYTHE = [
  'Slice', 'Dark Harvest', 'Shadow of Death', 'Nightmare Scythe', 'Spinning Scythe',
  'Cross Reaper', 'Scourge', 'Catastrophe', 'Entropy', 'Infernal Scythe', 'Quietus',
]
const POLEARM = [
  'Double Thrust', 'Penta Thrust', 'Wheeling Thrust', 'Thunder Thrust', 'Raiden Thrust',
  'Impulse Drive', 'Stardiver', 'Geirskogul', 'Drakesbane', 'Sonic Thrust',
]
const KATANA = [
  'Blade: To', 'Blade: Chi', 'Blade: Jin', 'Blade: Retsu', 'Blade: Teki',
  'Blade: Ten', 'Blade: Ku', 'Blade: Yu', 'Blade: Hi', 'Blade: Shun',
  'Blade: Kamu', 'Blade: Metsu', 'Blade: Sui',
]
const GREAT_KATANA = [
  'Tachi: Enpi', 'Tachi: Hobaku', 'Tachi: Goten', 'Tachi: Kagero', 'Tachi: Jinpu',
  'Tachi: Koki', 'Tachi: Yukikaze', 'Tachi: Gekko', 'Tachi: Kaeru', 'Tachi: Rana',
  'Tachi: Fudo', 'Tachi: Shoha', 'Tachi: Ageha', 'Tachi: Massacren',
]
const STAFF = [
  'Heavy Swing', 'Shell Crusher', 'Full Swing', 'Retribution',
  'Shattersoul', 'Cataclysm', 'Omniscience', 'Vidohunir',
]
const BOW = [
  'Hot Shot', 'Split Shot', 'Sniper Shot', 'Sidewinder', 'Flaming Arrow',
  'Empyreal Arrow', 'Refulgent Arrow', 'Namas Arrow',
]
const GUN = [
  'Hot Shot', 'Split Shot', 'Sniper Shot', 'Slug Shot', 'Detonator',
  'Coronach', 'Wildfire', 'Last Stand',
]

/** All weapon skills available per job. Typed against JobCode for exhaustiveness. */
export const WS_BY_JOB: Record<JobCode, string[]> = {
  war: [...GREAT_AXE, ...AXE, ...GREAT_SWORD, ...SWORD, ...POLEARM],
  mnk: [...H2H],
  whm: [...CLUB, ...STAFF],
  blm: [...STAFF, ...CLUB],
  rdm: [...SWORD, ...DAGGER, ...CLUB, ...STAFF],
  thf: [...DAGGER, ...SWORD],
  pld: [...SWORD, ...GREAT_SWORD, ...CLUB],
  drk: [...GREAT_SWORD, ...SCYTHE, ...GREAT_AXE, ...SWORD, ...POLEARM],
  bst: [...AXE, ...GREAT_AXE, ...CLUB, ...SWORD],
  brd: [...SWORD, ...DAGGER, ...STAFF, ...CLUB, ...BOW, ...GUN],
  rng: [...BOW, ...GUN, ...SWORD, ...DAGGER],
  sam: [...GREAT_KATANA, ...KATANA],
  nin: [...KATANA, ...DAGGER, ...SWORD],
  drg: [...POLEARM, ...GREAT_SWORD, ...SWORD],
  smn: [...STAFF, ...CLUB],
  blu: [...SWORD, ...CLUB, ...STAFF],
  cor: [...GUN, ...SWORD, ...DAGGER],
  pup: [...H2H, ...STAFF, ...SWORD, ...GREAT_KATANA],
  dnc: [...DAGGER, ...SWORD],
  sch: [...STAFF, ...CLUB],
  geo: [...STAFF, ...CLUB],
  run: [...SWORD, ...GREAT_SWORD, ...POLEARM],
}

/** Sensible default WS per job shown on first load or after job change. */
export const DEFAULT_WS_BY_JOB: Record<JobCode, string> = {
  war: 'Upheaval',
  mnk: 'Victory Smite',
  whm: 'Hexa Strike',
  blm: 'Shattersoul',
  rdm: 'Chant du Cygne',
  thf: 'Evisceration',
  pld: 'Savage Blade',
  drk: 'Catastrophe',
  bst: 'Ruinator',
  brd: 'Chant du Cygne',
  rng: 'Empyreal Arrow',
  sam: 'Tachi: Fudo',
  nin: 'Blade: Hi',
  drg: 'Drakesbane',
  smn: 'Shattersoul',
  blu: 'Savage Blade',
  cor: 'Last Stand',
  pup: 'Victory Smite',
  dnc: 'Exenterator',
  sch: 'Shattersoul',
  geo: 'Shattersoul',
  run: 'Resolution',
}
