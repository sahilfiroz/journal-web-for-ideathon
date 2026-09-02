import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Firestore,
  increment,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile, MoodType, GoalItem, HabitItem } from '../types';
import { PublicPost, initialPublicPosts } from '../data/publicPosts';

// 1. Initialize Firebase App (Singleton)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. Initialize Auth and Firestore with database ID from configuration
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Helper: Strip all undefined fields to guarantee zero Firestore driver crashes
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === undefined) return null;
    return value;
  }));
}

// ─── LOCAL VAULT FOR RESILIENT CREDENTIALS FALLBACK ───
interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

const VAULT_KEY = 'lumina_user_vault_v1';

function getLocalVault(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalVault(vault: Record<string, StoredAccount>): void {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Could not save to local vault:', err);
  }
}

// Simple deterministic hash for resilient offline verification
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}_${pass.length}`;
}

// ─── AUTHENTICATION SERVICES ───

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Try Firebase Authentication first
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let profile: UserProfile;
    if (userDoc.exists()) {
      const data = userDoc.data();
      profile = {
        id: user.uid,
        name: data.name || user.displayName || cleanEmail.split('@')[0],
        email: user.email || cleanEmail,
        isGuest: false,
        avatar: data.avatar || undefined,
        createdAt: data.createdAt || Date.now(),
      };
    } else {
      const displayName = user.displayName || cleanEmail.split('@')[0];
      profile = {
        id: user.uid,
        name: displayName,
        email: user.email || cleanEmail,
        isGuest: false,
        createdAt: Date.now(),
      };
      try {
        await setDoc(userDocRef, sanitizeForFirestore({
          ...profile,
          streakDays: 1,
          totalJournals: 0,
          updatedAt: Date.now(),
        }), { merge: true });
      } catch {
        // ignore Firestore permission if offline
      }
    }

    // Sync to local vault for backup
    const vault = getLocalVault();
    vault[cleanEmail] = {
      id: user.uid,
      email: cleanEmail,
      name: profile.name,
      passwordHash: hashPassword(password),
      createdAt: profile.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalVault(vault);

    return profile;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    
    // If Firebase Auth provider is disabled (auth/operation-not-allowed) or network offline:
    if (
      code === 'auth/operation-not-allowed' || 
      code === 'auth/admin-restricted-operation' ||
      code === 'auth/network-request-failed'
    ) {
      console.warn('Firebase Auth email provider not enabled; checking local sanctuary vault:', code);
      const vault = getLocalVault();
      const account = vault[cleanEmail];

      if (account) {
        if (account.passwordHash === hashPassword(password)) {
          const profile: UserProfile = {
            id: account.id,
            name: account.name,
            email: account.email,
            isGuest: false,
            createdAt: account.createdAt,
          };
          return profile;
        } else {
          const error = new Error('Invalid password for this email address.');
          (error as unknown as { code: string }).code = 'auth/wrong-password';
          throw error;
        }
      } else {
        // Auto-provision local account profile
        const newId = `usr_${Math.random().toString(36).substring(2, 10)}`;
        const name = cleanEmail.split('@')[0];
        const newAccount: StoredAccount = {
          id: newId,
          email: cleanEmail,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          passwordHash: hashPassword(password),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        vault[cleanEmail] = newAccount;
        saveLocalVault(vault);

        return {
          id: newId,
          name: newAccount.name,
          email: cleanEmail,
          isGuest: false,
          createdAt: newAccount.createdAt,
        };
      }
    }

    throw err;
  }
}

export async function signupWithEmail(email: string, password: string, name: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;
    
    if (cleanName) {
      try {
        await updateProfile(user, { displayName: cleanName });
      } catch {
        // ignore
      }
    }

    const profile: UserProfile = {
      id: user.uid,
      name: cleanName,
      email: user.email || cleanEmail,
      isGuest: false,
      createdAt: Date.now(),
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, sanitizeForFirestore({
        ...profile,
        streakDays: 1,
        totalJournals: 0,
        updatedAt: Date.now(),
      }), { merge: true });
    } catch {
      // ignore
    }

    // Save to local vault
    const vault = getLocalVault();
    vault[cleanEmail] = {
      id: user.uid,
      email: cleanEmail,
      name: cleanName,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalVault(vault);

    return profile;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';

    if (
      code === 'auth/operation-not-allowed' || 
      code === 'auth/admin-restricted-operation' ||
      code === 'auth/network-request-failed'
    ) {
      console.warn('Firebase Auth signup disabled in console; saving in local vault:', code);
      const vault = getLocalVault();
      const newId = `usr_${Math.random().toString(36).substring(2, 10)}`;
      const newAccount: StoredAccount = {
        id: newId,
        email: cleanEmail,
        name: cleanName,
        passwordHash: hashPassword(password),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      vault[cleanEmail] = newAccount;
      saveLocalVault(vault);

      return {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        isGuest: false,
        createdAt: newAccount.createdAt,
      };
    }

    throw err;
  }
}

export async function loginAsGuest(): Promise<UserProfile> {
  try {
    const cred = await signInAnonymously(auth);
    const user = cred.user;
    const profile: UserProfile = {
      id: user.uid,
      name: 'Guest Explorer',
      email: `guest_${user.uid.slice(0, 6)}@lumina.sanctuary`,
      isGuest: true,
      createdAt: Date.now(),
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, sanitizeForFirestore({
        ...profile,
        streakDays: 1,
        totalJournals: 0,
        updatedAt: Date.now(),
      }), { merge: true });
    } catch {
      // ignore
    }

    return profile;
  } catch (err) {
    console.warn('Anonymous auth notice:', err);
    return {
      id: `guest-${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@lumina.local',
      isGuest: true,
      createdAt: Date.now(),
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Logout error:', err);
  }
}

export async function resetPasswordWithEmail(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      const customErr = new Error('Email delivery is restricted in this project configuration. Please use the Instant Reset tab to set your new password directly.');
      (customErr as unknown as { code: string }).code = 'auth/operation-not-allowed';
      throw customErr;
    }
    throw err;
  }
}

export async function instantResetUserPassword(
  email: string,
  newPassword: string,
  userName?: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = userName?.trim() || cleanEmail.split('@')[0];

  // 1. Update in local sanctuary vault
  const vault = getLocalVault();
  const existing = vault[cleanEmail];
  const accountId = existing ? existing.id : `usr_${Math.random().toString(36).substring(2, 10)}`;
  
  const updatedAccount: StoredAccount = {
    id: accountId,
    email: cleanEmail,
    name: userName?.trim() || existing?.name || displayName,
    passwordHash: hashPassword(newPassword),
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  vault[cleanEmail] = updatedAccount;
  saveLocalVault(vault);

  const profile: UserProfile = {
    id: accountId,
    name: updatedAccount.name,
    email: cleanEmail,
    isGuest: false,
    createdAt: updatedAccount.createdAt,
  };

  // 2. Also try Firebase update if accessible
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, newPassword);
    const user = cred.user;
    if (userName && userName.trim()) {
      await updateProfile(user, { displayName: userName.trim() });
    }
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, sanitizeForFirestore({
      ...profile,
      id: user.uid,
      updatedAt: Date.now(),
    }), { merge: true });
    profile.id = user.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/email-already-in-use') {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, newPassword);
        profile.id = userCred.user.uid;
      } catch {
        // authenticated via vault
      }
    }
    // Any operation-not-allowed or network error is gracefully caught and handled via local vault
  }

  return profile;
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE USER JOURNALS CRUD ───

export function subscribeUserJournals(
  userId: string, 
  onSuccess: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};

  // Guard: If not signed into Firebase Auth or UID does not match, don't query Firestore to avoid permission error
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }

  const journalsRef = collection(db, 'users', userId, 'journals');
  const q = query(journalsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: JournalEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        title: data.title || '',
        content: data.content || '',
        date: data.date || new Date().toISOString().split('T')[0],
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        mood: (data.mood as MoodType) || 'peaceful',
        weather: data.weather || undefined,
        location: data.location || undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        photos: Array.isArray(data.photos) ? data.photos : [],
        aiReflection: data.aiReflection || undefined,
        wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
        readingTimeMinutes: typeof data.readingTimeMinutes === 'number' ? data.readingTimeMinutes : 1,
        bookmarked: Boolean(data.bookmarked),
        pinned: Boolean(data.pinned),
        themeColor: data.themeColor || undefined,
      });
    });
    onSuccess(list);
  }, (err) => {
    // Graceful handling for permission issues or offline state
    if (err.code === 'permission-denied') {
      console.info('Firestore subscription waiting for auth credentials.');
    } else {
      console.warn('Firestore subscribeUserJournals notice:', err.message || err);
    }
    if (onError) onError(err);
  });
}

export async function saveUserJournalToFirestore(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) return;
  // Guard: only write to Firestore if authenticated with matching user ID
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }

  try {
    const docRef = doc(db, 'users', userId, 'journals', entry.id);
    const cleanPayload = sanitizeForFirestore({
      ...entry,
      updatedAt: Date.now(),
    });

    await setDoc(docRef, cleanPayload, { merge: true });

    // Update user stats doc
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      lastJournalDate: entry.date,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore save journal notice:', err);
  }
}

export async function deleteUserJournalFromFirestore(userId: string, journalId: string): Promise<void> {
  if (!userId || !journalId) return;
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const docRef = doc(db, 'users', userId, 'journals', journalId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete journal notice:', err);
  }
}

// ─── FIRESTORE PUBLIC COMMUNITY POSTS ───

let hasSeededPublicPosts = false;

export function subscribePublicPosts(
  onSuccess: (posts: PublicPost[]) => void,
  onError?: (err: Error) => void
) {
  const postsRef = collection(db, 'public_journals');
  const q = query(postsRef, orderBy('createdAt', 'desc'));

  let hasDeliveredInitial = false;

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      if (!hasDeliveredInitial) {
        hasDeliveredInitial = true;
        onSuccess(initialPublicPosts);
      }
      seedDefaultPublicPosts();
      return;
    }

    const list: PublicPost[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        author: {
          name: data.author?.name || 'Mindful Author',
          handle: data.author?.handle || '@lumina',
          avatar: data.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        title: data.title || '',
        content: data.content || '',
        mood: data.mood || 'Peaceful',
        moodIcon: data.moodIcon || '🌿',
        tags: Array.isArray(data.tags) ? data.tags : ['Mindful'],
        likes: typeof data.likes === 'number' ? data.likes : 0,
        resonateCount: typeof data.resonateCount === 'number' ? data.resonateCount : 0,
        timeAgo: data.timeAgo || 'Recently',
        entryDate: data.entryDate || new Date(data.createdAt || Date.now()).toISOString().split('T')[0],
        entryDateLabel: data.entryDateLabel || "Today's Journal",
        writingTime: data.writingTime || new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        userId: data.userId || undefined,
        sourceJournalId: data.sourceJournalId || undefined,
        location: data.location || undefined,
        imageUrl: data.imageUrl || undefined,
        imageCaption: data.imageCaption || undefined,
        isLiked: false,
        isResonated: false,
      });
    });
    hasDeliveredInitial = true;
    onSuccess(list);
  }, (err) => {
    if (!hasDeliveredInitial) {
      hasDeliveredInitial = true;
      onSuccess(initialPublicPosts);
    }
    if (onError) onError(err);
  });
}

export async function createPublicPostInFirestore(post: PublicPost, userId?: string): Promise<void> {
  try {
    const docRef = doc(db, 'public_journals', post.id);
    const cleanPayload = sanitizeForFirestore({
      ...post,
      userId: userId || auth.currentUser?.uid || 'guest',
      createdAt: post.createdAt || Date.now(),
    });
    await setDoc(docRef, cleanPayload);
  } catch (err) {
    console.warn('Create public post notice:', err);
  }
}

export async function toggleLikePublicPostInFirestore(postId: string, delta: number): Promise<void> {
  try {
    const docRef = doc(db, 'public_journals', postId);
    await updateDoc(docRef, {
      likes: increment(delta),
    });
  } catch (err) {
    console.warn('Like increment notice:', err);
  }
}

export async function toggleResonatePublicPostInFirestore(postId: string, delta: number): Promise<void> {
  try {
    const docRef = doc(db, 'public_journals', postId);
    await updateDoc(docRef, {
      resonateCount: increment(delta),
    });
  } catch (err) {
    console.warn('Resonate increment notice:', err);
  }
}

async function seedDefaultPublicPosts() {
  if (hasSeededPublicPosts) return;
  hasSeededPublicPosts = true;
  try {
    const batch = writeBatch(db);
    for (let i = 0; i < initialPublicPosts.length; i++) {
      const p = initialPublicPosts[i];
      const docRef = doc(db, 'public_journals', p.id);
      batch.set(docRef, sanitizeForFirestore({
        ...p,
        createdAt: p.createdAt || (Date.now() - (i + 1) * 3600000),
      }), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Seeding default public posts notice:', err);
  }
}

// ─── FIRESTORE GOALS & HABITS CRUD ───

export function subscribeUserGoals(
  userId: string,
  onSuccess: (goals: GoalItem[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    onSuccess([]);
    return () => {};
  }
  const docRef = doc(db, 'users', userId, 'userData', 'goals');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data?.goals)) {
        onSuccess(data.goals as GoalItem[]);
        return;
      }
    }
    onSuccess([]);
  }, (err) => {
    if (err.code !== 'permission-denied') {
      console.warn('Firestore subscribeUserGoals notice:', err.message || err);
    }
    onSuccess([]);
    if (onError) onError(err);
  });
}

export function subscribeUserHabits(
  userId: string,
  onSuccess: (habits: HabitItem[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    onSuccess([]);
    return () => {};
  }
  const docRef = doc(db, 'users', userId, 'userData', 'habits');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data?.habits)) {
        onSuccess(data.habits as HabitItem[]);
        return;
      }
    }
    onSuccess([]);
  }, (err) => {
    if (err.code !== 'permission-denied') {
      console.warn('Firestore subscribeUserHabits notice:', err.message || err);
    }
    onSuccess([]);
    if (onError) onError(err);
  });
}

export async function saveUserGoalsToFirestore(userId: string, goals: GoalItem[]): Promise<void> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'userData', 'goals');
    await setDoc(docRef, sanitizeForFirestore({
      goals,
      updatedAt: Date.now(),
    }), { merge: true });
  } catch (err) {
    console.warn('Firestore save goals notice:', err);
  }
}

export async function saveUserHabitsToFirestore(userId: string, habits: HabitItem[]): Promise<void> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'userData', 'habits');
    await setDoc(docRef, sanitizeForFirestore({
      habits,
      updatedAt: Date.now(),
    }), { merge: true });
  } catch (err) {
    console.warn('Firestore save habits notice:', err);
  }
}

