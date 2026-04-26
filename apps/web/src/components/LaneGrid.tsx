import type { BuiltUnit } from '@ltd2-coach/engine';
import type { ApiUnit } from '@/lib/api';

interface LaneGridProps {
  units: BuiltUnit[];
  unitMap: Map<string, ApiUnit>;
}

const COLS = 8;
const ROWS = 6;

export function LaneGrid({ units, unitMap }: LaneGridProps) {
  const byPos = new Map(units.map((u) => [`${u.position.x},${u.position.y}`, u]));

  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = `${col},${row}`;
          const unit = byPos.get(key);
          const apiUnit = unit ? unitMap.get(unit.unitId) : undefined;
          return (
            <div
              key={key}
              className="aspect-square rounded-sm bg-muted flex items-center justify-center text-[9px] text-muted-foreground overflow-hidden"
              title={apiUnit?.name ?? ''}
            >
              {apiUnit?.iconPath ? (
                <img
                  src={`https://cdn.legiontd2.com/${apiUnit.iconPath}`}
                  alt={apiUnit.name}
                  className="w-full h-full object-cover"
                />
              ) : unit ? (
                <span className="font-bold text-foreground">
                  {apiUnit?.name?.slice(0, 2) ?? '?'}
                </span>
              ) : null}
            </div>
          );
        }),
      )}
    </div>
  );
}
