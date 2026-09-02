import React, { useState } from 'react';
import { JournalEntry, MoodType } from '../types';
import { 
  Search, 
  Bookmark, 
  Calendar, 
  MapPin, 
  Tag, 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen,
  Sparkles,
  Filter
} from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => void;
  onOpenWriter: () => void;
}

export const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onToggleBookmark,
  onOpenWriter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const filteredEntries = entries.filter((entry) => {
    // Search filter
    const matchesSearch =
      !searchQuery.trim() ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (entry.location && entry.location.toLowerCase().includes(searchQuery.toLowerCase()));

    // Mood filter
    const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;

    // Bookmark filter
    const matchesBookmark = !onlyBookmarked || entry.bookmarked;

    return matchesSearch && matchesMood && matchesBookmark;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2d9cc] shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8a7f6f] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reflections, tags, memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#faf7f0] border border-[#dfd5c5] text-xs text-[#2c342f] placeholder:text-[#a69c8c] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              onlyBookmarked
                ? 'bg-[#f4efe4] border-[#d4af37] text-[#8e7320]'
                : 'bg-[#faf7f0] border-[#dfd5c5] text-[#6d6455] hover:bg-[#f1ebe0]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Bookmarked</span>
          </button>

          <button
            onClick={onOpenWriter}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3b574a] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Mood Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', 'peaceful', 'grateful', 'reflective', 'inspired', 'energized', 'melancholic', 'content'].map(
          (m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(m)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-all shrink-0 ${
                selectedMood === m
                  ? 'bg-[#4a6b5d] text-white shadow-2xs'
                  : 'bg-white border border-[#e2d8c9] text-[#6b6252] hover:bg-[#faf7f0]'
              }`}
            >
              {m === 'all' ? 'All Moods' : m}
            </button>
          )
        )}
      </div>

      {/* Entries List Timeline */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="group p-5 sm:p-6 rounded-2xl bg-white border border-[#ded5c6] shadow-xs hover:shadow-md transition-all duration-200 paper-texture"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => onSelectEntry(entry.id)}>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7e7464] mb-2">
                    <span className="flex items-center gap-1 font-medium text-[#4a6b5d]">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#b07d62]" />
                        {entry.location}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-[#f4efe4] text-[#554a39] font-medium capitalize text-[11px]">
                      {entry.mood}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#222a25] group-hover:text-[#4a6b5d] transition-colors leading-snug">
                    {entry.title || 'Untitled Reflection'}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm font-reading text-[#4b544e] line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleBookmark(entry.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      entry.bookmarked
                        ? 'bg-[#f7f2e6] border-[#d4af37] text-[#91741e]'
                        : 'bg-[#faf7f0] border-transparent text-[#968b7b] hover:text-[#4a4032]'
                    }`}
                    title="Bookmark"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => onEditEntry(entry.id)}
                    className="p-1.5 rounded-lg text-[#968b7b] hover:bg-[#faf7f0] hover:text-[#4a4032] transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Delete this journal entry?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#968b7b] hover:bg-[#fcf1f0] hover:text-[#a84439] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photos & Metadata Row */}
              <div className="mt-4 pt-3 border-t border-[#f0e8dc] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8d8271]">
                <div className="flex items-center gap-2">
                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex items-center -space-x-2">
                      {entry.photos.slice(0, 4).map((p, idx) => (
                        <img
                          key={p.id || idx}
                          src={p.url}
                          alt="Thumbnail"
                          className="w-7 h-7 object-cover rounded-md border-2 border-white shadow-2xs"
                        />
                      ))}
                      {entry.photos.length > 4 && (
                        <span className="w-7 h-7 rounded-md bg-[#f0ebd9] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#554d3f]">
                          +{entry.photos.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#faf7f0] text-[10px] text-[#6d6251]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {entry.aiReflection && (
                    <span className="flex items-center gap-1 text-[11px] text-[#846f41]">
                      <Sparkles className="w-3 h-3 text-[#8f753c]" />
                      Reflection Note
                    </span>
                  )}
                  <span className="text-[11px] text-[#998f7e]">
                    {entry.wordCount} words
                  </span>
                  <button
                    onClick={() => onSelectEntry(entry.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#4a6b5d] hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#ded5c6] shadow-xs">
          <p className="font-serif text-base text-[#615747]">No matching reflections found.</p>
          <p className="mt-1 text-xs text-[#8c8170]">
            Try adjusting your search keywords or mood filter.
          </p>
        </div>
      )}
    </div>
  );
};
