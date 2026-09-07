'use client';

import React from 'react';

interface TraitSliderProps {
  label: string;
  value: number; // 1-10
  onChange: (val: number) => void;
  hint?: string;
  min?: number;
  max?: number;
}

export function TraitSlider({ label, value, onChange, hint, min = 1, max = 10 }: TraitSliderProps) {
  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold font-display text-[var(--foreground)]">{label}</label>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
          {value} / {max}
        </span>
      </div>

      {hint && <p className="text-xs text-[var(--muted-foreground)] leading-tight">{hint}</p>}

      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs text-[var(--muted-foreground)] font-semibold font-mono">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--secondary)] accent-[var(--primary)] focus:outline-none"
        />
        <span className="text-xs text-[var(--muted-foreground)] font-semibold font-mono">{max}</span>
      </div>
    </div>
  );
}
