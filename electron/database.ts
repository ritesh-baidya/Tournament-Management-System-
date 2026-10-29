import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Team, Player, Draw, DrawSelection, Match, MatchTeamParticipation, 
  MatchPlayerParticipation, DashboardStats, TournamentSettings, AuditLog, NotificationLog 
} from '../src/types';

export class TournamentDatabase {
  private db: Database | null = null;
  private dbPath: string;
  private wasmBinaryPath?: string;

  constructor(dbPath?: string, wasmBinaryPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'tournament.db');
    this.wasmBinaryPath = wasmBinaryPath;
  }

  public async initialize(): Promise<void> {
    const locateFile = (file: string) => {
      if (this.wasmBinaryPath && fs.existsSync(this.wasmBinaryPath)) {
        return this.wasmBinaryPath;
      }
      const distPath = path.join(__dirname, 'sql-wasm.wasm');
      if (fs.existsSync(distPath)) return distPath;

      const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
      if (fs.existsSync(nodeModulesPath)) return nodeModulesPath;

      return file;
    };

    const SQL = await initSqlJs({ locateFile });

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } catch (err) {
        console.error('Failed to read existing database file, creating fresh one:', err);
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    this.runMigrations();
    this.persistToDisk();
  }

  public getRawDb(): Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  public persistToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const tempPath = `${this.dbPath}.tmp`;
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  private runMigrations(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        rotation_policy TEXT NOT NULL DEFAULT 'one_time',
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL UNIQUE,
        captain_name TEXT NOT NULL,
        captain_phone TEXT,
        captain_discord_id TEXT,
        status TEXT NOT NULL DEFAULT 'eligible',
        original_data_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_captain INTEGER NOT NULL DEFAULT 0,
        extra_info TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS draws (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        draw_number INTEGER NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 12,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at TEXT NOT NULL,
        finalized_at TEXT
      );

      CREATE TABLE IF NOT EXISTS draw_selections (
        id TEXT PRIMARY KEY,
        draw_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        selection_order INTEGER NOT NULL,
        selected_at TEXT NOT NULL,
        notification_status TEXT NOT NULL DEFAULT 'pending',
        discord_message_id TEXT,
        notification_error TEXT,
        notified_at TEXT,
        FOREIGN KEY (draw_id) REFERENCES draws(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        draw_id TEXT,
        match_number INTEGER NOT NULL,
        room_id TEXT,
        room_password TEXT,
        match_date TEXT,
        match_time TEXT,
        voice_channel_info TEXT,
        additional_instructions TEXT,
        room_notification_status TEXT NOT NULL DEFAULT 'draft',
        status TEXT NOT NULL DEFAULT 'scheduled',
        completed_at TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (draw_id) REFERENCES draws(id)
      );

      CREATE TABLE IF NOT EXISTS match_team_participation (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        selection_order INTEGER,
        actually_played INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS match_player_participation (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        role TEXT NOT NULL,
        participated INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
      );

      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        team_id TEXT NOT NULL,
        captain_discord_id TEXT NOT NULL,
        captain_name TEXT,
        status TEXT NOT NULL,
        message_content TEXT NOT NULL,
        message_id TEXT,
        error_message TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Ensure default settings exist
    const defaultSettings: [string, string][] = [
      ['tournament_name', 'Free Fire Championship 2026'],
      ['rotation_policy', 'one_time'],
      ['selection_target', '12'],
      ['discord_bot_token', ''],
      ['sound_enabled', 'true'],
      ['rules', JSON.stringify([
        'All team captains must be present in Discord 15 minutes before match time.',
        'Every player must remain in their assigned team voice channel during gameplay.',
        'Room ID and Password must not be shared with unauthorized players or outsiders.',
        'Emulator use is strictly prohibited unless specifically permitted by organizers.',
        'Teams arriving more than 10 minutes late forfeit their match slot.'
      ])]
    ];

    for (const [key, val] of defaultSettings) {
      const existing = this.getSetting(key);
      if (existing === null) {
        this.setSetting(key, val);
      }
    }
  }

  // --- SETTINGS ---
  public getSetting(key: string): string | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = :key');
    stmt.bind({ ':key': key });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.value as string;
    }
    stmt.free();
    return null;
  }

  public setSetting(key: string, value: string): void {
    if (!this.db) return;
    this.db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (:key, :value)',
      { ':key': key, ':value': value }
    );
    this.persistToDisk();
  }

  public getSettings(): TournamentSettings {
    const rulesStr = this.getSetting('rules');
    let rules: string[] = [];
    try {
      rules = rulesStr ? JSON.parse(rulesStr) : [];
    } catch {
      rules = [];
    }

    return {
      tournament_name: this.getSetting('tournament_name') || 'Free Fire Tournament',
      rotation_policy: (this.getSetting('rotation_policy') as any) || 'one_time',
      selection_target: parseInt(this.getSetting('selection_target') || '12', 10),
      discord_bot_token: this.getSetting('discord_bot_token') || '',
      discord_guild_id: this.getSetting('discord_guild_id') || '',
      sound_enabled: this.getSetting('sound_enabled') !== 'false',
      rules
    };
  }

  public saveSettings(settings: Partial<TournamentSettings>): void {
    if (settings.tournament_name !== undefined) this.setSetting('tournament_name', settings.tournament_name);
    if (settings.rotation_policy !== undefined) this.setSetting('rotation_policy', settings.rotation_policy);
    if (settings.selection_target !== undefined) this.setSetting('selection_target', settings.selection_target.toString());
    if (settings.discord_bot_token !== undefined) this.setSetting('discord_bot_token', settings.discord_bot_token);
    if (settings.discord_guild_id !== undefined) this.setSetting('discord_guild_id', settings.discord_guild_id);
    if (settings.sound_enabled !== undefined) this.setSetting('sound_enabled', settings.sound_enabled ? 'true' : 'false');
    if (settings.rules !== undefined) this.setSetting('rules', JSON.stringify(settings.rules));

    this.addAuditLog('UPDATE_SETTINGS', 'Organizer updated tournament settings');
  }

  // --- AUDIT LOGS ---
  public addAuditLog(action: string, details: string): void {
    if (!this.db) return;
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    this.db.run(
      'INSERT INTO audit_logs (id, action, details, timestamp) VALUES (:id, :action, :details, :timestamp)',
      { ':id': id, ':action': action, ':details': details, ':timestamp': timestamp }
    );
    this.persistToDisk();
  }

  public getAuditLogs(): AuditLog[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
    if (!res || res.length === 0) return [];
    const cols = res[0].columns;
    return res[0].values.map(row => {
      const obj: any = {};
      cols.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj as AuditLog;
    });
  }

  // --- TEAMS & PLAYERS ---
  public getAllTeams(): Team[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT * FROM teams ORDER BY team_name ASC');
    if (!res || res.length === 0) return [];

    const teams: Team[] = res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj as Team;
    });

    // Populate players for each team
    for (const team of teams) {
      team.players = this.getTeamPlayers(team.id);
      if (team.original_data_json) {
        try {
          team.extra_columns = JSON.parse(team.original_data_json);
        } catch {}
      }
    }
    return teams;
  }

  public getEligibleTeams(): Team[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teams WHERE status = 'eligible' ORDER BY team_name ASC");
    if (!res || res.length === 0) return [];

    return res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      const team = obj as Team;
      team.players = this.getTeamPlayers(team.id);
      return team;
    });
  }

  public getPlayedTeams(): Team[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teams WHERE status = 'played' ORDER BY updated_at DESC");
    if (!res || res.length === 0) return [];

    return res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      const team = obj as Team;
      team.players = this.getTeamPlayers(team.id);
      return team;
    });
  }

  public getTeamById(id: string): Team | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM teams WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Team;
      stmt.free();
      row.players = this.getTeamPlayers(row.id);
      if (row.original_data_json) {
        try { row.extra_columns = JSON.parse(row.original_data_json); } catch {}
      }
      return row;
    }
    stmt.free();
    return null;
  }

  public getTeamPlayers(teamId: string): Player[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM players WHERE team_id = :team_id ORDER BY is_captain DESC, role ASC');
    stmt.bind({ ':team_id': teamId });
    const players: Player[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      players.push({
        id: row.id,
        team_id: row.team_id,
        player_name: row.player_name,
        role: row.role,
        is_captain: Boolean(row.is_captain),
        extra_info: row.extra_info
      });
    }
    stmt.free();
    return players;
  }

  public updateTeamStatus(teamId: string, status: string, reason?: string): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      'UPDATE teams SET status = :status, updated_at = :updated_at WHERE id = :id',
      { ':status': status, ':updated_at': now, ':id': teamId }
    );
    this.addAuditLog('UPDATE_TEAM_STATUS', `Team ${teamId} changed to ${status}. Reason: ${reason || 'Manual update'}`);
    this.persistToDisk();
  }

  public resetRotation(policy: 'one_time' | 'recurring_cycle'): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    // Reset played and selected teams back to eligible
    this.db.run(
      "UPDATE teams SET status = 'eligible', updated_at = :now WHERE status IN ('played', 'selected')",
      { ':now': now }
    );
    this.addAuditLog('RESET_ROTATION', `Rotation reset under policy: ${policy}`);
    this.persistToDisk();
  }

  public importTeamsBatch(teamsToImport: Array<{
    team_name: string;
    captain_name: string;
    captain_phone?: string;
    captain_discord_id?: string;
    players: Array<{ name: string; role: string; is_captain?: boolean }>;
    extra_columns?: Record<string, string>;
  }>): { inserted: number; updated: number } {
    if (!this.db) throw new Error('Database not initialized');

    let inserted = 0;
    let updated = 0;
    const now = new Date().toISOString();

    this.db.run('BEGIN TRANSACTION;');
    try {
      for (const t of teamsToImport) {
        // Check if team already exists by team_name
        const checkStmt = this.db.prepare('SELECT id FROM teams WHERE LOWER(team_name) = LOWER(:name)');
        checkStmt.bind({ ':name': t.team_name.trim() });
        let teamId: string;
        const exists = checkStmt.step();
        if (exists) {
          teamId = checkStmt.getAsObject().id as string;
          checkStmt.free();

          // Update existing team
          this.db.run(
            `UPDATE teams SET 
              captain_name = :captain_name,
              captain_phone = :captain_phone,
              captain_discord_id = :captain_discord_id,
              original_data_json = :json,
              updated_at = :now
             WHERE id = :id`,
            {
              ':captain_name': t.captain_name.trim(),
              ':captain_phone': t.captain_phone?.trim() || null,
              ':captain_discord_id': t.captain_discord_id?.trim() || null,
              ':json': t.extra_columns ? JSON.stringify(t.extra_columns) : null,
              ':now': now,
              ':id': teamId
            }
          );

          // Clear old players and insert refreshed ones
          this.db.run('DELETE FROM players WHERE team_id = :team_id', { ':team_id': teamId });
          updated++;
        } else {
          checkStmt.free();
          teamId = crypto.randomUUID();
          this.db.run(
            `INSERT INTO teams (id, team_name, captain_name, captain_phone, captain_discord_id, status, original_data_json, created_at, updated_at)
             VALUES (:id, :name, :capt, :phone, :discord, 'eligible', :json, :created, :updated)`,
            {
              ':id': teamId,
              ':name': t.team_name.trim(),
              ':capt': t.captain_name.trim(),
              ':phone': t.captain_phone?.trim() || null,
              ':discord': t.captain_discord_id?.trim() || null,
              ':json': t.extra_columns ? JSON.stringify(t.extra_columns) : null,
              ':created': now,
              ':updated': now
            }
          );
          inserted++;
        }

        // Insert Captain player
        const captPlayerId = crypto.randomUUID();
        this.db.run(
          `INSERT INTO players (id, team_id, player_name, role, is_captain)
           VALUES (:id, :team_id, :name, 'captain', 1)`,
          {
            ':id': captPlayerId,
            ':team_id': teamId,
            ':name': t.captain_name.trim()
          }
        );

        // Insert other players
        for (const p of t.players) {
          if (!p.name || p.is_captain) continue;
          const pid = crypto.randomUUID();
          this.db.run(
            `INSERT INTO players (id, team_id, player_name, role, is_captain)
             VALUES (:id, :team_id, :name, :role, 0)`,
            {
              ':id': pid,
              ':team_id': teamId,
              ':name': p.name.trim(),
              ':role': p.role
            }
          );
        }
      }

      this.db.run('COMMIT;');
      this.addAuditLog('IMPORT_EXCEL', `Imported ${inserted} new teams, updated ${updated} existing teams`);
      this.persistToDisk();
      return { inserted, updated };
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  // --- DRAWS & SELECTIONS ---
  public getActiveDraw(): Draw | null {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM draws WHERE status = 'in_progress' ORDER BY created_at DESC LIMIT 1");
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Draw;
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }

  public getDrawById(id: string): Draw | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM draws WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Draw;
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }

  public getLatestDraw(): Draw | null {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 1");
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Draw;
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }

  public getDrawSelections(drawId: string): DrawSelection[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT ds.*, t.team_name, t.captain_name, t.captain_discord_id
      FROM draw_selections ds
      JOIN teams t ON ds.team_id = t.id
      WHERE ds.draw_id = :draw_id
      ORDER BY ds.selection_order ASC
    `);
    stmt.bind({ ':draw_id': drawId });
    const selections: DrawSelection[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      selections.push({
        id: row.id,
        draw_id: row.draw_id,
        team_id: row.team_id,
        team_name: row.team_name,
        captain_name: row.captain_name,
        captain_discord_id: row.captain_discord_id,
        selection_order: row.selection_order,
        selected_at: row.selected_at,
        notification_status: row.notification_status,
        discord_message_id: row.discord_message_id,
        notification_error: row.notification_error,
        notified_at: row.notified_at
      });
    }
    stmt.free();
    return selections;
  }

  public createDraw(targetCount: number = 12): Draw {
    if (!this.db) throw new Error('Database not initialized');

    // Cancel any existing active draw
    const active = this.getActiveDraw();
    if (active) {
      this.cancelDraw(active.id);
    }

    // Determine next draw number
    const countRes = this.db.exec('SELECT COUNT(*) as count FROM draws');
    const drawNumber = ((countRes[0]?.values[0][0] as number) || 0) + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO draws (id, tournament_id, draw_number, target_count, status, created_at)
       VALUES (:id, 'tournament-main', :draw_num, :target, 'in_progress', :created)`,
      {
        ':id': id,
        ':draw_num': drawNumber,
        ':target': targetCount,
        ':created': now
      }
    );

    this.addAuditLog('CREATE_DRAW', `Started Draw #${drawNumber} with target of ${targetCount} teams`);
    this.persistToDisk();

    return {
      id,
      tournament_id: 'tournament-main',
      draw_number: drawNumber,
      target_count: targetCount,
      status: 'in_progress',
      created_at: now,
      selections: []
    };
  }

  public recordSelection(drawId: string, teamId: string, order: number): DrawSelection {
    if (!this.db) throw new Error('Database not initialized');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run('BEGIN TRANSACTION;');
    try {
      // Insert selection record
      this.db.run(
        `INSERT INTO draw_selections (id, draw_id, team_id, selection_order, selected_at, notification_status)
         VALUES (:id, :draw_id, :team_id, :order, :selected_at, 'pending')`,
        {
          ':id': id,
          ':draw_id': drawId,
          ':team_id': teamId,
          ':order': order,
          ':selected_at': now
        }
      );

      // Update team status to 'selected'
      this.db.run(
        "UPDATE teams SET status = 'selected', updated_at = :now WHERE id = :team_id",
        { ':now': now, ':team_id': teamId }
      );

      this.db.run('COMMIT;');
      this.persistToDisk();

      const team = this.getTeamById(teamId);
      this.addAuditLog('RECORD_SELECTION', `Draw ${drawId}: Team "${team?.team_name}" selected at #${order}`);

      return {
        id,
        draw_id: drawId,
        team_id: teamId,
        team_name: team?.team_name || '',
        captain_name: team?.captain_name || '',
        captain_discord_id: team?.captain_discord_id || undefined,
        selection_order: order,
        selected_at: now,
        notification_status: 'pending'
      };
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  public finalizeDraw(drawId: string): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      "UPDATE draws SET status = 'finalized', finalized_at = :now WHERE id = :id",
      { ':now': now, ':id': drawId }
    );
    this.addAuditLog('FINALIZE_DRAW', `Finalized draw ${drawId}`);
    this.persistToDisk();
  }

  public cancelDraw(drawId: string): void {
    if (!this.db) return;
    this.db.run('BEGIN TRANSACTION;');
    try {
      // Revert selected teams to eligible
      this.db.run(`
        UPDATE teams 
        SET status = 'eligible' 
        WHERE id IN (SELECT team_id FROM draw_selections WHERE draw_id = :draw_id)
          AND status = 'selected'
      `, { ':draw_id': drawId });

      this.db.run(
        "UPDATE draws SET status = 'cancelled' WHERE id = :draw_id",
        { ':draw_id': drawId }
      );

      this.db.run('COMMIT;');
      this.addAuditLog('CANCEL_DRAW', `Cancelled draw ${drawId} and returned teams to eligible`);
      this.persistToDisk();
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  public getDrawHistory(): Draw[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM draws WHERE status != 'cancelled' ORDER BY draw_number DESC");
    if (!res || res.length === 0) return [];

    const draws: Draw[] = res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj as Draw;
    });

    for (const d of draws) {
      d.selections = this.getDrawSelections(d.id);
    }

    return draws;
  }

  // --- MATCH DETAILS & MATCH PARTICIPATION ---
  public getMatches(): Match[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT * FROM matches ORDER BY match_number DESC');
    if (!res || res.length === 0) return [];

    return res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj as Match;
    });
  }

  public getLatestMatch(): Match | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM matches ORDER BY match_number DESC LIMIT 1');
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Match;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  public getMatchById(id: string): Match | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM matches WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as any as Match;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  public saveMatchDetails(data: {
    id?: string;
    draw_id?: string;
    match_number: number;
    room_id: string;
    room_password: string;
    match_date: string;
    match_time: string;
    voice_channel_info: string;
    additional_instructions: string;
    admin_notes?: string;
  }): Match {
    if (!this.db) throw new Error('Database not initialized');

    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const existing = this.getMatchById(id);
    if (existing) {
      this.db.run(
        `UPDATE matches SET
          room_id = :room_id,
          room_password = :room_password,
          match_date = :match_date,
          match_time = :match_time,
          voice_channel_info = :voice_info,
          additional_instructions = :instr,
          admin_notes = :notes
         WHERE id = :id`,
        {
          ':room_id': data.room_id,
          ':room_password': data.room_password,
          ':match_date': data.match_date,
          ':match_time': data.match_time,
          ':voice_info': data.voice_channel_info,
          ':instr': data.additional_instructions,
          ':notes': data.admin_notes || '',
          ':id': id
        }
      );
      this.addAuditLog('UPDATE_MATCH_DETAILS', `Updated details for Match #${data.match_number}`);
    } else {
      this.db.run(
        `INSERT INTO matches (id, draw_id, match_number, room_id, room_password, match_date, match_time, voice_channel_info, additional_instructions, room_notification_status, status, admin_notes, created_at)
         VALUES (:id, :draw_id, :match_num, :room_id, :room_password, :match_date, :match_time, :voice_info, :instr, 'draft', 'scheduled', :notes, :created)`,
        {
          ':id': id,
          ':draw_id': data.draw_id || null,
          ':match_num': data.match_number,
          ':room_id': data.room_id,
          ':room_password': data.room_password,
          ':match_date': data.match_date,
          ':match_time': data.match_time,
          ':voice_info': data.voice_channel_info,
          ':instr': data.additional_instructions,
          ':notes': data.admin_notes || '',
          ':created': now
        }
      );
      this.addAuditLog('CREATE_MATCH', `Created Match #${data.match_number}`);
    }

    this.persistToDisk();
    return this.getMatchById(id)!;
  }

  public completeMatch(
    matchId: string, 
    participatingTeams: Array<{ team_id: string; actually_played: boolean; notes?: string }>,
    participatingPlayers: Array<{ team_id: string; player_id: string; player_name: string; role: string; participated: boolean }>,
    adminNotes: string = ''
  ): { playedCount: number; unplayedCount: number } {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    let playedCount = 0;
    let unplayedCount = 0;

    this.db.run('BEGIN TRANSACTION;');
    try {
      // 1. Mark match completed
      this.db.run(
        `UPDATE matches SET status = 'completed', completed_at = :now, admin_notes = :notes WHERE id = :id`,
        { ':now': now, ':notes': adminNotes, ':id': matchId }
      );

      // 2. Clear any old participation entries for this match to ensure idempotency
      this.db.run('DELETE FROM match_team_participation WHERE match_id = :id', { ':id': matchId });
      this.db.run('DELETE FROM match_player_participation WHERE match_id = :id', { ':id': matchId });

      // 3. Insert team participation & update team eligibility status
      for (let i = 0; i < participatingTeams.length; i++) {
        const item = participatingTeams[i];
        const partId = crypto.randomUUID();
        this.db.run(
          `INSERT INTO match_team_participation (id, match_id, team_id, selection_order, actually_played, notes)
           VALUES (:id, :match_id, :team_id, :order, :actually_played, :notes)`,
          {
            ':id': partId,
            ':match_id': matchId,
            ':team_id': item.team_id,
            ':order': i + 1,
            ':actually_played': item.actually_played ? 1 : 0,
            ':notes': item.notes || ''
          }
        );

        if (item.actually_played) {
          // Team actually played -> mark as 'played' (ineligible for next draw by default)
          this.db.run(
            "UPDATE teams SET status = 'played', updated_at = :now WHERE id = :team_id",
            { ':now': now, ':team_id': item.team_id }
          );
          playedCount++;
        } else {
          // Team did not play (no-show/forfeit) -> return to 'eligible'
          this.db.run(
            "UPDATE teams SET status = 'eligible', updated_at = :now WHERE id = :team_id",
            { ':now': now, ':team_id': item.team_id }
          );
          unplayedCount++;
        }
      }

      // 4. Insert player participation
      for (const p of participatingPlayers) {
        const playerPartId = crypto.randomUUID();
        this.db.run(
          `INSERT INTO match_player_participation (id, match_id, team_id, player_id, player_name, role, participated)
           VALUES (:id, :match_id, :team_id, :player_id, :name, :role, :participated)`,
          {
            ':id': playerPartId,
            ':match_id': matchId,
            ':team_id': p.team_id,
            ':player_id': p.player_id,
            ':name': p.player_name,
            ':role': p.role,
            ':participated': p.participated ? 1 : 0
          }
        );
      }

      // 5. If this match is associated with a draw, finalize the draw
      const match = this.getMatchById(matchId);
      if (match?.draw_id) {
        this.db.run(
          "UPDATE draws SET status = 'finalized', finalized_at = :now WHERE id = :draw_id",
          { ':now': now, ':draw_id': match.draw_id }
        );
      }

      this.db.run('COMMIT;');
      this.addAuditLog('COMPLETE_MATCH', `Match #${match?.match_number} completed: ${playedCount} played (marked ineligible), ${unplayedCount} unplayed (returned to eligible)`);
      this.persistToDisk();

      return { playedCount, unplayedCount };
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  public getMatchTeamParticipation(matchId: string): MatchTeamParticipation[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT mtp.*, t.team_name, t.captain_name
      FROM match_team_participation mtp
      JOIN teams t ON mtp.team_id = t.id
      WHERE mtp.match_id = :match_id
      ORDER BY mtp.selection_order ASC
    `);
    stmt.bind({ ':match_id': matchId });
    const list: MatchTeamParticipation[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      list.push({
        id: row.id,
        match_id: row.match_id,
        team_id: row.team_id,
        team_name: row.team_name,
        captain_name: row.captain_name,
        selection_order: row.selection_order,
        actually_played: Boolean(row.actually_played),
        notes: row.notes,
        players: this.getMatchPlayerParticipation(matchId, row.team_id)
      });
    }
    stmt.free();
    return list;
  }

  public getMatchPlayerParticipation(matchId: string, teamId: string): MatchPlayerParticipation[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT * FROM match_player_participation
      WHERE match_id = :match_id AND team_id = :team_id
      ORDER BY role ASC
    `);
    stmt.bind({ ':match_id': matchId, ':team_id': teamId });
    const list: MatchPlayerParticipation[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      list.push({
        id: row.id,
        match_id: row.match_id,
        team_id: row.team_id,
        player_id: row.player_id,
        player_name: row.player_name,
        role: row.role,
        participated: Boolean(row.participated)
      });
    }
    stmt.free();
    return list;
  }

  // --- NOTIFICATION TRACKING ---
  public updateSelectionNotificationStatus(
    selectionId: string, 
    status: 'pending' | 'sending' | 'sent' | 'failed', 
    messageId?: string | null, 
    error?: string | null
  ): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE draw_selections 
       SET notification_status = :status, discord_message_id = :msg_id, notification_error = :err, notified_at = :now
       WHERE id = :id`,
      {
        ':status': status,
        ':msg_id': messageId || null,
        ':err': error || null,
        ':now': now,
        ':id': selectionId
      }
    );
    this.persistToDisk();
  }

  public logNotification(data: {
    type: 'selection_dm' | 'room_dm';
    team_id: string;
    captain_discord_id: string;
    captain_name: string;
    status: 'pending' | 'sending' | 'sent' | 'failed';
    message_content: string;
    message_id?: string;
    error_message?: string;
  }): void {
    if (!this.db) return;
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    this.db.run(
      `INSERT INTO notification_logs (id, type, team_id, captain_discord_id, captain_name, status, message_content, message_id, error_message, timestamp)
       VALUES (:id, :type, :team_id, :discord_id, :capt_name, :status, :content, :msg_id, :err, :ts)`,
      {
        ':id': id,
        ':type': data.type,
        ':team_id': data.team_id,
        ':discord_id': data.captain_discord_id,
        ':capt_name': data.captain_name,
        ':status': data.status,
        ':content': data.message_content,
        ':msg_id': data.message_id || null,
        ':err': data.error_message || null,
        ':ts': timestamp
      }
    );
    this.persistToDisk();
  }

  public getNotificationLogs(): NotificationLog[] {
    if (!this.db) return [];
    const res = this.db.exec(`
      SELECT nl.*, t.team_name 
      FROM notification_logs nl 
      LEFT JOIN teams t ON nl.team_id = t.id 
      ORDER BY nl.timestamp DESC LIMIT 100
    `);
    if (!res || res.length === 0) return [];
    return res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj as NotificationLog;
    });
  }

  // --- DASHBOARD STATS ---
  public getDashboardStats(): DashboardStats {
    if (!this.db) {
      return {
        total_teams: 0,
        eligible_teams: 0,
        played_teams: 0,
        selected_teams: 0,
        remaining_eligible: 0,
        notifications_sent: 0,
        notifications_pending: 0,
        notifications_failed: 0,
        latest_draw: null,
        latest_match: null
      };
    }

    const total = (this.db.exec('SELECT COUNT(*) FROM teams')[0]?.values[0][0] as number) || 0;
    const eligible = (this.db.exec("SELECT COUNT(*) FROM teams WHERE status = 'eligible'")[0]?.values[0][0] as number) || 0;
    const played = (this.db.exec("SELECT COUNT(*) FROM teams WHERE status = 'played'")[0]?.values[0][0] as number) || 0;
    const selected = (this.db.exec("SELECT COUNT(*) FROM teams WHERE status = 'selected'")[0]?.values[0][0] as number) || 0;

    const notifSent = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'sent'")[0]?.values[0][0] as number) || 0;
    const notifPending = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'pending'")[0]?.values[0][0] as number) || 0;
    const notifFailed = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'failed'")[0]?.values[0][0] as number) || 0;

    return {
      total_teams: total,
      eligible_teams: eligible,
      played_teams: played,
      selected_teams: selected,
      remaining_eligible: eligible,
      notifications_sent: notifSent,
      notifications_pending: notifPending,
      notifications_failed: notifFailed,
      latest_draw: this.getLatestDraw(),
      latest_match: this.getLatestMatch()
    };
  }

  // --- BACKUP & RESTORE ---
  public backupDatabase(destinationPath: string): void {
    if (!this.db) throw new Error('Database not initialized');
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(destinationPath, buffer);
    this.addAuditLog('BACKUP_DATABASE', `Database backed up to ${destinationPath}`);
  }

  public async restoreDatabase(sourcePath: string): Promise<void> {
    if (!fs.existsSync(sourcePath)) throw new Error('Source backup file does not exist');
    const fileBuffer = fs.readFileSync(sourcePath);
    const SQL = await initSqlJs({
      locateFile: () => path.join(__dirname, 'sql-wasm.wasm')
    });
    const restoredDb = new SQL.Database(fileBuffer);
    this.db = restoredDb;
    this.persistToDisk();
    this.addAuditLog('RESTORE_DATABASE', `Database restored from ${sourcePath}`);
  }
}
