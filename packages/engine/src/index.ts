import type { GameState, BuildRecommendation, UnitStats } from './types.js';
import { findBestBuilds, type SearchDeps } from './search.js';
import { optimizePositions } from './positioning.js';
import { buildRationale } from './rationale.js';

export { findBestBuilds } from './search.js';
export { optimizePositions } from './positioning.js';
export { buildRationale } from './rationale.js';
export {
  calculateDamageScore,
  calculateSurvivalScore,
  calculateSendScore,
  calculateValueScore,
  calculateMetaScore,
} from './scoring.js';

export type {
  GameState,
  BuildRecommendation,
  BuiltUnit,
  UnitStats,
  WaveInfo,
  DamageMatrix,
  ArmorType,
  AttackType,
} from './types.js';

export type { SearchDeps };

export function recommendBuilds(state: GameState, deps: SearchDeps): BuildRecommendation[] {
  const candidates = findBestBuilds(state, deps);

  return candidates.map((candidate) => {
    const unitStats = candidate.units
      .map((u) => deps.units.get(u.unitId))
      .filter((u): u is UnitStats => u !== undefined);

    const positionedUnits = optimizePositions(unitStats, state.laneGridSize, state.incomingWave);
    const rationale = buildRationale(
      unitStats,
      state.incomingWave,
      deps.damageMatrix,
      candidate.breakdown,
      deps.units,
    );

    return { ...candidate, units: positionedUnits, rationale };
  });
}
