import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, MessageSquare, 
  CheckCircle2, XCircle, AlertCircle, Copy, Check,
  Send, RefreshCw, FileSpreadsheet, Plus, Trash2,
  UserPlus, Shield, X, Trophy, CheckSquare, Square,
  ArrowUpRight, History, Sparkles, ChevronRight
} from 'lucide-react';
import { Team, TeamStatus, Player, TournamentStage, QualificationStatus, MatchTeamParticipation } from '../types';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface AllTeamsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const AllTeams: React.FC<AllTeamsProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [participationFilter, setParticipationFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Multi-selection for bulk progression
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

  // Match History Modal
  const [historyModalTeam, setHistoryModalTeam] = useState<Team | null>(null);
  const [teamHistoryList, setTeamHistoryList] = useState<MatchTeamParticipation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Clear / Delete
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Quick DM Modal
  const [quickDmTeam, setQuickDmTeam] = useState<Team | null>(null);
  const [quickDmText, setQuickDmText] = useState('');
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [dmFeedback, setDmFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Squad / Player Management Modal
  const [squadModalTeam, setSquadModalTeam] = useState<Team | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<'captain' | 'player2' | 'player3' | 'player4' | 'substitute' | 'extra'>('substitute');
  const [newPlayerIsCaptain, setNewPlayerIsCaptain] = useState(false);
  const [newPlayerExtraInfo, setNewPlayerExtraInfo] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [playerFeedback, setPlayerFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  // Add Team Modal (simple 3 fields matching Excel)
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newDiscordUsername, setNewDiscordUsername] = useState('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [addTeamFeedback, setAddTeamFeedback] = useState<{ success: boolean; msg: string } | null>(null);

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
    const handleTeamsUpdated = () => fetchTeams();
    window.addEventListener('teams-updated', handleTeamsUpdated);
    return () => window.removeEventListener('teams-updated', handleTeamsUpdated);
  }, []);

  const handleCopyDiscordId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenQuickDm = (team: Team) => {
    setQuickDmTeam(team);
    setQuickDmText(
      `Hello ${team.captain_name}! Your team ${team.team_name} is registered for the tournament. Please keep an eye out for updates!`
    );
    setDmFeedback(null);
  };

  const handleSendQuickDm = async () => {
    if (!quickDmTeam || !quickDmTeam.captain_discord_id) return;
    setIsSendingDm(true);
    setDmFeedback(null);
    try {
      const api = (window as any).electronAPI;
      const res = await api.sendDirectMessage(
        quickDmTeam.captain_discord_id,
        quickDmText,
        quickDmTeam.id,
        quickDmTeam.captain_name,
        quickDmTeam.team_name
      );

      if (res.success) {
        setDmFeedback({ success: true, msg: 'DM sent successfully!' });
        setTimeout(() => {
          setQuickDmTeam(null);
        }, 1500);
      } else {
        setDmFeedback({ success: false, msg: res.error || 'Failed to send DM.' });
      }
      onRefreshGlobalStats();
    } catch (err: any) {
      setDmFeedback({ success: false, msg: err.message });
    } finally {
      setIsSendingDm(false);
    }
  };

  const handleClearAllTeams = async () => {
    setIsClearing(true);
    try {
      const api = (window as any).electronAPI;
      if (api && api.clearAllTeams) {
        await api.clearAllTeams();
        setTeams([]);
        onRefreshGlobalStats();
        window.dispatchEvent(new Event('teams-updated'));
      }
    } catch (err) {
      console.error('Failed to clear teams:', err);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.deleteTeam) {
        const res = await api.deleteTeam(teamId);
        if (res.success) {
          setTeams(prev => prev.filter(t => t.id !== teamId));
          onRefreshGlobalStats();
          window.dispatchEvent(new Event('teams-updated'));
        }
      }
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleUpdateStatus = async (teamId: string, newStatus: TeamStatus) => {
    setEditingStatusId(null);
    setUpdatingStatusId(teamId);
    try {
      const api = (window as any).electronAPI;
      if (api && api.updateTeamStatus) {
        const res = await api.updateTeamStatus(teamId, newStatus);
        if (res.success) {
          setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: newStatus } : t));
          onRefreshGlobalStats();
        }
      }
    } catch (err) {
      console.error('Failed to update team status:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };
  const handleUpdateQualification = async (teamId: string, newQual: QualificationStatus) => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.updateTeamQualification) {
        await api.updateTeamQualification(teamId, newQual);
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, qualification_status: newQual } : t));
        onRefreshGlobalStats();
      }
    } catch (err) {
      console.error('Failed to update qualification:', err);
    }
  };

  const handleAdvanceStage = async (teamId: string, nextStage: TournamentStage) => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.advanceTeamStage) {
        await api.advanceTeamStage(teamId, nextStage);
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, current_stage: nextStage, status: 'eligible' } : t));
        onRefreshGlobalStats();
      }
    } catch (err) {
      console.error('Failed to advance team stage:', err);
    }
  };

  const handleBatchAdvance = async (nextStage: TournamentStage) => {
    if (selectedTeamIds.size === 0) return;
    try {
      const api = (window as any).electronAPI;
      if (api && api.batchAdvanceTeamStage) {
        const ids = Array.from(selectedTeamIds);
        await api.batchAdvanceTeamStage(ids, nextStage);
        setTeams(prev => prev.map(t => selectedTeamIds.has(t.id) ? { ...t, current_stage: nextStage, status: 'eligible' } : t));
        setSelectedTeamIds(new Set());
        onRefreshGlobalStats();
      }
    } catch (err) {
      console.error('Failed batch advance:', err);
    }
  };

  const handleBatchQualification = async (status: QualificationStatus) => {
    if (selectedTeamIds.size === 0) return;
    try {
      const api = (window as any).electronAPI;
      if (api && api.batchUpdateTeamQualification) {
        const ids = Array.from(selectedTeamIds);
        await api.batchUpdateTeamQualification(ids, status);
        setTeams(prev => prev.map(t => selectedTeamIds.has(t.id) ? { ...t, qualification_status: status } : t));
        setSelectedTeamIds(new Set());
        onRefreshGlobalStats();
      }
    } catch (err) {
      console.error('Failed batch qualification:', err);
    }
  };

  const handleOpenTeamHistory = async (team: Team) => {
    setHistoryModalTeam(team);
    setLoadingHistory(true);
    try {
      const api = (window as any).electronAPI;
      if (api && api.getTeamMatchHistory) {
        const res = await api.getTeamMatchHistory(team.id);
        if (res && res.success) {
          setTeamHistoryList(res.data || []);
        } else {
          setTeamHistoryList([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team match history:', err);
      setTeamHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getNextStage = (stage?: TournamentStage): TournamentStage | null => {
    switch (stage) {
      case 'qualifying': return 'quarter_final';
      case 'quarter_final': return 'semi_final';
      case 'semi_final': return 'final';
      default: return null;
    }
  };

  const getStageLabel = (stage?: string): string => {
    switch (stage) {
      case 'qualifying': return 'Qualifying';
      case 'quarter_final': return 'Quarter-final';
      case 'semi_final': return 'Semi-final';
      case 'final': return 'Final';
      default: return 'Qualifying';
    }
  };

  const getStageBadgeColor = (stage?: string): string => {
    switch (stage) {
      case 'qualifying': return 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60';
      case 'quarter_final': return 'bg-indigo-950/50 text-indigo-300 border-indigo-800/60';
      case 'semi_final': return 'bg-amber-950/50 text-amber-300 border-amber-800/60';
      case 'final': return 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getQualBadgeColor = (qual?: string): string => {
    switch (qual) {
      case 'qualified': return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      case 'eliminated': return 'bg-rose-950/60 text-rose-300 border-rose-700/60';
      default: return 'bg-amber-950/40 text-amber-300 border-amber-700/50';
    }
  };

  const handleOpenSquadModal = (team: Team) => {
    setSquadModalTeam(team);
    setNewPlayerName('');
    setNewPlayerRole('substitute');
    setNewPlayerIsCaptain(false);
    setNewPlayerExtraInfo('');
    setPlayerFeedback(null);
  };

  const handleAddTeam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTeamName.trim() || !newCaptainName.trim()) {
      setAddTeamFeedback({ success: false, msg: 'Team Name and Captain Name are required.' });
      return;
    }

    setIsAddingTeam(true);
    setAddTeamFeedback(null);
    try {
      const api = (window as any).electronAPI;
      if (api?.addTeam) {
        const res = await api.addTeam(newTeamName.trim(), newCaptainName.trim(), newDiscordUsername.trim());
        if (res?.success) {
          setAddTeamFeedback({ success: true, msg: `Team "${newTeamName.trim()}" added & written to Excel sheet!` });
          setNewTeamName('');
          setNewCaptainName('');
          setNewDiscordUsername('');
          await fetchTeams();
          onRefreshGlobalStats();
          window.dispatchEvent(new Event('teams-updated'));
          setTimeout(() => {
            setShowAddTeamModal(false);
            setAddTeamFeedback(null);
          }, 1500);
        } else {
          setAddTeamFeedback({ success: false, msg: res?.error || 'Failed to add team.' });
        }
      }
    } catch (err: any) {
      setAddTeamFeedback({ success: false, msg: err.message || 'Error adding team.' });
    } finally {
      setIsAddingTeam(false);
    }
  };

  const handleAddPlayer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!squadModalTeam) return;
    if (!newPlayerName.trim()) {
      setPlayerFeedback({ success: false, msg: 'Please enter a player name.' });
      return;
    }

    setIsAddingPlayer(true);
    setPlayerFeedback(null);
    try {
      const api = (window as any).electronAPI;
      if (api?.addPlayer) {
        const res = await api.addPlayer(
          squadModalTeam.id,
          newPlayerName.trim(),
          newPlayerRole,
          newPlayerIsCaptain,
          newPlayerExtraInfo.trim()
        );

        if (res?.success) {
          setPlayerFeedback({ success: true, msg: `Player "${newPlayerName.trim()}" added successfully!` });
          setNewPlayerName('');
          setNewPlayerExtraInfo('');
          setNewPlayerIsCaptain(false);
          setNewPlayerRole('substitute');

          // Refresh team data
          const updatedTeamsRes = await api.getAllTeams?.();
          if (updatedTeamsRes?.success && updatedTeamsRes.data) {
            setTeams(updatedTeamsRes.data);
            const refreshedTeam = updatedTeamsRes.data.find((t: Team) => t.id === squadModalTeam.id);
            if (refreshedTeam) setSquadModalTeam(refreshedTeam);
          }
          onRefreshGlobalStats();
          window.dispatchEvent(new Event('teams-updated'));
        } else {
          setPlayerFeedback({ success: false, msg: res?.error || 'Failed to add player.' });
        }
      }
    } catch (err: any) {
      setPlayerFeedback({ success: false, msg: err.message || 'Error adding player.' });
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Remove this player from the squad?')) return;
    setDeletingPlayerId(playerId);
    try {
      const api = (window as any).electronAPI;
      if (api?.deletePlayer) {
        const res = await api.deletePlayer(playerId);
        if (res?.success) {
          const updatedTeamsRes = await api.getAllTeams?.();
          if (updatedTeamsRes?.success && updatedTeamsRes.data) {
            setTeams(updatedTeamsRes.data);
            if (squadModalTeam) {
              const refreshedTeam = updatedTeamsRes.data.find((t: Team) => t.id === squadModalTeam.id);
              if (refreshedTeam) setSquadModalTeam(refreshedTeam);
            }
          }
          onRefreshGlobalStats();
          window.dispatchEvent(new Event('teams-updated'));
        }
      }
    } catch (err: any) {
      alert(`Error deleting player: ${err.message}`);
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = 
      t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.captain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.captain_discord_id && t.captain_discord_id.includes(searchQuery));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Stage filter
    if (stageFilter !== 'all') {
      const currentStage = t.current_stage || 'qualifying';
      if (currentStage !== stageFilter) return false;
    }

    // Qualification filter
    if (qualificationFilter !== 'all') {
      const qualStatus = t.qualification_status || 'pending';
      if (qualStatus !== qualificationFilter) return false;
    }

    // Match participation filter
    if (participationFilter === 'played') {
      if (!t.matches_played_count || t.matches_played_count === 0) return false;
    } else if (participationFilter === 'unplayed') {
      if (t.matches_played_count && t.matches_played_count > 0) return false;
    }

    return true;
  });

  const toggleSelectTeam = (id: string) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedTeamIds.size === filteredTeams.length && filteredTeams.length > 0) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(filteredTeams.map(t => t.id)));
    }
  };

  const getStatusColor = (status: TeamStatus) => {
    switch (status) {
      case 'eligible':      return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
      case 'selected':      return 'bg-indigo-950/40 text-indigo-400 border-indigo-800/50';
      case 'playing':       return 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50';
      case 'played':        return 'bg-slate-800 text-slate-400 border-slate-700/60';
      case 'withdrawn':     return 'bg-amber-950/40 text-amber-400 border-amber-800/50';
      case 'disqualified':  return 'bg-rose-950/40 text-rose-400 border-rose-800/50';
      default:              return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-hidden p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            All Teams
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View imported tournament teams and their captain Discord IDs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewTeamName('');
              setNewCaptainName('');
              setNewDiscordUsername('');
              setAddTeamFeedback(null);
              setShowAddTeamModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-sm font-medium transition-all border border-blue-500/30 cursor-pointer"
            title="Add a player / team directly to Excel and Database"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
          {teams.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-sm font-medium transition-all border border-rose-500/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Teams</span>
          </button>
          <button
            onClick={fetchTeams}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Refresh Teams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team name, captain name, or Discord ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#121622] border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage filter */}
            <div className="flex items-center gap-1.5 bg-[#121622] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121622] text-slate-200">All Stages</option>
                <option value="qualifying" className="bg-[#121622] text-slate-200">Qualifying</option>
                <option value="quarter_final" className="bg-[#121622] text-slate-200">Quarter-final</option>
                <option value="semi_final" className="bg-[#121622] text-slate-200">Semi-final</option>
                <option value="final" className="bg-[#121622] text-slate-200">Final</option>
              </select>
            </div>

            {/* Qualification filter */}
            <div className="flex items-center gap-1.5 bg-[#121622] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121622] text-slate-200">All Qualifications</option>
                <option value="pending" className="bg-[#121622] text-slate-200">Pending</option>
                <option value="qualified" className="bg-[#121622] text-slate-200">Qualified</option>
                <option value="eliminated" className="bg-[#121622] text-slate-200">Eliminated</option>
              </select>
            </div>

            {/* Participation filter */}
            <div className="flex items-center gap-1.5 bg-[#121622] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={participationFilter}
                onChange={(e) => setParticipationFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121622] text-slate-200">All Matches</option>
                <option value="played" className="bg-[#121622] text-slate-200">Played In Match</option>
                <option value="unplayed" className="bg-[#121622] text-slate-200">Unplayed</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-[#121622] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121622] text-slate-200">All Statuses</option>
                <option value="eligible" className="bg-[#121622] text-slate-200">Eligible</option>
                <option value="selected" className="bg-[#121622] text-slate-200">Selected</option>
                <option value="playing" className="bg-[#121622] text-slate-200">Playing</option>
                <option value="played" className="bg-[#121622] text-slate-200">Played</option>
                <option value="withdrawn" className="bg-[#121622] text-slate-200">Withdrawn</option>
                <option value="disqualified" className="bg-[#121622] text-slate-200">Disqualified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedTeamIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span>{selectedTeamIds.size} team{selectedTeamIds.size > 1 ? 's' : ''} selected</span>
              <button
                type="button"
                onClick={() => setSelectedTeamIds(new Set())}
                className="ml-2 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Batch Qualification:</span>
              <button
                type="button"
                onClick={() => handleBatchQualification('qualified')}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Qualified</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchQualification('eliminated')}
                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Mark Eliminated</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchQualification('pending')}
                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Mark Pending
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <span className="text-[11px] text-slate-400 font-medium">Advance To:</span>
              <button
                type="button"
                onClick={() => handleBatchAdvance('quarter_final')}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Quarter-final
              </button>
              <button
                type="button"
                onClick={() => handleBatchAdvance('semi_final')}
                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Semi-final
              </button>
              <button
                type="button"
                onClick={() => handleBatchAdvance('final')}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Final
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#121622] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm">Loading teams...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Users className="w-10 h-10 text-slate-600" />
            <p className="text-sm">No teams found matching your search or filters.</p>
            {teams.length === 0 && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Import Excel Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title={selectedTeamIds.size === filteredTeams.length ? "Deselect all" : "Select all filtered"}
                    >
                      {selectedTeamIds.size > 0 && selectedTeamIds.size === filteredTeams.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Discord User ID</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeams.map((team, idx) => (
                  <tr 
                    key={team.id} 
                    className={`hover:bg-slate-800/30 transition-colors ${selectedTeamIds.has(team.id) ? 'bg-blue-950/20' : ''}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectTeam(team.id)}
                        className="text-slate-400 hover:text-blue-400 cursor-pointer"
                      >
                        {selectedTeamIds.has(team.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {team.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {team.captain_name}
                      {team.captain_phone && (
                        <span className="text-xs text-slate-500 block">{team.captain_phone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {team.captain_discord_id ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-700/60 rounded text-xs font-mono text-indigo-300">
                          <span>{team.captain_discord_id}</span>
                          <button
                            onClick={() => handleCopyDiscordId(team.captain_discord_id!)}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === team.captain_discord_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-400/80 italic flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </td>

                    {/* Stage selector */}
                    <td className="py-3 px-4">
                      <select
                        value={team.current_stage || 'qualifying'}
                        onChange={(e) => handleAdvanceStage(team.id, e.target.value as TournamentStage)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none ${getStageBadgeColor(team.current_stage)}`}
                        title="Change Tournament Stage"
                      >
                        <option value="qualifying" className="bg-[#121622] text-cyan-300">Qualifying</option>
                        <option value="quarter_final" className="bg-[#121622] text-indigo-300">Quarter-final</option>
                        <option value="semi_final" className="bg-[#121622] text-amber-300">Semi-final</option>
                        <option value="final" className="bg-[#121622] text-emerald-300">Final</option>
                      </select>
                    </td>

                    {/* Qualification status selector */}
                    <td className="py-3 px-4">
                      <select
                        value={team.qualification_status || 'pending'}
                        onChange={(e) => handleUpdateQualification(team.id, e.target.value as QualificationStatus)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none capitalize ${getQualBadgeColor(team.qualification_status)}`}
                        title="Change Qualification Status"
                      >
                        <option value="pending" className="bg-[#121622] text-amber-300">Pending</option>
                        <option value="qualified" className="bg-[#121622] text-emerald-300">Qualified</option>
                        <option value="eliminated" className="bg-[#121622] text-rose-300">Eliminated</option>
                      </select>
                    </td>

                    {/* Matches played & history button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenTeamHistory(team)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
                        title="Click to view match participation history"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{team.matches_played_count ?? 0}</span>
                        {team.last_match_result && (
                          <span className={`text-[10px] px-1 rounded uppercase font-bold ${
                            team.last_match_result === 'qualified' ? 'text-emerald-400' :
                            team.last_match_result === 'eliminated' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            ({team.last_match_result})
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Operational Status */}
                    <td className="py-3 px-4">
                      {updatingStatusId === team.id ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusColor(team.status)}`}>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Saving…
                        </span>
                      ) : editingStatusId === team.id ? (
                        <select
                          autoFocus
                          value={team.status}
                          onChange={e => handleUpdateStatus(team.id, e.target.value as TeamStatus)}
                          onBlur={() => setEditingStatusId(null)}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-medium border border-blue-500 bg-slate-900 text-slate-100 focus:outline-none cursor-pointer"
                        >
                          <option value="eligible">Eligible</option>
                          <option value="selected">Selected</option>
                          <option value="playing">Playing</option>
                          <option value="played">Played</option>
                          <option value="withdrawn">Withdrawn</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingStatusId(team.id)}
                          title="Click to change status"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer hover:opacity-80 transition-opacity capitalize ${getStatusColor(team.status)}`}
                        >
                          {team.status}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {team.qualification_status === 'qualified' && getNextStage(team.current_stage) && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(team.id, getNextStage(team.current_stage)!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
                            title={`Advance to ${getStageLabel(getNextStage(team.current_stage)!)}`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Advance</span>
                          </button>
                        )}

                        {team.captain_discord_id ? (
                          <button
                            onClick={() => handleOpenQuickDm(team)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-medium transition-all"
                            title="Send Discord Direct Message"
                          >
                            <Send className="w-3 h-3" />
                            <span className="hidden sm:inline">DM</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Delete team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] border border-slate-700/60 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">Clear All Teams?</h3>
            </div>
            <p className="text-sm text-slate-400">
              This will permanently remove all {teams.length} teams from the database. You can re-import them from your Excel file afterwards.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllTeams}
                disabled={isClearing}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {isClearing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Clearing...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, Clear All</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick DM Modal */}
      {quickDmTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] border border-slate-700/60 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-slate-100">
                  Send DM to {quickDmTeam.captain_name} ({quickDmTeam.team_name})
                </h3>
              </div>
              <button
                onClick={() => setQuickDmTeam(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div>Discord ID: <span className="font-mono text-indigo-300">{quickDmTeam.captain_discord_id}</span></div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Message Content
              </label>
              <textarea
                rows={4}
                value={quickDmText}
                onChange={(e) => setQuickDmText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {dmFeedback && (
              <div className={`p-2.5 rounded text-xs ${
                dmFeedback.success ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800' : 'bg-rose-950/40 text-rose-300 border border-rose-800'
              }`}>
                {dmFeedback.msg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickDmTeam(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendQuickDm}
                disabled={isSendingDm}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {isSendingDm ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Squad & Player Management Modal */}
      {squadModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] border border-slate-700/70 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">{squadModalTeam.team_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getStatusColor(squadModalTeam.status)}`}>
                      {squadModalTeam.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Leader: <span className="text-slate-300 font-medium">{squadModalTeam.captain_name}</span>
                    {squadModalTeam.captain_discord_id && (
                      <span className="ml-2 font-mono text-cyan-400">(@{squadModalTeam.captain_discord_id})</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSquadModalTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Select Team Dropdown (if multiple teams and user wants to switch team inside modal) */}
              {teams.length > 1 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
                    Switch Squad
                  </label>
                  <select
                    value={squadModalTeam.id}
                    onChange={(e) => {
                      const t = teams.find(x => x.id === e.target.value);
                      if (t) handleOpenSquadModal(t);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.team_name} ({t.captain_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Players List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-400" />
                    Current Squad Players ({(squadModalTeam.players || []).length})
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(squadModalTeam.players && squadModalTeam.players.length > 0) ? (
                    squadModalTeam.players.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white">{p.player_name}</span>
                            {p.extra_info && (
                              <span className="text-[10px] text-slate-400 font-mono ml-2">
                                [UID: {p.extra_info}]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            p.is_captain || p.role === 'captain'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {p.is_captain ? 'Captain' : p.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p.id)}
                            disabled={deletingPlayerId === p.id}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove player"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500">
                      No squad members registered yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Player Form */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-3">
                  <UserPlus size={14} className="text-emerald-400" />
                  Add New Player to Squad
                </span>

                <form onSubmit={handleAddPlayer} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Player Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="e.g. ToxicSniper"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Role
                      </label>
                      <select
                        value={newPlayerRole}
                        onChange={(e) => setNewPlayerRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="substitute">Substitute</option>
                        <option value="player2">Player 2</option>
                        <option value="player3">Player 3</option>
                        <option value="player4">Player 4</option>
                        <option value="extra">Extra Member</option>
                        <option value="captain">Captain</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      In-Game UID / Info (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPlayerExtraInfo}
                      onChange={(e) => setNewPlayerExtraInfo(e.target.value)}
                      placeholder="e.g. 1938472918"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isCaptainCheck"
                      checked={newPlayerIsCaptain}
                      onChange={(e) => setNewPlayerIsCaptain(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isCaptainCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                      Set as Team Captain / Leader
                    </label>
                  </div>

                  {playerFeedback && (
                    <div className={`p-2.5 rounded-lg text-xs ${
                      playerFeedback.success
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                    }`}>
                      {playerFeedback.msg}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isAddingPlayer || !newPlayerName.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      {isAddingPlayer ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Adding Player...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Add Player to Squad</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal (Only 3 fields: Team Name, Captain Name, Discord Username) */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#161c2c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Player</h3>
                  <p className="text-xs text-slate-400">Directly written into Excel sheet &amp; database</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setAddTeamFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddTeam} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Team Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Phoenix Esports"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Captain Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCaptainName}
                  onChange={(e) => setNewCaptainName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Discord Username
                </label>
                <input
                  type="text"
                  value={newDiscordUsername}
                  onChange={(e) => setNewDiscordUsername(e.target.value)}
                  placeholder="e.g. alex_hunter#1234 or User ID"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for Discord notifications &amp; room pass delivery</p>
              </div>

              {addTeamFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    addTeamFeedback.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
                  }`}
                >
                  {addTeamFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{addTeamFeedback.msg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeamModal(false);
                    setAddTeamFeedback(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingTeam || !newTeamName.trim() || !newCaptainName.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {isAddingTeam ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Excel...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save &amp; Write to Excel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Team Match History Modal */}
      {historyModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#161c2c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{historyModalTeam.team_name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getStageBadgeColor(historyModalTeam.current_stage)}`}>
                      {getStageLabel(historyModalTeam.current_stage)}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${getQualBadgeColor(historyModalTeam.qualification_status)}`}>
                      {historyModalTeam.qualification_status || 'Pending'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Captain: {historyModalTeam.captain_name} {historyModalTeam.captain_discord_id && `(${historyModalTeam.captain_discord_id})`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalTeam(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm">Loading match history...</span>
                </div>
              ) : teamHistoryList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <History className="w-8 h-8 text-slate-600" />
                  <p className="text-sm">No matches recorded yet for this team.</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Match records and participation details are preserved permanently once a match is completed in Match Management.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Match #</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Result</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {teamHistoryList.map((hist, idx) => (
                        <tr key={hist.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-300">
                            #{hist.match_number || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStageBadgeColor(hist.stage)}`}>
                              {getStageLabel(hist.stage)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {formatDate(hist.match_date || hist.created_at)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              hist.result === 'qualified' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' :
                              hist.result === 'eliminated' ? 'bg-rose-950/60 text-rose-300 border-rose-700/60' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {hist.result || 'Completed'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                            {hist.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#161c2c]">
              <div className="text-xs text-slate-400">
                Total matches participated: <span className="font-semibold text-slate-200">{teamHistoryList.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalTeam(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
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
