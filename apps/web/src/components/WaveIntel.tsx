import { cn } from '@/lib/utils';
import type { ApiWave, ApiDamageMatrix, ApiUnit } from '@/lib/api';

interface WaveIntelProps {
  currentWave: ApiWave | null;
  waveUnit: ApiUnit | null;
  matrix: ApiDamageMatrix[];
}

const ATTACK_TYPES = ['Pierce', 'Impact', 'Magic', 'Pure'] as const;
type AttackTypeName = (typeof ATTACK_TYPES)[number];

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  Pierce: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  Impact: { bg: 'bg-red-400/10', text: 'text-red-400' },
  Magic: { bg: 'bg-purple-400/10', text: 'text-purple-400' },
  Pure: { bg: 'bg-chrome', text: 'text-ink-3' },
  Swift: { bg: 'bg-lime/10', text: 'text-lime' },
  Natural: { bg: 'bg-lime/10', text: 'text-lime' },
  Arcane: { bg: 'bg-purple-400/10', text: 'text-purple-400' },
  Fortified: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  Immaterial: { bg: 'bg-chrome-subtle', text: 'text-ink-3' },
  Ground: { bg: 'bg-chrome', text: 'text-ink-3' },
  Air: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
};

function TypePill({ type }: { type: string }) {
  const s = TYPE_STYLE[type] ?? { bg: 'bg-chrome', text: 'text-ink-2' };
  return <span className={cn('caption-label px-2 py-0.5 rounded', s.bg, s.text)}>{type}</span>;
}

function WaveStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-chrome-subtle last:border-0">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="font-mono text-sm text-ink">{children}</span>
    </div>
  );
}

function DamageBar({
  attackType,
  armorType,
  matrix,
}: {
  attackType: AttackTypeName;
  armorType: string;
  matrix: ApiDamageMatrix[];
}) {
  const row = matrix.find((m) => m.attackType === attackType && m.armorType === armorType);
  const mult = row?.multiplier ?? 1.0;
  const widthPct = Math.round((mult / 1.25) * 100);
  const isStrong = mult > 1.0;
  const isWeak = mult < 1.0;

  const barColor = isStrong ? 'bg-lime' : isWeak ? 'bg-danger' : 'bg-chrome-strong';
  const textColor = isStrong ? 'text-lime' : isWeak ? 'text-danger' : 'text-ink-3';
  const labelColor = TYPE_STYLE[attackType]?.text ?? 'text-ink-2';

  return (
    <div className="flex items-center gap-2">
      <span className={cn('caption-label w-14 flex-shrink-0', labelColor)}>{attackType}</span>
      <div className="flex-1 h-1.5 bg-elevated-2 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${widthPct}%` }} />
      </div>
      <span
        className={cn('font-mono text-xs w-10 text-right flex-shrink-0 tabular-nums', textColor)}
      >
        {mult.toFixed(2)}×
      </span>
    </div>
  );
}

export function WaveIntel({ currentWave, waveUnit, matrix }: WaveIntelProps) {
  if (!currentWave) {
    return (
      <div className="pt-12 text-center">
        <p className="text-xs text-ink-3">No wave selected</p>
      </div>
    );
  }

  const armorType = waveUnit?.armorType ?? null;

  return (
    <div className="space-y-5">
      <p className="caption-label text-ink-3">
        Wave {currentWave.levelNum}
        {currentWave.name ? ` — ${currentWave.name}` : ''}
      </p>

      {/* Wave stats card */}
      <div className="rounded-md border border-chrome bg-elevated p-4 space-y-0.5">
        {waveUnit?.iconPath && (
          <div className="flex justify-center pb-3">
            <img
              src={`https://cdn.legiontd2.com/${waveUnit.iconPath}`}
              alt={waveUnit.name ?? 'Wave unit'}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
          </div>
        )}

        <WaveStat label="Count">
          {currentWave.amount}
          {currentWave.amount2 != null && (
            <span className="text-ink-3"> + {currentWave.amount2}</span>
          )}
        </WaveStat>

        {waveUnit?.hp != null && <WaveStat label="HP">{waveUnit.hp}</WaveStat>}
        {waveUnit?.dps != null && <WaveStat label="DPS">{waveUnit.dps}</WaveStat>}
        {waveUnit?.armorType && (
          <WaveStat label="Armor">
            <TypePill type={waveUnit.armorType} />
          </WaveStat>
        )}
        {waveUnit?.attackType && (
          <WaveStat label="Attack">
            <TypePill type={waveUnit.attackType} />
          </WaveStat>
        )}
        {waveUnit?.moveType && (
          <WaveStat label="Move">
            <TypePill type={waveUnit.moveType} />
          </WaveStat>
        )}

        {currentWave.isKingWave && (
          <div className="pt-1.5">
            <span className="caption-label text-warn">King wave</span>
          </div>
        )}
      </div>

      {/* Damage matchup */}
      {armorType && (
        <div className="space-y-3">
          <p className="caption-label text-ink-3">Damage effectiveness</p>
          <div className="space-y-2.5">
            {ATTACK_TYPES.map((at) => (
              <DamageBar key={at} attackType={at} armorType={armorType} matrix={matrix} />
            ))}
          </div>
          <p className="text-[11px] text-ink-3">vs {armorType} armor</p>
        </div>
      )}
    </div>
  );
}
