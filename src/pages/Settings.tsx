import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, Shield, Key, 
  Save, CheckCircle2, AlertCircle, Trash2, 
  RefreshCw, Radio, ExternalLink, HelpCircle
} from 'lucide-react';
import { TournamentSettings } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface SettingsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [settings, setSettings] = useState<TournamentSettings>({
    tournament_name: 'Free Fire Championship',
    rotation_policy: 'one_time',
    selection_target: 12,
    discord_bot_token: '',
    discord_guild_id: '',
    sound_enabled: false,
    rules: []
  });

  const [botTestResult, setBotTestResult] = useState<{ 
    testing: boolean; 
    success?: boolean; 
    message?: string 
  }>({ testing: false });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const settRes = await api.getSettings();
      if (settRes.success && settRes.data) {
        setSettings(settRes.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.saveSettings(settings);
      if (res.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
        onRefreshGlobalStats();
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const handleTestBotConnection = async () => {
    if (!settings.discord_bot_token || !settings.discord_bot_token.trim()) {
      setBotTestResult({ 
        testing: false, 
        success: false, 
        message: 'Please enter a Discord Bot Token first.' 
      });
      return;
    }

    setBotTestResult({ testing: true });
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.testDiscordConnection(settings.discord_bot_token);
      if (res.success) {
        setBotTestResult({ 
          testing: false, 
          success: true, 
          message: `Connected successfully! Bot User: ${res.botTag} (ID: ${res.botId})` 
        });
        onRefreshGlobalStats();
      } else {
        setBotTestResult({ 
          testing: false, 
          success: false, 
          message: res.error || 'Failed to authenticate with Discord API.' 
        });
      }
    } catch (err: any) {
      setBotTestResult({ 
        testing: false, 
        success: false, 
        message: `Connection error: ${err.message}` 
      });
    }
  };

  const handleClearDatabase = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      await api.clearAllTeams();
      setShowClearModal(false);
      onRefreshGlobalStats();
      alert('All teams, players, and logs have been cleared.');
    } catch (err: any) {
      alert(`Error clearing data: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-blue-400" />
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your tournament details and Discord Bot connection
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Tournament General Settings */}
        <div className="bg-[#121622] border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            General Tournament
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                value={settings.tournament_name}
                onChange={(e) => setSettings({ ...settings, tournament_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700/70 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Free Fire Champions Cup"
              />
            </div>
          </div>
        </div>

        {/* Discord Bot Configuration */}
        <div className="bg-[#121622] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Discord Bot Connection
            </h2>
            <button
              onClick={() => setShowTokenHelp(!showTokenHelp)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showTokenHelp ? 'Hide Bot Guide' : 'How to get Bot Token?'}
            </button>
          </div>

          {/* Guide Dropdown */}
          {showTokenHelp && (
            <div className="mb-5 p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-lg text-xs text-indigo-200 space-y-2 leading-relaxed">
              <p className="font-semibold text-indigo-300">Quick Guide to Setup Discord Bot:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Go to the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center gap-0.5">Discord Developer Portal <ExternalLink className="w-3 h-3" /></a>.</li>
                <li>Create a "New Application" and give it a name (e.g. Tournament Bot).</li>
                <li>Go to the <strong>Bot</strong> tab on the left menu, and click <strong>Reset Token</strong> to copy your Bot Token.</li>
                <li>Scroll down to <strong>Privileged Gateway Intents</strong> and enable <strong>Server Members Intent</strong> and <strong>Message Content Intent</strong>.</li>
                <li>Go to <strong>OAuth2 → URL Generator</strong>, select <code className="bg-slate-800 px-1 py-0.5 rounded">bot</code> and administrator / send messages permissions, copy the URL and invite the bot to your Discord server.</li>
                <li>Paste the token below and click <strong>Test & Connect</strong>.</li>
              </ol>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Discord Bot Token
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={settings.discord_bot_token}
                  onChange={(e) => setSettings({ ...settings, discord_bot_token: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700/70 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Paste your Discord Bot Token here..."
                />
                <button
                  type="button"
                  onClick={handleTestBotConnection}
                  disabled={botTestResult.testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {botTestResult.testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Test & Connect
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test result message */}
            {botTestResult.message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  botTestResult.success
                    ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
                }`}
              >
                {botTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                )}
                <span>{botTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-[#121622] border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            Data Management
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Reset or clear tournament teams, players, and notification logs.
          </p>

          <button
            onClick={() => setShowClearModal(true)}
            className="px-4 py-2 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Teams & Logs
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Database */}
      <ConfirmationModal
        isOpen={showClearModal}
        title="Clear All Teams & Logs?"
        message="This will permanently delete all imported teams, players, and DM notification logs from the local database. This action cannot be undone."
        confirmLabel="Yes, Clear Everything"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearDatabase}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
