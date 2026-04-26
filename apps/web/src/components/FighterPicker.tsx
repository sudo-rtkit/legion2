'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus } from 'lucide-react';
import { usePlannerStore } from '@/store/planner';
import { cn } from '@/lib/utils';
import type { ApiUnit } from '@/lib/api';

interface FighterPickerProps {
  units: ApiUnit[];
}

function tierBorderClass(cost: number | null): string {
  if (cost == null || cost < 50) return 'border-chrome-strong';
  if (cost < 100) return 'border-blue-400 shadow-glow-blue';
  return 'border-purple-500 shadow-glow-purple';
}

export function FighterPicker({ units }: FighterPickerProps) {
  const { rolledFighters, addFighter, removeFighter } = usePlannerStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const unitMap = new Map(units.map((u) => [u.id, u]));
  const slots = Array.from({ length: 10 }, (_, i) => rolledFighters[i] ?? null);
  const isFull = rolledFighters.length >= 10;

  const filtered = units.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch('');
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="caption-label text-ink-3">Fighters</p>
        <span className="font-mono text-xs text-ink-3 tabular-nums">
          {rolledFighters.length} / 10
        </span>
      </div>

      {/* 5×2 slot grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {slots.map((id, i) => {
          const unit = id ? (unitMap.get(id) ?? null) : null;

          if (unit) {
            return (
              <button
                key={i}
                onClick={() => removeFighter(id!)}
                className={cn(
                  'aspect-square rounded border-2 bg-elevated overflow-hidden relative group',
                  'transition-shadow duration-150',
                  tierBorderClass(unit.goldCost),
                  'hover:shadow-glow-lime-hover',
                )}
                title={`${unit.name} — click to remove`}
                aria-label={`Remove ${unit.name}`}
              >
                {unit.iconPath ? (
                  <img
                    src={`https://cdn.legiontd2.com/${unit.iconPath}`}
                    alt={unit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-ink-2 text-center px-0.5 leading-tight">
                    {unit.name.slice(0, 4)}
                  </span>
                )}
                {/* Remove overlay */}
                <span className="absolute inset-0 bg-danger/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <X size={14} className="text-white drop-shadow" />
                </span>
              </button>
            );
          }

          return (
            <button
              key={i}
              onClick={() => !isFull && setOpen(true)}
              disabled={isFull}
              className="aspect-square rounded border border-dashed border-chrome-subtle bg-elevated hover:bg-elevated-2 hover:border-chrome transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Add fighter"
            >
              <Plus size={13} className="text-ink-3" />
            </button>
          );
        })}
      </div>

      {/* Picker dialog */}
      <Dialog.Root open={open} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-lg border border-chrome bg-elevated p-5 shadow-2xl animate-slide-up focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-sm font-semibold text-ink">Select fighter</Dialog.Title>
              <Dialog.Close className="w-7 h-7 rounded flex items-center justify-center text-ink-3 hover:text-ink hover:bg-elevated-2 transition-colors">
                <X size={15} />
              </Dialog.Close>
            </div>

            <input
              placeholder="Search units…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-elevated-2 border border-chrome rounded px-3 py-2 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-lime transition-colors mb-4"
              autoFocus
            />

            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-0.5">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    addFighter(u.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded border border-chrome bg-elevated-2 hover:bg-elevated hover:border-lime p-2 text-xs transition-colors group focus-visible:outline-none focus-visible:border-lime"
                >
                  {u.iconPath && (
                    <img
                      src={`https://cdn.legiontd2.com/${u.iconPath}`}
                      alt={u.name}
                      className="w-9 h-9 object-contain"
                    />
                  )}
                  <span className="text-center leading-tight text-ink-2 group-hover:text-ink transition-colors">
                    {u.name}
                  </span>
                  {u.goldCost != null && (
                    <span className="font-mono text-ink-3 group-hover:text-lime transition-colors">
                      {u.goldCost}g
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-4 text-center text-ink-3 text-sm py-8">No units found</p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
