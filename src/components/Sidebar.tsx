import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Dices,
  Gamepad2,
  Trophy,
  Database
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'random-spin-wheel'
  | 'all-teams'
  | 'match-management'
  | 'match-history'
  | 'discord-notifications'
  | 'database-backups'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  discordReady: boolean;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  discordReady
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      groupName: 'Tournament',
      items: [
        { id: 'random-spin-wheel', label: 'Spin Wheel', icon: Dices },
        { id: 'all-teams', label: 'Team Management', icon: Users },
        { id: 'match-management', label: 'Match Management', icon: Gamepad2 },
        { id: 'match-history', label: 'Match History', icon: Trophy }
      ]
    },
    {
      groupName: 'System',
      items: [
        {
          id: 'discord-notifications',
          label: 'Discord Integration',
          icon: MessageSquare,
          badge: discordReady ? 'Online' : 'Offline',
          badgeColor: discordReady
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400'
        },
        { id: 'database-backups', label: 'Database & Backups', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      className={`h-[calc(100vh-3rem)] bg-[#0E131F] border-r border-white/5 flex flex-col transition-all duration-300 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-60'
      }`}
    >
      {/* Top Toggle */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Tournament Menu
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

      {/* Nav list grouped into Main, Tournament, System */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.groupName} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-500">
                {group.groupName}
              </div>
            ) : (
              groupIndex > 0 && <div className="border-t border-white/5 my-2 mx-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full" />
                  )}

                  <Icon
                    size={17}
                    className={`transition-colors shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
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
        ))}
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
              <span className="block text-slate-400">Discord Bot</span>
              <span className={`font-semibold ${discordReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {discordReady ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
