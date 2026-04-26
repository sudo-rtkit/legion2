import type { BuiltUnit } from '@ltd2-coach/engine';
import type { ApiUnit } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LaneGridProps {
  units: BuiltUnit[];
  unitMap: Map<string, ApiUnit>;
}

const COLS = 8;
const ROWS = 6;

export function LaneGrid({ units, unitMap }: LaneGridProps) {
  const byPos = new Map(units.map((u) => [`${u.position.x},${u.position.y}`, u]));

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = `${col},${row}`;
          const placed = byPos.get(key);
          const apiUnit = placed ? unitMap.get(placed.unitId) : undefined;

          if (placed && apiUnit) {
            return (
              <div
                key={key}
                className={cn(
                  'aspect-square rounded border border-lime/25 bg-elevated overflow-hidden',
                  'shadow-glow-lime transition-shadow duration-150 hover:shadow-glow-lime-hover',
                  'hover:-translate-y-px transition-transform',
                )}
                title={apiUnit.name}
              >
                {apiUnit.iconPath ? (
                  <img
                    src={`https://cdn.legiontd2.com/${apiUnit.iconPath}`}
                    alt={apiUnit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-semibold text-lime">
                    {apiUnit.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={key}
              className="aspect-square rounded border border-dashed border-chrome-subtle bg-elevated-2/40"
            />
          );
        }),
      )}
    </div>
  );
}
