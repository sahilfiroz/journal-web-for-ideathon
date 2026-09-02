import React from 'react';
import { JournalEntry, MoodType, UserProfile } from '../types';
import { PublicFeed } from './PublicFeed';
import { UserJournalSequence } from './UserJournalSequence';
import { TopAssistantsSection } from './TopAssistantsSection';
import { GoalsAndHabitsSection } from './GoalsAndHabitsSection';

interface SanctuaryDashboardProps {
  entries: JournalEntry[];
  currentUser?: UserProfile | null;
  isGuest?: boolean;
  onRequireLogin?: () => void;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => void;
  onOpenWriter: (draft?: { title: string; content: string; mood: MoodType; date?: string }) => void;
  onQuickSaveJournal: (entry: JournalEntry) => void;
  onOpenAIChat: (initialPrompt?: string) => void;
}

export const SanctuaryDashboard: React.FC<SanctuaryDashboardProps> = ({
  entries,
  currentUser,
  isGuest = false,
  onRequireLogin,
  onEditEntry,
  onDeleteEntry,
  onToggleBookmark,
  onOpenWriter,
  onQuickSaveJournal,
  onOpenAIChat,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          TOP TWO PORTIONS:
          1. AI Journal Assistant & Prompt Sparks
          2. Quick Add Story / Journal Form
         ───────────────────────────────────────────────────────────── */}
      <TopAssistantsSection
        isGuest={isGuest}
        onRequireLogin={onRequireLogin}
        onOpenAIChat={onOpenAIChat}
        onQuickSaveJournal={onQuickSaveJournal}
        onOpenFullWriter={(draft) => onOpenWriter(draft)}
      />

      {/* ─────────────────────────────────────────────────────────────
          MIDDLE GRID: [ Left Half (Public Post Feed) | Right Half (My Journals Sequence) ]
          Equal height matching containers with internal scrolling
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* FIRST HALF [ Left ]: Real Public Journals Post Feed */}
        <div className="rounded-3xl bg-[#fdfcf9] border border-[#ded5c6] p-4 sm:p-6 shadow-xs h-[780px] sm:h-[840px] flex flex-col overflow-hidden">
          <PublicFeed
            entries={entries}
            onOpenWriter={(draft) => onOpenWriter(draft)}
            userId={currentUser?.id}
            userName={currentUser?.name}
            userAvatar={currentUser?.avatar}
          />
        </div>

        {/* SECOND HALF [ Right ]: User's Previous Journals in Linewise Sequence */}
        <div className="rounded-3xl bg-[#fdfcf9] border border-[#ded5c6] p-4 sm:p-6 shadow-xs h-[780px] sm:h-[840px] flex flex-col overflow-hidden">
          <UserJournalSequence
            entries={entries}
            isGuest={isGuest}
            onRequireLogin={onRequireLogin}
            onOpenWriter={() => onOpenWriter()}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
            onToggleBookmark={onToggleBookmark}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SECTION: GOALS & HABITS (With Mandatory Dedicated Streak)
         ───────────────────────────────────────────────────────────── */}
      <div id="goals-and-habits-section" className="w-full pt-2">
        <GoalsAndHabitsSection
          userId={currentUser?.id}
          isGuest={isGuest}
          onRequireLogin={onRequireLogin}
        />
      </div>
    </div>
  );
};
