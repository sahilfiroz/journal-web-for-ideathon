import { JournalEntry } from '../types';

export interface StreakInfo {
  streakDays: number;
  hasWrittenToday: boolean;
  uniqueDaysCount: number;
  activeStreakDates: string[]; // List of YYYY-MM-DD that form the streak
  lastJournalDate: string | null;
}

/**
 * Calculates the exact consecutive day streak directly from the user's journal entries in My Journals.
 *
 * Rules:
 * 1. Collect all unique dates (YYYY-MM-DD) from the given journal entries.
 * 2. If today has at least one journal entry:
 *    - Streak starts from today (count = 1).
 *    - Checks backwards day-by-day (yesterday, 2 days ago, etc.) as long as an entry exists on that date.
 * 3. If today does NOT have a journal entry yet:
 *    - Checks if yesterday has an entry. If yes, streak starts from yesterday (count = 1, 2, 3...)
 *      so the user's streak remains active until the day ends.
 *    - If yesterday has no entry either, current active streak is 0.
 * 4. Streak count matches the exact number of consecutive days with journal entries in My Journals.
 */
export function calculateStreakFromEntries(entries: JournalEntry[]): StreakInfo {
  if (!entries || entries.length === 0) {
    return {
      streakDays: 0,
      hasWrittenToday: false,
      uniqueDaysCount: 0,
      activeStreakDates: [],
      lastJournalDate: null,
    };
  }

  // Extract normalized YYYY-MM-DD date strings
  const dateSet = new Set<string>();
  entries.forEach((entry) => {
    if (entry.date) {
      const normalized = entry.date.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        dateSet.add(normalized);
      }
    }
  });

  const uniqueDaysCount = dateSet.size;
  if (uniqueDaysCount === 0) {
    return {
      streakDays: 0,
      hasWrittenToday: false,
      uniqueDaysCount: 0,
      activeStreakDates: [],
      lastJournalDate: null,
    };
  }

  // Sorted list of unique dates descending (latest first)
  const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  const lastJournalDate = sortedDates[0] || null;

  // Local dates for today and yesterday
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = formatLocalDate(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterdayDate);

  const hasWrittenToday = dateSet.has(todayStr);

  let checkDate = new Date(now);

  // If not written today, check if yesterday was written
  if (!hasWrittenToday) {
    if (!dateSet.has(yesterdayStr)) {
      // No entry today and no entry yesterday -> streak is 0
      return {
        streakDays: 0,
        hasWrittenToday: false,
        uniqueDaysCount,
        activeStreakDates: [],
        lastJournalDate,
      };
    }
    // Start counting backwards from yesterday
    checkDate = yesterdayDate;
  }

  let streak = 0;
  const activeStreakDates: string[] = [];

  while (true) {
    const checkStr = formatLocalDate(checkDate);
    if (dateSet.has(checkStr)) {
      streak += 1;
      activeStreakDates.push(checkStr);
      // step back 1 day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streakDays: streak,
    hasWrittenToday,
    uniqueDaysCount,
    activeStreakDates,
    lastJournalDate,
  };
}
