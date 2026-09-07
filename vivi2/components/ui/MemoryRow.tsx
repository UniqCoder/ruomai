'use client';

import React, { useState } from 'react';
import { MemoryItem, MemoryCategory } from '@/lib/types/memory';
import { Surface } from './Surface';
import { Trash2, Check, Edit2, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface MemoryRowProps {
  memory: MemoryItem;
  onUpdate: (id: string, content: string, category: MemoryCategory, importance: number) => void;
  onDelete: (id: string) => void;
}

export function MemoryRow({ memory, onUpdate, onDelete }: MemoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(memory.content);
  const [category, setCategory] = useState<MemoryCategory>(memory.category);
  const [importance, setImportance] = useState(memory.importance);

  const handleSave = () => {
    onUpdate(memory.id, content, category, importance);
    setIsEditing(false);
  };

  const getCategoryColor = (cat: MemoryCategory) => {
    switch (cat) {
      case 'long_term':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      case 'episodic':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'preference':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)]';
    }
  };

  return (
    <Surface className="p-4 group transition-all duration-200 hover:border-[var(--primary)]/50">
      <div className="flex flex-col gap-3">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 resize-none min-h-[70px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                >
                  <option value="long_term">long-term</option>
                  <option value="episodic">episodic</option>
                  <option value="preference">preference</option>
                  <option value="fact">fact</option>
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--muted-foreground)]">Score:</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={importance}
                    onChange={(e) => setImportance(parseInt(e.target.value, 10))}
                    className="w-12 px-2 py-1 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                    getCategoryColor(memory.category)
                  )}
                >
                  {memory.category.replace('_', '-')}
                </span>

                <div className="flex items-center text-amber-500 text-xs gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-semibold">{memory.importance}/5</span>
                </div>

                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {new Date(memory.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <p className="text-sm text-[var(--foreground)] leading-relaxed">{memory.content}</p>
            </div>

            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                title="Edit Memory"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(memory.id)}
                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-[var(--muted-foreground)] hover:text-rose-600 transition-colors"
                title="Delete Memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Surface>
  );
}
