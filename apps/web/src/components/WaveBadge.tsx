import { Badge } from './ui/badge';

interface WaveBadgeProps {
  levelNum: number;
  armorType?: string | null;
  attackType?: string | null;
  moveType?: string | null;
  amount?: number | null;
}

export function WaveBadge({ levelNum, armorType, attackType, moveType, amount }: WaveBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <Badge variant="secondary">Wave {levelNum}</Badge>
      {amount != null && <Badge variant="outline">×{amount}</Badge>}
      {armorType && <Badge variant="outline">{armorType}</Badge>}
      {attackType && <Badge variant="outline">{attackType}</Badge>}
      {moveType && moveType !== 'None' && <Badge variant="secondary">{moveType}</Badge>}
    </div>
  );
}
