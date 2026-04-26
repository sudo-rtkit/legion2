const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface ApiUnit {
  id: string;
  name: string;
  goldCost: number | null;
  totalValue: number | null;
  hp: number | null;
  dps: number | null;
  attackType: string | null;
  armorType: string | null;
  attackRange: number | null;
  attackMode: string | null;
  moveType: string | null;
  iconPath: string | null;
  flags: string[] | null;
}

export interface ApiWave {
  id: string;
  levelNum: number;
  name: string;
  amount: number;
  amount2: number | null;
  waveUnitId: string;
  isKingWave: boolean;
}

export interface ApiDamageMatrix {
  attackType: string;
  armorType: string;
  multiplier: number;
}

export async function getUnits(): Promise<ApiUnit[]> {
  const data = await apiFetch<ApiUnit[]>('/api/units');
  return data ?? [];
}

export async function getWave(levelNum: number): Promise<ApiWave | null> {
  return apiFetch<ApiWave>(`/api/waves/${levelNum}`);
}

export async function getDamageMatrix(): Promise<ApiDamageMatrix[]> {
  const data = await apiFetch<ApiDamageMatrix[]>('/api/damage-matrix');
  return data ?? [];
}
