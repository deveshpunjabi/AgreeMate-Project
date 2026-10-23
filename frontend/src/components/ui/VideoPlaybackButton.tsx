'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';

export default function VideoPlaybackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close modal on Escape key press and prevent scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Autoplay video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy prevented playback, user can click play manually
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsOpen(false);
  };

  const modalContent = isOpen && (
    <div
      className="fixed inset-0 z-[99999] bg-[#081119]/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Main Player Container */}
      <div className="relative w-full max-w-4xl aspect-video bg-neutral-950 rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,104,163,0.35)] border border-white/10 animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
        {/* Close button inside the video player wrapper */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95"
          aria-label="Close video player"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player */}
        <video
          ref={videoRef}
          src="/video/agreemate.mp4"
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* High-End Glassmorphic Video Playback Card Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white hover:bg-canvas-soft border border-hairline text-left shadow-card hover:shadow-raised transition-all duration-200 cursor-pointer group select-none relative overflow-hidden"
      >
        {/* Soft Radial Ambient Glow in background */}
        <div className="absolute -left-6 -top-6 w-20 h-20 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/15 transition-all duration-300" />

        {/* Delicate Glass Highlights */}
        <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />

        {/* Play Icon Container with pulsing border */}
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-[#005080] to-[#0ea5e9] text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)] group-hover:scale-105 transition-transform duration-300">
          <Play className="w-5 h-5 fill-white text-white translate-x-[1px]" />
        </div>

        {/* Label and Info */}
        <div className="relative z-10 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest text-[#003a5e] group-hover:text-sky-600 transition-colors">
              Watch Demo
            </span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[8px] font-black tracking-wider uppercase leading-none border border-sky-500/10">
              HD
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1e2c3a]/80 leading-tight mt-1">
            AgreeMate in Action
          </span>
        </div>
      </button>

      {/* Render modal at body level to escape stacking context */}
      {mounted && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
