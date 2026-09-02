import { JournalEntry } from '../types';

export const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-seed-today',
    title: 'Evening Coastal Wind & Ocean Horizon',
    content: `Walked out towards the headland just as twilight began to spill shades of amber and periwinkle across the water. The salt breeze cleared away the residual fog of the day.

Grateful for good health, long horizons, and the quiet courage to begin anew whenever needed.`,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
    mood: 'grateful',
    weather: 'Coastal Breeze, 15°C',
    location: 'Sunset Headland',
    tags: ['Nature', 'Gratitude', 'Horizon'],
    photos: [
      {
        id: 'photo-4',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        caption: 'Dusk over the tide pools',
        timestamp: Date.now() - 1000 * 60 * 60 * 4,
        rotationDeg: 2,
        filter: 'fade'
      }
    ],
    aiReflection: 'Nature reconnects us with deep perspective and quiet gratitude.',
    wordCount: 46,
    readingTimeMinutes: 1,
    bookmarked: true,
    pinned: false,
    themeColor: '#4f772d'
  },
  {
    id: 'entry-seed-yesterday',
    title: 'Studio Explorations & Tactile Papercraft',
    content: `Spent three uninterrupted hours organizing tactile swatches, fountain pens, and sketches. There's a particular quiet joy in working with uncoated cotton paper and raw linen bindings.

When the digital world feels noisy, making something physical grounds the spirit. Reconnected with an old architectural draft.`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    mood: 'inspired',
    weather: 'Soft Overcast, 16°C',
    location: 'Design Atelier',
    tags: ['Craft', 'Creativity', 'Tactile'],
    photos: [
      {
        id: 'photo-2',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        caption: 'Handbound journal drafts and fountain ink',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
        rotationDeg: 3,
        filter: 'vintage'
      }
    ],
    aiReflection: 'Cultivating tactile focus serves as a healthy antidote to digital fatigue.',
    wordCount: 54,
    readingTimeMinutes: 1,
    bookmarked: false,
    pinned: false,
    themeColor: '#b07d62'
  },
  {
    id: 'entry-seed-daybefore',
    title: 'Morning Sunbeam & Cedar Brew',
    content: `The light filtered through the blinds in diagonal golden slats this morning, catching the steam rising from the ceramic mug. I sat on the porch with no notifications, just the rustle of dry aspen leaves.

It felt like the first time in weeks where time wasn't rushing. A quiet reminder that ordinary mornings hold the most profound beauty.`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    mood: 'peaceful',
    weather: 'Sunny & Crisp, 18°C',
    location: 'Verdant Porch',
    tags: ['Morning Ritual', 'Mindfulness', 'Coffee'],
    photos: [
      {
        id: 'photo-1',
        url: 'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?auto=format&fit=crop&w=800&q=80',
        caption: 'Morning light in the courtyard',
        timestamp: Date.now() - 1000 * 60 * 60 * 48,
        rotationDeg: -2,
        filter: 'warm'
      }
    ],
    aiReflection: 'A grounding practice in savoring stillness and sensory presence.',
    wordCount: 58,
    readingTimeMinutes: 1,
    bookmarked: true,
    pinned: false,
    themeColor: '#708238'
  },
  {
    id: 'entry-seed-3daysago',
    title: 'Rain on Cedar Shingles & Silent Book Reading',
    content: `Rain came down in steady, rhythmic sheets all afternoon. Listened to the water trickling into the rain barrel while reading a book on Japanese aesthetics (Wabi-Sabi).

Finding peace in the incomplete, impermanent, and modest.`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().split('T')[0],
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    mood: 'reflective',
    weather: 'Gentle Rain, 14°C',
    location: 'Reading Nook',
    tags: ['RainyDays', 'Aesthetics', 'Books'],
    photos: [],
    aiReflection: 'Acceptance of simplicity and imperfection brings deep mental quietude.',
    wordCount: 42,
    readingTimeMinutes: 1,
    bookmarked: false,
    pinned: false,
    themeColor: '#485b73'
  }
];
