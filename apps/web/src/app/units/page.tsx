import { getUnits } from '@/lib/api';

export default async function UnitsPage() {
  const units = await getUnits();
  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold mb-4">Units</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {units.map((u) => (
          <div
            key={u.id}
            className="flex flex-col items-center gap-1 rounded-md border border-border p-2 text-xs"
          >
            {u.iconPath && (
              <img
                src={`https://cdn.legiontd2.com/${u.iconPath}`}
                alt={u.name}
                className="w-10 h-10 object-contain"
              />
            )}
            <span className="font-medium text-center leading-tight">{u.name}</span>
            <span className="text-muted-foreground">{u.goldCost ?? '?'}g</span>
            <span className="text-muted-foreground">{u.armorType}</span>
          </div>
        ))}
        {units.length === 0 && (
          <p className="col-span-8 text-sm text-muted-foreground">
            No units found. Make sure apps/api is running.
          </p>
        )}
      </div>
    </main>
  );
}
