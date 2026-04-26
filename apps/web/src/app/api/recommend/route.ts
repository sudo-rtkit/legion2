import { NextResponse } from 'next/server';
import { recommendBuilds } from '@ltd2-coach/engine';
import type {
  GameState,
  UnitStats,
  WaveInfo,
  DamageMatrix,
  ArmorType,
  AttackType,
} from '@ltd2-coach/engine';
import { getDamageMatrix, getUnits, getWave } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      wave: number;
      availableGold: number;
      availableMythium: number;
      workerCount: number;
      rolledFighters: string[];
      opponentLikelySend?: string;
    };

    const [apiUnits, matrixRows, waveRow] = await Promise.all([
      getUnits(),
      getDamageMatrix(),
      getWave(body.wave),
    ]);

    if (!waveRow) {
      return NextResponse.json({ error: 'Wave not found' }, { status: 404 });
    }

    const units = new Map<string, UnitStats>();
    for (const u of apiUnits) {
      if (!u.attackType || !u.armorType || !u.attackMode) continue;
      units.set(u.id, {
        id: u.id,
        name: u.name,
        cost: u.goldCost ?? 0,
        hp: u.hp ?? 100,
        dps: u.dps ?? 0,
        attackType: u.attackType as AttackType,
        armorType: u.armorType as ArmorType,
        attackMode: (u.attackMode === 'Melee' ? 'Melee' : 'Ranged') as 'Melee' | 'Ranged',
        moveType: (u.moveType === 'Air' ? 'Air' : 'Ground') as 'Ground' | 'Air',
        attackRange: u.attackRange ?? 150,
        flags: u.flags ?? [],
      });
    }

    const damageMatrix = {} as Record<string, Record<string, number>>;
    for (const row of matrixRows) {
      if (!damageMatrix[row.attackType]) damageMatrix[row.attackType] = {};
      damageMatrix[row.attackType]![row.armorType] = row.multiplier;
    }

    const waveUnit = units.get(waveRow.waveUnitId);
    const incomingWave: WaveInfo = {
      levelNum: waveRow.levelNum,
      name: waveRow.name,
      amount: waveRow.amount,
      amount2: waveRow.amount2 ?? undefined,
      isKingWave: waveRow.isKingWave,
      unitHp: waveUnit?.hp ?? 100,
      unitDps: waveUnit?.dps ?? 10,
      unitArmorType: (waveUnit?.armorType ?? 'Natural') as ArmorType,
      unitAttackType: (waveUnit?.attackType ?? 'Pure') as AttackType,
      unitMoveType: (waveUnit?.moveType ?? 'Ground') as 'Ground' | 'Air',
    };

    const gameState: GameState = {
      wave: body.wave,
      availableGold: body.availableGold,
      availableMythium: body.availableMythium,
      workerCount: body.workerCount,
      rolledFighters: body.rolledFighters,
      alreadyBuilt: [],
      laneGridSize: { w: 8, h: 6 },
      incomingWave,
      opponentLikelySend: body.opponentLikelySend,
    };

    const results = recommendBuilds(gameState, {
      damageMatrix: damageMatrix as DamageMatrix,
      units,
    });
    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
