import React, { useEffect, useState } from 'react';
import { 
  Trophy, CheckCircle2, XCircle, Users, Download, 
  ArrowRight, ShieldCheck, AlertCircle, Save, FileSpreadsheet 
} from 'lucide-react';
import { Draw, DrawSelection, Team, Match } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface CompleteMatchProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

interface TeamParticipationState {
  team_id: string;
  team_name: string;
  captain_name: string;
  selection_order: number;
  actually_played: boolean;
  notes: string;
  players: Array<{
    player_id: string;
    player_name: string;
    role: string;
    participated: boolean;
  }>;
}

export const CompleteMatch: React.FC<CompleteMatchProps> = ({ 
  onNavigate, 
  onRefreshGlobalStats 
}) => {
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const [participations, setParticipations] = useState<TeamParticipationState[]>([]);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<{ playedCount: number; unplayedCount: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [drawRes, matchRes, teamsRes] = await Promise.all([
        api.getActiveDraw(),
        api.getLatestMatch(),
        api.getAllTeams()
      ]);

      let targetDraw: Draw | null = null;
      if (drawRes.success && drawRes.data) {
        targetDraw = drawRes.data;
      } else {
        const hist = await api.getDrawHistory();
        if (hist.success && hist.data && hist.data.length > 0) {
          targetDraw = hist.data[0];
        }
      }

      setActiveDraw(targetDraw);

      if (matchRes.success && matchRes.data) {
        setLatestMatch(matchRes.data);
      }

      const allTeams: Team[] = teamsRes.success ? teamsRes.data : [];
      const teamMap = new Map<string, Team>();
      allTeams.forEach(t => teamMap.set(t.id, t));

      if (targetDraw && targetDraw.selections) {
        const parts: TeamParticipationState[] = targetDraw.selections.map(sel => {
          const team = teamMap.get(sel.team_id);
          const players = team?.players || [];

          return {
            team_id: sel.team_id,
            team_name: sel.team_name,
            captain_name: sel.captain_name,
            selection_order: sel.selection_order,
            actually_played: true, // Default to true
            notes: '',
            players: players.map(p => ({
              player_id: p.id,
              player_name: p.player_name,
              role: p.role,
              participated: p.role !== 'substitute' // Starters participated by default
            }))
          };
        });

        setParticipations(parts);
      }
    } catch (err) {
      console.error('Failed to load participation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTeamPlayed = (teamId: string) => {
    setParticipations(prev =>
      prev.map(p => {
        if (p.team_id === teamId) {
          const nextPlayed = !p.actually_played;
          return {
            ...p,
            actually_played: nextPlayed,
            // If team did not play, uncheck all players
            players: p.players.map(pl => ({
              ...pl,
              participated: nextPlayed ? pl.role !== 'substitute' : false
            }))
          };
        }
        return p;
      })
    );
  };

  const togglePlayerParticipated = (teamId: string, playerId: string) => {
    setParticipations(prev =>
      prev.map(p => {
        if (p.team_id === teamId) {
          return {
            ...p,
            players: p.players.map(pl => {
              if (pl.player_id === playerId) {
                return { ...pl, participated: !pl.participated };
              }
              return pl;
            })
          };
        }
        return p;
      })
    );
  };

  const handleOpenSummary = () => {
    setIsSummaryModalOpen(true);
  };

  const handleFinalizeMatchAndExport = async () => {
    setIsSubmitting(true);
    try {
      const api = (window as any).electronAPI;
      const matchIdToUse = latestMatch?.id || 'default-match-id';

      // 1. Prepare payload
      const participatingTeams = participations.map(p => ({
        team_id: p.team_id,
        actually_played: p.actually_played,
        notes: p.notes
      }));

      const participatingPlayers: any[] = [];
      participations.forEach(p => {
        p.players.forEach(pl => {
          participatingPlayers.push({
            team_id: p.team_id,
            player_id: pl.player_id,
            player_name: pl.player_name,
            role: pl.role,
            participated: pl.participated
          });
        });
      });

      // 2. Complete match in SQLite database transaction
      const compRes = await api.completeMatch(
        matchIdToUse,
        participatingTeams,
        participatingPlayers,
        adminNotes
      );

      if (!compRes.success) {
        throw new Error(compRes.error || 'Failed to complete match');
      }

      setCompletionResult(compRes.data);
      onRefreshGlobalStats();

      // 3. Prompt download of updated 5-sheet Excel workbook immediately!
      const exportRes = await api.exportTournamentWorkbook();
      if (exportRes.success && exportRes.data?.filePath) {
        alert(`Match completed successfully!\n\nUpdated 5-Sheet Excel workbook saved to:\n${exportRes.data.filePath}`);
      }
    } catch (err: any) {
      alert(`Error completing match: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setIsSummaryModalOpen(false);
    }
  };

  const playedCount = participations.filter(p => p.actually_played).length;
  const unplayedCount = participations.length - playedCount;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Team Rotation & Player Tracking
            </span>
            <span className="text-slate-400 text-xs">Match #{latestMatch?.match_number || 1}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Trophy className="text-purple-400" size={26} />
            COMPLETE MATCH & UPDATE EXCEL
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenSummary}
            disabled={participations.length === 0 || isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-950/40"
          >
            <CheckCircle2 size={16} />
            <span>Complete Match & Update Excel</span>
          </button>
        </div>
      </div>

      {/* Rotation Policy Notice */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-purple-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Rotation Rule Enforcement:</span>
            <span>
              Teams marked as <strong>Actually Played</strong> ({playedCount}) will be automatically excluded from the next draw pool. 
              Teams marked as <strong>Did Not Play / No-Show</strong> ({unplayedCount}) will remain eligible for subsequent draws.
            </span>
          </div>
        </div>
      </div>

      {/* Selected Teams Participation Checklist */}
      <div className="space-y-4">
        {participations.map((part) => (
          <div 
            key={part.team_id}
            className={`rounded-2xl esports-card border p-5 transition-all shadow-xl ${
              part.actually_played ? 'border-purple-500/30 bg-slate-900/40' : 'border-rose-500/20 bg-rose-950/10'
            }`}
          >
            {/* Team header row with Played checkbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30">
                  #{part.selection_order}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-heading tracking-wide">
                    {part.team_name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Captain: <strong className="text-emerald-400">{part.captain_name}</strong>
                  </span>
                </div>
              </div>

              {/* Toggle Actually Played Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={part.actually_played}
                  onChange={() => toggleTeamPlayed(part.team_id)}
                  className="w-4 h-4 rounded text-purple-500 focus:ring-purple-400 focus:ring-offset-0 bg-slate-800 border-white/20 cursor-pointer"
                />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  part.actually_played ? 'text-purple-400' : 'text-rose-400'
                }`}>
                  {part.actually_played ? 'Team Actually Played (Exclude from next draw)' : 'No-Show / Forfeit (Keep Eligible)'}
                </span>
              </label>
            </div>

            {/* Individual Players Participation Checklist */}
            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2 font-heading">
                Individual Player Participation (Check who entered the custom room):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {part.players.map((pl) => (
                  <label 
                    key={pl.player_id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-colors cursor-pointer select-none ${
                      pl.participated 
                        ? 'bg-purple-500/10 border-purple-500/30 text-white' 
                        : 'bg-slate-900/50 border-white/5 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={pl.participated}
                      disabled={!part.actually_played}
                      onChange={() => togglePlayerParticipated(part.team_id, pl.player_id)}
                      className="w-3.5 h-3.5 rounded text-purple-500 bg-slate-800 border-white/20 cursor-pointer"
                    />
                    <div className="truncate">
                      <div className="font-semibold truncate">{pl.player_name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{pl.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        {participations.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs esports-card rounded-2xl border border-white/5">
            No draw selections found for completion. Conduct a draw first on the Random Spin Wheel.
          </div>
        )}
      </div>

      {/* Admin Notes Section */}
      <div className="esports-card rounded-2xl border border-white/10 p-5 space-y-2">
        <label className="text-xs font-bold text-white uppercase tracking-wider font-heading">
          Match Administrative Notes (Included in Post-Match Excel Sheet 4):
        </label>
        <textarea
          rows={2}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="e.g. Match concluded smoothly. Team 7 arrived 5 mins late. Booyah awarded to Team Alpha."
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
        />
      </div>

      {/* Summary Dialog Before Commit & Excel Generation */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl esports-card border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white tracking-wide font-heading">
              Match Participation Summary & Workbook Export
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Teams Reviewed:</span>
                <span className="font-bold text-white font-mono">{participations.length}</span>
              </div>
              <div className="flex justify-between text-purple-400">
                <span>Teams Marked as Played (Will be excluded from next draw):</span>
                <span className="font-bold font-mono">{playedCount}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Teams Marked as No-Show (Will remain eligible):</span>
                <span className="font-bold font-mono">{unplayedCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upon confirmation, the SQLite database will record all individual and team participation records in a secure ACID transaction. 
              The application will automatically prompt you to save the updated 5-Sheet Excel workbook.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
              >
                Back to Edit
              </button>
              <button
                onClick={handleFinalizeMatchAndExport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 shadow-lg shadow-purple-950/40"
              >
                Confirm & Generate Workbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
