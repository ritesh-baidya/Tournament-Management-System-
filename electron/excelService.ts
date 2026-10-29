import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { 
  Team, Draw, Match, MatchTeamParticipation, ExcelImportPreview, 
  ExcelImportRow, Player 
} from '../src/types';
import { TournamentDatabase } from './database';

export class ExcelService {
  /**
   * Common header aliases mapping to standardized internal fields
   */
  private static headerMap: Record<string, string[]> = {
    team_name: [
      'team name', 'team', 'team_name', 'squad name', 'squad', 'teamname', 'squad_name'
    ],
    captain_name: [
      'captain name', 'captain', 'leader', 'captain_name', 'leader name', 'leader_name', 'igl'
    ],
    captain_phone: [
      'captain phone number', 'captain phone', 'phone number', 'phone', 'mobile number', 
      'mobile', 'contact', 'whatsapp', 'captain mobile', 'captain_phone'
    ],
    captain_discord_id: [
      'captain discord user id', 'captain discord id', 'discord user id', 'discord id', 
      'discord uid', 'captain discord', 'discord_id', 'discord_user_id', 'discord'
    ],
    player2_name: [
      'player 2 name', 'player 2', 'player2', 'player_2', 'player2 name', 'member 2', 'member2'
    ],
    player3_name: [
      'player 3 name', 'player 3', 'player3', 'player_3', 'player3 name', 'member 3', 'member3'
    ],
    player4_name: [
      'player 4 name', 'player 4', 'player4', 'player_4', 'player4 name', 'member 4', 'member4'
    ],
    substitute_name: [
      'substitute player name', 'substitute name', 'substitute', 'sub player', 'sub', 
      'player 5', 'player 5 name', 'substitute_name', 'sub_player'
    ]
  };

  /**
   * Matches a raw header string to a standardized field name
   */
  private static matchHeader(rawHeader: string): string | null {
    const normalized = rawHeader.toLowerCase().trim().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ');
    for (const [field, aliases] of Object.entries(this.headerMap)) {
      if (aliases.includes(normalized)) {
        return field;
      }
    }
    return null;
  }

  /**
   * Parses an Excel buffer or file path into a preview structure with validation
   */
  public static parseExcelBuffer(
    buffer: Buffer, 
    existingTeams: Team[] = []
  ): ExcelImportPreview {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel workbook contains no sheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      throw new Error('Excel sheet is empty');
    }

    // First row is headers
    const rawHeaders: string[] = (rawData[0] as any[]).map(h => String(h || '').trim());
    const detectedHeaders: Record<string, string> = {};
    const columnIndexToField: Record<number, string> = {};
    const extraColumnIndices: Record<number, string> = {};

    rawHeaders.forEach((header, idx) => {
      if (!header) return;
      const matched = this.matchHeader(header);
      if (matched) {
        detectedHeaders[header] = matched;
        columnIndexToField[idx] = matched;
      } else {
        extraColumnIndices[idx] = header;
      }
    });

    const existingTeamNamesSet = new Set(existingTeams.map(t => t.team_name.toLowerCase().trim()));
    const seenNamesInFile = new Set<string>();

    const rows: ExcelImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (let r = 1; r < rawData.length; r++) {
      const rowArr = rawData[r] as any[];
      if (!rowArr || rowArr.length === 0 || rowArr.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
        continue; // Skip empty rows
      }

      const rowObj: any = {
        rowIndex: r + 1,
        team_name: '',
        captain_name: '',
        extra_columns: {},
        validationErrors: [],
        isValid: true,
        isDuplicateInFile: false,
        isDuplicateInDb: false
      };

      // Populate known fields
      Object.entries(columnIndexToField).forEach(([idxStr, field]) => {
        const idx = parseInt(idxStr, 10);
        const val = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]).trim() : '';
        rowObj[field] = val;
      });

      // Populate extra columns
      Object.entries(extraColumnIndices).forEach(([idxStr, colName]) => {
        const idx = parseInt(idxStr, 10);
        const val = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]).trim() : '';
        if (val) {
          rowObj.extra_columns[colName] = val;
        }
      });

      // Validate required fields
      if (!rowObj.team_name) {
        rowObj.validationErrors.push('Missing Team Name');
      }
      if (!rowObj.captain_name) {
        rowObj.validationErrors.push('Missing Captain Name');
      }

      // Check Discord ID formatting (numeric snowflake if present)
      if (rowObj.captain_discord_id) {
        const idStr = String(rowObj.captain_discord_id).trim();
        // If someone entered a phone number or non-digit ID in discord column
        if (idStr.includes('@') || idStr.includes('+') || (idStr.length < 16 && !/^\d+$/.test(idStr))) {
          rowObj.validationErrors.push('Discord User ID must be a valid numeric Discord Snowflake ID (17-20 digits)');
        }
      }

      // Check duplicates
      const normalizedTeamName = (rowObj.team_name || '').toLowerCase().trim();
      if (normalizedTeamName) {
        if (seenNamesInFile.has(normalizedTeamName)) {
          rowObj.isDuplicateInFile = true;
          rowObj.validationErrors.push(`Duplicate team name in file: "${rowObj.team_name}"`);
        } else {
          seenNamesInFile.add(normalizedTeamName);
        }

        if (existingTeamNamesSet.has(normalizedTeamName)) {
          rowObj.isDuplicateInDb = true;
          // Note: In DB this can be treated as update or duplicate warning
        }
      }

      if (rowObj.isDuplicateInFile || rowObj.isDuplicateInDb) {
        duplicateCount++;
      }

      if (rowObj.validationErrors.length > 0) {
        rowObj.isValid = false;
        invalidCount++;
      } else {
        rowObj.isValid = true;
        validCount++;
      }

      rows.push(rowObj);
    }

    return {
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      detectedHeaders,
      rows
    };
  }

  /**
   * Generates a 5-sheet updated Excel workbook after a match or for export
   */
  public static generateTournamentWorkbook(db: TournamentDatabase, activeDraw?: Draw | null): Buffer {
    const allTeams = db.getAllTeams();
    const eligibleTeams = db.getEligibleTeams();
    const playedTeams = db.getPlayedTeams();
    const matches = db.getMatches();
    const latestDraw = activeDraw || db.getLatestDraw();

    const workbook = XLSX.utils.book_new();

    // ----------------------------------------------------
    // Sheet 1: All Teams
    // ----------------------------------------------------
    const allTeamsRows = allTeams.map((t, idx) => {
      const players = t.players || [];
      const capt = players.find(p => p.is_captain || p.role === 'captain')?.player_name || t.captain_name;
      const p2 = players.find(p => p.role === 'player2')?.player_name || '';
      const p3 = players.find(p => p.role === 'player3')?.player_name || '';
      const p4 = players.find(p => p.role === 'player4')?.player_name || '';
      const sub = players.find(p => p.role === 'substitute')?.player_name || '';

      const baseRow: Record<string, any> = {
        'Team ID': t.id,
        'Team Name': t.team_name,
        'Captain Name': capt,
        'Captain Phone Number': t.captain_phone || '',
        'Captain Discord User ID': t.captain_discord_id || '',
        'Player 2 Name': p2,
        'Player 3 Name': p3,
        'Player 4 Name': p4,
        'Substitute Player Name': sub,
        'Participation Status': t.status.toUpperCase(),
        'Registration Date': t.created_at
      };

      // Add any extra custom columns preserved
      if (t.extra_columns) {
        Object.entries(t.extra_columns).forEach(([k, v]) => {
          baseRow[k] = v;
        });
      }

      return baseRow;
    });

    const sheet1 = XLSX.utils.json_to_sheet(allTeamsRows.length > 0 ? allTeamsRows : [
      { 'Team ID': '', 'Team Name': 'No teams found', 'Captain Name': '', 'Participation Status': '' }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet1, 'All Teams');

    // ----------------------------------------------------
    // Sheet 2: Eligible Teams (Used for the next spin wheel)
    // ----------------------------------------------------
    const eligibleTeamsRows = eligibleTeams.map((t) => {
      const players = t.players || [];
      const capt = players.find(p => p.is_captain || p.role === 'captain')?.player_name || t.captain_name;
      const p2 = players.find(p => p.role === 'player2')?.player_name || '';
      const p3 = players.find(p => p.role === 'player3')?.player_name || '';
      const p4 = players.find(p => p.role === 'player4')?.player_name || '';
      const sub = players.find(p => p.role === 'substitute')?.player_name || '';

      return {
        'Team ID': t.id,
        'Team Name': t.team_name,
        'Captain Name': capt,
        'Captain Discord User ID': t.captain_discord_id || '',
        'Player 2 Name': p2,
        'Player 3 Name': p3,
        'Player 4 Name': p4,
        'Substitute Player Name': sub,
        'Status': 'ELIGIBLE FOR NEXT DRAW'
      };
    });

    const sheet2 = XLSX.utils.json_to_sheet(eligibleTeamsRows.length > 0 ? eligibleTeamsRows : [
      { 'Team ID': '', 'Team Name': 'No eligible teams available', 'Captain Name': '', 'Status': '' }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet2, 'Eligible Teams');

    // ----------------------------------------------------
    // Sheet 3: Played Teams
    // ----------------------------------------------------
    const playedTeamsRows = playedTeams.map((t) => {
      const players = t.players || [];
      const capt = players.find(p => p.is_captain || p.role === 'captain')?.player_name || t.captain_name;
      const p2 = players.find(p => p.role === 'player2')?.player_name || '';
      const p3 = players.find(p => p.role === 'player3')?.player_name || '';
      const p4 = players.find(p => p.role === 'player4')?.player_name || '';
      const sub = players.find(p => p.role === 'substitute')?.player_name || '';

      return {
        'Team ID': t.id,
        'Team Name': t.team_name,
        'Captain Name': capt,
        'Player 2 Name': p2,
        'Player 3 Name': p3,
        'Player 4 Name': p4,
        'Substitute Player Name': sub,
        'Participation Date': t.updated_at,
        'Status': 'PLAYED (INELIGIBLE)'
      };
    });

    const sheet3 = XLSX.utils.json_to_sheet(playedTeamsRows.length > 0 ? playedTeamsRows : [
      { 'Team ID': '', 'Team Name': 'No played teams yet', 'Captain Name': '', 'Status': '' }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet3, 'Played Teams');

    // ----------------------------------------------------
    // Sheet 4: Match History
    // ----------------------------------------------------
    const matchHistoryRows: Record<string, any>[] = [];
    for (const m of matches) {
      const teamParticipation = db.getMatchTeamParticipation(m.id);
      for (const tp of teamParticipation) {
        const playerParts = tp.players || [];
        const participatedPlayersStr = playerParts
          .filter(p => p.participated)
          .map(p => `${p.player_name} (${p.role})`)
          .join(', ');

        matchHistoryRows.push({
          'Match Number': m.match_number,
          'Draw ID': m.draw_id || 'N/A',
          'Team Name': tp.team_name || '',
          'Captain Name': tp.captain_name || '',
          'Selection Order': tp.selection_order || 'N/A',
          'Actually Played': tp.actually_played ? 'YES' : 'NO (FORFEIT/NO-SHOW)',
          'Player Participation Info': participatedPlayersStr || 'Full Roster',
          'Match Date': m.match_date || '',
          'Match Time': m.match_time || '',
          'Room ID': m.room_id || '',
          'Admin Notes': m.admin_notes || tp.notes || ''
        });
      }
    }

    const sheet4 = XLSX.utils.json_to_sheet(matchHistoryRows.length > 0 ? matchHistoryRows : [
      { 'Match Number': '', 'Draw ID': '', 'Team Name': 'No match history recorded', 'Captain Name': '', 'Actually Played': '' }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet4, 'Match History');

    // ----------------------------------------------------
    // Sheet 5: Selected Teams (Most recent draw)
    // ----------------------------------------------------
    const selectedRows: Record<string, any>[] = [];
    if (latestDraw && latestDraw.selections) {
      for (const s of latestDraw.selections) {
        selectedRows.push({
          'Draw Number': latestDraw.draw_number,
          'Selection Order': s.selection_order,
          'Team Name': s.team_name,
          'Captain Name': s.captain_name,
          'Captain Discord ID': s.captain_discord_id || '',
          'Selection Time': s.selected_at,
          'Notification Status': s.notification_status.toUpperCase(),
          'Discord Message ID': s.discord_message_id || '',
          'Notification Error': s.notification_error || ''
        });
      }
    }

    const sheet5 = XLSX.utils.json_to_sheet(selectedRows.length > 0 ? selectedRows : [
      { 'Draw Number': '', 'Selection Order': '', 'Team Name': 'No draw selections active', 'Captain Name': '', 'Notification Status': '' }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet5, 'Selected Teams');

    // Write to buffer
    const outBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return outBuffer;
  }

  /**
   * Generates a sample registration template with 24 realistic teams
   */
  public static generateSampleRegistrationTemplate(): Buffer {
    const sampleTeams = [
      {
        'Team Name': 'Total Gaming Esports',
        'Captain Name': 'Ajay Sharma',
        'Captain Phone Number': '+91 98765 43210',
        'Captain Discord User ID': '108273645192837465',
        'Player 2 Name': 'Prince Gupta',
        'Player 3 Name': 'Vicky Singh',
        'Player 4 Name': 'Rohit Verma',
        'Substitute Player Name': 'Kunal Yadav',
        'Coach Name': 'Coach Vikram',
        'Free Fire Guild UID': 'FF-GUILD-101'
      },
      {
        'Team Name': 'Team Elite Free Fire',
        'Captain Name': 'Pahadi Gaming',
        'Captain Phone Number': '+91 98123 45678',
        'Captain Discord User ID': '109283746510293847',
        'Player 2 Name': 'Jonty Gaming',
        'Player 3 Name': 'Killer FF',
        'Player 4 Name': 'Iconic Pro',
        'Substitute Player Name': 'Tirth V',
        'Coach Name': 'Coach Rakesh',
        'Free Fire Guild UID': 'FF-GUILD-102'
      },
      {
        'Team Name': 'TSM Entity India',
        'Captain Name': 'Neyoo Sen',
        'Captain Phone Number': '+91 98711 22334',
        'Captain Discord User ID': '110293847561029384',
        'Player 2 Name': 'Jonathan Amar',
        'Player 3 Name': 'ClutchGod',
        'Player 4 Name': 'Zgod OP',
        'Substitute Player Name': 'Ghatak Sir',
        'Coach Name': 'Coach Aman',
        'Free Fire Guild UID': 'FF-GUILD-103'
      },
      {
        'Team Name': 'GodLike Esports',
        'Captain Name': 'Kronten Boss',
        'Captain Phone Number': '+91 98222 33445',
        'Captain Discord User ID': '111293847561029385',
        'Player 2 Name': 'Shadow FF',
        'Player 3 Name': 'Spower Ace',
        'Player 4 Name': 'Gill Gaming',
        'Substitute Player Name': 'Manya OP',
        'Coach Name': 'Coach Suraj',
        'Free Fire Guild UID': 'FF-GUILD-104'
      },
      {
        'Team Name': 'Blind Esports',
        'Captain Name': 'Mamba Ray',
        'Captain Phone Number': '+91 98333 44556',
        'Captain Discord User ID': '112293847561029386',
        'Player 2 Name': 'Nakul Fire',
        'Player 3 Name': 'Rony Beast',
        'Player 4 Name': 'Harsh Sniper',
        'Substitute Player Name': 'Rishi Sub',
        'Coach Name': 'Coach Nikhil',
        'Free Fire Guild UID': 'FF-GUILD-105'
      },
      {
        'Team Name': 'Orangutan Elite',
        'Captain Name': 'Wizz Gaming',
        'Captain Phone Number': '+91 98444 55667',
        'Captain Discord User ID': '113293847561029387',
        'Player 2 Name': 'Draco FF',
        'Player 3 Name': 'Sensei Rush',
        'Player 4 Name': 'Blaze OP',
        'Substitute Player Name': 'Venom Sub',
        'Coach Name': 'Coach Karan',
        'Free Fire Guild UID': 'FF-GUILD-106'
      },
      {
        'Team Name': 'Hyderabad Hydras',
        'Captain Name': 'Viper Fire',
        'Captain Phone Number': '+91 98555 66778',
        'Captain Discord User ID': '114293847561029388',
        'Player 2 Name': 'Hydra Ace',
        'Player 3 Name': 'Rex Nitro',
        'Player 4 Name': 'Ghost Sniper',
        'Substitute Player Name': 'Phantom X',
        'Coach Name': 'Coach Dev',
        'Free Fire Guild UID': 'FF-GUILD-107'
      },
      {
        'Team Name': 'Revenant Esports',
        'Captain Name': 'Paradox King',
        'Captain Phone Number': '+91 98666 77889',
        'Captain Discord User ID': '115293847561029389',
        'Player 2 Name': 'Kyro Rush',
        'Player 3 Name': 'Spark Fire',
        'Player 4 Name': 'Titan OP',
        'Substitute Player Name': 'Alpha Sub',
        'Coach Name': 'Coach Sameer',
        'Free Fire Guild UID': 'FF-GUILD-108'
      },
      {
        'Team Name': 'Enigma Gaming',
        'Captain Name': 'Rawknee OP',
        'Captain Phone Number': '+91 98777 88990',
        'Captain Discord User ID': '116293847561029390',
        'Player 2 Name': 'Insane God',
        'Player 3 Name': 'Bullet Rush',
        'Player 4 Name': 'Storm Eye',
        'Substitute Player Name': 'Frost Bit',
        'Coach Name': 'Coach Rajiv',
        'Free Fire Guild UID': 'FF-GUILD-109'
      },
      {
        'Team Name': 'Chemin Esports',
        'Captain Name': 'Radhe Gaming',
        'Captain Phone Number': '+91 98888 99001',
        'Captain Discord User ID': '117293847561029391',
        'Player 2 Name': 'Swag Ace',
        'Player 3 Name': 'Thunder Fox',
        'Player 4 Name': 'Nova Striker',
        'Substitute Player Name': 'Zeus Sub',
        'Coach Name': 'Coach Amit',
        'Free Fire Guild UID': 'FF-GUILD-110'
      },
      {
        'Team Name': 'Nigma Galaxy India',
        'Captain Name': 'Vortex Chief',
        'Captain Phone Number': '+91 98999 00112',
        'Captain Discord User ID': '118293847561029392',
        'Player 2 Name': 'Aero Blast',
        'Player 3 Name': 'Falcon Sky',
        'Player 4 Name': 'Cobra Strike',
        'Substitute Player Name': 'Raven Sub',
        'Coach Name': 'Coach Kabir',
        'Free Fire Guild UID': 'FF-GUILD-111'
      },
      {
        'Team Name': 'Global Esports FF',
        'Captain Name': 'Skylord Legend',
        'Captain Phone Number': '+91 97111 22334',
        'Captain Discord User ID': '119293847561029393',
        'Player 2 Name': 'Eagle Eye',
        'Player 3 Name': 'Sniper God',
        'Player 4 Name': 'Flash Rush',
        'Substitute Player Name': 'Ranger Sub',
        'Coach Name': 'Coach Arvind',
        'Free Fire Guild UID': 'FF-GUILD-112'
      },
      {
        'Team Name': '7Sea Esports',
        'Captain Name': 'Poseidon FF',
        'Captain Phone Number': '+91 97222 33445',
        'Captain Discord User ID': '120293847561029394',
        'Player 2 Name': 'Ocean Tide',
        'Player 3 Name': 'Deep Sea',
        'Player 4 Name': 'Shark Attack',
        'Substitute Player Name': 'Wave Sub',
        'Coach Name': 'Coach Sagar',
        'Free Fire Guild UID': 'FF-GUILD-113'
      },
      {
        'Team Name': 'Skylightz Gaming',
        'Captain Name': 'Zenith Pro',
        'Captain Phone Number': '+91 97333 44556',
        'Captain Discord User ID': '121293847561029395',
        'Player 2 Name': 'Cosmo Ace',
        'Player 3 Name': 'Starlight FF',
        'Player 4 Name': 'Solar Flare',
        'Substitute Player Name': 'Lunar Sub',
        'Coach Name': 'Coach Tarun',
        'Free Fire Guild UID': 'FF-GUILD-114'
      },
      {
        'Team Name': 'Marcos Gaming',
        'Captain Name': 'Commando Max',
        'Captain Phone Number': '+91 97444 55667',
        'Captain Discord User ID': '122293847561029396',
        'Player 2 Name': 'Bravo Force',
        'Player 3 Name': 'Delta Recon',
        'Player 4 Name': 'Echo Sniper',
        'Substitute Player Name': 'Tango Sub',
        'Coach Name': 'Coach Mohan',
        'Free Fire Guild UID': 'FF-GUILD-115'
      },
      {
        'Team Name': 'Insane Esports',
        'Captain Name': 'Maniac Rush',
        'Captain Phone Number': '+91 97555 66778',
        'Captain Discord User ID': '123293847561029397',
        'Player 2 Name': 'Psycho Ace',
        'Player 3 Name': 'Chaos Maker',
        'Player 4 Name': 'Frenzy Fire',
        'Substitute Player Name': 'Havoc Sub',
        'Coach Name': 'Coach Pradeep',
        'Free Fire Guild UID': 'FF-GUILD-116'
      },
      {
        'Team Name': 'Entity Gaming FF',
        'Captain Name': 'Captain Razor',
        'Captain Phone Number': '+91 97666 77889',
        'Captain Discord User ID': '124293847561029398',
        'Player 2 Name': 'Blade Runner',
        'Player 3 Name': 'Sharp Edge',
        'Player 4 Name': 'Steel Heart',
        'Substitute Player Name': 'Dagger Sub',
        'Coach Name': 'Coach Sunil',
        'Free Fire Guild UID': 'FF-GUILD-117'
      },
      {
        'Team Name': 'Galaxy Racers India',
        'Captain Name': 'Nitro Turbo',
        'Captain Phone Number': '+91 97777 88990',
        'Captain Discord User ID': '125293847561029399',
        'Player 2 Name': 'Speed Demon',
        'Player 3 Name': 'Overdrive FF',
        'Player 4 Name': 'Apex Drift',
        'Substitute Player Name': 'Ignition Sub',
        'Coach Name': 'Coach Chetan',
        'Free Fire Guild UID': 'FF-GUILD-118'
      },
      {
        'Team Name': 'Velocity Gaming',
        'Captain Name': 'Mach Rush',
        'Captain Phone Number': '+91 97888 99001',
        'Captain Discord User ID': '126293847561029400',
        'Player 2 Name': 'Sonic Boom',
        'Player 3 Name': 'Hyper Beam',
        'Player 4 Name': 'Quantum Leap',
        'Substitute Player Name': 'Warp Sub',
        'Coach Name': 'Coach Varun',
        'Free Fire Guild UID': 'FF-GUILD-119'
      },
      {
        'Team Name': 'True Rippers Esports',
        'Captain Name': 'Ripper King',
        'Captain Phone Number': '+91 97999 00112',
        'Captain Discord User ID': '127293847561029401',
        'Player 2 Name': 'Savage Beast',
        'Player 3 Name': 'Predator FF',
        'Player 4 Name': 'Apex Hunter',
        'Substitute Player Name': 'Carnage Sub',
        'Coach Name': 'Coach Deepak',
        'Free Fire Guild UID': 'FF-GUILD-120'
      },
      {
        'Team Name': 'Force One Esports',
        'Captain Name': 'Major General',
        'Captain Phone Number': '+91 96111 22334',
        'Captain Discord User ID': '128293847561029402',
        'Player 2 Name': 'Colonel Strike',
        'Player 3 Name': 'Captain Fury',
        'Player 4 Name': 'Lieutenant Gun',
        'Substitute Player Name': 'Sergeant Sub',
        'Coach Name': 'Coach Ramesh',
        'Free Fire Guild UID': 'FF-GUILD-121'
      },
      {
        'Team Name': 'Gods Reign FF',
        'Captain Name': 'Ares War',
        'Captain Phone Number': '+91 96222 33445',
        'Captain Discord User ID': '129293847561029403',
        'Player 2 Name': 'Hades Realm',
        'Player 3 Name': 'Apollo Light',
        'Player 4 Name': 'Hermes Swift',
        'Substitute Player Name': 'Atlas Sub',
        'Coach Name': 'Coach Shashi',
        'Free Fire Guild UID': 'FF-GUILD-122'
      },
      {
        'Team Name': 'Team Mayhem FF',
        'Captain Name': 'Disaster Lord',
        'Captain Phone Number': '+91 96333 44556',
        'Captain Discord User ID': '130293847561029404',
        'Player 2 Name': 'Calamity Jane',
        'Player 3 Name': 'Cataclysm OP',
        'Player 4 Name': 'Rupture Rush',
        'Substitute Player Name': 'Quake Sub',
        'Coach Name': 'Coach Hemant',
        'Free Fire Guild UID': 'FF-GUILD-123'
      },
      {
        'Team Name': 'Dragon Claw Esports',
        'Captain Name': 'Drake Flame',
        'Captain Phone Number': '+91 96444 55667',
        'Captain Discord User ID': '131293847561029405',
        'Player 2 Name': 'Wyvern Wing',
        'Player 3 Name': 'Scales Armor',
        'Player 4 Name': 'Inferno Breath',
        'Substitute Player Name': 'Ember Sub',
        'Coach Name': 'Coach Bharat',
        'Free Fire Guild UID': 'FF-GUILD-124'
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleTeams);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Registrations');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  /**
   * Safely writes a buffer to a target path using atomic temporary write
   */
  public static safeSaveFile(destinationPath: string, buffer: Buffer): void {
    const dir = path.dirname(destinationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempPath = `${destinationPath}.tmp_${Date.now()}`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, destinationPath);
  }
}
