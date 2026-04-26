import type {
  GameState,
  UnitStats,
  DamageMatrix,
  BuildRecommendation,
  BuiltUnit,
} from './types.js';
import {
  calculateDamageScore,
  calculateSurvivalScore,
  calculateSendScore,
  calculateValueScore,
  calculateMetaScore,
  weightedScore,
} from './scoring.js';

const BEAM_WIDTH = 20;
const DEPTH_LIMIT = 6;

interface BeamNode {
  unitIds: string[];
  totalCost: number;
  usedCounts: Map<string, number>;
  score: number;
}

function buildHash(unitIds: string[]): string {
  return [...unitIds].sort().join(',');
}

function scoreNode(
  unitIds: string[],
  totalCost: number,
  state: GameState,
  deps: SearchDeps,
): BeamNode['score'] {
  const build = unitIds
    .map((id) => deps.units.get(id))
    .filter((u): u is UnitStats => u !== undefined);
  const breakdown = {
    damageScore: calculateDamageScore(build, state.incomingWave, deps.damageMatrix),
    survivalScore: calculateSurvivalScore(build, state.incomingWave, deps.damageMatrix),
    sendScore: calculateSendScore(build, state.opponentLikelySend, deps.units),
    valueScore: calculateValueScore(build, totalCost, deps.units),
    metaScore: calculateMetaScore(buildHash(unitIds), deps.metaStats),
  };
  return weightedScore(breakdown);
}

export interface SearchDeps {
  damageMatrix: DamageMatrix;
  units: Map<string, UnitStats>;
  metaStats?: Map<string, number>;
}

export function findBestBuilds(state: GameState, deps: SearchDeps): BuildRecommendation[] {
  if (state.rolledFighters.length === 0) return [];

  // Count available rolls (multiset)
  const rollCounts = new Map<string, number>();
  for (const id of state.rolledFighters) {
    rollCounts.set(id, (rollCounts.get(id) ?? 0) + 1);
  }

  // Filter to rolls that exist in the unit catalog
  const validRollIds = [...rollCounts.keys()].filter((id) => deps.units.has(id));
  if (validRollIds.length === 0) return [];

  const initialNode: BeamNode = {
    unitIds: [],
    totalCost: 0,
    usedCounts: new Map(),
    score: 0,
  };

  let beam: BeamNode[] = [initialNode];
  const leaves: BeamNode[] = [];

  for (let depth = 0; depth < DEPTH_LIMIT; depth++) {
    const candidates: BeamNode[] = [];

    for (const node of beam) {
      let expanded = false;

      for (const unitId of validRollIds) {
        const available = rollCounts.get(unitId) ?? 0;
        const used = node.usedCounts.get(unitId) ?? 0;
        if (used >= available) continue;

        const unit = deps.units.get(unitId);
        if (!unit) continue;

        const newCost = node.totalCost + unit.cost;
        if (newCost > state.availableGold) continue;

        const newUsed = new Map(node.usedCounts);
        newUsed.set(unitId, used + 1);

        const newUnitIds = [...node.unitIds, unitId];
        const score = scoreNode(newUnitIds, newCost, state, deps);

        candidates.push({ unitIds: newUnitIds, totalCost: newCost, usedCounts: newUsed, score });
        expanded = true;
      }

      if (!expanded) leaves.push(node);
    }

    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.score - a.score);
    beam = candidates.slice(0, BEAM_WIDTH);
  }

  // Remaining beam nodes are leaves (hit depth limit or budget)
  leaves.push(...beam);

  // Deduplicate by build hash, return top 3
  const seen = new Set<string>();
  const unique = leaves.filter((leaf) => {
    if (leaf.unitIds.length === 0) return false;
    const hash = buildHash(leaf.unitIds);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });

  unique.sort((a, b) => b.score - a.score);

  return unique.slice(0, 3).map((node) => toRecommendation(node, state, deps));
}

function toRecommendation(node: BeamNode, state: GameState, deps: SearchDeps): BuildRecommendation {
  const build = node.unitIds
    .map((id) => deps.units.get(id))
    .filter((u): u is UnitStats => u !== undefined);

  const breakdown = {
    damageScore: calculateDamageScore(build, state.incomingWave, deps.damageMatrix),
    survivalScore: calculateSurvivalScore(build, state.incomingWave, deps.damageMatrix),
    sendScore: calculateSendScore(build, state.opponentLikelySend, deps.units),
    valueScore: calculateValueScore(build, node.totalCost, deps.units),
    metaScore: calculateMetaScore(buildHash(node.unitIds), deps.metaStats),
  };

  // Placeholder positions — overwritten by optimizePositions in recommendBuilds
  const units: BuiltUnit[] = node.unitIds.map((id) => ({ unitId: id, position: { x: 0, y: 0 } }));

  return {
    units,
    score: weightedScore(breakdown),
    breakdown,
    rationale: [],
    totalCost: node.totalCost,
    leftoverGold: state.availableGold - node.totalCost,
  };
}
