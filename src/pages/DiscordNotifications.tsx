import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, 
  HelpCircle, Shield, Key, ExternalLink, RotateCcw, AlertTriangle, Check 
} from 'lucide-react';
import { Draw, DrawSelection, NotificationLog } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface DiscordNotificationsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const DiscordNotifications: React.FC<DiscordNotificationsProps> = ({ 
  onNavigate, 
  onRefreshGlobalStats 
}) => {
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [botStatus, setBotStatus] = useState<{ isReady: boolean; botTag?: string; botId?: string }>({ isReady: false });
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [drawRes, statusRes, logsRes] = await Promise.all([
        api.getActiveDraw(),
        api.getDiscordStatus(),
        api.getNotificationLogs()
      ]);

      if (drawRes.success && drawRes.data) {
        setActiveDraw(drawRes.data);
      } else {
        const histRes = await api.getDrawHistory();
        if (histRes.success && histRes.data && histRes.data.length > 0) {
          setActiveDraw(histRes.data[0]);
        }
      }

      if (statusRes.success && statusRes.data) {
        setBotStatus(statusRes.data);
      }

      if (logsRes.success) {
        setLogs(logsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load discord data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selections: DrawSelection[] = activeDraw?.selections || [];

  // Send DM to an individual captain
  const handleSendIndividual = async (sel: DrawSelection, force: boolean = false) => {
    if (!sel.captain_discord_id) {
      alert(`Cannot send Discord DM to "${sel.team_name}": Missing Captain Discord User ID.`);
      return;
    }

    try {
      const api = (window as any).electronAPI;
      const res = await api.sendSelectionDM(
        sel.id,
        sel.captain_discord_id,
        sel.captain_name,
        sel.team_name,
        sel.team_id,
        force
      );

      if (!res.success) {
        alert(`Failed to send DM to ${sel.captain_name}: ${res.error}`);
      }
      await loadData();
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error sending DM: ${err.message}`);
    }
  };

  // Send batch approval
  const handleSendBatchApproved = async () => {
    setIsApprovalModalOpen(false);
    setIsSending(true);

    const api = (window as any).electronAPI;
    let sentCount = 0;
    let failCount = 0;

    for (const sel of selections) {
      if (sel.notification_status === 'sent') continue; // Idempotent: don't re-send already delivered
      if (!sel.captain_discord_id) {
        failCount++;
        continue;
      }

      const res = await api.sendSelectionDM(
        sel.id,
        sel.captain_discord_id,
        sel.captain_name,
        sel.team_name,
        sel.team_id,
        false
      );

      if (res.success) sentCount++;
      else failCount++;
    }

    setIsSending(false);
    await loadData();
    onRefreshGlobalStats();
    alert(`Notification Broadcast Complete!\n\nDelivered: ${sentCount}\nFailed: ${failCount}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Legitimate Discord Bot DM System
            </span>
            <span className="text-slate-400 text-xs">Direct Captain Outreach</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <MessageSquare className="text-emerald-400" size={26} />
            DISCORD SELECTION NOTIFICATIONS
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorialModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <HelpCircle size={15} />
            Bot Setup Guide
          </button>

          <button
            onClick={() => setIsApprovalModalOpen(true)}
            disabled={selections.length === 0 || isSending}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
          >
            <Send size={15} className={isSending ? 'animate-pulse' : ''} />
            <span>{isSending ? 'Sending Notifications...' : 'Approve & Send All Selection DMs'}</span>
          </button>
        </div>
      </div>

      {/* Bot Connection Banner */}
      <div className="p-4 rounded-xl esports-card border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${botStatus.isReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <div className="text-xs font-bold text-white">
              {botStatus.isReady ? `Discord Bot Online: ${botStatus.botTag}` : 'Discord Bot Standby'}
            </div>
            <div className="text-[11px] text-slate-400">
              {botStatus.isReady 
                ? 'Ready to transmit selection direct messages to captain Discord IDs.' 
                : 'Configure or test your Discord Bot token in Settings to enable direct messaging.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Configure Bot Token in Settings
        </button>
      </div>

      {/* Selected Captains Notification Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading">
            Captains Selected in Current Draw ({selections.length})
          </h2>
          <span className="text-xs text-slate-400">
            Messages are sent individually via official Discord DMs
          </span>
        </div>

        <div className="rounded-xl esports-card border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#090D17] text-slate-400 uppercase tracking-wider font-heading border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Discord User ID</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Message ID</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selections.map((sel) => (
                  <tr key={sel.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      #{sel.selection_order}
                    </td>
                    <td className="py-3 px-4 font-bold text-white text-sm">
                      {sel.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {sel.captain_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {sel.captain_discord_id || <span className="text-amber-400 italic">Missing ID</span>}
                    </td>
                    <td className="py-3 px-4">
                      {sel.notification_status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          <CheckCircle2 size={11} /> Delivered
                        </span>
                      ) : sel.notification_status === 'failed' ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase cursor-help"
                          title={sel.notification_error || 'Delivery failed'}
                        >
                          <AlertCircle size={11} /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {sel.discord_message_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sel.notification_status === 'failed' ? (
                        <button
                          onClick={() => handleSendIndividual(sel, true)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          Retry DM
                        </button>
                      ) : sel.notification_status === 'pending' ? (
                        <button
                          onClick={() => handleSendIndividual(sel, false)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          Send DM
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Delivered</span>
                      )}
                    </td>
                  </tr>
                ))}

                {selections.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No teams selected yet. Complete a draw on the Random Spin Wheel first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Notification Fallback Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle size={15} />
          <span>Manual Notification Fallback & Privacy Guidelines</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Discord bots can only send DMs to users who share a server with the bot and have direct messages enabled in their server privacy settings. 
          If a captain's DM fails (error: <em>Cannot send messages to this user</em>), remind the captain in the tournament Discord server to enable DMs or ping them directly.
        </p>
      </div>

      {/* Selection DM Approval & Preview Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl esports-card border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white tracking-wide">
              Approve Selection Notification Broadcast
            </h3>
            <p className="text-xs text-slate-300">
              Please review the exact message template before broadcasting to all selected captains:
            </p>

            {/* Exact Required Message Preview Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
              {`🎉 Congratulations, [Captain Name]!

Your team, [Team Name], has been selected for today's Free Fire tournament match.

Your match details and room password will be sent later. Please stay ready and keep an eye on your Discord messages.

Good luck! 🔥`}
            </div>

            <div className="text-xs text-slate-400">
              This message will be personalized and delivered directly to the Discord User ID of each of the <strong className="text-white">{selections.length} selected captains</strong>.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBatchApproved}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                Approve & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discord Bot Setup Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl esports-card border border-white/10 p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white tracking-wide font-heading">
                Discord Bot Setup Instructions
              </h3>
              <button
                onClick={() => setShowTutorialModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Step 1: Create Free Discord Application</span>
                <p>Go to the <strong>Discord Developer Portal</strong> (discord.com/developers/applications), click <em>New Application</em>, and name it "Free Fire Tournament Bot".</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Step 2: Create Bot & Enable Intents</span>
                <p>Navigate to the <strong>Bot</strong> tab. Click <em>Add Bot</em>. Under <strong>Privileged Gateway Intents</strong>, enable <em>Server Members Intent</em>.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Step 3: Copy Bot Token Securely</span>
                <p>Click <em>Reset Token</em> and copy your token. Paste it into <strong>Settings &gt; Discord Bot Token</strong> in this application. Your token is stored securely in local SQLite and never shared with anyone.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Step 4: Invite Bot to Your Tournament Server</span>
                <p>Go to <strong>OAuth2 &gt; URL Generator</strong>. Select the <em>bot</em> scope. Select permissions: <em>Send Messages</em> and <em>Read Message History</em>. Copy the generated URL and invite the bot to your tournament server.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Step 5: Obtain Captains' Discord User IDs</span>
                <p>In Discord, enable <strong>Developer Mode</strong> (User Settings &gt; Advanced &gt; Developer Mode). Right-click any captain's username and select <strong>Copy User ID</strong> (e.g. <code>108273645192837465</code>). Put this numeric ID into your Excel registration column.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTutorialModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
