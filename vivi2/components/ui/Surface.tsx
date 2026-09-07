import React from 'react';
import { clsx } from 'clsx';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  paperGrain?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Surface({ paperGrain = false, children, className, ...props }: SurfaceProps) {
  return (
    <div
      className={clsx(
        'surface transition-colors duration-200',
        paperGrain && 'paper-grain',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
