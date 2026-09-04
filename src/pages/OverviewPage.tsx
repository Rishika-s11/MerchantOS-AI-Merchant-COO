import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { HealthScore } from '@/components/HealthScore';
import { MetricCard } from '@/components/MetricCard';
import { AlertCard } from '@/components/AlertCard';
import { InsightCard } from '@/components/InsightCard';
import { AIStatus } from '@/components/AIStatus';
import { RevenueChart, PaymentMethodChart, TimeRangeSelector } from '@/components/Charts';
import { formatINR, formatINRFull } from '@/lib/analytics';
import { getScenarioConfig } from '@/data/dataset';
import {
  TrendingUp, CreditCard, CheckCircle2, RotateCcw, Wallet,
  Sparkles, ChevronRight, Activity, AlertTriangle, Users,
} from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

export function OverviewPage({ onNavigate, onInvestigate }: { onNavigate: (p: PageId) => void; onInvestigate: (alertId: string) => void }) {
  const { dashboard, scenario, alerts } = useApp();
  const insights = dashboard.insights;
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'transactions' | 'successRate'>('revenue');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const chartData = useMemo(() => {
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return dashboard.revenueSeries.slice(-days);
  }, [dashboard.revenueSeries, timeRange]);

  const healthSegments = [
    { label: 'Payments', value: dashboard.health.payments },
    { label: 'Revenue', value: dashboard.health.revenue },
    { label: 'Settlements', value: dashboard.health.settlements },
    { label: 'Customers', value: dashboard.health.customers },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{greeting}, {dashboard.merchant.name}.</h1>
        <p className="text-sm text-ink-300 mt-1">
          {activeAlerts.length > 0
            ? `Your business is operating, but I found ${activeAlerts.length} signal${activeAlerts.length > 1 ? 's' : ''} worth reviewing.`
            : 'Your business is operating normally. No signals require attention.'}
        </p>
      </div>

      {/* AI Command Center Hero */}
      <div className="relative gradient-border rounded-2xl overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute inset-0 grid-texture opacity-30" />
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: AI panel */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-violet-500/30 blur-lg -z-10" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">MerchantOS Intelligence</div>
                  <AIStatus state={activeAlerts.length > 0 ? 'complete' : 'monitoring'} />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                Your business is{' '}
                <span className="gradient-text">{dashboard.health.overall.toFixed(1)}% healthy.</span>
              </h2>
              <p className="text-sm text-ink-300 mb-5">
                {activeAlerts.length > 0
                  ? `${activeAlerts.length} signal${activeAlerts.length > 1 ? 's require' : ' requires'} your attention.`
                  : 'All systems operating within normal parameters.'}
              </p>

              {/* Signal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => onInvestigate(alert.id)}
                    className="glass glass-hover rounded-xl p-4 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`status-dot ${
                        alert.severity === 'critical' ? 'bg-danger-500' : alert.severity === 'warning' ? 'bg-warning-500' : 'bg-indigo-500'
                      }`} />
                      <span className="text-xs font-medium text-white">{alert.title}</span>
                    </div>
                    {alert.impact > 0 && (
                      <div className="text-sm font-bold text-danger-400">{formatINR(alert.impact)} potential impact</div>
                    )}
                    {alert.impact === 0 && (
                      <div className="text-sm font-bold text-ink-300">{alert.metric}</div>
                    )}
                  </button>
                ))}
                {activeAlerts.length === 0 && (
                  <div className="glass rounded-xl p-4 col-span-full flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success-400" />
                    <span className="text-sm text-ink-300">All metrics within normal range. No action required.</span>
                  </div>
                )}
              </div>

              {activeAlerts.length > 0 && (
                <button
                  onClick={() => onNavigate('alerts')}
                  className="btn-primary mt-5 px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
                >
                  Review signals
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Right: Health score */}
            <div className="lg:w-72 shrink-0 flex flex-col items-center justify-center">
              <HealthScore score={dashboard.health.overall} segments={healthSegments} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="GMV"
          value={dashboard.kpis.gmv}
          format={(n) => formatINR(n)}
          icon={TrendingUp}
          change={dashboard.kpis.gmvChange}
          accent="violet"
        />
        <MetricCard
          label="Successful Payments"
          value={dashboard.kpis.successfulPayments}
          format={(n) => Math.round(n).toLocaleString('en-IN')}
          icon={CheckCircle2}
          accent="success"
        />
        <MetricCard
          label="Payment Success Rate"
          value={dashboard.kpis.paymentSuccessRate}
          format={(n) => `${n.toFixed(1)}%`}
          icon={CreditCard}
          change={dashboard.kpis.successRateChange}
          accent="cyan"
        />
        <MetricCard
          label="Refunds"
          value={dashboard.kpis.refunds}
          format={(n) => formatINR(n)}
          icon={RotateCcw}
          accent="warning"
        />
        <MetricCard
          label="Expected Settlement"
          value={dashboard.kpis.expectedSettlement}
          format={(n) => formatINR(n)}
          icon={Wallet}
          accent="violet"
        />
      </div>

      {/* Revenue Analytics */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Revenue Analytics</h2>
            <p className="text-xs text-ink-300 mt-0.5">Real-time transaction performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/8">
              {(['revenue', 'transactions', 'successRate'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                    chartMetric === m ? 'bg-violet-500/30 text-violet-300' : 'text-ink-300 hover:text-white'
                  }`}
                >
                  {m === 'successRate' ? 'Success Rate' : m}
                </button>
              ))}
            </div>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>
        <RevenueChart data={chartData} metric={chartMetric} />
      </div>

      {/* Payment Method + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment method breakdown */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Payment Method Performance</h2>
          </div>
          <p className="text-xs text-ink-300 mb-4">Success rate by payment method</p>
          <PaymentMethodChart data={dashboard.paymentMethodBreakdown} />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {dashboard.paymentMethodBreakdown.map((m) => (
              <div key={m.method} className="text-center">
                <div className="text-xs font-semibold text-white">{m.method}</div>
                <div className="text-[11px] text-ink-300">{m.count} txns</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-violet-400" />
            <h2 className="text-base font-semibold text-white">AI Business Insights</h2>
          </div>
          <p className="text-xs text-ink-300 mb-4">Generated from your operational data</p>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {insights.slice(0, 4).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </div>

      {/* Active alerts preview */}
      {activeAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Active Signals</h2>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-violet-400 hover:text-violet-300">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} onInvestigate={onInvestigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
