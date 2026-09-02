import React, { useState } from 'react';
import { JournalEntry, MoodType } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Sparkles, 
  Edit3, 
  Calendar, 
  MapPin, 
  SunMedium, 
  Share2, 
  Tag, 
  Image as ImageIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Journal3DFlipViewProps {
  entries: JournalEntry[];
  currentEntryId: string;
  onSelectEntry: (entryId: string) => void;
  onEditEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => void;
  onOpenWriter: () => void;
}

const MOOD_EMOJIS: Record<MoodType, string> = {
  peaceful: '🌿 Peaceful',
  grateful: '✨ Grateful',
  reflective: '💭 Reflective',
  energized: '⚡ Energized',
  melancholic: '🌧️ Melancholic',
  inspired: '🎨 Inspired',
  content: '☕ Content',
};

export const Journal3DFlipView: React.FC<Journal3DFlipViewProps> = ({
  entries,
  currentEntryId,
  onSelectEntry,
  onEditEntry,
  onToggleBookmark,
  onOpenWriter,
}) => {
  const currentIndex = Math.max(
    0,
    entries.findIndex((e) => e.id === currentEntryId)
  );
  const currentEntry = entries[currentIndex] || entries[0];
  const [pageFlipAnim, setPageFlipAnim] = useState<'next' | 'prev' | 'none'>('none');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setPageFlipAnim('prev');
      setTimeout(() => {
        onSelectEntry(entries[currentIndex - 1].id);
        setPageFlipAnim('none');
      }, 250);
    }
  };

  const handleNext = () => {
    if (currentIndex < entries.length - 1) {
      setPageFlipAnim('next');
      setTimeout(() => {
        onSelectEntry(entries[currentIndex + 1].id);
        setPageFlipAnim('none');
      }, 250);
    }
  };

  const triggerCelebrate = () => {
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4a6b5d', '#d4af37', '#e8c595', '#a3b18a'],
    });
  };

  if (!currentEntry) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#e6ded2] shadow-xs">
        <p className="font-serif text-lg text-[#554d3f]">Your journal is ready for its very first reflection.</p>
        <button
          onClick={onOpenWriter}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#4a6b5d] text-white font-medium text-sm hover:bg-[#3b574a] transition-all shadow-xs"
        >
          Write First Entry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Top Reading Bar & Navigation */}
      <div className="w-full flex items-center justify-between px-3 py-2 mb-4 text-xs text-[#716858]">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-medium text-[#2d3630]">
            Volume {new Date(currentEntry.date).getFullYear()}
          </span>
          <span>•</span>
          <span>
            Page {currentIndex + 1} of {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleBookmark(currentEntry.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all ${
              currentEntry.bookmarked
                ? 'bg-[#f4efe4] border-[#d4af37] text-[#91741e]'
                : 'bg-white/80 border-[#e3dacc] text-[#6d6455] hover:bg-[#f9f7f2]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>{currentEntry.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            onClick={() => onEditEntry(currentEntry.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 border border-[#e3dacc] text-[#6d6455] hover:bg-[#f9f7f2] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* 3D Physical Book Open Spread Container */}
      <div className="relative w-full perspective-1500 py-2">
        <div
          className={`relative w-full rounded-2xl book-shadow transform-style-3d transition-transform duration-300 ${
            pageFlipAnim === 'next'
              ? '-rotate-y-3'
              : pageFlipAnim === 'prev'
              ? 'rotate-y-3'
              : ''
          }`}
          style={{
            background: 'linear-gradient(135deg, #fdfcf9 0%, #faf6ee 100%)',
            border: '1px solid #dfd4c4',
          }}
        >
          {/* Subtle central spine crease */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 pointer-events-none z-10 bg-gradient-to-r from-black/5 via-black/10 to-transparent shadow-inner" />

          {/* Book Bookmark Ribbon */}
          <div
            onClick={triggerCelebrate}
            className="absolute -top-3 left-14 z-20 w-5 h-20 bg-gradient-to-b from-[#8f3d35] to-[#aa4a3f] shadow-md rounded-b-sm cursor-pointer hover:h-24 transition-all duration-200"
            title="Silk Bookmark (Click for gentle spark)"
          >
            <div className="w-full h-full relative">
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-white clip-ribbon-v" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
            {/* Left Page (Story, Metadata & Philosophy) */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#e8dfd1] paper-texture rounded-l-2xl">
              <div>
                {/* Header Metadata Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#eee5d8] text-xs text-[#7d7362]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#4a6b5d]" />
                      {new Date(currentEntry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {currentEntry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#b07d62]" />
                        {currentEntry.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#f3ede1] text-[#4d5c52] font-medium">
                      {MOOD_EMOJIS[currentEntry.mood] || currentEntry.mood}
                    </span>
                    {currentEntry.weather && (
                      <span className="hidden sm:flex items-center gap-1 text-[#8b806d]">
                        <SunMedium className="w-3.5 h-3.5" />
                        {currentEntry.weather}
                      </span>
                    )}
                  </div>
                </div>

                {/* Entry Title */}
                <h1 className="mt-6 text-2xl sm:text-3xl font-serif font-bold text-[#222a25] tracking-tight leading-snug">
                  {currentEntry.title || 'Quiet Moments'}
                </h1>

                {/* Journal Narrative Content */}
                <div className="mt-5 font-reading text-base sm:text-lg text-[#38423b] leading-relaxed whitespace-pre-wrap selection:bg-[#e4ece8]">
                  {currentEntry.content}
                </div>
              </div>

              {/* AI Reflection / Footer Seal */}
              <div className="mt-8 pt-5 border-t border-[#ede4d7]">
                {currentEntry.aiReflection && (
                  <div className="p-3.5 rounded-xl bg-[#f6f2e9] border border-[#e5dcce] text-xs text-[#52493b] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#8a7243] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#3b3429]">Mindful Reflection:</span>{' '}
                      <span className="italic font-reading">{currentEntry.aiReflection}</span>
                    </div>
                  </div>
                )}

                {currentEntry.tags && currentEntry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentEntry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-[#e4dcce] text-[11px] font-medium text-[#6e6353]"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Page (Tactile Photo Polaroid Collage & Memory Keepsakes) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#faf7f0] rounded-r-2xl border-t lg:border-t-0">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#eae1d3] text-xs text-[#7c7365]">
                  <span className="font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#4a6b5d]" />
                    Visual Keepsakes ({currentEntry.photos?.length || 0})
                  </span>
                  <span className="text-[11px] font-serif italic text-[#968c7b]">
                    {currentEntry.wordCount} words • ~{currentEntry.readingTimeMinutes} min read
                  </span>
                </div>

                {/* Polaroid Photos Grid */}
                {currentEntry.photos && currentEntry.photos.length > 0 ? (
                  <div className="mt-6 space-y-5">
                    {currentEntry.photos.map((photo, pIdx) => {
                      const rot = photo.rotationDeg || (pIdx % 2 === 0 ? -2 : 2);
                      return (
                        <div
                          key={photo.id || pIdx}
                          onClick={() => setSelectedPhotoIndex(pIdx)}
                          className="group relative cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] hover:z-20"
                          style={{ transform: `rotate(${rot}deg)` }}
                        >
                          {/* Vintage Washi Tape Top Accent */}
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#e8decd]/80 backdrop-blur-xs border-y border-[#d5c9b6] shadow-xs rotate-1 z-10" />

                          {/* Polaroid Paper Frame */}
                          <div className="p-3 pb-5 bg-white rounded-md shadow-md border border-[#e0d6c7]">
                            <div className="relative aspect-4/3 overflow-hidden rounded-xs bg-[#f0ebd9]">
                              <img
                                src={photo.url}
                                alt={photo.caption || 'Journal Memory'}
                                className={`w-full h-full object-cover transition-all duration-300 ${
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
                            </div>
                            {photo.caption && (
                              <p className="mt-2.5 text-center text-xs font-serif italic text-[#594f41] tracking-wide">
                                "{photo.caption}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-12 flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#e2d8c9] rounded-xl text-center">
                    <ImageIcon className="w-8 h-8 text-[#b5aa97] mb-2" />
                    <p className="text-xs font-medium text-[#7a7061]">No photos attached</p>
                    <p className="mt-1 text-[11px] text-[#9d9281]">
                      Click edit to attach memories, sketches, or polaroids to this journal.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Quote Stamp */}
              <div className="mt-8 p-4 rounded-xl bg-white/70 border border-[#eae0d2] text-center">
                <p className="font-serif italic text-xs text-[#6e6353]">
                  "In the stillness of the page, the soul finds its rhythm."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Page Turner Controls */}
      <div className="w-full flex items-center justify-between mt-6 px-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-medium text-[#4b584f] hover:bg-[#f6f2e8] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Entry</span>
        </button>

        <div className="text-xs text-[#877c6b] font-medium">
          {currentIndex + 1} / {entries.length}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === entries.length - 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-medium text-[#4b584f] hover:bg-[#f6f2e8] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
        >
          <span>Next Entry</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lightbox Modal for Photo Inspection */}
      {selectedPhotoIndex !== null && currentEntry.photos && currentEntry.photos[selectedPhotoIndex] && (
        <div
          onClick={() => setSelectedPhotoIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-white p-4 rounded-2xl shadow-2xl border border-[#ded5c6]"
          >
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img
                src={currentEntry.photos[selectedPhotoIndex].url}
                alt="Enlarged Memory"
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            {currentEntry.photos[selectedPhotoIndex].caption && (
              <p className="mt-3 text-center text-sm font-serif italic text-[#4a4235]">
                "{currentEntry.photos[selectedPhotoIndex].caption}"
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="px-4 py-2 rounded-xl bg-[#f2ede3] text-xs font-medium text-[#483f33] hover:bg-[#e6decf]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
