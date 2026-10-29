import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, 
  Trash2, Edit2, Download, Search, RefreshCw, Check, X, ShieldAlert 
} from 'lucide-react';
import { ExcelImportPreview, ExcelImportRow } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface ImportExcelProps {
  onNavigate: (page: PageId) => void;
  onImportComplete: () => void;
}

export const ImportExcel: React.FC<ImportExcelProps> = ({ onNavigate, onImportComplete }) => {
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExcelImportRow>>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const handleOpenFileDialog = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const res = await api.openAndPreviewExcel();
      if (res.success && res.data) {
        setPreview(res.data.preview);
        setFilePath(res.data.filePath);
        setImportStatusMessage(null);
      }
    } catch (err: any) {
      alert(`Error opening Excel file: ${err.message}`);
    }
  };

  const handleDownloadSampleTemplate = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.downloadSampleTemplate();
      if (res.success && res.data?.filePath) {
        alert(`Sample template saved successfully to:\n${res.data.filePath}`);
      }
    } catch (err: any) {
      alert(`Failed to save template: ${err.message}`);
    }
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (!preview) return;
    const updatedRows = preview.rows.filter(r => r.rowIndex !== rowIndex);
    // Recalculate counts
    const validCount = updatedRows.filter(r => r.isValid).length;
    const invalidCount = updatedRows.filter(r => !r.isValid).length;
    const duplicateCount = updatedRows.filter(r => r.isDuplicateInFile || r.isDuplicateInDb).length;

    setPreview({
      ...preview,
      totalRows: updatedRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      rows: updatedRows
    });
  };

  const handleStartEdit = (row: ExcelImportRow) => {
    setEditingRowIndex(row.rowIndex);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = (rowIndex: number) => {
    if (!preview) return;
    const updatedRows = preview.rows.map(r => {
      if (r.rowIndex === rowIndex) {
        const teamName = (editFormData.team_name || '').trim();
        const captName = (editFormData.captain_name || '').trim();
        const errors: string[] = [];

        if (!teamName) errors.push('Missing Team Name');
        if (!captName) errors.push('Missing Captain Name');

        const discordId = editFormData.captain_discord_id?.trim();
        if (discordId && (!/^\d{17,20}$/.test(discordId))) {
          errors.push('Discord User ID must be 17-20 numeric digits');
        }

        return {
          ...r,
          ...editFormData,
          team_name: teamName,
          captain_name: captName,
          isValid: errors.length === 0,
          validationErrors: errors
        };
      }
      return r;
    });

    const validCount = updatedRows.filter(r => r.isValid).length;
    const invalidCount = updatedRows.filter(r => !r.isValid).length;

    setPreview({
      ...preview,
      validRows: validCount,
      invalidRows: invalidCount,
      rows: updatedRows
    });
    setEditingRowIndex(null);
  };

  const handleCommitImport = async () => {
    if (!preview || preview.rows.length === 0) return;
    setIsImporting(true);
    try {
      const api = (window as any).electronAPI;
      const validRowsToImport = preview.rows.filter(r => r.isValid);
      const res = await api.commitExcelImport(validRowsToImport);

      if (res.success) {
        setImportStatusMessage(`Successfully imported ${res.data.inserted} new teams and updated ${res.data.updated} existing rosters!`);
        onImportComplete();
        setTimeout(() => {
          onNavigate('all-teams');
        }, 1200);
      } else {
        alert(`Import failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const filteredRows = preview?.rows.filter(row => {
    const matchesSearch = 
      row.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.captain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.captain_phone && row.captain_phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (filterType === 'valid') return row.isValid;
    if (filterType === 'invalid') return !row.isValid;
    if (filterType === 'duplicate') return row.isDuplicateInFile || row.isDuplicateInDb;
    return true;
  }) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-400" size={26} />
            EXCEL ROSTER IMPORT & VALIDATION
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import .xlsx or .xls files with team names, captain contact, full 4-player rosters, substitutes, and custom columns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSampleTemplate}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download size={15} />
            Download Sample Template (.xlsx)
          </button>

          <button
            onClick={handleOpenFileDialog}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Upload size={16} />
            Browse & Preview Excel File
          </button>
        </div>
      </div>

      {importStatusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
          <span>{importStatusMessage}</span>
        </div>
      )}

      {/* No file chosen placeholder */}
      {!preview && (
        <div 
          onClick={handleOpenFileDialog}
          className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-12 text-center transition-all cursor-pointer bg-slate-900/30 hover:bg-slate-900/50 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Click to Select Registration Excel File</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Supports .xlsx and .xls workbooks. Column variations like "Team Name", "Leader", "Discord ID", "Player 2", "Substitute", and extra player columns are automatically mapped.
          </p>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="space-y-4">
          {/* File summary bar */}
          <div className="p-4 rounded-xl esports-card border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Loaded Workbook:</span>
              <div className="font-mono text-xs font-semibold text-emerald-400 truncate max-w-md">{filePath}</div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/5">
                <span className="text-slate-400 mr-2">Total Rows:</span>
                <span className="font-bold text-white font-mono">{preview.totalRows}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="mr-2">Valid:</span>
                <span className="font-bold font-mono">{preview.validRows}</span>
              </div>
              {preview.invalidRows > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <span className="mr-2">Invalid:</span>
                  <span className="font-bold font-mono">{preview.invalidRows}</span>
                </div>
              )}
              {preview.duplicateRows > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <span className="mr-2">Duplicates:</span>
                  <span className="font-bold font-mono">{preview.duplicateRows}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={preview.validRows === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Save {preview.validRows} Teams to Database</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams or captains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              {(['all', 'valid', 'invalid', 'duplicate'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    filterType === ft
                      ? 'bg-emerald-500 text-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl esports-card border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#090D17] text-slate-400 uppercase tracking-wider font-heading sticky top-0 z-10 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Team Name</th>
                    <th className="py-3 px-3">Captain Name</th>
                    <th className="py-3 px-3">Discord User ID</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Player 2</th>
                    <th className="py-3 px-3">Player 3</th>
                    <th className="py-3 px-3">Player 4</th>
                    <th className="py-3 px-3">Sub</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRows.map((row) => {
                    const isEditing = editingRowIndex === row.rowIndex;

                    return (
                      <tr 
                        key={row.rowIndex}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !row.isValid ? 'bg-rose-950/20' : row.isDuplicateInDb ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-slate-500">{row.rowIndex}</td>
                        <td className="py-3 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check size={10} /> Valid
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help"
                              title={row.validationErrors.join(', ')}
                            >
                              <X size={10} /> Invalid
                            </span>
                          )}
                          {row.isDuplicateInDb && (
                            <span className="ml-1 text-[9px] font-bold text-amber-400">(In DB)</span>
                          )}
                        </td>

                        {/* Team Name */}
                        <td className="py-3 px-3 font-semibold text-white">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.team_name || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, team_name: e.target.value })}
                              className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-xs text-white"
                            />
                          ) : (
                            row.team_name || <span className="text-rose-400 italic font-normal">Missing</span>
                          )}
                        </td>

                        {/* Captain Name */}
                        <td className="py-3 px-3 text-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.captain_name || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, captain_name: e.target.value })}
                              className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-xs text-white"
                            />
                          ) : (
                            row.captain_name || <span className="text-rose-400 italic">Missing</span>
                          )}
                        </td>

                        {/* Discord ID */}
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.captain_discord_id || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, captain_discord_id: e.target.value })}
                              className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-xs text-white font-mono"
                            />
                          ) : (
                            row.captain_discord_id || '—'
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 text-slate-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.captain_phone || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, captain_phone: e.target.value })}
                              className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-xs text-white"
                            />
                          ) : (
                            row.captain_phone || '—'
                          )}
                        </td>

                        {/* Roster players */}
                        <td className="py-3 px-3 text-slate-400">{row.player2_name || '—'}</td>
                        <td className="py-3 px-3 text-slate-400">{row.player3_name || '—'}</td>
                        <td className="py-3 px-3 text-slate-400">{row.player4_name || '—'}</td>
                        <td className="py-3 px-3 text-slate-400">{row.substitute_name || '—'}</td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveEdit(row.rowIndex)}
                                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                                title="Save Changes"
                              >
                                <Check size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Edit Row"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteRow(row.rowIndex)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Remove Row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Excel Team Import"
        message={`Are you sure you want to import ${preview?.validRows || 0} valid team registrations into the tournament database?\n\nExisting teams with matching names will have their rosters and contact info updated, while keeping historical match data intact.`}
        confirmText={isImporting ? 'Importing...' : 'Yes, Import Teams'}
        onConfirm={handleCommitImport}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
