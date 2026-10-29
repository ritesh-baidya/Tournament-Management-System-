import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Shield,
  Disc,
  CheckCircle2,
  MessageSquare,
  Crosshair,
  Trophy,
  History,
  FileText,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'import-excel'
  | 'all-teams'
  | 'team-rosters'
  | 'spin-wheel'
  | 'selected-teams'
  | 'discord-notifications'
  | 'match-details'
  | 'complete-match'
  | 'draw-history'
  | 'match-history'
  | 'excel-export'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  eligibleCount: number;
  selectedCount: number;
  discordReady: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  eligibleCount,
  selectedCount,
  discordReady
}) => {
  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    category?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
    
    { id: 'import-excel', label: 'Import Excel', icon: FileSpreadsheet, category: 'Rosters & Teams' },
    { id: 'all-teams', label: 'All Teams', icon: Users, badge: eligibleCount > 0 ? `${eligibleCount} elig` : undefined },
    { id: 'team-rosters', label: 'Team Rosters', icon: Shield },
    
    { id: 'spin-wheel', label: 'Random Spin Wheel', icon: Disc, badge: 'Live Draw', badgeColor: 'bg-emerald-500/20 text-emerald-400', category: 'Draw & Selection' },
    { id: 'selected-teams', label: 'Selected Teams', icon: CheckCircle2, badge: selectedCount > 0 ? selectedCount : undefined },
    
    { id: 'discord-notifications', label: 'Discord Bot', icon: MessageSquare, badge: discordReady ? 'Online' : 'Offline', badgeColor: discordReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400', category: 'Match & Room' },
    { id: 'match-details', label: 'Match Details', icon: Crosshair },
    { id: 'complete-match', label: 'Complete Match', icon: Trophy, category: 'Completion' },
    
    { id: 'draw-history', label: 'Draw History', icon: History, category: 'Archives & Reports' },
    { id: 'match-history', label: 'Match History', icon: FileText },
    { id: 'excel-export', label: 'Excel Export', icon: Download },
    
    { id: 'settings', label: 'Settings', icon: Settings, category: 'System' }
  ];

  return (
    <aside
      className={`h-[calc(100vh-3rem)] bg-[#0E131F] border-r border-white/5 flex flex-col transition-all duration-300 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Toggle */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Tournament Nav
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer relative ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full shadow-md shadow-emerald-500" />
              )}
              
              <Icon
                size={18}
                className={`transition-colors shrink-0 ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left tracking-wide font-sans text-xs">
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Connection Status */}
      <div className="p-3 border-t border-white/5 bg-[#090C14]">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <Radio
              size={14}
              className={discordReady ? 'text-emerald-400' : 'text-amber-400'}
            />
            {discordReady && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          {!isCollapsed && (
            <div className="text-[11px] truncate leading-tight">
              <span className="block text-slate-400">Discord Service</span>
              <span className={`font-semibold ${discordReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {discordReady ? 'Connected & Ready' : 'Standby / Configure'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
