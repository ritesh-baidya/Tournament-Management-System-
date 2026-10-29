import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { Team } from '../types';

interface SpinWheelProps {
  teams: Team[]; // Eligible pool
  selectedWinnerId: string | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  winnerTeam: Team | null;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  teams,
  selectedWinnerId,
  isSpinning,
  onSpinComplete,
  winnerTeam
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSliceSoundRef = useRef<number>(-1);

  // Palette of high-contrast esports neon & dark hues
  const sliceColors = [
    { bg: '#0F291E', border: '#10B981', text: '#34D399', capt: '#A7F3D0' },
    { bg: '#131B2E', border: '#3B82F6', text: '#60A5FA', capt: '#BFDBFE' },
    { bg: '#29182A', border: '#A855F7', text: '#C084FC', capt: '#E9D5FF' },
    { bg: '#2E2211', border: '#F59E0B', text: '#FBBF24', capt: '#FDE68A' },
    { bg: '#102A2B', border: '#06B6D4', text: '#22D3EE', capt: '#A5F3FC' },
    { bg: '#2B131E', border: '#EC4899', text: '#F472B6', capt: '#FBCFE8' }
  ];

  const totalSlices = Math.max(teams.length, 1);
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
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // Wheel background border
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#080C14';
    ctx.fill();
    ctx.restore();

    if (teams.length === 0) {
      // Empty state on wheel
      ctx.save();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO ELIGIBLE TEAMS', centerX, centerY);
      ctx.restore();
      return;
    }

    // Render Slices
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const startA = angle + i * sliceAngle;
      const endA = startA + sliceAngle;
      const colorScheme = sliceColors[i % sliceColors.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = colorScheme.bg;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startA + sliceAngle / 2);

      const textDistance = radius * 0.65;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Team Name (Bold, Prominent)
      ctx.font = 'bold 13px Rajdhani, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const truncatedTeamName = team.team_name.length > 18 ? team.team_name.slice(0, 16) + '..' : team.team_name;
      ctx.fillText(truncatedTeamName, textDistance, -6);

      // Captain Name only (strictly no phone or discord ID)
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = colorScheme.capt;
      const captText = `Capt: ${team.captain_name.length > 14 ? team.captain_name.slice(0, 12) + '..' : team.captain_name}`;
      ctx.fillText(captText, textDistance, 8);

      ctx.restore();
      ctx.restore();
    }

    // Outer edge metallic rim with tick rivets
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Rivet dots around rim
    for (let i = 0; i < totalSlices * 2; i++) {
      const rivetAngle = angle + (i * Math.PI) / totalSlices;
      const rx = centerX + (radius - 3) * Math.cos(rivetAngle);
      const ry = centerY + (radius - 3) * Math.sin(rivetAngle);

      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981';
      ctx.fill();
    }
    ctx.restore();

    // Center Hub (Futuristic Esports Core)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#090D16';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, 2 * Math.PI);
    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.font = '900 11px Orbitron, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FF', centerX, centerY);
    ctx.restore();

    // Top Pointer Arrow / Needle
    ctx.save();
    ctx.translate(centerX, centerY - radius + 10);
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.closePath();

    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [teams, sliceAngle, totalSlices]);

  // Initial draw
  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // Spin Animation Logic
  useEffect(() => {
    if (!isSpinning || !selectedWinnerId || teams.length === 0) return;

    const winnerIdx = teams.findIndex(t => t.id === selectedWinnerId);
    if (winnerIdx === -1) return;

    // The needle is at the top (-PI / 2 radians, or 3 * PI / 2)
    // Slices are drawn starting from angle + i * sliceAngle
    // To land on winnerIdx:
    // angle + winnerIdx * sliceAngle + sliceAngle / 2 = 3 * Math.PI / 2 (mod 2PI)
    // targetAngle = 3 * Math.PI / 2 - (winnerIdx + 0.5) * sliceAngle
    const fullRotations = 6 * 2 * Math.PI; // 6 full dramatic spins
    const targetBase = (3 * Math.PI) / 2 - (winnerIdx + 0.5) * sliceAngle;
    const currentAngle = currentAngleRef.current % (2 * Math.PI);
    let diff = (targetBase - currentAngle) % (2 * Math.PI);
    if (diff < 0) diff += 2 * Math.PI;

    const totalDistance = fullRotations + diff;
    const duration = 5200; // 5.2 seconds for dramatic deceleration
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;

    // Cubic ease-out deceleration: 1 - Math.pow(1 - t, 3.5)
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3.5);

      const current = startAngle + totalDistance * easeProgress;
      currentAngleRef.current = current;

      // Sound tick when passing a slice boundary
      const currentSlice = Math.floor((current / sliceAngle) % totalSlices);
      if (currentSlice !== lastSliceSoundRef.current) {
        lastSliceSoundRef.current = currentSlice;
        soundManager.playTick();
      }

      drawWheel(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished
        soundManager.playWin();
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#3B82F6']
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
  }, [isSpinning, selectedWinnerId, teams, sliceAngle, totalSlices, drawWheel, onSpinComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={520}
          height={520}
          className="max-w-[480px] max-h-[480px] drop-shadow-[0_0_25px_rgba(16,185,129,0.25)]"
        />
      </div>
    </div>
  );
};
