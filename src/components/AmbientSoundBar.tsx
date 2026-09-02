import React, { useState } from 'react';
import { ambientSound } from '../utils/audioSynth';
import { Volume2, VolumeX, CloudRain, Wind, Waves, Flame, Coffee, X } from 'lucide-react';

interface AmbientSoundBarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SoundPreset = 'none' | 'rain' | 'forest' | 'waves' | 'fireplace' | 'cafe';

const SOUNDS: { id: SoundPreset; label: string; icon: React.ReactNode }[] = [
  { id: 'rain', label: 'Gentle Rain', icon: <CloudRain className="w-4 h-4" /> },
  { id: 'waves', label: 'Ocean Tide', icon: <Waves className="w-4 h-4" /> },
  { id: 'forest', label: 'Forest Wind', icon: <Wind className="w-4 h-4" /> },
  { id: 'fireplace', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> },
  { id: 'cafe', label: 'Cozy Cafe', icon: <Coffee className="w-4 h-4" /> },
];

export const AmbientSoundBar: React.FC<AmbientSoundBarProps> = ({ isOpen, onClose }) => {
  const [activeSound, setActiveSound] = useState<SoundPreset>('none');
  const [volume, setVolume] = useState(0.4);

  if (!isOpen) return null;

  const handleSelectSound = (id: SoundPreset) => {
    if (activeSound === id) {
      ambientSound.stop();
      setActiveSound('none');
    } else {
      if (id === 'none') {
        ambientSound.stop();
      } else {
        ambientSound.play(id, volume);
      }
      setActiveSound(id);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientSound.setVolume(newVol);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#dfd5c5] shadow-xl animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#eee5d8]">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#4a6b5d]" />
          <span className="text-xs font-semibold text-[#323c34]">Mindful Soundscapes</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#827766] hover:bg-[#f3ede1] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sound Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
        {SOUNDS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectSound(s.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeSound === s.id
                ? 'bg-[#4a6b5d] text-white shadow-xs'
                : 'bg-[#faf7f0] text-[#554d3f] border border-[#e3d8c8] hover:bg-[#f1ebd0]'
            }`}
          >
            {s.icon}
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#f0e8dc] text-xs text-[#786d5e]">
        <button
          onClick={() => handleSelectSound('none')}
          className="p-1 rounded-lg hover:bg-[#f3ede1]"
          title="Mute sound"
        >
          {activeSound === 'none' ? (
            <VolumeX className="w-4 h-4 text-[#a39785]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#4a6b5d]" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={activeSound === 'none' ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          disabled={activeSound === 'none'}
          className="w-full accent-[#4a6b5d] cursor-pointer"
        />
        <span className="text-[11px] font-mono w-8 text-right">
          {activeSound === 'none' ? 'Off' : `${Math.round(volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
