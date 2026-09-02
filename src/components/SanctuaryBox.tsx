import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Feather, Sparkles, Globe, BookOpen, Flame } from 'lucide-react';

interface SanctuaryBoxProps {
  onOpen: () => void;
  isOpening?: boolean;
}

export const SanctuaryBox: React.FC<SanctuaryBoxProps> = ({ onOpen, isOpening = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isOpening) return;

    // Trigger golden and sage celebration confetti burst
    confetti({
      particleCount: 85,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#4a6b5d', '#d4af37', '#e8dfd1', '#9fb8ad', '#ffffff', '#ea580c'],
    });

    onOpen();
  };

  return (
    <div className="relative min-h-[85vh] w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 select-none overflow-visible">
      {/* Ambient background glowing aura */}
      <div className="absolute w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-[#e5dbc9]/70 via-[#dbe7df]/60 to-[#ebdcca]/50 blur-3xl -z-10 pointer-events-none animate-pulse" />

      {/* Dynamic components emerging directly from the box and traveling to their exact half destinations */}
      <AnimatePresence>
        {isOpening && (
          <>
            {/* Top Navbar Header Flying Up to Top */}
            <motion.div
              initial={{ scale: 0.2, y: 0, opacity: 0 }}
              animate={{ scale: 1, y: -260, opacity: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-40 px-5 py-2.5 rounded-2xl bg-white/95 border border-[#ded5c6] shadow-xl text-xs font-serif text-[#242c27] flex items-center justify-between gap-6 pointer-events-none w-72"
            >
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#4a6b5d]" />
                <span className="font-bold">Lumina Journal</span>
              </div>
              <div className="flex items-center gap-1 text-[#ea580c] font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>7d</span>
              </div>
            </motion.div>

            {/* Left Half (Public Posts) Flying Out to Left Side [ | ] */}
            <motion.div
              initial={{ scale: 0.1, x: 0, y: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, x: -280, y: -30, opacity: 0.95, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-30 w-72 p-4 rounded-3xl bg-white/95 border-2 border-[#4a6b5d]/40 shadow-2xl space-y-2 pointer-events-none hidden sm:block"
            >
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#242c27]">
                <Globe className="w-4 h-4 text-[#4a6b5d]" />
                <span>[ Left Half ] Public Posts</span>
              </div>
              <p className="text-[11px] text-[#786c5a] font-reading">
                Connecting global mindful posts & community thoughts...
              </p>
            </motion.div>

            {/* Right Half (User's Linewise Journals) Flying Out to Right Side [ | ] */}
            <motion.div
              initial={{ scale: 0.1, x: 0, y: 0, opacity: 0, rotate: 15 }}
              animate={{ scale: 1, x: 280, y: -30, opacity: 0.95, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-30 w-72 p-4 rounded-3xl bg-white/95 border-2 border-[#b45309]/40 shadow-2xl space-y-2 pointer-events-none hidden sm:block"
            >
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#242c27]">
                <BookOpen className="w-4 h-4 text-[#b45309]" />
                <span>[ Right Half ] Your Journals</span>
              </div>
              <p className="text-[11px] text-[#786c5a] font-reading">
                Unfolding today, yesterday, and linewise chronological archives...
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main 3D Keepsake Box Assembly */}
      <motion.div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={
          isOpening
            ? { scale: [1, 1.15, 1.3], y: [0, -20, -40], opacity: [1, 1, 0.1] }
            : isHovered
            ? { scale: 1.05, y: -8, rotateZ: 0.5 }
            : { scale: 1, y: [0, -6, 0] }
        }
        transition={
          isOpening
            ? { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
            : isHovered
            ? { duration: 0.3 }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative cursor-pointer group p-8"
        style={{ perspective: 1200 }}
      >
        {/* Golden particle sparkle icons */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-3 -right-3 text-[#d4af37] opacity-80 group-hover:scale-125 transition-transform"
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-2 -left-3 text-[#ea580c] opacity-70 group-hover:scale-125 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>

        {/* 3D Box Body */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-gradient-to-br from-[#4a6b5d] via-[#3d594d] to-[#2d4239] shadow-2xl border-2 border-[#608474]/50 flex items-center justify-center overflow-visible transition-shadow duration-300 group-hover:shadow-[0_20px_50px_rgba(74,107,93,0.35)]">
          {/* Subtle paper/leather texture */}
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30 pointer-events-none" />

          {/* Golden Ribbon - Vertical */}
          <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-[#c9a02d] via-[#f0d479] to-[#c9a02d] shadow-sm z-10 flex items-center justify-center border-x border-[#b3891c]" />

          {/* Golden Ribbon - Horizontal */}
          <div className="absolute left-0 right-0 h-8 bg-gradient-to-b from-[#c9a02d] via-[#f0d479] to-[#c9a02d] shadow-sm z-10 border-y border-[#b3891c]" />

          {/* Box Lid / Top Cap with 3D Flip */}
          <motion.div
            animate={
              isOpening
                ? { rotateX: -120, y: -50, opacity: 0 }
                : isHovered
                ? { y: -8, rotateX: -6 }
                : { y: 0, rotateX: 0 }
            }
            transition={{ duration: isOpening ? 0.6 : 0.3 }}
            style={{ transformOrigin: 'top center' }}
            className="absolute -top-3 -left-3 -right-3 h-12 rounded-2xl bg-gradient-to-b from-[#5c8272] to-[#456356] border-2 border-[#739b8a] shadow-lg z-20 flex items-center justify-center"
          >
            <div className="w-10 h-full bg-gradient-to-r from-[#c9a02d] via-[#f0d479] to-[#c9a02d] border-x border-[#b3891c]" />
          </motion.div>

          {/* Central Wax Seal / Emblem */}
          <motion.div
            animate={
              isOpening
                ? { scale: [1, 1.4, 0], rotate: [0, 45, 90] }
                : isHovered
                ? { scale: 1.15, rotate: 5 }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: isOpening ? 0.5 : 0.2 }}
            className="relative z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f3df95] to-[#aa8314] p-1 shadow-lg border border-[#ffeaa7] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-[#8d6c0c]/60 flex items-center justify-center bg-gradient-to-tr from-[#c49b20] to-[#e4c259]">
              <Feather className="w-7 h-7 sm:w-8 sm:h-8 text-[#332504] drop-shadow-xs" />
            </div>
          </motion.div>

          {/* Internal Glow on opening */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isOpening ? { opacity: 1, scale: 2.2 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#ffd700] via-[#ffffff] to-[#98fb98] blur-2xl z-15 pointer-events-none"
          />

          {/* Ground Shadow */}
          <div className="absolute -bottom-7 w-48 h-6 bg-black/15 blur-md rounded-full -z-10 group-hover:scale-95 group-hover:opacity-75 transition-all duration-300" />
        </div>
      </motion.div>

      {/* Message Below the Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center max-w-sm space-y-1.5"
      >
        <p className="text-sm sm:text-base font-serif font-semibold text-[#2f3832] tracking-wide flex items-center justify-center gap-1.5">
          <span>Click anywhere to open</span>
          <span className="text-[#4a6b5d]">✦</span>
        </p>
        <p className="text-xs text-[#7e7362] font-reading leading-relaxed">
          Tap the keepsake box to unpack public community posts & your linewise journal history.
        </p>
      </motion.div>
    </div>
  );
};
