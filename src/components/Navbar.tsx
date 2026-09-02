import React, { useState } from 'react';
import { 
  Feather, 
  Flame, 
  Sparkles, 
  X, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  Calendar,
  Volume2,
  Cloud,
  MessageSquare
} from 'lucide-react';
import { SyncState } from '../types';

interface NavbarProps {
  streakDays?: number;
  hasWrittenToday?: boolean;
  activeStreakDates?: string[];
  totalEntriesCount?: number;
  userEmail?: string;
  userName?: string;
  isGuest?: boolean;
  syncState?: SyncState;
  onLogout?: () => void;
  onOpenWriter?: () => void;
  onOpenSoundBar?: () => void;
  onOpenSyncModal?: () => void;
  onOpenPromptSparks?: () => void;
  onOpenAIChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  streakDays = 0,
  hasWrittenToday = false,
  activeStreakDates = [],
  totalEntriesCount = 0,
  userEmail = 'sahilfiroz008@gmail.com',
  userName = 'Sahil Firoz',
  isGuest = false,
  syncState = 'idle',
  onLogout,
  onOpenWriter,
  onOpenSoundBar,
  onOpenSyncModal,
  onOpenPromptSparks,
  onOpenAIChat,
}) => {
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#fcfbf8] border-b border-[#e8dfd1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Title (Left) */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4a6b5d] to-[#334e42] flex items-center justify-center text-white shadow-xs">
              <Feather className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl text-[#222a25] tracking-tight">
              Lumina
            </span>
          </div>

          {/* Quick Sanctuary Utilities & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Ambient Soundscapes */}
            {onOpenSoundBar && (
              <button
                type="button"
                onClick={onOpenSoundBar}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white border border-[#ded5c6] text-[#554a3a] hover:text-[#4a6b5d] hover:border-[#4a6b5d] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                title="Mindful Soundscapes (Rain, Ocean, Forest, Cafe)"
              >
                <Volume2 className="w-4 h-4 text-[#4a6b5d]" />
                <span className="hidden md:inline font-medium">Sounds</span>
              </button>
            )}

            {/* Prompt Sparks */}
            {onOpenPromptSparks && (
              <button
                type="button"
                onClick={onOpenPromptSparks}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white border border-[#ded5c6] text-[#554a3a] hover:text-[#8f753c] hover:border-[#8f753c] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                title="Mindful Writing Sparks"
              >
                <Sparkles className="w-4 h-4 text-[#8f753c]" />
                <span className="hidden md:inline font-medium">Sparks</span>
              </button>
            )}

            {/* Cloud Sync */}
            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs ${
                  syncState === 'syncing'
                    ? 'bg-[#edf5f0] border-[#bcd6c7] text-[#2d5240]'
                    : syncState === 'synced'
                    ? 'bg-white border-[#ded5c6] text-[#554a3a] hover:border-[#4a6b5d]'
                    : 'bg-white border-[#ded5c6] text-[#554a3a] hover:border-[#4a6b5d]'
                }`}
                title="Multi-Device Cloud Sync & Backup"
              >
                <Cloud className={`w-4 h-4 ${syncState === 'syncing' ? 'animate-pulse text-[#4a6b5d]' : 'text-[#4a6b5d]'}`} />
                <span className="hidden lg:inline font-medium">
                  {syncState === 'syncing' ? 'Syncing...' : 'Cloud Vault'}
                </span>
              </button>
            )}

            {/* Streak Button: Only shown for logged-in accounts, hidden for guest */}
            {!isGuest && (
              <button
                onClick={() => setShowStreakModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#fef5ec] border border-[#f5d7b5] text-[#b45309] font-medium text-xs sm:text-sm shadow-xs hover:border-[#ea580c] transition-colors active:scale-95 cursor-pointer"
                title="Streak details"
              >
                <Flame className="w-4 h-4 text-[#ea580c] fill-[#ea580c]" />
                <span className="font-bold font-mono tracking-tight text-[#9a3412]">
                  {streakDays}d
                </span>
              </button>
            )}

            {/* Profile Option Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white border border-[#ded5c6] text-[#2c3730] hover:border-[#4a6b5d] hover:bg-[#f7f5ee] transition-colors shadow-xs active:scale-95 cursor-pointer"
              title="Open Profile"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a6b5d] to-[#273830] text-white flex items-center justify-center text-xs font-serif font-bold shadow-2xs">
                {userName.slice(0, 1)}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-[#28332c]">
                Profile
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#fcfbf9] border border-[#ded5c6] p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4a6b5d] to-[#2e473b] text-white flex items-center justify-center font-serif text-xl font-bold shadow-md">
                  {userName.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#242c27] flex items-center gap-1.5">
                    {userName}
                    {!isGuest && <ShieldCheck className="w-4 h-4 text-[#4a6b5d]" />}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-[#7e7362]">
                    <Mail className="w-3 h-3 text-[#9a8c78]" />
                    <span className="truncate max-w-[190px]">{userEmail}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-xl text-[#8a7f6f] hover:bg-[#ede5d6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Overview */}
            {isGuest ? (
              <div className="p-4 bg-white rounded-2xl border border-[#ded5c6] text-center space-y-2">
                <div className="text-xs font-bold text-[#4a6b5d] uppercase tracking-wider">
                  Guest Explorer Profile
                </div>
                <p className="text-xs text-[#7e7362] leading-relaxed font-reading">
                  You are exploring Lumina in Guest Mode. Writing streak tracking and private journals are locked.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-white rounded-2xl border border-[#e2d8c8] text-center">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center text-[#ea580c]">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div className="font-bold text-base font-mono text-[#242c27]">{streakDays}d</div>
                  <div className="text-[10px] uppercase font-semibold text-[#8a7f6e]">Streak</div>
                </div>

                <div className="space-y-0.5 border-x border-[#ede5d8]">
                  <div className="flex items-center justify-center text-[#4a6b5d]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-base font-mono text-[#242c27]">{totalEntriesCount}</div>
                  <div className="text-[10px] uppercase font-semibold text-[#8a7f6e]">Journals</div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-center text-[#d4af37]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-base font-mono text-[#242c27]">Active</div>
                  <div className="text-[10px] uppercase font-semibold text-[#8a7f6e]">Mindfulness</div>
                </div>
              </div>
            )}

            {/* Mindful Habit Note */}
            <div className="p-3.5 rounded-2xl bg-[#edf5f0] border border-[#cfe0d6] text-xs text-[#355746] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4a6b5d]" />
                {isGuest ? 'Guest Access' : 'Mindful Journaler Profile'}
              </div>
              <p className="text-[11px] leading-relaxed text-[#416353]">
                {isGuest 
                  ? 'Sign in to access your personal journal timeline, track daily streaks, and sync across devices.'
                  : `Your ${totalEntriesCount} journals are securely saved. Your ${streakDays}-day streak is actively verified from My Journals.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {onLogout && (
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onLogout();
                  }}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isGuest
                      ? 'bg-[#4a6b5d] text-white border-[#4a6b5d] hover:bg-[#395347] shadow-xs'
                      : 'bg-white border-[#ded5c6] text-[#b91c1c] hover:bg-[#fef2f2] hover:border-[#fca5a5]'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isGuest ? 'Sign In / Register' : 'Sign Out'}</span>
                </button>
              )}

              <button
                onClick={() => setShowProfileModal(false)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isGuest
                    ? 'px-4 bg-[#f1ebe0] text-[#5c5243] hover:bg-[#e4dcce]'
                    : 'flex-1 bg-[#4a6b5d] text-white hover:bg-[#385246] shadow-xs'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Information Popup Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="relative w-full max-w-md rounded-3xl bg-[#fcfbf9] border border-[#ded5c6] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#c2410c] text-white flex items-center justify-center shadow-md">
                  <Flame className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#252e28]">
                    {streakDays} Day Writing Streak
                  </h3>
                  <p className="text-xs text-[#7e7362]">Connected directly to My Journals</p>
                </div>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                className="p-1.5 rounded-xl text-[#8a7f6f] hover:bg-[#ede5d6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Streak Status Notice */}
            <div className="p-3.5 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] space-y-1 text-xs text-[#9a3412]">
              <div className="font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-[#ea580c] text-[#ea580c]" />
                <span>Streak Verification Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7c2d12]">
                Your streak reflects exactly the number of consecutive days you have recorded journals in <strong>My Journals</strong>. Each consecutive day with a journal adds 1 day to your streak.
              </p>
            </div>

            {/* Current Days Breakdown */}
            <div className="p-4 rounded-2xl bg-white border border-[#ded5c6] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#807463] uppercase tracking-wider text-[10px]">
                  Consecutive Journal Days Verified
                </span>
                <span className="font-mono font-bold text-[#4a6b5d]">
                  {activeStreakDates.length} Day{activeStreakDates.length !== 1 ? 's' : ''} Active
                </span>
              </div>

              {activeStreakDates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {activeStreakDates.map((dateStr) => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const formatted = d.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <span
                        key={dateStr}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f7f3] border border-[#cbe4d7] text-[#2d5240] text-xs font-mono font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#4a6b5d]" />
                        <span>{formatted}</span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#8a7f6e] font-reading">
                  No active consecutive streak yet. Write today's journal in My Journals to start your 1-day streak!
                </p>
              )}
            </div>

            {/* Today's Status Banner */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs ${
              hasWrittenToday
                ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                : 'bg-[#fefce8] border-[#fef08a] text-[#854d0e]'
            }`}>
              {hasWrittenToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Today's journal is recorded in My Journals and your streak is active!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-[#ca8a04] shrink-0" />
                  <span>You haven't written today yet. Write today's journal to maintain or increase your streak!</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!hasWrittenToday && onOpenWriter && (
                <button
                  onClick={() => {
                    setShowStreakModal(false);
                    onOpenWriter();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ea580c] text-white text-xs font-semibold hover:bg-[#c2410c] transition-colors shadow-xs cursor-pointer"
                >
                  Write Today's Journal
                </button>
              )}
              <button
                onClick={() => setShowStreakModal(false)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  !hasWrittenToday && onOpenWriter
                    ? 'px-4 bg-[#f1ebe0] text-[#5c5243] hover:bg-[#e4dcce]'
                    : 'w-full bg-[#4a6b5d] text-white hover:bg-[#385246]'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
