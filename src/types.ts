export type MoodType = 
  | 'peaceful' 
  | 'grateful' 
  | 'reflective' 
  | 'energized' 
  | 'melancholic' 
  | 'inspired'
  | 'content';

export interface JournalPhoto {
  id: string;
  url: string; // Base64 data URL or external URL
  caption?: string;
  timestamp: number;
  rotationDeg?: number;
  filter?: 'none' | 'vintage' | 'warm' | 'noir' | 'fade';
  aspectRatio?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  mood: MoodType;
  weather?: string;
  location?: string;
  tags: string[];
  photos: JournalPhoto[];
  aiReflection?: string;
  wordCount: number;
  readingTimeMinutes: number;
  bookmarked: boolean;
  pinned: boolean;
  themeColor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedPrompts?: string[];
  sympathyNote?: string;
  copyableFormat?: string;
  extractedJournal?: {
    title: string;
    content: string;
    mood: MoodType;
    tags: string[];
    date?: string;
    writingTime?: string;
    copyableText?: string;
  };
}

export interface PublicPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    handle: string;
  };
  timeAgo: string;
  entryDate?: string;       // e.g. "2026-08-31"
  entryDateLabel?: string;  // e.g. "Today's Journal", "Yesterday's Journal", "Aug 29, 2026"
  writingTime?: string;     // e.g. "10:30 AM" or "10:31 AM"
  createdAt?: number;
  userId?: string;
  sourceJournalId?: string;
  title: string;
  content: string;
  mood: string;
  moodIcon: string;
  tags: string[];
  likes: number;
  isLiked?: boolean;
  resonateCount: number;
  isResonated?: boolean;
  imageUrl?: string;
  imageCaption?: string;
  location?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export type GoalCategory = 'Mind & Soul' | 'Writing & Craft' | 'Health & Body' | 'Life & Habits' | 'Creativity';

export interface GoalItem {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  milestones: GoalMilestone[];
  status: 'in_progress' | 'completed' | 'paused';
  createdAt: number;
  updatedAt: number;
}

export type HabitCategory = 'Mindfulness' | 'Writing' | 'Health' | 'Focus' | 'Wellbeing';

export interface HabitItem {
  id: string;
  title: string;
  category: HabitCategory;
  icon: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  completionDates: string[]; // List of YYYY-MM-DD formatted dates
  targetDaysPerWeek: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  avatar?: string;
  createdAt: number;
}

export type ViewMode = 'dashboard' | 'write';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncConfig {
  syncCode: string;
  deviceName: string;
  lastSyncTimestamp: number | null;
  autoSync: boolean;
  serverUrl?: string;
}

export interface AmbientSoundState {
  isPlaying: boolean;
  activeSound: 'none' | 'rain' | 'forest' | 'waves' | 'cafe' | 'fireplace';
  volume: number;
}
