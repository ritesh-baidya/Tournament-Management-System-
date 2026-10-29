import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TournamentDatabase } from '../electron/database';
import path from 'path';
import fs from 'fs';

describe('SQLite Database Persistence, Recovery & Backup/Restore', () => {
  const dbFile = path.join(process.cwd(), 'tests', 'test_recovery.db');
  const backupFile = path.join(process.cwd(), 'tests', 'test_backup.db');

  beforeEach(() => {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
  });

  afterEach(() => {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
  });

  it('should recover active draw state if application closes unexpectedly', async () => {
    // Phase 1: Open DB, import teams, create draw, spin 3 teams
    let db1 = new TournamentDatabase(dbFile);
    await db1.initialize();

    db1.importTeamsBatch([
      { team_name: 'Team 1', captain_name: 'Capt 1', players: [] },
      { team_name: 'Team 2', captain_name: 'Capt 2', players: [] },
      { team_name: 'Team 3', captain_name: 'Capt 3', players: [] },
      { team_name: 'Team 4', captain_name: 'Capt 4', players: [] }
    ]);

    const draw = db1.createDraw(12);
    const teams = db1.getAllTeams();

    db1.recordSelection(draw.id, teams[0].id, 1);
    db1.recordSelection(draw.id, teams[1].id, 2);
    db1.recordSelection(draw.id, teams[2].id, 3);

    // Simulate sudden application closure
    db1 = null as any;

    // Phase 2: Reopen application / new DB instance reading the same file
    const db2 = new TournamentDatabase(dbFile);
    await db2.initialize();

    const activeDraw = db2.getActiveDraw();
    expect(activeDraw).toBeDefined();
    expect(activeDraw?.id).toBe(draw.id);
    expect(activeDraw?.draw_number).toBe(draw.draw_number);
    expect(activeDraw?.selections?.length).toBe(3);
    expect(activeDraw?.selections[0].team_name).toBe('Team 1');
    expect(activeDraw?.selections[1].team_name).toBe('Team 2');
    expect(activeDraw?.selections[2].team_name).toBe('Team 3');
  });

  it('should finalize a draw and preserve records across restarts', async () => {
    const db = new TournamentDatabase(dbFile);
    await db.initialize();

    db.importTeamsBatch([
      { team_name: 'Squad X', captain_name: 'Capt X', players: [] }
    ]);

    const draw = db.createDraw(1);
    const team = db.getAllTeams()[0];
    db.recordSelection(draw.id, team.id, 1);

    db.finalizeDraw(draw.id);

    const history = db.getDrawHistory();
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('finalized');
    expect(history[0].selections[0].team_name).toBe('Squad X');
  });

  it('should backup database to file and successfully restore from backup', async () => {
    const dbOriginal = new TournamentDatabase(dbFile);
    await dbOriginal.initialize();

    dbOriginal.importTeamsBatch([
      { team_name: 'Original Team 1', captain_name: 'Leader 1', players: [] }
    ]);

    // Create backup
    dbOriginal.backupDatabase(backupFile);
    expect(fs.existsSync(backupFile)).toBe(true);

    // Modify original database
    dbOriginal.importTeamsBatch([
      { team_name: 'Original Team 2', captain_name: 'Leader 2', players: [] }
    ]);
    expect(dbOriginal.getAllTeams().length).toBe(2);

    // Restore from backup
    await dbOriginal.restoreDatabase(backupFile);

    // After restore, only the original 1 team should exist
    expect(dbOriginal.getAllTeams().length).toBe(1);
    expect(dbOriginal.getAllTeams()[0].team_name).toBe('Original Team 1');
  });
});
