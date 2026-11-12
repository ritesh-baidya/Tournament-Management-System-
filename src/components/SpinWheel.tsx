import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Team } from '../types';

interface SpinWheelProps {
  teams: Team[];
  selectedWinnerId: string | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  winnerTeam: Team | null;
  isBatchSpinning?: boolean;
  batchCount?: number;
}

// Built-in synthesized web audio tick and victory sound (no external mp3 files needed)
const playAudioTick = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
};

const playAudioWin = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.25);
    });
  } catch {}
};

export const SpinWheel: React.FC<SpinWheelProps> = ({
  teams,
  selectedWinnerId,
  isSpinning,
  onSpinComplete,
  winnerTeam,
  isBatchSpinning,
  batchCount
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSliceSoundRef = useRef<number>(-1);
  const [shufflingTeam, setShufflingTeam] = useState<Team | null>(null);

  // Rapidly shuffle through captain names during spin for thrilling game-show HUD
  useEffect(() => {
    if (!isSpinning || teams.length === 0) {
      setShufflingTeam(null);
      return;
    }
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * teams.length);
      setShufflingTeam(teams[randIdx] || null);
    }, 70);
    return () => clearInterval(interval);
  }, [isSpinning, teams]);

  // Palette of high-contrast esports colors
  const sliceColors = [
    { bg: '#0F291E', border: '#10B981', text: '#34D399', capt: '#A7F3D0' },
    { bg: '#131B2E', border: '#3B82F6', text: '#60A5FA', capt: '#BFDBFE' },
    { bg: '#29182A', border: '#A855F7', text: '#C084FC', capt: '#E9D5FF' },
    { bg: '#2E2211', border: '#F59E0B', text: '#FBBF24', capt: '#FDE68A' },
    { bg: '#102A2B', border: '#06B6D4', text: '#22D3EE', capt: '#A5F3FC' },
    { bg: '#2B131E', border: '#EC4899', text: '#F472B6', capt: '#FBCFE8' }
  ];

  // For large pools (e.g. 2,000 teams), display a clean visual window of 32 slices
  const displayTeams = React.useMemo(() => {
    if (teams.length <= 32) return teams;
    const maxSlices = 32;
    const winner = selectedWinnerId ? teams.find(t => t.id === selectedWinnerId) : null;
    const others = teams.filter(t => t.id !== selectedWinnerId).slice(0, winner ? maxSlices - 1 : maxSlices);
    return winner ? [winner, ...others] : others;
  }, [teams, selectedWinnerId]);

  const totalSlices = Math.max(displayTeams.length, 1);
  const sliceAngle = (2 * Math.PI) / totalSlices;

  // Draw the wheel onto the canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    // Outer Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    ctx.strokeStyle = isSpinning ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = isSpinning ? 6 : 4;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = isSpinning ? 20 : 12;
    ctx.stroke();
    ctx.restore();

    // Slices
    for (let i = 0; i < totalSlices; i++) {
      const sliceStart = angle + i * sliceAngle;
      const sliceEnd = sliceStart + sliceAngle;
      const palette = sliceColors[i % sliceColors.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceStart, sliceEnd);
      ctx.closePath();

      ctx.fillStyle = palette.bg;
      ctx.fill();

      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceStart + sliceAngle / 2);

      const team = displayTeams[i];
      if (team) {
        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        const teamLabel = team.team_name.length > 15 ? team.team_name.slice(0, 13) + '..' : team.team_name;
        ctx.fillText(teamLabel, radius - 22, -2);

        ctx.fillStyle = palette.capt;
        ctx.font = '10px Inter, system-ui, sans-serif';
        const captLabel = team.captain_name.length > 16 ? team.captain_name.slice(0, 14) + '..' : team.captain_name;
        ctx.fillText(captLabel, radius - 22, 12);
      }

      ctx.restore();
      ctx.restore();
    }

    // Outer rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Center Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#090D16';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#10B981';
    ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FF', centerX, centerY);
    ctx.restore();

    // Top Pointer Arrow
    ctx.save();
    ctx.translate(centerX, centerY - radius + 10);
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.closePath();

    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = isSpinning ? 24 : 15;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [displayTeams, sliceAngle, totalSlices, isSpinning]);

  // Initial draw
  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // Spin Animation Logic
  useEffect(() => {
    if (!isSpinning || displayTeams.length === 0) return;

    let targetIdx = selectedWinnerId ? displayTeams.findIndex(t => t.id === selectedWinnerId) : 0;
    if (targetIdx === -1) targetIdx = 0;

    const fullRotations = 5 * 2 * Math.PI;
    const targetBase = (3 * Math.PI) / 2 - (targetIdx + 0.5) * sliceAngle;
    const currentAngle = currentAngleRef.current % (2 * Math.PI);
    let diff = (targetBase - currentAngle) % (2 * Math.PI);
    if (diff < 0) diff += 2 * Math.PI;

    const totalDistance = fullRotations + diff;
    const duration = isBatchSpinning ? 3800 : 4500; // Exciting spin duration
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3.5);

      const current = startAngle + totalDistance * easeProgress;
      currentAngleRef.current = current;

      // Sound tick
      const currentSlice = Math.floor((current / sliceAngle) % totalSlices);
      if (currentSlice !== lastSliceSoundRef.current) {
        lastSliceSoundRef.current = currentSlice;
        playAudioTick();
      }

      drawWheel(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Finished
        playAudioWin();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#3B82F6', '#A855F7']
          });
        } catch {}

        onSpinComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, selectedWinnerId, displayTeams, sliceAngle, totalSlices, drawWheel, onSpinComplete, isBatchSpinning]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      {/* Live Rotating Animation HUD: Displays cycling captain & team name in real-time while spinning */}
      {isSpinning && shufflingTeam && (
        <div className="absolute top-2 z-30 px-6 py-3 rounded-2xl bg-[#0B0E17]/95 border-2 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.45)] backdrop-blur-md text-center min-w-[280px] max-w-sm animate-pulse transition-all">
          <div className="flex items-center justify-center gap-2 text-[11px] font-black tracking-widest uppercase text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{isBatchSpinning ? `SPINNING FOR ${batchCount || 12} CAPTAINS...` : 'SPINNING WHEEL...'}</span>
          </div>
          <div className="text-base font-black text-white mt-1 truncate tracking-wide">
            {shufflingTeam.team_name}
          </div>
          <div className="text-xs text-emerald-300 font-semibold truncate flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-slate-400 font-normal">Captain:</span>
            <span>{shufflingTeam.captain_name}</span>
            {shufflingTeam.captain_discord_id && (
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-700/50 px-1.5 py-0.5 rounded">
                @{shufflingTeam.captain_discord_id}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={680}
          height={680}
          className={`max-w-[600px] max-h-[600px] w-full transition-all duration-300 ${
            isSpinning 
              ? 'drop-shadow-[0_0_45px_rgba(16,185,129,0.6)] scale-[1.02]' 
              : 'drop-shadow-[0_0_25px_rgba(16,185,129,0.25)]'
          }`}
        />
      </div>
    </div>
  );
};
