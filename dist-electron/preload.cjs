"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var electronAPI = {
  minimize: () => import_electron.ipcRenderer.invoke("app:minimize"),
  maximize: () => import_electron.ipcRenderer.invoke("app:maximize"),
  close: () => import_electron.ipcRenderer.invoke("app:close"),
  getDashboardStats: () => import_electron.ipcRenderer.invoke("db:getDashboardStats"),
  getSettings: () => import_electron.ipcRenderer.invoke("db:getSettings"),
  saveSettings: (settings) => import_electron.ipcRenderer.invoke("db:saveSettings", settings),
  getAllTeams: () => import_electron.ipcRenderer.invoke("db:getAllTeams"),
  getEligibleTeams: (stageOrOptions, allowRepeat) => {
    if (typeof stageOrOptions === "object") {
      return import_electron.ipcRenderer.invoke("db:getEligibleTeams", stageOrOptions);
    }
    return import_electron.ipcRenderer.invoke("db:getEligibleTeams", { stage: stageOrOptions, allowRepeat });
  },
  getPlayedTeams: () => import_electron.ipcRenderer.invoke("db:getPlayedTeams"),
  getTeamById: (id) => import_electron.ipcRenderer.invoke("db:getTeamById", id),
  updateTeamStatus: (teamId, status, reason) => import_electron.ipcRenderer.invoke("db:updateTeamStatus", { teamId, status, reason }),
  updateTeamQualification: (teamId, status, currentStage) => import_electron.ipcRenderer.invoke("db:updateTeamQualification", { teamId, status, currentStage }),
  advanceTeamStage: (teamId, nextStage) => import_electron.ipcRenderer.invoke("db:advanceTeamStage", { teamId, nextStage }),
  batchUpdateTeamQualification: (teamIds, status, currentStage) => import_electron.ipcRenderer.invoke("db:batchUpdateTeamQualification", { teamIds, status, currentStage }),
  batchAdvanceTeamStage: (teamIds, nextStage) => import_electron.ipcRenderer.invoke("db:batchAdvanceTeamStage", { teamIds, nextStage }),
  getTeamMatchHistory: (teamId) => import_electron.ipcRenderer.invoke("db:getTeamMatchHistory", teamId),
  deleteTeam: (teamId) => import_electron.ipcRenderer.invoke("db:deleteTeam", teamId),
  addTeam: (teamName, captainName, captainDiscordId) => import_electron.ipcRenderer.invoke("db:addTeam", { teamName, captainName, captainDiscordId }),
  addPlayer: (teamId, playerName, role, isCaptain, extraInfo) => import_electron.ipcRenderer.invoke("db:addPlayer", { teamId, playerName, role, isCaptain, extraInfo }),
  deletePlayer: (playerId) => import_electron.ipcRenderer.invoke("db:deletePlayer", playerId),
  resetRotation: (policy) => import_electron.ipcRenderer.invoke("db:resetRotation", policy),
  getActiveDraw: () => import_electron.ipcRenderer.invoke("db:getActiveDraw"),
  createDraw: (targetCount, stage) => import_electron.ipcRenderer.invoke("db:createDraw", { targetCount, stage }),
  recordSelection: (drawId, teamId, order) => import_electron.ipcRenderer.invoke("db:recordSelection", { drawId, teamId, order }),
  recordSelectionBatch: (drawId, teamIds, startingOrder) => import_electron.ipcRenderer.invoke("db:recordSelectionBatch", { drawId, teamIds, startingOrder }),
  finalizeDraw: (drawId) => import_electron.ipcRenderer.invoke("db:finalizeDraw", drawId),
  cancelDraw: (drawId) => import_electron.ipcRenderer.invoke("db:cancelDraw", drawId),
  getDrawHistory: () => import_electron.ipcRenderer.invoke("db:getDrawHistory"),
  selectCryptoWinner: (eligiblePoolIds) => import_electron.ipcRenderer.invoke("crypto:selectWinner", eligiblePoolIds),
  selectCryptoMultipleWinners: (eligiblePoolIds, count) => import_electron.ipcRenderer.invoke("crypto:selectMultipleWinners", { eligiblePoolIds, count }),
  getMatches: () => import_electron.ipcRenderer.invoke("db:getMatches"),
  getLatestMatch: () => import_electron.ipcRenderer.invoke("db:getLatestMatch"),
  getMatchById: (id) => import_electron.ipcRenderer.invoke("db:getMatchById", id),
  saveMatchDetails: (matchData) => import_electron.ipcRenderer.invoke("db:saveMatchDetails", matchData),
  completeMatch: (matchId, teams, players, notes) => import_electron.ipcRenderer.invoke("db:completeMatch", { matchId, teams, players, notes }),
  getMatchTeamParticipation: (matchId) => import_electron.ipcRenderer.invoke("db:getMatchTeamParticipation", matchId),
  deleteMatch: (matchId) => import_electron.ipcRenderer.invoke("db:deleteMatch", matchId),
  clearAllMatches: () => import_electron.ipcRenderer.invoke("db:clearAllMatches"),
  openAndPreviewExcel: () => import_electron.ipcRenderer.invoke("excel:openAndPreview"),
  commitExcelImport: (teams, mode) => import_electron.ipcRenderer.invoke("excel:commitImport", teams, mode),
  exportTournamentWorkbook: () => import_electron.ipcRenderer.invoke("excel:exportWorkbook"),
  downloadSampleTemplate: () => import_electron.ipcRenderer.invoke("excel:downloadSampleTemplate"),
  getDiscordStatus: () => import_electron.ipcRenderer.invoke("discord:checkStatus"),
  testDiscordConnection: (token) => import_electron.ipcRenderer.invoke("discord:testConnection", token),
  sendSelectionDM: (selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate) => import_electron.ipcRenderer.invoke("discord:sendSelectionDM", { selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate }),
  sendRoomDM: (captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate) => import_electron.ipcRenderer.invoke("discord:sendRoomDM", { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate }),
  sendDirectMessage: (captainDiscordId, messageContent, teamId, captainName, teamName) => import_electron.ipcRenderer.invoke("discord:sendDirectMessage", { captainDiscordId, messageContent, teamId, captainName, teamName }),
  getAuditLogs: () => import_electron.ipcRenderer.invoke("db:getAuditLogs"),
  getNotificationLogs: () => import_electron.ipcRenderer.invoke("db:getNotificationLogs"),
  backupDatabase: () => import_electron.ipcRenderer.invoke("db:backupDatabase"),
  restoreDatabase: () => import_electron.ipcRenderer.invoke("db:restoreDatabase"),
  clearAllTeams: () => import_electron.ipcRenderer.invoke("db:clearAllTeams")
};
import_electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
//# sourceMappingURL=preload.cjs.map
