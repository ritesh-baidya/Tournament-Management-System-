import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, 
  Key, Eye, EyeOff, Check, Radio
} from 'lucide-react';
import { Team, NotificationLog } from '../types';
import { PageId } from '../components/Sidebar';

interface DiscordNotificationsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const DiscordNotifications: React.FC<DiscordNotificationsProps> = ({ 
  onRefreshGlobalStats 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [botStatus, setBotStatus] = useState<{ isReady: boolean; botTag?: string; botId?: string }>({ isReady: false });
  const [botToken, setBotToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Message states
  const [targetRecipient, setTargetRecipient] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>(
    "🎉 Congratulations {captain_name}!\n\nYour team, {team_name}, has been selected for today's tournament match.\n\nPlease stay ready and keep an eye on your Discord messages for room details.\n\nGood luck! 🔥"
  );
  const [isSending, setIsSending] = useState(false);
  const [resultAlert, setResultAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleApplyTemplate = (type: 'selection' | 'room' | 'reminder') => {
    if (type === 'selection') {
      setMessageContent(
        "🎉 Congratulations {captain_name}!\n\nYour team, {team_name}, has been selected for today's tournament match.\n\nPlease stay ready and keep an eye on your Discord messages for room details.\n\nGood luck! 🔥"
      );
    } else if (type === 'room') {
      setMessageContent(
        "🔥 Match Room Details\n\nHello {captain_name} ({team_name})!\n\nRoom ID: 1234567\nPassword: 888\n\nPlease enter the room on time with your registered squad. Good luck! 🎮"
      );
    } else if (type === 'reminder') {
      setMessageContent(
        "⏰ Tournament Reminder\n\nHello {captain_name}!\n\nThis is a quick reminder that your team {team_name} is scheduled to play shortly. Please join Discord voice and ensure all squad members are online!"
      );
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [statusRes, teamsRes, logsRes, settingsRes] = await Promise.all([
        api.getDiscordStatus(),
        api.getAllTeams(),
        api.getNotificationLogs(),
        api.getSettings?.()
      ]);

      if (statusRes?.success && statusRes.data) {
        setBotStatus(statusRes.data);
      }

      if (teamsRes?.success && teamsRes.data) {
        setTeams(teamsRes.data);
        if (teamsRes.data.length > 0) {
          setTargetRecipient((prev) => {
            if (prev) return prev;
            const withDiscord = teamsRes.data.find((t: Team) => t.captain_discord_id && t.captain_discord_id.trim());
            return withDiscord ? withDiscord.id : teamsRes.data[0].id;
          });
        }
      }

      if (logsRes?.success && logsRes.data) {
        setLogs(logsRes.data);
      }

      if (settingsRes?.success && settingsRes.data?.discord_bot_token) {
        setBotToken(settingsRes.data.discord_bot_token);
      }
    } catch (err) {
      console.error('Failed to load Discord data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Token
  const handleSaveToken = async () => {
    if (!botToken.trim()) {
      setTokenFeedback({ type: 'error', message: 'Token cannot be empty' });
      return;
    }
    setSavingToken(true);
    setTokenFeedback(null);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const settRes = await api.getSettings?.();
      const current = settRes?.data || {};
      const res = await api.saveSettings({ ...current, discord_bot_token: botToken.trim() });
      if (res?.success) {
        setTokenFeedback({ type: 'success', message: 'Token saved' });
        setTimeout(() => setTokenFeedback(null), 3000);
        onRefreshGlobalStats();
      } else {
        setTokenFeedback({ type: 'error', message: res?.error || 'Failed to save token' });
      }
    } catch (err: any) {
      setTokenFeedback({ type: 'error', message: err.message || 'Error saving' });
    } finally {
      setSavingToken(false);
    }
  };

  // Test Bot Connection
  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      setTokenFeedback({ type: 'error', message: 'Enter a bot token first' });
      return;
    }
    setTestingBot(true);
    setTokenFeedback(null);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.testDiscordConnection(botToken.trim());
      if (res?.success) {
        setBotStatus({ isReady: true, botTag: res.botTag, botId: res.botId });
        setTokenFeedback({ type: 'success', message: `Connected as ${res.botTag || 'Bot'}` });
        onRefreshGlobalStats();
      } else {
        setTokenFeedback({ type: 'error', message: res?.error || 'Authentication failed' });
      }
    } catch (err: any) {
      setTokenFeedback({ type: 'error', message: err.message || 'Connection error' });
    } finally {
      setTestingBot(false);
    }
  };

  // Send Direct Message to selected Captain
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setResultAlert({ type: 'error', message: 'Message content cannot be empty.' });
      return;
    }

    const targetTeam = teams.find(t => t.id === targetRecipient);
    if (!targetTeam) {
      setResultAlert({ type: 'error', message: 'Please select a team captain.' });
      return;
    }

    if (!targetTeam.captain_discord_id || !targetTeam.captain_discord_id.trim()) {
      setResultAlert({ 
        type: 'error', 
        message: `Team "${targetTeam.team_name}" does not have a Discord User ID configured.` 
      });
      return;
    }

    const api = (window as any).electronAPI;
    if (!api) return;

    setIsSending(true);
    setResultAlert(null);

    try {
      const compiledMessage = messageContent
        .replace(/{captain_name}/gi, targetTeam.captain_name)
        .replace(/{team_name}/gi, targetTeam.team_name);

      const res = await api.sendDirectMessage(
        targetTeam.captain_discord_id,
        compiledMessage,
        targetTeam.id,
        targetTeam.captain_name,
        targetTeam.team_name
      );

      if (res?.success) {
        if (targetTeam?.id && (compiledMessage.toLowerCase().includes('room') || compiledMessage.toLowerCase().includes('pass'))) {
          if (api.updateTeamStatus) {
            await api.updateTeamStatus(targetTeam.id, 'playing', 'Room credentials DM sent');
          }
          window.dispatchEvent(new Event('teams-updated'));
        }
        setResultAlert({ 
          type: 'success', 
          message: `DM delivered to ${targetTeam.captain_name} (${targetTeam.team_name})` 
        });
      } else {
        setResultAlert({ 
          type: 'error', 
          message: `Failed to deliver DM: ${res?.error || 'Unknown error'}` 
        });
      }

      await loadData();
      onRefreshGlobalStats();
    } catch (err: any) {
      setResultAlert({ type: 'error', message: err.message || 'Error sending message' });
    } finally {
      setIsSending(false);
    }
  };


  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failCount = logs.filter(l => l.status === 'failed').length;
  const teamsWithDiscordCount = teams.filter(t => t.captain_discord_id && t.captain_discord_id.trim()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#090C14]">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Discord Integration</h1>
            <p className="text-xs text-slate-400">Bot status and direct messaging</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          botStatus.isReady 
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' 
            : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
        }`}>
          <span className={`w-2 h-2 rounded-full ${botStatus.isReady ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span>{botStatus.isReady ? `Bot Online (${botStatus.botTag || 'Active'})` : 'Bot Offline'}</span>
        </div>
      </div>

      {/* Top Grid: Bot Connection + Delivery Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bot Token Configuration */}
        <div className="lg:col-span-2 bg-[#121622] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-400" />
              Bot Token Configuration
            </span>
            {tokenFeedback && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                tokenFeedback.type === 'success' 
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' 
                  : 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
              }`}>
                {tokenFeedback.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                style={{ WebkitTextSecurity: showToken ? 'none' : 'disc' } as any}
                placeholder="Enter Discord Bot Token..."
                className="w-full pl-3.5 pr-10 py-2 bg-slate-900 border border-slate-700/70 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                title={showToken ? 'Mask Token' : 'Show Token'}
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingBot || !botToken.trim()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700/60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {testingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Test</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToken}
              disabled={savingToken || !botToken.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-indigo-600/30"
            >
              {savingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#121622] border border-slate-800 rounded-xl p-5 flex items-center justify-around">
          <div className="text-center">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Total DMs</span>
            <span className="text-xl font-bold text-slate-100">{logs.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <span className="text-[11px] text-emerald-400 uppercase tracking-wider block font-medium">Delivered</span>
            <span className="text-xl font-bold text-emerald-400">{sentCount}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <span className="text-[11px] text-rose-400 uppercase tracking-wider block font-medium">Failed</span>
            <span className="text-xl font-bold text-rose-400">{failCount}</span>
          </div>
        </div>
      </div>

      {/* Send Message Card */}
      <div className="bg-[#121622] border border-slate-800 rounded-xl p-6 space-y-4">
        {/* Header: Title + Select Captain */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-100">Send Direct Message</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Captain:</label>
            <select
              value={targetRecipient}
              onChange={(e) => setTargetRecipient(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors max-w-xs"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.team_name} — {t.captain_name} {t.captain_discord_id ? '' : '(No Discord ID)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-slate-400">Message</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Quick templates:</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('selection')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700/60 transition-colors"
                >
                  Selected
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('room')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700/60 transition-colors"
                >
                  Room Details
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('reminder')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700/60 transition-colors"
                >
                  Reminder
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type message to captain..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700/70 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y min-h-[120px] leading-relaxed"
            />

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="text-slate-500">Insert tag:</span>
              <button
                type="button"
                onClick={() => setMessageContent(prev => prev + ' {captain_name}')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded border border-slate-700/50"
              >
                {'{captain_name}'}
              </button>
              <button
                type="button"
                onClick={() => setMessageContent(prev => prev + ' {team_name}')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded border border-slate-700/50"
              >
                {'{team_name}'}
              </button>
            </div>
          </div>


        {/* Alert Feedback */}
        {resultAlert && (
          <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            resultAlert.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
              : resultAlert.type === 'error'
              ? 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
              : 'bg-blue-950/40 border border-blue-800/60 text-blue-300'
          }`}>
            {resultAlert.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {resultAlert.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            {resultAlert.type === 'info' && <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            <span>{resultAlert.message}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !messageContent.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/30 whitespace-nowrap"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending DM...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Direct Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
