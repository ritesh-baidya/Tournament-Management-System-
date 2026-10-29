import React, { useEffect, useState } from 'react';
import { Shield, Users, Search, Eye, EyeOff, User, Phone, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Team, Player } from '../types';
import { maskSensitive } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface TeamRostersProps {
  onNavigate: (page: PageId) => void;
}

export const TeamRosters: React.FC<TeamRostersProps> = ({ onNavigate }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealPrivateInfo, setRevealPrivateInfo] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.getAllTeams();
      if (res.success && res.data) {
        setTeams(res.data);
      }
    } catch (err) {
      console.error('Failed to load rosters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(t => {
    const q = searchQuery.toLowerCase();
    const teamMatch = t.team_name.toLowerCase().includes(q) || t.captain_name.toLowerCase().includes(q);
    if (teamMatch) return true;
    const playerMatch = t.players?.some(p => p.player_name.toLowerCase().includes(q));
    return Boolean(playerMatch);
  });

  const toggleExpand = (id: string) => {
    setExpandedTeamId(expandedTeamId === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Shield className="text-emerald-400" size={26} />
            COMPLETE SQUAD & PLAYER ROSTERS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed view of all four starters, substitutes, coaches, and preserved custom registration columns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRevealPrivateInfo(!revealPrivateInfo)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors cursor-pointer ${
              revealPrivateInfo 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                : 'bg-slate-800 text-slate-300 border-white/10 hover:text-white'
            }`}
          >
            {revealPrivateInfo ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{revealPrivateInfo ? 'Mask Contact Info' : 'Reveal Contact Info'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by team, captain, or player name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTeams.map((team) => {
          const isExpanded = expandedTeamId === team.id;
          const players = team.players || [];
          const capt = players.find(p => p.is_captain || p.role === 'captain');
          const starters = players.filter(p => !p.is_captain && p.role !== 'substitute');
          const subs = players.filter(p => p.role === 'substitute');

          return (
            <div 
              key={team.id}
              className="rounded-2xl esports-card border border-white/10 p-5 space-y-4 hover:border-emerald-500/30 transition-all shadow-xl"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-heading tracking-wide">
                      {team.team_name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-white/5">
                      {team.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Captain: <strong className="text-emerald-400">{team.captain_name}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(team.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Toggle details"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Private Contact Info (Phone / Discord) */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400">Phone:</span>
                  <span className="font-mono text-xs">
                    {revealPrivateInfo ? (team.captain_phone || 'N/A') : maskSensitive(team.captain_phone, 3)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <MessageSquare size={13} className="text-teal-400 shrink-0" />
                  <span className="text-[11px] text-slate-400">Discord ID:</span>
                  <span className="font-mono text-xs">
                    {revealPrivateInfo ? (team.captain_discord_id || 'N/A') : maskSensitive(team.captain_discord_id, 4)}
                  </span>
                </div>
              </div>

              {/* 4-Player Roster Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider font-heading">
                  Active Starters:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Captain */}
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block">Captain (IGL)</span>
                    <span className="text-xs font-bold text-white truncate block mt-0.5">{capt?.player_name || team.captain_name}</span>
                  </div>

                  {/* Starters */}
                  {starters.slice(0, 3).map((p, pIdx) => (
                    <div key={p.id} className="p-2 rounded-xl bg-slate-900 border border-white/5 text-center">
                      <span className="text-[9px] font-semibold uppercase text-slate-400 block">Player {pIdx + 2}</span>
                      <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">{p.player_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Substitutes */}
              {subs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider font-heading">
                    Substitutes:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((s) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                        {s.player_name} (Sub)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Extra Columns */}
              {isExpanded && team.extra_columns && Object.keys(team.extra_columns).length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider font-heading">
                    Additional Excel Columns Preserved:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(team.extra_columns).map(([key, val]) => (
                      <div key={key} className="p-2 rounded-lg bg-slate-950 border border-white/5">
                        <span className="text-[10px] text-slate-500 block truncate">{key}:</span>
                        <span className="text-slate-200 font-medium truncate block">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs esports-card rounded-2xl border border-white/5">
            No team rosters found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
