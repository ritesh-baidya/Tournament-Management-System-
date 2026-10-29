import React, { useEffect, useState } from 'react';
import { 
  Disc, Play, RotateCcw, CheckCircle2, AlertTriangle, 
  ArrowRight, Trophy, Flame, Volume2, VolumeX, Users 
} from 'lucide-react';
import { SpinWheel } from '../components/SpinWheel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Team, Draw, DrawSelection } from '../types';
import { soundManager } from '../utils/audio';
import { PageId } from '../components/Sidebar';

interface RandomSpinWheelPageProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const RandomSpinWheelPage: React.FC<RandomSpinWheelPageProps> = ({ 
  onNavigate, 
  onRefreshGlobalStats 
}) => {
  const [eligibleTeams, setEligibleTeams] = useState<Team[]>([]);
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [targetCount, setTargetCount] = useState<number>(12);
  const [loading, setLoading] = useState(true);

  // Spin animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingWinnerId, setPendingWinnerId] = useState<string | null>(null);
  const [latestWinner, setLatestWinner] = useState<Team | null>(null);
  const [showCelebrationCard, setShowCelebrationCard] = useState(false);

  // Modals
  const [isStartDrawModalOpen, setIsStartDrawModalOpen] = useState(false);
  const [isResetDrawModalOpen, setIsResetDrawModalOpen] = useState(false);
  const [isInsufficientTeamsModalOpen, setIsInsufficientTeamsModalOpen] = useState(false);

  const loadDrawAndPool = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [drawRes, poolRes, settingsRes] = await Promise.all([
        api.getActiveDraw(),
        api.getEligibleTeams(),
        api.getSettings()
      ]);

      if (settingsRes.success && settingsRes.data?.selection_target) {
        setTargetCount(settingsRes.data.selection_target);
      }

      if (poolRes.success) {
        setEligibleTeams(poolRes.data || []);
      }

      if (drawRes.success && drawRes.data) {
        setActiveDraw(drawRes.data);
        if (drawRes.data.target_count) {
          setTargetCount(drawRes.data.target_count);
        }
      } else {
        setActiveDraw(null);
      }
    } catch (err) {
      console.error('Failed to load draw and pool:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrawAndPool();
  }, []);

  // Filter out teams that have already been selected in this active draw
  const alreadySelectedTeamIds = new Set((activeDraw?.selections || []).map(s => s.team_id));
  const availableWheelPool = eligibleTeams.filter(t => !alreadySelectedTeamIds.has(t.id));

  const currentSelectionCount = activeDraw?.selections?.length || 0;
  const isDrawComplete = currentSelectionCount >= targetCount;

  // Handle starting a fresh draw
  const handleStartFreshDraw = async (confirmedTargetCount?: number) => {
    const finalTarget = confirmedTargetCount || targetCount;
    try {
      const api = (window as any).electronAPI;
      const res = await api.createDraw(finalTarget);
      if (res.success && res.data) {
        setActiveDraw(res.data);
        setLatestWinner(null);
        setShowCelebrationCard(false);
        await loadDrawAndPool();
        onRefreshGlobalStats();
      }
    } catch (err: any) {
      alert(`Error starting draw: ${err.message}`);
    } finally {
      setIsStartDrawModalOpen(false);
      setIsInsufficientTeamsModalOpen(false);
    }
  };

  // Pre-check before starting a draw
  const handleInitiateNewDraw = () => {
    if (eligibleTeams.length < targetCount) {
      setIsInsufficientTeamsModalOpen(true);
    } else {
      setIsStartDrawModalOpen(true);
    }
  };

  // Handle Spin Click: Calls Node.js cryptographic randomness first!
  const handleSpinClick = async () => {
    if (isSpinning || isDrawComplete || availableWheelPool.length === 0) return;

    if (!activeDraw) {
      // Auto-start active draw if not started
      if (eligibleTeams.length < targetCount) {
        setIsInsufficientTeamsModalOpen(true);
        return;
      }
      setIsStartDrawModalOpen(true);
      return;
    }

    try {
      soundManager.playClick();
      setIsSpinning(true);
      setShowCelebrationCard(false);

      // Node.js crypto random selection in Electron main process
      const api = (window as any).electronAPI;
      const candidateIds = availableWheelPool.map(t => t.id);
      const cryptoRes = await api.selectCryptoWinner(candidateIds);

      if (!cryptoRes.success || !cryptoRes.data) {
        throw new Error(cryptoRes.error || 'Failed to select winner cryptographically');
      }

      const winnerId = cryptoRes.data.winnerId;
      const winner = availableWheelPool.find(t => t.id === winnerId);
      if (!winner) throw new Error('Selected winner not found in pool');

      setPendingWinnerId(winnerId);
      setLatestWinner(winner);
      // The SpinWheel canvas component will now run the deceleration animation
    } catch (err: any) {
      setIsSpinning(false);
      alert(`Spin error: ${err.message}`);
    }
  };

  // Called when wheel deceleration animation finishes landing on the winner
  const handleSpinComplete = async () => {
    setIsSpinning(false);
    if (!activeDraw || !pendingWinnerId || !latestWinner) return;

    try {
      const api = (window as any).electronAPI;
      const nextOrder = (activeDraw.selections?.length || 0) + 1;

      // Immediately persist selection to SQLite!
      const recRes = await api.recordSelection(activeDraw.id, pendingWinnerId, nextOrder);
      if (recRes.success && recRes.data) {
        const updatedSelections = [...(activeDraw.selections || []), recRes.data];
        setActiveDraw({ ...activeDraw, selections: updatedSelections });
        setShowCelebrationCard(true);

        // Check if draw reached target count
        if (updatedSelections.length >= targetCount) {
          await api.finalizeDraw(activeDraw.id);
        }

        onRefreshGlobalStats();
      }
    } catch (err: any) {
      alert(`Failed to save selection: ${err.message}`);
    } finally {
      setPendingWinnerId(null);
    }
  };

  const handleResetDraw = async () => {
    if (!activeDraw) return;
    try {
      const api = (window as any).electronAPI;
      await api.cancelDraw(activeDraw.id);
      setActiveDraw(null);
      setLatestWinner(null);
      setShowCelebrationCard(false);
      await loadDrawAndPool();
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error resetting draw: ${err.message}`);
    } finally {
      setIsResetDrawModalOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Banner & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Esports Random Draw
            </span>
            <span className="text-slate-400 text-xs">Node.js Cryptographic Fairness</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Disc className="text-emerald-400 animate-spin-slow" size={26} />
            FREE FIRE RANDOM SPIN WHEEL
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeDraw ? (
            <button
              onClick={() => setIsResetDrawModalOpen(true)}
              disabled={isSpinning}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/20 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw size={15} />
              Reset Current Draw
            </button>
          ) : (
            <button
              onClick={handleInitiateNewDraw}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Play size={15} />
              Start Draw ({targetCount} Teams)
            </button>
          )}

          {isDrawComplete && (
            <button
              onClick={() => onNavigate('selected-teams')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 shadow-lg shadow-teal-950/50 flex items-center gap-2 cursor-pointer transition-all animate-bounce"
            >
              <span>View Selected 12 Teams</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Center Layout: Wheel on Left, Live Selection List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The Interactive Wheel & Spin Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center esports-card rounded-2xl border border-white/10 p-6 relative shadow-2xl">
          {/* Wheel Status Indicator */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Available in Pool:</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {availableWheelPool.length} teams
              </span>
            </div>

            {/* Target Selection Counter */}
            <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Selected:</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {currentSelectionCount} / {targetCount}
              </span>
            </div>
          </div>

          {/* Interactive Wheel Canvas */}
          <div className="my-2">
            <SpinWheel
              teams={availableWheelPool}
              selectedWinnerId={pendingWinnerId}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              winnerTeam={latestWinner}
            />
          </div>

          {/* Big Action Button */}
          <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-sm">
            {isDrawComplete ? (
              <div className="w-full text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                <span>Draw Complete! All {targetCount} Teams Selected</span>
              </div>
            ) : (
              <button
                onClick={handleSpinClick}
                disabled={isSpinning || availableWheelPool.length === 0}
                className="w-full py-3.5 rounded-2xl font-extrabold text-base tracking-wider uppercase text-black bg-gradient-to-r from-[#00FF66] via-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Flame size={20} className={isSpinning ? 'animate-bounce' : ''} />
                <span>{isSpinning ? 'SPINNING WHEEL...' : `SPIN FOR TEAM #${currentSelectionCount + 1}`}</span>
              </button>
            )}

            <span className="text-[11px] text-slate-500 text-center">
              Each entry displays only Team Name & Captain Name. Private contact info is never shown.
            </span>
          </div>

          {/* Winning Celebration Card Popup */}
          {showCelebrationCard && latestWinner && (
            <div className="mt-4 w-full p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 shadow-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black font-mono text-base border border-emerald-500/30 shadow-lg">
                  #{currentSelectionCount}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    JUST SELECTED WINNER
                  </span>
                  <h4 className="text-lg font-extrabold text-white font-heading">
                    {latestWinner.team_name}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Captain: <strong className="text-emerald-300">{latestWinner.captain_name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCelebrationCard(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Selection Draw Table (5 cols) */}
        <div className="lg:col-span-5 esports-card rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl flex flex-col justify-between h-[680px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white tracking-wide font-heading">
                  SELECTED TEAMS ({currentSelectionCount}/{targetCount})
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {activeDraw ? `Draw #${activeDraw.draw_number}` : 'No Active Draw'}
              </span>
            </div>

            {/* Selection items list */}
            <div className="mt-3 space-y-2 overflow-y-auto max-h-[500px] pr-1">
              {Array.from({ length: targetCount }).map((_, slotIdx) => {
                const order = slotIdx + 1;
                const selection = activeDraw?.selections?.find(s => s.selection_order === order);

                if (selection) {
                  return (
                    <div 
                      key={selection.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/30">
                          {order}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white tracking-wide">
                            {selection.team_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Captain: <span className="text-slate-200">{selection.captain_name}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-800 text-emerald-400 border border-white/5">
                        Selected
                      </span>
                    </div>
                  );
                }

                return (
                  <div 
                    key={slotIdx}
                    className="p-3 rounded-xl bg-slate-900/30 border border-dashed border-white/5 flex items-center justify-between text-xs text-slate-500"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 text-xs font-mono flex items-center justify-center">
                        {order}
                      </span>
                      <span className="italic">Awaiting draw #{order}...</span>
                    </div>
                    <span className="text-[10px] uppercase">Empty Slot</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isDrawComplete ? 'Ready to notify captains' : `${targetCount - currentSelectionCount} slots remaining`}
            </span>
            <button
              onClick={() => onNavigate('selected-teams')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Selected Teams</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Start New Draw */}
      <ConfirmationModal
        isOpen={isStartDrawModalOpen}
        title="Start New Tournament Draw"
        message={`Are you ready to initiate a new draw for ${targetCount} teams?\n\nEligible pool: ${eligibleTeams.length} available teams.\nEach selection will be cryptographically generated and saved immediately to SQLite.`}
        confirmText="Start Draw"
        onConfirm={() => handleStartFreshDraw(targetCount)}
        onCancel={() => setIsStartDrawModalOpen(false)}
      />

      {/* Confirmation Modal to Reset Active Draw */}
      <ConfirmationModal
        isOpen={isResetDrawModalOpen}
        title="Reset Active Draw"
        message={`Are you sure you want to cancel Draw #${activeDraw?.draw_number}?\n\nAll ${activeDraw?.selections?.length || 0} teams currently selected in this draw will be returned to the eligible pool.`}
        confirmText="Yes, Reset Draw"
        isDanger={true}
        onConfirm={handleResetDraw}
        onCancel={() => setIsResetDrawModalOpen(false)}
      />

      {/* Insufficient Teams Modal (When fewer than 12 eligible teams remain) */}
      {isInsufficientTeamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl esports-card border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Fewer Eligible Teams Than Target Count
                </h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  You requested a draw of <strong className="text-white font-mono">{targetCount} teams</strong>, but only <strong className="text-amber-400 font-mono">{eligibleTeams.length} eligible teams</strong> remain available in the pool!
                  <br /><br />
                  In accordance with fair tournament rules, the system will <strong className="text-rose-400">never fabricate fake teams</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3 my-5">
              <div className="text-xs font-semibold text-slate-400">Please choose how you wish to proceed:</div>
              
              <button
                onClick={() => {
                  setTargetCount(eligibleTeams.length);
                  handleStartFreshDraw(eligibleTeams.length);
                }}
                disabled={eligibleTeams.length === 0}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  Option 1: Continue with all remaining {eligibleTeams.length} teams
                </div>
                <div className="text-[11px] text-slate-400">
                  Sets the draw target count to {eligibleTeams.length} and spins for all available squads.
                </div>
              </button>

              <button
                onClick={() => {
                  setIsInsufficientTeamsModalOpen(false);
                  onNavigate('all-teams');
                }}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-amber-500/40 text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  Option 2: Reset team rotation or import more teams
                </div>
                <div className="text-[11px] text-slate-400">
                  Go to All Teams to reset played teams back to eligible, or import additional rosters.
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsInsufficientTeamsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
