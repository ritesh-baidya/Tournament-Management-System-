import React, { useEffect, useState } from 'react';
import { History, Disc, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Draw } from '../types';
import { formatDate } from '../utils/helpers';
import { PageId } from '../components/Sidebar';

interface DrawHistoryProps {
  onNavigate: (page: PageId) => void;
}

export const DrawHistory: React.FC<DrawHistoryProps> = ({ onNavigate }) => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDraws = async () => {
      setLoading(true);
      try {
        const api = (window as any).electronAPI;
        if (!api) return;
        const res = await api.getDrawHistory();
        if (res.success && res.data) {
          setDraws(res.data);
          if (res.data.length > 0) {
            setExpandedDrawId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load draw history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedDrawId(expandedDrawId === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <History className="text-emerald-400" size={26} />
            TOURNAMENT DRAW ARCHIVES
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete cryptographic audit log of all historical draws, timestamps, and exact selection sequences.
          </p>
        </div>
      </div>

      {/* Accordion List of Draws */}
      <div className="space-y-4">
        {draws.map((draw) => {
          const isExpanded = expandedDrawId === draw.id;
          const selections = draw.selections || [];

          return (
            <div 
              key={draw.id}
              className="rounded-2xl esports-card border border-white/10 overflow-hidden shadow-xl"
            >
              <div 
                onClick={() => toggleExpand(draw.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black font-mono text-base border border-emerald-500/20">
                    #{draw.draw_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Draw #{draw.draw_number} — {selections.length} Teams Selected
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>Created: {formatDate(draw.created_at)}</span>
                      {draw.finalized_at && <span>• Finalized: {formatDate(draw.finalized_at)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    draw.status === 'finalized' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {draw.status}
                  </span>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-white/5 bg-slate-950/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selections.map((sel) => (
                      <div 
                        key={sel.id}
                        className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                            #{sel.selection_order}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white truncate max-w-[140px]">{sel.team_name}</div>
                            <div className="text-[10px] text-slate-400">Capt: {sel.captain_name}</div>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {sel.notification_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {draws.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs esports-card rounded-2xl border border-white/5">
            No historical draws found. Start your first draw on the Random Spin Wheel!
          </div>
        )}
      </div>
    </div>
  );
};
