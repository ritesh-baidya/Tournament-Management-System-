import React, { useEffect, useState } from 'react';
import { 
  Crosshair, Key, Lock, Calendar, Clock, Send, 
  CheckCircle2, AlertCircle, Save, Eye, EyeOff, ShieldCheck, ArrowRight 
} from 'lucide-react';
import { Draw, DrawSelection, Match } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface MatchDetailsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  onNavigate, 
  onRefreshGlobalStats 
}) => {
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [matchId, setMatchId] = useState<string>('');
  const [matchNumber, setMatchNumber] = useState<number>(1);
  const [roomId, setRoomId] = useState<string>('');
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [matchTime, setMatchTime] = useState<string>('18:00 IST');
  const [voiceChannelInfo, setVoiceChannelInfo] = useState<string>('Tournament Voice Lobby #1');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>(
    'Please enter the custom room at least 5 minutes prior to start. No emulators allowed.'
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [drawRes, matchRes] = await Promise.all([
        api.getActiveDraw(),
        api.getLatestMatch()
      ]);

      if (drawRes.success && drawRes.data) {
        setActiveDraw(drawRes.data);
      } else {
        const histRes = await api.getDrawHistory();
        if (histRes.success && histRes.data && histRes.data.length > 0) {
          setActiveDraw(histRes.data[0]);
        }
      }

      if (matchRes.success && matchRes.data) {
        const m: Match = matchRes.data;
        setMatchId(m.id);
        setMatchNumber(m.match_number);
        setRoomId(m.room_id || '');
        setRoomPassword(m.room_password || '');
        if (m.match_date) setMatchDate(m.match_date);
        if (m.match_time) setMatchTime(m.match_time);
        if (m.voice_channel_info) setVoiceChannelInfo(m.voice_channel_info);
        if (m.additional_instructions) setAdditionalInstructions(m.additional_instructions);
      }
    } catch (err) {
      console.error('Failed to load match details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selections: DrawSelection[] = activeDraw?.selections || [];

  const handleSaveMatch = async () => {
    try {
      const api = (window as any).electronAPI;
      const res = await api.saveMatchDetails({
        id: matchId || undefined,
        draw_id: activeDraw?.id,
        match_number: matchNumber,
        room_id: roomId,
        room_password: roomPassword,
        match_date: matchDate,
        match_time: matchTime,
        voice_channel_info: voiceChannelInfo,
        additional_instructions: additionalInstructions
      });

      if (res.success && res.data) {
        setMatchId(res.data.id);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        onRefreshGlobalStats();
      }
    } catch (err: any) {
      alert(`Failed to save match details: ${err.message}`);
    }
  };

  const handleSendToIndividual = async (sel: DrawSelection) => {
    if (!roomId || !roomPassword) {
      alert('Please enter and save both Room ID and Room Password before sending.');
      return;
    }
    if (!sel.captain_discord_id) {
      alert(`Captain for team "${sel.team_name}" has no Discord User ID.`);
      return;
    }

    try {
      const api = (window as any).electronAPI;
      const res = await api.sendRoomDM(
        sel.captain_discord_id,
        sel.captain_name,
        sel.team_name,
        sel.team_id,
        roomId,
        roomPassword,
        matchTime,
        `${additionalInstructions} | Voice: ${voiceChannelInfo}`
      );

      if (res.success) {
        alert(`Match credentials successfully sent to ${sel.captain_name}!`);
      } else {
        alert(`Failed to send match credentials: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error sending match details: ${err.message}`);
    }
  };

  const handleBroadcastAll = async () => {
    if (!roomId || !roomPassword) {
      alert('Please fill in both Room ID and Room Password.');
      return;
    }

    setIsBroadcastModalOpen(false);
    setIsSending(true);

    try {
      const api = (window as any).electronAPI;
      await handleSaveMatch();

      let successCount = 0;
      let failCount = 0;

      for (const sel of selections) {
        if (!sel.captain_discord_id) {
          failCount++;
          continue;
        }

        const res = await api.sendRoomDM(
          sel.captain_discord_id,
          sel.captain_name,
          sel.team_name,
          sel.team_id,
          roomId,
          roomPassword,
          matchTime,
          `${additionalInstructions} | Voice: ${voiceChannelInfo}`
        );

        if (res.success) successCount++;
        else failCount++;
      }

      alert(`Room Announcement Sent!\n\nDelivered: ${successCount}\nFailed: ${failCount}`);
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error broadcasting room details: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Match Room Credentials
            </span>
            <span className="text-slate-400 text-xs">Delayed Password Security</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Crosshair className="text-emerald-400" size={26} />
            MATCH DETAILS & ROOM ANNOUNCEMENT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveMatch}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save size={15} />
            {isSaved ? 'Saved to SQLite!' : 'Save Match Details'}
          </button>

          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            disabled={selections.length === 0 || !roomId || !roomPassword || isSending}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
          >
            <Send size={15} className={isSending ? 'animate-pulse' : ''} />
            <span>{isSending ? 'Broadcasting...' : 'Broadcast Room Details to All Captains'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Announcement Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading pb-2 border-b border-white/10">
            Room Credentials & Instructions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Match Number
              </label>
              <input
                type="number"
                min={1}
                value={matchNumber}
                onChange={(e) => setMatchNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Match Date
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Free Fire Custom Room ID
              </label>
              <input
                type="text"
                placeholder="e.g. 84920481"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Room Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="e.g. FF2026"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Match Time (with timezone)
              </label>
              <input
                type="text"
                placeholder="e.g. 18:00 IST / 7:30 PM"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Voice Channel Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Squad Voice Lobby #3"
                value={voiceChannelInfo}
                onChange={(e) => setVoiceChannelInfo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Additional Match Instructions / Rules
            </label>
            <textarea
              rows={3}
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Room credentials are transmitted exclusively to verified selected captains via Discord DMs.
            </span>
            <button
              onClick={handleSaveMatch}
              className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>

        {/* Message Preview (5 cols) */}
        <div className="lg:col-span-5 esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading pb-2 border-b border-white/10 flex items-center gap-2">
              <Key size={15} className="text-emerald-400" />
              Captain DM Announcement Preview
            </h3>

            {/* Exact Required Template */}
            <div className="mt-4 p-4 rounded-xl bg-[#080B14] border border-white/10 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
              {`🔥 Free Fire Tournament — Match Details

Hello [Captain Name]!

Your team [Team Name] has been selected for this match.

Room ID: ${roomId || '[Room ID]'}
Room Password: ${roomPassword ? (showPassword ? roomPassword : '••••••••') : '[Room Password]'}
Match Time: ${matchTime || '[Match Time]'}

Please join on time and follow the tournament rules.

Good luck! 🎮`}

              {additionalInstructions && (
                <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                  📌 Instructions: {additionalInstructions}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Recipients in Current Draw:</span>
              <span className="font-mono text-emerald-400 font-bold">{selections.length} Captains</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {selections.map((s) => (
                <div key={s.id} className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-semibold truncate">{s.team_name} ({s.captain_name})</span>
                  <button
                    onClick={() => handleSendToIndividual(s)}
                    className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 cursor-pointer"
                  >
                    Send to Captain
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Broadcast Room Details */}
      <ConfirmationModal
        isOpen={isBroadcastModalOpen}
        title="Broadcast Room ID & Password"
        message={`Are you sure you want to broadcast Room ID (${roomId}) and password to all ${selections.length} selected captains via Discord DMs?\n\nCaptains will receive the exact match time and room password immediately.`}
        confirmText="Yes, Broadcast Credentials"
        onConfirm={handleBroadcastAll}
        onCancel={() => setIsBroadcastModalOpen(false)}
      />
    </div>
  );
};
