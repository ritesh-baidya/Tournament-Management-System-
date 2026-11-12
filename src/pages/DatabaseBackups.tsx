import React, { useEffect, useState } from 'react';
import { 
  Database, HardDriveDownload, HardDriveUpload, Trash2, 
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, Activity, FileSpreadsheet
} from 'lucide-react';
import { AuditLog } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PageId } from '../components/Sidebar';

interface DatabaseBackupsProps {
  onNavigate: (page: PageId) => void;
  onRefreshGlobalStats: () => void;
}

export const DatabaseBackups: React.FC<DatabaseBackupsProps> = ({ onNavigate, onRefreshGlobalStats }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.getAuditLogs) return;
      const res = await api.getAuditLogs();
      if (res.success && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setActionNotice(null);
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.backupDatabase) {
        alert('Backup function is not available.');
        return;
      }
      const res = await api.backupDatabase();
      if (res.success && !res.canceled) {
        setActionNotice({ text: 'Database backed up successfully!', type: 'success' });
        loadData();
      } else if (!res.canceled) {
        setActionNotice({ text: res.error || 'Backup failed.', type: 'error' });
      }
    } catch (err: any) {
      setActionNotice({ text: `Backup error: ${err.message}`, type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setActionNotice(null);
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.restoreDatabase) {
        alert('Restore function is not available.');
        return;
      }
      const res = await api.restoreDatabase();
      if (res.success && !res.canceled) {
        setActionNotice({ text: 'Database restored successfully!', type: 'success' });
        onRefreshGlobalStats();
        loadData();
      } else if (!res.canceled) {
        setActionNotice({ text: res.error || 'Restore failed.', type: 'error' });
      }
    } catch (err: any) {
      setActionNotice({ text: `Restore error: ${err.message}`, type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;
      await api.clearAllTeams();
      setShowClearModal(false);
      setActionNotice({ text: 'All teams, players, and logs cleared successfully.', type: 'success' });
      onRefreshGlobalStats();
      loadData();
    } catch (err: any) {
      alert(`Error clearing data: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090C14] text-slate-100 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-white/5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              System Health & Storage
            </span>
            <span className="text-xs text-slate-400">Local SQLite Storage</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
            <Database className="text-blue-400" size={26} />
            Database & Backups
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create snapshot backups of your tournament database, restore previous versions, and view audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 mb-6 animate-fadeIn ${
          actionNotice.type === 'success'
            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
        }`}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="font-medium">{actionNotice.text}</span>
        </div>
      )}

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <HardDriveDownload size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Backup Database</h3>
              <p className="text-[11px] text-slate-400">Save complete SQLite database file</p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/40"
          >
            {isBackingUp ? <RefreshCw size={14} className="animate-spin" /> : <HardDriveDownload size={14} />}
            <span>Create Backup (.db)</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <HardDriveUpload size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Restore Database</h3>
              <p className="text-[11px] text-slate-400">Load previously saved SQLite file</p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
          >
            {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <HardDriveUpload size={14} />}
            <span>Restore from File</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Database</h3>
              <p className="text-[11px] text-slate-400">Permanently clear teams and logs</p>
            </div>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="w-full py-2.5 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear Teams & Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#121624] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              SQLite Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of administrative actions, draws, imports, and system events.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events</span>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 divide-y divide-white/5 overflow-hidden">
          {auditLogs.length > 0 ? (
            auditLogs.slice(0, 30).map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-800 text-slate-300 shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-300 truncate">{log.details}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap shrink-0">
                  {new Date(log.timestamp).toLocaleString(undefined, { 
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit logs recorded in SQLite yet.
            </div>
          )}
        </div>
      </div>

      {/* Clear Database Modal */}
      <ConfirmationModal
        isOpen={showClearModal}
        title="Clear All Teams & Logs?"
        message="This will permanently delete all imported teams, players, and notification logs from the local database. This action cannot be undone."
        confirmLabel="Yes, Clear Everything"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearDatabase}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
