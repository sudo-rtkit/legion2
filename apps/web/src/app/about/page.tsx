export default function AboutPage() {
  return (
    <main className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold">About LTD2 Coach</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">How it works</h2>
        <p className="text-sm text-muted-foreground">
          LTD2 Coach uses a beam-search algorithm to evaluate build combinations from your rolled
          fighters. Each build is scored across five dimensions: damage effectiveness, survival,
          send potential, gold value, and meta popularity.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Scoring weights</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Damage — 30%</li>
          <li>Survival — 25%</li>
          <li>Meta — 20%</li>
          <li>Send — 15%</li>
          <li>Value — 10%</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Disclaimer</h2>
        <p className="text-sm text-muted-foreground">
          This is an unofficial fan tool and is not affiliated with Lextalia. Game data is fetched
          from the official LTD2 public API. Recommendations are heuristic and may not reflect
          optimal play at all skill levels.
        </p>
      </section>
    </main>
  );
}
