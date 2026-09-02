import React, { useState, useEffect } from 'react';
import { JournalEntry, ViewMode, SyncConfig, SyncState, MoodType, UserProfile } from './types';
import { 
  getLocalEntries, 
  saveLocalEntries, 
  getSyncConfig, 
  saveSyncConfig, 
  syncWithCloud 
} from './utils/storage';
import { calculateStreakFromEntries } from './utils/streak';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { SanctuaryDashboard } from './components/SanctuaryDashboard';
import { JournalEditor } from './components/JournalEditor';
import { AIChatbotModal } from './components/AIChatbotModal';
import { SyncModal } from './components/SyncModal';
import { AmbientSoundBar } from './components/AmbientSoundBar';
import { PromptSparkModal } from './components/PromptSparkModal';
import { PencilGraphiteTrail } from './components/PencilGraphiteTrail';
import { 
  auth,
  subscribeToAuth, 
  subscribeUserJournals, 
  saveUserJournalToFirestore, 
  deleteUserJournalFromFirestore, 
  logoutUser 
} from './services/firebase';

export default function App() {
  // Authentication State: Login page is the starting page if null
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lumina_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_current_user');
      const u = saved ? JSON.parse(saved) : null;
      return getLocalEntries(u?.id);
    } catch {
      return [];
    }
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    try {
      const saved = localStorage.getItem('lumina_current_user');
      const u = saved ? JSON.parse(saved) : null;
      return getSyncConfig(u?.id);
    } catch {
      return getSyncConfig(null);
    }
  });

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  const [currentEntryId, setCurrentEntryId] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Modals
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotInitialPrompt, setChatbotInitialPrompt] = useState<string | undefined>(undefined);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSoundBarOpen, setIsSoundBarOpen] = useState(false);
  const [isPromptSparkOpen, setIsPromptSparkOpen] = useState(false);

  // Firebase auth state tracking
  const [authUid, setAuthUid] = useState<string | null>(() => auth.currentUser?.uid || null);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        setAuthUid(firebaseUser.uid);
        setCurrentUser((prev) => {
          const userObj: UserProfile = {
            id: firebaseUser.uid,
            name: prev?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Mindful Author',
            email: firebaseUser.email || prev?.email || `user_${firebaseUser.uid.slice(0, 5)}@lumina.sanctuary`,
            isGuest: firebaseUser.isAnonymous,
            avatar: prev?.avatar || firebaseUser.photoURL || undefined,
            createdAt: prev?.createdAt || Date.now(),
          };
          try {
            localStorage.setItem('lumina_current_user', JSON.stringify(userObj));
          } catch {
            // ignore
          }
          return userObj;
        });
      } else {
        setAuthUid(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Sync for Authenticated Users (Strictly User Isolated)
  useEffect(() => {
    if (!currentUser?.id || !authUid || authUid !== currentUser.id) {
      if (!currentUser?.id) {
        setEntries([]);
        setCurrentEntryId('');
      }
      return;
    }

    // Immediately load active user's local entries (empty array for brand new user)
    const userLocal = getLocalEntries(currentUser.id);
    setEntries(userLocal);
    setCurrentEntryId(userLocal[0]?.id || '');

    setSyncState('syncing');
    const unsubscribeJournals = subscribeUserJournals(
      currentUser.id,
      (firestoreEntries) => {
        const cleanList = firestoreEntries || [];
        setEntries(cleanList);
        saveLocalEntries(cleanList, currentUser.id);
        setSyncState('synced');
        if (cleanList.length > 0) {
          if (!currentEntryId || !cleanList.some(e => e.id === currentEntryId)) {
            setCurrentEntryId(cleanList[0].id);
          }
        } else {
          setCurrentEntryId('');
        }
      },
      () => {
        setSyncState('idle');
      }
    );

    return () => unsubscribeJournals();
  }, [currentUser?.id, authUid]);

  // Initial and Periodic Cloud Sync code runner (cross-device vault code)
  useEffect(() => {
    const runSync = async () => {
      if (!syncConfig.autoSync || !syncConfig.syncCode || !currentUser?.id) return;
      setSyncState('syncing');
      const res = await syncWithCloud(entries, syncConfig.syncCode, syncConfig.deviceName, currentUser.id);
      setEntries(res.merged);
      setSyncState(res.state);
      setSyncConfig((prev) => {
        const next = { ...prev, lastSyncTimestamp: res.lastSync };
        saveSyncConfig(next, currentUser?.id);
        return next;
      });
      if (res.merged.length > 0 && !res.merged.some((e) => e.id === currentEntryId)) {
        setCurrentEntryId(res.merged[0].id);
      }
    };

    runSync();
  }, [syncConfig.syncCode, currentUser?.id]);

  // Handler: Save Entry (Persists locally & to Cloud Firestore strictly for currentUser)
  const handleSaveEntry = async (entry: JournalEntry) => {
    const exists = entries.some((e) => e.id === entry.id);
    let updated: JournalEntry[];
    if (exists) {
      updated = entries.map((e) => (e.id === entry.id ? entry : e));
    } else {
      updated = [entry, ...entries];
    }

    setEntries(updated);
    saveLocalEntries(updated, currentUser?.id);
    setCurrentEntryId(entry.id);
    setEditingEntry(null);
    setViewMode('dashboard');

    if (currentUser?.id) {
      setSyncState('syncing');
      saveUserJournalToFirestore(currentUser.id, entry)
        .then(() => setSyncState('synced'))
        .catch((err) => {
          console.error('Firestore save failed:', err);
          setSyncState('error');
        });
    }

    if (syncConfig.syncCode && currentUser?.id) {
      setSyncState('syncing');
      syncWithCloud(updated, syncConfig.syncCode, syncConfig.deviceName, currentUser.id).then((res) => {
        setSyncState(res.state);
        setSyncConfig((prev) => ({ ...prev, lastSyncTimestamp: res.lastSync }));
      });
    }
  };

  // Handler: Quick Save Entry directly from top portion
  const handleQuickSaveJournal = (newEntry: JournalEntry) => {
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveLocalEntries(updated, currentUser?.id);
    setCurrentEntryId(newEntry.id);

    if (currentUser?.id) {
      setSyncState('syncing');
      saveUserJournalToFirestore(currentUser.id, newEntry)
        .then(() => setSyncState('synced'))
        .catch((err) => {
          console.error('Firestore quick save failed:', err);
          setSyncState('error');
        });
    }

    if (syncConfig.syncCode && currentUser?.id) {
      setSyncState('syncing');
      syncWithCloud(updated, syncConfig.syncCode, syncConfig.deviceName, currentUser.id).then((res) => {
        setSyncState(res.state);
        setSyncConfig((prev) => ({ ...prev, lastSyncTimestamp: res.lastSync }));
      });
    }
  };

  // Handler: Open AI Chatbot Modal with optional initial prompt
  const handleOpenAIChat = (initialPrompt?: string) => {
    setChatbotInitialPrompt(initialPrompt);
    setIsChatbotOpen(true);
  };

  // Handler: Delete Entry (Removes locally & from Cloud Firestore for currentUser)
  const handleDeleteEntry = (entryId: string) => {
    const updated = entries.filter((e) => e.id !== entryId);
    setEntries(updated);
    saveLocalEntries(updated, currentUser?.id);
    if (currentEntryId === entryId && updated.length > 0) {
      setCurrentEntryId(updated[0].id);
    } else if (updated.length === 0) {
      setCurrentEntryId('');
    }
    if (editingEntry?.id === entryId) {
      setEditingEntry(null);
      setViewMode('dashboard');
    }

    if (currentUser?.id) {
      deleteUserJournalFromFirestore(currentUser.id, entryId).catch((err) => {
        console.error('Firestore delete error:', err);
      });
    }

    if (syncConfig.syncCode && currentUser?.id) {
      syncWithCloud(updated, syncConfig.syncCode, syncConfig.deviceName, currentUser.id).then((res) => {
        setSyncState(res.state);
      });
    }
  };

  // Handler: Toggle Bookmark
  const handleToggleBookmark = (entryId: string) => {
    const updated = entries.map((e) =>
      e.id === entryId ? { ...e, bookmarked: !e.bookmarked, updatedAt: Date.now() } : e
    );
    setEntries(updated);
    saveLocalEntries(updated, currentUser?.id);

    const changed = updated.find((e) => e.id === entryId);
    if (changed && currentUser?.id) {
      saveUserJournalToFirestore(currentUser.id, changed).catch((err) => {
        console.error('Firestore bookmark toggle error:', err);
      });
    }

    if (syncConfig.syncCode && currentUser?.id) {
      syncWithCloud(updated, syncConfig.syncCode, syncConfig.deviceName, currentUser.id);
    }
  };

  // Handler: Trigger Manual Sync
  const handleTriggerSync = async () => {
    if (!currentUser?.id) return;
    setSyncState('syncing');
    const res = await syncWithCloud(entries, syncConfig.syncCode, syncConfig.deviceName, currentUser.id);
    setEntries(res.merged);
    setSyncState(res.state);
    setSyncConfig((prev) => {
      const next = { ...prev, lastSyncTimestamp: res.lastSync };
      saveSyncConfig(next, currentUser.id);
      return next;
    });
  };

  // Handler: Open Editor
  const handleOpenWriter = (
    draftOrEntry?: JournalEntry | { title: string; content: string; mood: MoodType; date?: string } | null
  ) => {
    if (!draftOrEntry) {
      setEditingEntry(null);
    } else if ('id' in draftOrEntry && 'wordCount' in draftOrEntry) {
      setEditingEntry(draftOrEntry as JournalEntry);
    } else {
      const constructedEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        title: draftOrEntry.title || '',
        content: draftOrEntry.content || '',
        date: draftOrEntry.date || new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mood: draftOrEntry.mood || 'peaceful',
        tags: ['Daily'],
        photos: [],
        wordCount: draftOrEntry.content ? draftOrEntry.content.split(/\s+/).length : 0,
        readingTimeMinutes: 1,
        bookmarked: false,
        pinned: false,
      };
      setEditingEntry(constructedEntry);
    }
    setViewMode('write');
  };

  // Handler: Apply AI Extracted Journal Entry
  const handleApplyChatbotJournal = (journal: {
    title: string;
    content: string;
    mood: MoodType;
    tags: string[];
  }) => {
    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: journal.title,
      content: journal.content,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: journal.mood,
      tags: journal.tags,
      photos: [],
      wordCount: journal.content.trim().split(/\s+/).length,
      readingTimeMinutes: 1,
      bookmarked: false,
      pinned: false,
    };
    setEditingEntry(newEntry);
    setViewMode('write');
  };

  // Handler: Prompt Spark Selection
  const handleSelectPromptSpark = (theme: string, question: string) => {
    const starterEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: theme,
      content: `Prompt: "${question}"\n\n`,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: 'inspired',
      tags: [theme, 'Sparks'],
      photos: [],
      wordCount: 0,
      readingTimeMinutes: 1,
      bookmarked: false,
      pinned: false,
    };
    setEditingEntry(starterEntry);
    setViewMode('write');
  };

  // Handler: Auth Login Success
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setAuthUid(user.id);
    const userEntries = getLocalEntries(user.id);
    setEntries(userEntries);
    setCurrentEntryId(userEntries[0]?.id || '');
    try {
      localStorage.setItem('lumina_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  // Handler: Auth Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setCurrentUser(null);
    setAuthUid(null);
    setEntries([]);
    setCurrentEntryId('');
    setEditingEntry(null);
    try {
      localStorage.removeItem('lumina_current_user');
    } catch {
      // ignore
    }
    setViewMode('dashboard');
  };

  // Calculate real streak directly connected to My Journals
  const streakInfo = calculateStreakFromEntries(entries);

  // If user is not logged in / entered as guest, show the Login Page as the starting page
  if (!currentUser) {
    return (
      <>
        <PencilGraphiteTrail />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#28322c] flex flex-col selection:bg-[#d8e4dc]">
      {/* Real-time Pencil Graphite Shading Trail */}
      <PencilGraphiteTrail />

      {/* Clean Minimalist Navbar with Top-Right Streak Button & Profile */}
      <Navbar 
        streakDays={streakInfo.streakDays}
        hasWrittenToday={streakInfo.hasWrittenToday}
        activeStreakDates={streakInfo.activeStreakDates}
        totalEntriesCount={entries.length}
        userEmail={currentUser.email}
        userName={currentUser.name}
        isGuest={currentUser.isGuest}
        syncState={syncState}
        onLogout={handleLogout}
        onOpenWriter={() => handleOpenWriter()}
        onOpenSoundBar={() => setIsSoundBarOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenPromptSparks={() => setIsPromptSparkOpen(true)}
        onOpenAIChat={() => handleOpenAIChat()}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="w-full flex-1">
          {viewMode === 'dashboard' && (
            <SanctuaryDashboard
              entries={entries}
              currentUser={currentUser}
              isGuest={currentUser.isGuest}
              onRequireLogin={handleLogout}
              onEditEntry={(id) => {
                const target = entries.find((e) => e.id === id);
                if (target) handleOpenWriter(target);
              }}
              onDeleteEntry={handleDeleteEntry}
              onToggleBookmark={handleToggleBookmark}
              onOpenWriter={(draft) => handleOpenWriter(draft)}
              onQuickSaveJournal={handleQuickSaveJournal}
              onOpenAIChat={handleOpenAIChat}
            />
          )}

          {viewMode === 'write' && (
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
              <JournalEditor
                initialEntry={editingEntry}
                onSave={handleSaveEntry}
                onDelete={handleDeleteEntry}
                onCancel={() => {
                  setEditingEntry(null);
                  setViewMode('dashboard');
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Soundscape Synthesizer */}
      <AmbientSoundBar
        isOpen={isSoundBarOpen}
        onClose={() => setIsSoundBarOpen(false)}
      />

      {/* AI Journal Chatbot Modal */}
      <AIChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => {
          setIsChatbotOpen(false);
          setChatbotInitialPrompt(undefined);
        }}
        onApplyJournal={handleApplyChatbotJournal}
        initialPrompt={chatbotInitialPrompt}
        recentJournalsSummary={entries
          .slice(0, 3)
          .map((e) => `[${e.date} (${e.mood})]: ${e.title} - ${e.content.slice(0, 100)}...`)
          .join('\n')}
      />

      {/* Cloud Sync Center Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        syncState={syncState}
        entries={entries}
        onUpdateSyncConfig={(cfg) => {
          setSyncConfig(cfg);
          saveSyncConfig(cfg);
        }}
        onTriggerSync={handleTriggerSync}
        onImportEntries={(imported) => {
          setEntries(imported);
          saveLocalEntries(imported);
          if (imported.length > 0) setCurrentEntryId(imported[0].id);
        }}
      />

      {/* Prompt Spark Modal */}
      <PromptSparkModal
        isOpen={isPromptSparkOpen}
        onClose={() => setIsPromptSparkOpen(false)}
        onSelectPrompt={handleSelectPromptSpark}
        currentMood="peaceful"
      />
    </div>
  );
}
