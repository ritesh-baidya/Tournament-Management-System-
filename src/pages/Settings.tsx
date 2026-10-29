import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, Shield, Key, Bell, Volume2, 
  VolumeX, Save, CheckCircle2, AlertCircle, Plus, Trash2, 
  RotateCcw, History, Lock, Radio 
} from 'lucide-react';
import { TournamentSettings, AuditLog } from '../types';
import { soundManager } from '../utils/audio';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface SettingsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [settings, setSettings] = useState<TournamentSettings>({
    tournament_name: 'Free Fire Championship 2026',
    rotation_policy: 'one_time',
    selection_target: 12,
    discord_bot_token: '',
    discord_guild_id: '',
    sound_enabled: true,
    rules: []
  });

  const [botTestResult, setBotTestResult] = useState<{ testing: boolean; success?: boolean; message?: string }>({ testing: false });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettingsAndLogs = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [settRes, logsRes] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs()
      ]);

      if (settRes.success && settRes.data) {
        setSettings(settRes.data);
      }

      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndLogs();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const api = (window as any).electronAPI;
      const res = await api.saveSettings(settings);
      if (res.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        soundManager.setMuted(!settings.sound_enabled);
        onRefreshGlobalStats();
        // Refresh audit logs
        const logsRes = await api.getAuditLogs();
        if (logsRes.success) setAuditLogs(logsRes.data);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const handleTestBotConnection = async () => {
    if (!settings.discord_bot_token) {
      setBotTestResult({ testing: false, success: false, message: 'Please enter a Discord Bot Token first.' });
      return;
    }

    setBotTestResult({ testing: true });
    try {
      const api = (window as any).electronAPI;
      const res = await api.testDiscordConnection(settings.discord_bot_token);
      if (res.success) {
        setBotTestResult({ 
          testing: false, 
          success: true, 
          message: `Connected successfully! Bot User: ${res.botTag} (ID: ${res.botId})` 
        });
      } else {
        setBotTestResult({ 
          testing: false, 
          success: false, 
          message: `Connection failed: ${res.error}` 
        });
      }
    } catch (err: any) {
      setBotTestResult({ testing: false, success: false, message: err.message });
    }
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setSettings({
      ...settings,
      rules: [...settings.rules, newRuleInput.trim()]
    });
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setSettings({
      ...settings,
      rules: settings.rules.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <SettingsIcon className="text-emerald-400" size={26} />
            SYSTEM CONFIGURATION & AUDIT LOGS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure rotation policies, manage secure Discord bot credentials, edit tournament rules, and review tamper-proof audit trails.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Save size={16} />
          <span>{isSaved ? 'Settings Saved!' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Grid: Tournament & Discord Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tournament Parameters */}
        <div className="esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading pb-2 border-b border-white/10 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            Tournament & Rotation Policy
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tournament Title
              </label>
              <input
                type="text"
                value={settings.tournament_name}
                onChange={(e) => setSettings({ ...settings, tournament_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Selection Target Count Per Draw
              </label>
              <input
                type="number"
                min={2}
                max={48}
                value={settings.selection_target}
                onChange={(e) => setSettings({ ...settings, selection_target: parseInt(e.target.value, 10) || 12 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 12 teams for standard Free Fire custom room lobbies.</span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Team Rotation Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                <label 
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                    settings.rotation_policy === 'one_time'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-900 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">One-Time Participation</span>
                    <input
                      type="radio"
                      name="rotation"
                      checked={settings.rotation_policy === 'one_time'}
                      onChange={() => setSettings({ ...settings, rotation_policy: 'one_time' })}
                      className="text-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Played teams are permanently excluded from subsequent draws until manual reset.
                  </span>
                </label>

                <label 
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                    settings.rotation_policy === 'recurring_cycle'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-900 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Recurring Cycle</span>
                    <input
                      type="radio"
                      name="rotation"
                      checked={settings.rotation_policy === 'recurring_cycle'}
                      onChange={() => setSettings({ ...settings, rotation_policy: 'recurring_cycle' })}
                      className="text-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Rotates teams in round-robin batches, resetting eligibility when pool empties.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sound_enabled}
                  onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-white/20"
                />
                <span className="font-semibold text-slate-300">
                  Enable Web Audio API Spin Ticks & Victory Fanfare
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Discord Bot Credentials */}
        <div className="esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading pb-2 border-b border-white/10 flex items-center gap-2">
              <Key size={16} className="text-teal-400" />
              Secure Discord Bot Integration
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Discord Bot Token (Stored Securely in SQLite)
                </label>
                <input
                  type="password"
                  placeholder="Paste bot token from Discord Developer Portal..."
                  value={settings.discord_bot_token}
                  onChange={(e) => setSettings({ ...settings, discord_bot_token: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tokens are never logged or exposed in renderer code. Minimum permissions: Direct Messages.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Tournament Server (Guild) ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293847"
                  value={settings.discord_guild_id || ''}
                  onChange={(e) => setSettings({ ...settings, discord_guild_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              {botTestResult.message && (
                <div className={`p-3 rounded-xl text-xs border ${
                  botTestResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {botTestResult.message}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onNavigate('discord-notifications')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
            >
              View Setup Tutorial
            </button>

            <button
              onClick={handleTestBotConnection}
              disabled={botTestResult.testing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Radio size={14} className={botTestResult.testing ? 'animate-spin' : ''} />
              <span>{botTestResult.testing ? 'Testing...' : 'Test Bot Connection'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Rules Configuration */}
      <div className="esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading pb-2 border-b border-white/10">
          Tournament Rules & Match Guidelines
        </h2>

        <div className="space-y-2">
          {settings.rules.map((rule, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-slate-200">{rule}</span>
              </div>
              <button
                onClick={() => handleRemoveRule(idx)}
                className="text-slate-400 hover:text-rose-400 p-1"
                title="Remove rule"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new rule */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Add new tournament rule..."
            value={newRuleInput}
            onChange={(e) => setNewRuleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleAddRule}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* SQLite Audit Trail View */}
      <div className="esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
            <History size={16} className="text-purple-400" />
            Administrative Audit Trail (Persistent SQLite)
          </h2>
          <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3 text-xs">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-purple-300 uppercase shrink-0">
                {log.action}
              </span>
              <div className="flex-1 truncate">
                <span className="text-slate-200 block truncate">{log.details}</span>
                <span className="text-[10px] text-slate-500">{formatDate(log.timestamp)}</span>
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No audit logs recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
