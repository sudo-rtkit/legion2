import { Ltd2Client } from '@ltd2-coach/ltd2-client';
import { sql } from 'drizzle-orm';
import { db, sql as pgSql } from '../db/client.js';
import * as schema from '../db/schema.js';

const apiKey = process.env.LTD2_API_KEY;
if (!apiKey) throw new Error('LTD2_API_KEY is required');

const client = new Ltd2Client({ apiKey, maxRateWaitMs: 10_000 });

// LTD2 damage type multipliers (0.75-1.25 range, NOT 0.5-2.0 as in LTD1/WC3)
// Source: https://legiontd2.fandom.com/wiki/Attack_%26_Defense_Types (verified March 2026)
const DAMAGE_MATRIX: { attackType: string; armorType: string; multiplier: number }[] = [
  // Pierce: strong vs Swift+Arcane, weak vs Fortified+Natural, neutral vs Immaterial
  { attackType: 'Pierce', armorType: 'Swift', multiplier: 1.25 },
  { attackType: 'Pierce', armorType: 'Natural', multiplier: 0.75 },
  { attackType: 'Pierce', armorType: 'Arcane', multiplier: 1.25 },
  { attackType: 'Pierce', armorType: 'Fortified', multiplier: 0.75 },
  { attackType: 'Pierce', armorType: 'Immaterial', multiplier: 1.0 },
  // Impact: strong vs Fortified+Arcane, weak vs Swift+Natural, neutral vs Immaterial
  { attackType: 'Impact', armorType: 'Swift', multiplier: 0.75 },
  { attackType: 'Impact', armorType: 'Natural', multiplier: 0.75 },
  { attackType: 'Impact', armorType: 'Arcane', multiplier: 1.25 },
  { attackType: 'Impact', armorType: 'Fortified', multiplier: 1.25 },
  { attackType: 'Impact', armorType: 'Immaterial', multiplier: 1.0 },
  // Magic: strong vs Natural+Fortified, weak vs Arcane, neutral vs Swift+Immaterial
  { attackType: 'Magic', armorType: 'Swift', multiplier: 1.0 },
  { attackType: 'Magic', armorType: 'Natural', multiplier: 1.25 },
  { attackType: 'Magic', armorType: 'Arcane', multiplier: 0.75 },
  { attackType: 'Magic', armorType: 'Fortified', multiplier: 1.25 },
  { attackType: 'Magic', armorType: 'Immaterial', multiplier: 1.0 },
  // Pure: neutral vs everything (rare attack type — Atom, Ocean Templar, etc.)
  { attackType: 'Pure', armorType: 'Swift', multiplier: 1.0 },
  { attackType: 'Pure', armorType: 'Natural', multiplier: 1.0 },
  { attackType: 'Pure', armorType: 'Arcane', multiplier: 1.0 },
  { attackType: 'Pure', armorType: 'Fortified', multiplier: 1.0 },
  { attackType: 'Pure', armorType: 'Immaterial', multiplier: 1.0 },
];

async function run() {
  const now = new Date();
  let legionCount = 0;
  let waveCount = 0;
  let unitCount = 0;
  let fighterCount = 0;
  let abilityCount = 0;

  await db.transaction(async (tx) => {
    // 1. Legions
    const legions = await client.getLegions(0, 30);
    if (legions.length > 0) {
      await tx
        .insert(schema.legions)
        .values(
          legions.map((l) => ({
            id: l.id,
            name: l.name,
            iconPath: l.iconPath,
            playable: l.playable,
          })),
        )
        .onConflictDoUpdate({
          target: schema.legions.id,
          set: {
            name: sql`excluded.name`,
            iconPath: sql`excluded.icon_path`,
            playable: sql`excluded.playable`,
          },
        });
      legionCount = legions.length;
    }

    // 2. Waves (filter out level 0 "Empty")
    const allWaves = await client.getWaves(0, 30);
    const waves = allWaves.filter((w) => w.levelNum > 0);
    if (waves.length > 0) {
      await tx
        .insert(schema.waves)
        .values(
          waves.map((w) => ({
            id: w.id,
            levelNum: w.levelNum,
            name: w.name,
            amount: w.amount,
            amount2: w.amount2 ?? null,
            waveUnitId: w.waveUnitId,
            spellUnit2Id: w.spellUnit2Id ?? null,
            prepareTime: w.prepareTime,
            totalReward: w.totalReward,
            iconPath: w.iconPath,
            isKingWave: w.amount2 != null || w.spellUnit2Id != null,
          })),
        )
        .onConflictDoUpdate({
          target: schema.waves.id,
          set: {
            levelNum: sql`excluded.level_num`,
            name: sql`excluded.name`,
            amount: sql`excluded.amount`,
            amount2: sql`excluded.amount2`,
            waveUnitId: sql`excluded.wave_unit_id`,
            spellUnit2Id: sql`excluded.spell_unit_2_id`,
            prepareTime: sql`excluded.prepare_time`,
            totalReward: sql`excluded.total_reward`,
            iconPath: sql`excluded.icon_path`,
            isKingWave: sql`excluded.is_king_wave`,
          },
        });
      waveCount = waves.length;
    }

    // 3. Collect unique unit IDs from waves
    const unitIdSet = new Set<string>();
    for (const w of waves) {
      if (w.waveUnitId) unitIdSet.add(w.waveUnitId);
      if (w.spellUnit2Id) unitIdSet.add(w.spellUnit2Id);
    }

    // 4. Fetch and upsert creature units discovered from waves
    // Fighter units cannot be discovered this way — skipped below
    for (const unitId of unitIdSet) {
      const unit = await client.getUnitById(unitId);
      await tx
        .insert(schema.units)
        .values({
          id: unit.unitId,
          mongoId: unit.id,
          name: unit.name,
          version: unit.version,
          unitClass: unit.unitClass,
          categoryClass: unit.categoryClass,
          legionId: unit.legionId,
          hp: unit.hp,
          mp: unit.mp,
          dps: unit.dps,
          dmgBase: unit.dmgBase,
          dmgMax: unit.dmgMax,
          attackSpeed: unit.attackSpeed,
          attackRange: unit.attackRange,
          attackType: unit.attackType,
          attackMode: unit.attackMode,
          armorType: unit.armorType,
          moveSpeed: unit.moveSpeed,
          moveType: unit.moveType,
          goldCost: unit.goldCost,
          goldBounty: unit.goldBounty,
          mythiumCost: unit.mythiumCost,
          incomeBonus: unit.incomeBonus,
          totalValue: unit.totalValue,
          stockMax: unit.stockMax != null ? Math.round(unit.stockMax) : null,
          stockTime: unit.stockTime,
          iconPath: unit.iconPath,
          splashPath: unit.splashPath,
          description: unit.description,
          flags: unit.flags,
          abilities: unit.abilities,
          upgradesFrom: unit.upgradesFrom,
          isEnabled: unit.isEnabled,
          sortOrder: unit.sortOrder,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.units.id,
          set: {
            mongoId: sql`excluded.mongo_id`,
            name: sql`excluded.name`,
            version: sql`excluded.version`,
            unitClass: sql`excluded.unit_class`,
            categoryClass: sql`excluded.category_class`,
            legionId: sql`excluded.legion_id`,
            hp: sql`excluded.hp`,
            mp: sql`excluded.mp`,
            dps: sql`excluded.dps`,
            dmgBase: sql`excluded.dmg_base`,
            dmgMax: sql`excluded.dmg_max`,
            attackSpeed: sql`excluded.attack_speed`,
            attackRange: sql`excluded.attack_range`,
            attackType: sql`excluded.attack_type`,
            attackMode: sql`excluded.attack_mode`,
            armorType: sql`excluded.armor_type`,
            moveSpeed: sql`excluded.move_speed`,
            moveType: sql`excluded.move_type`,
            goldCost: sql`excluded.gold_cost`,
            goldBounty: sql`excluded.gold_bounty`,
            mythiumCost: sql`excluded.mythium_cost`,
            incomeBonus: sql`excluded.income_bonus`,
            totalValue: sql`excluded.total_value`,
            stockMax: sql`excluded.stock_max`,
            stockTime: sql`excluded.stock_time`,
            iconPath: sql`excluded.icon_path`,
            splashPath: sql`excluded.splash_path`,
            description: sql`excluded.description`,
            flags: sql`excluded.flags`,
            abilities: sql`excluded.abilities`,
            upgradesFrom: sql`excluded.upgrades_from`,
            isEnabled: sql`excluded.is_enabled`,
            sortOrder: sql`excluded.sort_order`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
      unitCount++;
    }

    // 5. Fighter units — paginated byVersion, filter unitClass === 'Fighter'
    const versionRows = await tx
      .select({ version: schema.units.version })
      .from(schema.units)
      .limit(1);
    if (versionRows.length > 0) {
      const version = versionRows[0]!.version;
      const limit = 50;
      let offset = 0;
      while (true) {
        const page = await client.getUnitsByVersion(version, offset, limit);
        if (page.length === 0) break;
        const fighters = page.filter((u) => u.unitClass === 'Fighter');
        if (fighters.length > 0) {
          await tx
            .insert(schema.units)
            .values(
              fighters.map((u) => ({
                id: u.unitId,
                mongoId: u.id,
                name: u.name,
                version: u.version,
                unitClass: u.unitClass,
                categoryClass: u.categoryClass,
                legionId: u.legionId,
                hp: u.hp,
                mp: u.mp,
                dps: u.dps,
                dmgBase: u.dmgBase,
                dmgMax: u.dmgMax,
                attackSpeed: u.attackSpeed,
                attackRange: u.attackRange,
                attackType: u.attackType,
                attackMode: u.attackMode,
                armorType: u.armorType,
                moveSpeed: u.moveSpeed,
                moveType: u.moveType,
                goldCost: u.goldCost,
                goldBounty: u.goldBounty,
                mythiumCost: u.mythiumCost,
                incomeBonus: u.incomeBonus,
                totalValue: u.totalValue,
                stockMax: u.stockMax != null ? Math.round(u.stockMax) : null,
                stockTime: u.stockTime,
                iconPath: u.iconPath,
                splashPath: u.splashPath,
                description: u.description,
                flags: u.flags,
                abilities: u.abilities,
                upgradesFrom: u.upgradesFrom,
                isEnabled: u.isEnabled,
                sortOrder: u.sortOrder,
                updatedAt: now,
              })),
            )
            .onConflictDoUpdate({
              target: schema.units.id,
              set: {
                mongoId: sql`excluded.mongo_id`,
                name: sql`excluded.name`,
                version: sql`excluded.version`,
                unitClass: sql`excluded.unit_class`,
                categoryClass: sql`excluded.category_class`,
                legionId: sql`excluded.legion_id`,
                hp: sql`excluded.hp`,
                mp: sql`excluded.mp`,
                dps: sql`excluded.dps`,
                dmgBase: sql`excluded.dmg_base`,
                dmgMax: sql`excluded.dmg_max`,
                attackSpeed: sql`excluded.attack_speed`,
                attackRange: sql`excluded.attack_range`,
                attackType: sql`excluded.attack_type`,
                attackMode: sql`excluded.attack_mode`,
                armorType: sql`excluded.armor_type`,
                moveSpeed: sql`excluded.move_speed`,
                moveType: sql`excluded.move_type`,
                goldCost: sql`excluded.gold_cost`,
                goldBounty: sql`excluded.gold_bounty`,
                mythiumCost: sql`excluded.mythium_cost`,
                incomeBonus: sql`excluded.income_bonus`,
                totalValue: sql`excluded.total_value`,
                stockMax: sql`excluded.stock_max`,
                stockTime: sql`excluded.stock_time`,
                iconPath: sql`excluded.icon_path`,
                splashPath: sql`excluded.splash_path`,
                description: sql`excluded.description`,
                flags: sql`excluded.flags`,
                abilities: sql`excluded.abilities`,
                upgradesFrom: sql`excluded.upgrades_from`,
                isEnabled: sql`excluded.is_enabled`,
                sortOrder: sql`excluded.sort_order`,
                updatedAt: sql`excluded.updated_at`,
              },
            });
          fighterCount += fighters.length;
        }
        if (page.length < limit) break;
        offset += limit;
      }
    }

    // 6. Abilities (best-effort, paginated with limit ≤ 50)
    try {
      const PAGE = 50;
      let offset = 0;
      while (true) {
        const page = await client.getAbilities(offset, PAGE);
        if (page.length === 0) break;
        await tx
          .insert(schema.abilities)
          .values(
            page.map((a) => ({
              id: a.id,
              abilityId: a.abilityId,
              name: a.name,
              description: a.description,
              iconPath: a.iconPath,
            })),
          )
          .onConflictDoUpdate({
            target: schema.abilities.id,
            set: {
              abilityId: sql`excluded.ability_id`,
              name: sql`excluded.name`,
              description: sql`excluded.description`,
              iconPath: sql`excluded.icon_path`,
            },
          });
        abilityCount += page.length;
        if (page.length < PAGE) break;
        offset += PAGE;
      }
    } catch (err) {
      console.log(
        'TODO: abilities endpoint error —',
        err instanceof Error ? err.message : String(err),
      );
    }

    // 7. Damage matrix (hardcoded seed, idempotent)
    await tx
      .insert(schema.damageMatrix)
      .values(DAMAGE_MATRIX)
      .onConflictDoUpdate({
        target: [schema.damageMatrix.attackType, schema.damageMatrix.armorType],
        set: { multiplier: sql`excluded.multiplier` },
      });

    // 8. Patches — derive current version from synced units
    const versions = await tx.select({ version: schema.units.version }).from(schema.units);
    if (versions.length > 0) {
      const currentVersion = versions[0]!.version;
      await tx.update(schema.patches).set({ isCurrent: false });
      await tx
        .insert(schema.patches)
        .values({ version: currentVersion, releasedAt: now, isCurrent: true })
        .onConflictDoUpdate({
          target: schema.patches.version,
          set: { isCurrent: true, releasedAt: sql`excluded.released_at` },
        });
    }
  });

  console.log(
    `Synced ${legionCount} legions, ${waveCount} waves, ${unitCount} creature units, ${fighterCount} fighters, ${abilityCount} abilities, ${DAMAGE_MATRIX.length} matrix entries`,
  );

  await pgSql.end();
}

await run();
