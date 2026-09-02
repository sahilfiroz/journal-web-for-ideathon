import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { FEATURE_EXPLANATIONS, FeatureExplanation } from '../data/featureExplanations';

interface FeatureInfoProps {
  featureId?: keyof typeof FEATURE_EXPLANATIONS | string;
  customExplanation?: FeatureExplanation;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  label?: string;
  showText?: boolean;
}

export const FeatureInfo: React.FC<FeatureInfoProps> = ({
  featureId,
  customExplanation,
  size = 'sm',
  className = '',
  label,
  showText = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<'both' | 'hinglish' | 'english'>('both');
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const explanation: FeatureExplanation | undefined =
    customExplanation || (featureId ? FEATURE_EXPLANATIONS[featureId] : undefined);

  // Function to calculate exact portal coordinates
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 640) {
      // On mobile screens, centered modal
      setCoords(null);
      return;
    }

    const popoverWidth = 380;
    const popoverEstimatedHeight = 400;

    // Horizontal positioning: center on button, clamped to viewport margins
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > vw - 16) {
      left = Math.max(16, vw - popoverWidth - 16);
    }

    // Vertical positioning: default below, switch to above if space is tight
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    let placeAbove = false;
    let top = rect.bottom + 8;

    if (spaceBelow < 320 && spaceAbove > spaceBelow) {
      placeAbove = true;
      top = Math.max(16, rect.top - 8);
    }

    setCoords({ top, left, placeAbove });
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  if (!explanation) return null;

  const sizeClasses = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-4.5 h-4.5 text-xs',
    md: 'w-6 h-6 text-sm',
  };

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      {/* Information Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Feature Guide: ${explanation.title}`}
        aria-label={`About ${explanation.title}`}
        className={`inline-flex items-center justify-center gap-1 rounded-full border transition-all duration-200 cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-[#4a6b5d] text-white border-[#385346] ring-2 ring-[#4a6b5d]/30 scale-105'
            : 'bg-[#f4efe6] text-[#786a59] border-[#ded5c6] hover:bg-[#eadecc] hover:text-[#28322c] hover:border-[#b8aa97]'
        } ${sizeClasses[size]}`}
      >
        <span className="font-serif font-bold italic select-none">i</span>
        {showText && <span className="text-[10px] font-semibold font-sans">{label || 'Guide'}</span>}
      </button>

      {/* Feature Guide Modal & Popover rendered via Portal to escape all overflow and clipping */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] pointer-events-auto">
            {/* Backdrop for click outside & mobile focus */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-2xs transition-opacity sm:bg-transparent sm:backdrop-blur-none"
              onClick={() => setIsOpen(false)}
            />

            {/* Floating Popover Container */}
            <div
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()}
              style={
                coords
                  ? {
                      position: 'fixed',
                      left: `${coords.left}px`,
                      top: coords.placeAbove ? 'auto' : `${coords.top}px`,
                      bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
                      width: '380px',
                      maxWidth: 'calc(100vw - 32px)',
                    }
                  : {
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 'calc(100vw - 32px)',
                      maxWidth: '400px',
                    }
              }
              className="z-[1000000] animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Guide Card Box */}
              <div className="w-full rounded-2xl bg-[#faf8f4] border-2 border-[#d5c9b6] p-4 sm:p-5 shadow-2xl space-y-3.5 text-[#2b352e]">
                {/* Header with Title and Close button */}
                <div className="flex items-start justify-between gap-3 border-b border-[#e5dcce] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#4a6b5d] text-white flex items-center justify-center shadow-xs shrink-0">
                      <span className="font-serif font-bold italic text-sm">i</span>
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#222a25] leading-tight">
                        {explanation.title}
                      </h4>
                      {explanation.titleHinglish && (
                        <p className="text-[11px] text-[#7a6f5e] font-medium mt-0.5">
                          {explanation.titleHinglish}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-xl bg-[#ece5d8] text-[#716553] hover:bg-[#e0d6c5] hover:text-[#1e2621] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Close guide"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Language Selector Tabs */}
                <div className="flex items-center justify-between gap-1 bg-[#ede6d8] p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveLang('both')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                      activeLang === 'both'
                        ? 'bg-white text-[#2a362f] shadow-xs font-bold'
                        : 'text-[#6e6251] hover:text-[#1f2823]'
                    }`}
                  >
                    Both (English + Hinglish)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('hinglish')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                      activeLang === 'hinglish'
                        ? 'bg-[#4a6b5d] text-white shadow-xs font-bold'
                        : 'text-[#6e6251] hover:text-[#1f2823]'
                    }`}
                  >
                    🇮🇳 Hinglish
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('english')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                      activeLang === 'english'
                        ? 'bg-white text-[#2a362f] shadow-xs font-bold'
                        : 'text-[#6e6251] hover:text-[#1f2823]'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>

                {/* Content Body */}
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 text-xs">
                  {/* 1. HINGLISH SECTION */}
                  {(activeLang === 'both' || activeLang === 'hinglish') && (
                    <div className="rounded-xl bg-[#f4ece0] border border-[#e2d5c3] p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-[#854d0e] font-bold text-[11px]">
                        <span>🇮🇳</span>
                        <span>HINGLISH (Aasan Bhasha Me Samjhein):</span>
                      </div>

                      <div className="space-y-1.5 text-[#3a443c] leading-relaxed">
                        <p>
                          <strong className="text-[#1c2420]">📌 Yeh kya kaam karta hai?</strong>
                          <br />
                          {explanation.hinglish.whatIsIt}
                        </p>
                        <p>
                          <strong className="text-[#1c2420]">💡 Kaise use karein?</strong>
                          <br />
                          {explanation.hinglish.howToUse}
                        </p>
                        <p>
                          <strong className="text-[#1c2420]">🌟 Iska fayda:</strong>
                          <br />
                          {explanation.hinglish.benefit}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. ENGLISH SECTION */}
                  {(activeLang === 'both' || activeLang === 'english') && (
                    <div className="rounded-xl bg-white border border-[#e0d6c6] p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-[#38624d] font-bold text-[11px]">
                        <span>🇬🇧</span>
                        <span>ENGLISH (Clear Overview):</span>
                      </div>

                      <div className="space-y-1.5 text-[#38433b] leading-relaxed">
                        <p>
                          <strong className="text-[#1e2722]">📌 What does it do?</strong>
                          <br />
                          {explanation.english.whatIsIt}
                        </p>
                        <p>
                          <strong className="text-[#1e2722]">💡 How to use?</strong>
                          <br />
                          {explanation.english.howToUse}
                        </p>
                        <p>
                          <strong className="text-[#1e2722]">🌟 Key Benefit:</strong>
                          <br />
                          {explanation.english.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#e8dfd1] text-[11px] text-[#7a6f5e]">
                  <span className="flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5 text-[#4a6b5d]" />
                    Lumina Guide
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#4a6b5d] text-white font-medium hover:bg-[#395347] transition-colors cursor-pointer shadow-xs"
                  >
                    Samajh gaya / Got it
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

