import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, Feather, BookOpen } from 'lucide-react';
import { MoodType } from '../types';

interface PromptSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (theme: string, question: string) => void;
  currentMood: MoodType;
}

interface PromptItem {
  theme: string;
  question: string;
  hint: string;
}

export const PromptSparkModal: React.FC<PromptSparkModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  currentMood,
}) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

      const res = await fetch('/api/gemini/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: currentMood, timeOfDay }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prompts) && data.prompts.length > 0) {
          setPrompts(data.prompts);
        }
      }
    } catch (err) {
      console.error(err);
      setPrompts([
        {
          theme: 'Sensory Stillness',
          question: 'What is one sound, scent, or color that stood out in your world today?',
          hint: 'Focus on the physical texture of the moment.',
        },
        {
          theme: 'Unspoken Words',
          question: 'What is something you wished you had spoken aloud today?',
          hint: 'Write with radical honesty without editing yourself.',
        },
        {
          theme: 'Unexpected Grace',
          question: 'Where did you find an unexpected moment of ease or gratitude this week?',
          hint: 'Describe the quality of light in that room or scene.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && prompts.length === 0) {
      fetchPrompts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ded5c6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#fbf9f5] border-b border-[#eee5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#e4d7be] flex items-center justify-center text-[#8f753c] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#29322c]">
                Mindful Writing Sparks
              </h3>
              <p className="text-xs text-[#7d7261]">
                Evocative prompts crafted for your current {currentMood} state
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7c7365] hover:bg-[#f1ebe0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Cards List */}
        <div className="p-6 space-y-3 bg-[#fdfcf9] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-6 h-6 text-[#4a6b5d] animate-spin mb-2" />
              <p className="text-xs font-medium text-[#6b6151]">
                Generating mindful prompt invitations...
              </p>
            </div>
          ) : (
            prompts.map((p, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectPrompt(p.theme, p.question);
                  onClose();
                }}
                className="group p-4 rounded-xl bg-white border border-[#dfd5c5] hover:border-[#4a6b5d] hover:shadow-md cursor-pointer transition-all duration-200 paper-texture"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#4a6b5d] uppercase tracking-wider">
                    {p.theme}
                  </span>
                  <Feather className="w-3.5 h-3.5 text-[#b0a594] group-hover:text-[#4a6b5d] transition-colors" />
                </div>
                <p className="font-reading text-sm font-medium text-[#2d3630] group-hover:text-[#1e2621] leading-relaxed">
                  "{p.question}"
                </p>
                {p.hint && (
                  <p className="mt-2 text-xs font-serif italic text-[#847969]">
                    Tip: {p.hint}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#fbf9f5] border-t border-[#eee5d8] flex items-center justify-between">
          <button
            onClick={fetchPrompts}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-[#5a5040] hover:text-[#2d3630] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Generate New Sparks</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#f0ebd9] text-[#4b4336] text-xs font-medium hover:bg-[#e4ddc8]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
