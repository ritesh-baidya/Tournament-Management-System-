import React, { useEffect, useState } from 'react';
import { Trophy, FileText, CheckCircle2, XCircle, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Match, MatchTeamParticipation } from '../types';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface MatchHistoryProps {
  onNavigate: (page: PageId) => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ onNavigate }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchParticipations, setMatchParticipations] = useState<Record<string, MatchTeamParticipation[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const api = (window as any).electronAPI;
        if (!api) return;
        const res = await api.getMatches();
        if (res.success && res.data) {
          setMatches(res.data);
          if (res.data.length > 0) {
            setExpandedMatchId(res.data[0].id);
            // Fetch participation for first match
            loadParticipationForMatch(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load match history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const loadParticipationForMatch = async (mId: string) => {
    if (matchParticipations[mId]) return;
    try {
      const api = (window as any).electronAPI;
      const partRes = await api.getMatchTeamParticipation(mId);
      if (partRes.success && partRes.data) {
        setMatchParticipations(prev => ({ ...prev, [mId]: partRes.data }));
      }
    } catch {}
  };

  const toggleExpand = (id: string) => {
    if (expandedMatchId === id) {
      setExpandedMatchId(null);
    } else {
      setExpandedMatchId(id);
      loadParticipationForMatch(id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Trophy className="text-purple-400" size={26} />
            MATCH PARTICIPATION ARCHIVES
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical match records, custom room IDs, starter/substitute participation, and administrative tournament notes.
          </p>
        </div>
      </div>

      {/* Match Cards List */}
      <div className="space-y-4">
        {matches.map((m) => {
          const isExpanded = expandedMatchId === m.id;
          const parts = matchParticipations[m.id] || [];

          return (
            <div 
              key={m.id}
              className="rounded-2xl esports-card border border-white/10 overflow-hidden shadow-xl"
            >
              <div 
                onClick={() => toggleExpand(m.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black font-mono text-base border border-purple-500/20">
                    M{m.match_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Match #{m.match_number} — Room: {m.room_id || 'N/A'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>Date: {m.match_date || 'N/A'} {m.match_time || ''}</span>
                      {m.completed_at && <span>• Completed: {formatDate(m.completed_at)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    m.status === 'completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {m.status}
                  </span>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
                  {m.admin_notes && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300">
                      <strong className="text-purple-400">Organizer Notes: </strong>
                      {m.admin_notes}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-heading">
                        <tr>
                          <th className="py-2.5 px-3">Order</th>
                          <th className="py-2.5 px-3">Team Name</th>
                          <th className="py-2.5 px-3">Captain</th>
                          <th className="py-2.5 px-3">Actually Played</th>
                          <th className="py-2.5 px-3">Players Participated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/60">
                            <td className="py-2.5 px-3 font-mono text-purple-400 font-bold">#{p.selection_order}</td>
                            <td className="py-2.5 px-3 font-semibold text-white">{p.team_name}</td>
                            <td className="py-2.5 px-3 text-slate-300">{p.captain_name}</td>
                            <td className="py-2.5 px-3">
                              {p.actually_played ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400">
                                  <CheckCircle2 size={12} /> Played
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                  <XCircle size={12} /> No-Show
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {p.players && p.players.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {p.players.map((pl) => (
                                    <span 
                                      key={pl.id}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        pl.participated ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-slate-600 line-through'
                                      }`}
                                    >
                                      {pl.player_name}
                                    </span>
                                  ))}
                                </div>
                              ) : 'Full Roster'}
                            </td>
                          </tr>
                        ))}

                        {parts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                              No participation recorded for this match yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs esports-card rounded-2xl border border-white/5">
            No completed matches found. Complete a match to view archives.
          </div>
        )}
      </div>
    </div>
  );
};
