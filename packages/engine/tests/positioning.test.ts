import { describe, it, expect } from 'vitest';
import { optimizePositions } from '../src/positioning.js';
import type { UnitStats, WaveInfo } from '../src/types.js';
import wavesData from './__fixtures__/waves.json';
import unitsData from './__fixtures__/units.json';

const [waveGround, , waveAir] = wavesData as WaveInfo[];
const allUnits = unitsData as UnitStats[];
const byId = (id: string) => allUnits.find((u) => u.id === id)!;

const GRID = { w: 8, h: 6 };

describe('optimizePositions', () => {
  it('returns empty array for empty unit list', () => {
    expect(optimizePositions([], GRID, waveGround!)).toEqual([]);
  });

  it('returns one BuiltUnit per input unit', () => {
    const units = [byId('pierce_tank'), byId('impact_archer')];
    const result = optimizePositions(units, GRID, waveGround!);
    expect(result.length).toBe(2);
  });

  it('all positions are within grid bounds', () => {
    const result = optimizePositions(allUnits, GRID, waveGround!);
    for (const u of result) {
      expect(u.position.x).toBeGreaterThanOrEqual(0);
      expect(u.position.x).toBeLessThan(GRID.w);
      expect(u.position.y).toBeGreaterThanOrEqual(0);
      expect(u.position.y).toBeLessThan(GRID.h);
    }
  });

  it('no two units share a position', () => {
    const result = optimizePositions(allUnits, GRID, waveGround!);
    const keys = result.map((u) => `${u.position.x},${u.position.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('tanks (Melee, high HP) are placed at front rows (y ≤ 1)', () => {
    const tanks = [byId('pierce_tank'), byId('pure_tank'), byId('impact_tank')];
    const result = optimizePositions(tanks, GRID, waveGround!);
    for (const u of result) {
      expect(u.position.y).toBeLessThanOrEqual(1);
    }
  });

  it('ranged DPS placed at back rows (y ≥ 4) — no tanks, no splash, no anti-air context', () => {
    const dps = [byId('impact_archer'), byId('pierce_sniper'), byId('magic_caster')];
    const result = optimizePositions(dps, GRID, waveGround!);
    for (const u of result) {
      expect(u.position.y).toBeGreaterThanOrEqual(4);
    }
  });

  it('splash unit is placed at center columns (x = 3 or 4)', () => {
    const units = [byId('magic_splash')];
    const result = optimizePositions(units, GRID, waveGround!);
    expect([3, 4]).toContain(result[0]!.position.x);
  });

  it('anti-air units are spread vertically on air wave (y values differ)', () => {
    // Use two high-range units for air wave
    const antiAirUnits = [byId('pierce_sniper'), byId('antiair_mage')];
    const result = optimizePositions(antiAirUnits, GRID, waveAir!);
    const ys = result.map((u) => u.position.y);
    // Spread means not all on the same row
    const uniqueYs = new Set(ys);
    expect(uniqueYs.size).toBeGreaterThanOrEqual(2);
  });

  it('unit IDs in output match input unit IDs', () => {
    const units = [byId('pierce_tank'), byId('magic_caster')];
    const result = optimizePositions(units, GRID, waveGround!);
    const inputIds = new Set(units.map((u) => u.id));
    const outputIds = new Set(result.map((u) => u.unitId));
    expect(outputIds).toEqual(inputIds);
  });

  it('mixed build: tanks front, ranged back, rest middle', () => {
    const units = [byId('pierce_tank'), byId('impact_archer'), byId('swift_raider')];
    const result = optimizePositions(units, GRID, waveGround!);
    const byUnitId = Object.fromEntries(result.map((u) => [u.unitId, u.position]));
    expect(byUnitId['pierce_tank']!.y).toBeLessThanOrEqual(1); // tank → front
    expect(byUnitId['impact_archer']!.y).toBeGreaterThanOrEqual(4); // ranged → back
    expect(byUnitId['swift_raider']!.y).toBeGreaterThanOrEqual(2); // other → middle
    expect(byUnitId['swift_raider']!.y).toBeLessThanOrEqual(3);
  });
});
