"use client";

import * as React from "react";
import { FluidBlobs } from "@/components/ui/FluidBlobs";
import { GlowEffect } from "@/components/ui/glow-effect";
import { cn } from "@/lib/utils";

export interface BlobCardProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
  headerHeight?: number;
  lightColors?: string[];
  darkColors?: string[];
  glowColors?: string[];
  className?: string;
}

const DEFAULT_LIGHT = ["#ff3000", "#fc6a0f", "#e87f22", "#ffb385"];
const DEFAULT_DARK = ["#8c4a0f", "#e87f22", "#e87f22", "#ffb385"];
const DEFAULT_GLOW = ["#ffb385", "#e8c9a0", "#ffd6bb", "#d4713d", "#ffb385"];

export function BlobCard({
  header,
  children,
  headerHeight = 224,
  lightColors = DEFAULT_LIGHT,
  darkColors = DEFAULT_DARK,
  glowColors = DEFAULT_GLOW,
  className,
}: BlobCardProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="absolute -inset-[1.5px] rounded-[21.5px] overflow-hidden z-0">
        <GlowEffect
          colors={glowColors}
          mode="rotate"
          blur="strongest"
          duration={5}
          scale={1}
        />
      </div>

      <div className="relative z-10 rounded-[20px] overflow-hidden bg-background">
        <div
          className="relative overflow-hidden rounded-t-[20px]"
          style={{ height: headerHeight }}
        >
          <FluidBlobs
            lightColors={lightColors}
            darkColors={darkColors}
            origins={[
              { x: 50, y: 35 },
              { x: 50, y: 45 },
              { x: 50, y: 40 },
              { x: 50, y: 30 },
            ]}
            margin={60}
            blur={50}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
          {header && <div className="relative z-10 p-8 pb-0">{header}</div>}
        </div>

        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
