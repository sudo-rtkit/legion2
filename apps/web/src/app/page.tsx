import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">LTD2 Coach</h1>
      <p className="text-muted-foreground max-w-md">
        Legion TD 2 build advisor. Select your wave, available gold, and rolled fighters — get the
        top 3 build recommendations with lane positioning.
      </p>
      <Link href="/planner">
        <Button size="lg">Open Planner</Button>
      </Link>
    </main>
  );
}
