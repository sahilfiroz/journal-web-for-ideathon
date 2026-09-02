import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MoodType, PublicPost } from '../types';
import { 
  Sparkles, 
  Send, 
  X, 
  BookOpen, 
  Feather,
  Copy,
  Check,
  Heart,
  Share2,
  Calendar,
  Clock,
  Volume2,
  RefreshCw
} from 'lucide-react';

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyJournal: (journal: { title: string; content: string; mood: MoodType; tags: string[]; date?: string }) => void;
  onPublishToPublic?: (postDraft: { title: string; content: string; mood: string; tags: string[]; entryDate?: string; writingTime?: string }) => void;
  recentJournalsSummary?: string;
  initialPrompt?: string;
}

const FEELING_QUICK_STARTERS = [
  { label: 'Had a tough/bad day', icon: '🌧️', mood: 'melancholic', prompt: 'I had a really rough and exhausting day today. Things felt heavy and I need a moment of comfort and to write about it.' },
  { label: 'Feeling overwhelmed & stressed', icon: '🌪️', mood: 'melancholic', prompt: 'I am feeling overwhelmed with everything on my plate. Can you help me process this stress and write a gentle journal?' },
  { label: 'Quiet & peaceful day', icon: '🌿', mood: 'peaceful', prompt: 'Today was quiet and simple. I took a slow walk and enjoyed some stillness. Let us write a peaceful reflection.' },
  { label: 'Grateful & energized', icon: '✨', mood: 'grateful', prompt: 'I experienced some wonderful small wins today and want to capture this gratitude into my journal.' },
  { label: 'Tangled thoughts needing clarity', icon: '🧭', mood: 'reflective', prompt: 'I have some swirling thoughts about a personal decision. Help me sort them into a clear journal entry.' },
];

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({
  isOpen,
  onClose,
  onApplyJournal,
  onPublishToPublic,
  recentJournalsSummary,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: 'Welcome to your mindful sanctuary. I am Lumina AI. Tell me anything about your day—whether it was peaceful, joyful, or terribly exhausting. I am here to listen with heartfelt sympathy and turn your day into a beautifully formatted, copyable journal.',
      timestamp: Date.now(),
      suggestedPrompts: [
        'I had an exhausting and heavy day...',
        'Today went better than expected!',
        'I felt anxious about a conversation today...',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'mindful' | 'gratitude' | 'clarity'>('mindful');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (initialPrompt && initialPrompt.trim()) {
        handleSendMessage(initialPrompt.trim());
      }
    }
  }, [isOpen, initialPrompt]);

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toISOString().split('T')[0];

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: [...messages, userMsg],
          recentJournalsSummary,
          mode: activeMode,
          date: currentDate,
          writingTime: currentTime,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get companion response');
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.sympathyNote || 'I am here with you. Take a quiet breath and tell me more.',
        timestamp: Date.now(),
        sympathyNote: data.sympathyNote,
        copyableFormat: data.copyableFormat,
        suggestedPrompts: data.suggestedPrompts || [],
        extractedJournal: data.extractedJournal && data.extractedJournal.title && data.extractedJournal.content
          ? {
              ...data.extractedJournal,
              date: data.extractedJournal.date || currentDate,
              writingTime: data.extractedJournal.writingTime || currentTime,
              copyableText: data.copyableFormat || `# ${data.extractedJournal.title}\n\n**Date:** ${currentDate} • ${currentTime}\n**Mood:** ${data.extractedJournal.mood}\n\n${data.extractedJournal.content}`,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: 'I hear you, and whatever feelings are present right now, please give yourself grace and kindness. Here is a comforting journal space for your day.',
        timestamp: Date.now(),
        sympathyNote: 'Take a gentle breath. You are carrying a lot, and it is okay to rest.',
        copyableFormat: `# An Honest Evening Reflection\n\n**Date:** ${currentDate} • ${currentTime}\n**Mood:** reflective\n\nToday was a full day that called on my energy. Through the noise and demands, I showed up as best as I could. I give myself permission to let go of what is outside my control tonight.`,
        suggestedPrompts: [
          'What is one small thing that brought peace today?',
          'What can I release before going to sleep?',
        ],
        extractedJournal: {
          title: 'An Honest Evening Reflection',
          content: `Today was a full day that called on my energy. Through the noise and demands, I showed up as best as I could. I give myself permission to let go of what is outside my control tonight and rest peacefully.`,
          mood: 'reflective',
          tags: ['Healing', 'MindfulRest'],
          date: currentDate,
          writingTime: currentTime,
          copyableText: `# An Honest Evening Reflection\n\n**Date:** ${currentDate} • ${currentTime}\n**Mood:** reflective\n\nToday was a full day that called on my energy. Through the noise and demands, I showed up as best as I could.`,
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl h-[90vh] max-h-[760px] bg-[#ffffff] rounded-2xl border border-[#ded5c6] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#fbf9f5] border-b border-[#eee5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef3f0] border border-[#cedfd5] flex items-center justify-center text-[#4a6b5d] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-serif font-bold text-[#27302a]">
                  Write Journal with Lumina AI
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#4a6b5d] text-[10px] font-sans font-bold tracking-wide uppercase border border-[#cfe0d6]">
                  AI Trained Companion
                </span>
              </div>
              <p className="text-xs text-[#7d7362]">
                Tell about your day • Empathetic sympathy for any mood • Copyable Day's Journal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7c7365] hover:bg-[#f1ebe0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Mode & Mood Strip */}
        <div className="px-5 py-2.5 bg-[#fdfcf9] border-b border-[#eee6d9] flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#8d8270] shrink-0">Sanctuary Mode:</span>
            <button
              onClick={() => setActiveMode('mindful')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeMode === 'mindful'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'bg-[#f4efe4] text-[#6d6455] hover:bg-[#eae3d5]'
              }`}
            >
              🌿 Mindful & Empathetic
            </button>
            <button
              onClick={() => setActiveMode('gratitude')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeMode === 'gratitude'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'bg-[#f4efe4] text-[#6d6455] hover:bg-[#eae3d5]'
              }`}
            >
              ✨ Gratitude & Joy
            </button>
            <button
              onClick={() => setActiveMode('clarity')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeMode === 'clarity'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'bg-[#f4efe4] text-[#6d6455] hover:bg-[#eae3d5]'
              }`}
            >
              🧭 Clarity & Unpack
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#7d7260]">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#fbf9f5] paper-texture">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#4a6b5d] text-white shadow-xs rounded-br-xs'
                    : 'bg-white border border-[#dfd5c5] text-[#2c342f] shadow-xs rounded-bl-xs'
                }`}
              >
                {/* Sympathy Callout Banner if AI provided explicit empathy */}
                {msg.role === 'assistant' && msg.sympathyNote && (
                  <div className="mb-3 p-3 rounded-xl bg-[#fbf3e8] border border-[#ecd9c2] flex items-start gap-2.5 text-[#734b22]">
                    <Heart className="w-4 h-4 text-[#c25e36] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#a05325] block mb-0.5">
                        Heartfelt Sympathy & Comfort
                      </span>
                      <p className="text-xs italic leading-relaxed text-[#68411c]">
                        "{msg.sympathyNote}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Conversational Text */}
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Structured Synthesized Journal Box in Copyable Format */}
                {msg.extractedJournal && (
                  <div className="mt-4 pt-3.5 border-t border-[#eee5d8] bg-[#faf8f3] -mx-2 -mb-2 p-3.5 sm:p-4 rounded-xl border border-[#e5dcce] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#ece2d3]">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#4a6b5d]" />
                        <span className="text-xs font-bold font-serif text-[#27302a]">
                          Synthesized Day's Journal
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#4a6b5d] text-[10px] font-bold border border-[#cfe0d6]">
                          Mood: {msg.extractedJournal.mood}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#867b6c]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {msg.extractedJournal.date || new Date().toISOString().split('T')[0]}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msg.extractedJournal.writingTime || 'Just now'}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[#252f28] mb-1.5">
                      {msg.extractedJournal.title}
                    </h4>

                    {/* Formatted Journal Body Preview */}
                    <div className="text-xs sm:text-sm text-[#463f35] font-reading leading-relaxed whitespace-pre-wrap p-3 rounded-lg bg-white border border-[#eae2d4] max-h-52 overflow-y-auto">
                      {msg.extractedJournal.content}
                    </div>

                    {/* Tags */}
                    {msg.extractedJournal.tags && msg.extractedJournal.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {msg.extractedJournal.tags.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-[#f1ebe0] text-[#6d6253] text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Copyable Action Bar */}
                    <div className="mt-3.5 pt-2.5 border-t border-[#ece2d3] flex flex-wrap items-center gap-2">
                      {/* Copy Format Button */}
                      <button
                        onClick={() => {
                          const copyText = msg.extractedJournal?.copyableText || msg.copyableFormat || `# ${msg.extractedJournal?.title}\n\n**Date:** ${msg.extractedJournal?.date} • ${msg.extractedJournal?.writingTime}\n**Mood:** ${msg.extractedJournal?.mood}\n\n${msg.extractedJournal?.content}`;
                          handleCopyText(copyText, msg.id);
                        }}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                          copiedId === msg.id
                            ? 'bg-[#2b593f] text-white'
                            : 'bg-white border border-[#ded5c6] text-[#333d36] hover:bg-[#f6f2e9]'
                        }`}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#4a6b5d]" />
                            <span>Copy Day's Journal</span>
                          </>
                        )}
                      </button>

                      {/* Insert into Editor Button */}
                      <button
                        onClick={() => {
                          if (msg.extractedJournal) {
                            onApplyJournal(msg.extractedJournal);
                            onClose();
                          }
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] transition-colors shadow-xs"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>Insert into Journal Editor</span>
                      </button>

                      {/* Share to Public Posts */}
                      {onPublishToPublic && (
                        <button
                          onClick={() => {
                            if (msg.extractedJournal) {
                              onPublishToPublic({
                                title: msg.extractedJournal.title,
                                content: msg.extractedJournal.content,
                                mood: msg.extractedJournal.mood,
                                tags: msg.extractedJournal.tags,
                                entryDate: msg.extractedJournal.date,
                                writingTime: msg.extractedJournal.writingTime,
                              });
                              onClose();
                            }
                          }}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#f0f5f2] border border-[#cbe0d4] text-[#355b4b] text-xs font-semibold hover:bg-[#e4ede7] transition-colors shadow-2xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share to Public Feed</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Follow up prompt suggestions */}
              {msg.role === 'assistant' && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.suggestedPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs px-3 py-1 rounded-full bg-white/90 border border-[#dfd5c5] text-[#594f41] hover:bg-[#f3ede1] hover:border-[#cfc4b2] transition-colors shadow-2xs"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 p-3.5 max-w-sm bg-white rounded-2xl border border-[#dfd5c5] text-xs text-[#6e6353] shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-[#4a6b5d] animate-spin" />
              <span>Lumina is listening with empathy and synthesizing your day...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Feeling Mood Chips */}
        <div className="px-4 py-2 bg-[#fdfcf9] border-t border-[#eee6d9] flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-[#8e8371] shrink-0 font-medium">Quick Feelings:</span>
          {FEELING_QUICK_STARTERS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#faf7f0] border border-[#e2d8c9] text-xs text-[#52493d] hover:bg-[#f1ebe0] hover:border-[#d0c4b2] transition-colors shrink-0 font-medium"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-[#eee5d8] space-y-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tell Lumina AI about your day... (e.g. 'I had a really tiring day and felt stressed at work')"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] text-sm text-[#2b332d] placeholder:text-[#a89d8d] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 px-4 rounded-xl bg-[#4a6b5d] text-white hover:bg-[#3d594d] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-[10px] text-center text-[#998c7b] italic">
            🤖 Lumina AI listens without judgment and generates empathetic reflections and copyable journal entries.
          </p>
        </div>
      </div>
    </div>
  );
};
