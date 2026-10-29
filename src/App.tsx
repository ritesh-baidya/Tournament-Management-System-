import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ImportExcel } from './pages/ImportExcel';
import { AllTeams } from './pages/AllTeams';
import { TeamRosters } from './pages/TeamRosters';
import { RandomSpinWheelPage } from './pages/RandomSpinWheelPage';
import { SelectedTeams } from './pages/SelectedTeams';
import { DiscordNotifications } from './pages/DiscordNotifications';
import { MatchDetails } from './pages/MatchDetails';
import { CompleteMatch } from './pages/CompleteMatch';
import { DrawHistory } from './pages/DrawHistory';
import { MatchHistory } from './pages/MatchHistory';
import { ExcelExport } from './pages/ExcelExport';
import { Settings } from './pages/Settings';
import { DashboardStats, TournamentSettings } from './types';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [discordReady, setDiscordReady] = useState<boolean>(false);

  const fetchGlobalData = useCallback(async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [statsRes, settingsRes, discordRes] = await Promise.all([
        api.getDashboardStats(),
        api.getSettings(),
        api.getDiscordStatus()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
      if (discordRes.success) setDiscordReady(Boolean(discordRes.data?.isReady));
    } catch (err) {
      console.error('Error fetching global state:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    // Poll Discord connection status every 30 seconds
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'import-excel':
        return <ImportExcel onNavigate={setCurrentPage} onImportComplete={fetchGlobalData} />;
      case 'all-teams':
        return <AllTeams onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'team-rosters':
        return <TeamRosters onNavigate={setCurrentPage} />;
      case 'spin-wheel':
        return <RandomSpinWheelPage onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'selected-teams':
        return <SelectedTeams onNavigate={setCurrentPage} />;
      case 'discord-notifications':
        return <DiscordNotifications onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'match-details':
        return <MatchDetails onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'complete-match':
        return <CompleteMatch onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'draw-history':
        return <DrawHistory onNavigate={setCurrentPage} />;
      case 'match-history':
        return <MatchHistory onNavigate={setCurrentPage} />;
      case 'excel-export':
        return <ExcelExport onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'settings':
        return <Settings onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-slate-100 overflow-hidden font-sans">
      {/* Frameless Top Window Bar */}
      <Header
        tournamentName={settings?.tournament_name}
        eligibleCount={stats?.eligible_teams ?? 0}
        targetCount={settings?.selection_target ?? 12}
        onQuickAction={(action) => {
          if (action === 'new-draw') setCurrentPage('spin-wheel');
          if (action === 'export') setCurrentPage('excel-export');
        }}
      />

      {/* Main Workspace: Sidebar + Dynamic Page Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          eligibleCount={stats?.eligible_teams ?? 0}
          selectedCount={stats?.selected_teams ?? 0}
          discordReady={discordReady}
        />

        <main className="flex-1 bg-[#090C14] overflow-hidden relative">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
