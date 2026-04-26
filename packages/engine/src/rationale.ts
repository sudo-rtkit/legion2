import type { UnitStats, WaveInfo, DamageMatrix, BuildRecommendation } from './types.js';

export function buildRationale(
  build: UnitStats[],
  wave: WaveInfo,
  matrix: DamageMatrix,
  scores: BuildRecommendation['breakdown'],
  _units: Map<string, UnitStats>,
): string[] {
  const lines: string[] = [];

  // 1. Damage type effectiveness vs. the incoming wave's armor
  const attackTypes = [...new Set(build.map((u) => u.attackType))];
  for (const at of attackTypes) {
    const mult = matrix[at][wave.unitArmorType];
    if (mult !== 1.0) {
      const dir = mult > 1.0 ? 'efektivní' : 'slabý';
      lines.push(`${at} damage je ${mult}× ${dir} vs. ${wave.unitArmorType} armor této vlny`);
    }
  }

  // 2. Survival assessment
  const surviveSecs = Math.round(30 * Math.min(1, scores.survivalScore));
  lines.push(
    `Survival score ${scores.survivalScore.toFixed(2)} — build vydrží ~${surviveSecs}s combat fáze`,
  );

  // 3. Gold cost
  const totalCost = build.reduce((s, u) => s + u.cost, 0);
  lines.push(`Build stojí ${totalCost}g`);

  // 4. Meta win-rate (only when metaStats are available — score differs from neutral 0.5)
  if (scores.metaScore !== 0.5) {
    const pct = Math.round(scores.metaScore * 100);
    lines.push(`Tato kombinace má průměrnou win-rate ${pct}% v aktuálním patchi`);
  }

  // 5. Overall score summary
  lines.push(
    `Celkové skóre: ${(scores.damageScore * 0.3 + scores.survivalScore * 0.25 + scores.valueScore * 0.1).toFixed(2)} (damage + survival + value složky)`,
  );

  return lines.slice(0, 5);
}
