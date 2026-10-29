import { contextBridge, ipcRenderer } from 'electron';

export interface IElectronAPI {
  // App window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // Dashboard & Settings
  getDashboardStats: () => Promise<any>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<any>;

  // Teams & Rosters
  getAllTeams: () => Promise<any>;
  getEligibleTeams: () => Promise<any>;
  getPlayedTeams: () => Promise<any>;
  getTeamById: (id: string) => Promise<any>;
  updateTeamStatus: (teamId: string, status: string, reason?: string) => Promise<any>;
  resetRotation: (policy: 'one_time' | 'recurring_cycle') => Promise<any>;

  // Draws & Random Spin
  getActiveDraw: () => Promise<any>;
  createDraw: (targetCount?: number) => Promise<any>;
  recordSelection: (drawId: string, teamId: string, order: number) => Promise<any>;
  finalizeDraw: (drawId: string) => Promise<any>;
  cancelDraw: (drawId: string) => Promise<any>;
  getDrawHistory: () => Promise<any>;
  selectCryptoWinner: (eligiblePoolIds: string[]) => Promise<any>;

  // Matches & Participation
  getMatches: () => Promise<any>;
  getLatestMatch: () => Promise<any>;
  getMatchById: (id: string) => Promise<any>;
  saveMatchDetails: (matchData: any) => Promise<any>;
  completeMatch: (matchId: string, participatingTeams: any[], participatingPlayers: any[], adminNotes?: string) => Promise<any>;
  getMatchTeamParticipation: (matchId: string) => Promise<any>;

  // Excel & File Operations
  openAndPreviewExcel: () => Promise<any>;
  commitExcelImport: (teams: any[]) => Promise<any>;
  exportTournamentWorkbook: () => Promise<any>;
  downloadSampleTemplate: () => Promise<any>;

  // Discord Bot
  getDiscordStatus: () => Promise<any>;
  testDiscordConnection: (token: string) => Promise<any>;
  sendSelectionDM: (selectionId: string, captainDiscordId: string, captainName: string, teamName: string, teamId: string, force?: boolean) => Promise<any>;
  sendRoomDM: (captainDiscordId: string, captainName: string, teamName: string, teamId: string, roomId: string, roomPassword: string, matchTime: string, instructions?: string) => Promise<any>;

  // Logs & Backup
  getAuditLogs: () => Promise<any>;
  getNotificationLogs: () => Promise<any>;
  backupDatabase: () => Promise<any>;
  restoreDatabase: () => Promise<any>;
}

const electronAPI: IElectronAPI = {
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),

  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('db:saveSettings', settings),

  getAllTeams: () => ipcRenderer.invoke('db:getAllTeams'),
  getEligibleTeams: () => ipcRenderer.invoke('db:getEligibleTeams'),
  getPlayedTeams: () => ipcRenderer.invoke('db:getPlayedTeams'),
  getTeamById: (id) => ipcRenderer.invoke('db:getTeamById', id),
  updateTeamStatus: (teamId, status, reason) => ipcRenderer.invoke('db:updateTeamStatus', { teamId, status, reason }),
  resetRotation: (policy) => ipcRenderer.invoke('db:resetRotation', policy),

  getActiveDraw: () => ipcRenderer.invoke('db:getActiveDraw'),
  createDraw: (targetCount) => ipcRenderer.invoke('db:createDraw', targetCount),
  recordSelection: (drawId, teamId, order) => ipcRenderer.invoke('db:recordSelection', { drawId, teamId, order }),
  finalizeDraw: (drawId) => ipcRenderer.invoke('db:finalizeDraw', drawId),
  cancelDraw: (drawId) => ipcRenderer.invoke('db:cancelDraw', drawId),
  getDrawHistory: () => ipcRenderer.invoke('db:getDrawHistory'),
  selectCryptoWinner: (eligiblePoolIds) => ipcRenderer.invoke('crypto:selectWinner', eligiblePoolIds),

  getMatches: () => ipcRenderer.invoke('db:getMatches'),
  getLatestMatch: () => ipcRenderer.invoke('db:getLatestMatch'),
  getMatchById: (id) => ipcRenderer.invoke('db:getMatchById', id),
  saveMatchDetails: (matchData) => ipcRenderer.invoke('db:saveMatchDetails', matchData),
  completeMatch: (matchId, teams, players, notes) => ipcRenderer.invoke('db:completeMatch', { matchId, teams, players, notes }),
  getMatchTeamParticipation: (matchId) => ipcRenderer.invoke('db:getMatchTeamParticipation', matchId),

  openAndPreviewExcel: () => ipcRenderer.invoke('excel:openAndPreview'),
  commitExcelImport: (teams) => ipcRenderer.invoke('excel:commitImport', teams),
  exportTournamentWorkbook: () => ipcRenderer.invoke('excel:exportWorkbook'),
  downloadSampleTemplate: () => ipcRenderer.invoke('excel:downloadSampleTemplate'),

  getDiscordStatus: () => ipcRenderer.invoke('discord:checkStatus'),
  testDiscordConnection: (token) => ipcRenderer.invoke('discord:testConnection', token),
  sendSelectionDM: (selectionId, captainDiscordId, captainName, teamName, teamId, force) => 
    ipcRenderer.invoke('discord:sendSelectionDM', { selectionId, captainDiscordId, captainName, teamName, teamId, force }),
  sendRoomDM: (captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions) =>
    ipcRenderer.invoke('discord:sendRoomDM', { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions }),

  getAuditLogs: () => ipcRenderer.invoke('db:getAuditLogs'),
  getNotificationLogs: () => ipcRenderer.invoke('db:getNotificationLogs'),
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  restoreDatabase: () => ipcRenderer.invoke('db:restoreDatabase')
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
