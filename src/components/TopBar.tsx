import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Search, Bell, Activity, X } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';
import { formatINR } from '@/lib/analytics';

export function TopBar({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { dashboard, alerts, transactions, customers } = useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeAlerts = alerts.filter(a => a.status === 'active');

  const searchResults = searchQuery.length > 1 ? [
    ...transactions
      .filter(t =>
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 4)
      .map(t => ({ type: 'Transaction', label: `${t.id} — ${t.customerName}`, sub: `${formatINR(t.amount)} · ${t.status}`, page: 'transactions' as PageId })),
    ...customers
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(c => ({ type: 'Customer', label: c.name, sub: `${formatINR(c.totalSpend)} · ${c.transactionCount} txns`, page: 'customers' as PageId })),
    ...alerts
      .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 2)
      .map(a => ({ type: 'Alert', label: a.title, sub: a.metric, page: 'alerts' as PageId })),
  ] : [];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3.5 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      {/* Merchant name + test mode */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold text-white">{dashboard.merchant.name}</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning-500/10 border border-warning-500/20">
          <span className="status-dot status-dot-live" />
          <span className="text-[10px] uppercase tracking-wider text-warning-400 font-semibold">Test Mode</span>
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        {showSearch ? (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setShowSearch(false);
              }}
              placeholder="Search transactions, customers, alerts..."
              className="input-field w-full pl-9 pr-9 py-2 rounded-lg text-sm"
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-white"
            >
              <X size={15} />
            </button>

            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full glass rounded-xl p-2 shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onNavigate(r.page);
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold w-20 shrink-0">{r.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{r.label}</div>
                      <div className="text-xs text-ink-300 truncate">{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-ink-300 hover:bg-white/5 hover:text-white transition-all"
          >
            <Search size={15} />
            <span className="text-sm">Search transactions, customers, alerts...</span>
          </button>
        )}
      </div>

      {/* AI status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <span className="status-dot status-dot-live" />
        <span className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">AI Monitoring</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell size={18} className="text-ink-300 hover:text-white" />
          {activeAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-500" />
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute top-full right-0 mt-2 w-80 glass rounded-xl p-3 shadow-xl z-50 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <span className="text-xs text-ink-300">{activeAlerts.length} new</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-6">
                    <Activity size={20} className="text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-300">No active alerts</p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => {
                        onNavigate('alerts');
                        setShowNotifs(false);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`status-dot ${
                          alert.severity === 'critical' ? 'bg-danger-500' : alert.severity === 'warning' ? 'bg-warning-500' : 'bg-indigo-500'
                        }`} />
                        <span className="text-xs font-medium text-white">{alert.title}</span>
                      </div>
                      <p className="text-xs text-ink-300 ml-4">{alert.metric}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          MA
        </div>
      </div>
    </header>
  );
}
