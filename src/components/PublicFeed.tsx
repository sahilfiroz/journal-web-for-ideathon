import React, { useState, useEffect } from 'react';
import { PublicPost, initialPublicPosts } from '../data/publicPosts';
import { JournalEntry, MoodType } from '../types';
import { 
  Heart, 
  Share2, 
  Sparkles, 
  Tag, 
  Globe, 
  MapPin, 
  Check, 
  Plus, 
  Maximize2, 
  Minimize2, 
  X, 
  Send,
  Calendar,
  Clock,
  BookOpen,
  Image as ImageIcon,
  User,
  Flame,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { FeatureInfo } from './FeatureInfo';
import { 
  subscribePublicPosts, 
  createPublicPostInFirestore, 
  toggleLikePublicPostInFirestore, 
  toggleResonatePublicPostInFirestore,
  auth
} from '../services/firebase';

interface PublicFeedProps {
  entries?: JournalEntry[];
  onOpenWriter?: (draft?: { title: string; content: string; mood: MoodType; date?: string }) => void;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export const PublicFeed: React.FC<PublicFeedProps> = ({
  entries = [],
  onOpenWriter,
  userId,
  userName = 'Mindful Author',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
}) => {
  const [posts, setPosts] = useState<PublicPost[]>(initialPublicPosts);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPickFromMyJournalsOpen, setIsPickFromMyJournalsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my_posts' | 'today' | 'yesterday'>('all');
  const [selectedPostForReading, setSelectedPostForReading] = useState<PublicPost | null>(null);

  // Form State for creating a post
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('Peaceful');
  const [newMoodIcon, setNewMoodIcon] = useState('🌿');
  const [newDateType, setNewDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [writingTime, setWritingTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [newLocation, setNewLocation] = useState('');
  const [newTag, setNewTag] = useState('Community');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Subscribe to real-time Firestore public posts
  useEffect(() => {
    const unsubscribe = subscribePublicPosts((fetchedPosts) => {
      if (fetchedPosts && fetchedPosts.length > 0) {
        setPosts((prev) => {
          // Preserve local like/resonate states if toggled in this session
          const merged = fetchedPosts.map((fp) => {
            const existing = prev.find((p) => p.id === fp.id);
            if (existing) {
              return {
                ...fp,
                isLiked: existing.isLiked,
                isResonated: existing.isResonated,
              };
            }
            return fp;
          });

          // Sort strictly newest first
          return merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const moodChoices = [
    { label: 'Peaceful', icon: '🌿' },
    { label: 'Grateful', icon: '✨' },
    { label: 'Inspired', icon: '💡' },
    { label: 'Quiet', icon: '🌙' },
    { label: 'Energized', icon: '☀️' },
    { label: 'Reflective', icon: '🍃' },
  ];

  const handleToggleLike = (id: string) => {
    let delta = 0;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isLiked = !p.isLiked;
          delta = isLiked ? 1 : -1;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );

    if (delta !== 0) {
      toggleLikePublicPostInFirestore(id, delta);
    }
  };

  const handleToggleResonate = (id: string) => {
    let delta = 0;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isResonated = !p.isResonated;
          delta = isResonated ? 1 : -1;
          return {
            ...p,
            isResonated,
            resonateCount: isResonated ? p.resonateCount + 1 : Math.max(0, p.resonateCount - 1),
          };
        }
        return p;
      })
    );

    if (delta !== 0) {
      toggleResonatePublicPostInFirestore(id, delta);
    }
  };

  const handleCopyLink = (id: string) => {
    setCopiedId(id);
    navigator.clipboard?.writeText?.(window.location.href);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format entry date and label
  const getSelectedDateInfo = () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    if (newDateType === 'today') {
      return {
        dateStr: today.toISOString().split('T')[0],
        label: "Today's Journal",
      };
    }
    if (newDateType === 'yesterday') {
      return {
        dateStr: yesterday.toISOString().split('T')[0],
        label: "Yesterday's Journal",
      };
    }
    return {
      dateStr: customDate,
      label: new Date(customDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const currentUserId = userId || auth.currentUser?.uid || 'user-me';
    const currentUserName = userName || auth.currentUser?.displayName || 'Sahil Firoz';
    const currentUserHandle = auth.currentUser?.email
      ? `@${auth.currentUser.email.split('@')[0]}`
      : '@sahil';

    const { dateStr, label } = getSelectedDateInfo();

    const createdPost: PublicPost = {
      id: `post-${Date.now()}`,
      author: {
        name: currentUserName,
        handle: currentUserHandle,
        avatar: userAvatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      title: newTitle.trim() || `${label} Reflection`,
      content: newContent.trim(),
      mood: newMood,
      moodIcon: newMoodIcon,
      tags: [newTag.trim() || 'Mindful', 'Community'],
      likes: 1,
      resonateCount: 1,
      timeAgo: 'Just now',
      entryDate: dateStr,
      entryDateLabel: label,
      writingTime: writingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      userId: currentUserId,
      location: newLocation.trim() || undefined,
      imageUrl: newImageUrl.trim() || undefined,
      isLiked: true,
      isResonated: false,
    };

    // Place immediately AT THE TOP
    setPosts([createdPost, ...posts]);
    createPublicPostInFirestore(createdPost, currentUserId);

    setNewTitle('');
    setNewContent('');
    setNewLocation('');
    setNewImageUrl('');
    setIsCreateModalOpen(false);
  };

  // Publish directly from My Journals
  const handlePublishExistingJournal = (entry: JournalEntry) => {
    const currentUserId = userId || auth.currentUser?.uid || 'user-me';
    const currentUserName = userName || auth.currentUser?.displayName || 'Sahil Firoz';
    const currentUserHandle = auth.currentUser?.email
      ? `@${auth.currentUser.email.split('@')[0]}`
      : '@sahil';

    const entryDate = new Date(entry.date);
    const today = new Date();
    const isToday = entryDate.toDateString() === today.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === entryDate.toDateString();

    let dateLabel = entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (isToday) dateLabel = "Today's Journal";
    else if (isYesterday) dateLabel = "Yesterday's Journal";

    const createdPost: PublicPost = {
      id: `post-${Date.now()}`,
      author: {
        name: currentUserName,
        handle: currentUserHandle,
        avatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      title: entry.title,
      content: entry.content,
      mood: entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1),
      moodIcon: entry.mood === 'peaceful' ? '🌿' : entry.mood === 'grateful' ? '✨' : entry.mood === 'energized' ? '☀️' : '🌙',
      tags: entry.tags && entry.tags.length > 0 ? entry.tags : ['MyJournal', 'Mindful'],
      likes: 1,
      resonateCount: 1,
      timeAgo: 'Just now',
      entryDate: entry.date,
      entryDateLabel: dateLabel,
      writingTime: new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      userId: currentUserId,
      sourceJournalId: entry.id,
      imageUrl: entry.photos && entry.photos.length > 0 ? entry.photos[0].url : undefined,
      imageCaption: entry.photos && entry.photos.length > 0 ? entry.photos[0].caption : undefined,
      isLiked: true,
      isResonated: false,
    };

    setPosts([createdPost, ...posts]);
    createPublicPostInFirestore(createdPost, currentUserId);
    setIsPickFromMyJournalsOpen(false);
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter((post) => {
    const currentUserId = userId || auth.currentUser?.uid;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (activeTab === 'my_posts') {
      return (
        post.userId === currentUserId ||
        post.author.handle === `@${auth.currentUser?.email?.split('@')[0]}` ||
        post.author.name === userName
      );
    }
    if (activeTab === 'today') {
      return post.entryDate === todayStr || post.entryDateLabel?.includes('Today');
    }
    if (activeTab === 'yesterday') {
      return (
        post.entryDate === yesterdayStr ||
        post.entryDateLabel?.includes('Yesterday') ||
        (post.entryDate && post.entryDate < todayStr)
      );
    }
    return true;
  });

  // Reusable Post Card
  const renderPostCard = (post: PublicPost) => {
    const isMine =
      post.userId === (userId || auth.currentUser?.uid) ||
      post.author.name === userName;

    return (
      <article
        key={post.id}
        className="group rounded-2xl bg-white border border-[#e2d8c8] hover:border-[#4a6b5d]/60 hover:shadow-sm transition-all p-4 sm:p-5 space-y-3.5"
      >
        {/* Author & Header Metadata */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover border border-[#ded5c6] shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-[#242c27]">
                  {post.author.name}
                </span>
                <span className="text-[10px] text-[#938776]">{post.author.handle}</span>
                {isMine && (
                  <span className="px-1.5 py-0.2 rounded-md bg-[#edf5f0] text-[#3e6351] text-[9px] font-bold border border-[#cfe0d6]">
                    You
                  </span>
                )}
              </div>

              {/* Exact Journal Date & Writing Time */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#8e8271] mt-0.5 flex-wrap">
                {post.entryDateLabel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fdf8ec] text-[#8b6f27] font-semibold border border-[#ebe0be] text-[10px]">
                    <Calendar className="w-2.5 h-2.5" />
                    {post.entryDateLabel}
                  </span>
                )}
                {post.writingTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#786c5c]">
                    <Clock className="w-2.5 h-2.5 text-[#a89d8d]" />
                    {post.writingTime}
                  </span>
                )}
                <span>•</span>
                <span className="text-[10px] text-[#9c9181]">{post.timeAgo}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-[#b07d62]">
                      <MapPin className="w-2.5 h-2.5" />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mood Pill */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#edf5f0] border border-[#cfe0d6] text-xs font-medium text-[#3e6351] shrink-0">
            <span>{post.moodIcon}</span>
            <span className="hidden sm:inline">{post.mood}</span>
          </span>
        </div>

        {/* Post Title & Text */}
        <div className="space-y-1.5">
          <h3
            onClick={() => setSelectedPostForReading(post)}
            className="font-serif font-bold text-base text-[#242c27] leading-snug hover:text-[#4a6b5d] cursor-pointer transition-colors"
          >
            {post.title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#47534c] leading-relaxed font-reading whitespace-pre-wrap line-clamp-4">
            {post.content}
          </p>
        </div>

        {/* Attached Photo if present */}
        {post.imageUrl && (
          <div className="relative p-2 bg-[#fdfbf7] border border-[#ded5c6] rounded-xl shadow-2xs max-w-md">
            <img
              src={post.imageUrl}
              alt={post.imageCaption || 'Post attachment'}
              className="w-full h-44 sm:h-52 object-cover rounded-lg"
            />
            {post.imageCaption && (
              <p className="text-xs font-handwriting text-center text-[#7e7362] mt-1.5">
                {post.imageCaption}
              </p>
            )}
          </div>
        )}

        {/* Tags Row */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf7f0] border border-[#e5dccd] text-[10px] text-[#716552]"
              >
                <Tag className="w-2.5 h-2.5" />
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-2.5 border-t border-[#f2ebe0] flex items-center justify-between text-xs text-[#7d7160]">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              type="button"
              onClick={() => handleToggleLike(post.id)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors ${
                post.isLiked
                  ? 'text-rose-600 font-semibold bg-rose-50 border border-rose-200'
                  : 'hover:text-rose-600 hover:bg-[#faf5ee]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </button>

            {/* Resonate */}
            <button
              type="button"
              onClick={() => handleToggleResonate(post.id)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors ${
                post.isResonated
                  ? 'text-[#b47a1e] font-semibold bg-[#fdf8ec] border border-[#ebdcb8]'
                  : 'hover:text-[#b47a1e] hover:bg-[#faf5ee]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{post.resonateCount} resonate</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedPostForReading(post)}
              className="text-[11px] text-[#4a6b5d] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Read Entry</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>

            {/* Share / Copy */}
            <button
              type="button"
              onClick={() => handleCopyLink(post.id)}
              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-[#f5efe4] text-[#8c806f] transition-colors"
              title="Copy Link"
            >
              {copiedId === post.id ? (
                <span className="text-[11px] text-[#4a6b5d] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Copied
                </span>
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          HEADER BAR: Public Feed Title + Composer & Fullscreen Controls
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e6ded4]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#eef4f0] text-[#4a6b5d] flex items-center justify-center shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg font-bold text-[#242c27]">
                Public Journals
              </h2>
              <FeatureInfo featureId="publicFeed" size="xs" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#edf5f0] text-[#3e6351] font-semibold border border-[#cfe0d6]">
                Community Post Feed
              </span>
            </div>
            <p className="text-[11px] text-[#867b6c]">
              Real-time journals from mindful minds • Post today's, yesterday's or past entries
            </p>
          </div>
        </div>

        {/* Opposite Controls: Share/Post Buttons & Full Screen */}
        <div className="flex items-center gap-2">
          {/* Pick from My Journals Button */}
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPickFromMyJournalsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd5c5] text-xs font-semibold text-[#544a3c] hover:bg-[#faf7f0] transition-colors shadow-2xs"
              title="Publish one of your private journals to public"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#b45309]" />
              <span>Share My Journal</span>
            </button>
          )}

          {/* Plus Icon: Create/Upload Public Journal Post */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#395447] transition-colors shadow-xs"
            title="Create and publish a journal post"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl bg-white border border-[#ded5c6] text-[#7d7160] hover:text-[#252e28] hover:bg-[#faf7f0] transition-colors shadow-2xs"
            title={isFullScreen ? 'Exit Full Screen' : 'View Full Screen Feed'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          POST COMPOSER STRIP (Prominent Real Post Section Box)
         ───────────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#faf7f0] via-[#f5efe4] to-[#f0e9dc] border border-[#ded5c6] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <img
            src={userAvatar}
            alt="User"
            className="w-8 h-8 rounded-full object-cover border border-[#ded5c6]"
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 text-left px-4 py-2 rounded-xl bg-white border border-[#ded5c6] text-xs text-[#8c806f] hover:border-[#4a6b5d] hover:text-[#252e28] transition-all shadow-2xs flex items-center justify-between"
          >
            <span>Share your today's or yesterday's journal with the community...</span>
            <Sparkles className="w-3.5 h-3.5 text-[#4a6b5d]" />
          </button>
        </div>

        {/* Quick Date Chips */}
        <div className="mt-2.5 pt-2 border-t border-[#e8dfcf] flex items-center justify-between gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#867b6c] font-medium">Post as:</span>
            <button
              onClick={() => {
                setNewDateType('today');
                setIsCreateModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-md bg-white border border-[#dfd5c5] text-[#544a3c] hover:bg-[#edf5f0] text-[10px] font-semibold"
            >
              📅 Today's Journal
            </button>
            <button
              onClick={() => {
                setNewDateType('yesterday');
                setIsCreateModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-md bg-white border border-[#dfd5c5] text-[#544a3c] hover:bg-[#edf5f0] text-[10px] font-semibold"
            >
              ⏳ Yesterday's Journal
            </button>
            <button
              onClick={() => {
                setNewDateType('custom');
                setIsCreateModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-md bg-white border border-[#dfd5c5] text-[#544a3c] hover:bg-[#edf5f0] text-[10px] font-semibold"
            >
              🗓️ Other Date & Time
            </button>
          </div>

          <span className="text-[10px] text-[#938573] italic">
            *Date & writing time will show with your post at the top
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FEED TABS: All Posts / My Published / Today / Yesterday
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#eee5d8] overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-[#4a6b5d] text-white shadow-xs'
                : 'text-[#6b604f] hover:bg-[#f3ede1]'
            }`}
          >
            🌍 All Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('my_posts')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'my_posts'
                ? 'bg-[#4a6b5d] text-white shadow-xs'
                : 'text-[#6b604f] hover:bg-[#f3ede1]'
            }`}
          >
            👤 My Published Journals
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'today'
                ? 'bg-[#4a6b5d] text-white shadow-xs'
                : 'text-[#6b604f] hover:bg-[#f3ede1]'
            }`}
          >
            📅 Today's
          </button>
          <button
            onClick={() => setActiveTab('yesterday')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'yesterday'
                ? 'bg-[#4a6b5d] text-white shadow-xs'
                : 'text-[#6b604f] hover:bg-[#f3ede1]'
            }`}
          >
            ⏳ Yesterday & Past
          </button>
        </div>

        <span className="text-[10px] text-[#8e8271] shrink-0 font-medium">
          {filteredPosts.length} posts
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN POSTS LIST (Newest Posts Always Top)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#ded5c6] space-y-3">
            <BookOpen className="w-8 h-8 text-[#8c806f] mx-auto opacity-60" />
            <p className="text-xs text-[#6e6352] font-medium">
              No journals found in this category yet.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs"
            >
              Post First Journal
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => renderPostCard(post))
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE & PUBLISH JOURNAL POST
         ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ded5c6] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#4a6b5d]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#252e28]">
                    Publish Journal to Community
                  </h3>
                  <p className="text-[11px] text-[#7d7260]">
                    Your post will appear immediately at the top of the Public feed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7d7260] hover:bg-[#f3ede1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="space-y-3.5">
              {/* Date & Writing Time Controls */}
              <div className="p-3 rounded-xl bg-[#faf7f0] border border-[#ded5c6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#544a3c] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#b45309]" />
                    <span>Journal Entry Date & Time</span>
                  </label>
                  <span className="text-[10px] text-[#8c806f]">Mandatory Post Time</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewDateType('today')}
                    className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                      newDateType === 'today'
                        ? 'bg-[#4a6b5d] text-white border-[#4a6b5d] shadow-xs'
                        : 'bg-white border-[#ded5c6] text-[#635745] hover:bg-[#eee6d8]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDateType('yesterday')}
                    className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                      newDateType === 'yesterday'
                        ? 'bg-[#4a6b5d] text-white border-[#4a6b5d] shadow-xs'
                        : 'bg-white border-[#ded5c6] text-[#635745] hover:bg-[#eee6d8]'
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDateType('custom')}
                    className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                      newDateType === 'custom'
                        ? 'bg-[#4a6b5d] text-white border-[#4a6b5d] shadow-xs'
                        : 'bg-white border-[#ded5c6] text-[#635745] hover:bg-[#eee6d8]'
                    }`}
                  >
                    Pick Date
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {newDateType === 'custom' && (
                    <div>
                      <label className="block text-[10px] font-medium text-[#7d7160] mb-0.5">
                        Selected Date:
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#ded5c6] text-xs text-[#252e28]"
                      />
                    </div>
                  )}
                  <div className={newDateType !== 'custom' ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-medium text-[#7d7160] mb-0.5">
                      Writing Time:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={writingTime}
                      onChange={(e) => setWritingTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#ded5c6] text-xs text-[#252e28]"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Journal Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walking under the morning mist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Journal Thoughts & Narrative *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="What thoughts or experiences unfolded during this day? Express freely..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs sm:text-sm text-[#252e28] font-reading leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
                />
              </div>

              {/* Mood Choices */}
              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Mood
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {moodChoices.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => {
                        setNewMood(m.label);
                        setNewMoodIcon(m.icon);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        newMood === m.label
                          ? 'bg-[#edf5f0] text-[#3e6351] border-[#cfe0d6] font-bold shadow-xs'
                          : 'bg-[#faf7f0] border-[#ded5c6] text-[#635745] hover:bg-[#eee6d8]'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Image URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kyoto Garden"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                    Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mindfulness"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#544a3c] mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#ded5c6] text-xs text-[#252e28]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#eee5d8]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf7f0] text-xs font-medium text-[#685c4c] hover:bg-[#eee6d8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Top of Feed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PICK FROM MY JOURNALS TO PUBLISH
         ───────────────────────────────────────────────────────────── */}
      {isPickFromMyJournalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ded5c6] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee5d8]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#b45309]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#252e28]">
                    Share From My Journals
                  </h3>
                  <p className="text-[11px] text-[#7d7260]">
                    Select any personal entry to post immediately to the public feed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPickFromMyJournalsOpen(false)}
                className="p-1.5 rounded-lg text-[#7d7260] hover:bg-[#f3ede1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {entries.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8c806f]">
                  No private journals created yet.
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#ded5c6] hover:border-[#4a6b5d] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-[#8c806f] mb-0.5">
                        <span>{entry.date}</span>
                        <span>•</span>
                        <span className="capitalize">{entry.mood}</span>
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#252e28] truncate">
                        {entry.title}
                      </h4>
                      <p className="text-xs text-[#635745] line-clamp-1 mt-0.5">
                        {entry.content}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePublishExistingJournal(entry)}
                      className="px-3 py-1.5 rounded-lg bg-[#4a6b5d] text-white text-xs font-semibold hover:bg-[#3d594d] transition-colors shadow-2xs shrink-0"
                    >
                      Post to Feed
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#eee5d8] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPickFromMyJournalsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#faf7f0] text-xs font-medium text-[#685c4c]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: FULL READING ENTRY MODAL
         ───────────────────────────────────────────────────────────── */}
      {selectedPostForReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl border border-[#ded5c6] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#eee5d8]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPostForReading.author.avatar}
                  alt={selectedPostForReading.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#ded5c6]"
                />
                <div>
                  <h4 className="font-semibold text-sm text-[#252e28]">
                    {selectedPostForReading.author.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#8e8271]">
                    <span>{selectedPostForReading.entryDateLabel || selectedPostForReading.entryDate}</span>
                    <span>•</span>
                    <span>{selectedPostForReading.writingTime}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPostForReading(null)}
                className="p-1.5 rounded-lg text-[#7d7260] hover:bg-[#f3ede1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-[#252e28]">
              {selectedPostForReading.title}
            </h3>

            <div className="text-sm text-[#433b31] font-reading leading-relaxed whitespace-pre-wrap">
              {selectedPostForReading.content}
            </div>

            {selectedPostForReading.imageUrl && (
              <img
                src={selectedPostForReading.imageUrl}
                alt="Attachment"
                className="w-full h-64 object-cover rounded-xl border border-[#ded5c6]"
              />
            )}

            <div className="pt-3 border-t border-[#eee5d8] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleToggleLike(selectedPostForReading.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedPostForReading.isLiked
                    ? 'text-rose-600 font-semibold bg-rose-50 border-rose-200'
                    : 'bg-[#faf7f0] border-[#ded5c6] hover:bg-rose-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${selectedPostForReading.isLiked ? 'fill-current' : ''}`} />
                <span>{selectedPostForReading.likes} Likes</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPostForReading(null)}
                className="px-4 py-1.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FULL SCREEN OVERLAY IF EXPANDED
         ───────────────────────────────────────────────────────────── */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-[#f7f4ed] flex flex-col p-4 sm:p-8 animate-in fade-in overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5dccd] max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#4a6b5d]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242c27]">
                Public Mindful Post Gallery
              </h2>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 rounded-xl bg-white border border-[#ded5c6] text-[#7d7160] hover:bg-[#eee6d8]"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl mx-auto w-full flex-1 overflow-y-auto py-6 space-y-4 pr-2">
            {filteredPosts.map((post) => renderPostCard(post))}
          </div>
        </div>
      )}
    </div>
  );
};
