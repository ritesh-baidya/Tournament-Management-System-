import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TournamentDatabase } from '../electron/database';
import path from 'path';
import fs from 'fs';

describe('Team Rotation and Participation Enforcement', () => {
  let db: TournamentDatabase;
  const testDbPath = path.join(process.cwd(), 'tests', 'test_rotation.db');

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    db = new TournamentDatabase(testDbPath);
    await db.initialize();

    // Populate 15 teams
    const teamsToImport = Array.from({ length: 15 }, (_, i) => ({
      team_name: `Squad ${i + 1}`,
      captain_name: `Captain ${i + 1}`,
      players: [
        { name: `Captain ${i + 1}`, role: 'captain', is_captain: true },
        { name: `P2_${i + 1}`, role: 'player2' },
        { name: `P3_${i + 1}`, role: 'player3' },
        { name: `P4_${i + 1}`, role: 'player4' }
      ]
    }));

    db.importTeamsBatch(teamsToImport);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should exclude played teams from subsequent eligible pool after match completion', () => {
    const initialEligible = db.getEligibleTeams();
    expect(initialEligible.length).toBe(15);

    // Create a match
    const match = db.saveMatchDetails({
      match_number: 1,
      room_id: 'ROOM-101',
      room_password: 'PASS',
      match_date: '2026-10-30',
      match_time: '18:00',
      voice_channel_info: 'Lobby #1',
      additional_instructions: 'On time'
    });

    // Assume 12 teams were selected: 10 actually played, 2 were no-shows
    const teamSub = initialEligible.slice(0, 12);
    const participatingTeams = teamSub.map((t, idx) => ({
      team_id: t.id,
      actually_played: idx < 10, // First 10 played, last 2 did not
      notes: idx >= 10 ? 'No show' : 'Completed'
    }));

    const result = db.completeMatch(match.id, participatingTeams, []);

    expect(result.playedCount).toBe(10);
    expect(result.unplayedCount).toBe(2);

    // Now verify the eligible pool for the next draw
    const nextEligible = db.getEligibleTeams();
    // 15 initial - 10 played = 5 eligible (the 3 untouched + the 2 no-shows that stayed eligible!)
    expect(nextEligible.length).toBe(5);

    // Verify played teams
    const playedTeams = db.getPlayedTeams();
    expect(playedTeams.length).toBe(10);
    playedTeams.forEach(t => expect(t.status).toBe('played'));

    // Verify unplayed teams stayed eligible
    const noShowTeam1 = db.getTeamById(teamSub[10].id);
    expect(noShowTeam1?.status).toBe('eligible');
  });

  it('should restore eligibility upon reset rotation with an audit log', () => {
    const allTeams = db.getAllTeams();
    // Complete match to mark teams as played
    const match = db.saveMatchDetails({
      match_number: 1,
      room_id: 'R1',
      room_password: 'P1',
      match_date: '2026-10-30',
      match_time: '18:00',
      voice_channel_info: '',
      additional_instructions: ''
    });

    db.completeMatch(
      match.id,
      allTeams.slice(0, 12).map(t => ({ team_id: t.id, actually_played: true })),
      []
    );

    expect(db.getEligibleTeams().length).toBe(3);
    expect(db.getPlayedTeams().length).toBe(12);

    // Reset rotation
    db.resetRotation('one_time');

    // All 15 teams should be eligible again
    expect(db.getEligibleTeams().length).toBe(15);
    expect(db.getPlayedTeams().length).toBe(0);

    // Audit log recorded
    const logs = db.getAuditLogs();
    expect(logs.some(l => l.action === 'RESET_ROTATION')).toBe(true);
  });

  it('should support manual status override and record reason in audit log', () => {
    const firstTeam = db.getAllTeams()[0];
    db.updateTeamStatus(firstTeam.id, 'disqualified', 'Rule violation in discord');

    const updated = db.getTeamById(firstTeam.id);
    expect(updated?.status).toBe('disqualified');

    const logs = db.getAuditLogs();
    const statusLog = logs.find(l => l.action === 'UPDATE_TEAM_STATUS');
    expect(statusLog).toBeDefined();
    expect(statusLog?.details).toContain('Rule violation in discord');
  });
});
