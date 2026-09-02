import React, { useState, useEffect } from 'react';
import { GoalItem, HabitItem, GoalCategory, HabitCategory } from '../types';
import { 
  Target, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  TrendingUp, 
  Award,
  Zap,
  Clock,
  ListTodo,
  ChevronRight,
  Smile,
  ShieldCheck,
  Lock,
  LogIn,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { FeatureInfo } from './FeatureInfo';
import { 
  saveUserGoalsToFirestore, 
  saveUserHabitsToFirestore, 
  subscribeUserGoals,
  subscribeUserHabits,
  auth 
} from '../services/firebase';
import { 
  getUserGoals, 
  saveUserGoals, 
  getUserHabits, 
  saveUserHabits 
} from '../utils/storage';

interface GoalsAndHabitsSectionProps {
  userId?: string;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

const STARTER_GOALS_TEMPLATE: GoalItem[] = [
  {
    id: 'starter-goal-1',
    title: 'Mindful Morning Routine Mastery',
    description: 'Establish a calm 20-minute morning window for tea, stretching, and mindful presence without looking at screens.',
    category: 'Mind & Soul',
    targetDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    progress: 0,
    status: 'in_progress',
    milestones: [
      { id: 'm-1', title: 'Zero screen for first 15 minutes after waking', completed: false },
      { id: 'm-2', title: '5-minute diaphragmatic breathing before breakfast', completed: false },
      { id: 'm-3', title: 'Complete 14 consecutive morning sessions', completed: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'starter-goal-2',
    title: 'Write 30 Reflective Journal Entries',
    description: 'Deepen self-awareness by expressing authentic thoughts and capturing daily memories in Lumina.',
    category: 'Writing & Craft',
    targetDate: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
    progress: 0,
    status: 'in_progress',
    milestones: [
      { id: 'm-21', title: 'Reach first 10 journal entries', completed: false },
      { id: 'm-22', title: 'Reach 20 entries with photo polaroids', completed: false },
      { id: 'm-23', title: 'Complete the full 30-entry sanctuary archive', completed: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const STARTER_HABITS_TEMPLATE: HabitItem[] = [
  {
    id: 'starter-habit-1',
    title: 'Morning Diaphragmatic Breathwork',
    category: 'Mindfulness',
    icon: '🌿',
    frequency: 'daily',
    currentStreak: 0,
    longestStreak: 0,
    completionDates: [],
    targetDaysPerWeek: 7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'starter-habit-2',
    title: 'Evening Reflection & Gratitude',
    category: 'Writing',
    icon: '✨',
    frequency: 'daily',
    currentStreak: 0,
    longestStreak: 0,
    completionDates: [],
    targetDaysPerWeek: 7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'starter-habit-3',
    title: 'Hydration & Herbal Tea Calm',
    category: 'Health',
    icon: '🍵',
    frequency: 'daily',
    currentStreak: 0,
    longestStreak: 0,
    completionDates: [],
    targetDaysPerWeek: 7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Helper: Calculate streak strictly for habits based on completion dates
function computeHabitStreak(dates: string[]): { current: number; longest: number } {
  if (!dates || dates.length === 0) return { current: 0, longest: 0 };
  const uniqueSorted = Array.from(new Set(dates)).sort().reverse();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let current = 0;
  // Check if today or yesterday is present
  const hasToday = uniqueSorted.includes(todayStr);
  const hasYesterday = uniqueSorted.includes(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    current = 0;
  } else {
    let checkDate = hasToday ? new Date() : new Date(Date.now() - 86400000);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueSorted.includes(dateStr)) {
        current++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Calculate longest
  let longest = current;
  let running = 0;
  const ascending = Array.from(new Set(dates)).sort();
  for (let i = 0; i < ascending.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(ascending[i - 1]);
      const curr = new Date(ascending[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > longest) longest = running;
  }

  return { current, longest };
}

// 7-day strip generator for the current week
function getPast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

export const GoalsAndHabitsSection: React.FC<GoalsAndHabitsSectionProps> = ({
  userId,
  isGuest = false,
  onRequireLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'habits' | 'goals'>('all');
  const [goals, setGoals] = useState<GoalItem[]>(() => getUserGoals(userId));
  const [habits, setHabits] = useState<HabitItem[]>(() => getUserHabits(userId));

  // Modal states
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [goalMilestoneInput, setGoalMilestoneInput] = useState('');
  const [newGoalMilestones, setNewGoalMilestones] = useState<string[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('Mind & Soul');
  const [newGoalDate, setNewGoalDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);

  // Habit Form
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('Mindfulness');
  const [newHabitIcon, setNewHabitIcon] = useState('🌿');
  const [newHabitFreq, setNewHabitFreq] = useState<'daily' | 'weekdays' | 'weekly'>('daily');

  // Guest Mode Auth Prompt Modal
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);

  const past7Days = getPast7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  // Guest Action Guard helper
  const guardGuestAction = (action: () => void) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    action();
  };

  // User switch & Firestore sync effect
  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setHabits([]);
      return;
    }

    const localG = getUserGoals(userId);
    const localH = getUserHabits(userId);
    setGoals(localG);
    setHabits(localH);

    if (isGuest) return;

    const unsubGoals = subscribeUserGoals(userId, (remoteGoals) => {
      if (remoteGoals && remoteGoals.length > 0) {
        setGoals(remoteGoals);
        saveUserGoals(remoteGoals, userId);
      }
    });

    const unsubHabits = subscribeUserHabits(userId, (remoteHabits) => {
      if (remoteHabits && remoteHabits.length > 0) {
        setHabits(remoteHabits);
        saveUserHabits(remoteHabits, userId);
      }
    });

    return () => {
      unsubGoals();
      unsubHabits();
    };
  }, [userId, isGuest]);

  // Save to localStorage & Firestore whenever updated
  useEffect(() => {
    if (!userId || isGuest) return;
    try {
      saveUserGoals(goals, userId);
      saveUserGoalsToFirestore(userId, goals);
    } catch (e) {
      console.warn('Saving goals notice:', e);
    }
  }, [goals, userId, isGuest]);

  useEffect(() => {
    if (!userId || isGuest) return;
    try {
      saveUserHabits(habits, userId);
      saveUserHabitsToFirestore(userId, habits);
    } catch (e) {
      console.warn('Saving habits notice:', e);
    }
  }, [habits, userId, isGuest]);

  const handleLoadStarterTemplates = () => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    setGoals(STARTER_GOALS_TEMPLATE);
    setHabits(STARTER_HABITS_TEMPLATE);
    saveUserGoals(STARTER_GOALS_TEMPLATE, userId);
    saveUserHabits(STARTER_HABITS_TEMPLATE, userId);
    saveUserGoalsToFirestore(userId, STARTER_GOALS_TEMPLATE);
    saveUserHabitsToFirestore(userId, STARTER_HABITS_TEMPLATE);
  };

  // Toggle habit completion for a specific date
  const handleToggleHabitDay = (habitId: string, dateStr: string) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completionDates.includes(dateStr);
        const updatedDates = exists
          ? h.completionDates.filter((d) => d !== dateStr)
          : [...h.completionDates, dateStr];

        const { current, longest } = computeHabitStreak(updatedDates);

        return {
          ...h,
          completionDates: updatedDates,
          currentStreak: current,
          longestStreak: Math.max(h.longestStreak, longest),
          lastCompletedDate: updatedDates.length > 0 ? updatedDates.sort().reverse()[0] : undefined,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Quick 1-tap complete for today
  const handleCompleteHabitToday = (habitId: string) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    handleToggleHabitDay(habitId, todayStr);
  };

  // Toggle Goal Milestone
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = updatedMilestones.length > 0
          ? Math.round((completedCount / updatedMilestones.length) * 100)
          : g.progress;

        return {
          ...g,
          milestones: updatedMilestones,
          progress,
          status: progress === 100 ? 'completed' : 'in_progress',
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Delete Goal / Habit
  const handleDeleteGoal = (goalId: string) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleDeleteHabit = (habitId: string) => {
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Create Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    if (!newGoalTitle.trim()) return;

    const milestones = newGoalMilestones.map((m, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      title: m,
      completed: false,
    }));

    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || undefined,
      category: newGoalCategory,
      targetDate: newGoalDate,
      progress: 0,
      status: 'in_progress',
      milestones: milestones.length > 0 ? milestones : [
        { id: `m-${Date.now()}-1`, title: 'Start first mindful step', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Reach midpoint milestone', completed: false },
        { id: `m-${Date.now()}-3`, title: 'Complete and reflect', completed: false },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setGoals([newGoal, ...goals]);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalMilestones([]);
    setIsAddGoalModalOpen(false);
  };

  // Create Habit
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !userId) {
      setShowGuestAuthModal(true);
      return;
    }
    if (!newHabitTitle.trim()) return;

    const newHabit: HabitItem = {
      id: `habit-${Date.now()}`,
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      icon: newHabitIcon,
      frequency: newHabitFreq,
      currentStreak: 0,
      longestStreak: 0,
      completionDates: [],
      targetDaysPerWeek: newHabitFreq === 'weekdays' ? 5 : 7,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setHabits([newHabit, ...habits]);
    setNewHabitTitle('');
    setIsAddHabitModalOpen(false);
  };

  // Calculate Habit Master Streak (Aggregate dedicated habit streak)
  const habitMasterStreak = habits.length > 0
    ? Math.max(...habits.map((h) => h.currentStreak), 0)
    : 0;

  const completedTodayCount = habits.filter((h) => h.completionDates.includes(todayStr)).length;
  const todayCompletionRate = habits.length > 0
    ? Math.round((completedTodayCount / habits.length) * 100)
    : 0;

  return (
    <section className="w-full rounded-2xl bg-gradient-to-b from-[#fbf9f5] via-[#f7f3ea] to-[#f4eee2] border border-[#ded5c6] p-4 sm:p-6 shadow-sm space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          HEADER BAR: Goals & Habits with Dedicated Habit Streak
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e5dccd]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4a6b5d] text-white flex items-center justify-center shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#242c27]">
                Goals & Habits
              </h2>
              <FeatureInfo featureId="habitsAndGoals" size="xs" />
              {/* Mandatory Dedicated Habit Streak Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbebe3] border border-[#f0c8b6] text-xs font-bold text-[#b4481e] shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-current text-[#d9531e] animate-pulse" />
                <span>Habit Streak: {habitMasterStreak} Days</span>
              </span>
            </div>
            <p className="text-xs text-[#756a59] mt-0.5">
              Set personal milestones & cultivate mindful daily habits with dedicated streak tracking
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Filter */}
          <div className="flex items-center p-1 rounded-xl bg-white/80 border border-[#dfd5c5] text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'text-[#6b604f] hover:text-[#252e28]'
              }`}
            >
              All Overview
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'habits'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'text-[#6b604f] hover:text-[#252e28]'
              }`}
            >
              🔥 Habits ({habits.length})
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'goals'
                  ? 'bg-[#4a6b5d] text-white shadow-xs'
                  : 'text-[#6b604f] hover:text-[#252e28]'
              }`}
            >
              🎯 Goals ({goals.length})
            </button>
          </div>

          {/* Add Goal Button */}
          <button
            onClick={() => guardGuestAction(() => setIsAddGoalModalOpen(true))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-semibold text-[#4a6b5d] hover:bg-[#edf5f0] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Goal</span>
          </button>

          {/* Add Habit Button */}
          <button
            onClick={() => guardGuestAction(() => setIsAddHabitModalOpen(true))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GUEST MODE WARNING BANNER (When User is Guest)
         ───────────────────────────────────────────────────────────── */}
      {isGuest && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#fef7ee] border border-[#f5d9bc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#fdead6] text-[#c25e00] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8a3800]">
                  Guest Mode Active • Login / Signup Required for Goals & Habits
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#fae3cf] text-[#9c4100] font-bold">
                  Guest
                </span>
              </div>
              <p className="text-[11px] text-[#876a4c] mt-0.5">
                Personal daily habit streaks, milestone check-ins, and target roadmaps require an account to stay securely saved in the cloud.
              </p>
            </div>
          </div>
          {onRequireLogin && (
            <button
              type="button"
              onClick={onRequireLogin}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-semibold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STREAK & PERFORMANCE METRICS STRIP
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white/90 border border-[#e5dccd] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7d7160]">Habit Master Streak</span>
            <Flame className="w-4 h-4 text-[#d9531e] fill-[#d9531e]/20" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#242c27]">
              {habitMasterStreak}
            </span>
            <span className="text-xs text-[#b4481e] font-semibold">Days 🔥</span>
          </div>
          <p className="text-[10px] text-[#938573] mt-0.5">Mandatory separate habit streak</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/90 border border-[#e5dccd] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7d7160]">Today's Habits</span>
            <CheckCircle2 className="w-4 h-4 text-[#4a6b5d]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#242c27]">
              {completedTodayCount}/{habits.length}
            </span>
            <span className="text-xs text-[#4a6b5d] font-semibold">({todayCompletionRate}%)</span>
          </div>
          <p className="text-[10px] text-[#938573] mt-0.5">Daily completion pace</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/90 border border-[#e5dccd] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7d7160]">Active Goals</span>
            <Target className="w-4 h-4 text-[#b45309]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#242c27]">
              {goals.filter((g) => g.status === 'in_progress').length}
            </span>
            <span className="text-xs text-[#7e7261]">in progress</span>
          </div>
          <p className="text-[10px] text-[#938573] mt-0.5">{goals.filter((g) => g.status === 'completed').length} completed</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/90 border border-[#e5dccd] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7d7160]">Consistency</span>
            <TrendingUp className="w-4 h-4 text-[#4a6b5d]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#242c27]">
              {habits.length > 0 ? Math.round(habits.reduce((acc, h) => acc + h.currentStreak, 0) / habits.length) : 0}
            </span>
            <span className="text-xs text-[#5a4f3e]">Avg Streak</span>
          </div>
          <p className="text-[10px] text-[#938573] mt-0.5">Mindful daily momentum</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT GRID: HABITS TRACKER & GOALS ROADMAP
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HABITS TRACKING COLUMN */}
        {(activeTab === 'all' || activeTab === 'habits') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-[#252e28] flex items-center gap-1.5">
                  <span>Daily Habits & Streaks</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#fdeee4] text-[#b4481e] font-bold border border-[#f5ccb9]">
                    🔥 Streak Tracked
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-[#8c806f]">Click circles to log completions</span>
            </div>

            {habits.length === 0 ? (
              <div className="p-8 text-center bg-white/70 rounded-2xl border border-[#ded5c6] space-y-3">
                <Smile className="w-8 h-8 text-[#8c806f] mx-auto opacity-60" />
                <div>
                  <p className="text-xs font-semibold text-[#3e3428]">No habits registered for this account yet.</p>
                  <p className="text-[11px] text-[#867a68] mt-0.5">Start fresh or load a clean beginner template with zero streak.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => guardGuestAction(() => setIsAddHabitModalOpen(true))}
                    className="px-3 py-1.5 rounded-lg bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs cursor-pointer"
                  >
                    + Create First Habit
                  </button>
                  <button
                    onClick={handleLoadStarterTemplates}
                    className="px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#d6cbba] text-[#554b3d] text-xs font-semibold hover:bg-[#f0e9dc] cursor-pointer"
                  >
                    Load Starter Rituals Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completionDates.includes(todayStr);

                  return (
                    <div
                      key={habit.id}
                      className={`p-4 rounded-2xl bg-white border transition-all ${
                        isCompletedToday
                          ? 'border-[#cfe0d6] shadow-xs'
                          : 'border-[#ded5c6] hover:border-[#4a6b5d]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0 p-1.5 rounded-xl bg-[#faf7f0] border border-[#eae2d4]">
                            {habit.icon}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm text-[#252e28] truncate">
                              {habit.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-[#867b6c] mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-[#f5efe4] text-[#6b604f] text-[10px]">
                                {habit.category}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-[#b4481e] font-bold">
                                <Flame className="w-3 h-3 fill-current" />
                                {habit.currentStreak}d Streak
                              </span>
                              <span className="hidden sm:inline">• Max: {habit.longestStreak}d</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick 1-Tap Today Complete Button */}
                        <button
                          type="button"
                          onClick={() => handleCompleteHabitToday(habit.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 shadow-2xs ${
                            isCompletedToday
                              ? 'bg-[#edf5f0] text-[#3e6351] border border-[#cfe0d6]'
                              : 'bg-[#faf7f0] border border-[#ded5c6] text-[#635745] hover:bg-[#eef4f0] hover:text-[#3e6351]'
                          }`}
                        >
                          {isCompletedToday ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#3e6351]" />
                              <span>Done Today</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              <span>Log Today</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 7-Day History Mini-Strip */}
                      <div className="mt-3 pt-3 border-t border-[#f2ece1] flex items-center justify-between">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {past7Days.map((d) => {
                            const isDone = habit.completionDates.includes(d.dateStr);
                            return (
                              <button
                                key={d.dateStr}
                                type="button"
                                onClick={() => handleToggleHabitDay(habit.id, d.dateStr)}
                                title={`${d.dateStr}: ${isDone ? 'Completed' : 'Not completed'}`}
                                className={`flex flex-col items-center justify-center w-7 h-8 sm:w-8 sm:h-9 rounded-lg text-[10px] transition-all ${
                                  isDone
                                    ? 'bg-[#4a6b5d] text-white font-bold shadow-xs'
                                    : d.isToday
                                    ? 'bg-[#fbebe3] text-[#b4481e] border border-[#f5ccb9]'
                                    : 'bg-[#faf7f0] text-[#938573] hover:bg-[#eee6d8]'
                                }`}
                              >
                                <span className="text-[9px] uppercase leading-none opacity-80">
                                  {d.dayName}
                                </span>
                                <span className="font-semibold mt-0.5 leading-none">
                                  {d.dayNum}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1.5 rounded-lg text-[#a89d8e] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GOALS & MILESTONES COLUMN */}
        {(activeTab === 'all' || activeTab === 'goals') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3.5`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif font-bold text-[#252e28] flex items-center gap-1.5">
                <span>Personal Goals & Milestones</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#f1f6f2] text-[#3e6351] font-bold border border-[#cfe0d6]">
                  🎯 Purpose Driven
                </span>
              </span>
              <span className="text-[11px] text-[#8c806f]">Track progress milestones</span>
            </div>

            {goals.length === 0 ? (
              <div className="p-8 text-center bg-white/70 rounded-2xl border border-[#ded5c6] space-y-3">
                <Target className="w-8 h-8 text-[#8c806f] mx-auto opacity-60" />
                <div>
                  <p className="text-xs font-semibold text-[#3e3428]">No personal goals set for this account yet.</p>
                  <p className="text-[11px] text-[#867a68] mt-0.5">Define meaningful milestones or load starter goals.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => guardGuestAction(() => setIsAddGoalModalOpen(true))}
                    className="px-3 py-1.5 rounded-lg bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs cursor-pointer"
                  >
                    + Set First Goal
                  </button>
                  <button
                    onClick={handleLoadStarterTemplates}
                    className="px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#d6cbba] text-[#554b3d] text-xs font-semibold hover:bg-[#f0e9dc] cursor-pointer"
                  >
                    Load Starter Goals Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const isCompleted = goal.status === 'completed' || goal.progress === 100;

                  return (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-2xl bg-white border transition-all ${
                        isCompleted
                          ? 'border-[#cfe0d6] bg-gradient-to-r from-white to-[#f4f9f5]'
                          : 'border-[#ded5c6] hover:border-[#4a6b5d]/50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#faf7f0] border border-[#e5dccd] text-[10px] font-semibold text-[#716552]">
                              {goal.category}
                            </span>
                            <span className="text-[11px] text-[#8d8270] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#b45309]" />
                              Target: {goal.targetDate}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#242c27] mt-1.5">
                            {goal.title}
                          </h4>

                          {goal.description && (
                            <p className="text-xs text-[#635745] font-reading mt-1 leading-relaxed">
                              {goal.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-[#edf5f0] text-[#3e6351] border-[#cfe0d6]'
                              : 'bg-[#faf7f0] text-[#b45309] border-[#edd8c4]'
                          }`}>
                            {goal.progress}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-[#a89d8e] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full h-2 rounded-full bg-[#f1ebe0] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-[#4a6b5d]'
                              : 'bg-gradient-to-r from-[#b45309] to-[#4a6b5d]'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>

                      {/* Milestones Checkbox List */}
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#f4eee4] space-y-1.5">
                          {goal.milestones.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleToggleMilestone(goal.id, m.id)}
                              className="w-full flex items-center gap-2 text-left text-xs py-1 px-2 rounded-lg hover:bg-[#faf7f0] transition-colors"
                            >
                              {m.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#4a6b5d] shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-[#a89d8e] shrink-0" />
                              )}
                              <span className={`leading-tight ${m.completed ? 'line-through text-[#8c806f]' : 'text-[#353e38]'}`}>
                                {m.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: SET NEW GOAL
         ───────────────────────────────────────────────────────────── */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ded5c6] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8]">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#b45309]" />
                <h3 className="font-serif font-bold text-base text-[#252e28]">
                  Set a New Mindful Goal
                </h3>
              </div>
              <button
                onClick={() => setIsAddGoalModalOpen(false)}
                className="p-1 rounded-lg text-[#7d7260] hover:bg-[#f3ede1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meditate for 15 minutes daily before work"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Category
                  </label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  >
                    <option value="Mind & Soul">Mind & Soul</option>
                    <option value="Writing & Craft">Writing & Craft</option>
                    <option value="Health & Body">Health & Body</option>
                    <option value="Life & Habits">Life & Habits</option>
                    <option value="Creativity">Creativity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Why does this goal matter to your inner peace or growth?"
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Add Milestones
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Read 5 pages every night"
                    value={goalMilestoneInput}
                    onChange={(e) => setGoalMilestoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (goalMilestoneInput.trim()) {
                          setNewGoalMilestones([...newGoalMilestones, goalMilestoneInput.trim()]);
                          setGoalMilestoneInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#ded5c6] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (goalMilestoneInput.trim()) {
                        setNewGoalMilestones([...newGoalMilestones, goalMilestoneInput.trim()]);
                        setGoalMilestoneInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#f0e9dc] text-[#544a3c] text-xs font-semibold hover:bg-[#e4dcce]"
                  >
                    Add
                  </button>
                </div>

                {newGoalMilestones.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newGoalMilestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-[#faf7f0] border border-[#e8dfcf]">
                        <span>• {m}</span>
                        <button
                          type="button"
                          onClick={() => setNewGoalMilestones(newGoalMilestones.filter((_, idx) => idx !== i))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eee5d8]">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf7f0] text-xs font-medium text-[#685c4c] hover:bg-[#eee6d8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE NEW HABIT
         ───────────────────────────────────────────────────────────── */}
      {isAddHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#ded5c6] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#d9531e]" />
                <h3 className="font-serif font-bold text-base text-[#252e28]">
                  Create New Daily Habit
                </h3>
              </div>
              <button
                onClick={() => setIsAddHabitModalOpen(false)}
                className="p-1 rounded-lg text-[#7d7260] hover:bg-[#f3ede1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 minutes sunset walk"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Category
                  </label>
                  <select
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  >
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Writing">Writing</option>
                    <option value="Health">Health</option>
                    <option value="Focus">Focus</option>
                    <option value="Wellbeing">Wellbeing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Icon / Emoji
                  </label>
                  <select
                    value={newHabitIcon}
                    onChange={(e) => setNewHabitIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  >
                    <option value="🌿">🌿 Plant / Zen</option>
                    <option value="✨">✨ Sparkle</option>
                    <option value="🍵">🍵 Tea / Drink</option>
                    <option value="📖">📖 Reading</option>
                    <option value="🧘">🧘 Meditation</option>
                    <option value="🚶">🚶 Walk</option>
                    <option value="🌙">🌙 Sleep</option>
                    <option value="💧">💧 Water</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Frequency
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['daily', 'weekdays', 'weekly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setNewHabitFreq(freq)}
                      className={`py-2 rounded-xl capitalize font-medium border transition-all ${
                        newHabitFreq === freq
                          ? 'bg-[#4a6b5d] text-white border-[#4a6b5d] shadow-xs'
                          : 'bg-[#faf7f0] border-[#ded5c6] text-[#685c4c] hover:bg-[#eee6d8]'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#fbf5eb] border border-[#eedec7] text-[11px] text-[#735122] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#d9531e] shrink-0" />
                <span>
                  This habit will calculate an independent, mandatory habit streak every consecutive day you complete it!
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eee5d8]">
                <button
                  type="button"
                  onClick={() => setIsAddHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf7f0] text-xs font-medium text-[#685c4c] hover:bg-[#eee6d8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs cursor-pointer"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: GUEST MODE AUTHENTICATION PROMPT
         ───────────────────────────────────────────────────────────── */}
      {showGuestAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#ded5c6] p-6 shadow-2xl space-y-5">
            {/* Header & Close */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#fbebe3] text-[#b4481e] flex items-center justify-center shrink-0 border border-[#f5ccb9]">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#252e28]">
                    Account Required
                  </h3>
                  <p className="text-xs text-[#8c806f]">
                    Personal Goals, Habits & Habit Streaks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestAuthModal(false)}
                className="p-1 text-[#a89d8e] hover:text-[#252e28] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation & Value Props */}
            <div className="space-y-3 text-xs text-[#524637]">
              <p className="leading-relaxed">
                You are currently exploring in <strong>Guest Mode</strong>. To personalize your daily rituals, track habits, calculate consecutive streaks, and set goal milestones, please log in or sign up with your account.
              </p>

              <div className="p-3.5 rounded-2xl bg-[#faf7f0] border border-[#eee5d8] space-y-2">
                <div className="flex items-center gap-2 text-[#3e6351] font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#4a6b5d] shrink-0" />
                  <span>Your Dedicated & Private Cloud Sanctuary:</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-[#6b5f4e]">
                  <li>Personal habits with separate streaks</li>
                  <li>User-isolated Firestore persistence (no data overlap)</li>
                  <li>Goal roadmap milestones & progress tracking</li>
                  <li>Synched across all your devices securely</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGuestAuthModal(false);
                  if (onRequireLogin) onRequireLogin();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In or Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGuestAuthModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#faf7f0] hover:bg-[#eee6d8] text-xs font-medium text-[#685c4c] transition-all cursor-pointer"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
