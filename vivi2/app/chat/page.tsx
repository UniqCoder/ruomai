'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Surface } from '@/components/ui/Surface';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { ViviStore } from '@/lib/store';
import { Conversation } from '@/lib/types/chat';
import { PersonalityProfile, ViviMood } from '@/lib/types/personality';
import { Send, Trash2, Sparkles, ShieldAlert, Key } from 'lucide-react';
import { extractMemoryFromTurn } from '@/lib/ai/memories-service';
import { clsx } from 'clsx';

export default function ChatPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMood, setActiveMood] = useState<{ mood: ViviMood; emoji: string }>({
    mood: 'cheerful',
    emoji: '☕️',
  });
  const [aiEngineLabel, setAiEngineLabel] = useState<string>('Offline Fallback');
  const [isLiveAiActive, setIsLiveAiActive] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  useEffect(() => {
    setConversation(ViviStore.getConversation());
    const p = ViviStore.getPersonality();
    const settings = ViviStore.getSettings();
    setProfile(p);
    setActiveMood({ mood: p.current_mood || 'cheerful', emoji: '☕️' });

    const hasKey = Boolean(settings.openai_api_key && settings.openai_api_key.trim().length > 10);
    const hasBaseUrl = Boolean(settings.openai_base_url && settings.openai_base_url.trim().length > 5);

    setIsLiveAiActive(hasKey || hasBaseUrl);
    setAiEngineLabel(
      hasKey || hasBaseUrl
        ? `Live AI (${settings.openai_model || 'gpt-4o'})`
        : 'Local Engine (No API Key)'
    );
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isTyping]);

  const processSingleMessage = async (userText: string) => {
    ViviStore.addMessage('user', userText);
    setConversation(ViviStore.getConversation());
    setIsTyping(true);

    const settings = ViviStore.getSettings();
    const memories = ViviStore.getMemories();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: ViviStore.getConversation().messages,
          personalityProfile: profile,
          memoriesList: memories,
          userLanguage: settings.language,
          customApiKey: settings.openai_api_key,
          customBaseUrl: settings.openai_base_url,
          customModel: settings.openai_model,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('API error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = '';
      let assistantImageDataUrl = '';
      let assistantImageAlt = '';
      let assistantImagePrompt = '';
      let streamBuffer = '';

      const assistantMsg = ViviStore.addMessage('assistant', '');
      setConversation(ViviStore.getConversation());

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n\n');
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.mood && parsed.emoji) {
              setActiveMood({ mood: parsed.mood, emoji: parsed.emoji });
              if (typeof parsed.liveAI === 'boolean') {
                setIsLiveAiActive(parsed.liveAI);
                setAiEngineLabel(
                  parsed.liveAI
                    ? `Live AI (${parsed.modelUsed || settings.openai_model || 'gpt-4o'})`
                    : 'Local Engine (No API Key)'
                );
              }
              if (profile) {
                const updatedP = { ...profile, current_mood: parsed.mood };
                setProfile(updatedP);
                ViviStore.savePersonality(updatedP);
              }
            }
            if (typeof parsed.caption === 'string') {
              assistantResponseText = parsed.caption;
            }
            if (parsed.text) {
              assistantResponseText += parsed.text;
            }
            if (typeof parsed.imageDataUrl === 'string') {
              assistantImageDataUrl = parsed.imageDataUrl;
            }
            if (typeof parsed.imageAlt === 'string') {
              assistantImageAlt = parsed.imageAlt;
            }
            if (typeof parsed.imagePrompt === 'string') {
              assistantImagePrompt = parsed.imagePrompt;
            }

            ViviStore.updateMessage(assistantMsg.id, {
              content: assistantResponseText,
              imageDataUrl: assistantImageDataUrl,
              imageAlt: assistantImageAlt,
              imagePrompt: assistantImagePrompt,
            });
            setConversation(ViviStore.getConversation());
          } catch (e) {
            // ignore parse error
          }
        }
      }

      if (streamBuffer.trim().length > 0) {
        const trailingLines = streamBuffer.split('\n\n');
        for (const line of trailingLines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (typeof parsed.caption === 'string') {
              assistantResponseText = parsed.caption;
            }
            if (parsed.text) {
              assistantResponseText += parsed.text;
            }
            if (typeof parsed.imageDataUrl === 'string') {
              assistantImageDataUrl = parsed.imageDataUrl;
            }
            if (typeof parsed.imageAlt === 'string') {
              assistantImageAlt = parsed.imageAlt;
            }
            if (typeof parsed.imagePrompt === 'string') {
              assistantImagePrompt = parsed.imagePrompt;
            }
          } catch (e) {
            // ignore parse error
          }
        }
      }

      if (!assistantResponseText.trim() && !assistantImageDataUrl) {
        assistantResponseText = '...';
      }

      const updatedConv = ViviStore.getConversation();
      const finalMsgs = updatedConv.messages.map((m) =>
        m.id === assistantMsg.id
          ? {
              ...m,
              content: assistantResponseText,
              imageDataUrl: assistantImageDataUrl || m.imageDataUrl,
              imageAlt: assistantImageAlt || m.imageAlt,
              imagePrompt: assistantImagePrompt || m.imagePrompt,
            }
          : m
      );
      ViviStore.saveConversation({ ...updatedConv, messages: finalMsgs });
      setConversation(ViviStore.getConversation());

      if (settings.memory_enabled) {
        const extracted = extractMemoryFromTurn(userText, memories);
        if (extracted) {
          ViviStore.addMemory(extracted.content, extracted.category, extracted.importance);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      ViviStore.addMessage('assistant', 'ups, kurz leitungsausfall... sag nochmal? ☕️');
      setConversation(ViviStore.getConversation());
    }
  };

  const processQueuedMessages = async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    try {
      while (pendingMessagesRef.current.length > 0) {
        const nextMessage = pendingMessagesRef.current.shift();
        if (!nextMessage) continue;
        await processSingleMessage(nextMessage);
      }
    } finally {
      isProcessingQueueRef.current = false;
      setIsTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || !conversation) return;

    const userText = input.trim();
    setInput('');
    pendingMessagesRef.current.push(userText);
    void processQueuedMessages();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleClearChat = () => {
    if (confirm('Clear active conversation thread?')) {
      ViviStore.clearConversation();
      setConversation(ViviStore.getConversation());
    }
  };

  const handleDeleteMessage = (id: string) => {
    ViviStore.deleteMessage(id);
    setConversation(ViviStore.getConversation());
  };

  const getMoodBadgeColor = (mood: ViviMood) => {
    switch (mood) {
      case 'excited':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-300 dark:border-pink-800';
      case 'pouty':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'empathetic':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'playful':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  if (!profile || !conversation) return null;

  return (
    <AppShell>
      <Surface className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] max-h-[850px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-[var(--primary)]/30 shrink-0">
              <Image src="/vivi_avatar.jpg" alt="Vivi" fill sizes="40px" className="object-cover" />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-[var(--foreground)]">Vivi</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-[11px] font-mono capitalize flex items-center gap-1 shadow-2xs">
                  <span>{activeMood.emoji}</span>
                  <span className={clsx('px-1.5 py-0.5 rounded-full border', getMoodBadgeColor(activeMood.mood))}>
                    {activeMood.mood}
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                <span>{isTyping ? 'Vivi is typing...' : 'INFJ companion'}</span>
                <span>·</span>
                <span className={isLiveAiActive ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                  {aiEngineLabel}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveAiActive && (
              <Link
                href="/settings"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--border)] transition-colors"
              >
                <Key className="w-3.5 h-3.5" /> Connect API Key
              </Link>
            )}
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 transition-colors cursor-pointer"
              title="Clear thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear thread</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
              <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--foreground)]">Chat with Vivi (INFJ)</h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm leading-relaxed">
                Ask anything! She responds in your language, loves swimming 🏊‍♀️, sauna 🧖‍♀️, pink aesthetics 🌸, and deep talks.
              </p>
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onDelete={handleDeleteMessage} />
            ))
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5 my-2 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[var(--border)] relative bg-[var(--secondary)]">
                <Image src="/vivi_avatar.jpg" alt="Vivi" fill sizes="32px" className="object-cover" />
              </div>
              <div className="px-4 py-3 bg-[var(--secondary)] rounded-2xl rounded-bl-xs border border-[var(--border)]/60 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] motion-safe:animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] motion-safe:animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] motion-safe:animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 bg-[var(--background)] p-2 rounded-2xl border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)]/40 transition-all"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vivi anything... or type 'send: cozy selfie by the window' for a photo"
              className="flex-1 px-3 py-1.5 text-sm bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none resize-none max-h-32 leading-relaxed"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* AI Representation Disclaimer */}
          <div className="flex items-center justify-between px-1 text-[11px] text-[var(--muted-foreground)]">
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-[var(--primary)] shrink-0" />
              <span>AI personality representation — not the real person. Use `send:` for photo requests.</span>
            </div>

            {!isLiveAiActive && (
              <Link href="/settings" className="text-[var(--primary)] hover:underline font-semibold flex items-center gap-1">
                <Key className="w-3 h-3" /> Connect OpenAI / Ollama Key
              </Link>
            )}
          </div>
        </div>
      </Surface>
    </AppShell>
  );
}
