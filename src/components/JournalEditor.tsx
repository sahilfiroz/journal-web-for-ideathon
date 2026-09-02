import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry, JournalPhoto, MoodType } from '../types';
import { 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  RotateCw, 
  Sliders, 
  MapPin, 
  SunMedium, 
  Tag as TagIcon, 
  Plus, 
  ArrowLeft,
  Maximize2,
  Minimize2,
  Wand2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FeatureInfo } from './FeatureInfo';

interface JournalEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  onOpenChatbotPrompt?: (prompt: string) => void;
}

const MOODS: { type: MoodType; label: string; icon: string; color: string }[] = [
  { type: 'peaceful', label: 'Peaceful', icon: '🌿', color: '#5b8266' },
  { type: 'grateful', label: 'Grateful', icon: '✨', color: '#d4af37' },
  { type: 'reflective', label: 'Reflective', icon: '💭', color: '#7a8288' },
  { type: 'inspired', label: 'Inspired', icon: '🎨', color: '#b07d62' },
  { type: 'energized', label: 'Energized', icon: '⚡', color: '#e07a5f' },
  { type: 'melancholic', label: 'Melancholic', icon: '🌧️', color: '#6d7993' },
  { type: 'content', label: 'Content', icon: '☕', color: '#8d6e63' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  initialEntry,
  onSave,
  onDelete,
  onCancel,
  onOpenChatbotPrompt,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [date, setDate] = useState(
    initialEntry?.date || new Date().toISOString().split('T')[0]
  );
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'peaceful');
  const [location, setLocation] = useState(initialEntry?.location || '');
  const [weather, setWeather] = useState(initialEntry?.weather || '');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ['Mindfulness']);
  const [newTagInput, setNewTagInput] = useState('');
  const [photos, setPhotos] = useState<JournalPhoto[]>(initialEntry?.photos || []);
  const [aiReflection, setAiReflection] = useState(initialEntry?.aiReflection || '');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentAreaRef = useRef<HTMLTextAreaElement>(null);

  // Compute Word Count & Reading Time
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 180));

  // Handle Photo File Upload & Compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (!base64Url) return;

        const newPhoto: JournalPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          url: base64Url,
          caption: '',
          timestamp: Date.now(),
          rotationDeg: 0,
          filter: 'none',
        };

        setPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Paste event for direct screenshot / photo pasting
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Url = event.target?.result as string;
            if (base64Url) {
              const newPhoto: JournalPhoto = {
                id: `photo-pasted-${Date.now()}`,
                url: base64Url,
                caption: 'Pasted memory',
                timestamp: Date.now(),
                rotationDeg: 0,
                filter: 'none',
              };
              setPhotos((prev) => [...prev, newPhoto]);
            }
          };
          reader.readAsDataURL(blob as Blob);
        }
      }
    }
  };

  const handleRotatePhoto = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, rotationDeg: ((p.rotationDeg || 0) + 90) % 360 } : p
      )
    );
  };

  const handleCycleFilter = (photoId: string) => {
    const filters: ('none' | 'vintage' | 'warm' | 'noir' | 'fade')[] = [
      'none',
      'vintage',
      'warm',
      'noir',
      'fade',
    ];
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          const currIdx = filters.indexOf(p.filter || 'none');
          const nextFilter = filters[(currIdx + 1) % filters.length];
          return { ...p, filter: nextFilter };
        }
        return p;
      })
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleCaptionChange = (photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Assist: Generate Mindful AI Insight / Titles / Polish
  const handleAiEnhance = async (action: 'reflect' | 'title' | 'polish') => {
    if (!content.trim()) {
      alert('Please write a few thoughts first so Lumina AI can provide an insight on your entry.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, action }),
      });

      if (!res.ok) {
        throw new Error('AI request failed');
      }

      const data = await res.json();
      if (action === 'reflect' && (data.reflection || data.insight)) {
        setAiReflection(data.reflection || data.insight);
        if (data.suggestedMood) setMood(data.suggestedMood);
        if (Array.isArray(data.suggestedTags)) {
          const merged = Array.from(new Set([...tags, ...data.suggestedTags]));
          setTags(merged);
        }
        setAiSuccessMessage('Mindful insight generated!');
      } else if (action === 'title' && Array.isArray(data.suggestedTitles) && data.suggestedTitles[0]) {
        setTitle(data.suggestedTitles[0]);
        setAiSuccessMessage('Poetic title generated!');
      } else if (action === 'polish' && data.polishedContent) {
        setContent(data.polishedContent);
        setAiSuccessMessage('Prose gently refined!');
      }

      setTimeout(() => setAiSuccessMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Could not generate AI insight at this time. You can write your own notes in the box.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = () => {
    const now = Date.now();
    const finalEntry: JournalEntry = {
      id: initialEntry?.id || `entry-${now}`,
      title: title.trim() || 'Untitled Journal',
      content: content.trim(),
      date,
      createdAt: initialEntry?.createdAt || now,
      updatedAt: now,
      mood,
      weather: weather.trim() || undefined,
      location: location.trim() || undefined,
      tags,
      photos,
      aiReflection: aiReflection.trim() || undefined,
      wordCount: words,
      readingTimeMinutes: readingTime,
      bookmarked: initialEntry?.bookmarked || false,
      pinned: initialEntry?.pinned || false,
    };

    onSave(finalEntry);

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#4a6b5d', '#d4af37', '#9fb8ad'],
    });
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto transition-all duration-300 ${
        isFocusMode ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-[#faf8f5] overflow-y-auto max-w-none' : ''
      }`}
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#e8dfd1] text-xs text-[#716858]">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-[#554d3f] hover:bg-[#f6f2e8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-[#554d3f] hover:bg-[#f6f2e8] transition-colors cursor-pointer"
            title="Toggle Distraction-Free Zen View"
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFocusMode ? 'Exit Zen' : 'Zen Focus'}</span>
          </button>

          {/* AI Helper Dropdown/Button */}
          <div className="relative group flex items-center gap-1">
            <button
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f2ecde] border border-[#d8ccba] text-[#594d3c] hover:bg-[#eae1d0] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8f753c]" />
              <span className="font-medium">
                {isGeneratingAi ? 'Reflecting...' : 'AI Lumina'}
              </span>
            </button>
            <FeatureInfo featureId="aiAssistant" size="xs" />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#dfd5c5] rounded-xl shadow-lg p-1.5 z-30 hidden group-hover:block animate-in fade-in">
              <button
                onClick={() => handleAiEnhance('reflect')}
                className="w-full text-left px-3 py-1.5 text-xs text-[#4b4336] rounded-lg hover:bg-[#f5efe4] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#8f753c]" />
                Add Mindful AI Insight
              </button>
              <button
                onClick={() => handleAiEnhance('title')}
                className="w-full text-left px-3 py-1.5 text-xs text-[#4b4336] rounded-lg hover:bg-[#f5efe4] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-3 h-3 text-[#5b8266]" />
                Suggest Poetic Title
              </button>
              <button
                onClick={() => handleAiEnhance('polish')}
                className="w-full text-left px-3 py-1.5 text-xs text-[#4b4336] rounded-lg hover:bg-[#f5efe4] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-[#b07d62]" />
                Gently Polish Prose
              </button>
            </div>
          </div>

          {/* Delete Button (if existing) */}
          {initialEntry && onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this journal entry?')) {
                  onDelete(initialEntry.id);
                }
              }}
              className="p-1.5 rounded-xl bg-white border border-[#ebd6d4] text-[#a84439] hover:bg-[#fdf2f1] transition-colors"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#4a6b5d] text-white font-medium hover:bg-[#3d594d] transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Entry</span>
          </button>
        </div>
      </div>

      {aiSuccessMessage && (
        <div className="mb-4 p-3 rounded-xl bg-[#edf5f0] border border-[#c3dfce] text-xs font-medium text-[#2d523e] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#4a6b5d]" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* Main Journal Paper Writing Canvas */}
      <div
        onPaste={handlePaste}
        className="p-6 sm:p-10 rounded-2xl bg-[#ffffff] border border-[#e2d9cd] shadow-md paper-texture"
      >
        {/* Metadata Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#eee6d9] text-xs">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#e0d6c6] text-[#4b4336] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
            />
          </div>

          {/* Mood Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {MOODS.map((m) => (
              <button
                key={m.type}
                type="button"
                onClick={() => setMood(m.type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mood === m.type
                    ? 'bg-[#4a6b5d] text-white shadow-xs scale-105'
                    : 'bg-[#faf7f0] text-[#6d6455] hover:bg-[#f1ebe0] border border-[#e8ded0]'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="mt-6">
          <input
            type="text"
            placeholder="Title of this reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-serif font-bold text-[#202722] placeholder:text-[#a89e8f] focus:outline-none bg-transparent"
          />
        </div>

        {/* Content Textarea */}
        <div className="mt-4">
          <textarea
            ref={contentAreaRef}
            rows={12}
            placeholder="What stirred in your thoughts today? Let your words flow freely on this page... (You can also paste screenshots or photos directly)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-reading text-base sm:text-lg text-[#2e3731] placeholder:text-[#b0a697] focus:outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>

        {/* Photo Keepsakes Section */}
        <div className="mt-8 pt-6 border-t border-[#ede4d7]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4e4537] uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-[#4a6b5d]" />
              <span>Attached Photo Keepsakes ({photos.length})</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] text-xs font-medium text-[#4b4336] hover:bg-[#f1ebe0] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Photos</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Photo Polaroid Grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative p-3 pb-4 rounded-xl bg-white border border-[#dfd5c5] shadow-sm flex flex-col justify-between"
                  style={{ transform: `rotate(${photo.rotationDeg || 0}deg)` }}
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-[#f0ebd9]">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Memory Photo'}
                      className={`w-full h-full object-cover transition-all ${
                        photo.filter === 'vintage'
                          ? 'sepia-[0.35] contrast-105'
                          : photo.filter === 'warm'
                          ? 'hue-rotate-15 contrast-105'
                          : photo.filter === 'noir'
                          ? 'grayscale contrast-125'
                          : photo.filter === 'fade'
                          ? 'contrast-90 brightness-105'
                          : ''
                      }`}
                    />

                    {/* Quick Photo Actions Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-xs rounded-lg p-1 text-white">
                      <button
                        type="button"
                        onClick={() => handleRotatePhoto(photo.id)}
                        className="p-1 hover:text-[#e4cf99] transition-colors"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCycleFilter(photo.id)}
                        className="p-1 hover:text-[#e4cf99] transition-colors"
                        title="Cycle Filter"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Add a handwritten memory note..."
                    value={photo.caption || ''}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    className="mt-2.5 text-center text-xs font-serif italic text-[#4a4133] placeholder:text-[#b4a999] bg-transparent border-b border-transparent hover:border-[#dfd5c5] focus:border-[#4a6b5d] focus:outline-none py-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-[#e2d7c7] rounded-xl text-center cursor-pointer hover:bg-[#faf7f0] transition-colors"
            >
              <p className="text-xs text-[#7d7362]">
                Click or Drag & Drop photos here (supports multiple uploads & paste)
              </p>
            </div>
          )}
        </div>

        {/* Location, Weather & Tag Details */}
        <div className="mt-8 pt-6 border-t border-[#ede4d7] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="flex items-center gap-1.5 font-medium text-[#615748] mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#b07d62]" />
              Location
            </label>
            <input
              type="text"
              placeholder="e.g. Kyoto Tea Pavilion, Porch Hammock"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] text-[#4b4336] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-medium text-[#615748] mb-1.5">
              <SunMedium className="w-3.5 h-3.5 text-[#d4af37]" />
              Weather & Atmosphere
            </label>
            <input
              type="text"
              placeholder="e.g. Crisp autumn rain, Golden 21°C"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] text-[#4b4336] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-5">
          <label className="flex items-center gap-1.5 font-medium text-[#615748] text-xs mb-2">
            <TagIcon className="w-3.5 h-3.5 text-[#4a6b5d]" />
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#faf7f0] border border-[#dfd5c5] text-xs font-medium text-[#4b4336]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="New tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#dfd5c5] text-xs text-[#4b4336] w-24 focus:outline-none focus:w-32 transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1 rounded-lg bg-[#f0ebd9] text-[#554d3f] hover:bg-[#e4ddc8]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mindful AI Insight Box (Editable) */}
        <div className="mt-8 pt-6 border-t border-[#ede4d7]">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 font-medium text-[#615748] text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#8f753c]" />
              Mindful AI Note & Philosophy Insight
            </label>
            <button
              type="button"
              onClick={() => handleAiEnhance('reflect')}
              disabled={isGeneratingAi}
              className="text-[11px] text-[#4a6b5d] hover:underline font-medium"
            >
              Regenerate with Lumina AI
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="A philosophical summary or lesson from this moment..."
            value={aiReflection}
            onChange={(e) => setAiReflection(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] font-serif italic text-xs sm:text-sm text-[#4b4336] placeholder:text-[#b4a999] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
          />
        </div>

        {/* Footer Word Count Stats */}
        <div className="mt-6 pt-4 border-t border-[#eee6d9] flex items-center justify-between text-xs text-[#877c6b]">
          <span>
            {words} words • ~{readingTime} min reading time
          </span>
          <span className="italic font-serif text-[#a69b8a]">
            Lumina Journal Canvas
          </span>
        </div>
      </div>
    </div>
  );
};
