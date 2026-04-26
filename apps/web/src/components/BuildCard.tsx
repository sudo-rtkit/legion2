import type { BuildRecommendation } from '@ltd2-coach/engine';
import type { ApiUnit } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LaneGrid } from './LaneGrid';
import { ScoreBreakdown } from './ScoreBreakdown';

interface BuildCardProps {
  rec: BuildRecommendation;
  rank: number;
  unitMap: Map<string, ApiUnit>;
}

export function BuildCard({ rec, rank, unitMap }: BuildCardProps) {
  const scorePercent = Math.round(rec.score * 100);
  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">#{rank} Build</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{rec.totalCost}g</span>
            <Badge variant={rank === 1 ? 'default' : 'secondary'}>{scorePercent}%</Badge>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <LaneGrid units={rec.units} unitMap={unitMap} />
        <ScoreBreakdown breakdown={rec.breakdown} />
        {rec.rationale.length > 0 && (
          <ul className="space-y-1">
            {rec.rationale.map((line, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary mt-0.5">›</span>
                {line}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
