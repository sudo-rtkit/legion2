import {
  pgTable,
  text,
  real,
  integer,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const legions = pgTable('legions', {
  id: text().primaryKey(),
  name: text().notNull(),
  iconPath: text().notNull(),
  playable: boolean().notNull(),
});

export const units = pgTable('units', {
  id: text().primaryKey(), // unitId, e.g. "crab_unit_id"
  mongoId: text().notNull(),
  name: text().notNull(),
  version: text().notNull(),
  unitClass: text().notNull(),
  categoryClass: text().notNull(),
  legionId: text().notNull(),
  hp: real(),
  mp: real(),
  dps: real(),
  dmgBase: real(),
  dmgMax: real(),
  attackSpeed: real(),
  attackRange: real(),
  attackType: text().notNull(),
  attackMode: text().notNull(),
  armorType: text().notNull(),
  moveSpeed: real(),
  moveType: text().notNull(),
  goldCost: real(),
  goldBounty: real(),
  mythiumCost: real(),
  incomeBonus: real(),
  totalValue: real(),
  stockMax: integer(),
  stockTime: real(),
  iconPath: text().notNull(),
  splashPath: text().notNull(),
  description: text().notNull(),
  flags: jsonb().$type<string[]>().notNull().default([]),
  abilities: jsonb().$type<string[]>().notNull().default([]),
  upgradesFrom: jsonb().$type<string[]>().notNull().default([]),
  isEnabled: boolean().notNull(),
  sortOrder: text().notNull(),
  updatedAt: timestamp().notNull(),
});

export const waves = pgTable('waves', {
  id: text().primaryKey(), // api._id, e.g. "level1_wave_id"
  levelNum: integer().notNull(),
  name: text().notNull(),
  amount: integer().notNull(),
  amount2: integer(),
  waveUnitId: text().notNull(),
  spellUnit2Id: text('spell_unit_2_id'),
  prepareTime: integer().notNull(),
  totalReward: integer().notNull(),
  iconPath: text().notNull(),
  isKingWave: boolean().notNull(),
});

export const abilities = pgTable('abilities', {
  id: text().primaryKey(), // api._id
  abilityId: text().notNull(),
  name: text().notNull(),
  description: text().notNull(),
  iconPath: text().notNull(),
});

export const damageMatrix = pgTable(
  'damage_matrix',
  {
    attackType: text().notNull(),
    armorType: text().notNull(),
    multiplier: real().notNull(),
  },
  (t) => [primaryKey({ columns: [t.attackType, t.armorType] })],
);

export const patches = pgTable('patches', {
  version: text().primaryKey(),
  releasedAt: timestamp().notNull(),
  isCurrent: boolean().notNull().default(false),
});
