'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Surface } from '@/components/ui/Surface';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ViviStore } from '@/lib/store';
import { UserSettings, ThemeMode, LanguagePreference, ResponseLengthPreference } from '@/lib/types/user';
import { Settings as SettingsIcon, Sun, Moon, Globe, Brain, Trash2, LogOut, Check, Key, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [modelInput, setModelInput] = useState('openai/gpt-oss-20b:free');
  const [savedNotice, setSavedNotice] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  useEffect(() => {
    const s = ViviStore.getSettings();
    setSettings(s);
    setApiKeyInput(s.openai_api_key || '');
    setBaseUrlInput(s.openai_base_url || '');
    setModelInput(s.openai_model || 'openai/gpt-oss-20b:free');
  }, []);

  if (!settings) return null;

  const updateSetting = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    ViviStore.saveSettings(updated);

    if (key === 'theme') {
      if (val === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    let url = baseUrlInput.trim();
    let model = modelInput.trim();

    // Auto provider defaults
    if (key.startsWith('gsk_')) {
      if (!url) url = 'https://api.groq.com/openai/v1';
      if (!model || model === 'gpt-4o') model = 'llama-3.3-70b-versatile';
    } else if (key.startsWith('sk-or-v1-')) {
      if (!url) url = 'https://openrouter.ai/api/v1';
      if (!model || model === 'gpt-4o' || model.includes('3.2-3b') || model.includes('gemma-2') || model.includes('3.3-70b')) {
        model = 'openai/gpt-oss-20b:free';
      }
    } else if (!model) {
      model = 'gpt-4o';
    }

    setBaseUrlInput(url);
    setModelInput(model);

    const updated = {
      ...settings,
      openai_api_key: key,
      openai_base_url: url,
      openai_model: model,
    };
    setSettings(updated);
    ViviStore.saveSettings(updated);
    setSavedNotice(true);
    alert(`AI Settings saved! Vivi is now connected to ${model}.`);
  };

  const applyGroqPreset = () => {
    setBaseUrlInput('https://api.groq.com/openai/v1');
    setModelInput('llama-3.3-70b-versatile');
  };

  const applyOpenRouterPreset = () => {
    setBaseUrlInput('https://openrouter.ai/api/v1');
    setModelInput('openai/gpt-oss-20b:free');
  };

  const applyOpenAiPreset = () => {
    setBaseUrlInput('');
    setModelInput('gpt-4o');
  };

  const applyOllamaPreset = () => {
    setApiKeyInput('ollama');
    setBaseUrlInput('http://localhost:11434/v1');
    setModelInput('llama3');
  };

  const handleClearChat = () => {
    if (confirm('Clear all conversation history?')) {
      ViviStore.clearConversation();
      alert('Conversation cleared.');
    }
  };

  const handleClearMemories = () => {
    if (confirm('Clear all stored memories?')) {
      ViviStore.clearMemories();
      alert('Memories cleared.');
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Surface className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--foreground)]">Settings & Neural AI Brain</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Connect OpenAI, free Groq/OpenRouter keys, or local Ollama for live un-scripted AI responses.
              </p>
            </div>
          </div>

          {savedNotice && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </Surface>

        {/* Live Provider Presets & Key Form */}
        <Surface className="p-6 border-2 border-[var(--primary)]/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--foreground)]">Live AI Provider Configuration</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] font-mono truncate max-w-[220px]">
              Model: {settings.openai_model || 'openai/gpt-oss-20b:free'}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> One-Click Provider Presets:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyOpenRouterPreset}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                🌐 OpenRouter (Free GPT OSS 20B)
              </button>
              <button
                type="button"
                onClick={applyGroqPreset}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                ⚡ Groq (Free & Fast Llama 3.3 70B)
              </button>
              <button
                type="button"
                onClick={applyOpenAiPreset}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                🤖 OpenAI (GPT-4o)
              </button>
              <button
                type="button"
                onClick={applyOllamaPreset}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                💻 Ollama (Local PC)
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveAiConfig} className="flex flex-col gap-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* API Key */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--foreground)]">API Key</label>
                <div className="relative">
                  <input
                    type={keyVisible ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-or-v1-... or gsk_... or sk-proj-..."
                    className="w-full pl-3 pr-14 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyVisible(!keyVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {keyVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--foreground)]">Base URL Endpoint</label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="https://openrouter.ai/api/v1"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                <span className="text-xs font-bold text-[var(--foreground)] shrink-0">Model Name:</span>
                <div className="flex items-center gap-2 w-full">
                  <select
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] font-mono flex-1 max-w-[280px]"
                  >
                    <option value="openai/gpt-oss-20b:free">openai/gpt-oss-20b:free (Active OpenRouter Free)</option>
                    <option value="google/gemma-4-31b-it:free">google/gemma-4-31b-it:free (Active OpenRouter Free)</option>
                    <option value="nvidia/nemotron-nano-9b-v2:free">nvidia/nemotron-nano-9b-v2:free (Active OpenRouter Free)</option>
                    <option value="liquid/lfm-2.5-2.6b:free">liquid/lfm-2.5-2.6b:free (Active OpenRouter Free)</option>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Groq Free)</option>
                    <option value="gpt-4o">gpt-4o (OpenAI)</option>
                    <option value="llama3">llama3 (Ollama Local)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Sparkles className="w-4 h-4" /> Save AI Brain Config
              </button>
            </div>
          </form>

          {(settings.openai_api_key || settings.openai_base_url) && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4" /> Configured AI Engine: {settings.openai_model || 'openai/gpt-oss-20b:free'}
            </div>
          )}
        </Surface>

        {/* Divided Settings Surface */}
        <Surface className="divide-y divide-[var(--border)] overflow-hidden">
          {/* Row 1: Theme */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sun className="w-4 h-4 text-[var(--primary)]" /> Theme Mode
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Select your preferred visual appearance.
              </span>
            </div>

            <SegmentedControl
              options={[
                { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
              ]}
              value={settings.theme}
              onChange={(val) => updateSetting('theme', val as ThemeMode)}
              size="sm"
            />
          </div>

          {/* Row 2: Language Preference */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--primary)]" /> Conversational Language Mode
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Vivi automatically matches German, English, or mixed replies.
              </span>
            </div>

            <SegmentedControl
              options={[
                { value: 'mixed', label: 'Mixed' },
                { value: 'deutsch', label: 'Deutsch' },
                { value: 'english', label: 'English' },
              ]}
              value={settings.language}
              onChange={(val) => updateSetting('language', val as LanguagePreference)}
              size="sm"
            />
          </div>

          {/* Row 3: Response Length */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-[var(--foreground)]">AI Response Length</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Preferred length of generated messages.
              </span>
            </div>

            <SegmentedControl
              options={[
                { value: 'short', label: 'Short' },
                { value: 'medium', label: 'Medium' },
                { value: 'long', label: 'Long' },
              ]}
              value={settings.response_length}
              onChange={(val) => updateSetting('response_length', val as ResponseLengthPreference)}
              size="sm"
            />
          </div>

          {/* Row 4: Memory System Toggle */}
          <div className="p-5">
            <ToggleSwitch
              label="Automatic Long-term Memory"
              description="Automatically extract useful facts from chat turns to personalize future conversations."
              checked={settings.memory_enabled}
              onChange={(val) => updateSetting('memory_enabled', val)}
            />
          </div>

          {/* Row 5: Actions */}
          <div className="p-5 flex flex-col gap-3 bg-[var(--secondary)]/20">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Data & Privacy Controls
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear conversation history
              </button>

              <button
                type="button"
                onClick={handleClearMemories}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Brain className="w-3.5 h-3.5" /> Clear stored memories
              </button>
            </div>
          </div>
        </Surface>

        {/* Account Info */}
        <Surface className="p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--foreground)]">Private Companion Instance</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Client session active · Private AI personality simulation
            </span>
          </div>
          <button
            type="button"
            onClick={() => alert('Signed out of local session.')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </Surface>
      </div>
    </AppShell>
  );
}
