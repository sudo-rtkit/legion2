import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="px-5 h-12 flex items-center border-b border-chrome-subtle">
        <span className="font-mono text-sm font-semibold tracking-[0.18em] uppercase text-ink">
          LTD2 Coach
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <div className="space-y-4">
          <h1 className="text-[2rem] font-semibold tracking-tight text-ink leading-tight">
            Legion TD 2<br />
            <span className="text-lime">Build Advisor</span>
          </h1>
          <p className="text-ink-2 text-sm leading-relaxed max-w-xs mx-auto">
            Input your gold, rolled fighters, and incoming wave — get the top 3 build
            recommendations with optimal lane positioning.
          </p>
        </div>

        <Link
          href="/planner"
          className="inline-flex items-center gap-2 bg-lime text-base font-semibold text-sm px-6 py-2.5 rounded hover:bg-lime-hover transition-colors"
        >
          Open Planner
        </Link>

        <div className="flex gap-6 text-xs text-ink-3">
          <Link href="/units" className="hover:text-ink-2 transition-colors">
            Units
          </Link>
          <Link href="/about" className="hover:text-ink-2 transition-colors">
            About
          </Link>
        </div>
      </main>
    </div>
  );
}
