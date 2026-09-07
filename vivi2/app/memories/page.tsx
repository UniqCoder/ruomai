'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Surface } from '@/components/ui/Surface';
import { MemoryRow } from '@/components/ui/MemoryRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ViviStore } from '@/lib/store';
import { MemoryItem, MemoryCategory } from '@/lib/types/memory';
import { Brain, Plus, Search, Trash2, Sparkles } from 'lucide-react';

export default function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('long_term');
  const [newImportance, setNewImportance] = useState(3);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setMemories(ViviStore.getMemories());
  }, []);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    ViviStore.addMemory(newContent.trim(), newCategory, newImportance);
    setMemories(ViviStore.getMemories());
    setNewContent('');
    setIsAdding(false);
  };

  const handleUpdateMemory = (id: string, content: string, category: MemoryCategory, importance: number) => {
    ViviStore.updateMemory(id, content, category, importance);
    setMemories(ViviStore.getMemories());
  };

  const handleDeleteMemory = (id: string) => {
    ViviStore.deleteMemory(id);
    setMemories(ViviStore.getMemories());
  };

  const handleClearAll = () => {
    if (confirm('Clear all stored memories? This cannot be undone.')) {
      ViviStore.clearMemories();
      setMemories([]);
    }
  };

  // Filter & Search Logic
  const filteredMemories = memories.filter((m) => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Surface className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[var(--foreground)]">Memories</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                  {memories.length}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Long-term facts and episodic memories retrieved semantically to personalize Vivi&apos;s responses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add memory
            </button>

            {memories.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear all
              </button>
            )}
          </div>
        </Surface>

        {/* Add Memory Drawer/Form */}
        {isAdding && (
          <Surface className="p-5 flex flex-col gap-4 border-2 border-[var(--primary)]/40 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-display font-bold text-sm text-[var(--foreground)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Add New Memory
            </h3>
            <form onSubmit={handleAddMemory} className="flex flex-col gap-3">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. User likes espresso with oat milk and coding synthwave playlists..."
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 resize-none min-h-[80px]"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-semibold">
                    <span>Category:</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)]"
                    >
                      <option value="long_term">long-term</option>
                      <option value="episodic">episodic</option>
                      <option value="preference">preference</option>
                      <option value="fact">fact</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-semibold">
                    <span>Importance:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newImportance}
                      onChange={(e) => setNewImportance(parseInt(e.target.value, 10))}
                      className="w-14 px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-center text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                  >
                    Save memory
                  </button>
                </div>
              </div>
            </form>
          </Surface>
        )}

        {/* Search Bar + Category Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40"
            />
          </div>

          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'long_term', label: 'Long-term' },
              { value: 'episodic', label: 'Episodic' },
              { value: 'preference', label: 'Preference' },
            ]}
            value={filterCategory}
            onChange={(val) => setFilterCategory(val)}
            size="sm"
          />
        </div>

        {/* Memory List */}
        <div className="flex flex-col gap-3">
          {filteredMemories.length === 0 ? (
            <Surface className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Brain className="w-8 h-8 text-[var(--muted-foreground)] opacity-50" />
              <p className="text-sm font-semibold text-[var(--muted-foreground)]">No memories found</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Try adjusting your search query or category filter.
              </p>
            </Surface>
          ) : (
            filteredMemories.map((mem) => (
              <MemoryRow
                key={mem.id}
                memory={mem}
                onUpdate={handleUpdateMemory}
                onDelete={handleDeleteMemory}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
