import React, { useState, useMemo } from 'react';
import { JournalEntry, MoodType } from '../types';
import { calculateStreakFromEntries } from '../utils/streak';
import { 
  BookOpen, 
  Plus, 
  Calendar as CalendarIcon, 
  Edit3, 
  Trash2, 
  Bookmark, 
  Sparkles, 
  ArrowRight, 
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Lock,
  UserCheck,
  Flame
} from 'lucide-react';
import { FeatureInfo } from './FeatureInfo';

interface UserJournalSequenceProps {
  entries: JournalEntry[];
  isGuest?: boolean;
  onRequireLogin?: () => void;
  onOpenWriter: (draft?: { title: string; content: string; mood: MoodType; date?: string }) => void;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => void;
}

const moodConfig: Record<
  MoodType,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  peaceful: { label: 'Peaceful', icon: '🌿', bg: 'bg-[#edf5f0]', text: 'text-[#3e6351]', border: 'border-[#cfe0d6]' },
  grateful: { label: 'Grateful', icon: '✨', bg: 'bg-[#fcf8ec]', text: 'text-[#8b6f27]', border: 'border-[#ebe0be]' },
  reflective: { label: 'Quiet', icon: '🌙', bg: 'bg-[#f2f4f8]', text: 'text-[#485b73]', border: 'border-[#d0d7e2]' },
  energized: { label: 'Energized', icon: '☀️', bg: 'bg-[#fff5eb]', text: 'text-[#9c5f2b]', border: 'border-[#f2d8be]' },
  melancholic: { label: 'Gentle', icon: '🌧️', bg: 'bg-[#f4f3f7]', text: 'text-[#5f5773]', border: 'border-[#dbd7e6]' },
  inspired: { label: 'Inspired', icon: '💡', bg: 'bg-[#fbf6ea]', text: 'text-[#876722]', border: 'border-[#ebdcb8]' },
  content: { label: 'Content', icon: '🍃', bg: 'bg-[#f1f6f1]', text: 'text-[#456b4d]', border: 'border-[#d4e4d6]' },
};

// Helper: Calculate linewise relative date label
function getLinewiseDateLabel(dateStr: string, index: number): { primary: string; secondary: string } {
  try {
    const entryDate = new Date(dateStr);
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    let primary = '';
    if (diffDays === 0) primary = 'Today';
    else if (diffDays === 1) primary = 'Yesterday';
    else if (diffDays === 2) primary = 'Day Before Yesterday';
    else if (diffDays === 3) primary = '3 Days Ago';
    else if (diffDays > 3 && diffDays <= 7) primary = `${diffDays} Days Ago`;
    else if (diffDays > 7) primary = `${Math.floor(diffDays / 7)} Weeks Ago`;
    else primary = entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // Fallback if timestamps are all from today or similar dates
    if (diffDays === 0 && index > 0) {
      if (index === 1) primary = 'Yesterday';
      else if (index === 2) primary = 'Day Before Yesterday';
      else if (index === 3) primary = '3 Days Ago';
      else primary = `${index} Days Ago`;
    }

    const secondary = entryDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return { primary, secondary };
  } catch {
    return { primary: `Entry #${index + 1}`, secondary: dateStr };
  }
}

export const UserJournalSequence: React.FC<UserJournalSequenceProps> = ({
  entries,
  isGuest = false,
  onRequireLogin,
  onOpenWriter,
  onEditEntry,
  onDeleteEntry,
  onToggleBookmark,
}) => {
  const [activeReadingEntry, setActiveReadingEntry] = useState<JournalEntry | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  
  // Calendar interactive state
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // If in Guest Mode: My Journals remains completely blank and prompts to login
  if (isGuest) {
    return (
      <div className="flex flex-col h-full space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e6ded4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fdf5e6] text-[#b45309] flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242c27]">
                My Journals
              </h2>
              <p className="text-[11px] text-[#867b6c]">
                Private personal journal archives
              </p>
            </div>
          </div>
        </div>

        {/* Guest Blank Screen with Login Prompt */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white border border-[#ded5c6] space-y-4 my-auto min-h-[350px]">
          <div className="w-14 h-14 rounded-2xl bg-[#edf5f0] text-[#4a6b5d] border border-[#cde0d5] flex items-center justify-center shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-serif text-base font-bold text-[#242c27]">
              Login Required for My Journals
            </h3>
            <p className="text-xs text-[#7e7362] leading-relaxed font-reading">
              Guest profile cannot access or save private journals. Please log in or create an account to start your mindful personal journal.
            </p>
          </div>
          {onRequireLogin && (
            <button
              onClick={onRequireLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#385246] transition-colors shadow-xs active:scale-95 mt-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sort entries from latest to oldest
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt;
    });
  }, [entries]);

  // Separate recent entries (Top 4: Today, Yesterday, Day Before Yesterday, 3 Days Ago)
  const recentEntries = useMemo(() => {
    return sortedEntries.slice(0, 4);
  }, [sortedEntries]);

  // Map dates to entry counts for calendar indicators
  const entriesByDate = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    sortedEntries.forEach((entry) => {
      const dateKey = entry.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(entry);
    });
    return map;
  }, [sortedEntries]);

  // Filtered entries if a calendar date is picked
  const filteredEntriesBySelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return sortedEntries.filter((entry) => entry.date === selectedDate);
  }, [selectedDate, sortedEntries]);

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    // Adjust so Mon is 0, Sun is 6
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNumber: number; dateString: string; isCurrentMonth: boolean }> = [];

    // Empty slots before 1st day
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dayNumber: 0, dateString: '', isCurrentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateString = `${year}-${mStr}-${dStr}`;
      days.push({ dayNumber: d, dateString, isCurrentMonth: true });
    }

    return days;
  }, [calendarMonth]);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectCalendarDate = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null); // toggle off
    } else {
      setSelectedDate(dateStr);
    }
  };

  const monthName = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayKey = new Date().toISOString().split('T')[0];

  // Calculate live streak directly from My Journals entries
  const streakInfo = useMemo(() => calculateStreakFromEntries(entries), [entries]);

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e6ded4] gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#fdf5e6] text-[#b45309] flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-[#242c27]">
                My Journals
              </h2>
              <FeatureInfo featureId="myJournals" size="xs" />
              {/* Streak Badge directly connected to My Journals */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                  streakInfo.streakDays > 0
                    ? 'bg-[#fef5ec] text-[#b45309] border-[#f5d7b5]'
                    : 'bg-[#f5efe4] text-[#8c7e6c] border-[#ded5c6]'
                }`}
                title={`Streak is directly connected: ${streakInfo.streakDays} consecutive day(s) of journals present`}
              >
                <Flame className={`w-3.5 h-3.5 ${streakInfo.streakDays > 0 ? 'text-[#ea580c] fill-[#ea580c]' : 'text-[#8c7e6c]'}`} />
                <span>{streakInfo.streakDays} Day Streak</span>
              </span>
            </div>
            <p className="text-[11px] text-[#867b6c]">
              {streakInfo.streakDays > 0 
                ? `${streakInfo.streakDays} consecutive day${streakInfo.streakDays !== 1 ? 's' : ''} with journals recorded in My Journals`
                : `Archive of ${entries.length} journals • Write today's journal to start a streak`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenWriter()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#385346] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Journal</span>
          </button>
        </div>
      </div>

      {/* Linewise Sequence Container */}
      <div className="space-y-6 overflow-y-auto pr-1 flex-1 min-h-0">
        {sortedEntries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#ded5c6] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f5efe4] text-[#827461] flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[#27302a]">
              No previous journals yet
            </h3>
            <p className="text-xs text-[#7e7362] max-w-xs mx-auto font-reading">
              Begin your linewise journaling journey by writing your first journal for today.
            </p>
            <button
              onClick={() => onOpenWriter()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#385246] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Journal</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top 4 Linewise Sequence: Today, Yesterday, Day Before Yesterday, 3 Days Ago */}
            <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[#4a6b5d] before:via-[#c9a02d] before:to-[#ded5c6]">
              {recentEntries.map((entry, index) => {
                const { primary, secondary } = getLinewiseDateLabel(entry.date, index);
                const conf = moodConfig[entry.mood] || moodConfig.peaceful;

                return (
                  <div key={entry.id} className="relative group">
                    {/* Connected Timeline Marker Node on the line */}
                    <div
                      className={`absolute -left-[30px] sm:-left-[38px] top-4 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-xs z-10 ${
                        index === 0
                          ? 'bg-[#4a6b5d] text-white ring-2 ring-[#4a6b5d]/30'
                          : index === 1
                          ? 'bg-[#b45309] text-white'
                          : index === 2
                          ? 'bg-[#d97706] text-white'
                          : 'bg-[#8c7355] text-white'
                      }`}
                    >
                      <span>{conf.icon}</span>
                    </div>

                    {/* Journal Card Box */}
                    <div className="rounded-2xl bg-white border border-[#e2d8c8] hover:border-[#4a6b5d]/60 hover:shadow-xs transition-colors p-4 sm:p-5 space-y-3">
                      {/* Top Sequence Label & Date Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Primary Linewise Sequence Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-tight uppercase shadow-2xs ${
                              index === 0
                                ? 'bg-[#4a6b5d] text-white'
                                : index === 1
                                ? 'bg-[#fff5eb] text-[#b45309] border border-[#fed7aa]'
                                : index === 2
                                ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                                : 'bg-[#f4efe4] text-[#5b5142] border border-[#e0d6c6]'
                            }`}
                          >
                            {primary}
                          </span>

                          <span className="text-xs text-[#8c806f] flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {secondary}
                          </span>
                        </div>

                        {/* Top Action Icons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onToggleBookmark(entry.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              entry.bookmarked
                                ? 'text-[#d4af37] bg-[#fbf6ea]'
                                : 'text-[#9c907e] hover:text-[#2c342f] hover:bg-[#f5efe4]'
                            }`}
                            title={entry.bookmarked ? 'Bookmarked' : 'Bookmark'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${entry.bookmarked ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => onEditEntry(entry.id)}
                            className="p-1.5 rounded-lg text-[#9c907e] hover:text-[#4a6b5d] hover:bg-[#eef5f1] transition-colors"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Delete this journal entry?')) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#9c907e] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setActiveReadingEntry(entry)}
                        className="font-serif font-bold text-base sm:text-lg text-[#252e28] hover:text-[#4a6b5d] transition-colors cursor-pointer"
                      >
                        {entry.title}
                      </h3>

                      {/* Content Excerpt */}
                      <p
                        onClick={() => setActiveReadingEntry(entry)}
                        className="text-xs sm:text-[13px] text-[#47534c] leading-relaxed font-reading line-clamp-3 cursor-pointer"
                      >
                        {entry.content}
                      </p>

                      {/* Photo Keepsakes Preview */}
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {entry.photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setActivePhoto(photo.url)}
                              className="shrink-0 p-1 bg-white border border-[#ded5c6] rounded-xl shadow-2xs cursor-pointer hover:border-[#4a6b5d]"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || 'Memory'}
                                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                              />
                              {photo.caption && (
                                <p className="text-[9px] text-[#736856] font-handwriting text-center truncate max-w-[64px] mt-0.5">
                                  {photo.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="pt-2 border-t border-[#f2ebe0] flex items-center justify-between text-xs text-[#8c806f]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            <span>{conf.icon}</span>
                            <span>{conf.label}</span>
                          </span>

                          {entry.aiReflection && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#fcf8ec] border border-[#ebe0be] text-[10px] text-[#8b6f27]">
                              <Sparkles className="w-2.5 h-2.5 text-[#d4af37]" />
                              AI
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setActiveReadingEntry(entry)}
                          className="font-semibold text-[#4a6b5d] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─────────────────────────────────────────────────────────────
                CALENDAR WIDGET BENEATH 3 DAYS AGO (Select Any Date)
               ───────────────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#faf8f4] to-[#f3ede1] border border-[#ded5c6] p-4 sm:p-5 shadow-xs space-y-4">
              {/* Calendar Header with Navigation */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4a6b5d] text-white flex items-center justify-center shadow-xs">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#242c27] flex items-center gap-2">
                      <span>Journal Date Picker</span>
                      <FeatureInfo featureId="myJournals" size="xs" />
                      <span className="text-[10px] font-mono text-[#8a7f6f] font-normal bg-white/80 px-1.5 py-0.5 rounded border border-[#dfd5c4]">
                        Archive Calendar
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#736856]">
                      Pick any date to find or write journals from that day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white border border-[#ded5c6] rounded-xl p-0.5 shadow-2xs">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg text-[#665a49] hover:bg-[#f2ece0] transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-[#252e28] px-2 min-w-[100px] text-center">
                    {monthName}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg text-[#665a49] hover:bg-[#f2ece0] transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-[#8c806f] uppercase border-b border-[#e2d8c8] pb-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return <div key={`empty-${idx}`} className="h-9 sm:h-10 rounded-xl bg-transparent" />;
                  }

                  const dateKey = item.dateString;
                  const hasEntries = entriesByDate[dateKey] && entriesByDate[dateKey].length > 0;
                  const count = entriesByDate[dateKey]?.length || 0;
                  const isSelected = selectedDate === dateKey;
                  const isToday = todayKey === dateKey;

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleSelectCalendarDate(dateKey)}
                      className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#4a6b5d] text-white shadow-xs font-bold ring-2 ring-[#4a6b5d]/30'
                          : hasEntries
                          ? 'bg-white border border-[#bcd6c7] text-[#242c27] font-semibold hover:border-[#4a6b5d] shadow-2xs'
                          : isToday
                          ? 'bg-[#fdf6ec] border border-[#f5d7b5] text-[#b45309] font-bold'
                          : 'bg-white/70 border border-[#e4dccf] text-[#554a3a] hover:bg-white'
                      }`}
                      title={
                        hasEntries
                          ? `${count} journal entry on ${dateKey}`
                          : `No entries on ${dateKey}`
                      }
                    >
                      <span className="leading-none">{item.dayNumber}</span>
                      {/* Indicator Dot if entries exist */}
                      {hasEntries && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            isSelected ? 'bg-[#fef08a]' : 'bg-[#4a6b5d]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Result View */}
              {selectedDate && (
                <div className="mt-4 pt-4 border-t border-[#ded5c6] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#4a6b5d]" />
                      <span className="text-xs font-serif font-bold text-[#242c27]">
                        Journals for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedDate(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8c806f] hover:text-[#252e28] px-2 py-0.5 rounded-lg bg-white border border-[#ded5c6]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Selection</span>
                    </button>
                  </div>

                  {filteredEntriesBySelectedDate.length > 0 ? (
                    <div className="space-y-3">
                      {filteredEntriesBySelectedDate.map((entry) => {
                        const conf = moodConfig[entry.mood] || moodConfig.peaceful;
                        return (
                          <div
                            key={entry.id}
                            className="p-3.5 rounded-xl bg-white border border-[#ded5c6] hover:border-[#4a6b5d] space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
                                <span>{conf.icon}</span>
                                <span>{conf.label}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onEditEntry(entry.id)}
                                  className="p-1 rounded text-[#9c907e] hover:text-[#4a6b5d]"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setActiveReadingEntry(entry)}
                                  className="text-[11px] font-semibold text-[#4a6b5d] hover:underline flex items-center gap-0.5 ml-1"
                                >
                                  <span>Read</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <h4
                              onClick={() => setActiveReadingEntry(entry)}
                              className="font-serif font-bold text-sm text-[#252e28] hover:text-[#4a6b5d] cursor-pointer"
                            >
                              {entry.title}
                            </h4>

                            <p
                              onClick={() => setActiveReadingEntry(entry)}
                              className="text-xs text-[#525f57] font-reading line-clamp-2 cursor-pointer"
                            >
                              {entry.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-[#e4dccf] text-center space-y-2">
                      <p className="text-xs text-[#7e7362]">
                        No journal found on {selectedDate}.
                      </p>
                      <button
                        onClick={() => onOpenWriter({ title: '', content: '', mood: 'peaceful', date: selectedDate })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#385346] shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Write Journal for this Date</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reading Modal */}
      {activeReadingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#fcfbf9] border border-[#ded5c6] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#4a6b5d]">
                  {new Date(activeReadingEntry.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#252e28]">
                  {activeReadingEntry.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveReadingEntry(null)}
                className="p-1.5 rounded-xl text-[#8a7f6f] hover:bg-[#ede5d6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photos in Modal */}
            {activeReadingEntry.photos && activeReadingEntry.photos.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                {activeReadingEntry.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhoto(photo.url)}
                    className="shrink-0 p-2 bg-white rounded-2xl border border-[#ded5c6] shadow-2xs cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt="Memory"
                      className="w-28 h-28 object-cover rounded-xl"
                    />
                    {photo.caption && (
                      <p className="text-xs font-handwriting text-center text-[#736755] mt-1">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content Body */}
            <div className="text-sm text-[#353f38] leading-relaxed font-reading whitespace-pre-wrap">
              {activeReadingEntry.content}
            </div>

            {/* AI Insight */}
            {activeReadingEntry.aiReflection && (
              <div className="p-4 rounded-2xl bg-[#f9f5e8] border border-[#ebdcb8] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8b6f27]">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Lumina AI Insight</span>
                </div>
                <p className="text-xs text-[#6e5d32] font-reading">
                  {activeReadingEntry.aiReflection}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#ded5c6] flex items-center justify-between">
              <button
                onClick={() => {
                  onEditEntry(activeReadingEntry.id);
                  setActiveReadingEntry(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#395447]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Journal</span>
              </button>

              <button
                onClick={() => setActiveReadingEntry(null)}
                className="px-4 py-2 rounded-xl bg-[#f1ebe0] text-[#5c5243] text-xs font-medium hover:bg-[#e4dcce]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 cursor-pointer"
        >
          <div className="max-w-2xl p-2 bg-white rounded-2xl shadow-2xl">
            <img src={activePhoto} alt="Preview" className="max-h-[80vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

