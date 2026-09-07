'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { clsx } from 'clsx';
import {
  Home,
  MessageCircle,
  Brain,
  Sliders,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Info,
} from 'lucide-react';
import { LilyBackground } from '../common/LilyBackground';
import { ViviStore } from '@/lib/store';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const settings = ViviStore.getSettings();
    const activeTheme = settings.theme === 'system' ? 'dark' : settings.theme;
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const current = ViviStore.getSettings();
    ViviStore.saveSettings({ ...current, theme: nextTheme });
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/memories', label: 'Memories', icon: Brain },
    { href: '/personality', label: 'Personality', icon: Sliders },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen relative flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/20">
      {/* Soft Blurred Background Gradient Orbs & Lily Flowers */}
      <LilyBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col md:flex-row px-3 sm:px-6 py-4 md:py-8 gap-6">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 rounded-3xl surface p-5 justify-between sticky top-8 h-[calc(100vh-4rem)] border border-[var(--border)] shadow-sm backdrop-blur-md bg-[var(--card)]/90">
          <div className="flex flex-col gap-6">
            {/* Header / Avatar Info */}
            <div className="flex items-center gap-3 p-1">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-[var(--primary)]/30 shrink-0">
                <Image
                  src="/vivi_avatar.jpg"
                  alt="Vivi Avatar"
                  fill
                  sizes="48px"
                  className="object-cover"
                  priority
                />
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-lg font-bold text-[var(--foreground)] tracking-tight">
                    Vivi
                  </h2>
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--muted-foreground)] tracking-wide uppercase">
                  AI representation
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group',
                      isActive
                        ? 'bg-[var(--secondary)] text-[var(--primary)] font-bold shadow-2xs'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                        isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer & Theme Switcher */}
          <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] text-sm font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-xs">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--muted-foreground)] uppercase">Toggle</span>
            </button>

            <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-[var(--accent)]/30 border border-[var(--border)]/40 text-[11px] leading-relaxed text-[var(--accent-foreground)] opacity-90">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--primary)]" />
              <span>Private simulation inspired by a real person&apos;s style. Not the real person.</span>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)]/90 backdrop-blur-lg border-t border-[var(--border)] px-4 py-2 flex items-center justify-around shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-xs transition-all duration-200',
                  isActive
                    ? 'bg-[var(--secondary)] text-[var(--primary)] font-bold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-[var(--primary)]' : '')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
