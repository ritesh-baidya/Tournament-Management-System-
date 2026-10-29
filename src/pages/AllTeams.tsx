import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, RotateCcw, Shield, CheckCircle2, 
  XCircle, Clock, Award, AlertTriangle, ArrowUpDown, ChevronDown 
} from 'lucide-react';
import { Team, TeamStatus } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface AllTeamsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const AllTeams: React.FC<AllTeamsProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Status change modal state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [targetStatus, setTargetStatus] = useState<TeamStatus>('eligible');
  const [overrideReason, setOverrideReason] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Reset rotation modal state
  const [isResetRotationOpen, setIsResetRotationOpen] = useState(false);

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
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenStatusModal = (team: Team, newStatus: TeamStatus) => {
    setSelectedTeam(team);
    setTargetStatus(newStatus);
    setOverrideReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedTeam) return;
    try {
      const api = (window as any).electronAPI;
      await api.updateTeamStatus(selectedTeam.id, targetStatus, overrideReason || 'Manual administrative override');
      await fetchTeams();
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error updating team status: ${err.message}`);
    } finally {
      setIsStatusModalOpen(false);
      setSelectedTeam(null);
    }
  };

  const handleResetRotation = async () => {
    try {
      const api = (window as any).electronAPI;
      await api.resetRotation('one_time');
      await fetchTeams();
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error resetting rotation: ${err.message}`);
    } finally {
      setIsResetRotationOpen(false);
    }
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = 
      t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.captain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.captain_discord_id && t.captain_discord_id.includes(searchQuery));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: TeamStatus) => {
    switch (status) {
      case 'eligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
            <CheckCircle2 size={11} /> Eligible
          </span>
        );
      case 'selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
            <Clock size={11} /> Selected
          </span>
        );
      case 'played':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
            <Award size={11} /> Played
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase">
            <XCircle size={11} /> Withdrawn
          </span>
        );
      case 'disqualified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
            <AlertTriangle size={11} /> Disqualified
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Users className="text-emerald-400" size={26} />
            ALL REGISTERED TEAMS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse all squads, monitor eligibility states, and execute administrative status overrides with full audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsResetRotationOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw size={15} />
            Reset Team Rotation
          </button>

          <button
            onClick={() => onNavigate('import-excel')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            Import More Teams
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team name or captain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: `All (${teams.length})` },
            { id: 'eligible', label: `Eligible (${teams.filter(t => t.status === 'eligible').length})` },
            { id: 'selected', label: `Selected (${teams.filter(t => t.status === 'selected').length})` },
            { id: 'played', label: `Played (${teams.filter(t => t.status === 'played').length})` },
            { id: 'disqualified', label: `DQ (${teams.filter(t => t.status === 'disqualified').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-black'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl esports-card border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#090D17] text-slate-400 uppercase tracking-wider font-heading sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Captain</th>
                <th className="py-3 px-4">Discord ID</th>
                <th className="py-3 px-4">Players</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTeams.map((team, idx) => (
                <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-white tracking-wide">
                    {team.team_name}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {team.captain_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {team.captain_discord_id || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="font-mono font-semibold">{team.players?.length || 1}</span> players
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(team.status)}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {formatDate(team.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <select
                        value={team.status}
                        onChange={(e) => handleOpenStatusModal(team, e.target.value as TeamStatus)}
                        className="px-2 py-1 bg-slate-900 border border-white/10 hover:border-emerald-500 rounded text-slate-300 text-[11px] focus:outline-none cursor-pointer"
                      >
                        <option value="eligible">Set: Eligible</option>
                        <option value="selected">Set: Selected</option>
                        <option value="played">Set: Played</option>
                        <option value="withdrawn">Set: Withdrawn</option>
                        <option value="disqualified">Set: Disqualified</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No teams found matching the search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      {isStatusModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl esports-card border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white tracking-wide mb-2">
              Update Team Status
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Changing status of <strong className="text-emerald-400">{selectedTeam.team_name}</strong> from <span className="uppercase text-slate-400">{selectedTeam.status}</span> to <span className="uppercase text-emerald-400 font-bold">{targetStatus}</span>.
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-slate-300">
                Administrative Override Reason (Logged in Audit):
              </label>
              <input
                type="text"
                placeholder="e.g. Organizer approved substitute slot, restored for finals, etc."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Rotation Modal */}
      <ConfirmationModal
        isOpen={isResetRotationOpen}
        title="Reset Tournament Rotation"
        message="This action will restore all 'Played' and 'Selected' teams back to 'Eligible' status for future draws.\n\nAll historical match records, individual participation logs, and player details will be strictly preserved in SQLite."
        confirmText="Yes, Reset Rotation"
        onConfirm={handleResetRotation}
        onCancel={() => setIsResetRotationOpen(false)}
      />
    </div>
  );
};
