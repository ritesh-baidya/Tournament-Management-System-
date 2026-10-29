import React, { useState } from 'react';
import { Minus, Square, X, Volume2, VolumeX, Flame, Trophy } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  tournamentName?: string;
  eligibleCount?: number;
  targetCount?: number;
  onQuickAction?: (action: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName = 'Free Fire Championship 2026',
  eligibleCount = 0,
  targetCount = 12,
  onQuickAction
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const handleMinimize = () => {
    (window as any).electronAPI?.minimize();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximize();
  };

  const handleClose = () => {
    (window as any).electronAPI?.close();
  };

  return (
    <header className="h-12 bg-[#0B0E14] border-b border-white/10 flex items-center justify-between px-4 select-none shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Left: Branding & Tournament Title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] flex items-center justify-center shadow-lg shadow-emerald-950/40">
          <div className="w-full h-full bg-[#0B0E14] rounded-[7px] flex items-center justify-center">
            <Flame size={18} className="text-emerald-400 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wider uppercase text-white font-heading">
            {tournamentName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Trophy size={10} />
            Official Desktop Manager
          </span>
        </div>
      </div>

      {/* Center: Live Rotation Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/5 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-slate-400">Next Draw Pool:</span>
        <span className="font-bold text-emerald-400 font-mono">{eligibleCount}</span>
        <span className="text-slate-500">/ target {targetCount}</span>
      </div>

      {/* Right: Sound toggle and Window Controls */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Minus size={15} />
        </button>

        <button
          onClick={handleMaximize}
          title="Maximize / Restore"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Square size={13} />
        </button>

        <button
          onClick={handleClose}
          title="Close"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
};
