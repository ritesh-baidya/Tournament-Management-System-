import React, { useEffect, useState, useRef } from 'react';
import { 
  Dices, Play, RefreshCw, Send, CheckCircle2, 
  AlertCircle, Shield, RotateCcw, MessageSquare, 
  Key, Sparkles, Check, AlertTriangle, Users, Zap, CheckCheck,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SpinWheel } from '../components/SpinWheel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Team, Draw, DrawSelection, TournamentStage } from '../types';
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
  const [loading, setLoading] = useState(true);

  // Spin Wheel states
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetWinnerId, setTargetWinnerId] = useState<string | null>(null);
  const [currentWinnerTeam, setCurrentWinnerTeam] = useState<Team | null>(null);
  const [announcedWinner, setAnnouncedWinner] = useState<Team | null>(null);
  const [announcedBatchWinners, setAnnouncedBatchWinners] = useState<Team[] | null>(null);
  const pendingBatchDataRef = useRef<{
    currentDraw: Draw;
    winnerTeamIds: string[];
    winnerTeams: Team[];
  } | null>(null);

  // Batch selection states
  const [isBatchSelecting, setIsBatchSelecting] = useState(false);
  const [isSendingBatchDms, setIsSendingBatchDms] = useState(false);
  const [batchDmProgress, setBatchDmProgress] = useState<{
    current: number;
    total: number;
    successCount: number;
    failCount: number;
  } | null>(null);

  // Settings
  const [targetCount, setTargetCount] = useState<number>(12);
  const [autoSendDm, setAutoSendDm] = useState<boolean>(true);
  const [botStatus, setBotStatus] = useState<{ isReady: boolean; botTag?: string }>({ isReady: false });

  // Notification status for items in active draw
  const [dmStatusMap, setDmStatusMap] = useState<Record<string, { status: string; error?: string }>>({});

  // Customizable Selection Congratulations Message
  const DEFAULT_CONGRATS_TEMPLATE = 
    `🎉 Congratulations {captain_name}!\n\nYour team, {team_name}, has been selected for today's tournament match.\n\nPlease stay ready and keep an eye on your Discord messages for room details.\n\nGood luck! 🔥`;

  const [customCongratsTemplate, setCustomCongratsTemplate] = useState<string>(() => {
    const saved = localStorage.getItem('selection_congrats_template');
    if (!saved || saved.includes('Free Fire Championship')) {
      localStorage.setItem('selection_congrats_template', DEFAULT_CONGRATS_TEMPLATE);
      return DEFAULT_CONGRATS_TEMPLATE;
    }
    return saved;
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tempTemplate, setTempTemplate] = useState<string>(customCongratsTemplate);

  // Reset modal
  const [showResetModal, setShowResetModal] = useState(false);

  const [totalDbTeamsCount, setTotalDbTeamsCount] = useState<number>(0);

  // Tournament Progression Stage & Repeat Selection authorization
  const [currentStage, setCurrentStage] = useState<TournamentStage>('qualifying');
  const [allowRepeatSelection, setAllowRepeatSelection] = useState<boolean>(false);

  const loadData = async (stageToUse = currentStage, allowRepeatToUse = allowRepeatSelection) => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [teamsRes, allRes, drawRes, statusRes] = await Promise.all([
        api.getEligibleTeams(stageToUse, allowRepeatToUse),
        api.getAllTeams(),
        api.getActiveDraw(),
        api.getDiscordStatus()
      ]);

      let eligible = (teamsRes && teamsRes.success && teamsRes.data) ? teamsRes.data : [];
      const allTeams = (allRes && allRes.success && allRes.data) ? allRes.data : [];
      setTotalDbTeamsCount(allTeams.length);

      // If eligible is empty but database has teams and no active draw in progress, auto-reset rotation
      if (eligible.length === 0 && allTeams.length > 0 && (!drawRes.data || !drawRes.data.selections || drawRes.data.selections.length === 0)) {
        if (api.resetRotation) {
          await api.resetRotation('one_time');
          const retryRes = await api.getEligibleTeams(stageToUse, allowRepeatToUse);
          if (retryRes && retryRes.success && retryRes.data) {
            eligible = retryRes.data;
          }
        }
      }

      setEligibleTeams(eligible);

      if (drawRes && drawRes.success && drawRes.data && drawRes.data.status === 'in_progress') {
        setActiveDraw(drawRes.data);
        if (drawRes.data.stage) {
          setCurrentStage(drawRes.data.stage);
        }
        setTargetCount(12);
        // Initialize dm status map from existing selections
        const statusMap: Record<string, { status: string; error?: string }> = {};
        drawRes.data.selections?.forEach((s: DrawSelection) => {
          statusMap[s.id] = { status: s.notification_status, error: s.notification_error || undefined };
        });
        setDmStatusMap(statusMap);
      } else {
        setActiveDraw(null);
        setTargetCount(12);
      }

      if (statusRes && statusRes.success && statusRes.data) {
        setBotStatus(statusRes.data);
      }
    } catch (err) {
      console.error('Failed to load spin wheel data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRotation = async () => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.resetRotation) {
        await api.resetRotation('one_time');
        await loadData();
        onRefreshGlobalStats();
      }
    } catch (err) {
      console.error('Failed to reset rotation:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('teams-updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('teams-updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, []);

  const selections = activeDraw?.selections || [];
  const selectedCount = selections.length;
  const isDrawComplete = selectedCount >= targetCount && targetCount > 0;
  const failedDmsCount = selections.filter(s => dmStatusMap[s.id]?.status === 'failed').length;

  // Filter remaining eligible teams (exclude teams already selected in this draw)
  const selectedTeamIds = new Set(selections.map(s => s.team_id));
  const spinPool = eligibleTeams.filter(t => !selectedTeamIds.has(t.id));

  // Single DM sending function
  const sendSelectionDiscordDm = async (selId: string, team: { id: string; team_name: string; captain_name: string; captain_discord_id?: string | null }) => {
    if (!team.captain_discord_id) {
      setDmStatusMap(prev => ({
        ...prev,
        [selId]: { status: 'failed', error: 'No Discord User ID or Username in team data' }
      }));
      return;
    }

    setDmStatusMap(prev => ({
      ...prev,
      [selId]: { status: 'sending' }
    }));

    try {
      const api = (window as any).electronAPI;
      const res = await api.sendSelectionDM(
        selId,
        team.captain_discord_id,
        team.captain_name,
        team.team_name,
        team.id,
        true,
        customCongratsTemplate
      );

      if (res.success) {
        setDmStatusMap(prev => ({
          ...prev,
          [selId]: { status: 'sent' }
        }));
      } else {
        setDmStatusMap(prev => ({
          ...prev,
          [selId]: { status: 'failed', error: res.error || 'Failed to deliver Discord message' }
        }));
      }
      onRefreshGlobalStats();
    } catch (err: any) {
      setDmStatusMap(prev => ({
        ...prev,
        [selId]: { status: 'failed', error: err.message || 'Failed to send DM' }
      }));
    }
  };

  // Broadcast Selection Congratulations DM to selected captains concurrently (with optional failed-only filter)
  const handleSendSelectionDmsToAll = async (targetSelections?: DrawSelection[], onlyFailed = false) => {
    let listToSend = targetSelections || selections;
    if (onlyFailed) {
      listToSend = listToSend.filter(sel => dmStatusMap[sel.id]?.status !== 'sent');
    }

    if (!listToSend || listToSend.length === 0) {
      alert(onlyFailed ? 'No failed captain messages to retry!' : 'No selected captains to send messages to.');
      return;
    }

    setIsSendingBatchDms(true);
    setBatchDmProgress({
      current: 0,
      total: listToSend.length,
      successCount: 0,
      failCount: 0
    });

    const api = (window as any).electronAPI;

    // Immediately show "sending" status for entries being dispatched
    setDmStatusMap(prev => {
      const next = { ...prev };
      listToSend.forEach(sel => {
        if (sel.captain_discord_id) {
          next[sel.id] = { status: 'sending' };
        } else {
          next[sel.id] = { status: 'failed', error: 'No Discord User ID in Excel' };
        }
      });
      return next;
    });

    let successCount = 0;
    let failCount = 0;

    // Dispatch concurrently in small chunks of 3 for rate-limit safe, high-speed delivery
    const chunkSize = 3;
    for (let i = 0; i < listToSend.length; i += chunkSize) {
      const chunk = listToSend.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (sel) => {
        if (!sel.captain_discord_id) {
          failCount++;
          setBatchDmProgress(prev => prev ? ({ ...prev, current: prev.current + 1, failCount }) : null);
          return;
        }

        try {
          const res = await api.sendSelectionDM(
            sel.id,
            sel.captain_discord_id,
            sel.captain_name,
            sel.team_name,
            sel.team_id,
            true,
            customCongratsTemplate
          );

          if (res.success) {
            successCount++;
            setDmStatusMap(prev => ({
              ...prev,
              [sel.id]: { status: 'sent' }
            }));
          } else {
            failCount++;
            setDmStatusMap(prev => ({
              ...prev,
              [sel.id]: { status: 'failed', error: res.error || 'Delivery failed' }
            }));
          }
        } catch (err: any) {
          failCount++;
          setDmStatusMap(prev => ({
            ...prev,
            [sel.id]: { status: 'failed', error: err.message }
          }));
        } finally {
          setBatchDmProgress(prev => prev ? ({
            ...prev,
            current: prev.current + 1,
            successCount,
            failCount
          }) : null);
        }
      }));

      if (i + chunkSize < listToSend.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    onRefreshGlobalStats();
    setIsSendingBatchDms(false);
  };

  const handleBatchSelectAndSendDms = async (countToSelect?: number) => {
    if (isSpinning || isBatchSelecting || isSendingBatchDms || isDrawComplete) return;

    const remaining = targetCount - selectedCount;
    if (remaining <= 0) return;

    let needed = countToSelect ? Math.min(countToSelect, remaining) : remaining;
    if (needed <= 0) return;

    if (needed === 1) {
      await handleStartSpin();
      return;
    }

    if (spinPool.length < needed) {
      if (spinPool.length === 0) {
        const doReset = confirm(
          `All teams have already been drawn or played.\n\nWould you like to reset the rotation so all teams become eligible to spin again?`
        );
        if (doReset) {
          await handleResetRotation();
        }
        return;
      }

      const proceedWithAvailable = confirm(
        `Only ${spinPool.length} teams are currently eligible in the pool, but ${needed} were requested to be selected.\n\n` +
        `• Click OK to select all ${spinPool.length} remaining teams.\n` +
        `• Click Cancel to replenish the pool from all ${totalDbTeamsCount} teams first.`
      );

      if (proceedWithAvailable) {
        needed = spinPool.length;
        setTargetCount(selectedCount + needed);
      } else {
        const doReset = confirm(`Would you like to replenish the pool now (make all ${totalDbTeamsCount} teams eligible to spin)?`);
        if (doReset) {
          await handleResetRotation();
        }
        return;
      }
    }

    setIsBatchSelecting(true);
    setAnnouncedWinner(null);
    setAnnouncedBatchWinners(null);

    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      // 1. Ensure active draw exists
      let currentDraw = activeDraw;
      if (!currentDraw) {
        const createRes = await api.createDraw(targetCount, currentStage);
        if (!createRes.success) {
          alert(`Failed to create draw: ${createRes.error}`);
          setIsBatchSelecting(false);
          return;
        }
        currentDraw = createRes.data;
        setActiveDraw(currentDraw);
      }

      if (!currentDraw) {
        setIsBatchSelecting(false);
        return;
      }

      // 2. Select `needed` unique crypto winners from remaining spinPool
      let winnerTeamIds: string[] = [];
      if (api.selectCryptoMultipleWinners) {
        const multRes = await api.selectCryptoMultipleWinners(spinPool.map(t => t.id), needed);
        if (multRes.success && multRes.data?.winnerTeamIds) {
          winnerTeamIds = multRes.data.winnerTeamIds;
        }
      }

      // Fallback if needed
      if (winnerTeamIds.length === 0) {
        const poolCopy = [...spinPool.map(t => t.id)];
        for (let i = 0; i < needed && poolCopy.length > 0; i++) {
          const randRes = await api.selectCryptoWinner(poolCopy);
          if (randRes.success && randRes.data?.winnerTeamId) {
            const wId = randRes.data.winnerTeamId;
            winnerTeamIds.push(wId);
            const idx = poolCopy.indexOf(wId);
            if (idx >= 0) poolCopy.splice(idx, 1);
          }
        }
      }

      if (winnerTeamIds.length === 0) {
        alert('Random generator failed to pick teams. Please try again.');
        setIsBatchSelecting(false);
        return;
      }

      const winners = winnerTeamIds.map(id => spinPool.find(t => t.id === id)!).filter(Boolean);
      pendingBatchDataRef.current = {
        currentDraw,
        winnerTeamIds,
        winnerTeams: winners
      };

      // Set target winner on wheel for rotation visual landing
      setTargetWinnerId(winnerTeamIds[0]);
      setCurrentWinnerTeam(winners[0] || null);

      // Trigger the wheel spin animation!
      setIsSpinning(true);
    } catch (err: any) {
      alert(`Error during batch draw: ${err.message}`);
      setIsBatchSelecting(false);
    }
  };

  // Start Single Spin Click (for 1 team)
  const handleStartSpin = async () => {
    if (isSpinning || isBatchSelecting || isSendingBatchDms || isDrawComplete || spinPool.length === 0) return;

    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      // 1. Ensure active draw exists
      let currentDraw = activeDraw;
      if (!currentDraw) {
        const createRes = await api.createDraw(targetCount, currentStage);
        if (!createRes.success) {
          alert(`Failed to create draw: ${createRes.error}`);
          return;
        }
        currentDraw = createRes.data;
        setActiveDraw(currentDraw);
      }

      // 2. Select crypto winner from remaining spinPool
      const poolIds = spinPool.map(t => t.id);
      const winnerRes = await api.selectCryptoWinner(poolIds);
      if (!winnerRes.success || !winnerRes.data?.winnerTeamId) {
        alert('Random generator error. Please try again.');
        return;
      }

      const winnerTeamId = winnerRes.data.winnerTeamId;
      const winner = spinPool.find(t => t.id === winnerTeamId);
      if (!winner) return;

      setTargetWinnerId(winnerTeamId);
      setCurrentWinnerTeam(winner);
      setAnnouncedWinner(null);
      setAnnouncedBatchWinners(null);
      setIsSpinning(true);
    } catch (err: any) {
      alert(`Error spinning: ${err.message}`);
    }
  };

  // Callback when wheel finishes deceleration for both single spin & batch spin
  const handleSpinComplete = async () => {
    setIsSpinning(false);

    // Case 1: Batch Draw finished spinning!
    if (pendingBatchDataRef.current) {
      const { currentDraw, winnerTeamIds, winnerTeams } = pendingBatchDataRef.current;
      pendingBatchDataRef.current = null;

      try {
        const api = (window as any).electronAPI;
        let newSelections: DrawSelection[] = [];
        if (api && api.recordSelectionBatch) {
          const recRes = await api.recordSelectionBatch(currentDraw.id, winnerTeamIds, selectedCount + 1);
          if (recRes.success && recRes.data) {
            newSelections = recRes.data;
          }
        } else if (api) {
          for (let i = 0; i < winnerTeamIds.length; i++) {
            const recRes = await api.recordSelection(currentDraw.id, winnerTeamIds[i], selectedCount + 1 + i);
            if (recRes.success && recRes.data) {
              newSelections.push(recRes.data);
            }
          }
        }

        // Update local active draw state
        setActiveDraw(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            selections: [...(prev.selections || []), ...newSelections]
          };
        });

        // Update eligible teams pool
        const selectedIdSet = new Set(winnerTeamIds);
        setEligibleTeams(prev => prev.map(t => selectedIdSet.has(t.id) ? { ...t, status: 'selected' as const } : t));

        // Set announced batch winners so the user sees all selected captains
        setAnnouncedBatchWinners(winnerTeams);

        // Visual fanfare!
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });
        } catch {}

        // If Auto-send DMs is enabled, dispatch DMs to all newly selected captains concurrently!
        if (autoSendDm && newSelections.length > 0) {
          await handleSendSelectionDmsToAll(newSelections);
        }

        onRefreshGlobalStats();
      } catch (err: any) {
        alert(`Error recording batch selections: ${err.message}`);
      } finally {
        setIsBatchSelecting(false);
      }
      return;
    }

    // Case 2: Single Spin finished!
    if (!currentWinnerTeam || !activeDraw) return;

    const winner = currentWinnerTeam;
    setAnnouncedWinner(winner);

    try {
      const api = (window as any).electronAPI;
      const nextOrder = selectedCount + 1;

      // Record selection in database
      const recRes = await api.recordSelection(activeDraw.id, winner.id, nextOrder);
      if (recRes.success && recRes.data) {
        const newSelection = recRes.data;
        
        // Update local active draw selections
        setActiveDraw(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            selections: [...(prev.selections || []), newSelection]
          };
        });

        // If this selection completes all target teams, celebrate with confetti!
        if (nextOrder >= targetCount) {
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.6 }
            });
          } catch {}
        }

        // If Auto-send DM is enabled, automatically send Discord DM to captain now!
        if (autoSendDm) {
          await sendSelectionDiscordDm(newSelection.id, winner);
        }
      }

      onRefreshGlobalStats();
    } catch (err: any) {
      console.error('Error recording spin result:', err);
    }
  };

  // Reset active draw
  const handleResetDraw = async () => {
    if (!activeDraw) return;
    try {
      const api = (window as any).electronAPI;
      await api.cancelDraw(activeDraw.id);
      setActiveDraw(null);
      setAnnouncedWinner(null);
      setShowResetModal(false);
      setBatchDmProgress(null);
      await loadData();
      onRefreshGlobalStats();
    } catch (err: any) {
      alert(`Error resetting draw: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Dices className="w-7 h-7 text-emerald-400" />
              Tournament Selection Wheel
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Fair random selection from {totalDbTeamsCount > 0 ? `${totalDbTeamsCount.toLocaleString()} registered teams` : 'roster'} with automated captain Discord DMs
          </p>
        </div>

        {/* Auto Notify Toggle & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Count Manual Input */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">Select Teams:</span>
            <input
              type="number"
              min="1"
              value={targetCount || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setTargetCount(val);
                }
              }}
              className="w-16 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-300 font-bold text-center focus:outline-none focus:border-emerald-500 font-mono text-sm"
              placeholder="12"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <input
              type="checkbox"
              checked={autoSendDm}
              onChange={(e) => setAutoSendDm(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span className="text-slate-200 font-medium">Auto-Send DMs on Selection</span>
          </label>

          {activeDraw && (
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Draw
            </button>
          )}
        </div>
      </div>

      {/* Tournament Stage Selector & Repeat Selection Authorization */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#121622] border border-slate-800 rounded-2xl mb-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Stage:
          </span>
          {(['qualifying', 'quarter_final', 'semi_final', 'final'] as TournamentStage[]).map(stg => {
            const isActive = currentStage === stg;
            const labels: Record<TournamentStage, string> = {
              qualifying: 'Qualifying',
              quarter_final: 'Quarter-final',
              semi_final: 'Semi-final',
              final: 'Final'
            };
            const activeColors: Record<TournamentStage, string> = {
              qualifying: 'bg-cyan-600 text-white shadow-cyan-600/30',
              quarter_final: 'bg-indigo-600 text-white shadow-indigo-600/30',
              semi_final: 'bg-amber-600 text-white shadow-amber-600/30',
              final: 'bg-emerald-600 text-white shadow-emerald-600/30'
            };

            return (
              <button
                key={stg}
                type="button"
                onClick={() => {
                  if (activeDraw && activeDraw.status === 'in_progress') {
                    if (!confirm(`An active draw is currently in progress for stage "${activeDraw.stage || 'qualifying'}". Switching stages will change the wheel pool. Continue?`)) {
                      return;
                    }
                  }
                  setCurrentStage(stg);
                  loadData(stg, allowRepeatSelection);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? `${activeColors[stg]} shadow-md`
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {labels[stg]}
              </button>
            );
          })}
        </div>

        {/* Admin Repeat Authorization Toggle */}
        <div className="flex items-center gap-3">
          <label 
            className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs" 
            title="Explicitly allow teams that already played in this stage to be drawn again"
          >
            <input
              type="checkbox"
              checked={allowRepeatSelection}
              onChange={(e) => {
                const newVal = e.target.checked;
                setAllowRepeatSelection(newVal);
                loadData(currentStage, newVal);
              }}
              className="w-4 h-4 text-amber-500 rounded bg-slate-800 border-slate-700 focus:ring-amber-500"
            />
            <span className="text-slate-300 font-medium">
              Allow Repeat in Stage
            </span>
          </label>

          <div className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
            Eligible Pool: <span className="font-bold text-emerald-400">{spinPool.length}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Wheel on Left, Selected Teams List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Wheel & Controls */}
        <div className="lg:col-span-7 flex flex-col items-center bg-[#121622] border border-slate-800 rounded-2xl p-6 shadow-xl relative">
          {/* Spin Wheel Canvas */}
          {spinPool.length === 0 && !isDrawComplete ? (
            <div className="h-[440px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-200">
                {totalDbTeamsCount > 0 ? 'All Teams Have Already Played' : 'No Teams in Database'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {totalDbTeamsCount > 0
                  ? `There are ${totalDbTeamsCount.toLocaleString()} teams in your database, but all have completed their rotation. Click below to reset the rotation and spin again.`
                  : 'Please upload your master registration Excel file on the Import Excel page. All teams will automatically appear here.'}
              </p>
              {totalDbTeamsCount > 0 ? (
                <button
                  onClick={handleResetRotation}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Rotation & Enable All {totalDbTeamsCount.toLocaleString()} Teams</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Go to Dashboard to Import
                </button>
              )}
            </div>
          ) : (
            <SpinWheel
              teams={spinPool.length > 0 ? spinPool : eligibleTeams}
              selectedWinnerId={targetWinnerId}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              winnerTeam={currentWinnerTeam}
              isBatchSpinning={isBatchSelecting}
              batchCount={targetCount - selectedCount}
            />
          )}

          {/* Action Buttons: 1-Click Select 12 Captains & Send DMs + Single Spin */}
          <div className="mt-6 w-full max-w-lg flex flex-col items-center gap-3">
            {isDrawComplete ? (
              <div className="w-full text-center space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {failedDmsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSendSelectionDmsToAll(undefined, true)}
                      disabled={isSendingBatchDms}
                      className="py-3 px-4 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry {failedDmsCount} Failed DM{failedDmsCount > 1 ? 's' : ''}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('match-management')}
                    className={`py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer ${failedDmsCount > 0 ? '' : 'sm:col-span-2'}`}
                  >
                    <Key className="w-4 h-4 text-emerald-200" />
                    <span>Proceed to Match Management (Send Room Password)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                {/* 12 Teams Spin Button */}
                <button
                  type="button"
                  onClick={() => handleBatchSelectAndSendDms(Math.min(12, Math.max(1, 12 - selectedCount)))}
                  disabled={isSpinning || isBatchSelecting || isSendingBatchDms || spinPool.length === 0}
                  className="py-2.5 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSpinning || isBatchSelecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Spinning 12 Teams...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>SPIN 12 TEAMS</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Batch DM Progress Card */}
            {batchDmProgress && (
              <div className="w-full p-3 bg-slate-900/95 border border-slate-700 rounded-xl text-xs space-y-2 animate-fadeIn shadow-lg">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    {isSendingBatchDms ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {isSendingBatchDms
                        ? `Dispatching Discord DMs to ${batchDmProgress.total} Captains...`
                        : `DMs Complete: ${batchDmProgress.successCount} Delivered, ${batchDmProgress.failCount} Failed`}
                    </span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {batchDmProgress.current} / {batchDmProgress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 transition-all duration-300"
                    style={{ width: `${(batchDmProgress.current / batchDmProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Teams List */}
        <div className="lg:col-span-5 bg-[#121622] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Selected Teams ({selectedCount}/{targetCount})
              </h2>
              <p className="text-[11px] text-slate-400">
                Lobby Squads for This Tournament Match
              </p>
            </div>

            {selectedCount > 0 && (
              <div className="flex items-center gap-1.5">
                {failedDmsCount > 0 ? (
                  <button
                    onClick={() => handleSendSelectionDmsToAll(undefined, true)}
                    disabled={isSendingBatchDms}
                    title="Retry sending Discord DMs to failed captains"
                    className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-rose-500/40 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Failed ({failedDmsCount})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendSelectionDmsToAll()}
                    disabled={isSendingBatchDms}
                    title="Send/Re-send congratulations Discord DM to all selected captains"
                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-emerald-500/40 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send DMs ({selectedCount})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List of slots 1..targetCount */}
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {(() => {
              const maxEmptyPlaceholders = 3;
              const emptySlotsCount = Math.max(0, targetCount - selectedCount);
              const placeholdersToShow = Math.min(emptySlotsCount, maxEmptyPlaceholders);
              const hiddenEmptySlots = emptySlotsCount - placeholdersToShow;

              return (
                <>
                  {/* Render Selected Teams */}
                  {selections.map((sel) => {
                    const order = sel.selection_order;
                    const dmStatus = dmStatusMap[sel.id];

                    return (
                      <div
                        key={sel.id}
                        className="p-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl flex items-center justify-between animate-fadeIn"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center border border-emerald-500/40 shrink-0">
                            {order}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-100 truncate">
                              {sel.team_name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              Captain: <span className="text-slate-200">{sel.captain_name}</span>
                              {sel.captain_discord_id && (
                                <span className="ml-1 text-[11px] font-mono text-cyan-400">(@{sel.captain_discord_id})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Discord status pill */}
                        <div className="text-right shrink-0 ml-2">
                          {dmStatus?.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                              <Check className="w-3 h-3" /> DM Sent
                            </span>
                          ) : dmStatus?.status === 'sending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Sending...
                            </span>
                          ) : dmStatus?.status === 'failed' ? (
                            <div className="flex items-center gap-1.5">
                              <span 
                                title={dmStatus.error}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60 cursor-help"
                              >
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                              <button
                                onClick={() => sendSelectionDiscordDm(sel.id, {
                                  id: sel.team_id,
                                  team_name: sel.team_name,
                                  captain_name: sel.captain_name,
                                  captain_discord_id: sel.captain_discord_id,
                                })}
                                className="px-1.5 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-[9px] font-semibold transition-colors cursor-pointer"
                                title="Retry sending Discord DM"
                              >
                                Retry
                              </button>
                            </div>
                          ) : sel.captain_discord_id ? (
                            <button
                              onClick={() => sendSelectionDiscordDm(sel.id, {
                                id: sel.team_id,
                                team_name: sel.team_name,
                                captain_name: sel.captain_name,
                                captain_discord_id: sel.captain_discord_id,
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 cursor-pointer"
                            >
                              <Send className="w-2.5 h-2.5" /> Send DM
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400 italic">No Discord ID</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Render Awaiting Placeholders */}
                  {Array.from({ length: placeholdersToShow }).map((_, idx) => {
                    const order = selectedCount + idx + 1;
                    return (
                      <div
                        key={`awaiting_${idx}`}
                        className="p-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-500"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-800/60 text-slate-600 text-xs font-mono flex items-center justify-center">
                            {order}
                          </span>
                          <span className="italic">Awaiting team #{order}...</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                          Slot #{order}
                        </span>
                      </div>
                    );
                  })}

                  {/* Summary for large target counts */}
                  {hiddenEmptySlots > 0 && (
                    <div className="p-3 bg-slate-900/30 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400 font-mono">
                      + {hiddenEmptySlots.toLocaleString()} more slots awaiting selection (target: {targetCount.toLocaleString()} teams)
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Customizable Congratulations Message Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121624] border border-slate-700/60 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Customize Congratulations Message
                </h3>
              </div>
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This message will be sent automatically to each captain when their team is selected.
              <span className="text-amber-400 block mt-1 font-semibold">
                ⚠️ Room ID and Password must NOT be included here. They will be sent later from Match Management.
              </span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Message Content
              </label>
              <textarea
                value={tempTemplate}
                onChange={(e) => setTempTemplate(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                placeholder="Enter congratulations template..."
              />
              <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-300">Available Placeholders:</span>
                <code className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">&#123;captain_name&#125;</code>
                <code className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">&#123;team_name&#125;</code>
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview</span>
              <p className="text-xs text-slate-200 whitespace-pre-line">
                {tempTemplate
                  .replace(/\{captain_name\}/gi, 'Ragnarok')
                  .replace(/\{team_name\}/gi, 'Team Phoenix')}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setTempTemplate(DEFAULT_CONGRATS_TEMPLATE)}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Reset to Default
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomCongratsTemplate(tempTemplate);
                    localStorage.setItem('selection_congrats_template', tempTemplate);
                    setShowTemplateModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Reset Active Draw */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset Active Draw?"
        message={`Are you sure you want to cancel Draw #${activeDraw?.draw_number}? All selected teams will be returned to the eligible pool.`}
        confirmLabel="Yes, Reset Draw"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleResetDraw}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
