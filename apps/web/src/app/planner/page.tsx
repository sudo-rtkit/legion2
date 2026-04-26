import { getUnits, getDamageMatrix } from '@/lib/api';
import type { ApiWave, ApiDamageMatrix } from '@/lib/api';
import { PlannerClient } from './PlannerClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getAllWaves(): Promise<ApiWave[]> {
  try {
    const promises = Array.from({ length: 21 }, (_, i) =>
      fetch(`${API_BASE}/api/waves/${i + 1}`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? (r.json() as Promise<ApiWave>) : null))
        .catch(() => null),
    );
    const results = await Promise.all(promises);
    return results.filter((w): w is ApiWave => w !== null);
  } catch {
    return [];
  }
}

export default async function PlannerPage() {
  const [units, waves, matrix] = await Promise.all([getUnits(), getAllWaves(), getDamageMatrix()]);
  return <PlannerClient units={units} waves={waves} matrix={matrix} />;
}
