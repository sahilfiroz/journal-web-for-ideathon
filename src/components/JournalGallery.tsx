import React, { useState } from 'react';
import { JournalEntry, JournalPhoto } from '../types';
import { Image as ImageIcon, Calendar, BookOpen, X, Sparkles } from 'lucide-react';

interface JournalGalleryProps {
  entries: JournalEntry[];
  onOpenEntry: (entryId: string) => void;
  onOpenWriter: () => void;
}

interface PhotoCardItem {
  photo: JournalPhoto;
  entryId: string;
  entryTitle: string;
  date: string;
  mood: string;
}

export const JournalGallery: React.FC<JournalGalleryProps> = ({
  entries,
  onOpenEntry,
  onOpenWriter,
}) => {
  const [selectedItem, setSelectedItem] = useState<PhotoCardItem | null>(null);

  // Flatten all photos
  const allPhotos: PhotoCardItem[] = [];
  entries.forEach((e) => {
    e.photos.forEach((p) => {
      allPhotos.push({
        photo: p,
        entryId: e.id,
        entryTitle: e.title || 'Untitled Reflection',
        date: e.date,
        mood: e.mood,
      });
    });
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-white border border-[#e2d9cd] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#232b26]">
            Memory Keepsakes & Polaroid Wall
          </h2>
          <p className="mt-1 text-xs text-[#786e5e]">
            {allPhotos.length} visual moments preserved in your journal sanctuary
          </p>
        </div>

        <button
          onClick={onOpenWriter}
          className="px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3b574a] transition-colors shadow-xs"
        >
          Add New Memory
        </button>
      </div>

      {/* Polaroid Gallery Grid */}
      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allPhotos.map((item, idx) => {
            const rot = item.photo.rotationDeg || (idx % 3 === 0 ? -1.5 : idx % 3 === 1 ? 1.5 : 0);
            return (
              <div
                key={item.photo.id || idx}
                onClick={() => setSelectedItem(item)}
                className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-20"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                {/* Washi Tape Accent */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-[#e5dbc9]/90 border-y border-[#d0c4b0] shadow-xs rotate-1 z-10" />

                {/* Polaroid Frame */}
                <div className="p-3 pb-4 bg-white rounded-md shadow-md border border-[#dfd5c5] paper-texture flex flex-col justify-between h-full">
                  <div className="relative aspect-square overflow-hidden rounded-xs bg-[#f2ecdc]">
                    <img
                      src={item.photo.url}
                      alt={item.photo.caption || 'Memory'}
                      className={`w-full h-full object-cover transition-all ${
                        item.photo.filter === 'vintage'
                          ? 'sepia-[0.35] contrast-105'
                          : item.photo.filter === 'warm'
                          ? 'hue-rotate-15 contrast-105'
                          : item.photo.filter === 'noir'
                          ? 'grayscale contrast-125'
                          : item.photo.filter === 'fade'
                          ? 'contrast-90 brightness-105'
                          : ''
                      }`}
                    />
                  </div>

                  <div className="mt-2.5">
                    <p className="text-center text-xs font-serif italic text-[#4a4133] line-clamp-1">
                      {item.photo.caption ? `"${item.photo.caption}"` : item.entryTitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#938776] px-1">
                      <span>{item.date}</span>
                      <span className="capitalize">{item.mood}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl bg-white border border-[#ded5c6] shadow-xs">
          <ImageIcon className="w-10 h-10 text-[#b5ab9a] mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#453d31]">No Photo Keepsakes Yet</h3>
          <p className="mt-1 text-xs text-[#827666] max-w-sm mx-auto">
            You can attach photos, polaroids, and sketches to any journal reflection.
          </p>
          <button
            onClick={onOpenWriter}
            className="mt-4 px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3b574a] transition-all shadow-xs"
          >
            Create Memory Now
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white p-5 rounded-2xl border border-[#ded5c6] shadow-2xl"
          >
            <div className="relative rounded-xl overflow-hidden bg-black max-h-[65vh] flex items-center justify-center">
              <img
                src={selectedItem.photo.url}
                alt="Enlarged Memory"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4">
              {selectedItem.photo.caption && (
                <p className="text-center text-sm font-serif italic text-[#3d3427] mb-2">
                  "{selectedItem.photo.caption}"
                </p>
              )}
              <h4 className="font-serif text-base font-bold text-[#232c26]">
                {selectedItem.entryTitle}
              </h4>
              <p className="text-xs text-[#7d7261] mt-0.5">
                Recorded on {selectedItem.date} • Mood: {selectedItem.mood}
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  onOpenEntry(selectedItem.entryId);
                  setSelectedItem(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3d594d] transition-colors shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                Read Full Journal
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="py-2.5 px-4 rounded-xl bg-[#f2ebe0] text-[#52493c] text-xs font-medium hover:bg-[#e7decf] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
