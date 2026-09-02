import React, { useState } from 'react';
import { MoodType, JournalEntry } from '../types';
import { 
  Sparkles, 
  Send, 
  Feather, 
  BookOpen, 
  Check, 
  MessageSquare, 
  Maximize2,
  Calendar,
  Smile
} from 'lucide-react';
import { FeatureInfo } from './FeatureInfo';

interface TopAssistantsSectionProps {
  isGuest?: boolean;
  onRequireLogin?: () => void;
  onOpenAIChat: (initialPrompt?: string) => void;
  onQuickSaveJournal: (entry: JournalEntry) => void;
  onOpenFullWriter: (draft?: { title: string; content: string; mood: MoodType }) => void;
}

const moodOptions: { type: MoodType; label: string; icon: string; bg: string; text: string; border: string }[] = [
  { type: 'peaceful', label: 'Peaceful', icon: '🌿', bg: 'bg-[#edf5f0]', text: 'text-[#3e6351]', border: 'border-[#cfe0d6]' },
  { type: 'grateful', label: 'Grateful', icon: '✨', bg: 'bg-[#fcf8ec]', text: 'text-[#8b6f27]', border: 'border-[#ebe0be]' },
  { type: 'reflective', label: 'Quiet', icon: '🌙', bg: 'bg-[#f2f4f8]', text: 'text-[#485b73]', border: 'border-[#d0d7e2]' },
  { type: 'energized', label: 'Energized', icon: '☀️', bg: 'bg-[#fff5eb]', text: 'text-[#9c5f2b]', border: 'border-[#f2d8be]' },
  { type: 'inspired', label: 'Inspired', icon: '💡', bg: 'bg-[#fbf6ea]', text: 'text-[#876722]', border: 'border-[#ebdcb8]' },
  { type: 'content', label: 'Content', icon: '🍃', bg: 'bg-[#f1f6f1]', text: 'text-[#456b4d]', border: 'border-[#d4e4d6]' },
];

export const TopAssistantsSection: React.FC<TopAssistantsSectionProps> = ({
  isGuest = false,
  onRequireLogin,
  onOpenAIChat,
  onQuickSaveJournal,
  onOpenFullWriter,
}) => {
  // Portion 1: AI Assistant state
  const [aiInput, setAiInput] = useState('');

  // Portion 2: Add Story state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickMood, setQuickMood] = useState<MoodType>('peaceful');
  const [justSaved, setJustSaved] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    onOpenAIChat(aiInput.trim());
    setAiInput('');
  };

  const handleQuickPromptClick = (prompt: string) => {
    onOpenAIChat(prompt);
  };

  const handleSaveQuickEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      setShowGuestWarning(true);
      return;
    }
    if (!quickContent.trim()) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: quickTitle.trim() || `Today's Story (${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`,
      content: quickContent.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: quickMood,
      tags: ['Today', 'Daily'],
      photos: [],
      wordCount: quickContent.trim().split(/\s+/).length,
      readingTimeMinutes: 1,
      bookmarked: false,
      pinned: false,
    };

    onQuickSaveJournal(newEntry);
    setQuickTitle('');
    setQuickContent('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleExpandToFullWriter = () => {
    if (isGuest) {
      setShowGuestWarning(true);
      return;
    }
    onOpenFullWriter({
      title: quickTitle,
      content: quickContent,
      mood: quickMood,
    });
  };

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          PORTION 1: AI Companion (Clearly Identified as Artificial Intelligence)
          "What happened today..."
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#fbf9f5] via-[#f6f2e8] to-[#f2ede0] border border-[#ded5c6] p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4a6b5d] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-base sm:text-lg text-[#242c27]">
                  What happened today...
                </h2>
                <FeatureInfo featureId="aiAssistant" size="xs" />
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2d5240] bg-[#e3efe7] border border-[#bcd6c7] px-2 py-0.5 rounded-md shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#4a6b5d]" />
                  AI Companion (Artificial Intelligence)
                </span>
              </div>
              <p className="text-xs text-[#756a59] mt-0.5">
                Powered by AI • Share a moment, feeling, or ask for mindful guidance & thoughts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => onOpenAIChat('I want to write my journal with AI today. Can you listen to what happened and guide me?')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] transition-all shadow-xs shrink-0"
              title="Click to write your day's journal with AI assistance"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Write Journal with AI</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAIChat()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-semibold text-[#4a6b5d] hover:bg-[#edf5f0] transition-colors shadow-2xs shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Assistant</span>
            </button>
          </div>
        </div>

        {/* Streamlined Input Bar */}
        <form onSubmit={handleAISubmit} className="mt-3.5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Tell or ask Lumina AI what happened today... (e.g. 'I took a peaceful walk in the rain')"
              className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-white border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] placeholder:text-[#a39887] shadow-xs focus:ring-1 focus:ring-[#4a6b5d] focus:border-[#4a6b5d] focus:outline-none transition-colors"
            />
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6b5d]/60 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={!aiInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4a6b5d] text-white text-xs sm:text-sm font-semibold hover:bg-[#395447] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to AI</span>
          </button>
        </form>

        {/* Prompt Sparks & AI Notice */}
        <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-[#8c806f]">
              Try with AI:
            </span>
            {[
              'A good moment from today...',
              'I need to clear my thoughts...',
              'Help me write today’s story',
            ].map((spark, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPromptClick(spark)}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/90 border border-[#dfd5c4] text-[#635745] hover:bg-white hover:text-[#252e28] transition-colors shadow-2xs cursor-pointer"
              >
                {spark}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#938573] italic">
            *AI-generated reflections for journaling assistance
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PORTION 2: Add Story (journals) (Matching Streamlined Layout)
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#fbf9f5] via-[#f6f2e8] to-[#f2ede0] border border-[#ded5c6] p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#b45309] text-white flex items-center justify-center shadow-xs shrink-0">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-base sm:text-lg text-[#242c27]">
                  Add Story (journals)
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#7e7362] bg-white/80 border border-[#ded5c6] px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3 text-[#b45309]" />
                  {todayFormatted}
                </span>
              </div>
              <p className="text-xs text-[#756a59]">
                Jot down today's story or memorable personal journal moments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExpandToFullWriter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-semibold text-[#5b503f] hover:bg-[#ede5d6] transition-colors shadow-2xs shrink-0 cursor-pointer"
              title="Open full editor with formatting and photos"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Editor</span>
            </button>
          </div>
        </div>

        {/* Streamlined Input Bar */}
        <form onSubmit={handleSaveQuickEntry} className="mt-3.5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              placeholder="Write today's story (journal)... (e.g. 'Took a quiet morning walk and finished my novel chapter')"
              className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-white border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] placeholder:text-[#a39887] shadow-xs focus:ring-1 focus:ring-[#4a6b5d] focus:border-[#4a6b5d] focus:outline-none transition-colors"
            />
            <Feather className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b45309]/60 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={!quickContent.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4a6b5d] text-white text-xs sm:text-sm font-semibold hover:bg-[#395447] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            {justSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                <span>Save Story (Journal)</span>
              </>
            )}
          </button>
        </form>

        {/* Mood Selector Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-[#8c806f] flex items-center gap-1">
            <Smile className="w-3 h-3 text-[#948877]" />
            Mood:
          </span>
          {moodOptions.map((mood) => {
            const isSelected = quickMood === mood.type;
            return (
              <button
                key={mood.type}
                type="button"
                onClick={() => setQuickMood(mood.type)}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? `${mood.bg} ${mood.text} ${mood.border} font-bold ring-1 ring-[#4a6b5d]/30`
                    : 'bg-white/90 border-[#dfd5c4] text-[#635745] hover:bg-white hover:text-[#252e28]'
                }`}
              >
                <span>{mood.icon}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>

        {/* Guest Warning Toast / Notice */}
        {showGuestWarning && (
          <div className="mt-3 p-3 rounded-xl bg-[#fef3c7] border border-[#fde68a] flex items-center justify-between gap-3 text-xs text-[#92400e]">
            <span>Personal stories and private journals cannot be saved in Guest Mode. Please log in or sign up.</span>
            {onRequireLogin && (
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-3 py-1 rounded-lg bg-[#b45309] text-white font-semibold hover:bg-[#92400e] transition-colors shrink-0 shadow-2xs"
              >
                Log In Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
