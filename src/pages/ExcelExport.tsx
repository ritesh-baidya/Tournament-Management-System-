import React, { useState } from 'react';
import { 
  Download, FileSpreadsheet, Database, Upload, 
  CheckCircle2, ShieldCheck, HardDrive, RefreshCw 
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface ExcelExportProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const ExcelExport: React.FC<ExcelExportProps> = ({ 
  onNavigate, 
  onRefreshGlobalStats 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  const handleExportWorkbook = async () => {
    setIsExporting(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.exportTournamentWorkbook();
      if (res.success && res.data?.filePath) {
        setStatusMessage(`Successfully exported 5-Sheet Tournament Workbook to:\n${res.data.filePath}`);
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSampleTemplate = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.downloadSampleTemplate();
      if (res.success && res.data?.filePath) {
        setStatusMessage(`Sample 24-team template saved to:\n${res.data.filePath}`);
      }
    } catch (err: any) {
      alert(`Template download error: ${err.message}`);
    }
  };

  const handleBackupDatabase = async () => {
    setIsBackingUp(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.backupDatabase();
      if (res.success && res.data?.filePath) {
        setStatusMessage(`Full SQLite Database Backup saved to:\n${res.data.filePath}`);
      }
    } catch (err: any) {
      alert(`Backup error: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreDatabase = async () => {
    setIsRestoring(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      const res = await api.restoreDatabase();
      if (res.success && res.data?.filePath) {
        setStatusMessage(`Database successfully restored from:\n${res.data.filePath}`);
        onRefreshGlobalStats();
      }
    } catch (err: any) {
      alert(`Restore error: ${err.message}`);
    } finally {
      setIsRestoring(false);
      setIsConfirmRestoreOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-heading flex items-center gap-2">
            <Download className="text-emerald-400" size={26} />
            EXCEL EXPORT & DATABASE BACKUP
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export the official 5-sheet post-match tournament workbook, get clean registration templates, and perform full database backups.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span className="whitespace-pre-line font-mono">{statusMessage}</span>
        </div>
      )}

      {/* 5-Sheet Excel Workbook Card */}
      <div className="esports-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading tracking-wide">
                Updated 5-Sheet Tournament Workbook (.xlsx)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Contains complete tournament snapshot formatted across 5 distinct sheets with stable team UUIDs:
              </p>
            </div>
          </div>

          <button
            onClick={handleExportWorkbook}
            disabled={isExporting}
            className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <Download size={16} />
            <span>{isExporting ? 'Generating...' : 'Export 5-Sheet Workbook'}</span>
          </button>
        </div>

        {/* 5 Sheets Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block font-mono">Sheet 1</span>
            <div className="text-xs font-bold text-white">All Teams</div>
            <p className="text-[11px] text-slate-400 leading-tight">All rosters, contact info, and current statuses.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-teal-400 block font-mono">Sheet 2</span>
            <div className="text-xs font-bold text-white">Eligible Teams</div>
            <p className="text-[11px] text-slate-400 leading-tight">Exact pool available for the next spin wheel.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-purple-400 block font-mono">Sheet 3</span>
            <div className="text-xs font-bold text-white">Played Teams</div>
            <p className="text-[11px] text-slate-400 leading-tight">Played squads excluded from subsequent draws.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-blue-400 block font-mono">Sheet 4</span>
            <div className="text-xs font-bold text-white">Match History</div>
            <p className="text-[11px] text-slate-400 leading-tight">Matches, room IDs, and player participation notes.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-400 block font-mono">Sheet 5</span>
            <div className="text-xs font-bold text-white">Selected Teams</div>
            <p className="text-[11px] text-slate-400 leading-tight">Latest draw selections & Discord DM delivery states.</p>
          </div>
        </div>
      </div>

      {/* Two Grid Cards: Sample Template & Database Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Template */}
        <div className="esports-card rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Sample Registration Template
                </h3>
                <span className="text-xs text-slate-400">Pre-populated with 24 realistic Free Fire teams</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Download a ready-to-use Excel workbook configured with all columns: Team Name, Captain Name, Phone, Discord User ID, Player 2, Player 3, Player 4, Substitute, Coach, and Guild UID.
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-end">
            <button
              onClick={handleDownloadSampleTemplate}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download size={14} />
              Download Template (.xlsx)
            </button>
          </div>
        </div>

        {/* Database Backup & Restore */}
        <div className="esports-card rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  SQLite Database Backup & Restore
                </h3>
                <span className="text-xs text-slate-400">Authoritative Source of Truth</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Export the entire raw SQLite database (`tournament.db`) containing all relational tables, draws, matches, and audit logs. You can restore this backup on any machine.
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              onClick={() => setIsConfirmRestoreOpen(true)}
              disabled={isRestoring}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Upload size={14} />
              Restore Database
            </button>

            <button
              onClick={handleBackupDatabase}
              disabled={isBackingUp}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <HardDrive size={14} />
              Backup Database (.db)
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Restore Database */}
      <ConfirmationModal
        isOpen={isConfirmRestoreOpen}
        title="Restore SQLite Database from File"
        message="Restoring a database backup will replace all current tournament records with the contents of the backup file.\n\nAre you sure you want to proceed?"
        confirmText="Yes, Select File & Restore"
        isDanger={true}
        onConfirm={handleRestoreDatabase}
        onCancel={() => setIsConfirmRestoreOpen(false)}
      />
    </div>
  );
};
