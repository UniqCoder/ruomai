'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { Surface } from '@/components/ui/Surface';
import { StatCard } from '@/components/ui/StatCard';
import { ViviStore } from '@/lib/store';
import { PersonalityProfile } from '@/lib/types/personality';
import { MemoryItem } from '@/lib/types/memory';
import { ChatMessage } from '@/lib/types/chat';
import { MessageCircle, Sliders, Brain, ArrowRight, Sparkles, Globe, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export default function HomePage() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setProfile(ViviStore.getPersonality());
    setMemories(ViviStore.getMemories());
    const conv = ViviStore.getConversation();
    setRecentMessages(conv.messages.slice(-2));
  }, []);

  if (!profile) return null;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Hero Card (.surface.paper-grain) */}
        <Surface paperGrain className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Avatar Left */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-4 ring-[var(--primary)]/20 shadow-md shrink-0 bg-[var(--secondary)]">
            <Image
              src="/vivi_avatar.jpg"
              alt="Vivi"
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className="object-cover"
              priority
            />
          </div>

          {/* Info Right */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0 gap-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Available · AI personality representation
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-[var(--foreground)] tracking-tight">
              Vivi
            </h1>

            <p className="text-sm md:text-base text-[var(--muted-foreground)] leading-relaxed max-w-2xl font-medium">
              An AI personality shaped by her communication style, humour, interests and the conversations you&apos;ve shared.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-4 h-4" /> Start chatting
              </Link>
              <Link
                href="/personality"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
              >
                <Sliders className="w-4 h-4 text-[var(--primary)]" /> Tune personality
              </Link>
            </div>
          </div>
        </Surface>

        {/* Stats Row (3 Columns on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Brain className="w-6 h-6 text-pink-500" />}
            label="Memories stored"
            value={memories.length}
            subtext="Semantic vectors indexed"
          />
          <StatCard
            icon={<MessageCircle className="w-6 h-6 text-purple-500" />}
            label="Conversations"
            value="12"
            subtext="Active memory context thread"
          />
          <StatCard
            icon={<Globe className="w-6 h-6 text-amber-500" />}
            label="Languages"
            value="Deutsch · English"
            subtext="Natural code-switching"
          />
        </div>

        {/* Two-Column Grid: Recent Conversation + Personality Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Conversation */}
          <Surface className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-display text-base font-bold text-[var(--foreground)]">Recent conversation</h3>
              </div>
              <Link
                href="/chat"
                className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
              >
                Continue <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-col gap-3 p-3 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60">
              {recentMessages.length > 0 ? (
                recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'p-3 rounded-xl text-xs leading-relaxed max-w-[90%]',
                      msg.sender === 'user'
                        ? 'ml-auto bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-xs'
                        : 'mr-auto bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-xs'
                    )}
                  >
                    <span className="font-semibold block text-[10px] opacity-70 mb-0.5">
                      {msg.sender === 'user' ? 'You' : 'Vivi'}
                    </span>
                    {msg.content}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--muted-foreground)] text-center py-4">No recent messages yet.</p>
              )}
            </div>
          </Surface>

          {/* Personality Summary */}
          <Surface className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-display text-base font-bold text-[var(--foreground)]">Personality summary</h3>
              </div>
              <Link href="/personality" className="text-xs font-bold text-[var(--primary)] hover:underline">
                Edit profile
              </Link>
            </div>

            {/* Trait Progress Bars */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Directness', val: profile.traits.directness },
                { label: 'Humour', val: profile.traits.humor },
                { label: 'Sarcasm', val: profile.traits.sarcasm },
                { label: 'Playfulness', val: profile.traits.playfulness },
              ].map((t) => (
                <div key={t.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--foreground)]">{t.label}</span>
                    <span className="text-[var(--muted-foreground)]">{t.val}/10</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                      style={{ width: `${t.val * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Interest Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.interests.hobbies.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Surface>
        </div>

        {/* Latest Memories List */}
        <Surface className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-display text-base font-bold text-[var(--foreground)]">Latest memories</h3>
            </div>
            <Link
              href="/memories"
              className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              View all ({memories.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memories.slice(0, 4).map((mem) => (
              <div
                key={mem.id}
                className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--card)] border border-[var(--border)] text-[var(--primary)]">
                    {mem.category.replace('_', '-')}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {new Date(mem.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">{mem.content}</p>
              </div>
            ))}
          </div>
        </Surface>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-[var(--accent)]/30 border border-[var(--border)] flex items-center gap-3 text-xs text-[var(--accent-foreground)]">
          <ShieldCheck className="w-5 h-5 shrink-0 text-[var(--primary)]" />
          <span>
            Vivi is presented strictly as an AI personality companion representation. Your conversations and long-term memory remain private to your local device and Supabase account.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
