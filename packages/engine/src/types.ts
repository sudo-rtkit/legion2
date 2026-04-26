export type ArmorType = 'Swift' | 'Natural' | 'Arcane' | 'Fortified' | 'Immaterial';
export type AttackType = 'Pierce' | 'Impact' | 'Magic' | 'Pure';

export type DamageMatrix = Record<AttackType, Record<ArmorType, number>>;

export interface WaveInfo {
  levelNum: number;
  name: string;
  amount: number;
  amount2?: number;
  isKingWave: boolean;
  unitHp: number;
  unitDps: number;
  unitArmorType: ArmorType;
  unitAttackType: AttackType;
  unitMoveType: 'Ground' | 'Air';
}

export interface UnitStats {
  id: string;
  name: string;
  cost: number;
  hp: number;
  dps: number;
  attackType: AttackType;
  armorType: ArmorType;
  attackMode: 'Melee' | 'Ranged';
  moveType: 'Ground' | 'Air';
  attackRange: number;
  flags: string[];
}

export interface BuiltUnit {
  unitId: string;
  position: { x: number; y: number };
}

export interface GameState {
  wave: number;
  availableGold: number;
  availableMythium: number;
  workerCount: number;
  rolledFighters: string[];
  alreadyBuilt: BuiltUnit[];
  laneGridSize: { w: 8; h: 6 };
  incomingWave: WaveInfo;
  opponentLikelySend?: string;
  lanePartnerBuild?: BuiltUnit[];
}

export interface BuildRecommendation {
  units: BuiltUnit[];
  score: number;
  breakdown: {
    damageScore: number;
    survivalScore: number;
    sendScore: number;
    valueScore: number;
    metaScore: number;
  };
  rationale: string[];
  totalCost: number;
  leftoverGold: number;
}
