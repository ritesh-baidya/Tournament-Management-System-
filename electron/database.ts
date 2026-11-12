import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Team, Player, Draw, DrawSelection, Match, MatchTeamParticipation, 
  MatchPlayerParticipation, DashboardStats, TournamentSettings, AuditLog, NotificationLog,
  TournamentStage, QualificationStatus 
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
    let wasmBinary: Uint8Array | undefined;
    const candidates = [
      this.wasmBinaryPath,
      path.join(__dirname, 'sql-wasm.wasm'),
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
      path.join(process.cwd(), 'dist-electron', 'sql-wasm.wasm')
    ].filter(Boolean) as string[];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        try {
          const buf = fs.readFileSync(c);
          wasmBinary = new Uint8Array(buf);
          break;
        } catch {}
      }
    }

    const SQL = await initSqlJs({
      wasmBinary: wasmBinary ? (wasmBinary.buffer as ArrayBuffer) : undefined,
      locateFile: () => path.join(__dirname, 'sql-wasm.wasm')
    });

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
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
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

    // Ensure team_name and captain_name exist in match_team_participation so Match History is retained even after teams are reduced from teams table
    try {
      this.db.run('ALTER TABLE match_team_participation ADD COLUMN team_name TEXT;');
    } catch {}
    try {
      this.db.run('ALTER TABLE match_team_participation ADD COLUMN captain_name TEXT;');
    } catch {}

    // Stage & Qualification status migrations (safe & idempotent)
    try {
      this.db.run("ALTER TABLE teams ADD COLUMN current_stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {}
    try {
      this.db.run("ALTER TABLE teams ADD COLUMN qualification_status TEXT NOT NULL DEFAULT 'pending';");
    } catch {}
    try {
      this.db.run("ALTER TABLE matches ADD COLUMN stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {}
    try {
      this.db.run("ALTER TABLE draws ADD COLUMN stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {}
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN match_number INTEGER;");
    } catch {}
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN stage TEXT DEFAULT 'qualifying';");
    } catch {}
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN result TEXT DEFAULT 'pending';");
    } catch {}
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN match_date TEXT;");
    } catch {}

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

    // Populate players, stage, qualification status & match stats for each team
    for (const team of teams) {
      team.players = this.getTeamPlayers(team.id);
      if (!team.current_stage) team.current_stage = 'qualifying';
      if (!team.qualification_status) team.qualification_status = 'pending';
      if (team.original_data_json) {
        try {
          team.extra_columns = JSON.parse(team.original_data_json);
        } catch {}
      }

      // Query match participation count & last result
      try {
        const statsStmt = this.db.prepare(`
          SELECT COUNT(*) as count, result 
          FROM match_team_participation 
          WHERE team_id = :team_id AND actually_played = 1
          ORDER BY rowid DESC LIMIT 1
        `);
        statsStmt.bind({ ':team_id': team.id });
        if (statsStmt.step()) {
          const row = statsStmt.getAsObject() as any;
          team.matches_played_count = row.count || 0;
          team.last_match_result = row.result || undefined;
        }
        statsStmt.free();
      } catch {}
    }
    return teams;
  }

  public getEligibleTeams(stage?: TournamentStage, allowRepeat: boolean = false): Team[] {
    if (!this.db) return [];
    let query: string;
    const params: any = {};

    if (stage) {
      if (allowRepeat) {
        query = `
          SELECT * FROM teams 
          WHERE current_stage = :stage 
            AND qualification_status != 'eliminated'
            AND status NOT IN ('withdrawn', 'disqualified')
          ORDER BY team_name ASC
        `;
        params[':stage'] = stage;
      } else {
        query = `
          SELECT * FROM teams 
          WHERE current_stage = :stage 
            AND qualification_status != 'eliminated'
            AND status NOT IN ('withdrawn', 'disqualified')
            AND id NOT IN (
              SELECT mtp.team_id 
              FROM match_team_participation mtp
              JOIN matches m ON mtp.match_id = m.id
              WHERE m.stage = :stage AND m.status = 'completed' AND mtp.actually_played = 1
            )
          ORDER BY team_name ASC
        `;
        params[':stage'] = stage;
      }
    } else {
      // General eligibility (teams ready for their assigned stage)
      query = `
        SELECT * FROM teams 
        WHERE qualification_status != 'eliminated'
          AND status NOT IN ('withdrawn', 'disqualified')
          AND id NOT IN (
            SELECT mtp.team_id 
            FROM match_team_participation mtp
            JOIN matches m ON mtp.match_id = m.id
            WHERE m.stage = teams.current_stage AND m.status = 'completed' AND mtp.actually_played = 1
          )
        ORDER BY team_name ASC
      `;
    }

    const stmt = this.db.prepare(query);
    stmt.bind(params);
    const teams: Team[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any as Team;
      row.players = this.getTeamPlayers(row.id);
      if (!row.current_stage) row.current_stage = 'qualifying';
      if (!row.qualification_status) row.qualification_status = 'pending';
      teams.push(row);
    }
    stmt.free();
    return teams;
  }

  public getPlayedTeams(): Team[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teams WHERE status = 'played' OR id IN (SELECT DISTINCT team_id FROM match_team_participation WHERE actually_played = 1) ORDER BY updated_at DESC");
    if (!res || res.length === 0) return [];

    return res[0].values.map(row => {
      const obj: any = {};
      res[0].columns.forEach((c, idx) => { obj[c] = row[idx]; });
      const team = obj as Team;
      team.players = this.getTeamPlayers(team.id);
      if (!team.current_stage) team.current_stage = 'qualifying';
      if (!team.qualification_status) team.qualification_status = 'pending';
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
      if (!row.current_stage) row.current_stage = 'qualifying';
      if (!row.qualification_status) row.qualification_status = 'pending';
      if (row.original_data_json) {
        try { row.extra_columns = JSON.parse(row.original_data_json); } catch {}
      }
      return row;
    }
    stmt.free();
    return null;
  }

  public updateTeamQualification(
    teamId: string, 
    qualificationStatus: QualificationStatus, 
    currentStage?: TournamentStage
  ): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    let sql = 'UPDATE teams SET qualification_status = :status, updated_at = :now';
    const params: any = { ':status': qualificationStatus, ':now': now, ':id': teamId };

    if (currentStage) {
      sql += ', current_stage = :stage';
      params[':stage'] = currentStage;
    }
    sql += ' WHERE id = :id';

    this.db.run(sql, params);
    this.addAuditLog('UPDATE_QUALIFICATION', `Team ${teamId} qualification updated to ${qualificationStatus}${currentStage ? ` (Stage: ${currentStage})` : ''}`);
    this.persistToDisk();
  }

  public advanceTeamStage(teamId: string, nextStage: TournamentStage): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE teams 
       SET current_stage = :stage, 
           status = 'eligible', 
           updated_at = :now 
       WHERE id = :id`,
      { ':stage': nextStage, ':now': now, ':id': teamId }
    );
    this.addAuditLog('ADVANCE_STAGE', `Team ${teamId} advanced to stage: ${nextStage}`);
    this.persistToDisk();
  }

  public batchUpdateTeamQualification(
    teamIds: string[], 
    qualificationStatus: QualificationStatus, 
    currentStage?: TournamentStage
  ): void {
    if (!this.db || teamIds.length === 0) return;
    this.db.run('BEGIN TRANSACTION;');
    try {
      for (const tId of teamIds) {
        this.updateTeamQualification(tId, qualificationStatus, currentStage);
      }
      this.db.run('COMMIT;');
      this.persistToDisk();
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  public batchAdvanceTeamStage(teamIds: string[], nextStage: TournamentStage): void {
    if (!this.db || teamIds.length === 0) return;
    this.db.run('BEGIN TRANSACTION;');
    try {
      for (const tId of teamIds) {
        this.advanceTeamStage(tId, nextStage);
      }
      this.db.run('COMMIT;');
      this.persistToDisk();
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  public getTeamMatchHistory(teamId: string): MatchTeamParticipation[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT mtp.*, m.room_id, m.status as match_status
      FROM match_team_participation mtp
      LEFT JOIN matches m ON mtp.match_id = m.id
      WHERE mtp.team_id = :team_id
      ORDER BY mtp.rowid DESC
    `);
    stmt.bind({ ':team_id': teamId });
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
        match_number: row.match_number,
        stage: row.stage,
        result: row.result || 'pending',
        match_date: row.match_date,
        notes: row.notes,
        players: this.getMatchPlayerParticipation(row.match_id, teamId)
      });
    }
    stmt.free();
    return list;
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

  public addPlayer(
    teamId: string, 
    playerName: string, 
    role: string = 'substitute', 
    isCaptain: boolean = false, 
    extraInfo: string = ''
  ): Player {
    if (!this.db) throw new Error('Database not initialized');
    const id = crypto.randomUUID();
    this.db.run(
      `INSERT INTO players (id, team_id, player_name, role, is_captain, extra_info)
       VALUES (:id, :team_id, :player_name, :role, :is_captain, :extra_info)`,
      {
        ':id': id,
        ':team_id': teamId,
        ':player_name': playerName.trim(),
        ':role': role.trim(),
        ':is_captain': isCaptain ? 1 : 0,
        ':extra_info': extraInfo.trim()
      }
    );

    if (isCaptain) {
      this.db.run(
        `UPDATE teams SET captain_name = :captain_name, updated_at = :updated_at WHERE id = :team_id`,
        {
          ':captain_name': playerName.trim(),
          ':updated_at': new Date().toISOString(),
          ':team_id': teamId
        }
      );
    }

    this.addAuditLog('ADD_PLAYER', `Added player "${playerName}" (${role}) to team ${teamId}`);
    this.persistToDisk();

    return {
      id,
      team_id: teamId,
      player_name: playerName.trim(),
      role: role as any,
      is_captain: isCaptain,
      extra_info: extraInfo.trim()
    };
  }

  public deletePlayer(playerId: string): void {
    if (!this.db) return;
    this.db.run('DELETE FROM players WHERE id = :id', { ':id': playerId });
    this.addAuditLog('DELETE_PLAYER', `Deleted player ${playerId}`);
    this.persistToDisk();
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

  public addTeam(
    teamName: string,
    captainName: string,
    captainDiscordId: string = ''
  ): Team {
    if (!this.db) throw new Error('Database not initialized');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO teams (id, team_name, captain_name, captain_discord_id, status, current_stage, qualification_status, created_at, updated_at)
       VALUES (:id, :team_name, :captain_name, :captain_discord_id, 'eligible', 'qualifying', 'pending', :created_at, :updated_at)`,
      {
        ':id': id,
        ':team_name': teamName.trim(),
        ':captain_name': captainName.trim(),
        ':captain_discord_id': captainDiscordId.trim() || null,
        ':created_at': now,
        ':updated_at': now
      }
    );

    const playerId = crypto.randomUUID();
    this.db.run(
      `INSERT INTO players (id, team_id, player_name, role, is_captain, extra_info)
       VALUES (:id, :team_id, :player_name, 'captain', 1, '')`,
      {
        ':id': playerId,
        ':team_id': id,
        ':player_name': captainName.trim()
      }
    );

    this.addAuditLog('ADD_TEAM', `Added team "${teamName}" with captain "${captainName}"`);
    this.persistToDisk();

    return {
      id,
      team_name: teamName.trim(),
      captain_name: captainName.trim(),
      captain_discord_id: captainDiscordId.trim() || null,
      captain_phone: null,
      status: 'eligible' as any,
      current_stage: 'qualifying',
      qualification_status: 'pending',
      matches_played_count: 0,
      original_data_json: null,
      created_at: now,
      updated_at: now,
      players: [
        {
          id: playerId,
          team_id: id,
          player_name: captainName.trim(),
          role: 'captain' as any,
          is_captain: true,
          extra_info: ''
        }
      ]
    };
  }

  public deleteTeam(teamId: string): void {
    if (!this.db) return;
    this.db.run('DELETE FROM players WHERE team_id = :id', { ':id': teamId });
    this.db.run('DELETE FROM draw_selections WHERE team_id = :id', { ':id': teamId });
    this.db.run('DELETE FROM teams WHERE id = :id', { ':id': teamId });
    this.addAuditLog('DELETE_TEAM', `Deleted team ${teamId}`);
    this.persistToDisk();
  }

  public resetRotation(policy: 'one_time' | 'recurring_cycle'): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    // Reset played, selected, and playing teams back to eligible
    this.db.run(
      "UPDATE teams SET status = 'eligible', updated_at = :now WHERE status IN ('played', 'selected', 'playing')",
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
    const usedNames = new Set<string>();

    // Load existing team names
    const existingStmt = this.db.prepare('SELECT LOWER(team_name) as name FROM teams');
    while (existingStmt.step()) {
      usedNames.add(existingStmt.getAsObject().name as string);
    }
    existingStmt.free();

    this.db.run('BEGIN TRANSACTION;');
    try {
      for (let i = 0; i < teamsToImport.length; i++) {
        const t = teamsToImport[i];
        let cleanName = (t.team_name || '').trim();
        let cleanCapt = (t.captain_name || '').trim();
        const cleanDiscord = (t.captain_discord_id || '').trim();

        if (!cleanCapt && cleanName) cleanCapt = `${cleanName} Leader`;
        if (!cleanName && cleanCapt) cleanName = `${cleanCapt}'s Squad`;
        if (!cleanName && !cleanCapt) cleanName = `Squad #${i + 1}`;
        if (!cleanCapt) cleanCapt = `Captain #${i + 1}`;

        // Ensure unique team_name so SQLite UNIQUE constraint never fails
        let finalName = cleanName;
        let disambiguateCounter = 2;
        while (usedNames.has(finalName.toLowerCase())) {
          finalName = `${cleanName} (${disambiguateCounter})`;
          disambiguateCounter++;
        }
        usedNames.add(finalName.toLowerCase());

        // Check if an existing team with the same name has match participations to preserve stage/qualification
        let existingId: string | null = null;
        let existingStage = 'qualifying';
        let existingQual = 'pending';
        try {
          const prevTeamStmt = this.db.prepare('SELECT id, current_stage, qualification_status FROM teams WHERE LOWER(team_name) = :name');
          prevTeamStmt.bind({ ':name': finalName.toLowerCase() });
          if (prevTeamStmt.step()) {
            const row = prevTeamStmt.getAsObject() as any;
            existingId = row.id;
            existingStage = row.current_stage || 'qualifying';
            existingQual = row.qualification_status || 'pending';
          }
          prevTeamStmt.free();
        } catch {}

        const teamId = existingId || crypto.randomUUID();
        this.db.run(
          `INSERT OR REPLACE INTO teams (id, team_name, captain_name, captain_phone, captain_discord_id, status, current_stage, qualification_status, original_data_json, created_at, updated_at)
           VALUES (:id, :name, :capt, :phone, :discord, 'eligible', :stage, :qual, :json, :created, :updated)`,
          {
            ':id': teamId,
            ':name': finalName,
            ':capt': cleanCapt,
            ':phone': t.captain_phone?.trim() || null,
            ':discord': cleanDiscord || null,
            ':stage': existingStage,
            ':qual': existingQual,
            ':json': t.extra_columns ? JSON.stringify(t.extra_columns) : null,
            ':created': now,
            ':updated': now
          }
        );
        inserted++;

        // Insert Captain player
        const captPlayerId = crypto.randomUUID();
        this.db.run(
          `INSERT INTO players (id, team_id, player_name, role, is_captain)
           VALUES (:id, :team_id, :name, 'captain', 1)`,
          {
            ':id': captPlayerId,
            ':team_id': teamId,
            ':name': cleanCapt
          }
        );

        // Insert other players if provided
        if (t.players && Array.isArray(t.players)) {
          for (const p of t.players) {
            if (!p || !p.name || p.is_captain) continue;
            const pid = crypto.randomUUID();
            this.db.run(
              `INSERT INTO players (id, team_id, player_name, role, is_captain)
               VALUES (:id, :team_id, :name, :role, 0)`,
              {
                ':id': pid,
                ':team_id': teamId,
                ':name': String(p.name).trim(),
                ':role': p.role || 'player'
              }
            );
          }
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

  public createDraw(targetCount: number = 12, stage: TournamentStage = 'qualifying'): Draw {
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
      `INSERT INTO draws (id, tournament_id, draw_number, target_count, stage, status, created_at)
       VALUES (:id, 'tournament-main', :draw_num, :target, :stage, 'in_progress', :created)`,
      {
        ':id': id,
        ':draw_num': drawNumber,
        ':target': targetCount,
        ':stage': stage,
        ':created': now
      }
    );

    this.addAuditLog('CREATE_DRAW', `Started Draw #${drawNumber} (${stage}) with target of ${targetCount} teams`);
    this.persistToDisk();

    return {
      id,
      tournament_id: 'tournament-main',
      draw_number: drawNumber,
      target_count: targetCount,
      stage,
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

  public recordSelectionBatch(drawId: string, teamIds: string[], startingOrder: number = 1): DrawSelection[] {
    if (!this.db || !teamIds || teamIds.length === 0) return [];
    const now = new Date().toISOString();
    const selections: DrawSelection[] = [];

    this.db.run('BEGIN TRANSACTION;');
    try {
      teamIds.forEach((teamId, idx) => {
        const order = startingOrder + idx;
        const id = `sel_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        this.db?.run(`
          INSERT INTO draw_selections (
            id, draw_id, team_id, selection_order, selected_at, notification_status
          ) VALUES (
            :id, :draw_id, :team_id, :order, :selected_at, 'pending'
          );
        `, {
          ':id': id,
          ':draw_id': drawId,
          ':team_id': teamId,
          ':order': order,
          ':selected_at': now
        });

        this.db?.run(
          "UPDATE teams SET status = 'selected', updated_at = :now WHERE id = :team_id",
          { ':now': now, ':team_id': teamId }
        );

        const team = this.getTeamById(teamId);
        selections.push({
          id,
          draw_id: drawId,
          team_id: teamId,
          team_name: team?.team_name || '',
          captain_name: team?.captain_name || '',
          captain_discord_id: team?.captain_discord_id || undefined,
          selection_order: order,
          selected_at: now,
          notification_status: 'pending'
        });
      });

      this.db.run('COMMIT;');
      this.persistToDisk();
      this.addAuditLog('RECORD_SELECTION_BATCH', `Draw ${drawId}: ${selections.length} teams selected in batch`);
      return selections;
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
    stage?: TournamentStage;
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
    const localNow = new Date();
    const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
    const defaultLocalTime = localNow.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    const finalDate = data.match_date || defaultLocalDate;
    const finalTime = data.match_time || defaultLocalTime;
    const finalStage = data.stage || 'qualifying';

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
          stage = COALESCE(:stage, stage, 'qualifying'),
          admin_notes = :notes
         WHERE id = :id`,
        {
          ':room_id': data.room_id,
          ':room_password': data.room_password,
          ':match_date': finalDate,
          ':match_time': finalTime,
          ':voice_info': data.voice_channel_info,
          ':instr': data.additional_instructions,
          ':stage': finalStage,
          ':notes': data.admin_notes || '',
          ':id': id
        }
      );
      this.addAuditLog('UPDATE_MATCH_DETAILS', `Updated details for Match #${data.match_number} (${finalStage})`);
    } else {
      this.db.run(
        `INSERT INTO matches (id, draw_id, match_number, stage, room_id, room_password, match_date, match_time, voice_channel_info, additional_instructions, room_notification_status, status, admin_notes, created_at)
         VALUES (:id, :draw_id, :match_num, :stage, :room_id, :room_password, :match_date, :match_time, :voice_info, :instr, 'draft', 'scheduled', :notes, :created)`,
        {
          ':id': id,
          ':draw_id': data.draw_id || null,
          ':match_num': data.match_number,
          ':stage': finalStage,
          ':room_id': data.room_id,
          ':room_password': data.room_password,
          ':match_date': finalDate,
          ':match_time': finalTime,
          ':voice_info': data.voice_channel_info,
          ':instr': data.additional_instructions,
          ':notes': data.admin_notes || '',
          ':created': now
        }
      );
      this.addAuditLog('CREATE_MATCH', `Created Match #${data.match_number} (${finalStage})`);
    }

    this.persistToDisk();
    return this.getMatchById(id)!;
  }

  public completeMatch(
    matchId: string, 
    participatingTeams: Array<{ team_id: string; actually_played: boolean; notes?: string; result?: string }>,
    participatingPlayers: Array<{ team_id: string; player_id: string; player_name: string; role: string; participated: boolean }>,
    adminNotes: string = ''
  ): { playedCount: number; unplayedCount: number } {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const localNow = new Date();
    const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
    const defaultLocalTime = localNow.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

    let playedCount = 0;
    let unplayedCount = 0;

    this.db.run('BEGIN TRANSACTION;');
    try {
      // 1. Mark match completed with local date/time
      this.db.run(
        `UPDATE matches SET status = 'completed', completed_at = :now, match_date = COALESCE(NULLIF(match_date, ''), :localDate), match_time = COALESCE(NULLIF(match_time, ''), :localTime), admin_notes = :notes WHERE id = :id`,
        { ':now': now, ':localDate': defaultLocalDate, ':localTime': defaultLocalTime, ':notes': adminNotes, ':id': matchId }
      );

      // 2. Clear any old participation entries for this match to ensure idempotency
      this.db.run('DELETE FROM match_team_participation WHERE match_id = :id', { ':id': matchId });
      this.db.run('DELETE FROM match_player_participation WHERE match_id = :id', { ':id': matchId });

      // 3. Insert team participation & update team status without deleting teams
      const match = this.getMatchById(matchId);
      const matchStage = match?.stage || 'qualifying';
      const matchNumber = match?.match_number || 1;
      const matchDateStr = match?.match_date || defaultLocalDate;

      for (let i = 0; i < participatingTeams.length; i++) {
        const item = participatingTeams[i];
        const partId = crypto.randomUUID();
        const teamObj = this.getTeamById(item.team_id);
        const tName = teamObj?.team_name || '';
        const cName = teamObj?.captain_name || '';
        const resStr = item.result || (item.actually_played ? 'completed' : 'forfeit');

        this.db.run(
          `INSERT INTO match_team_participation (id, match_id, team_id, team_name, captain_name, selection_order, actually_played, notes, match_number, stage, result, match_date)
           VALUES (:id, :match_id, :team_id, :team_name, :captain_name, :order, :actually_played, :notes, :match_number, :stage, :result, :match_date)`,
          {
            ':id': partId,
            ':match_id': matchId,
            ':team_id': item.team_id,
            ':team_name': tName,
            ':captain_name': cName,
            ':order': i + 1,
            ':actually_played': item.actually_played ? 1 : 0,
            ':notes': item.notes || '',
            ':match_number': matchNumber,
            ':stage': matchStage,
            ':result': resStr,
            ':match_date': matchDateStr
          }
        );

        if (item.actually_played) {
          playedCount++;
          // Never permanently delete teams! Update status to 'played'
          // If result specifies qualified or eliminated, update qualification_status as well
          let qualClause = '';
          const updateParams: any = { ':now': now, ':team_id': item.team_id };
          if (resStr === 'qualified') {
            qualClause = ", qualification_status = 'qualified'";
          } else if (resStr === 'eliminated') {
            qualClause = ", qualification_status = 'eliminated'";
          }
          this.db.run(
            `UPDATE teams SET status = 'played', updated_at = :now ${qualClause} WHERE id = :team_id`,
            updateParams
          );
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
      if (match?.draw_id) {
        this.db.run(
          "UPDATE draws SET status = 'finalized', finalized_at = :now WHERE id = :draw_id",
          { ':now': now, ':draw_id': match.draw_id }
        );
      }

      this.db.run('COMMIT;');
      this.addAuditLog('COMPLETE_MATCH', `Match #${match?.match_number} (${matchStage}) completed: ${playedCount} teams played, ${unplayedCount} unplayed. All team records preserved.`);
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
      SELECT mtp.*, 
             COALESCE(NULLIF(mtp.team_name, ''), t.team_name, 'Registered Team') as resolved_team_name,
             COALESCE(NULLIF(mtp.captain_name, ''), t.captain_name, '') as resolved_captain_name
      FROM match_team_participation mtp
      LEFT JOIN teams t ON mtp.team_id = t.id
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
        team_name: row.resolved_team_name,
        captain_name: row.resolved_captain_name,
        selection_order: row.selection_order,
        actually_played: Boolean(row.actually_played),
        match_number: row.match_number,
        stage: row.stage || 'qualifying',
        result: row.result || (row.actually_played ? 'completed' : 'forfeit'),
        match_date: row.match_date,
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

  public deleteMatch(matchId: string): void {
    if (!this.db) return;
    this.db.run('DELETE FROM match_player_participation WHERE match_id = :id', { ':id': matchId });
    this.db.run('DELETE FROM match_team_participation WHERE match_id = :id', { ':id': matchId });
    this.db.run('DELETE FROM matches WHERE id = :id', { ':id': matchId });
    this.addAuditLog('DELETE_MATCH', `Deleted match ${matchId} from history`);
    this.persistToDisk();
  }

  public clearAllMatches(): void {
    if (!this.db) return;
    this.db.run('DELETE FROM match_player_participation');
    this.db.run('DELETE FROM match_team_participation');
    this.db.run('DELETE FROM matches');
    this.addAuditLog('CLEAR_MATCHES', 'Cleared all match history');
    this.persistToDisk();
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
    type: 'selection_dm' | 'room_dm' | 'custom_dm' | string;
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
    const selected = (this.db.exec("SELECT COUNT(*) FROM teams WHERE status IN ('selected', 'playing')")[0]?.values[0][0] as number) || 0;

    const notifLogsSent = (this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'sent'")[0]?.values[0][0] as number) || 0;
    const notifDrawsSent = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'sent'")[0]?.values[0][0] as number) || 0;
    const notifSent = Math.max(notifLogsSent, notifDrawsSent);

    const notifLogsPending = (this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'pending'")[0]?.values[0][0] as number) || 0;
    const notifDrawsPending = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'pending'")[0]?.values[0][0] as number) || 0;
    const notifPending = Math.max(notifLogsPending, notifDrawsPending);

    const notifLogsFailed = (this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'failed'")[0]?.values[0][0] as number) || 0;
    const notifDrawsFailed = (this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'failed'")[0]?.values[0][0] as number) || 0;
    const notifFailed = Math.max(notifLogsFailed, notifDrawsFailed);

    // Stage and qualification statistics
    const stageCounts: Record<TournamentStage, number> = {
      qualifying: (this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'qualifying'")[0]?.values[0][0] as number) || 0,
      quarter_final: (this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'quarter_final'")[0]?.values[0][0] as number) || 0,
      semi_final: (this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'semi_final'")[0]?.values[0][0] as number) || 0,
      final: (this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'final'")[0]?.values[0][0] as number) || 0
    };
    const qualCount = (this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'qualified'")[0]?.values[0][0] as number) || 0;
    const elimCount = (this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'eliminated'")[0]?.values[0][0] as number) || 0;
    const pendCount = (this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'pending'")[0]?.values[0][0] as number) || 0;

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
      latest_match: this.getLatestMatch(),
      stage_counts: stageCounts,
      qualified_count: qualCount,
      eliminated_count: elimCount,
      pending_count: pendCount
    };
  }

  public clearUnplayedTeams(): void {
    if (!this.db) return;
    this.db.run(`
      DELETE FROM players 
      WHERE team_id NOT IN (SELECT DISTINCT team_id FROM match_team_participation);
    `);
    this.db.run(`
      DELETE FROM teams 
      WHERE id NOT IN (SELECT DISTINCT team_id FROM match_team_participation);
    `);
    this.addAuditLog('CLEAR_UNPLAYED_TEAMS', 'Cleared unplayed teams while preserving all match participants and history');
    this.persistToDisk();
  }

  public clearAllTeams(preservePlayed: boolean = true): void {
    if (!this.db) return;
    if (preservePlayed) {
      this.clearUnplayedTeams();
    } else {
      this.db.run('DELETE FROM players;');
      this.db.run('DELETE FROM teams;');
      this.db.run('DELETE FROM notification_logs;');
      this.addAuditLog('CLEAR_TEAMS', 'Cleared all teams and players');
      this.persistToDisk();
    }
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
