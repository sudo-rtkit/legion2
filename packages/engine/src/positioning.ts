import type { UnitStats, BuiltUnit, WaveInfo } from './types.js';

const HP_TANK_THRESHOLD = 500;
const ANTIAIR_RANGE_THRESHOLD = 200;

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

function findFreePos(
  preferX: number,
  preferY: number,
  occupied: Set<string>,
  gridW: number,
  gridH: number,
): { x: number; y: number } | null {
  for (let row = 0; row < gridH; row++) {
    for (let col = 0; col < gridW; col++) {
      const x = (preferX + col) % gridW;
      const y = Math.min(gridH - 1, preferY + row);
      if (!occupied.has(posKey(x, y))) return { x, y };
    }
  }
  return null;
}

export function optimizePositions(
  units: UnitStats[],
  gridSize: { w: number; h: number },
  wave: WaveInfo,
): BuiltUnit[] {
  const occupied = new Set<string>();
  const result: BuiltUnit[] = [];

  const place = (unit: UnitStats, preferX: number, preferY: number) => {
    const pos = findFreePos(preferX, preferY, occupied, gridSize.w, gridSize.h);
    if (pos) {
      occupied.add(posKey(pos.x, pos.y));
      result.push({ unitId: unit.id, position: pos });
    }
  };

  const isTank = (u: UnitStats) => u.attackMode === 'Melee' && u.hp >= HP_TANK_THRESHOLD;
  const isSplash = (u: UnitStats) => u.flags.some((f) => f.toLowerCase().includes('splash'));
  const isAntiAir = (u: UnitStats) => u.attackRange > ANTIAIR_RANGE_THRESHOLD;

  const tanks: UnitStats[] = [];
  const splash: UnitStats[] = [];
  const antiAir: UnitStats[] = [];
  const dpsRanged: UnitStats[] = [];
  const other: UnitStats[] = [];

  for (const unit of units) {
    if (isTank(unit)) {
      tanks.push(unit);
    } else if (isSplash(unit)) {
      splash.push(unit);
    } else if (wave.unitMoveType === 'Air' && isAntiAir(unit)) {
      antiAir.push(unit);
    } else if (unit.attackMode === 'Ranged') {
      dpsRanged.push(unit);
    } else {
      other.push(unit);
    }
  }

  // Tanks → front rows (y = 0 or 1)
  tanks.forEach((u, i) => place(u, i % gridSize.w, i < Math.ceil(gridSize.w / 2) ? 0 : 1));

  // Splash → center columns (x = 3 or 4), middle depth (y = 2)
  splash.forEach((u, i) => place(u, 3 + (i % 2), 2));

  // Anti-air → spread vertically (y = 1, 3, 5…) when wave is Air
  antiAir.forEach((u, i) => place(u, gridSize.w - 1 - (i % gridSize.w), (i * 2 + 1) % gridSize.h));

  // Ranged DPS → back rows (y = 5 or 4)
  dpsRanged.forEach((u, i) => place(u, i % gridSize.w, i < Math.ceil(gridSize.w / 2) ? 5 : 4));

  // Other melee → middle (y = 2 or 3)
  other.forEach((u, i) => place(u, i % gridSize.w, 2 + (i % 2)));

  return result;
}
