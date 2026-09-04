import { useApp } from '@/store/AppContext';
import type { DemoScenarioId } from '@/types';
import { getScenarioConfig } from '@/data/dataset';
import {
  LayoutDashboard, Bell, Search, Users, Lightbulb, ShieldCheck,
  ScrollText, Settings, Sparkles, ChevronRight, Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PageId =
  | 'overview' | 'alerts' | 'investigations' | 'transactions'
  | 'customers' | 'insights' | 'actions' | 'audit' | 'ai' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'investigations', label: 'Investigations', icon: Search },
  { id: 'transactions', label: 'Transactions', icon: Activity },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'actions', label: 'Actions', icon: ShieldCheck },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
  { id: 'ai', label: 'Ask MerchantOS', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activePage, onNavigate }: { activePage: PageId; onNavigate: (p: PageId) => void }) {
  const { dashboard, scenario, alerts, actions } = useApp();
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const pendingActions = actions.filter(a => a.status === 'pending').length;

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-ink-950/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-lg bg-violet-500/30 blur-md -z-10" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">MerchantOS</div>
            <div className="text-[10px] text-ink-300 uppercase tracking-wider">AI Merchant COO</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const badge = item.id === 'alerts' ? activeAlerts : item.id === 'actions' ? pendingActions : 0;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-white border border-violet-500/20'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon
                size={17}
                strokeWidth={2}
                className={isActive ? 'text-violet-400' : ''}
              />
              <span className="font-medium">{item.label}</span>
              {badge > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-danger-500/20 text-danger-400">
                  {badge}
                </span>
              )}
              {isActive && badge === 0 && (
                <ChevronRight size={14} className="ml-auto text-violet-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Merchant profile */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
              UC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{dashboard.merchant.name}</div>
              <div className="flex items-center gap-1">
                <span className="status-dot status-dot-live" />
                <span className="text-[10px] uppercase tracking-wider text-success-400 font-semibold">Test Mode</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-ink-300">Scenario</div>
            <div className="text-xs font-medium text-violet-400">{getScenarioConfig(scenario).label}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
