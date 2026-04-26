import { describe, it, expect } from 'vitest';
import { recommendBuilds } from '../src/index.js';
import type { GameState, DamageMatrix, UnitStats, WaveInfo } from '../src/types.js';
import matrixData from './__fixtures__/damage-matrix.json';
import wavesData from './__fixtures__/waves.json';
import unitsData from './__fixtures__/units.json';

const matrix = matrixData as unknown as DamageMatrix;
const [, waveMid] = wavesData as WaveInfo[];
const allUnits = unitsData as UnitStats[];
const unitsMap = new Map(allUnits.map((u) => [u.id, u]));
const deps = { damageMatrix: matrix, units: unitsMap };

const state: GameState = {
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
};

describe('benchmark', () => {
  it('recommendBuilds completes in < 100ms', () => {
    const start = Date.now();
    const results = recommendBuilds(state, deps);
    const elapsed = Date.now() - start;
    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });

  it('100 consecutive recommendBuilds calls complete in < 500ms', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      recommendBuilds(state, deps);
    }
    expect(Date.now() - start).toBeLessThan(500);
  });
});
