import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, ShieldAlert, Award, Send, AlertCircle, 
  Clock, Disc, FileSpreadsheet, Download, Trophy, Flame, 
  ArrowRight, RefreshCw, Crosshair, ChevronRight
} from 'lucide-react';
import { DashboardStats, Draw, Match, AuditLog } from '../types';
import { PageId } from '../components/Sidebar';
import { formatDate } from '../utils/helpers';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [statsRes, logsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAuditLogs()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success) setRecentLogs((logsRes.data || []).slice(0, 6));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Total Registered Teams',
      value: stats?.total_teams ?? 0,
      icon: Users,
      color: 'from-blue-600/20 to-indigo-600/10 text-blue-400 border-blue-500/20',
      action: () => onNavigate('all-teams')
    },
    {
      title: 'Eligible for Next Draw',
      value: stats?.eligible_teams ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-600/20 to-teal-600/10 text-emerald-400 border-emerald-500/20',
      highlight: true,
      action: () => onNavigate('spin-wheel')
    },
    {
      title: 'Played Teams (Ineligible)',
      value: stats?.played_teams ?? 0,
      icon: Trophy,
      color: 'from-purple-600/20 to-pink-600/10 text-purple-400 border-purple-500/20',
      action: () => onNavigate('all-teams')
    },
    {
      title: 'Currently Selected',
      value: stats?.selected_teams ?? 0,
      icon: Award,
      color: 'from-amber-600/20 to-yellow-600/10 text-amber-400 border-amber-500/20',
      action: () => onNavigate('selected-teams')
    },
    {
      title: 'Discord Sent DMs',
      value: stats?.notifications_sent ?? 0,
      icon: Send,
      color: 'from-teal-600/20 to-emerald-600/10 text-teal-400 border-teal-500/20',
      action: () => onNavigate('discord-notifications')
    },
    {
      title: 'Pending Notifications',
      value: stats?.notifications_pending ?? 0,
      icon: Clock,
      color: 'from-yellow-600/20 to-amber-600/10 text-yellow-400 border-yellow-500/20',
      action: () => onNavigate('discord-notifications')
    },
    {
      title: 'Failed DM Deliveries',
      value: stats?.notifications_failed ?? 0,
      icon: AlertCircle,
      color: 'from-rose-600/20 to-red-600/10 text-rose-400 border-rose-500/20',
      action: () => onNavigate('discord-notifications')
    },
    {
      title: 'Pool Remaining',
      value: stats?.remaining_eligible ?? 0,
      icon: Disc,
      color: 'from-cyan-600/20 to-blue-600/10 text-cyan-400 border-cyan-500/20',
      action: () => onNavigate('spin-wheel')
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Banner */}
      <div className="relative rounded-2xl p-6 overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-[#0D1B1B] via-[#0D1525] to-[#140F22] shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tournament Command Hub
              </span>
              <span className="text-slate-400 text-xs">• 12 Teams Per Match</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide font-heading">
              FREE FIRE TOURNAMENT SYSTEM
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Import complete team rosters from Excel, conduct cryptographically fair random draws, 
              automate Discord DMs, track player participation, and auto-update rotation workbooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadData(); onRefreshGlobalStats(); }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => onNavigate('spin-wheel')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer group"
            >
              <Disc size={18} className="group-hover:rotate-45 transition-transform" />
              <span>Launch Spin Wheel</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 8 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className={`p-4 rounded-xl esports-card border bg-gradient-to-br ${card.color} transition-all duration-200 hover:-translate-y-0.5 cursor-pointer relative group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
                  {card.title}
                </span>
                <Icon size={18} className="opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
                  {card.value}
                </span>
                <ChevronRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-heading">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('import-excel')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Import Excel</div>
              <div className="text-[11px] text-slate-400">Add team rosters</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('spin-wheel')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <Disc size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Open Spin Wheel</div>
              <div className="text-[11px] text-slate-400">Pick 12 teams</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('selected-teams')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <Award size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Selected Teams</div>
              <div className="text-[11px] text-slate-400">View current draw</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('discord-notifications')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <Send size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Send Notifications</div>
              <div className="text-[11px] text-slate-400">Discord DMs</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('match-details')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors">
              <Crosshair size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Match Details</div>
              <div className="text-[11px] text-slate-400">Room ID & password</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('complete-match')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-colors">
              <Trophy size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Complete Match</div>
              <div className="text-[11px] text-slate-400">Update participation</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('excel-export')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-black transition-colors">
              <Download size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Export Workbook</div>
              <div className="text-[11px] text-slate-400">Download 5 sheets</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('team-rosters')}
            className="p-3.5 rounded-xl esports-card border border-white/5 hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Team Rosters</div>
              <div className="text-[11px] text-slate-400">Full player squads</div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Latest Draw & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Draw Panel */}
        <div className="rounded-2xl esports-card border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Disc size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white tracking-wide">Latest Draw Status</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                stats?.latest_draw?.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {stats?.latest_draw ? `Draw #${stats.latest_draw.draw_number} (${stats.latest_draw.status})` : 'No Active Draw'}
              </span>
            </div>

            {stats?.latest_draw && stats.latest_draw.selections && stats.latest_draw.selections.length > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress: {stats.latest_draw.selections.length} / {stats.latest_draw.target_count} Selected</span>
                  <span>{Math.round((stats.latest_draw.selections.length / stats.latest_draw.target_count) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.latest_draw.selections.length / stats.latest_draw.target_count) * 100, 100)}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {stats.latest_draw.selections.slice(0, 6).map((sel) => (
                    <div key={sel.id} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                      <div className="truncate">
                        <span className="font-mono text-emerald-400 font-bold mr-1.5">#{sel.selection_order}</span>
                        <span className="font-semibold text-slate-200">{sel.team_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 capitalize">{sel.notification_status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No draw currently in progress. Start a new draw to spin the wheel!
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
            <button
              onClick={() => onNavigate('selected-teams')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Selection List</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Recent Audit Activity Panel */}
        <div className="rounded-2xl esports-card border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-teal-400" />
                <h3 className="font-bold text-white tracking-wide">Recent Tournament Audit Log</h3>
              </div>
              <span className="text-[11px] text-slate-400">Persistent SQLite Log</span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-xs flex items-start gap-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 uppercase shrink-0">
                      {log.action}
                    </span>
                    <div className="flex-1 truncate">
                      <p className="text-slate-200 truncate">{log.details}</p>
                      <span className="text-[10px] text-slate-500">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No tournament logs recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
            <button
              onClick={() => onNavigate('draw-history')}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Tournament History</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
