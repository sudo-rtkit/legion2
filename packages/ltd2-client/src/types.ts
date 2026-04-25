// ── Raw API response shapes ────────────────────────────────────────────────
// All numeric fields arrive as strings (Mongo export). Only booleans are real
// booleans (isEnabled, playable). Empty values are "" not null.

export interface ApiUnit {
  _id: string;
  unitId: string;
  version: string;
  name: string;
  armorType: string;
  attackType: string;
  attackMode: string;
  attackRange: string;
  attackSpeed: string;
  aspdInverted: string;
  hp: string;
  dps: string;
  dmgBase: string;
  dmgMax: string;
  dmgExpected: string;
  moveType: string;
  moveSpeed: string;
  mspdText: string;
  radius: string;
  rangeText: string;
  modelScale: string;
  flags: string;
  goldBounty: string;
  goldCost: string;
  goldValue: string;
  totalValue: string;
  incomeBonus: string;
  mythiumCost: string;
  mp: string;
  stockMax: string;
  stockTime: string;
  infoTier: string;
  infoSketchfab: string;
  iconPath: string;
  splashPath: string;
  categoryClass: string;
  unitClass: string;
  legionId: string;
  abilities: string[];
  upgradesFrom: string[];
  description: string;
  descriptionId: string;
  tooltip: string;
  sortOrder: string;
  isEnabled: boolean;
  avgAspd: string;
  avgAspdDiff: string;
  avgCost: string;
  avgCostDiff: string;
  avgDmg: string;
  avgDmgDiff: string;
  avgHp: string;
  avgHpDiff: string;
  avgMspd: string;
  avgMspdDiff: string;
}

export interface ApiWave {
  _id: string;
  category: string;
  levelNum: string;
  name: string;
  amount: string;
  amount2?: string;
  prepareTime: string;
  totalReward: string;
  waveUnitId: string;
  spellUnit2Id?: string;
  iconPath: string;
}

export interface ApiLegion {
  _id: string;
  category: string;
  name: string;
  iconPath: string;
  playable: boolean;
}

export interface ApiAbility {
  _id: string;
  abilityId?: string;
  name: string;
  description?: string;
  iconPath?: string;
}

export interface ApiPlayerSnapshot {
  playerId: string;
  playerName: string;
  legion: string;
  fighters: string[];
  spells: string[];
  workers: number;
  income: number;
  networth: number;
}

export interface ApiMatch {
  _id: string;
  date: string;
  queueType: string;
  gameLength: number;
  endingWave: number;
  leftTeam: ApiPlayerSnapshot[];
  rightTeam: ApiPlayerSnapshot[];
}

export interface ApiPlayer {
  _id: string;
  playerName: string;
  overallElo?: number;
  gamesPlayed?: number;
  winRate?: number;
  profileIconId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function numOrNull(s: string | undefined): number | null {
  if (s === undefined || s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ── Parsed types ───────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  unitId: string;
  version: string;
  name: string;
  armorType: string;
  attackType: string;
  attackMode: string;
  attackRange: number | null;
  attackSpeed: number | null;
  hp: number | null;
  mp: number | null;
  dps: number | null;
  dmgBase: number | null;
  dmgMax: number | null;
  dmgExpected: number | null;
  moveType: string;
  moveSpeed: number | null;
  mspdText: string;
  goldBounty: number | null;
  goldCost: number | null;
  totalValue: number | null;
  incomeBonus: number | null;
  mythiumCost: number | null;
  stockMax: number | null;
  stockTime: number | null;
  categoryClass: string;
  unitClass: string;
  legionId: string;
  flags: string[];
  abilities: string[];
  upgradesFrom: string[];
  iconPath: string;
  splashPath: string;
  sortOrder: string;
  tooltip: string;
  description: string;
  isEnabled: boolean;
  avgHp: number | null;
  avgDmg: number | null;
  avgCost: number | null;
  avgMspd: number | null;
  avgAspd: number | null;
}

export function parseApiUnit(api: ApiUnit): Unit {
  return {
    id: api._id,
    unitId: api.unitId,
    version: api.version,
    name: api.name,
    armorType: api.armorType,
    attackType: api.attackType,
    attackMode: api.attackMode,
    attackRange: numOrNull(api.attackRange),
    attackSpeed: numOrNull(api.attackSpeed),
    hp: numOrNull(api.hp),
    mp: numOrNull(api.mp),
    dps: numOrNull(api.dps),
    dmgBase: numOrNull(api.dmgBase),
    dmgMax: numOrNull(api.dmgMax),
    dmgExpected: numOrNull(api.dmgExpected),
    moveType: api.moveType,
    moveSpeed: numOrNull(api.moveSpeed),
    mspdText: api.mspdText,
    goldBounty: numOrNull(api.goldBounty),
    goldCost: numOrNull(api.goldCost),
    totalValue: numOrNull(api.totalValue),
    incomeBonus: numOrNull(api.incomeBonus),
    mythiumCost: numOrNull(api.mythiumCost),
    stockMax: numOrNull(api.stockMax),
    stockTime: numOrNull(api.stockTime),
    categoryClass: api.categoryClass,
    unitClass: api.unitClass,
    legionId: api.legionId,
    flags: api.flags ? api.flags.split(',').filter(Boolean) : [],
    abilities: api.abilities,
    upgradesFrom: api.upgradesFrom,
    iconPath: api.iconPath,
    splashPath: api.splashPath,
    sortOrder: api.sortOrder,
    tooltip: api.tooltip,
    description: api.description,
    isEnabled: api.isEnabled,
    avgHp: numOrNull(api.avgHp),
    avgDmg: numOrNull(api.avgDmg),
    avgCost: numOrNull(api.avgCost),
    avgMspd: numOrNull(api.avgMspd),
    avgAspd: numOrNull(api.avgAspd),
  };
}

export interface Wave {
  id: string;
  levelNum: number;
  name: string;
  amount: number;
  amount2: number | null;
  prepareTime: number;
  totalReward: number;
  waveUnitId: string;
  spellUnit2Id: string | null;
  iconPath: string;
}

export function parseApiWave(api: ApiWave): Wave {
  return {
    id: api._id,
    levelNum: Number(api.levelNum),
    name: api.name,
    amount: Number(api.amount),
    amount2: api.amount2 !== undefined && api.amount2 !== '' ? Number(api.amount2) : null,
    prepareTime: Number(api.prepareTime),
    totalReward: Number(api.totalReward),
    waveUnitId: api.waveUnitId,
    spellUnit2Id: api.spellUnit2Id ?? null,
    iconPath: api.iconPath,
  };
}

export interface Legion {
  id: string;
  name: string;
  iconPath: string;
  playable: boolean;
}

export function parseApiLegion(api: ApiLegion): Legion {
  return {
    id: api._id,
    name: api.name,
    iconPath: api.iconPath,
    playable: api.playable,
  };
}

export interface Ability {
  id: string;
  abilityId: string;
  name: string;
  description: string;
  iconPath: string;
}

export function parseApiAbility(api: ApiAbility): Ability {
  return {
    id: api._id,
    abilityId: api.abilityId ?? api._id,
    name: api.name,
    description: api.description ?? '',
    iconPath: api.iconPath ?? '',
  };
}

export interface PlayerSnapshot {
  playerId: string;
  playerName: string;
  legion: string;
  fighters: string[];
  spells: string[];
  workers: number;
  income: number;
  networth: number;
}

export interface Match {
  id: string;
  date: string;
  queueType: string;
  gameLength: number;
  endingWave: number;
  leftTeam: PlayerSnapshot[];
  rightTeam: PlayerSnapshot[];
}

export function parseApiMatch(api: ApiMatch): Match {
  return {
    id: api._id,
    date: api.date,
    queueType: api.queueType,
    gameLength: api.gameLength,
    endingWave: api.endingWave,
    leftTeam: api.leftTeam,
    rightTeam: api.rightTeam,
  };
}

export interface Player {
  id: string;
  playerName: string;
  overallElo: number | null;
  gamesPlayed: number | null;
  winRate: number | null;
  profileIconId: string | null;
}

export function parseApiPlayer(api: ApiPlayer): Player {
  return {
    id: api._id,
    playerName: api.playerName,
    overallElo: api.overallElo ?? null,
    gamesPlayed: api.gamesPlayed ?? null,
    winRate: api.winRate ?? null,
    profileIconId: api.profileIconId ?? null,
  };
}
