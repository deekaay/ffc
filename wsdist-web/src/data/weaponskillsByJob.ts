// Weapon skills available per job, grouped by skill type.
// Only includes WSes that exist in weaponskillInfo.ts.

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
  'Fast Blade', 'Fast Blade II', 'Burning Blade', 'Red Lotus Blade', 'Seraph Blade',
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
  'Blade: To', 'Blade: Chi', 'Blade: Jin', 'Blade: Ten', 'Blade: Ku', 'Blade: Ei',
  'Blade: Yu', 'Blade: Metsu', 'Blade: Kamu', 'Blade: Hi', 'Blade: Shun',
  'Blade: Retsu', 'Blade: Teki', 'Zesho Meppo',
]
const GREAT_KATANA = [
  'Tachi: Enpi', 'Tachi: Jinpu', 'Tachi: Kagero', 'Tachi: Gekko', 'Tachi: Yukikaze',
  'Tachi: Kasha', 'Tachi: Shoha', 'Tachi: Kaiten', 'Tachi: Rana', 'Tachi: Fudo',
  'Tachi: Ageha', 'Tachi: Mumei', 'Tachi: Goten', 'Tachi: Koki',
]
const STAFF = [
  'Rock Crusher', 'Earth Crusher', 'Starburst', 'Sunburst', 'Full Swing',
  'Shell Crusher', 'Skullbreaker', 'Omniscience', 'Cataclysm', 'Vidohunir',
  'Shattersoul', 'Oshala', 'Sarv', 'Dagda', 'Maru Kala',
]
const BOW = [
  'Dulling Arrow', 'Sidewinder', 'Blast Arrow', 'Namas Arrow', 'Empyreal Arrow',
  'Piercing Arrow', 'Flaming Arrow', 'Refulgent Arrow', 'Apex Arrow',
]
const GUN = [
  'Slug Shot', 'Split Shot', 'Hot Shot', 'Blast Shot', 'Detonator',
  'Coronach', 'Last Stand', 'Trueflight', 'Leaden Salute', 'Wildfire',
]

export const WS_BY_JOB: Record<string, string[]> = {
  war: [...AXE, ...GREAT_AXE, ...GREAT_SWORD, ...SWORD, ...POLEARM, ...SCYTHE, ...DAGGER],
  mnk: [...H2H, ...DAGGER],
  whm: [...CLUB, ...STAFF],
  blm: [...STAFF, ...CLUB],
  rdm: [...SWORD, ...DAGGER],
  thf: [...DAGGER, ...SWORD],
  pld: [...SWORD, ...GREAT_SWORD, ...CLUB],
  drk: [...SCYTHE, ...GREAT_SWORD, ...AXE, ...SWORD, ...POLEARM],
  bst: [...AXE, ...GREAT_AXE, ...DAGGER],
  brd: [...DAGGER, ...SWORD],
  rng: [...BOW, ...GUN, ...AXE],
  sam: [...GREAT_KATANA, ...KATANA, ...POLEARM],
  nin: [...KATANA, ...DAGGER, ...SWORD],
  drg: [...POLEARM, ...SWORD],
  smn: [...STAFF, ...CLUB],
  blu: [...H2H, ...DAGGER, ...SWORD, ...GREAT_SWORD, ...CLUB, ...STAFF, ...POLEARM],
  pup: [...H2H, ...DAGGER, ...SWORD],
  dnc: [...DAGGER, ...SWORD],
  sch: [...STAFF, ...CLUB],
  geo: [...STAFF, ...CLUB],
  run: [...SWORD, ...GREAT_SWORD],
  cor: [...GUN, ...SWORD, ...DAGGER],
}

/** Default WS to select when switching to a job */
export const DEFAULT_WS_BY_JOB: Record<string, string> = {
  war: 'Upheaval',
  mnk: 'Asuran Fists',
  whm: 'Black Halo',
  blm: 'Omniscience',
  rdm: 'Chant du Cygne',
  thf: 'Evisceration',
  pld: 'Chant du Cygne',
  drk: 'Catastrophe',
  bst: 'Ruinator',
  brd: 'Evisceration',
  rng: 'Apex Arrow',
  sam: 'Tachi: Fudo',
  nin: 'Blade: Hi',
  drg: 'Stardiver',
  smn: 'Cataclysm',
  blu: 'Realmrazer',
  pup: 'Shijin Spiral',
  dnc: 'Pyrrhic Kleos',
  sch: 'Cataclysm',
  geo: 'Cataclysm',
  run: 'Resolution',
  cor: 'Leaden Salute',
}
