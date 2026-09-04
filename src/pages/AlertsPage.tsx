import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { AlertCard } from '@/components/AlertCard';
import { EmptyState } from '@/components/States';
import { Bell, CheckCircle2 } from 'lucide-react';
import type { Severity } from '@/types';

type Tab = 'all' | 'critical' | 'warning' | 'informational' | 'resolved';

export function AlertsPage({ onInvestigate }: { onInvestigate: (alertId: string) => void }) {
  const { alerts } = useApp();
  const [tab, setTab] = useState<Tab>('all');

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: alerts.length },
    { id: 'critical', label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length },
    { id: 'warning', label: 'Warning', count: alerts.filter(a => a.severity === 'warning').length },
    { id: 'informational', label: 'Informational', count: alerts.filter(a => a.severity === 'informational').length },
    { id: 'resolved', label: 'Resolved', count: 0 },
  ];

  const filtered = tab === 'all' ? alerts : tab === 'resolved' ? [] : alerts.filter(a => a.severity === tab as Severity);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
        <p className="text-sm text-ink-300 mt-1">Signals detected by MerchantOS from your operational data</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/8 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              tab === t.id ? 'bg-violet-500/30 text-violet-300' : 'text-ink-300 hover:text-white'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-violet-500/30' : 'bg-white/5'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'resolved' ? CheckCircle2 : Bell}
          title={tab === 'resolved' ? 'No resolved alerts' : 'No active alerts'}
          message={tab === 'resolved'
            ? 'Resolved alerts will appear here for your reference.'
            : 'Your merchant operations look healthy. No signals detected for this filter.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onInvestigate={onInvestigate} />
          ))}
        </div>
      )}
    </div>
  );
}
