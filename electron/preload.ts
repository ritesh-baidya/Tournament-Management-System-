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
  getEligibleTeams: (stageOrOptions?: any, allowRepeat?: boolean) => Promise<any>;
  getPlayedTeams: () => Promise<any>;
  getTeamById: (id: string) => Promise<any>;
  updateTeamStatus: (teamId: string, status: string, reason?: string) => Promise<any>;
  updateTeamQualification: (teamId: string, status: string, currentStage?: string) => Promise<any>;
  advanceTeamStage: (teamId: string, nextStage: string) => Promise<any>;
  batchUpdateTeamQualification: (teamIds: string[], status: string, currentStage?: string) => Promise<any>;
  batchAdvanceTeamStage: (teamIds: string[], nextStage: string) => Promise<any>;
  getTeamMatchHistory: (teamId: string) => Promise<any>;
  deleteTeam: (teamId: string) => Promise<any>;
  addTeam: (teamName: string, captainName: string, captainDiscordId?: string) => Promise<any>;
  addPlayer: (teamId: string, playerName: string, role?: string, isCaptain?: boolean, extraInfo?: string) => Promise<any>;
  deletePlayer: (playerId: string) => Promise<any>;
  resetRotation: (policy: 'one_time' | 'recurring_cycle') => Promise<any>;

  // Draws & Random Spin
  getActiveDraw: () => Promise<any>;
  createDraw: (targetCount?: number, stage?: string) => Promise<any>;
  recordSelection: (drawId: string, teamId: string, order: number) => Promise<any>;
  recordSelectionBatch: (drawId: string, teamIds: string[], startingOrder?: number) => Promise<any>;
  finalizeDraw: (drawId: string) => Promise<any>;
  cancelDraw: (drawId: string) => Promise<any>;
  getDrawHistory: () => Promise<any>;
  selectCryptoWinner: (eligiblePoolIds: string[]) => Promise<any>;
  selectCryptoMultipleWinners: (eligiblePoolIds: string[], count: number) => Promise<any>;

  // Matches & Participation
  getMatches: () => Promise<any>;
  getLatestMatch: () => Promise<any>;
  getMatchById: (id: string) => Promise<any>;
  saveMatchDetails: (matchData: any) => Promise<any>;
  completeMatch: (matchId: string, participatingTeams: any[], participatingPlayers: any[], adminNotes?: string) => Promise<any>;
  getMatchTeamParticipation: (matchId: string) => Promise<any>;
  deleteMatch: (matchId: string) => Promise<any>;
  clearAllMatches: () => Promise<any>;

  // Excel & File Operations
  openAndPreviewExcel: () => Promise<any>;
  commitExcelImport: (teams: any[], mode?: 'replace' | 'append') => Promise<any>;
  exportTournamentWorkbook: () => Promise<any>;
  downloadSampleTemplate: () => Promise<any>;

  // Discord Bot
  getDiscordStatus: () => Promise<any>;
  testDiscordConnection: (token: string) => Promise<any>;
  sendSelectionDM: (selectionId: string, captainDiscordId: string, captainName: string, teamName: string, teamId: string, force?: boolean, customTemplate?: string) => Promise<any>;
  sendRoomDM: (captainDiscordId: string, captainName: string, teamName: string, teamId: string, roomId: string, roomPassword: string, matchTime: string, instructions?: string, customTemplate?: string) => Promise<any>;
  sendDirectMessage: (captainDiscordId: string, messageContent: string, teamId?: string, captainName?: string, teamName?: string) => Promise<any>;

  // Logs & Backup
  getAuditLogs: () => Promise<any>;
  getNotificationLogs: () => Promise<any>;
  backupDatabase: () => Promise<any>;
  restoreDatabase: () => Promise<any>;
  clearAllTeams: () => Promise<any>;
}

const electronAPI: IElectronAPI = {
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),

  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('db:saveSettings', settings),

  getAllTeams: () => ipcRenderer.invoke('db:getAllTeams'),
  getEligibleTeams: (stageOrOptions, allowRepeat) => {
    if (typeof stageOrOptions === 'object') {
      return ipcRenderer.invoke('db:getEligibleTeams', stageOrOptions);
    }
    return ipcRenderer.invoke('db:getEligibleTeams', { stage: stageOrOptions, allowRepeat });
  },
  getPlayedTeams: () => ipcRenderer.invoke('db:getPlayedTeams'),
  getTeamById: (id) => ipcRenderer.invoke('db:getTeamById', id),
  updateTeamStatus: (teamId, status, reason) => ipcRenderer.invoke('db:updateTeamStatus', { teamId, status, reason }),
  updateTeamQualification: (teamId, status, currentStage) => ipcRenderer.invoke('db:updateTeamQualification', { teamId, status, currentStage }),
  advanceTeamStage: (teamId, nextStage) => ipcRenderer.invoke('db:advanceTeamStage', { teamId, nextStage }),
  batchUpdateTeamQualification: (teamIds, status, currentStage) => ipcRenderer.invoke('db:batchUpdateTeamQualification', { teamIds, status, currentStage }),
  batchAdvanceTeamStage: (teamIds, nextStage) => ipcRenderer.invoke('db:batchAdvanceTeamStage', { teamIds, nextStage }),
  getTeamMatchHistory: (teamId) => ipcRenderer.invoke('db:getTeamMatchHistory', teamId),
  deleteTeam: (teamId) => ipcRenderer.invoke('db:deleteTeam', teamId),
  addTeam: (teamName, captainName, captainDiscordId) =>
    ipcRenderer.invoke('db:addTeam', { teamName, captainName, captainDiscordId }),
  addPlayer: (teamId, playerName, role, isCaptain, extraInfo) =>
    ipcRenderer.invoke('db:addPlayer', { teamId, playerName, role, isCaptain, extraInfo }),
  deletePlayer: (playerId) => ipcRenderer.invoke('db:deletePlayer', playerId),
  resetRotation: (policy) => ipcRenderer.invoke('db:resetRotation', policy),

  getActiveDraw: () => ipcRenderer.invoke('db:getActiveDraw'),
  createDraw: (targetCount, stage) => ipcRenderer.invoke('db:createDraw', { targetCount, stage }),
  recordSelection: (drawId, teamId, order) => ipcRenderer.invoke('db:recordSelection', { drawId, teamId, order }),
  recordSelectionBatch: (drawId, teamIds, startingOrder) => ipcRenderer.invoke('db:recordSelectionBatch', { drawId, teamIds, startingOrder }),
  finalizeDraw: (drawId) => ipcRenderer.invoke('db:finalizeDraw', drawId),
  cancelDraw: (drawId) => ipcRenderer.invoke('db:cancelDraw', drawId),
  getDrawHistory: () => ipcRenderer.invoke('db:getDrawHistory'),
  selectCryptoWinner: (eligiblePoolIds) => ipcRenderer.invoke('crypto:selectWinner', eligiblePoolIds),
  selectCryptoMultipleWinners: (eligiblePoolIds, count) => ipcRenderer.invoke('crypto:selectMultipleWinners', { eligiblePoolIds, count }),

  getMatches: () => ipcRenderer.invoke('db:getMatches'),
  getLatestMatch: () => ipcRenderer.invoke('db:getLatestMatch'),
  getMatchById: (id) => ipcRenderer.invoke('db:getMatchById', id),
  saveMatchDetails: (matchData) => ipcRenderer.invoke('db:saveMatchDetails', matchData),
  completeMatch: (matchId, teams, players, notes) => ipcRenderer.invoke('db:completeMatch', { matchId, teams, players, notes }),
  getMatchTeamParticipation: (matchId) => ipcRenderer.invoke('db:getMatchTeamParticipation', matchId),
  deleteMatch: (matchId) => ipcRenderer.invoke('db:deleteMatch', matchId),
  clearAllMatches: () => ipcRenderer.invoke('db:clearAllMatches'),

  openAndPreviewExcel: () => ipcRenderer.invoke('excel:openAndPreview'),
  commitExcelImport: (teams, mode) => ipcRenderer.invoke('excel:commitImport', teams, mode),
  exportTournamentWorkbook: () => ipcRenderer.invoke('excel:exportWorkbook'),
  downloadSampleTemplate: () => ipcRenderer.invoke('excel:downloadSampleTemplate'),

  getDiscordStatus: () => ipcRenderer.invoke('discord:checkStatus'),
  testDiscordConnection: (token) => ipcRenderer.invoke('discord:testConnection', token),
  sendSelectionDM: (selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate) => 
    ipcRenderer.invoke('discord:sendSelectionDM', { selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate }),
  sendRoomDM: (captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate) =>
    ipcRenderer.invoke('discord:sendRoomDM', { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate }),
  sendDirectMessage: (captainDiscordId, messageContent, teamId, captainName, teamName) =>
    ipcRenderer.invoke('discord:sendDirectMessage', { captainDiscordId, messageContent, teamId, captainName, teamName }),

  getAuditLogs: () => ipcRenderer.invoke('db:getAuditLogs'),
  getNotificationLogs: () => ipcRenderer.invoke('db:getNotificationLogs'),
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  restoreDatabase: () => ipcRenderer.invoke('db:restoreDatabase'),
  clearAllTeams: () => ipcRenderer.invoke('db:clearAllTeams')
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
