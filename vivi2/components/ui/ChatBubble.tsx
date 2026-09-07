'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/lib/types/chat';
import { clsx } from 'clsx';
import { Copy, RefreshCw, Trash2, Check } from 'lucide-react';
import Image from 'next/image';

interface ChatBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onDelete?: (id: string) => void;
  avatarUrl?: string;
}

export function ChatBubble({ message, onRegenerate, onDelete, avatarUrl = '/vivi_avatar.jpg' }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || message.imagePrompt || message.imageAlt || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={clsx(
        'flex items-end gap-2.5 group my-1.5 max-w-[88%] sm:max-w-[80%]',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[var(--border)] relative bg-[var(--secondary)]">
          <Image src={avatarUrl} alt="Vivi" fill sizes="32px" className="object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={clsx(
            'px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs transition-all',
            isUser
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-2xl rounded-br-xs font-medium'
              : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-2xl rounded-bl-xs border border-[var(--border)]/60'
          )}
        >
          {message.imageDataUrl && (
            <div className={clsx('mb-2 overflow-hidden rounded-xl border border-[var(--border)]/60 bg-black/5')}>
              <img
                src={message.imageDataUrl}
                alt={message.imageAlt || 'Generated photo'}
                className="block w-full h-auto max-w-full"
              />
            </div>
          )}
          {message.content}
        </div>

        {/* Timestamp & Hover Action Controls */}
        <div
          className={clsx(
            'flex items-center gap-2 px-1 text-[11px] text-[var(--muted-foreground)] opacity-70 group-hover:opacity-100 transition-opacity',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{message.timestamp}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-[var(--secondary)] transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>

            {!isUser && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1 rounded-md hover:bg-[var(--secondary)] transition-colors"
                title="Regenerate AI response"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
