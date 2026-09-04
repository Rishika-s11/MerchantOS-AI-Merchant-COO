import { useState } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { LoginPage } from '@/pages/LoginPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { InvestigationPage } from '@/pages/InvestigationPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { ActionsPage } from '@/pages/ActionsPage';
import { AuditPage } from '@/pages/AuditPage';
import { AIChatPage } from '@/pages/AIChatPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const { isAuthenticated, startInvestigation } = useApp();
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [investigationId, setInvestigationId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    if (page !== 'investigations') {
      setInvestigationId(null);
    }
  };

  const handleInvestigate = (alertId: string) => {
    const id = startInvestigation(alertId);
    if (id) {
      setInvestigationId(id);
      setActivePage('investigations');
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage onNavigate={handleNavigate} onInvestigate={handleInvestigate} />;
      case 'alerts':
        return <AlertsPage onInvestigate={handleInvestigate} />;
      case 'investigations':
        return <InvestigationPage investigationId={investigationId} onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'insights':
        return <InsightsPage />;
      case 'actions':
        return <ActionsPage onNavigate={handleNavigate} />;
      case 'audit':
        return <AuditPage />;
      case 'ai':
        return <AIChatPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={handleNavigate} onInvestigate={handleInvestigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-950 mesh-bg">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onNavigate={handleNavigate} />
        <main className="flex-1 p-6 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
