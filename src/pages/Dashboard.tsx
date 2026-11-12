import React, { useEffect, useState, useRef } from 'react';
import {
  Users, CheckCircle2, Dices, Trophy, Send,
  Upload, RefreshCw, ArrowRight,
  Check, Copy, Gamepad2, Eye, EyeOff, Play
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DashboardStats, Match } from '../types';
import { PageId } from '../components/Sidebar';
import { formatLocalDate, formatLocalTime } from '../utils/helpers';

const HEADER_MAP: Record<string, string[]> = {
  team_name: [
    'team name', 'team', 'team_name', 'squad name', 'squad', 'teamname', 'squad_name', 'teams', 'team_title'
  ],
  captain_name: [
    'captain name', 'captain', 'leader', 'captain_name', 'leader name', 'leader_name', 'igl', 'player 1', 'player1', 'name'
  ],
  captain_phone: [
    'captain phone number', 'captain phone', 'phone number', 'phone', 'mobile number', 
    'mobile', 'contact', 'whatsapp', 'captain mobile', 'captain_phone'
  ],
  captain_discord_id: [
    'captain discord user id', 'captain discord id', 'discord user id', 'discord id', 
    'discord uid', 'captain discord', 'discord_id', 'discord_user_id', 'discord',
    'discord username', 'captain discord username', 'discord tag', 'discord handle',
    'discord name', 'discord_username', 'username', 'captain discord name', 'discord user'
  ]
};

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [discordStatus, setDiscordStatus] = useState<{ isReady: boolean; botTag?: string }>({ isReady: false });
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ count: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [statsRes, discordRes, matchRes] = await Promise.all([
        api.getDashboardStats ? api.getDashboardStats() : Promise.resolve({ success: false }),
        api.getDiscordStatus ? api.getDiscordStatus() : Promise.resolve({ success: false }),
        api.getLatestMatch ? api.getLatestMatch() : Promise.resolve({ success: false })
      ]);

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
        if (statsRes.data.latest_match) {
          setCurrentMatch(statsRes.data.latest_match);
        }
      }

      if (discordRes?.success) {
        setDiscordStatus(discordRes.data || { isReady: false });
      }

      if (matchRes?.success && matchRes.data) {
        setCurrentMatch(matchRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 15000);
    const handleUpdate = () => loadData(true);
    window.addEventListener('teams-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('teams-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('No sheets found in workbook.');

      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
      if (!rawData || rawData.length === 0) throw new Error('Excel file is empty.');

      // Find header row in first 5 rows
      let headerRowIndex = 0;
      let colToField: Record<number, string> = {};

      for (let r = 0; r < Math.min(rawData.length, 5); r++) {
        const candidateHeaders = (rawData[r] as any[] || []).map(h => String(h || '').trim());
        const candidateMap: Record<number, string> = {};
        candidateHeaders.forEach((h, idx) => {
          if (!h) return;
          const norm = h.toLowerCase().trim().replace(/[\-_/\\()]/g, ' ').replace(/\s+/g, ' ');
          for (const [field, aliases] of Object.entries(HEADER_MAP)) {
            if (aliases.includes(norm)) {
              candidateMap[idx] = field;
              break;
            }
          }
          if (!candidateMap[idx]) {
            if (norm.includes('discord')) candidateMap[idx] = 'captain_discord_id';
            else if (norm.includes('team') || norm.includes('squad')) candidateMap[idx] = 'team_name';
            else if (norm.includes('captain') || norm.includes('leader') || norm.includes('igl')) {
              if (norm.includes('phone') || norm.includes('mobile') || norm.includes('whatsapp') || norm.includes('contact')) candidateMap[idx] = 'captain_phone';
              else candidateMap[idx] = 'captain_name';
            }
            else if (norm.includes('phone') || norm.includes('mobile') || norm.includes('whatsapp')) candidateMap[idx] = 'captain_phone';
          }
        });
        if (Object.keys(candidateMap).length >= 1) {
          headerRowIndex = r;
          colToField = candidateMap;
          break;
        }
      }

      if (Object.keys(colToField).length === 0) {
        colToField[0] = 'team_name';
        colToField[1] = 'captain_name';
        colToField[2] = 'captain_discord_id';
        headerRowIndex = -1;
      }

      const rows: any[] = [];
      const startRow = headerRowIndex + 1;
      for (let r = startRow; r < rawData.length; r++) {
        const rowArr = rawData[r] as any[];
        if (!rowArr || rowArr.length === 0 || rowArr.every(c => c === undefined || c === null || String(c).trim() === '')) {
          continue;
        }

        const rowObj: any = {
          team_name: '',
          captain_name: '',
          captain_discord_id: '',
          captain_phone: '',
          extra_columns: {}
        };

        Object.entries(colToField).forEach(([idxStr, field]) => {
          const idx = parseInt(idxStr, 10);
          let val = '';
          if (rowArr[idx] !== undefined && rowArr[idx] !== null) {
            if (typeof rowArr[idx] === 'number' && rowArr[idx] > 1e16) {
              val = BigInt(Math.round(rowArr[idx])).toString();
            } else {
              val = String(rowArr[idx]).trim();
            }
          }
          rowObj[field] = val;
        });

        if (!rowObj.captain_discord_id) {
          rowArr.forEach((cellVal) => {
            let str = '';
            if (typeof cellVal === 'number' && cellVal > 1e16) {
              str = BigInt(Math.round(cellVal)).toString();
            } else if (typeof cellVal === 'string') {
              str = cellVal.trim();
            }
            if (/^\d{17,20}$/.test(str)) {
              rowObj.captain_discord_id = str;
            }
          });
        }

        if (rowObj.team_name || rowObj.captain_name) {
          rows.push(rowObj);
        }
      }

      if (rows.length === 0) {
        alert('No valid team rows found in the uploaded file.');
        return;
      }

      const api = (window as any).electronAPI;
      if (api?.commitExcelImport) {
        const res = await api.commitExcelImport(rows, 'replace');
        if (res?.success) {
          const count = res.data?.inserted ?? rows.length;
          setImportSuccess({ count, name: file.name });
          onRefreshGlobalStats();
          await loadData();
          window.dispatchEvent(new Event('teams-updated'));
          setTimeout(() => {
            setImportSuccess(null);
          }, 2000);
        } else {
          alert(`Import failed: ${res?.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const totalTeams = stats?.total_teams ?? 0;
  const eligibleTeams = stats?.eligible_teams ?? 0;
  const selectedTeams = stats?.selected_teams ?? 0;
  const playedTeams = stats?.played_teams ?? 0;
  const notifSent = stats?.notifications_sent ?? 0;
  const notifFailed = stats?.notifications_failed ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full text-slate-100 relative">
      {/* 2-Second Success Popup Notification */}
      {importSuccess && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/60 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Teams Imported Successfully!</h4>
              <p className="text-[11px] text-slate-300">
                Loaded <span className="font-bold text-white font-mono">{importSuccess.count}</span> squads from{' '}
                <span className="font-medium text-emerald-300">{importSuccess.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-xs text-slate-400">Tournament overview & real-time status</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Discord Bot Status Pill */}
          <button
            onClick={() => onNavigate('discord-notifications')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-xs cursor-pointer"
            title="View Discord Integration"
          >
            <span className={`w-2 h-2 rounded-full ${discordStatus.isReady ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className={discordStatus.isReady ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {discordStatus.isReady ? `Bot Online (${discordStatus.botTag || 'Active'})` : 'Bot Offline'}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => { loadData(); onRefreshGlobalStats(); }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
        </div>
      </div>

      {/* 5 Essential Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Teams */}
        <div
          onClick={() => onNavigate('all-teams')}
          className="p-4 rounded-xl bg-[#121622] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Total Teams</span>
            <Users size={15} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalTeams}</div>
        </div>

        {/* Available Teams */}
        <div
          onClick={() => onNavigate('all-teams')}
          className="p-4 rounded-xl bg-[#121622] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Available</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{eligibleTeams}</div>
        </div>

        {/* Selected Teams */}
        <div
          onClick={() => onNavigate('match-management')}
          className="p-4 rounded-xl bg-[#121622] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">In Match</span>
            <Dices size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{selectedTeams}</div>
        </div>

        {/* Played Teams */}
        <div
          onClick={() => onNavigate('match-history')}
          className="p-4 rounded-xl bg-[#121622] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Played</span>
            <Trophy size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{playedTeams}</div>
        </div>

        {/* Discord Delivery */}
        <div
          onClick={() => onNavigate('discord-notifications')}
          className="p-4 rounded-xl bg-[#121622] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">DMs Sent</span>
            <Send size={15} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{notifSent}</span>
            {notifFailed > 0 && (
              <span className="text-[11px] font-semibold text-rose-400">({notifFailed} failed)</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Active Match Overview & Separate Import Teams Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Match Card (8 cols) */}
        <div className="lg:col-span-8 bg-[#121622] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Gamepad2 size={16} className="text-indigo-400" />
              Active Match
            </span>
            {currentMatch && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                currentMatch.status === 'completed'
                  ? 'bg-purple-950/40 text-purple-400 border border-purple-800/40'
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
              }`}>
                {currentMatch.status}
              </span>
            )}
          </div>

          {currentMatch ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Match Number:</span>
                  <span className="text-slate-200 font-bold font-mono ml-1.5">#{currentMatch.match_number}</span>
                </div>
                <div className="text-slate-400">
                  Time: <span className="text-indigo-400 font-semibold">
                    {currentMatch.match_time || (currentMatch.completed_at ? formatLocalTime(currentMatch.completed_at) : (currentMatch.created_at ? formatLocalTime(currentMatch.created_at) : 'Local Time'))}
                  </span>
                </div>
              </div>

              {/* Room ID and Masked Password Details */}
              <div className="grid grid-cols-2 gap-3">
                {/* Room ID */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Room ID</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {currentMatch.room_id || 'Not set'}
                    </span>
                  </div>
                  {currentMatch.room_id && (
                    <button
                      onClick={() => copyToClipboard(currentMatch.room_id, 'room_id')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy Room ID"
                    >
                      {copiedKey === 'room_id' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Masked Password with Show/Hide toggle */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Password</span>
                    <span className="text-sm font-mono font-bold text-white tracking-wider">
                      {currentMatch.room_password
                        ? (showPassword ? currentMatch.room_password : '•'.repeat(currentMatch.room_password.length))
                        : 'Not set'}
                    </span>
                  </div>
                  {currentMatch.room_password && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(currentMatch.room_password, 'room_pwd')}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Copy Password"
                      >
                        {copiedKey === 'room_pwd' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onNavigate('match-management')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/20"
                >
                  <span>Open Match Management</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs text-slate-400">No active match scheduled currently.</p>
              <button
                onClick={() => onNavigate('random-spin-wheel')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/20"
              >
                <Play size={13} />
                <span>Spin Wheel & Setup Match</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Import Teams (Excel) Card (4 cols) */}
        <div className="lg:col-span-4 bg-[#121622] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-slate-800/70 pb-3 mb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Upload size={15} className="text-blue-400" />
                Import Teams
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your squad roster Excel (<code className="text-slate-300 font-mono text-[11px]">.xlsx</code>) or CSV file. Teams and players will be imported and ready for selection.
            </p>
          </div>

          <button
            onClick={handleImportExcel}
            disabled={isImporting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            {isImporting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Importing Teams...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Import Teams (Excel)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
