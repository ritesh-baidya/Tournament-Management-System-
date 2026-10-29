import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Users, Send, Crosshair, Trophy, 
  Clock, AlertCircle, RefreshCw, ArrowRight 
} from 'lucide-react';
import { Draw, DrawSelection } from '../types';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface SelectedTeamsProps {
  onNavigate: (page: PageId) => void;
}

export const SelectedTeams: React.FC<SelectedTeamsProps> = ({ onNavigate }) => {
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSelectedTeams = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const res = await api.getActiveDraw();
      if (res.success && res.data) {
        setActiveDraw(res.data);
      } else {
        // Fallback to latest draw
        const histRes = await api.getDrawHistory();
        if (histRes.success && histRes.data && histRes.data.length > 0) {
          setActiveDraw(histRes.data[0]);
        } else {
          setActiveDraw(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch selected teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedTeams();
  }, []);

  const selections: DrawSelection[] = activeDraw?.selections || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Draw #{activeDraw?.draw_number || 1} Roster
            </span>
            <span className="text-slate-400 text-xs">Target: {activeDraw?.target_count || 12} Teams</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={26} />
            SELECTED TEAMS FOR TODAY'S MATCH
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('discord-notifications')}
            disabled={selections.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
          >
            <Send size={15} />
            Send Discord Selection DMs
          </button>

          <button
            onClick={() => onNavigate('match-details')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Crosshair size={15} />
            Enter Match Room Details
          </button>
        </div>
      </div>

      {/* Selected Table */}
      <div className="rounded-xl esports-card border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#090D17] text-slate-400 uppercase tracking-wider font-heading border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Selection Order</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Captain Name</th>
                <th className="py-3 px-4">Discord User ID</th>
                <th className="py-3 px-4">Selected At</th>
                <th className="py-3 px-4">Discord Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selections.map((sel) => (
                <tr key={sel.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      #{sel.selection_order}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white text-sm">
                    {sel.team_name}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {sel.captain_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {sel.captain_discord_id || <span className="text-amber-400 italic">No Discord ID</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {formatDate(sel.selected_at)}
                  </td>
                  <td className="py-3 px-4">
                    {sel.notification_status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        <CheckCircle2 size={11} /> Sent
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
                        <Clock size={11} /> Pending Approval
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {selections.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                    No teams have been selected yet. Go to the Random Spin Wheel to conduct a draw!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
