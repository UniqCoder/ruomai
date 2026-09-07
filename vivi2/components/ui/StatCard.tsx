import React from 'react';
import { Surface } from './Surface';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

export function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <Surface className="p-4 flex items-center gap-4 hover:border-[var(--primary)]/40 transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xl font-bold font-display text-[var(--foreground)] truncate">
          {value}
        </span>
        {subtext && (
          <span className="text-[11px] text-[var(--muted-foreground)] truncate">{subtext}</span>
        )}
      </div>
    </Surface>
  );
}
