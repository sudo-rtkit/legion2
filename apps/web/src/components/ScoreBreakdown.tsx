'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ScoreBreakdownProps {
  breakdown: {
    damageScore: number;
    survivalScore: number;
    sendScore: number;
    valueScore: number;
    metaScore: number;
  };
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const data = [
    { subject: 'Damage', value: Math.round(breakdown.damageScore * 100) },
    { subject: 'Survival', value: Math.round(breakdown.survivalScore * 100) },
    { subject: 'Send', value: Math.round(breakdown.sendScore * 100) },
    { subject: 'Value', value: Math.round(breakdown.valueScore * 100) },
    { subject: 'Meta', value: Math.round(breakdown.metaScore * 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
