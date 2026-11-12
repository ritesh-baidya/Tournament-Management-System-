import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, 
  Trash2, Edit2, Search, RefreshCw, Check, X, 
  Users
} from 'lucide-react';
import { ExcelImportPreview, ExcelImportRow } from '../types';
import { PageId } from '../components/Sidebar';

interface ImportExcelProps {
  onNavigate: (page: PageId) => void;
  onImportComplete: () => void;
}

const HEADER_MAP: Record<string, string[]> = {
  team_name: [
    'team name', 'team', 'team_name', 'squad name', 'squad', 'teamname', 'squad_name', 'teams', 'team_title'
  ],
  captain_name: [
    'captain name', 'captain', 'leader', 'captain_name', 'leader name', 'leader_name', 'igl', 'player 1', 'player1', 'name'
  ],
  captain_phone: [
    'captain phone number', 'captain phone', 'phone number', 'phone', 'mobile number', 
    'mobile', 'contact', 'whatsapp', 'captain mobile', 'captain_phone'
  ],
  captain_discord_id: [
    'captain discord user id', 'captain discord id', 'discord user id', 'discord id', 
    'discord uid', 'captain discord', 'discord_id', 'discord_user_id', 'discord',
    'discord username', 'captain discord username', 'discord tag', 'discord handle',
    'discord name', 'discord_username', 'username', 'captain discord name', 'discord user'
  ]
};

export const ImportExcel: React.FC<ImportExcelProps> = ({ onNavigate, onImportComplete }) => {
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [currentDbCount, setCurrentDbCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDbCount = async () => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.getAllTeams) {
        const res = await api.getAllTeams();
        if (res.success && res.data) {
          setCurrentDbCount(res.data.length);
        }
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchDbCount();
    const handleTeamsUpdated = () => fetchDbCount();
    window.addEventListener('teams-updated', handleTeamsUpdated);
    return () => window.removeEventListener('teams-updated', handleTeamsUpdated);
  }, []);

  // Auto-dismiss the status message after exactly 2 seconds
  React.useEffect(() => {
    if (!importStatusMessage) return;
    const timer = setTimeout(() => {
      setImportStatusMessage(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [importStatusMessage]);

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear all teams from the database? This will remove all existing teams so you can re-import cleanly.')) return;
    try {
      const api = (window as any).electronAPI;
      if (api && api.clearAllTeams) {
        await api.clearAllTeams();
        setCurrentDbCount(0);
        setPreview(null);
        setImportStatusMessage('Database cleared.');
        window.dispatchEvent(new Event('teams-updated'));
        onImportComplete();
      }
    } catch (e: any) {
      alert(`Failed to clear database: ${e.message}`);
    }
  };

  // Trigger file selection
  const handleOpenFileDialog = async () => {
    try {
      const api = (window as any).electronAPI;
      if (api && api.openAndPreviewExcel) {
        const res = await api.openAndPreviewExcel();
        if (res.success && res.data) {
          setPreview(res.data.preview);
          setFilePath(res.data.filePath);
          // Auto-commit right away so all other pages get the data!
          await commitTeams(res.data.preview.rows || []);
          return;
        }
      }
    } catch {}

    // HTML5 file input fallback
    fileInputRef.current?.click();
  };

  // Commit teams to database / storage so all pages have access immediately
  const commitTeams = async (rowsToCommit: ExcelImportRow[]) => {
    if (!rowsToCommit || rowsToCommit.length === 0) {
      alert('The uploaded Excel file contained 0 valid rows.');
      return;
    }
    setIsImporting(true);
    try {
      const api = (window as any).electronAPI;
      if (api && api.commitExcelImport) {
        const res = await api.commitExcelImport(rowsToCommit, 'replace');
        if (res.success) {
          const count = res.data?.insertedCount ?? res.data?.inserted ?? rowsToCommit.length;
          setImportedCount(count);
          setImportStatusMessage(`Imported ${count} teams!`);
          onImportComplete();
          window.dispatchEvent(new Event('teams-updated'));
        } else {
          alert(`Import failed: ${res.error}`);
        }
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Parse file selected via HTML5 input
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilePath(file.name);
    setIsImporting(true);
    setImportStatusMessage(null);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('No sheets found in workbook.');

        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
        if (!rawData || rawData.length === 0) throw new Error('Uploaded Excel file is empty.');

        // Dynamically find the header row in the first 5 rows
        let headerRowIndex = 0;
        let colToField: Record<number, string> = {};

        for (let r = 0; r < Math.min(rawData.length, 5); r++) {
          const candidateHeaders = (rawData[r] as any[] || []).map(h => String(h || '').trim());
          const candidateMap: Record<number, string> = {};
          candidateHeaders.forEach((h, idx) => {
            if (!h) return;
            const norm = h.toLowerCase().trim().replace(/[\-_/\\()]/g, ' ').replace(/\s+/g, ' ');
            for (const [field, aliases] of Object.entries(HEADER_MAP)) {
              if (aliases.includes(norm)) {
                candidateMap[idx] = field;
                break;
              }
            }
            if (!candidateMap[idx]) {
              if (norm.includes('discord')) candidateMap[idx] = 'captain_discord_id';
              else if (norm.includes('team') || norm.includes('squad')) candidateMap[idx] = 'team_name';
              else if (norm.includes('captain') || norm.includes('leader') || norm.includes('igl')) {
                if (norm.includes('phone') || norm.includes('mobile') || norm.includes('whatsapp') || norm.includes('contact')) candidateMap[idx] = 'captain_phone';
                else candidateMap[idx] = 'captain_name';
              }
              else if (norm.includes('phone') || norm.includes('mobile') || norm.includes('whatsapp')) candidateMap[idx] = 'captain_phone';
            }
          });
          if (Object.keys(candidateMap).length >= 1) {
            headerRowIndex = r;
            colToField = candidateMap;
            break;
          }
        }

        // If no headers matched at all, default columns by position
        if (Object.keys(colToField).length === 0) {
          colToField[0] = 'team_name';
          colToField[1] = 'captain_name';
          colToField[2] = 'captain_discord_id';
          headerRowIndex = -1; // Data starts at row 0
        }

        const seenNames = new Set<string>();
        const rows: ExcelImportRow[] = [];
        let validCount = 0;
        let dupCount = 0;

        const startRow = headerRowIndex + 1;
        for (let r = startRow; r < rawData.length; r++) {
          const rowArr = rawData[r] as any[];
          if (!rowArr || rowArr.length === 0 || rowArr.every(c => c === undefined || c === null || String(c).trim() === '')) {
            continue;
          }

          const rowObj: any = {
            rowIndex: r + 1,
            team_name: '',
            captain_name: '',
            captain_discord_id: '',
            captain_phone: '',
            extra_columns: {},
            validationErrors: [],
            isValid: true,
            isDuplicateInFile: false,
            isDuplicateInDb: false
          };

          Object.entries(colToField).forEach(([idxStr, field]) => {
            const idx = parseInt(idxStr, 10);
            let val = '';
            if (rowArr[idx] !== undefined && rowArr[idx] !== null) {
              if (typeof rowArr[idx] === 'number' && rowArr[idx] > 1e16) {
                val = BigInt(Math.round(rowArr[idx])).toString();
              } else {
                val = String(rowArr[idx]).trim();
              }
            }
            rowObj[field] = val;
          });

          // Check if Discord was placed in an unmapped cell
          if (!rowObj.captain_discord_id) {
            rowArr.forEach((cellVal) => {
              let str = '';
              if (typeof cellVal === 'number' && cellVal > 1e16) {
                str = BigInt(Math.round(cellVal)).toString();
              } else {
                str = String(cellVal || '').trim();
              }
              if (str.startsWith('@') || /^\d{17,20}$/.test(str) || /^.+#[0-9]{4}$/.test(str)) {
                rowObj.captain_discord_id = str;
              }
            });
          }

          // Smart auto-fill so valid but incomplete rows are preserved
          let cleanCapt = (rowObj.captain_name || '').trim();
          let cleanTeam = (rowObj.team_name || '').trim();
          const cleanDiscord = (rowObj.captain_discord_id || '').trim();

          // Skip phantom/ghost rows that have no team name, no captain name, and no discord ID
          if (!cleanTeam && !cleanCapt && !cleanDiscord) {
            continue;
          }

          if (!cleanCapt && cleanTeam) cleanCapt = cleanTeam;
          if (!cleanTeam && cleanCapt) cleanTeam = `${cleanCapt}'s Squad`;
          if (!cleanTeam && !cleanCapt && cleanDiscord) {
            cleanTeam = `Squad ${cleanDiscord}`;
            cleanCapt = `Captain ${cleanDiscord}`;
          }

          rowObj.team_name = cleanTeam;
          rowObj.captain_name = cleanCapt;

          // Clean Discord ID or Username
          if (rowObj.captain_discord_id) {
            let idStr = String(rowObj.captain_discord_id).trim();
            if (/^\d+(\.\d+)?e\+\d+$/i.test(idStr)) {
              try {
                idStr = BigInt(Math.round(Number(idStr))).toString();
              } catch {}
            }
            if (idStr.startsWith('@')) idStr = idStr.slice(1).trim();
            rowObj.captain_discord_id = idStr;
          }

          const normTeam = cleanTeam.toLowerCase();
          if (seenNames.has(normTeam)) {
            rowObj.isDuplicateInFile = true;
            dupCount++;
          } else {
            seenNames.add(normTeam);
          }

          rowObj.isValid = true;
          validCount++;
          rows.push(rowObj);
        }

        setPreview({
          totalRows: rows.length,
          validRows: validCount,
          invalidRows: 0,
          duplicateRows: dupCount,
          detectedHeaders: colToField,
          rows
        });

        // Automatically commit into database right away so all pages have the data!
        await commitTeams(rows);
      } catch (err: any) {
        alert(`Failed to parse Excel file: ${err.message}`);
        setIsImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };



  const filteredRows = preview?.rows.filter(row => {
    const matchesSearch = 
      row.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.captain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.captain_discord_id && row.captain_discord_id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'valid') return row.isValid;
    if (filterType === 'duplicate') return row.isDuplicateInFile || row.isDuplicateInDb;
    return true;
  }) || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="text-emerald-400 w-7 h-7" />
            Import Master Excel
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenFileDialog}
            disabled={isImporting}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload size={16} />}
            <span>{isImporting ? 'Importing File...' : 'Import File'}</span>
          </button>
        </div>
      </div>

      {/* Database Status Banner */}
      {currentDbCount !== null && currentDbCount > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Currently registered teams in database: <strong className="text-white font-mono text-sm">{currentDbCount.toLocaleString()}</strong></span>
            <span className="text-slate-500 hidden sm:inline">• Re-uploading Excel will replace active roster cleanly</span>
          </div>
          <button
            onClick={handleClearDatabase}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Existing Teams</span>
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {importStatusMessage && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/50 border border-emerald-500/40 shadow-xl text-slate-200 animate-fadeIn flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-emerald-300 font-semibold text-sm">
            <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            <span>{importStatusMessage}</span>
          </div>
          <button
            onClick={() => setImportStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      {!preview && (
        <div 
          onClick={handleOpenFileDialog}
          className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-12 text-center transition-all cursor-pointer bg-[#121622]/60 hover:bg-[#121622] group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Import File (.xlsx, .xls, .csv)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Upload your sheet with up to 2,000+ teams. All teams are automatically imported into the single master database for the Spin Wheel and Discord Bot.
          </p>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="space-y-4">

          {/* Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search imported team, captain, or Discord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#121622] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 sticky top-0 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Team Name</th>
                    <th className="py-3 px-4">Captain Name</th>
                    <th className="py-3 px-4">Discord Username / ID</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRows.map((row, idx) => (
                    <tr key={row.rowIndex} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {row.team_name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {row.captain_name}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-indigo-300">
                        {row.captain_discord_id || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Check size={14} /> Active in System
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
