import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { RandomSpinWheelPage } from './pages/RandomSpinWheelPage';
import { AllTeams } from './pages/AllTeams';
import { MatchManagement } from './pages/MatchManagement';
import { MatchHistory } from './pages/MatchHistory';

import { DiscordNotifications } from './pages/DiscordNotifications';
import { DatabaseBackups } from './pages/DatabaseBackups';
import { Settings } from './pages/Settings';
import { TournamentSettings } from './types';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [discordReady, setDiscordReady] = useState<boolean>(false);

  const fetchGlobalData = useCallback(async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const [settingsRes, discordRes] = await Promise.all([
        api.getSettings(),
        api.getDiscordStatus()
      ]);

      if (settingsRes.success) setSettings(settingsRes.data);
      if (discordRes.success) setDiscordReady(Boolean(discordRes.data?.isReady));
    } catch (err) {
      console.error('Error fetching global state:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'random-spin-wheel':
        return <RandomSpinWheelPage onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'all-teams':
        return <AllTeams onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'match-management':
        return <MatchManagement onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'match-history':
        return <MatchHistory onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;

      case 'discord-notifications':
        return <DiscordNotifications onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'database-backups':
        return <DatabaseBackups onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      case 'settings':
        return <Settings onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} onRefreshGlobalStats={fetchGlobalData} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-slate-100 overflow-hidden font-sans">
      <Header tournamentName={settings?.tournament_name} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          discordReady={discordReady}
        />

        <main className="flex-1 bg-[#090C14] overflow-auto relative">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
