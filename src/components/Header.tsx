import React from 'react';
import { Minus, Square, X, Flame } from 'lucide-react';

interface HeaderProps {
  tournamentName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName = 'Free Fire Tournament Manager'
}) => {
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
      {/* Left: Branding */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] flex items-center justify-center">
          <div className="w-full h-full bg-[#0B0E14] rounded-[7px] flex items-center justify-center">
            <Flame size={18} className="text-emerald-400" />
          </div>
        </div>
        <span className="text-sm font-bold tracking-wider uppercase text-white">
          {tournamentName}
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
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
