'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { usePlannerStore } from '@/store/planner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { ApiUnit } from '@/lib/api';

interface FighterPickerProps {
  units: ApiUnit[];
}

export function FighterPicker({ units }: FighterPickerProps) {
  const { rolledFighters, addFighter, removeFighter } = usePlannerStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = units.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  const counts = new Map<string, number>();
  for (const id of rolledFighters) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
        Rolled Fighters ({rolledFighters.length}/10)
      </p>
      <div className="flex flex-wrap gap-1 mb-2 min-h-8">
        {[...counts.entries()].map(([id, count]) => {
          const u = units.find((u) => u.id === id);
          return (
            <Badge
              key={id}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20 gap-1"
              onClick={() => removeFighter(id)}
            >
              {u?.name ?? id}
              {count > 1 && <span className="font-bold">×{count}</span>}
            </Badge>
          );
        })}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline" size="sm" disabled={rolledFighters.length >= 10}>
            + Add Fighter
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-lg border border-border bg-card p-4 shadow-xl">
            <Dialog.Title className="text-sm font-semibold mb-3">Select Fighter</Dialog.Title>
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
              autoFocus
            />
            <div className="grid grid-cols-3 gap-1.5 max-h-80 overflow-y-auto">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    addFighter(u.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border border-border p-2 text-xs hover:bg-accent transition-colors',
                  )}
                >
                  {u.iconPath && (
                    <img
                      src={`https://cdn.legiontd2.com/${u.iconPath}`}
                      alt={u.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="text-center leading-tight">{u.name}</span>
                  {u.goldCost != null && (
                    <span className="text-muted-foreground">{u.goldCost}g</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-3 text-center text-muted-foreground text-xs py-8">
                  No units found
                </p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
