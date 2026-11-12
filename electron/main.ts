import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { TournamentDatabase } from './database';
import { ExcelService } from './excelService';
import { DiscordService } from './discordService';
import { getCryptoRandomInt } from './cryptoRandom';

let mainWindow: BrowserWindow | null = null;
let db: TournamentDatabase;
let discordService: DiscordService;

const isDev = process.env.NODE_ENV === 'development' || !app?.isPackaged;

async function createWindow() {
  // Initialize Database in user data directory or local root
  const dbDir = isDev ? process.cwd() : app.getPath('userData');
  const dbPath = path.join(dbDir, 'tournament.db');
  const wasmPath = path.join(__dirname, 'sql-wasm.wasm');

  db = new TournamentDatabase(dbPath, wasmPath);
  await db.initialize();

  discordService = new DiscordService(db);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'Free Fire Tournament Management System',
    backgroundColor: '#0B0E14',
    show: false,
    frame: false, // Sleek frameless esports window
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Automatic Excel Synchronization after any tournament change
let lastImportedExcelPath: string | null = null;

function autoSyncExcel() {
  try {
    if (!db) return;
    const buffer = ExcelService.generateTournamentWorkbook(db);
    const syncDir = isDev ? process.cwd() : app.getPath('userData');
    const syncPath = path.join(syncDir, 'tournament_master_sync.xlsx');
    ExcelService.safeSaveFile(syncPath, buffer);

    const savedPath = lastImportedExcelPath || db.getSetting('last_imported_excel_path');
    if (savedPath && fs.existsSync(savedPath)) {
      try {
        ExcelService.safeSaveFile(savedPath, buffer);
      } catch (err) {
        console.error('Auto Excel sync to imported file error:', err);
      }
    }
  } catch (err) {
    console.error('Auto Excel sync error:', err);
  }
}

// Register IPC handlers
function registerIpcHandlers() {
  // Window controls
  ipcMain.handle('app:minimize', () => mainWindow?.minimize());
  ipcMain.handle('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('app:close', () => mainWindow?.close());

  // Dashboard & Settings
  ipcMain.handle('db:getDashboardStats', async () => {
    try {
      const stats = db.getDashboardStats();
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getSettings', async () => {
    try {
      const settings = db.getSettings();
      // Mask token partially for security in renderer
      return { success: true, data: settings };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:saveSettings', async (_, newSettings) => {
    try {
      db.saveSettings(newSettings);
      return { success: true, data: db.getSettings() };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Teams & Rosters
  ipcMain.handle('db:getAllTeams', async () => {
    try {
      const teams = db.getAllTeams();
      return { success: true, data: teams };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getEligibleTeams', async (_, args?: { stage?: any; allowRepeat?: boolean } | string) => {
    try {
      let stage: any = undefined;
      let allowRepeat = false;
      if (typeof args === 'string') {
        stage = args;
      } else if (args && typeof args === 'object') {
        stage = args.stage;
        allowRepeat = Boolean(args.allowRepeat);
      }
      const teams = db.getEligibleTeams(stage, allowRepeat);
      return { success: true, data: teams };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getPlayedTeams', async () => {
    try {
      const teams = db.getPlayedTeams();
      return { success: true, data: teams };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getTeamById', async (_, id: string) => {
    try {
      const team = db.getTeamById(id);
      return { success: true, data: team };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:updateTeamStatus', async (_, { teamId, status, reason }) => {
    try {
      db.updateTeamStatus(teamId, status, reason);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:updateTeamQualification', async (_, { teamId, status, currentStage }) => {
    try {
      db.updateTeamQualification(teamId, status, currentStage);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:advanceTeamStage', async (_, { teamId, nextStage }) => {
    try {
      db.advanceTeamStage(teamId, nextStage);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:batchUpdateTeamQualification', async (_, { teamIds, status, currentStage }) => {
    try {
      db.batchUpdateTeamQualification(teamIds, status, currentStage);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:batchAdvanceTeamStage', async (_, { teamIds, nextStage }) => {
    try {
      db.batchAdvanceTeamStage(teamIds, nextStage);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getTeamMatchHistory', async (_, teamId: string) => {
    try {
      const history = db.getTeamMatchHistory(teamId);
      return { success: true, data: history };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:deleteTeam', async (_, teamId: string) => {
    try {
      db.deleteTeam(teamId);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:addTeam', async (_, { teamName, captainName, captainDiscordId }) => {
    try {
      const team = db.addTeam(teamName, captainName, captainDiscordId || '');
      autoSyncExcel();
      return { success: true, data: team };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:addPlayer', async (_, { teamId, playerName, role, isCaptain, extraInfo }) => {
    try {
      const player = db.addPlayer(teamId, playerName, role, isCaptain, extraInfo);
      autoSyncExcel();
      return { success: true, data: player };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:deletePlayer', async (_, playerId: string) => {
    try {
      db.deletePlayer(playerId);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:resetRotation', async (_, policy: 'one_time' | 'recurring_cycle') => {
    try {
      db.resetRotation(policy);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Draws & Random Spin
  ipcMain.handle('db:getActiveDraw', async () => {
    try {
      const draw = db.getActiveDraw();
      return { success: true, data: draw };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:createDraw', async (_, arg1?: any, arg2?: any) => {
    try {
      let targetCount = 12;
      let stage: any = 'qualifying';
      if (typeof arg1 === 'object' && arg1 !== null) {
        targetCount = arg1.targetCount || 12;
        stage = arg1.stage || 'qualifying';
      } else {
        if (typeof arg1 === 'number') targetCount = arg1;
        if (typeof arg2 === 'string') stage = arg2;
      }
      const draw = db.createDraw(targetCount, stage);
      return { success: true, data: draw };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:recordSelection', async (_, { drawId, teamId, order }) => {
    try {
      const selection = db.recordSelection(drawId, teamId, order);
      autoSyncExcel();
      return { success: true, data: selection };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:recordSelectionBatch', async (_, { drawId, teamIds, startingOrder }) => {
    try {
      const selections = db.recordSelectionBatch(drawId, teamIds, startingOrder || 1);
      autoSyncExcel();
      return { success: true, data: selections };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:finalizeDraw', async (_, drawId: string) => {
    try {
      db.finalizeDraw(drawId);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:cancelDraw', async (_, drawId: string) => {
    try {
      db.cancelDraw(drawId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getDrawHistory', async () => {
    try {
      const history = db.getDrawHistory();
      return { success: true, data: history };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Cryptographic random selection using Node.js crypto.randomInt
  ipcMain.handle('crypto:selectWinner', async (_, eligiblePoolIds: string[]) => {
    try {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0) {
        throw new Error('Eligible pool is empty');
      }
      const winnerIndex = getCryptoRandomInt(0, eligiblePoolIds.length);
      const winnerId = eligiblePoolIds[winnerIndex];
      return { success: true, data: { winnerId, winnerIndex } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('crypto:selectMultipleWinners', async (_, { eligiblePoolIds, count }: { eligiblePoolIds: string[]; count: number }) => {
    try {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0 || count <= 0) {
        throw new Error('Eligible pool is empty or count is invalid');
      }
      const pool = [...eligiblePoolIds];
      const selected: string[] = [];
      const selectCount = Math.min(count, pool.length);
      for (let i = 0; i < selectCount; i++) {
        const randIdx = getCryptoRandomInt(i, pool.length);
        const temp = pool[i];
        pool[i] = pool[randIdx];
        pool[randIdx] = temp;
        selected.push(pool[i]);
      }
      return { success: true, data: { winnerTeamIds: selected } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Matches & Participation
  ipcMain.handle('db:getMatches', async () => {
    try {
      const matches = db.getMatches();
      return { success: true, data: matches };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getLatestMatch', async () => {
    try {
      const match = db.getLatestMatch();
      return { success: true, data: match };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getMatchById', async (_, id: string) => {
    try {
      const match = db.getMatchById(id);
      return { success: true, data: match };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:saveMatchDetails', async (_, matchData) => {
    try {
      const saved = db.saveMatchDetails(matchData);
      return { success: true, data: saved };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:completeMatch', async (_, { matchId, teams, players, notes }) => {
    try {
      const res = db.completeMatch(matchId, teams, players, notes);
      autoSyncExcel();
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getMatchTeamParticipation', async (_, matchId: string) => {
    try {
      const list = db.getMatchTeamParticipation(matchId);
      return { success: true, data: list };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:deleteMatch', async (_, matchId: string) => {
    try {
      db.deleteMatch(matchId);
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:clearAllMatches', async () => {
    try {
      db.clearAllMatches();
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Excel Operations
  ipcMain.handle('excel:openAndPreview', async () => {
    try {
      const res = await dialog.showOpenDialog(mainWindow!, {
        title: 'Select Free Fire Registration Excel File',
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
        properties: ['openFile']
      });

      if (res.canceled || res.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = res.filePaths[0];
      lastImportedExcelPath = filePath;
      try {
        db.setSetting('last_imported_excel_path', filePath);
      } catch {}
      const buffer = fs.readFileSync(filePath);
      const existingTeams = db.getAllTeams();
      const preview = ExcelService.parseExcelBuffer(buffer, existingTeams);

      return { success: true, data: { preview, filePath } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('excel:commitImport', async (_, teams, mode: 'replace' | 'append' = 'replace') => {
    try {
      if (mode === 'replace') {
        db.clearUnplayedTeams();
      }
      const importPayload = teams.map((t: any) => ({
        team_name: t.team_name,
        captain_name: t.captain_name,
        captain_phone: t.captain_phone,
        captain_discord_id: t.captain_discord_id,
        players: [
          { name: t.captain_name, role: 'captain', is_captain: true },
          { name: t.player2_name, role: 'player2' },
          { name: t.player3_name, role: 'player3' },
          { name: t.player4_name, role: 'player4' },
          { name: t.substitute_name, role: 'substitute' }
        ],
        extra_columns: t.extra_columns
      }));

      const result = db.importTeamsBatch(importPayload);
      autoSyncExcel();
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('excel:exportWorkbook', async () => {
    try {
      const res = await dialog.showSaveDialog(mainWindow!, {
        title: 'Export Tournament Excel Workbook',
        defaultPath: `Free_Fire_Tournament_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      });

      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }

      const buffer = ExcelService.generateTournamentWorkbook(db);
      ExcelService.safeSaveFile(res.filePath, buffer);

      db.addAuditLog('EXPORT_EXCEL', `Exported 5-sheet workbook to ${res.filePath}`);
      return { success: true, data: { filePath: res.filePath } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('excel:downloadSampleTemplate', async () => {
    try {
      const res = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Sample Registration Template',
        defaultPath: 'free_fire_teams_sample_registration.xlsx',
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      });

      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }

      const buffer = ExcelService.generateSampleRegistrationTemplate();
      ExcelService.safeSaveFile(res.filePath, buffer);

      return { success: true, data: { filePath: res.filePath } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Discord Integration
  ipcMain.handle('discord:checkStatus', async () => {
    try {
      const status = discordService.getStatus();
      return { success: true, data: status };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('discord:testConnection', async (_, token: string) => {
    try {
      const res = await discordService.initializeClient(token);
      return res;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('discord:sendSelectionDM', async (_, { selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate }) => {
    try {
      const res = await discordService.sendSelectionDM(selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate);
      return res;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('discord:sendRoomDM', async (_, { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate }) => {
    try {
      const res = await discordService.sendRoomDM(captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate);
      if (res && res.success && teamId) {
        try {
          db.updateTeamStatus(teamId, 'playing', 'Room ID and password sent');
        } catch (e) {
          console.error('Failed to update team status to playing:', e);
        }
      }
      return res;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('discord:sendDirectMessage', async (_, { captainDiscordId, messageContent, teamId, captainName, teamName }) => {
    try {
      const res = await discordService.sendDirectMessage(captainDiscordId, messageContent, teamId, captainName, teamName);
      return res;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:clearAllTeams', async () => {
    try {
      db.clearAllTeams();
      autoSyncExcel();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Audit, Notifications & Database Backup/Restore
  ipcMain.handle('db:getAuditLogs', async () => {
    try {
      const logs = db.getAuditLogs();
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:getNotificationLogs', async () => {
    try {
      const logs = db.getNotificationLogs();
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:backupDatabase', async () => {
    try {
      const res = await dialog.showSaveDialog(mainWindow!, {
        title: 'Backup Tournament Database',
        defaultPath: `tournament_backup_${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      });

      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }

      db.backupDatabase(res.filePath);
      return { success: true, data: { filePath: res.filePath } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:restoreDatabase', async () => {
    try {
      const res = await dialog.showOpenDialog(mainWindow!, {
        title: 'Select Backup Database to Restore',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
        properties: ['openFile']
      });

      if (res.canceled || res.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      await db.restoreDatabase(res.filePaths[0]);
      return { success: true, data: { filePath: res.filePaths[0] } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
