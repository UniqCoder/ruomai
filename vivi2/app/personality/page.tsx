'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Surface } from '@/components/ui/Surface';
import { TraitSlider } from '@/components/ui/TraitSlider';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ViviStore } from '@/lib/store';
import { PersonalityProfile, ExampleConversation, ViviMood } from '@/lib/types/personality';
import { Sliders, Save, MessageSquare, Heart, Sparkles, Plus, Trash2, ShieldAlert, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export default function PersonalityPage() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'traits' | 'communication' | 'interests' | 'examples' | 'context'>('traits');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states for new tags/examples
  const [newExpression, setNewExpression] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [newDislikedTopic, setNewDislikedTopic] = useState('');

  // New example form state
  const [newExCategory, setNewExCategory] = useState<ExampleConversation['category']>('teasing');
  const [newExUser, setNewExUser] = useState('');
  const [newExAi, setNewExAi] = useState('');

  useEffect(() => {
    setProfile(ViviStore.getPersonality());
  }, []);

  if (!profile) return null;

  const handleSave = () => {
    const updated = ViviStore.savePersonality(profile);
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const updateTrait = (key: keyof PersonalityProfile['traits'], val: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        traits: { ...prev.traits, [key]: val },
      };
    });
  };

  const setManualMood = (mood: ViviMood) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, current_mood: mood };
      ViviStore.savePersonality(updated);
      return updated;
    });
  };

  const updateCommunication = <K extends keyof PersonalityProfile['communication']>(
    key: K,
    val: PersonalityProfile['communication'][K]
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        communication: { ...prev.communication, [key]: val },
      };
    });
  };

  const addExpression = () => {
    if (!newExpression.trim()) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        communication: {
          ...prev.communication,
          typical_expressions: [...prev.communication.typical_expressions, newExpression.trim()],
        },
      };
    });
    setNewExpression('');
  };

  const removeExpression = (expr: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        communication: {
          ...prev.communication,
          typical_expressions: prev.communication.typical_expressions.filter((e) => e !== expr),
        },
      };
    });
  };

  const addHobby = () => {
    if (!newHobby.trim()) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        interests: {
          ...prev.interests,
          hobbies: [...prev.interests.hobbies, newHobby.trim()],
        },
      };
    });
    setNewHobby('');
  };

  const removeHobby = (hobby: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        interests: {
          ...prev.interests,
          hobbies: prev.interests.hobbies.filter((h) => h !== hobby),
        },
      };
    });
  };

  const addDislikedTopic = () => {
    if (!newDislikedTopic.trim()) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        interests: {
          ...prev.interests,
          disliked_topics: [...prev.interests.disliked_topics, newDislikedTopic.trim()],
        },
      };
    });
    setNewDislikedTopic('');
  };

  const removeDislikedTopic = (topic: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        interests: {
          ...prev.interests,
          disliked_topics: prev.interests.disliked_topics.filter((t) => t !== topic),
        },
      };
    });
  };

  const addExample = () => {
    if (!newExUser.trim() || !newExAi.trim()) return;
    const newEx: ExampleConversation = {
      id: `ex-${Date.now()}`,
      category: newExCategory,
      user_prompt: newExUser.trim(),
      ai_response: newExAi.trim(),
    };
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        examples: [...prev.examples, newEx],
      };
    });
    setNewExUser('');
    setNewExAi('');
  };

  const removeExample = (id: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        examples: prev.examples.filter((e) => e.id !== id),
      };
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Surface className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[var(--foreground)]">INFJ Personality Engine</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                  {profile.mbti}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Tune Vivi&apos;s traits, sensitive nature, swimming/sauna passions, and dynamic mood engine.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" /> {savedSuccess ? 'Profile saved!' : 'Save profile'}
          </button>
        </Surface>

        {/* Dynamic Mood State Tester */}
        <Surface className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[var(--primary)]" /> Current Active Mood State
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--secondary)] text-[var(--primary)] capitalize">
              Current: {profile.current_mood || 'cheerful'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { mood: 'cheerful', label: 'Cheerful ☕️' },
              { mood: 'playful', label: 'Playful 💅' },
              { mood: 'excited', label: 'Excited (Swimming/Sauna) 🏊‍♀️' },
              { mood: 'empathetic', label: 'Empathetic 🥺' },
              { mood: 'pouty', label: 'Pouty / Dry 🙄' },
            ].map((m) => (
              <button
                key={m.mood}
                type="button"
                onClick={() => setManualMood(m.mood as ViviMood)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                  profile.current_mood === m.mood
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                    : 'bg-[var(--card)] hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)]'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Surface>

        {/* Tab Bar */}
        <div className="overflow-x-auto pb-1">
          <SegmentedControl
            options={[
              { value: 'traits', label: 'Traits' },
              { value: 'communication', label: 'Communication' },
              { value: 'interests', label: 'Interests & Color' },
              { value: 'examples', label: 'Examples' },
              { value: 'context', label: 'Context' },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
          />
        </div>

        {/* TAB 1: TRAITS */}
        {activeTab === 'traits' && (
          <Surface className="p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--foreground)]">INFJ Personality Traits</h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Adjust sliders on a scale from 1 to 10 to calibrate Vivi&apos;s baseline disposition and INFJ emotional metrics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TraitSlider
                label="Sensitivity (INFJ Core)"
                value={profile.traits.sensitivity || 9}
                onChange={(v) => updateTrait('sensitivity', v)}
                hint="High values make her deeply perceptive to emotional tone & hurt by mean replies."
              />
              <TraitSlider
                label="Emotional Openness"
                value={profile.traits.emotional_openness}
                onChange={(v) => updateTrait('emotional_openness', v)}
                hint="Willingness to offer deep support and express genuine empathy."
              />
              <TraitSlider
                label="Directness"
                value={profile.traits.directness}
                onChange={(v) => updateTrait('directness', v)}
                hint="High values make her straightforward and filter-free."
              />
              <TraitSlider
                label="Humour"
                value={profile.traits.humor}
                onChange={(v) => updateTrait('humor', v)}
                hint="Frequency of witty remarks, jokes, and funny observations."
              />
              <TraitSlider
                label="Sarcasm"
                value={profile.traits.sarcasm}
                onChange={(v) => updateTrait('sarcasm', v)}
                hint="Level of dry banter, teasing, and sarcastic humor."
              />
              <TraitSlider
                label="Playfulness"
                value={profile.traits.playfulness}
                onChange={(v) => updateTrait('playfulness', v)}
                hint="Lightheartedness, playful energy, and conversational banter."
              />
              <TraitSlider
                label="Curiosity"
                value={profile.traits.curiosity}
                onChange={(v) => updateTrait('curiosity', v)}
                hint="How frequently she asks follow-up questions about your day."
              />
              <TraitSlider
                label="Formality"
                value={profile.traits.formality}
                onChange={(v) => updateTrait('formality', v)}
                hint="Keep low (2/10) for relaxed, casual friend-to-friend texting."
              />
            </div>
          </Surface>
        )}

        {/* TAB 2: COMMUNICATION */}
        {activeTab === 'communication' && (
          <Surface className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--foreground)]">Communication Style & Adaptive Language</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60">
                <label className="text-xs font-bold text-[var(--foreground)]">Average Message Length</label>
                <select
                  value={profile.communication.average_message_length}
                  onChange={(e) => updateCommunication('average_message_length', e.target.value as any)}
                  className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)]"
                >
                  <option value="short">Short (1-2 sentences)</option>
                  <option value="short-medium">Short-Medium (Natural texting)</option>
                  <option value="medium">Medium (Detailed replies)</option>
                  <option value="detailed">Detailed (Paragraphs)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60">
                <label className="text-xs font-bold text-[var(--foreground)]">Emoji Frequency</label>
                <select
                  value={profile.communication.emoji_frequency}
                  onChange={(e) => updateCommunication('emoji_frequency', e.target.value as any)}
                  className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)]"
                >
                  <option value="none">None</option>
                  <option value="low">Low (Occasional ☕️)</option>
                  <option value="medium">Medium (Natural 😌, 🏊‍♀️, 🧖‍♀️)</option>
                  <option value="high">High (Expressive ✨, 🌸)</option>
                </select>
              </div>
            </div>

            {/* Language Switching Controls */}
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                Adaptive Language & Code-Switching Behavior
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleSwitch
                  label="Enable German"
                  description="Use German vocabulary naturally."
                  checked={profile.communication.uses_german}
                  onChange={(val) => updateCommunication('uses_german', val)}
                />
                <ToggleSwitch
                  label="Enable English"
                  description="Use English vocabulary naturally."
                  checked={profile.communication.uses_english}
                  onChange={(val) => updateCommunication('uses_english', val)}
                />
                <ToggleSwitch
                  label="Language Switching (Code-Switching)"
                  description="Mix German & English phrases naturally in conversation."
                  checked={profile.communication.language_switching}
                  onChange={(val) => updateCommunication('language_switching', val)}
                />
                <ToggleSwitch
                  label="Use Sarcasm & Banter"
                  description="Allow playful teasing and dry humor."
                  checked={profile.communication.uses_sarcasm}
                  onChange={(val) => updateCommunication('uses_sarcasm', val)}
                />
              </div>
            </div>

            {/* Typical Expressions Tag List */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[var(--foreground)]">Typical Expressions & Phrases</label>
              <div className="flex flex-wrap gap-2">
                {profile.communication.typical_expressions.map((expr) => (
                  <span
                    key={expr}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    &quot;{expr}&quot;
                    <button
                      type="button"
                      onClick={() => removeExpression(expr)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newExpression}
                  onChange={(e) => setNewExpression(e.target.value)}
                  placeholder="Add typical phrase (e.g. 'schwimmen gehen? 🏊‍♀️')..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addExpression}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Surface>
        )}

        {/* TAB 3: INTERESTS & COLOR */}
        {activeTab === 'interests' && (
          <Surface className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-display font-bold text-base text-[var(--foreground)]">Passions, Hobbies & Aesthetic Color</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 border border-pink-200">
                Favorite Color: Pink 🌸
              </span>
            </div>

            {/* Hobbies & Passions */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[var(--foreground)]">Interests & Hobbies (Swimming, Sauna, Pink, Coffee)</label>
              <div className="flex flex-wrap gap-2">
                {profile.interests.hobbies.map((hobby) => (
                  <span
                    key={hobby}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                  >
                    #{hobby}
                    <button type="button" onClick={() => removeHobby(hobby)} className="hover:text-rose-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  placeholder="Add passion (e.g. swimming, sauna, pink aesthetics)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addHobby}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Disliked Topics */}
            <div className="flex flex-col gap-3 pt-2">
              <label className="text-xs font-bold text-[var(--foreground)]">Disliked Topics & Avoids</label>
              <div className="flex flex-wrap gap-2">
                {profile.interests.disliked_topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    🚫 {topic}
                    <button type="button" onClick={() => removeDislikedTopic(topic)} className="hover:text-rose-900">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newDislikedTopic}
                  onChange={(e) => setNewDislikedTopic(e.target.value)}
                  placeholder="Add topic to avoid..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addDislikedTopic}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Surface>
        )}

        {/* TAB 4: EXAMPLES */}
        {activeTab === 'examples' && (
          <Surface className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--foreground)]">Behavioral Examples Across Moods</h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              These example turns teach Vivi how to react when excited (swimming/sauna/pink), comforting, teasing, or pouty/dry.
            </p>

            <div className="flex flex-col gap-4">
              {profile.examples.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/60 flex flex-col gap-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--card)] border border-[var(--border)] text-[var(--primary)]">
                      {ex.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExample(ex.id)}
                      className="text-rose-500 opacity-80 hover:opacity-100 p-1"
                      title="Delete example"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-[var(--foreground)]">
                    <span className="font-bold text-[var(--muted-foreground)]">User:</span> &quot;{ex.user_prompt}&quot;
                  </div>
                  <div className="text-xs text-[var(--primary)] font-medium">
                    <span className="font-bold text-[var(--foreground)]">Vivi:</span> &quot;{ex.ai_response}&quot;
                  </div>
                </div>
              ))}
            </div>

            {/* Add Example Form */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[var(--foreground)]">Add Behavioral Example Turn</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value as any)}
                  className="p-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                >
                  <option value="excitement">Excitement (Swimming/Sauna/Pink)</option>
                  <option value="pouty">Pouty / Dry (Hurt response)</option>
                  <option value="comfort">Comfort / Empathetic</option>
                  <option value="teasing">Teasing / Banter</option>
                  <option value="german_english_switch">German/English</option>
                </select>
                <input
                  type="text"
                  placeholder="User Prompt..."
                  value={newExUser}
                  onChange={(e) => setNewExUser(e.target.value)}
                  className="p-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                />
                <input
                  type="text"
                  placeholder="Vivi Reply..."
                  value={newExAi}
                  onChange={(e) => setNewExAi(e.target.value)}
                  className="p-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                />
              </div>
              <button
                type="button"
                onClick={addExample}
                className="self-end px-5 py-1.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
              >
                Add example
              </button>
            </div>
          </Surface>
        )}

        {/* TAB 5: CONTEXT */}
        {activeTab === 'context' && (
          <Surface className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--foreground)]">INFJ Relationship Context</h3>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--foreground)] font-display">Relationship Notes</label>
              <textarea
                value={profile.context.relationship_notes}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, context: { ...prev.context, relationship_notes: e.target.value } } : prev
                  )
                }
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--foreground)] font-display">Shared Memories Summary</label>
              <textarea
                value={profile.context.shared_memories_summary}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, context: { ...prev.context, shared_memories_summary: e.target.value } } : prev
                  )
                }
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none resize-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[var(--accent)]/30 border border-[var(--border)] text-xs text-[var(--accent-foreground)] leading-relaxed">
              <span className="font-bold">Disclaimer mandate:</span> Vivi is built as a private AI representation for personal conversational simulation. She must never be represented to third parties as the actual human friend.
            </div>
          </Surface>
        )}
      </div>
    </AppShell>
  );
}
