import React, { useEffect, useState } from 'react';
import {
  Gamepad2, Send, CheckCircle2,
  Users, Key, Shield, AlertTriangle, ArrowRight,
  RefreshCw, Copy, Check, MessageSquare,
  Eye, EyeOff, RotateCcw, CheckSquare, Square,
  Trophy
} from 'lucide-react';
import { Match, Draw, DrawSelection, NotificationLog, TournamentStage } from '../types';
import { PageId } from '../components/Sidebar';
import { getLocalISODate, getLocalTimeString } from '../utils/helpers';

interface MatchManagementProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const MatchManagement: React.FC<MatchManagementProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form
  const [matchNumber, setMatchNumber] = useState<number>(1);
  const [matchStage, setMatchStage] = useState<TournamentStage>('qualifying');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [matchDate, setMatchDate] = useState<string>(() => getLocalISODate());
  const [matchTime, setMatchTime] = useState<string>(() => getLocalTimeString());
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Per-team match result: 'qualified' | 'eliminated' | 'completed'
  const [teamResults, setTeamResults] = useState<Record<string, 'qualified' | 'eliminated' | 'completed'>>({});

  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalShowPassword, setModalShowPassword] = useState(false);

  // Per-captain sending spinner
  const [sendingCaptainMap, setSendingCaptainMap] = useState<Record<string, boolean>>({});

  // Checked captains for targeted broadcast
  const [checkedCaptains, setCheckedCaptains] = useState<Set<string>>(new Set());

  // Real-time team status map
  const [teamStatusMap, setTeamStatusMap] = useState<Record<string, string>>({});

  const loadTeamsMap = async () => {
    try {
      const api = (window as any).electronAPI;
      if (api?.getAllTeams) {
        const res = await api.getAllTeams();
        if (res?.success && Array.isArray(res.data)) {
          const map: Record<string, string> = {};
          res.data.forEach((t: any) => {
            if (t.id) map[t.id] = t.status;
          });
          setTeamStatusMap(map);
        }
      }
    } catch (e) {
      console.error('Failed to load teams map:', e);
    }
  };

  const loadMatchData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [latestRes, drawRes, logsRes] = await Promise.all([
        api.getLatestMatch ? api.getLatestMatch() : Promise.resolve({ success: false }),
        api.getActiveDraw ? api.getActiveDraw() : Promise.resolve({ success: false }),
        api.getNotificationLogs ? api.getNotificationLogs() : Promise.resolve({ success: false, data: [] })
      ]);

      if (latestRes.success && latestRes.data) {
        const m: Match = latestRes.data;
        setCurrentMatch(m);
        setMatchNumber(m.match_number || 1);
        if (m.stage) setMatchStage(m.stage);
        setRoomId(m.room_id || '');
        setRoomPassword(m.room_password || '');
        setMatchDate(m.match_date || getLocalISODate());
        setMatchTime(m.match_time || getLocalTimeString());
        setAdditionalInstructions(m.additional_instructions || '');
      } else if (drawRes.success && drawRes.data) {
        setMatchNumber(drawRes.data.draw_number || 1);
        if (drawRes.data.stage) setMatchStage(drawRes.data.stage);
        setMatchDate(getLocalISODate());
        setMatchTime(getLocalTimeString());
      }

      if (drawRes.success && drawRes.data) {
        setActiveDraw(drawRes.data);
        if (drawRes.data.stage) setMatchStage(drawRes.data.stage);
        // default all checked
        const allIds = new Set<string>((drawRes.data.selections || []).map((s: DrawSelection) => s.id));
        setCheckedCaptains(allIds);
      }

      if (logsRes.success && Array.isArray(logsRes.data)) {
        setNotificationLogs(logsRes.data);
      }
      await loadTeamsMap();
    } catch (err) {
      console.error('Error loading match management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData();
    const handleTeamsUpdated = () => {
      loadTeamsMap();
    };
    window.addEventListener('teams-updated', handleTeamsUpdated);
    return () => window.removeEventListener('teams-updated', handleTeamsUpdated);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveDetails = async (silent = false) => {
    setIsSaving(true);
    if (!silent) setStatusMessage(null);
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.saveMatchDetails) return;
      const res = await api.saveMatchDetails({
        id: currentMatch?.id,
        draw_id: activeDraw?.id || currentMatch?.draw_id,
        match_number: matchNumber,
        stage: matchStage,
        room_id: roomId,
        room_password: roomPassword,
        match_date: matchDate || getLocalISODate(),
        match_time: matchTime || getLocalTimeString(),
        voice_channel_info: '',
        additional_instructions: additionalInstructions,
        admin_notes: ''
      });
      if (res.success) {
        setCurrentMatch(res.data);
        if (!silent) setStatusMessage({ text: 'Credentials saved!', type: 'success' });
        onRefreshGlobalStats();
      } else if (!silent) {
        setStatusMessage({ text: res.error || 'Failed to save', type: 'error' });
      }
    } catch (err: any) {
      if (!silent) setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoomPasswordStatus = (teamId: string): { status: 'sent' | 'failed' | 'not_sent'; error?: string } => {
    const logs = notificationLogs.filter(
      l => l.team_id === teamId && (l.type === 'room_password' || (l.type as any) === 'room_dm')
    );
    if (logs.length === 0) return { status: 'not_sent' };
    const latest = logs[0];
    return { status: latest.status === 'sent' ? 'sent' : 'failed', error: latest.error_message || undefined };
  };

  const getSelectionDMStatus = (sel: DrawSelection): { status: 'sent' | 'failed' | 'pending'; error?: string } => {
    if (sel.notification_status === 'sent') return { status: 'sent' };
    if (sel.notification_status === 'failed') return { status: 'failed', error: sel.notification_error || undefined };
    const logs = notificationLogs.filter(
      l => l.team_id === sel.team_id && (l.type === 'selection_congratulations' || (l.type as any) === 'selection_dm')
    );
    if (logs.length > 0) {
      const latest = logs[0];
      return { status: latest.status === 'sent' ? 'sent' : 'failed', error: latest.error_message || undefined };
    }
    return { status: 'pending' };
  };

  const refreshLogs = async () => {
    const api = (window as any).electronAPI;
    if (!api) return;
    const logsRes = await api.getNotificationLogs();
    if (logsRes?.success && Array.isArray(logsRes.data)) setNotificationLogs(logsRes.data);
  };

  const handleSendSingleRoomDM = async (sel: DrawSelection) => {
    if (!roomId.trim() || !roomPassword.trim()) { alert('Enter Room ID and Password first.'); return; }
    if (!sel.captain_discord_id) { alert(`No Discord ID for ${sel.captain_name}.`); return; }
    setSendingCaptainMap(prev => ({ ...prev, [sel.id]: true }));
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      await handleSaveDetails(true);
      const res = await api.sendRoomDM(sel.captain_discord_id, sel.captain_name, sel.team_name, sel.team_id, roomId.trim(), roomPassword.trim(), '', additionalInstructions.trim());
      if (res.success && sel.team_id && api.updateTeamStatus) {
        await api.updateTeamStatus(sel.team_id, 'playing', 'Room ID and password sent');
      }
      await refreshLogs();
      await loadTeamsMap();
      window.dispatchEvent(new Event('teams-updated'));
      setStatusMessage(res.success
        ? { text: `Delivered to ${sel.captain_name}! Status changed to Playing.`, type: 'success' }
        : { text: `Failed for ${sel.captain_name}: ${res.error}`, type: 'error' }
      );
      onRefreshGlobalStats();
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setSendingCaptainMap(prev => ({ ...prev, [sel.id]: false }));
    }
  };

  const handleRetrySelectionDM = async (sel: DrawSelection) => {
    if (!sel.captain_discord_id) { alert(`No Discord ID for ${sel.captain_name}.`); return; }
    setSendingCaptainMap(prev => ({ ...prev, [`sel_${sel.id}`]: true }));
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.sendSelectionDM(sel.id, sel.captain_discord_id, sel.captain_name, sel.team_name, sel.team_id, true);
      const [drawRes, logsRes] = await Promise.all([
        api.getActiveDraw ? api.getActiveDraw() : Promise.resolve({ success: false }),
        api.getNotificationLogs ? api.getNotificationLogs() : Promise.resolve({ success: false })
      ]);
      if (drawRes.success && drawRes.data) setActiveDraw(drawRes.data);
      if (logsRes.success && Array.isArray(logsRes.data)) setNotificationLogs(logsRes.data);
      setStatusMessage(res.success
        ? { text: `Selection DM resent to ${sel.captain_name}!`, type: 'success' }
        : { text: `Failed: ${res.error}`, type: 'error' }
      );
      onRefreshGlobalStats();
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setSendingCaptainMap(prev => ({ ...prev, [`sel_${sel.id}`]: false }));
    }
  };

  // Broadcast to all captains
  const handleBroadcastAll = async () => {
    if (!roomId.trim() || !roomPassword.trim()) { alert('Enter Room ID and Password first.'); return; }
    const targets = selections.filter(s => checkedCaptains.has(s.id));
    if (targets.length === 0) { alert('Select at least one captain first.'); return; }

    setIsBroadcasting(true);
    setBroadcastProgress({ current: 0, total: targets.length });
    setStatusMessage(null);
    setShowPreviewModal(false);

    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      await handleSaveDetails(true);
      let ok = 0; let fail = 0;
      const chunkSize = 3;
      for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (sel) => {
          if (!sel.captain_discord_id) { fail++; setBroadcastProgress(p => p ? { ...p, current: p.current + 1 } : null); return; }
          try {
            const res = await api.sendRoomDM(sel.captain_discord_id, sel.captain_name, sel.team_name, sel.team_id, roomId.trim(), roomPassword.trim(), '', additionalInstructions.trim());
            if (res.success) {
              ok++;
              if (sel.team_id && api.updateTeamStatus) {
                await api.updateTeamStatus(sel.team_id, 'playing', 'Room ID and password sent');
              }
            } else {
              fail++;
            }
          } catch { fail++; }
          finally { setBroadcastProgress(p => p ? { ...p, current: p.current + 1 } : null); }
        }));
        if (i + chunkSize < targets.length) await new Promise(r => setTimeout(r, 120));
      }
      await refreshLogs();
      await loadTeamsMap();
      window.dispatchEvent(new Event('teams-updated'));
      setStatusMessage({ text: `Broadcast done: ${ok} delivered (Playing), ${fail} failed.`, type: fail === 0 ? 'success' : 'error' });
      onRefreshGlobalStats();
    } catch (err: any) {
      setStatusMessage({ text: `Broadcast error: ${err.message}`, type: 'error' });
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  const handleCompleteMatch = async () => {
    if (!currentMatch && !activeDraw) { alert('No active match or draw to complete.'); return; }
    if (!confirm('Mark this match as complete? Match results and team participation will be permanently preserved in SQLite & Excel.')) return;
    setIsCompleting(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const matchId = currentMatch?.id || `match_${Date.now()}`;
      const participatingTeams = (activeDraw?.selections || []).map(s => ({
        team_id: s.team_id,
        actually_played: true,
        result: teamResults[s.team_id] || 'completed',
        notes: ''
      }));
      if (api.completeMatch) await api.completeMatch(matchId, participatingTeams, [], '');
      if (api.finalizeDraw && activeDraw?.id) {
        await api.finalizeDraw(activeDraw.id);
      }
      await loadTeamsMap();
      window.dispatchEvent(new Event('teams-updated'));
      setStatusMessage({ text: 'Match completed! Results and participation records safely preserved.', type: 'success' });
      onRefreshGlobalStats();
      setTimeout(() => onNavigate('match-history'), 1500);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const selections: DrawSelection[] = activeDraw?.selections || [];
  const selectedCount = selections.length;
  const roomSentCount = selections.filter(s => getRoomPasswordStatus(s.team_id).status === 'sent').length;
  const roomFailedCount = selections.filter(s => getRoomPasswordStatus(s.team_id).status === 'failed').length;
  const checkedCount = checkedCaptains.size;
  const allChecked = checkedCount === selectedCount && selectedCount > 0;

  const toggleCaptain = (id: string) => {
    setCheckedCaptains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allChecked) setCheckedCaptains(new Set());
    else setCheckedCaptains(new Set(selections.map(s => s.id)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-3">
        <RefreshCw size={18} className="animate-spin text-emerald-400" />
        <span className="text-sm">Loading match data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-white/5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Match Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">Match #{matchNumber}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
            <Gamepad2 className="text-emerald-400" size={26} />
            Match Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Set credentials · select captains · send Room Password via Discord.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={() => onNavigate('random-spin-wheel')} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
            <span>Spin Wheel</span><ArrowRight size={14} />
          </button>
          <button onClick={loadMatchData} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Status Alert ── */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-3 mb-6 ${
          statusMessage.type === 'success' ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="font-medium flex-1">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* ── Broadcast Progress Bar ── */}
      {broadcastProgress && (
        <div className="p-3 mb-5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs space-y-1.5">
          <div className="flex justify-between font-semibold text-indigo-300">
            <span>Sending Room Password…</span>
            <span className="font-mono">{broadcastProgress.current} / {broadcastProgress.total}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">

        {/* ── LEFT: Credentials Form ── */}
        <div className="lg:col-span-6 space-y-5">
          {/* form autoComplete=off stops Chromium autofill entirely */}
          <form autoComplete="off" onSubmit={e => e.preventDefault()} className="bg-[#121624] border border-white/5 rounded-2xl p-6 space-y-5">

            {/* Title + Match # + Stage */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Key size={16} className="text-emerald-400" />
                Room Credentials
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-400" />
                  <select
                    value={matchStage}
                    onChange={e => setMatchStage(e.target.value as TournamentStage)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700/60 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="qualifying">Qualifying</option>
                    <option value="quarter_final">Quarter-final</option>
                    <option value="semi_final">Semi-final</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Match #</span>
                  <input
                    type="number" min="1" value={matchNumber}
                    onChange={e => setMatchNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-14 px-2 py-1 bg-slate-900 border border-slate-700/60 rounded-lg text-xs text-slate-100 font-mono text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Room ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Room ID</label>
              <div className="relative">
                <input
                  type="text" value={roomId} onChange={e => setRoomId(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  name="ff-room-id"
                  placeholder="Enter Room ID"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                {roomId && (
                  <button type="button" onClick={() => copyToClipboard(roomId, 'rid')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer">
                    {copiedKey === 'rid' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* Room Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Room Password
              </label>
              <div className="relative">
                {/*
                  Always type="text" — Brave/Chrome password managers only intercept
                  type="password" fields. We mimic masking via -webkit-text-security.
                */}
                <input
                  type="text"
                  value={roomPassword} onChange={e => setRoomPassword(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  name="ff-room-pw"
                  placeholder="Enter Password"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
                  className="w-full px-3.5 py-2.5 pr-16 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {roomPassword && (
                    <button type="button" onClick={() => copyToClipboard(roomPassword, 'rpw')} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                      {copiedKey === 'rpw' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Captain Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Captain Instructions <span className="text-slate-600 font-normal">(optional)</span>
              </label>
               <textarea
                value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Action Buttons — row 1: Send Room Password */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  if (!roomId.trim() || !roomPassword.trim()) { alert('Enter Room ID and Password first.'); return; }
                  if (selections.length === 0) { alert('No captains in this match pool.'); return; }
                  setModalShowPassword(false);
                  setShowPreviewModal(true);
                }}
                disabled={isBroadcasting || selections.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/50 disabled:opacity-50"
              >
                <MessageSquare size={14} className="text-amber-300" />
                Send Room Password
              </button>
            </div>

            {/* Action Buttons — row 2: Complete Match */}
            <button
              type="button" onClick={handleCompleteMatch} disabled={isCompleting}
              className="w-full py-2.5 bg-purple-700/40 hover:bg-purple-600 border border-purple-600/40 hover:border-purple-500 text-purple-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isCompleting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Complete Match
            </button>
          </form>
        </div>

        {/* ── RIGHT: Captain List ── */}
        <div className="lg:col-span-6">
          <div className="bg-[#121624] border border-white/5 rounded-2xl p-5 space-y-3">

            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  Captains
                  <span className="text-xs font-normal text-slate-500">({selectedCount})</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Click to select · send individually or broadcast</p>
              </div>
              <div className="flex items-center gap-2">
                {roomFailedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors border border-rose-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Retry Failed ({roomFailedCount})
                  </button>
                )}
                <button
                  type="button" onClick={toggleAll}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {allChecked ? <CheckSquare size={13} className="text-emerald-400" /> : <Square size={13} className="text-slate-500" />}
                  {allChecked ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {selections.length > 0 ? (
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {selections.map((sel: DrawSelection, idx: number) => {
                  const roomPW = getRoomPasswordStatus(sel.team_id);
                  const isSendingThis = !!(sendingCaptainMap[sel.id]);
                  const isChecked = checkedCaptains.has(sel.id);

                  return (
                    <div
                      key={sel.id}
                      onClick={() => toggleCaptain(sel.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-2.5 text-xs ${
                        isChecked
                          ? 'bg-indigo-950/30 border-indigo-600/40'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0">
                        {isChecked
                          ? <CheckSquare size={15} className="text-indigo-400" />
                          : <Square size={15} className="text-slate-600" />
                        }
                      </div>

                      {/* Number */}
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                        {idx + 1}
                      </span>

                      {/* Name & Live Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white truncate text-xs">{sel.team_name}</span>
                          {(() => {
                            const currentStatus = teamStatusMap[sel.team_id] || (roomPW.status === 'sent' ? 'playing' : 'selected');
                            if (currentStatus === 'playing') {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-950/70 text-cyan-300 border border-cyan-700/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                  Playing
                                </span>
                              );
                            }
                            if (currentStatus === 'played') {
                              return (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-blue-950/70 text-blue-300 border border-blue-700/60">
                                  Played
                                </span>
                              );
                            }
                            return (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-amber-950/70 text-amber-300 border border-amber-700/60">
                                Selected
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sel.captain_name}
                          {sel.captain_discord_id
                            ? <span className="ml-1 text-[10px] font-mono text-cyan-400/80">@{sel.captain_discord_id}</span>
                            : <span className="ml-1 text-amber-400">(No Discord ID)</span>
                          }
                        </div>
                      </div>

                      {/* Send / Sent badge — stop click from toggling card */}
                      <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-1.5">
                        {/* Per-team result dropdown */}
                        <select
                          value={teamResults[sel.team_id] || 'completed'}
                          onChange={e => setTeamResults(prev => ({ ...prev, [sel.team_id]: e.target.value as 'qualified' | 'eliminated' | 'completed' }))}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border cursor-pointer focus:outline-none ${
                            teamResults[sel.team_id] === 'qualified' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' :
                            teamResults[sel.team_id] === 'eliminated' ? 'bg-rose-950/60 text-rose-300 border-rose-700/60' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          title="Set match result for this team"
                        >
                          <option value="completed" className="bg-[#121622] text-slate-300">Completed</option>
                          <option value="qualified" className="bg-[#121622] text-emerald-300">Qualified</option>
                          <option value="eliminated" className="bg-[#121622] text-rose-300">Eliminated</option>
                        </select>

                        {roomPW.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-lg">
                            <Check size={10} /> Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendSingleRoomDM(sel)}
                            disabled={isSendingThis || !roomId || !roomPassword}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              roomPW.status === 'failed'
                                ? 'text-rose-300 bg-rose-900/50 hover:bg-rose-700 border border-rose-700'
                                : 'text-slate-300 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:text-white'
                            }`}
                          >
                            {isSendingThis
                              ? <RefreshCw size={10} className="animate-spin" />
                              : roomPW.status === 'failed'
                                ? <><RotateCcw size={10} /> Retry</>
                                : <><Send size={10} /> Send</>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <Users size={28} className="mx-auto text-slate-600 mb-2" />
                <div className="font-semibold text-slate-300">No Squads Selected</div>
                <p className="text-[11px] text-slate-500">Spin the wheel to draw teams for this match.</p>
                <button onClick={() => onNavigate('random-spin-wheel')} className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  Go to Spin Wheel <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Minimal Confirmation Modal ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121624] border border-slate-700/80 rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Send size={15} className="text-indigo-400" />
                Send Room Password?
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Room ID</span>
                <span className="font-mono font-bold text-white">{roomId || '---'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Password</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                  <span>{modalShowPassword ? (roomPassword || '---') : (roomPassword ? '•'.repeat(roomPassword.length) : '---')}</span>
                  {roomPassword && (
                    <button
                      type="button"
                      onClick={() => setModalShowPassword(!modalShowPassword)}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={modalShowPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {modalShowPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Recipients</span>
                <span className="font-semibold text-slate-200">
                  {checkedCaptains.size || selectedCount} Captain{((checkedCaptains.size || selectedCount) !== 1) ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcastAll}
                disabled={isBroadcasting}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/50 transition-all"
              >
                {isBroadcasting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
