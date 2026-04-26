import type { UnitStats, WaveInfo, DamageMatrix } from './types.js';

export function calculateDamageScore(
  build: UnitStats[],
  wave: WaveInfo,
  matrix: DamageMatrix,
): number {
  if (build.length === 0) return 0;
  const totalDps = build.reduce((sum, unit) => {
    return sum + unit.dps * matrix[unit.attackType][wave.unitArmorType];
  }, 0);
  const totalWaveHp = wave.amount * wave.unitHp;
  const expectedKillTime = totalWaveHp / Math.max(1, totalDps);
  return Math.min(1.0, 25 / Math.max(1, expectedKillTime));
}

export function calculateSurvivalScore(
  build: UnitStats[],
  wave: WaveInfo,
  matrix: DamageMatrix,
): number {
  if (build.length === 0) return 0;
  const totalEffectiveHp = build.reduce((sum, unit) => {
    return sum + unit.hp / Math.max(0.01, matrix[wave.unitAttackType][unit.armorType]);
  }, 0);
  const expectedDamageTaken = wave.unitDps * wave.amount * 30;
  return Math.min(1.0, totalEffectiveHp / Math.max(1, expectedDamageTaken));
}

export function calculateSendScore(
  _build: UnitStats[],
  _likelySend: string | undefined,
  _units: Map<string, UnitStats>,
): number {
  // M2 placeholder — send counter logic pending
  return 0.5;
}

export function calculateValueScore(
  build: UnitStats[],
  totalCost: number,
  _units: Map<string, UnitStats>,
): number {
  if (build.length === 0 || totalCost === 0) return 0;
  const statPower = build.reduce((sum, unit) => sum + unit.dps + unit.hp / 10, 0);
  const raw = statPower / Math.max(1, totalCost);
  // Saturation at 2.0: typical fighter dps~10 + hp/10~50 = 60 statPower / cost~50 = 1.2 → good value
  return Math.min(1.0, raw / 2.0);
}

export function calculateMetaScore(buildHash: string, metaStats?: Map<string, number>): number {
  if (!metaStats) return 0.5;
  return metaStats.get(buildHash) ?? 0.5;
}

export function weightedScore(breakdown: {
  damageScore: number;
  survivalScore: number;
  sendScore: number;
  valueScore: number;
  metaScore: number;
}): number {
  return (
    0.3 * breakdown.damageScore +
    0.25 * breakdown.survivalScore +
    0.15 * breakdown.sendScore +
    0.1 * breakdown.valueScore +
    0.2 * breakdown.metaScore
  );
}
