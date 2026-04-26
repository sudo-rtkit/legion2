import { describe, it, expect } from 'vitest';
import {
  calculateDamageScore,
  calculateSurvivalScore,
  calculateValueScore,
  calculateMetaScore,
  calculateSendScore,
} from '../src/scoring.js';
import type { DamageMatrix, WaveInfo, UnitStats } from '../src/types.js';
import matrixData from './__fixtures__/damage-matrix.json';
import wavesData from './__fixtures__/waves.json';
import unitsData from './__fixtures__/units.json';

const matrix = matrixData as unknown as DamageMatrix;
const [waveEarly, waveMid, waveLate] = wavesData as WaveInfo[];
const allUnits = unitsData as UnitStats[];
const unitsMap = new Map(allUnits.map((u) => [u.id, u]));

const pierceTank = unitsMap.get('pierce_tank')!;
const impactArcher = unitsMap.get('impact_archer')!;
const magicCaster = unitsMap.get('magic_caster')!;

describe('calculateDamageScore', () => {
  it('returns 0 for empty build', () => {
    expect(calculateDamageScore([], waveEarly!, matrix)).toBe(0);
  });

  it('Impact archer vs. Fortified wave: multiplier 1.25 improves score vs Pierce tank', () => {
    const pierceDmg = calculateDamageScore([pierceTank!], waveEarly!, matrix);
    const impactDmg = calculateDamageScore([impactArcher!], waveEarly!, matrix);
    // Impact vs Fortified = 1.25x, Pierce vs Fortified = 0.75x
    expect(impactDmg).toBeGreaterThan(pierceDmg);
  });

  it('more units means better damage score (capped at 1.0)', () => {
    const single = calculateDamageScore([impactArcher!], waveEarly!, matrix);
    const multi = calculateDamageScore(
      [impactArcher!, impactArcher!, impactArcher!],
      waveEarly!,
      matrix,
    );
    expect(multi).toBeGreaterThanOrEqual(single);
    expect(multi).toBeLessThanOrEqual(1.0);
  });

  it('score is capped at 1.0', () => {
    const score = calculateDamageScore(Array(20).fill(impactArcher!), waveEarly!, matrix);
    expect(score).toBe(1.0);
  });

  it('returns value in [0, 1]', () => {
    const score = calculateDamageScore([pierceTank!, impactArcher!], waveMid!, matrix);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('computes expected kill time for known values', () => {
    // impactArcher: dps=18, matrix[Impact][Fortified]=1.25 → effective dps=22.5
    // wave: amount=12, hp=120 → totalHp=1440 → killTime=1440/22.5=64s
    // score = 25/64 ≈ 0.39
    const score = calculateDamageScore([impactArcher!], waveEarly!, matrix);
    expect(score).toBeCloseTo(25 / 64, 3);
  });
});

describe('calculateSurvivalScore', () => {
  it('returns 0 for empty build', () => {
    expect(calculateSurvivalScore([], waveEarly!, matrix)).toBe(0);
  });

  it('Fortified armor survives Pierce wave better than Swift armor', () => {
    const swiftRaider = unitsMap.get('swift_raider')!;
    const survFortified = calculateSurvivalScore([pierceTank!], waveEarly!, matrix);
    const survSwift = calculateSurvivalScore([swiftRaider!], waveEarly!, matrix);
    // Pierce vs Fortified=0.75 (less damage), Pierce vs Swift=1.25 (more damage)
    // effectiveHp = hp / multiplier → hp/0.75 > hp/1.25
    expect(survFortified).toBeGreaterThan(survSwift);
  });

  it('score is capped at 1.0', () => {
    const score = calculateSurvivalScore(Array(20).fill(pierceTank!), waveEarly!, matrix);
    expect(score).toBe(1.0);
  });

  it('returns value in [0, 1] for late game wave', () => {
    const score = calculateSurvivalScore([pierceTank!, impactArcher!], waveLate!, matrix);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('calculateValueScore', () => {
  it('returns 0 for empty build', () => {
    expect(calculateValueScore([], 0, unitsMap)).toBe(0);
  });

  it('returns 0 when totalCost is 0', () => {
    expect(calculateValueScore([pierceTank!], 0, unitsMap)).toBe(0);
  });

  it('higher stat units give higher value score', () => {
    // magicCaster: dps=20, hp=250 → statPower=20+25=45, cost=70 → ratio=0.643 → score=0.32
    // impactArcher: dps=18, hp=200 → statPower=18+20=38, cost=60 → ratio=0.633 → score=0.32
    // Pure tank: dps=12, hp=800 → statPower=12+80=92, cost=80 → ratio=1.15 → score=0.575
    const pureTank = unitsMap.get('pure_tank')!;
    const scoreGood = calculateValueScore([pureTank!], pureTank!.cost, unitsMap);
    const scoreOk = calculateValueScore([impactArcher!], impactArcher!.cost, unitsMap);
    expect(scoreGood).toBeGreaterThan(scoreOk);
  });

  it('score is capped at 1.0', () => {
    const cheapHighStat: UnitStats = { ...pierceTank!, cost: 1, hp: 10000, dps: 1000 };
    expect(calculateValueScore([cheapHighStat], 1, unitsMap)).toBe(1.0);
  });
});

describe('calculateMetaScore', () => {
  it('returns 0.5 without metaStats', () => {
    expect(calculateMetaScore('any_hash')).toBe(0.5);
  });

  it('returns 0.5 for unknown hash in metaStats', () => {
    expect(calculateMetaScore('unknown', new Map())).toBe(0.5);
  });

  it('returns stored value for known hash', () => {
    const meta = new Map([['wolf,bear', 0.72]]);
    expect(calculateMetaScore('wolf,bear', meta)).toBe(0.72);
  });
});

describe('calculateSendScore', () => {
  it('always returns 0.5 in M2 (placeholder)', () => {
    expect(calculateSendScore([pierceTank!], undefined, unitsMap)).toBe(0.5);
    expect(calculateSendScore([pierceTank!], 'some_send', unitsMap)).toBe(0.5);
    expect(calculateSendScore([], undefined, unitsMap)).toBe(0.5);
  });
});
