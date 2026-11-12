import { Team, Draw, DashboardStats, TournamentSettings, NotificationLog } from '../types';
import * as XLSX from 'xlsx';

export function setupBrowserMock() {
  if (typeof window === 'undefined' || (window as any).electronAPI) {
    return;
  }

  console.log('[Browser Mode] Initializing browser fallback storage for Electron API');

  const TEAMS_KEY = 'ff_tournament_teams';
  const SETTINGS_KEY = 'ff_tournament_settings';
  const DRAW_KEY = 'ff_tournament_active_draw';
  const NOTIF_KEY = 'ff_tournament_notifications';

  const getStoredTeams = (): Team[] => {
    try {
      return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setStoredTeams = (teams: Team[]) => {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  };

  const getStoredSettings = (): TournamentSettings => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return {
      tournament_name: 'Free Fire Championship',
      rotation_policy: 'one_time',
      selection_target: 12,
      discord_bot_token: '',
      sound_enabled: true,
      rules: []
    };
  };

  const getStoredLogs = (): NotificationLog[] => {
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const getStoredDraws = (): Draw[] => {
    try {
      const active = localStorage.getItem(DRAW_KEY);
      return active ? [JSON.parse(active)] : [];
    } catch {
      return [];
    }
  };

  const addNotificationLog = (data: Partial<NotificationLog>) => {
    const logs = getStoredLogs();
    const newLog: NotificationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: (data.type as any) || 'custom_dm',
      team_id: data.team_id || '',
      team_name: data.team_name || 'Team',
      captain_name: data.captain_name || 'Captain',
      captain_discord_id: data.captain_discord_id || '',
      status: data.status || 'sent',
      message_content: data.message_content || '',
      error_message: data.error_message,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(NOTIF_KEY, JSON.stringify([newLog, ...logs].slice(0, 100)));
  };

  // Attempt background connection if bot token is already saved
  const savedSettings = getStoredSettings();
  if (savedSettings.discord_bot_token && savedSettings.discord_bot_token.trim()) {
    fetch('/api/discord/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: savedSettings.discord_bot_token.trim() })
    }).catch(() => {});
  }

  (window as any).electronAPI = {
    minimize: async () => {},
    maximize: async () => {},
    close: async () => {},

    getDashboardStats: async () => {
      const teams = getStoredTeams();
      const logs = getStoredLogs();
      const eligible = teams.filter(t => t.status === 'eligible').length;
      const played = teams.filter(t => t.status === 'played').length;
      const selected = teams.filter(t => t.status === 'selected' || t.status === 'playing').length;
      const sent = logs.filter(l => l.status === 'sent').length;

      let latestMatch = null;
      try {
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        if (m.length > 0) latestMatch = m[0];
      } catch {}

      return {
        success: true,
        data: {
          total_teams: teams.length,
          eligible_teams: eligible,
          played_teams: played,
          selected_teams: selected,
          remaining_eligible: eligible,
          notifications_sent: sent,
          notifications_pending: 0,
          notifications_failed: logs.filter(l => l.status === 'failed').length,
          latest_draw: null,
          latest_match: latestMatch,
          stage_counts: {
            qualifying: teams.filter(t => (t.current_stage || 'qualifying') === 'qualifying').length,
            quarter_final: teams.filter(t => t.current_stage === 'quarter_final').length,
            semi_final: teams.filter(t => t.current_stage === 'semi_final').length,
            final: teams.filter(t => t.current_stage === 'final').length
          },
          qualified_count: teams.filter(t => t.qualification_status === 'qualified').length,
          eliminated_count: teams.filter(t => t.qualification_status === 'eliminated').length,
          pending_count: teams.filter(t => (t.qualification_status || 'pending') === 'pending').length
        }
      };
    },

    getSettings: async () => {
      return { success: true, data: getStoredSettings() };
    },

    saveSettings: async (settings: TournamentSettings) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (settings.discord_bot_token && settings.discord_bot_token.trim()) {
        try {
          await fetch('/api/discord/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: settings.discord_bot_token.trim() })
          });
        } catch {}
      }
      return { success: true, data: settings };
    },

    getAllTeams: async () => {
      const teams = getStoredTeams();
      const parts = JSON.parse(localStorage.getItem('ff_tournament_match_participation') || '[]');
      const enriched = teams.map(t => {
        if (!t.current_stage) t.current_stage = 'qualifying';
        if (!t.qualification_status) t.qualification_status = 'pending';
        const teamParts = parts.filter((p: any) => p.team_id === t.id && p.actually_played);
        t.matches_played_count = teamParts.length;
        if (teamParts.length > 0) {
          t.last_match_result = teamParts[teamParts.length - 1].result || 'completed';
        }
        return t;
      });
      return { success: true, data: enriched };
    },

    getEligibleTeams: async (stageOrOptions?: any, allowRepeatOpt?: boolean) => {
      let stage: any = undefined;
      let allowRepeat = false;
      if (typeof stageOrOptions === 'object' && stageOrOptions !== null) {
        stage = stageOrOptions.stage;
        allowRepeat = Boolean(stageOrOptions.allowRepeat);
      } else {
        stage = stageOrOptions;
        allowRepeat = Boolean(allowRepeatOpt);
      }

      const teams = getStoredTeams();
      const parts = JSON.parse(localStorage.getItem('ff_tournament_match_participation') || '[]');
      
      const eligible = teams.filter(t => {
        if (!t.current_stage) t.current_stage = 'qualifying';
        if (!t.qualification_status) t.qualification_status = 'pending';
        if (t.status === 'withdrawn' || t.status === 'disqualified') return false;
        if (t.qualification_status === 'eliminated') return false;

        if (stage) {
          if (t.current_stage !== stage) return false;
          if (!allowRepeat) {
            // Check if team already played in this stage
            const playedInStage = parts.some((p: any) => p.team_id === t.id && p.stage === stage && p.actually_played);
            if (playedInStage) return false;
          }
        } else {
          // If no specific stage given, check if already played in its current stage
          if (!allowRepeat) {
            const playedInStage = parts.some((p: any) => p.team_id === t.id && p.stage === t.current_stage && p.actually_played);
            if (playedInStage) return false;
          }
        }
        return true;
      });

      return { success: true, data: eligible };
    },

    getPlayedTeams: async () => {
      const teams = getStoredTeams();
      return { success: true, data: teams.filter(t => t.status === 'played') };
    },

    getTeamById: async (id: string) => {
      const teams = getStoredTeams();
      return { success: true, data: teams.find(t => t.id === id) || null };
    },

    updateTeamStatus: async (teamId: string, status: any) => {
      const teams = getStoredTeams();
      const updated = teams.map(t => t.id === teamId ? { ...t, status } : t);
      setStoredTeams(updated);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    updateTeamQualification: async (teamId: string, status: any, currentStage?: any) => {
      const teams = getStoredTeams();
      const updated = teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            qualification_status: status,
            current_stage: currentStage || t.current_stage || 'qualifying'
          };
        }
        return t;
      });
      setStoredTeams(updated);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    advanceTeamStage: async (teamId: string, nextStage: any) => {
      const teams = getStoredTeams();
      const updated = teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            current_stage: nextStage,
            status: 'eligible' as any
          };
        }
        return t;
      });
      setStoredTeams(updated);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    batchUpdateTeamQualification: async (teamIds: string[], status: any, currentStage?: any) => {
      const teams = getStoredTeams();
      const setIds = new Set(teamIds);
      const updated = teams.map(t => {
        if (setIds.has(t.id)) {
          return {
            ...t,
            qualification_status: status,
            current_stage: currentStage || t.current_stage || 'qualifying'
          };
        }
        return t;
      });
      setStoredTeams(updated);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    batchAdvanceTeamStage: async (teamIds: string[], nextStage: any) => {
      const teams = getStoredTeams();
      const setIds = new Set(teamIds);
      const updated = teams.map(t => {
        if (setIds.has(t.id)) {
          return {
            ...t,
            current_stage: nextStage,
            status: 'eligible' as any
          };
        }
        return t;
      });
      setStoredTeams(updated);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    getTeamMatchHistory: async (teamId: string) => {
      const parts = JSON.parse(localStorage.getItem('ff_tournament_match_participation') || '[]');
      return { success: true, data: parts.filter((p: any) => p.team_id === teamId) };
    },

    deleteTeam: async (teamId: string) => {
      const teams = getStoredTeams();
      const filtered = teams.filter(t => t.id !== teamId);
      setStoredTeams(filtered);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    addTeam: async (teamName: string, captainName: string, captainDiscordId: string = '') => {
      try {
        const teams = getStoredTeams();
        const duplicate = teams.find(t => t.team_name.toLowerCase() === teamName.trim().toLowerCase());
        if (duplicate) return { success: false, error: `Team "${teamName.trim()}" already exists.` };

        const now = new Date().toISOString();
        const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const newTeam = {
          id: teamId,
          team_name: teamName.trim(),
          captain_name: captainName.trim(),
          captain_discord_id: captainDiscordId.trim() || null,
          captain_phone: null,
          status: 'eligible' as any,
          original_data_json: null,
          created_at: now,
          updated_at: now,
          players: [
            {
              id: `player_${Date.now()}_capt`,
              team_id: teamId,
              player_name: captainName.trim(),
              role: 'captain' as any,
              is_captain: true,
              extra_info: ''
            }
          ]
        };

        teams.push(newTeam);
        setStoredTeams(teams);
        window.dispatchEvent(new Event('teams-updated'));
        return { success: true, data: newTeam };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    addPlayer: async (teamId: string, playerName: string, role: string = 'substitute', isCaptain: boolean = false, extraInfo: string = '') => {
      try {
        const teams = getStoredTeams();
        const team = teams.find(t => t.id === teamId);
        if (!team) return { success: false, error: 'Team not found' };

        const newPlayer = {
          id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          team_id: teamId,
          player_name: playerName.trim(),
          role: role as any,
          is_captain: isCaptain,
          extra_info: extraInfo.trim()
        };

        const existingPlayers = team.players || [];
        team.players = [...existingPlayers, newPlayer];
        if (isCaptain) {
          team.captain_name = playerName.trim();
        }

        setStoredTeams(teams);
        window.dispatchEvent(new Event('teams-updated'));
        return { success: true, data: newPlayer };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    deletePlayer: async (playerId: string) => {
      try {
        const teams = getStoredTeams();
        teams.forEach(t => {
          if (t.players) {
            t.players = t.players.filter(p => p.id !== playerId);
          }
        });
        setStoredTeams(teams);
        window.dispatchEvent(new Event('teams-updated'));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    clearAllTeams: async () => {
      setStoredTeams([]);
      localStorage.removeItem(DRAW_KEY);
      localStorage.removeItem(NOTIF_KEY);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true };
    },

    resetAllTeamStatuses: async () => {
      const teams = getStoredTeams();
      const reset = teams.map(t => ({ ...t, status: 'eligible' as const }));
      setStoredTeams(reset);
      return { success: true };
    },

    getActiveDraw: async () => {
      const d = localStorage.getItem(DRAW_KEY);
      if (d) {
        try {
          return { success: true, data: JSON.parse(d) };
        } catch {}
      }
      return { success: true, data: null };
    },

    createDraw: async (arg1?: any, arg2?: any) => {
      let targetCount = 12;
      let stage: any = 'qualifying';
      if (typeof arg1 === 'object' && arg1 !== null) {
        targetCount = arg1.targetCount || 12;
        stage = arg1.stage || 'qualifying';
      } else {
        if (typeof arg1 === 'number') targetCount = arg1;
        if (typeof arg2 === 'string') stage = arg2;
      }
      const newDraw: Draw = {
        id: `draw_${Date.now()}`,
        tournament_id: 't1',
        draw_number: 1,
        target_count: targetCount,
        stage: stage,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        selections: []
      };
      localStorage.setItem(DRAW_KEY, JSON.stringify(newDraw));
      return { success: true, data: newDraw };
    },

    recordSelection: async (drawId: string, teamId: string, order: number) => {
      const teams = getStoredTeams();
      const team = teams.find(t => t.id === teamId);
      if (!team) return { success: false, error: 'Team not found' };

      // Mark team selected
      const updatedTeams = teams.map(t => t.id === teamId ? { ...t, status: 'selected' as const } : t);
      setStoredTeams(updatedTeams);

      const d = localStorage.getItem(DRAW_KEY);
      const draw: Draw = d ? JSON.parse(d) : {
        id: drawId,
        tournament_id: 't1',
        draw_number: 1,
        target_count: 12,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        selections: []
      };

      const sel = {
        id: `sel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        draw_id: drawId,
        team_id: team.id,
        team_name: team.team_name,
        captain_name: team.captain_name,
        captain_discord_id: team.captain_discord_id || undefined,
        selection_order: order,
        selected_at: new Date().toISOString(),
        notification_status: 'pending' as const,
        discord_message_id: null,
        notification_error: null
      };

      draw.selections.push(sel as any);
      localStorage.setItem(DRAW_KEY, JSON.stringify(draw));

      return { success: true, data: sel };
    },

    recordSelectionBatch: async (drawId: string, teamIds: string[], startingOrder: number = 1) => {
      const teams = getStoredTeams();
      const teamsMap = new Map(teams.map(t => [t.id, t]));

      const teamIdSet = new Set(teamIds);
      const updatedTeams = teams.map(t => teamIdSet.has(t.id) ? { ...t, status: 'selected' as const } : t);
      setStoredTeams(updatedTeams);

      const d = localStorage.getItem(DRAW_KEY);
      const draw: Draw = d ? JSON.parse(d) : {
        id: drawId,
        tournament_id: 't1',
        draw_number: 1,
        target_count: Math.max(12, teamIds.length),
        status: 'in_progress',
        created_at: new Date().toISOString(),
        selections: []
      };

      const newSelections: any[] = [];
      teamIds.forEach((id, idx) => {
        const team = teamsMap.get(id);
        if (team) {
          const sel = {
            id: `sel_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            draw_id: drawId,
            team_id: team.id,
            team_name: team.team_name,
            captain_name: team.captain_name,
            captain_discord_id: team.captain_discord_id || undefined,
            selection_order: startingOrder + idx,
            selected_at: new Date().toISOString(),
            notification_status: 'pending' as const,
            discord_message_id: null,
            notification_error: null
          };
          newSelections.push(sel);
          draw.selections.push(sel);
        }
      });

      localStorage.setItem(DRAW_KEY, JSON.stringify(draw));
      return { success: true, data: newSelections };
    },

    cancelDraw: async () => {
      const d = localStorage.getItem(DRAW_KEY);
      if (d) {
        const draw: Draw = JSON.parse(d);
        const selIds = new Set(draw.selections.map(s => s.team_id));
        const teams = getStoredTeams();
        const reverted = teams.map(t => selIds.has(t.id) ? { ...t, status: 'eligible' as const } : t);
        setStoredTeams(reverted);
      }
      localStorage.removeItem(DRAW_KEY);
      return { success: true };
    },

    selectCryptoWinner: async (eligiblePoolIds: string[]) => {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0) {
        return { success: false, error: 'Empty pool' };
      }
      const randomBuf = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuf);
      const winnerIdx = randomBuf[0] % eligiblePoolIds.length;
      return { success: true, data: { winnerTeamId: eligiblePoolIds[winnerIdx] } };
    },

    selectCryptoMultipleWinners: async (eligiblePoolIds: string[], count: number) => {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0 || count <= 0) {
        return { success: false, error: 'Empty pool or invalid count' };
      }
      const selectCount = Math.min(count, eligiblePoolIds.length);
      const pool = [...eligiblePoolIds];
      const selected: string[] = [];

      for (let i = 0; i < selectCount; i++) {
        const randomBuf = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuf);
        const randIdx = i + (randomBuf[0] % (pool.length - i));
        const temp = pool[i];
        pool[i] = pool[randIdx];
        pool[randIdx] = temp;
        selected.push(pool[i]);
      }

      return { success: true, data: { winnerTeamIds: selected } };
    },

    // Discord Bot
    getDiscordStatus: async () => {
      try {
        const resp = await fetch('/api/discord/status');
        if (resp.ok) {
          const res = await resp.json();
          if (res.success && res.data?.isReady) {
            return res;
          }
        }
      } catch {}

      // Fallback: check if token is saved and attempt connect
      const s = getStoredSettings();
      if (s.discord_bot_token && s.discord_bot_token.trim()) {
        try {
          const resp = await fetch('/api/discord/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: s.discord_bot_token.trim() })
          });
          if (resp.ok) {
            const res = await resp.json();
            if (res.success) {
              return {
                success: true,
                data: {
                  isReady: true,
                  botTag: res.botTag,
                  botId: res.botId
                }
              };
            }
          }
        } catch {}
      }

      return {
        success: true,
        data: {
          isReady: false
        }
      };
    },

    testDiscordConnection: async (token: string) => {
      try {
        const resp = await fetch('/api/discord/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token.trim() })
        });
        if (resp.ok) {
          return await resp.json();
        }
        return { success: false, error: `HTTP ${resp.status}: Could not connect to Discord API` };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error connecting to Discord backend' };
      }
    },

    sendSelectionDM: async (selId: string, discordId: string, captainName: string, teamName: string, teamId: string, force?: boolean, customTemplate?: string) => {
      const token = getStoredSettings().discord_bot_token;
      try {
        const resp = await fetch('/api/discord/send-selection-dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectionId: selId,
            captainDiscordId: discordId,
            captainName,
            teamName,
            teamId,
            token,
            customTemplate
          })
        });

        const res = resp.ok ? await resp.json() : { success: false, error: `HTTP ${resp.status}` };

        // Update active draw selection
        const d = localStorage.getItem(DRAW_KEY);
        if (d) {
          const draw: Draw = JSON.parse(d);
          const sel = draw.selections.find(s => s.id === selId);
          if (sel) {
            sel.notification_status = res.success ? 'sent' : 'failed';
            sel.discord_message_id = res.messageId || null;
            sel.notification_error = res.error || null;
            sel.notified_at = new Date().toISOString();
            localStorage.setItem(DRAW_KEY, JSON.stringify(draw));
          }
        }

        addNotificationLog({
          type: 'selection_congratulations' as any,
          team_id: teamId,
          team_name: teamName,
          captain_name: captainName,
          captain_discord_id: discordId,
          status: res.success ? 'sent' : 'failed',
          message_content: customTemplate 
            ? customTemplate.replace(/\{captain_name\}/gi, captainName).replace(/\{team_name\}/gi, teamName)
            : `🎉 Congratulations ${captainName}!\n\nYour team, ${teamName}, has been selected for today's tournament match.\n\nPlease stay ready and keep an eye on your Discord messages for room details.\n\nGood luck! 🔥`,
          error_message: res.error
        });

        return res;
      } catch (err: any) {
        addNotificationLog({
          type: 'selection_congratulations' as any,
          team_id: teamId,
          team_name: teamName,
          captain_name: captainName,
          captain_discord_id: discordId,
          status: 'failed',
          message_content: `Team ${teamName} (${captainName}) selected.`,
          error_message: err.message
        });
        return { success: false, error: err.message };
      }
    },

    sendRoomDM: async (discordId: string, captainName: string, teamName: string, teamId: string, roomId: string, pass: string, time: string, instructions?: string, customTemplate?: string) => {
      const token = getStoredSettings().discord_bot_token;
      try {
        const resp = await fetch('/api/discord/send-room-dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            captainDiscordId: discordId,
            captainName,
            teamName,
            teamId,
            roomId,
            roomPassword: pass,
            matchTime: time,
            additionalInstructions: instructions,
            token,
            customTemplate
          })
        });

        const res = resp.ok ? await resp.json() : { success: false, error: `HTTP ${resp.status}` };

        addNotificationLog({
          type: 'room_password' as any,
          team_id: teamId,
          team_name: teamName,
          captain_name: captainName,
          captain_discord_id: discordId,
          status: res.success ? 'sent' : 'failed',
          message_content: `Room ID: ${roomId} | Password: ${pass}`,
          error_message: res.error
        });

        if (res.success && teamId) {
          const allTeams = getStoredTeams();
          const updated = allTeams.map(t => t.id === teamId ? { ...t, status: 'playing' as const } : t);
          setStoredTeams(updated);
          window.dispatchEvent(new Event('teams-updated'));
        }

        return res;
      } catch (err: any) {
        addNotificationLog({
          type: 'room_password' as any,
          team_id: teamId,
          team_name: teamName,
          captain_name: captainName,
          captain_discord_id: discordId,
          status: 'failed',
          message_content: `Room ID: ${roomId}, Password: [PROTECTED], Time: ${time}`,
          error_message: err.message
        });
        return { success: false, error: err.message };
      }
    },

    sendDirectMessage: async (discordId: string, messageContent: string, teamId?: string, captainName?: string, teamName?: string) => {
      const token = getStoredSettings().discord_bot_token;
      try {
        const resp = await fetch('/api/discord/send-direct-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            captainDiscordId: discordId,
            messageContent,
            teamId,
            captainName,
            teamName,
            token
          })
        });

        const res = resp.ok ? await resp.json() : { success: false, error: `HTTP ${resp.status}` };

        addNotificationLog({
          type: 'selection_dm',
          team_id: teamId || '',
          team_name: teamName || 'Team',
          captain_name: captainName || 'Captain',
          captain_discord_id: discordId,
          status: res.success ? 'sent' : 'failed',
          message_content: messageContent,
          error_message: res.error
        });

        return res;
      } catch (err: any) {
        addNotificationLog({
          type: 'selection_dm',
          team_id: teamId || '',
          team_name: teamName || 'Team',
          captain_name: captainName || 'Captain',
          captain_discord_id: discordId,
          status: 'failed',
          message_content: messageContent,
          error_message: err.message
        });
        return { success: false, error: err.message };
      }
    },

    getNotificationLogs: async () => {
      return { success: true, data: getStoredLogs() };
    },

    getAuditLogs: async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('ff_tournament_audit_logs') || '[]');
        if (stored.length > 0) return { success: true, data: stored };
      } catch {}
      // Synthesize activity from notification logs if no direct audit logs exist
      const logs = getStoredLogs();
      const synthetic = logs.slice(0, 15).map(l => ({
        id: l.id,
        action: l.type === 'selection_dm' ? 'SELECTION_DM' : (l.type === 'room_dm' ? 'ROOM_DM' : 'NOTIFICATION'),
        details: `${l.status === 'sent' ? 'Delivered' : 'Failed to deliver'} Discord DM to ${l.team_name} (${l.captain_name})`,
        timestamp: l.timestamp
      }));
      return { success: true, data: synthetic };
    },

    getMatches: async () => {
      try {
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        return { success: true, data: m };
      } catch {
        return { success: true, data: [] };
      }
    },

    getLatestMatch: async () => {
      try {
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        return { success: true, data: m.length > 0 ? m[0] : null };
      } catch {
        return { success: true, data: null };
      }
    },

    getMatchById: async (id: string) => {
      try {
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        const match = m.find((x: any) => x.id === id);
        return { success: true, data: match || null };
      } catch {
        return { success: true, data: null };
      }
    },

    saveMatchDetails: async (matchData: any) => {
      try {
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        const id = matchData.id || `match_${Date.now()}`;
        const localNow = new Date();
        const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
        const defaultLocalTime = localNow.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

        const match = {
          ...matchData,
          id,
          match_date: matchData.match_date || defaultLocalDate,
          match_time: matchData.match_time || defaultLocalTime,
          created_at: matchData.created_at || localNow.toISOString()
        };
        const idx = m.findIndex((x: any) => x.id === id);
        if (idx >= 0) m[idx] = match;
        else m.unshift(match);
        localStorage.setItem('ff_tournament_matches', JSON.stringify(m));
        return { success: true, data: match };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    completeMatch: async (matchIdOrData: string | { matchId: string; teams?: any[]; players?: any[]; notes?: string }, teams?: any[], _players?: any[], _notes?: string) => {
      try {
        // Support both: (matchId, teams, players, notes) and ({ matchId, teams, ... })
        let matchId: string;
        let participatingTeams: any[];
        if (typeof matchIdOrData === 'object') {
          matchId = matchIdOrData.matchId;
          participatingTeams = matchIdOrData.teams || [];
        } else {
          matchId = matchIdOrData;
          participatingTeams = teams || [];
        }
        const m = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        const match = m.find((x: any) => x.id === matchId);
        if (match) {
          const localNow = new Date();
          const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
          const defaultLocalTime = localNow.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

          match.status = 'completed';
          match.completed_at = localNow.toISOString();
          if (!match.match_date) match.match_date = defaultLocalDate;
          if (!match.match_time) match.match_time = defaultLocalTime;
          localStorage.setItem('ff_tournament_matches', JSON.stringify(m));
        }

        // Record match team participation without deleting any teams
        const matchStage = match?.stage || 'qualifying';
        const matchNumber = match?.match_number || 1;
        const matchDateStr = match?.match_date || (new Date().toISOString().split('T')[0]);

        const existingParts = JSON.parse(localStorage.getItem('ff_tournament_match_participation') || '[]');
        const storedTeams = getStoredTeams();
        const updatedTeams = storedTeams.map(t => {
          const pt = participatingTeams.find((p: any) => p.team_id === t.id);
          if (pt) {
            const resStr = pt.result || (pt.actually_played ? 'completed' : 'forfeit');
            let newQual = t.qualification_status || 'pending';
            if (resStr === 'qualified') newQual = 'qualified';
            else if (resStr === 'eliminated') newQual = 'eliminated';

            // Record participation
            existingParts.push({
              id: `mtp_${Date.now()}_${t.id}`,
              match_id: matchId,
              team_id: t.id,
              team_name: t.team_name,
              captain_name: t.captain_name,
              actually_played: Boolean(pt.actually_played),
              match_number: matchNumber,
              stage: matchStage,
              result: resStr,
              match_date: matchDateStr,
              notes: pt.notes || ''
            });

            return {
              ...t,
              status: pt.actually_played ? ('played' as const) : ('eligible' as const),
              qualification_status: newQual,
              last_match_result: resStr
            };
          }
          return t;
        });

        localStorage.setItem('ff_tournament_match_participation', JSON.stringify(existingParts));
        setStoredTeams(updatedTeams);
        localStorage.removeItem(DRAW_KEY);
        window.dispatchEvent(new Event('teams-updated'));

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    deleteMatch: async (matchId: string) => {
      try {
        const matches = JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]');
        const filtered = matches.filter((m: any) => m.id !== matchId);
        localStorage.setItem('ff_tournament_matches', JSON.stringify(filtered));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    clearAllMatches: async () => {
      try {
        localStorage.removeItem('ff_tournament_matches');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    getMatchTeamParticipation: async (matchId: string) => {
      try {
        const parts = JSON.parse(localStorage.getItem('ff_tournament_match_participation') || '[]');
        const matchParts = parts.filter((p: any) => p.match_id === matchId);
        if (matchParts.length > 0) {
          return { success: true, data: matchParts };
        }

        const d = localStorage.getItem(DRAW_KEY);
        const allTeams = getStoredTeams();
        if (d) {
          const draw = JSON.parse(d);
          const selections = draw.selections || [];
          return {
            success: true,
            data: selections.map((s: any) => {
              const matchedTeam = allTeams.find(t => t.id === s.team_id);
              return {
                id: s.id,
                match_id: matchId,
                team_id: s.team_id,
                team_name: s.team_name,
                captain_name: s.captain_name,
                actually_played: true,
                stage: draw.stage || 'qualifying',
                result: 'pending',
                players: matchedTeam?.players?.map((p: any) => ({
                  id: p.id,
                  match_id: matchId,
                  team_id: s.team_id,
                  player_id: p.id,
                  player_name: p.player_name,
                  role: p.role,
                  participated: true
                })) || []
              };
            })
          };
        }
        return { success: true, data: [] };
      } catch {
        return { success: true, data: [] };
      }
    },

    backupDatabase: async () => {
      try {
        const data = {
          teams: getStoredTeams(),
          settings: getStoredSettings(),
          logs: getStoredLogs(),
          matches: JSON.parse(localStorage.getItem('ff_tournament_matches') || '[]'),
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true, data: { filePath: 'downloaded' } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    restoreDatabase: async () => {
      return { success: true, message: 'Restore dialog handled in Electron' };
    },

    exportTournamentWorkbook: async () => {
      try {
        const teams = getStoredTeams();
        const logs = getStoredLogs();
        const draws = getStoredDraws();

        const wb = XLSX.utils.book_new();

        // 1. All Teams
        const allTeamsRows = teams.map(t => ({
          'Team ID': t.id,
          'Team Name': t.team_name,
          'Captain Name': t.captain_name,
          'Captain Discord ID': t.captain_discord_id || '',
          'Captain Phone': t.captain_phone || '',
          'Participation Status': t.status.toUpperCase(),
          'Created At': t.created_at
        }));
        const ws1 = XLSX.utils.json_to_sheet(allTeamsRows.length ? allTeamsRows : [{ 'Team Name': 'No teams found' }]);
        XLSX.utils.book_append_sheet(wb, ws1, 'All Teams');

        // 2. Eligible Teams
        const eligibleTeams = teams.filter(t => t.status === 'eligible').map(t => ({
          'Team ID': t.id,
          'Team Name': t.team_name,
          'Captain Name': t.captain_name,
          'Captain Discord ID': t.captain_discord_id || '',
          'Status': 'ELIGIBLE FOR NEXT DRAW'
        }));
        const ws2 = XLSX.utils.json_to_sheet(eligibleTeams.length ? eligibleTeams : [{ 'Team Name': 'No eligible teams' }]);
        XLSX.utils.book_append_sheet(wb, ws2, 'Eligible Teams');

        // 3. Played Teams
        const playedTeams = teams.filter(t => t.status === 'played').map(t => ({
          'Team ID': t.id,
          'Team Name': t.team_name,
          'Captain Name': t.captain_name,
          'Captain Discord ID': t.captain_discord_id || '',
          'Status': 'PLAYED'
        }));
        const ws3 = XLSX.utils.json_to_sheet(playedTeams.length ? playedTeams : [{ 'Team Name': 'No played teams' }]);
        XLSX.utils.book_append_sheet(wb, ws3, 'Played Teams');

        // 4. Selections & Draws
        const ws4 = XLSX.utils.json_to_sheet(draws.length ? draws : [{ 'Status': 'No draws recorded' }]);
        XLSX.utils.book_append_sheet(wb, ws4, 'Draw History');

        // 5. Discord Logs
        const ws5 = XLSX.utils.json_to_sheet(logs.length ? logs : [{ 'Status': 'No logs' }]);
        XLSX.utils.book_append_sheet(wb, ws5, 'Audit Logs');

        const fileName = `Free_Fire_Tournament_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return { success: true, data: { fileName } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    downloadSampleTemplate: async () => {
      try {
        const ws = XLSX.utils.aoa_to_sheet([
          ['Team Name', 'Captain Name', 'Discord Username', 'Captain Phone', 'Player 2 Name', 'Player 3 Name', 'Player 4 Name', 'Substitute Name'],
          ['Apex Predators', 'Ghost', 'ghost_igl', '+1 555-0101', 'Wraith', 'Bloodhound', 'Lifeline', 'Pathfinder'],
          ['Nova Esports', 'Shadow', 'shadow_igl', '+1 555-0102', 'Phantom', 'Spectre', 'Viper', 'Omen'],
          ['Vanguard Squad', 'Cipher', 'cipher_igl', '+1 555-0103', 'Sova', 'Killjoy', 'Breach', 'Brimstone']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Registration Template');
        XLSX.writeFile(wb, 'free_fire_teams_sample_registration.xlsx');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    // Excel
    commitExcelImport: async (teamsToImport: any[], mode: 'replace' | 'append' = 'replace') => {
      // In replace mode (default for master file import), start fresh with the uploaded sheet
      const existing = mode === 'replace' ? [] : getStoredTeams();
      const existingNames = new Set(existing.map(t => t.team_name.toLowerCase().trim()));
      const createdTeams: Team[] = [];

      teamsToImport.forEach((row, i) => {
        let cleanName = (row.team_name || '').trim();
        let cleanCapt = (row.captain_name || '').trim();
        let cleanDiscord = (row.captain_discord_id || '').trim();

        // Check if Discord was placed in extra_columns
        if (!cleanDiscord && row.extra_columns) {
          for (const [col, val] of Object.entries(row.extra_columns)) {
            if (col.toLowerCase().includes('discord') && val) {
              cleanDiscord = String(val).trim();
              break;
            }
          }
        }

        if (cleanDiscord.startsWith('@')) cleanDiscord = cleanDiscord.slice(1).trim();

        if (!cleanName && cleanCapt) cleanName = `${cleanCapt}'s Squad`;
        if (!cleanCapt && cleanName) cleanCapt = `${cleanName} Leader`;
        if (!cleanName && !cleanCapt) {
          cleanName = `Squad #${existing.length + i + 1}`;
          cleanCapt = `Captain #${existing.length + i + 1}`;
        }

        let finalName = cleanName;
        if (mode === 'append') {
          let suffix = 2;
          while (existingNames.has(finalName.toLowerCase())) {
            finalName = `${cleanName} (${suffix})`;
            suffix++;
          }
        }
        existingNames.add(finalName.toLowerCase());

        const newTeam: Team = {
          id: `team_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          team_name: finalName,
          captain_name: cleanCapt,
          captain_phone: row.captain_phone ? String(row.captain_phone).trim() : null,
          captain_discord_id: cleanDiscord || null,
          status: 'eligible',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          extra_columns: row.extra_columns || {}
        };
        createdTeams.push(newTeam);
      });

      const allMerged = mode === 'replace' ? createdTeams : [...existing, ...createdTeams];
      setStoredTeams(allMerged);
      window.dispatchEvent(new Event('teams-updated'));
      return { success: true, data: { insertedCount: createdTeams.length, updatedCount: 0 } };
    }
  };
}
