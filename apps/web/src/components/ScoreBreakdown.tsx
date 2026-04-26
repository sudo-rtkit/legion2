'use client';

import { cn } from '@/lib/utils';

interface ScoreBreakdownProps {
  breakdown: {
    damageScore: number;
    survivalScore: number;
    sendScore: number;
    valueScore: number;
    metaScore: number;
  };
}

const DIMS = [
  { key: 'damageScore', label: 'Damage' },
  { key: 'survivalScore', label: 'Survival' },
  { key: 'sendScore', label: 'Send' },
  { key: 'valueScore', label: 'Value' },
  { key: 'metaScore', label: 'Meta' },
] as const;

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="space-y-2">
      {DIMS.map(({ key, label }) => {
        const pct = Math.round(breakdown[key] * 100);
        const barColor = pct >= 75 ? 'bg-lime' : pct >= 45 ? 'bg-warn' : 'bg-chrome-strong';
        const textColor = pct >= 75 ? 'text-lime' : pct >= 45 ? 'text-warn' : 'text-ink-3';
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="caption-label text-ink-3 w-16 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-elevated-2 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn('font-mono text-xs w-8 text-right tabular-nums', textColor)}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
