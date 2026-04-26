'use client';

import { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Copy } from 'lucide-react';
import { usePlannerStore } from '@/store/planner';
import { useEngineRecommend } from '@/hooks/useEngineRecommend';
import { FighterPicker } from '@/components/FighterPicker';
import { LaneGrid } from '@/components/LaneGrid';
import { WaveIntel } from '@/components/WaveIntel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import type { ApiUnit, ApiWave, ApiDamageMatrix } from '@/lib/api';
import type { BuildRecommendation } from '@ltd2-coach/engine';

interface PlannerClientProps {
  units: ApiUnit[];
  waves: ApiWave[];
  matrix: ApiDamageMatrix[];
}

export function PlannerClient({ units, waves, matrix }: PlannerClientProps) {
  const {
    wave,
    availableGold,
    availableMythium,
    workerCount,
    setWave,
    setAvailableGold,
    setAvailableMythium,
    setWorkerCount,
  } = usePlannerStore();

  const { data: recs, isLoading } = useEngineRecommend();
  const [activeTab, setActiveTab] = useState('0');

  // Reset active tab whenever a new result set arrives
  useEffect(() => {
    setActiveTab('0');
  }, [recs]);

  const unitMap = new Map(units.map((u) => [u.id, u]));
  const currentWave = waves.find((w) => w.levelNum === wave);
  const waveUnit = currentWave ? (unitMap.get(currentWave.waveUnitId) ?? null) : null;
  const activeBuilds = recs ?? [];

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-base/90 backdrop-blur-sm border-b border-chrome-subtle">
        <div className="flex items-center justify-between px-5 h-12">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm font-semibold tracking-[0.18em] uppercase text-ink">
              LTD2 Coach
            </span>
            <span className="hidden sm:inline text-xs text-ink-3">Build advisor</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={wave}
              onChange={(e) => {
                setWave(Number(e.target.value));
                setActiveTab('0');
              }}
              aria-label="Select wave"
            >
              {waves.length > 0
                ? waves.map((w) => (
                    <option key={w.levelNum} value={w.levelNum}>
                      Wave {w.levelNum}
                      {w.name ? ` — ${w.name}` : ''}
                    </option>
                  ))
                : Array.from({ length: 21 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Wave {i + 1}
                    </option>
                  ))}
            </select>
            <ThemeToggle />
          </div>
        </div>

        {/* Sub-caption */}
        {currentWave && (
          <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-ink-3">
            <span>Wave {currentWave.levelNum}</span>
            {currentWave.name && (
              <>
                <span className="text-chrome-strong select-none">—</span>
                <span className="text-ink-2">{currentWave.name}</span>
              </>
            )}
            {currentWave.isKingWave && <span className="caption-label text-warn ml-0.5">King</span>}
          </div>
        )}
      </header>

      {/* ── 3-column layout ───────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] divide-y lg:divide-y-0 lg:divide-x divide-chrome-subtle">
        {/* LEFT — Game state */}
        <aside className="p-5 space-y-7 overflow-y-auto">
          <section className="space-y-5">
            <p className="caption-label text-ink-3">State</p>

            {/* Gold */}
            <div>
              <p className="caption-label text-ink-3 mb-1.5">Gold</p>
              <div className="flex items-baseline gap-1 pb-2 border-b border-chrome-subtle">
                <input
                  type="number"
                  min={0}
                  value={availableGold}
                  onChange={(e) => setAvailableGold(Number(e.target.value))}
                  className="w-full bg-transparent text-[2rem] leading-none font-mono font-bold text-ink outline-none border-none p-0
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Available gold"
                />
                <span className="text-ink-3 text-xl font-mono">g</span>
              </div>
            </div>

            {/* Mythium */}
            <div>
              <p className="caption-label text-ink-3 mb-1.5">Mythium</p>
              <div className="flex items-baseline gap-1 pb-2 border-b border-chrome-subtle">
                <input
                  type="number"
                  min={0}
                  value={availableMythium}
                  onChange={(e) => setAvailableMythium(Number(e.target.value))}
                  className="w-full bg-transparent text-xl leading-none font-mono font-medium text-ink-2 outline-none border-none p-0
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Available mythium"
                />
                <span className="text-ink-3 text-sm font-mono">m</span>
              </div>
            </div>

            {/* Workers */}
            <div>
              <p className="caption-label text-ink-3 mb-2">Workers</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWorkerCount(Math.max(1, workerCount - 1))}
                  className="w-7 h-7 rounded border border-chrome text-ink-2 hover:border-chrome-strong hover:text-ink transition-colors flex items-center justify-center font-mono text-base leading-none"
                  aria-label="Decrease workers"
                >
                  −
                </button>
                <span className="font-mono text-lg font-semibold text-ink w-6 text-center tabular-nums">
                  {workerCount}
                </span>
                <button
                  onClick={() => setWorkerCount(Math.min(20, workerCount + 1))}
                  className="w-7 h-7 rounded border border-chrome text-ink-2 hover:border-chrome-strong hover:text-ink transition-colors flex items-center justify-center font-mono text-base leading-none"
                  aria-label="Increase workers"
                >
                  +
                </button>
              </div>
            </div>
          </section>

          {/* Fighters */}
          <section>
            <FighterPicker units={units} />
          </section>
        </aside>

        {/* CENTER — Recommendations */}
        <main className="p-5 space-y-4 overflow-y-auto min-w-0">
          <p className="caption-label text-ink-3">Recommendations</p>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3 pt-2 animate-pulse">
              <div className="h-10 bg-elevated rounded-md w-2/3" />
              <div className="h-28 bg-elevated rounded-md" />
              <div className="h-4 bg-elevated rounded w-1/2" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && activeBuilds.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <p className="text-ink-2 text-sm">Add fighters to get recommendations</p>
              <p className="text-ink-3 text-xs">Select up to 10 units from your current roll</p>
            </div>
          )}

          {/* Tabs */}
          {activeBuilds.length > 0 && (
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex border-b border-chrome -mb-px">
                {activeBuilds.map((rec, i) => {
                  const pct = Math.round(rec.score * 100);
                  const isActive = activeTab === String(i);
                  return (
                    <Tabs.Trigger
                      key={i}
                      value={String(i)}
                      className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none',
                        isActive
                          ? 'border-lime text-ink'
                          : 'border-transparent text-ink-2 hover:text-ink hover:bg-elevated-2',
                      )}
                    >
                      #{i + 1}{' '}
                      <span
                        className={cn(
                          'font-mono text-xs ml-1',
                          isActive ? 'text-lime' : 'text-ink-3',
                        )}
                      >
                        {pct}%
                      </span>
                    </Tabs.Trigger>
                  );
                })}
              </Tabs.List>

              {activeBuilds.map((rec, i) => (
                <Tabs.Content
                  key={i}
                  value={String(i)}
                  className="pt-5 outline-none animate-slide-up"
                >
                  <BuildDisplay rec={rec} unitMap={unitMap} />
                </Tabs.Content>
              ))}
            </Tabs.Root>
          )}
        </main>

        {/* RIGHT — Wave intel */}
        <aside className="p-5 overflow-y-auto">
          <WaveIntel currentWave={currentWave ?? null} waveUnit={waveUnit} matrix={matrix} />
        </aside>
      </div>
    </div>
  );
}

/* ─── BuildDisplay ─────────────────────────────────────────────────────────── */

function BuildDisplay({
  rec,
  unitMap,
}: {
  rec: BuildRecommendation;
  unitMap: Map<string, ApiUnit>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [rec]);

  const pct = Math.round(rec.score * 100);

  const handleCopy = () => {
    const text = rec.units.map((u) => u.unitId).join(', ');
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5">
      {/* Score row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-end gap-2">
            <span className="font-mono text-[3rem] leading-none font-bold text-ink tracking-tight tabular-nums">
              {pct}
            </span>
            <span className="font-mono text-sm text-ink-3 mb-1.5">/ 100</span>
          </div>
          <div className="h-1 bg-elevated-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-lime rounded-full transition-[width] duration-300 ease-out"
              style={{ width: mounted ? `${pct}%` : '0%' }}
            />
          </div>
          <p className="caption-label text-ink-3">Score</p>
        </div>

        <button
          onClick={handleCopy}
          className="mt-1 w-8 h-8 flex-shrink-0 rounded border border-chrome flex items-center justify-center text-ink-3 hover:text-ink hover:border-chrome-strong transition-colors"
          title="Copy unit IDs"
          aria-label="Copy build"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 divide-x divide-chrome border border-chrome rounded-md overflow-hidden">
        <StatCell label="Cost" value={`${rec.totalCost}g`} />
        <StatCell
          label="Damage"
          value={`${Math.round(rec.breakdown.damageScore * 100)}%`}
          colorClass={scoreColor(rec.breakdown.damageScore)}
        />
        <StatCell
          label="Survival"
          value={`${Math.round(rec.breakdown.survivalScore * 100)}%`}
          colorClass={scoreColor(rec.breakdown.survivalScore)}
        />
        <StatCell
          label="Value"
          value={`${Math.round(rec.breakdown.valueScore * 100)}%`}
          colorClass={scoreColor(rec.breakdown.valueScore)}
        />
      </div>

      {/* Lane grid */}
      <LaneGrid units={rec.units} unitMap={unitMap} />

      {/* Rationale */}
      {rec.rationale.length > 0 && (
        <ul className="space-y-2 pt-2 border-t border-chrome-subtle">
          {rec.rationale.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-ink-2 leading-relaxed">
              <span className="text-lime flex-shrink-0 mt-0.5 select-none">•</span>
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="px-3 py-2.5 flex flex-col gap-0.5 min-w-0">
      <p className="caption-label text-ink-3 truncate">{label}</p>
      <p className={cn('font-mono text-sm font-semibold truncate', colorClass ?? 'text-ink')}>
        {value}
      </p>
    </div>
  );
}

function scoreColor(val: number): string {
  if (val >= 0.75) return 'text-lime';
  if (val >= 0.45) return 'text-warn';
  return 'text-ink-2';
}
