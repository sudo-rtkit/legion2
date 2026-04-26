'use client';

import { usePlannerStore } from '@/store/planner';
import { cn } from '@/lib/utils';

const WAVES = Array.from({ length: 21 }, (_, i) => i + 1);

export function WaveSelector() {
  const { wave, setWave } = usePlannerStore();
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Wave</p>
      <div className="grid grid-cols-7 gap-1">
        {WAVES.map((w) => (
          <button
            key={w}
            onClick={() => setWave(w)}
            className={cn(
              'h-8 w-full rounded text-xs font-semibold transition-colors',
              wave === w
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
