'use client';

import { useQuery } from '@tanstack/react-query';
import { usePlannerStore } from '@/store/planner';
import { useDebounce } from './useDebounce';
import type { BuildRecommendation } from '@ltd2-coach/engine';

export function useEngineRecommend() {
  const state = usePlannerStore();
  const debouncedFighters = useDebounce(state.rolledFighters, 300);

  const enabled = debouncedFighters.length > 0;

  return useQuery<BuildRecommendation[]>({
    queryKey: [
      'recommend',
      state.wave,
      state.availableGold,
      state.availableMythium,
      state.workerCount,
      debouncedFighters,
      state.opponentLikelySend,
    ],
    queryFn: async () => {
      const body = {
        wave: state.wave,
        availableGold: state.availableGold,
        availableMythium: state.availableMythium,
        workerCount: state.workerCount,
        rolledFighters: debouncedFighters,
        opponentLikelySend: state.opponentLikelySend,
      };
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Recommend failed');
      return res.json() as Promise<BuildRecommendation[]>;
    },
    enabled,
    staleTime: 30_000,
  });
}
