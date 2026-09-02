import { JournalEntry, SyncConfig, SyncState, GoalItem, HabitItem } from '../types';

export function getUserStorageKey(prefix: string, userId?: string | null): string {
  if (!userId || userId === 'guest') {
    return `${prefix}_guest`;
  }
  return `${prefix}_${userId}`;
}

export function getLocalEntries(userId?: string | null): JournalEntry[] {
  if (!userId) return [];
  try {
    const key = getUserStorageKey('lumina_journal_entries', userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load local entries:', err);
  }
  return [];
}

export function saveLocalEntries(entries: JournalEntry[], userId?: string | null): void {
  if (!userId) return;
  try {
    const key = getUserStorageKey('lumina_journal_entries', userId);
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save local entries:', err);
  }
}

export function getUserGoals(userId?: string | null): GoalItem[] {
  if (!userId) return [];
  try {
    const key = getUserStorageKey('lumina_user_goals', userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load user goals:', err);
  }
  return [];
}

export function saveUserGoals(goals: GoalItem[], userId?: string | null): void {
  if (!userId) return;
  try {
    const key = getUserStorageKey('lumina_user_goals', userId);
    localStorage.setItem(key, JSON.stringify(goals));
  } catch (err) {
    console.warn('Failed to save user goals:', err);
  }
}

export function getUserHabits(userId?: string | null): HabitItem[] {
  if (!userId) return [];
  try {
    const key = getUserStorageKey('lumina_user_habits', userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load user habits:', err);
  }
  return [];
}

export function saveUserHabits(habits: HabitItem[], userId?: string | null): void {
  if (!userId) return;
  try {
    const key = getUserStorageKey('lumina_user_habits', userId);
    localStorage.setItem(key, JSON.stringify(habits));
  } catch (err) {
    console.warn('Failed to save user habits:', err);
  }
}

export function getSyncConfig(userId?: string | null): SyncConfig {
  const syncKey = getUserStorageKey('lumina_sync_config', userId);
  try {
    const raw = localStorage.getItem(syncKey);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load sync config:', err);
  }

  // Generate a random memorable default sync code if none
  const adjectives = ['VERDANT', 'SERENE', 'AURA', 'LUMEN', 'SOLACE'];
  const nouns = ['PAGODA', 'SANCTUARY', 'HORIZON', 'GROVE', 'VALLEY'];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const defaultCode = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${randomNum}`;

  const config: SyncConfig = {
    syncCode: defaultCode,
    deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    lastSyncTimestamp: null,
    autoSync: true,
  };
  saveSyncConfig(config, userId);
  return config;
}

export function saveSyncConfig(config: SyncConfig, userId?: string | null): void {
  const syncKey = getUserStorageKey('lumina_sync_config', userId);
  try {
    localStorage.setItem(syncKey, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save sync config:', err);
  }
}

export async function syncWithCloud(
  localEntries: JournalEntry[],
  syncCode: string,
  deviceName: string,
  userId?: string | null
): Promise<{ merged: JournalEntry[]; state: SyncState; lastSync: number }> {
  if (!syncCode || !syncCode.trim()) {
    return { merged: localEntries, state: 'idle', lastSync: Date.now() };
  }

  try {
    // 1. Pull current cloud vault
    const pullRes = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncCode }),
    });

    if (!pullRes.ok) {
      throw new Error(`Sync pull failed with status ${pullRes.status}`);
    }

    const pullData = await pullRes.json();
    const cloudEntries: JournalEntry[] = Array.isArray(pullData.entries) ? pullData.entries : [];

    // 2. Merge conflict resolution (latest updatedAt wins per entry id)
    const map = new Map<string, JournalEntry>();
    for (const e of localEntries) {
      if (e && e.id) map.set(e.id, e);
    }
    for (const c of cloudEntries) {
      if (c && c.id) {
        const local = map.get(c.id);
        if (!local || (c.updatedAt || 0) > (local.updatedAt || 0)) {
          map.set(c.id, c);
        }
      }
    }

    const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 3. Push merged state back to cloud
    const pushRes = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncCode,
        entries: merged,
        deviceName,
      }),
    });

    if (!pushRes.ok) {
      throw new Error(`Sync push failed with status ${pushRes.status}`);
    }

    const now = Date.now();
    if (userId) {
      saveLocalEntries(merged, userId);
    }

    return { merged, state: 'synced', lastSync: now };
  } catch (err) {
    console.error('Cloud sync error:', err);
    return { merged: localEntries, state: 'error', lastSync: Date.now() };
  }
}

export function exportJournalsAsJSON(entries: JournalEntry[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `lumina-journal-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportJournalsAsMarkdown(entries: JournalEntry[]): void {
  let md = `# Lumina Journal Archive\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

  for (const e of entries) {
    md += `## ${e.title || 'Untitled Reflection'}\n`;
    md += `**Date:** ${e.date} | **Mood:** ${e.mood} | **Words:** ${e.wordCount}\n`;
    if (e.location) md += `**Location:** ${e.location}\n`;
    if (e.tags.length) md += `**Tags:** ${e.tags.map(t => `#${t}`).join(' ')}\n`;
    md += `\n${e.content}\n\n`;
    if (e.aiReflection) {
      md += `> *Reflection Note:* ${e.aiReflection}\n\n`;
    }
    if (e.photos && e.photos.length > 0) {
      md += `*Attached Photos (${e.photos.length})*\n`;
      for (const p of e.photos) {
        if (p.caption) md += `- [Photo] *${p.caption}*\n`;
      }
      md += '\n';
    }
    md += `---\n\n`;
  }

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `lumina-journal-export-${new Date().toISOString().split('T')[0]}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
