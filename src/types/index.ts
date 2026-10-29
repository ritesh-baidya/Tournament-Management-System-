export type TeamStatus = 'eligible' | 'selected' | 'played' | 'withdrawn' | 'disqualified';

export interface Player {
  id: string;
  team_id: string;
  player_name: string;
  role: 'captain' | 'player2' | 'player3' | 'player4' | 'substitute' | 'extra';
  is_captain: boolean;
  extra_info?: string;
}

export interface Team {
  id: string;
  team_name: string;
  captain_name: string;
  captain_phone?: string | null;
  captain_discord_id?: string | null;
  status: TeamStatus;
  original_data_json?: string;
  created_at: string;
  updated_at: string;
  players?: Player[];
  extra_columns?: Record<string, string>;
}

export interface DrawSelection {
  id: string;
  draw_id: string;
  team_id: string;
  team_name: string;
  captain_name: string;
  captain_discord_id?: string;
  selection_order: number;
  selected_at: string;
  notification_status: 'pending' | 'sending' | 'sent' | 'failed';
  discord_message_id?: string | null;
  notification_error?: string | null;
  notified_at?: string | null;
}

export interface Draw {
  id: string;
  tournament_id: string;
  draw_number: number;
  target_count: number;
  status: 'in_progress' | 'finalized' | 'cancelled';
  created_at: string;
  finalized_at?: string | null;
  selections: DrawSelection[];
}

export interface Match {
  id: string;
  draw_id?: string | null;
  match_number: number;
  room_id: string;
  room_password: string;
  match_date: string;
  match_time: string;
  voice_channel_info: string;
  additional_instructions: string;
  room_notification_status: 'draft' | 'sending' | 'sent' | 'failed';
  status: 'scheduled' | 'completed' | 'cancelled';
  completed_at?: string | null;
  admin_notes: string;
  created_at: string;
}

export interface MatchTeamParticipation {
  id: string;
  match_id: string;
  team_id: string;
  team_name?: string;
  captain_name?: string;
  selection_order?: number;
  actually_played: boolean;
  notes?: string;
  players?: MatchPlayerParticipation[];
}

export interface MatchPlayerParticipation {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  player_name: string;
  role: string;
  participated: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  type: 'selection_dm' | 'room_dm';
  team_id: string;
  team_name: string;
  captain_name: string;
  captain_discord_id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  message_content: string;
  message_id?: string | null;
  error_message?: string | null;
  timestamp: string;
}

export interface DashboardStats {
  total_teams: number;
  eligible_teams: number;
  played_teams: number;
  selected_teams: number;
  remaining_eligible: number;
  notifications_sent: number;
  notifications_pending: number;
  notifications_failed: number;
  latest_draw?: Draw | null;
  latest_match?: Match | null;
}

export interface TournamentSettings {
  tournament_name: string;
  rotation_policy: 'one_time' | 'recurring_cycle';
  selection_target: number;
  discord_bot_token: string;
  discord_guild_id?: string;
  sound_enabled: boolean;
  rules: string[];
}

export interface ExcelImportRow {
  rowIndex: number;
  team_name: string;
  captain_name: string;
  captain_phone?: string;
  captain_discord_id?: string;
  player2_name?: string;
  player3_name?: string;
  player4_name?: string;
  substitute_name?: string;
  extra_columns?: Record<string, string>;
  isValid: boolean;
  validationErrors: string[];
  isDuplicateInFile: boolean;
  isDuplicateInDb: boolean;
}

export interface ExcelImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  detectedHeaders: Record<string, string>;
  rows: ExcelImportRow[];
}

export interface ExcelExportOptions {
  includeOriginalExtras?: boolean;
}

export interface IPCResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
