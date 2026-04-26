'use client';

import { usePlannerStore } from '@/store/planner';
import { useEngineRecommend } from '@/hooks/useEngineRecommend';
import { WaveSelector } from '@/components/WaveSelector';
import { FighterPicker } from '@/components/FighterPicker';
import { BuildCard } from '@/components/BuildCard';
import { WaveBadge } from '@/components/WaveBadge';
import { Input } from '@/components/ui/input';
import type { ApiUnit, ApiWave, ApiDamageMatrix } from '@/lib/api';

interface PlannerClientProps {
  units: ApiUnit[];
  waves: ApiWave[];
  matrix: ApiDamageMatrix[];
}

export function PlannerClient({ units, waves }: PlannerClientProps) {
  const {
    wave,
    availableGold,
    availableMythium,
    workerCount,
    setAvailableGold,
    setAvailableMythium,
    setWorkerCount,
  } = usePlannerStore();

  const { data: recs, isLoading, error } = useEngineRecommend();

  const currentWave = waves.find((w) => w.levelNum === wave);
  const unitMap = new Map(units.map((u) => [u.id, u]));
  const waveUnit = currentWave ? unitMap.get(currentWave.waveUnitId) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 p-4 min-h-screen">
      {/* Left panel */}
      <aside className="space-y-6">
        <WaveSelector />

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Resources
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Gold</span>
            <Input
              type="number"
              min={0}
              value={availableGold}
              onChange={(e) => setAvailableGold(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Mythium</span>
            <Input
              type="number"
              min={0}
              value={availableMythium}
              onChange={(e) => setAvailableMythium(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Workers</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={workerCount}
              onChange={(e) => setWorkerCount(Number(e.target.value))}
            />
          </label>
        </div>

        <FighterPicker units={units} />
      </aside>

      {/* Center panel */}
      <main className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-semibold">Recommendations</h1>
          {currentWave && waveUnit && (
            <WaveBadge
              levelNum={currentWave.levelNum}
              armorType={waveUnit.armorType}
              attackType={waveUnit.attackType}
              moveType={waveUnit.moveType}
              amount={currentWave.amount}
            />
          )}
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground animate-pulse">Calculating…</div>
        )}
        {error && <div className="text-sm text-red-400">Failed to compute recommendations.</div>}
        {!isLoading && !error && recs && recs.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No builds fit your budget. Try adding fighters or increasing gold.
          </div>
        )}
        {!isLoading && !error && !recs && (
          <div className="text-sm text-muted-foreground">
            Select fighters to get recommendations.
          </div>
        )}
        {recs && recs.length > 0 && (
          <div className="space-y-4">
            {recs.map((rec, i) => (
              <BuildCard key={i} rec={rec} rank={i + 1} unitMap={unitMap} />
            ))}
          </div>
        )}
      </main>

      {/* Right panel — wave info */}
      <aside className="space-y-4">
        {currentWave && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Wave {currentWave.levelNum} — {currentWave.name}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Count</span>
                <span>{currentWave.amount}</span>
              </div>
              {currentWave.amount2 != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Count 2</span>
                  <span>{currentWave.amount2}</span>
                </div>
              )}
              {currentWave.isKingWave && (
                <div className="text-xs text-primary font-medium">King Wave</div>
              )}
              {waveUnit && (
                <>
                  {waveUnit.hp != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HP</span>
                      <span>{waveUnit.hp}</span>
                    </div>
                  )}
                  {waveUnit.dps != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DPS</span>
                      <span>{waveUnit.dps}</span>
                    </div>
                  )}
                  {waveUnit.armorType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Armor</span>
                      <span>{waveUnit.armorType}</span>
                    </div>
                  )}
                  {waveUnit.attackType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attack</span>
                      <span>{waveUnit.attackType}</span>
                    </div>
                  )}
                  {waveUnit.moveType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Move</span>
                      <span>{waveUnit.moveType}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
