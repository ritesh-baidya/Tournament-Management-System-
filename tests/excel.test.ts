import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { ExcelService } from '../electron/excelService';
import { TournamentDatabase } from '../electron/database';
import path from 'path';
import fs from 'fs';

describe('Excel Import, Validation & Export Service', () => {
  it('should parse a valid Excel workbook with full rosters', () => {
    const rawData = [
      {
        'Team Name': 'Alpha Fire',
        'Captain Name': 'Rahul',
        'Captain Phone Number': '+91 99999 88888',
        'Captain Discord User ID': '108273645192837465',
        'Player 2 Name': 'Aman',
        'Player 3 Name': 'Kunal',
        'Player 4 Name': 'Rohit',
        'Substitute Player Name': 'Vicky'
      },
      {
        'Team Name': 'Bravo Squad',
        'Captain Name': 'Suman',
        'Captain Phone Number': '+91 88888 77777',
        'Captain Discord User ID': '109283746510293847',
        'Player 2 Name': 'Pooja',
        'Player 3 Name': 'Deepak',
        'Player 4 Name': 'Suraj',
        'Substitute Player Name': 'Naveen'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Teams');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const preview = ExcelService.parseExcelBuffer(buffer);
    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(2);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows[0].team_name).toBe('Alpha Fire');
    expect(preview.rows[0].captain_name).toBe('Rahul');
    expect(preview.rows[0].captain_discord_id).toBe('108273645192837465');
  });

  it('should automatically detect common variations in header names', () => {
    const rawData = [
      {
        'squad_name': 'Gamma Esports',
        'leader': 'Captain Vijay',
        'mobile': '+91 77777 66666',
        'discord uid': '110293847561029384',
        'player2': 'Sameer',
        'player3': 'Ajay',
        'player4': 'Manoj',
        'sub': 'Dev'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const preview = ExcelService.parseExcelBuffer(buffer);
    expect(preview.validRows).toBe(1);
    expect(preview.rows[0].team_name).toBe('Gamma Esports');
    expect(preview.rows[0].captain_name).toBe('Captain Vijay');
    expect(preview.rows[0].player2_name).toBe('Sameer');
    expect(preview.rows[0].substitute_name).toBe('Dev');
  });

  it('should auto-heal missing team/captain names instead of rejecting rows', () => {
    const rawData = [
      {
        'Team Name': '', // Missing
        'Captain Name': 'Incomplete Captain'
      },
      {
        'Team Name': 'Nameless Squad',
        'Captain Name': '' // Missing
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const preview = ExcelService.parseExcelBuffer(buffer);
    // All rows should be valid thanks to auto-healing
    expect(preview.validRows).toBe(2);
    expect(preview.invalidRows).toBe(0);
    // Row 1: captain exists, team auto-generated as "Captain's Squad"
    expect(preview.rows[0].team_name).toBe("Incomplete Captain's Squad");
    expect(preview.rows[0].captain_name).toBe('Incomplete Captain');
    // Row 2: team exists, captain auto-generated as "Team Leader"
    expect(preview.rows[1].team_name).toBe('Nameless Squad');
    expect(preview.rows[1].captain_name).toBe('Nameless Squad Leader');
  });

  it('should detect duplicate teams in file', () => {
    const rawData = [
      { 'Team Name': 'Duplicate Squad', 'Captain Name': 'Leader 1' },
      { 'Team Name': 'duplicate squad', 'Captain Name': 'Leader 2' } // Duplicate (case-insensitive)
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const preview = ExcelService.parseExcelBuffer(buffer);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.rows[1].isDuplicateInFile).toBe(true);
  });

  it('should preserve extra custom columns without losing data', () => {
    const rawData = [
      {
        'Team Name': 'Custom Squad',
        'Captain Name': 'Captain X',
        'Coach Name': 'Coach Sharma',
        'Free Fire Guild UID': 'GUILD-999',
        'Region': 'South Asia'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const preview = ExcelService.parseExcelBuffer(buffer);
    expect(preview.validRows).toBe(1);
    expect(preview.rows[0].extra_columns).toEqual({
      'Coach Name': 'Coach Sharma',
      'Free Fire Guild UID': 'GUILD-999',
      'Region': 'South Asia'
    });
  });

  it('should generate a 5-sheet workbook containing all required sheets', async () => {
    const testDbPath = path.join(process.cwd(), 'tests', 'test_excel.db');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const db = new TournamentDatabase(testDbPath);
    await db.initialize();

    // Import a sample team
    db.importTeamsBatch([
      {
        team_name: 'Total Gaming',
        captain_name: 'Ajay',
        players: [
          { name: 'Ajay', role: 'captain', is_captain: true },
          { name: 'Prince', role: 'player2' },
          { name: 'Vicky', role: 'player3' },
          { name: 'Rohit', role: 'player4' }
        ]
      }
    ]);

    const outBuffer = ExcelService.generateTournamentWorkbook(db);
    expect(outBuffer).toBeDefined();

    // Verify 5 sheets
    const readWb = XLSX.read(outBuffer, { type: 'buffer' });
    expect(readWb.SheetNames).toEqual([
      'All Teams',
      'Eligible Teams',
      'Played Teams',
      'Match History',
      'Selected Teams'
    ]);

    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });
});
