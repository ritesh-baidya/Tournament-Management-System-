import React, { useEffect, useState } from 'react';
import { 
  Trophy, Calendar, Clock, Gamepad2, Search, 
  RefreshCw, Users, ArrowRight, X, User, Shield, Check, Trash2
} from 'lucide-react';
import { Match, MatchTeamParticipation, Team, TournamentStage } from '../types';
import { PageId } from '../components/Sidebar';
import { formatLocalDate, formatLocalTime } from '../utils/helpers';

interface MatchHistoryProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'scheduled'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | TournamentStage>('all');

  const getStageBadgeColor = (stage?: TournamentStage | string) => {
    switch (stage) {
      case 'final':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'semi-final':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'quarter-final':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'qualifying':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  const getStageLabel = (stage?: TournamentStage | string) => {
    switch (stage) {
      case 'final': return 'Final';
      case 'semi-final': return 'Semi-final';
      case 'quarter-final': return 'Quarter-final';
      case 'qualifying': return 'Qualifying';
      default: return stage || 'Qualifying';
    }
  };

  // Details Modal States
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [participatingTeams, setParticipatingTeams] = useState<MatchTeamParticipation[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteMatch = async (m: Match) => {
    if (!confirm(`Are you sure you want to delete Match #${m.match_number} from history? This cannot be undone.`)) {
      return;
    }
    setDeletingId(m.id);
    try {
      const api = (window as any).electronAPI;
      if (api?.deleteMatch) {
        const res = await api.deleteMatch(m.id);
        if (res?.success) {
          await loadMatches();
          onRefreshGlobalStats();
        } else {
          alert(`Failed to delete match: ${res?.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      alert(`Error deleting match: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllMatches = async () => {
    if (!confirm('Are you sure you want to clear ALL match history? All past match records will be permanently removed.')) {
      return;
    }
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (api?.clearAllMatches) {
        const res = await api.clearAllMatches();
        if (res?.success) {
          await loadMatches();
          onRefreshGlobalStats();
        } else {
          alert(`Failed to clear match history: ${res?.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.getMatches) return;
      const res = await api.getMatches();
      if (res.success && Array.isArray(res.data)) {
        // Sort with most recent completed matches first
        const sorted = [...res.data].sort((a, b) => {
          const timeA = new Date(a.completed_at || a.created_at).getTime() || 0;
          const timeB = new Date(b.completed_at || b.created_at).getTime() || 0;
          return timeB - timeA;
        });
        setMatches(sorted);
      }
    } catch (err) {
      console.error('Error loading matches history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  // Format accurate finish date and time from completed_at or created_at in local timezone
  const getMatchDateAndTime = (m: Match) => {
    // 1. If completed_at is set, format its local date and time
    if (m.completed_at) {
      try {
        const d = new Date(m.completed_at);
        if (!isNaN(d.getTime())) {
          return {
            date: formatLocalDate(d),
            time: formatLocalTime(d),
            isActual: true
          };
        }
      } catch {}
    }
    // 2. If match_date and match_time are set, show them
    if (m.match_date || m.match_time) {
      return {
        date: m.match_date ? formatLocalDate(m.match_date) : 'Today',
        time: m.match_time || (m.created_at ? formatLocalTime(m.created_at) : 'Time N/A'),
        isActual: false
      };
    }
    // 3. Fallback to created_at
    if (m.created_at) {
      try {
        const d = new Date(m.created_at);
        if (!isNaN(d.getTime())) {
          return {
            date: formatLocalDate(d),
            time: formatLocalTime(d),
            isActual: false
          };
        }
      } catch {}
    }
    return {
      date: 'Date N/A',
      time: 'Time N/A',
      isActual: false
    };
  };

  // Open Details Modal and fetch participating teams and player roster
  const handleOpenDetails = async (match: Match) => {
    setSelectedMatch(match);
    setLoadingDetails(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [partRes, allTeamsRes] = await Promise.all([
        api.getMatchTeamParticipation ? api.getMatchTeamParticipation(match.id) : Promise.resolve({ success: false, data: [] }),
        api.getAllTeams ? api.getAllTeams() : Promise.resolve({ success: false, data: [] })
      ]);

      const teamsData: MatchTeamParticipation[] = partRes?.data || [];
      const allTeamsList: Team[] = allTeamsRes?.data || [];

      // Enrich with team players if individual player participation rows weren't explicitly recorded
      const enriched = teamsData.map((t) => {
        if (!t.players || t.players.length === 0) {
          const found = allTeamsList.find(x => x.id === t.team_id);
          if (found?.players && found.players.length > 0) {
            return {
              ...t,
              players: found.players.map(p => ({
                id: p.id,
                match_id: match.id,
                team_id: t.team_id,
                player_id: p.id,
                player_name: p.player_name,
                role: p.role,
                participated: true
              }))
            };
          }
        }
        return t;
      });

      setParticipatingTeams(enriched);
    } catch (err) {
      console.error('Failed to load match participation details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch = 
      String(m.match_number).includes(searchTerm) ||
      (m.room_id && m.room_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.admin_notes && m.admin_notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesStage = stageFilter === 'all' || (m.stage || 'qualifying') === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-white/5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Tournament Archive
            </span>
            <span className="text-xs text-slate-400">{matches.length} Total Matches</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
            <Trophy className="text-purple-400" size={26} />
            Match History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review completed matches, accurate finished timestamps, and played squad rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {matches.length > 0 && (
            <button
              onClick={handleClearAllMatches}
              className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear All Match History"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('match-management')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Match Operations</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={loadMatches}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full lg:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by match # or room ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
          {/* Stage Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Trophy size={13} className="text-purple-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Stages</option>
              <option value="qualifying" className="bg-slate-900 text-slate-200">Qualifying</option>
              <option value="quarter-final" className="bg-slate-900 text-slate-200">Quarter-final</option>
              <option value="semi-final" className="bg-slate-900 text-slate-200">Semi-final</option>
              <option value="final" className="bg-slate-900 text-slate-200">Final</option>
            </select>
          </div>

          {/* Status Filter Buttons */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            All Matches ({matches.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            Completed ({matches.filter(m => m.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'scheduled'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            Scheduled ({matches.filter(m => m.status === 'scheduled').length})
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((m) => {
            const dt = getMatchDateAndTime(m);

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-[#121624] border border-white/5 hover:border-purple-500/30 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Gamepad2 size={18} className="text-purple-400" />
                    Match #{m.match_number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStageBadgeColor(m.stage)}`}>
                      {getStageLabel(m.stage)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      m.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Room ID</span>
                    <span className="text-white font-mono font-bold">{m.room_id || 'N/A'}</span>
                  </div>
                </div>

                {/* Accurate Date & Time */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-purple-400" />
                      <span className="text-slate-200">{dt.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Clock size={13} className="text-purple-400" />
                      <span>{dt.time}</span>
                    </span>
                  </div>

                  {m.admin_notes && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded-lg truncate">
                      Notes: {m.admin_notes}
                    </div>
                  )}
                </div>

                {/* Footer: View Details & Delete Match */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetails(m)}
                    className="flex-1 py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users size={14} />
                    <span>View Squads & Players</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(m)}
                    disabled={deletingId === m.id}
                    className="p-2 bg-rose-950/30 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/40 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    title={`Delete Match #${m.match_number}`}
                  >
                    {deletingId === m.id ? (
                      <RefreshCw size={14} className="animate-spin text-rose-400" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
          <Trophy size={36} className="text-slate-600 mb-1" />
          <h3 className="text-sm font-semibold text-slate-200">No Match Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Matches that are scheduled or completed will automatically appear in this tournament log.
          </p>
          <button
            onClick={() => onNavigate('random-spin-wheel')}
            className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Start New Match</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Played Squads & Players Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121624] border border-purple-500/30 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <Gamepad2 size={20} className="text-purple-400" />
                    Match #{selectedMatch.match_number} — Played Teams & Players
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStageBadgeColor(selectedMatch.stage)}`}>
                    {getStageLabel(selectedMatch.stage)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedMatch.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedMatch.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Finished: <strong className="text-slate-200">{getMatchDateAndTime(selectedMatch).date}</strong> at{' '}
                  <strong className="text-slate-200">{getMatchDateAndTime(selectedMatch).time}</strong> • Room ID: {selectedMatch.room_id || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingDetails ? (
                <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw size={16} className="animate-spin text-purple-400" />
                  <span>Loading squads and player rosters...</span>
                </div>
              ) : participatingTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {participatingTeams.map((team, idx) => (
                    <div
                      key={team.id || idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3"
                    >
                      {/* Team Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block truncate">
                            {team.team_name || 'Team Name'}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Shield size={12} className="text-purple-400 shrink-0" />
                            Captain: <strong className="text-slate-300">{team.captain_name || 'Captain'}</strong>
                          </span>
                        </div>
                        {team.result === 'qualified' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                            <Check size={11} /> Qualified
                          </span>
                        ) : team.result === 'eliminated' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                            <X size={11} /> Eliminated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 flex items-center gap-1 shrink-0">
                            <Check size={11} /> Played
                          </span>
                        )}
                      </div>

                      {/* Players Roster */}
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">
                          Squad Members
                        </span>
                        {team.players && team.players.length > 0 ? (
                          <div className="space-y-1">
                            {team.players.map((player) => (
                              <div
                                key={player.id || player.player_id}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-800/40"
                              >
                                <span className="flex items-center gap-1.5 text-slate-200">
                                  <User size={12} className="text-slate-400" />
                                  <span>{player.player_name}</span>
                                </span>
                                <span className="text-[10px] uppercase text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded font-mono">
                                  {player.role || 'Player'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-1">
                            {team.captain_name} (Captain) + Registered Squad
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No participating squad data found for this match.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-slate-900/40">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
