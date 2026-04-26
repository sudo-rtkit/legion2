import { describe, it, expect } from 'vitest';
import { findBestBuilds, recommendBuilds } from '../src/index.js';
import type { GameState, DamageMatrix, UnitStats, WaveInfo } from '../src/types.js';
import matrixData from './__fixtures__/damage-matrix.json';
import wavesData from './__fixtures__/waves.json';
import unitsData from './__fixtures__/units.json';

const matrix = matrixData as unknown as DamageMatrix;
const [, waveMid] = wavesData as WaveInfo[];
const allUnits = unitsData as UnitStats[];
const unitsMap = new Map(allUnits.map((u) => [u.id, u]));

const deps = { damageMatrix: matrix, units: unitsMap };

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    wave: 5,
    availableGold: 1000,
    availableMythium: 0,
    workerCount: 5,
    rolledFighters: [
      'pierce_tank',
      'impact_archer',
      'magic_caster',
      'pure_tank',
      'pierce_sniper',
      'impact_tank',
    ],
    alreadyBuilt: [],
    laneGridSize: { w: 8, h: 6 },
    incomingWave: waveMid!,
    ...overrides,
  };
}

describe('findBestBuilds', () => {
  it('returns up to 3 recommendations', () => {
    const results = findBestBuilds(makeState(), deps);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('each recommendation cost ≤ availableGold', () => {
    const state = makeState({ availableGold: 1000 });
    for (const rec of findBestBuilds(state, deps)) {
      expect(rec.totalCost).toBeLessThanOrEqual(1000);
    }
  });

  it('each recommendation leftoverGold = availableGold - totalCost', () => {
    const state = makeState({ availableGold: 1000 });
    for (const rec of findBestBuilds(state, deps)) {
      expect(rec.leftoverGold).toBe(1000 - rec.totalCost);
    }
  });

  it('all scores are in [0, 1]', () => {
    for (const rec of findBestBuilds(makeState(), deps)) {
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(1);
      for (const val of Object.values(rec.breakdown)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('results are sorted best-first', () => {
    const results = findBestBuilds(makeState(), deps);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it('returns empty array for empty rolledFighters', () => {
    expect(findBestBuilds(makeState({ rolledFighters: [] }), deps)).toEqual([]);
  });

  it('returns empty array when no roll fits the budget', () => {
    expect(findBestBuilds(makeState({ availableGold: 1 }), deps)).toEqual([]);
  });

  it('returns empty array for unknown unit IDs', () => {
    expect(findBestBuilds(makeState({ rolledFighters: ['unknown_unit'] }), deps)).toEqual([]);
  });

  it('respects multiset duplicates — can use same ID twice if rolled twice', () => {
    const state = makeState({
      rolledFighters: ['pierce_tank', 'pierce_tank'],
      availableGold: 200,
    });
    const results = findBestBuilds(state, deps);
    // pierce_tank costs 50, two of them = 100, within 200 gold budget
    const double = results.find(
      (r) => r.units.filter((u) => u.unitId === 'pierce_tank').length === 2,
    );
    expect(double).toBeDefined();
  });

  it('does not exceed roll count — cannot use same ID more than rolled', () => {
    // Only 1 pierce_tank in rolls; should not appear twice
    const state = makeState({
      rolledFighters: ['pierce_tank'],
      availableGold: 200,
    });
    for (const rec of findBestBuilds(state, deps)) {
      const count = rec.units.filter((u) => u.unitId === 'pierce_tank').length;
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it('recommendations are deduplicated (same build hash appears once)', () => {
    const results = findBestBuilds(makeState(), deps);
    const hashes = results.map((r) => [...r.units.map((u) => u.unitId)].sort().join(','));
    const unique = new Set(hashes);
    expect(unique.size).toBe(hashes.length);
  });
});

describe('recommendBuilds', () => {
  it('positions are within grid bounds', () => {
    for (const rec of recommendBuilds(makeState(), deps)) {
      for (const unit of rec.units) {
        expect(unit.position.x).toBeGreaterThanOrEqual(0);
        expect(unit.position.x).toBeLessThan(8);
        expect(unit.position.y).toBeGreaterThanOrEqual(0);
        expect(unit.position.y).toBeLessThan(6);
      }
    }
  });

  it('no two units share the same position', () => {
    for (const rec of recommendBuilds(makeState(), deps)) {
      const positions = rec.units.map((u) => `${u.position.x},${u.position.y}`);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('rationale has between 1 and 5 entries', () => {
    for (const rec of recommendBuilds(makeState(), deps)) {
      expect(rec.rationale.length).toBeGreaterThanOrEqual(1);
      expect(rec.rationale.length).toBeLessThanOrEqual(5);
    }
  });

  it('rationale strings are non-empty', () => {
    for (const rec of recommendBuilds(makeState(), deps)) {
      for (const line of rec.rationale) {
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });
});
