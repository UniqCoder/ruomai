'use client';

import Image from 'next/image';

export function LilyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Top-Right Soft Pink Gradient Orb */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40 dark:opacity-20 transition-all duration-700"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.2 350) 0%, transparent 70%)' }}
      />

      {/* Bottom-Left Accent Soft Orb */}
      <div
        className="absolute -bottom-32 -left-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-35 dark:opacity-15 transition-all duration-700"
        style={{ background: 'radial-gradient(circle, oklch(0.75 0.18 340) 0%, transparent 70%)' }}
      />

      {/* Center Subtle Warm Atmosphere Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[30rem] rounded-full blur-[120px] opacity-15 dark:opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.8 0.12 350) 0%, transparent 80%)' }}
      />

      {/* Decorative Lily Flower Image (Top Right Edge) */}
      <div className="absolute top-10 right-4 md:right-12 w-48 h-48 opacity-10 dark:opacity-15 mix-blend-multiply dark:mix-blend-screen pointer-events-none transition-opacity duration-500">
        <Image
          src="/lily_texture.jpg"
          alt=""
          fill
          sizes="192px"
          className="object-contain"
          priority={false}
        />
      </div>

      {/* Decorative Lily Flower Image (Bottom Left Edge) */}
      <div className="absolute bottom-16 left-4 md:left-8 w-56 h-56 opacity-10 dark:opacity-15 mix-blend-multiply dark:mix-blend-screen pointer-events-none transition-opacity duration-500 rotate-180">
        <Image
          src="/lily_texture.jpg"
          alt=""
          fill
          sizes="224px"
          className="object-contain"
          priority={false}
        />
      </div>
    </div>
  );
}
