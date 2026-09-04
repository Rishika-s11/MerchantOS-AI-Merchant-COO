import { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { SeverityBadge } from '@/components/SeverityBadge';
import { EvidenceCard } from '@/components/EvidenceCard';
import { AIStatus, ActionStatusBadge } from '@/components/AIStatus';
import { SuccessRateChart } from '@/components/Charts';
import { formatINR, formatINRFull } from '@/lib/analytics';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Loader2,
  ChevronRight, AlertTriangle, Activity, TrendingDown, Lightbulb,
  RotateCcw, X,
} from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

export function InvestigationPage({
  investigationId,
  onNavigate,
}: {
  investigationId: string | null;
  onNavigate: (p: PageId) => void;
}) {
  const { investigations, actions, approveAction, rejectAction, retryAction, startInvestigation, alerts } = useApp();

  // If no investigationId, show list of investigations
  if (!investigationId) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Investigations</h1>
          <p className="text-sm text-ink-300 mt-1">AI-driven diagnostic workflows for detected anomalies</p>
        </div>

        {investigations.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Search size={28} className="text-ink-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No active investigations</h3>
            <p className="text-sm text-ink-300 max-w-md mx-auto mb-4">
              When MerchantOS detects an anomaly, you can start an investigation to see the full diagnostic workflow:
              what changed, the evidence, AI finding, impact, and recommended action.
            </p>
            {alerts.filter(a => a.status === 'active').length > 0 && (
              <div className="space-y-2 max-w-sm mx-auto">
                {alerts.filter(a => a.status === 'active').map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => startInvestigation(alert.id)}
                    className="btn-ghost w-full px-4 py-3 rounded-lg text-sm flex items-center justify-between"
                  >
                    <span>Investigate: {alert.title}</span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onNavigate('investigations')}
                className="glass glass-hover rounded-xl p-4 w-full text-left transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inv.severity} />
                    <span className="text-sm font-semibold text-white">{inv.title}</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <p className="text-xs text-ink-300">{inv.aiFinding}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const investigation = investigations.find((i) => i.id === investigationId);
  if (!investigation) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-ink-300">Investigation not found.</p>
        <button onClick={() => onNavigate('alerts')} className="btn-ghost mt-4 px-4 py-2 rounded-lg text-sm">
          Back to Alerts
        </button>
      </div>
    );
  }

  const action = actions.find((a) => a.investigationId === investigationId);

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <SeverityBadge severity={investigation.severity} />
          <span className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Critical Signal</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{investigation.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <AIStatus state="complete" />
        </div>
      </div>

      {/* Diagnostic Workflow Timeline */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Diagnostic Workflow</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {investigation.steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                step.status === 'complete'
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                  : 'bg-white/5 text-ink-300 border border-white/8'
              }`}>
                {step.status === 'complete' ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-ink-300" />
                )}
                <span className="font-medium">{step.label}</span>
              </div>
              {i < investigation.steps.length - 1 && (
                <ChevronRight size={14} className="text-ink-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What Changed */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={16} className="text-danger-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">What Changed</h2>
        </div>
        <div className="flex items-center gap-6 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-300">Before</div>
            <div className="text-3xl font-bold text-white">{investigation.whatChanged.before}</div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          <ChevronRight size={24} className="text-danger-400" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-300">After</div>
            <div className="text-3xl font-bold text-danger-400">{investigation.whatChanged.after}</div>
          </div>
        </div>
        {investigation.whatChanged.chartData.length > 0 && (
          <div>
            <div className="text-xs text-ink-300 mb-2">Payment success rate — last 24 hours</div>
            <SuccessRateChart data={investigation.whatChanged.chartData} />
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-warning-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Evidence</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {investigation.evidence.map((card, i) => (
            <EvidenceCard key={i} card={card} />
          ))}
        </div>
      </div>

      {/* AI Finding */}
      <div className="relative gradient-border rounded-2xl overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Lightbulb size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">AI Finding</div>
              <AIStatus state="complete" />
            </div>
          </div>
          <p className="text-base text-white leading-relaxed mb-4">{investigation.aiFinding}</p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Confidence</div>
              <div className="text-lg font-bold text-violet-400">{investigation.confidence}%</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Evidence Points</div>
              <div className="text-lg font-bold text-white">{investigation.evidence.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Estimated Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Potential Impact</div>
            <div className="text-2xl font-bold text-danger-400">{formatINR(investigation.impact.amount)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Affected Transactions</div>
            <div className="text-2xl font-bold text-white">{investigation.impact.affectedTransactions}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Time Window</div>
            <div className="text-2xl font-bold text-white">{investigation.impact.timeWindow}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Confidence</div>
            <div className="text-2xl font-bold text-violet-400">{investigation.impact.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Recommended Action</h2>
        </div>
        <p className="text-base text-white mb-4">{investigation.recommendedAction.title}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Scope</div>
            <div className="text-sm font-medium text-white">{investigation.recommendedAction.scope}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Risk</div>
            <div className="text-sm font-medium text-success-400 capitalize">{investigation.recommendedAction.risk}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Financial Impact</div>
            <div className="text-sm font-medium text-white">{investigation.recommendedAction.financialImpact}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Approval</div>
            <div className="text-sm font-medium text-warning-400">Required</div>
          </div>
        </div>

        {/* Action Gated banner */}
        {action && action.status === 'pending' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-warning-500/10 border border-warning-500/20 mb-4">
            <ShieldAlert size={16} className="text-warning-400" />
            <span className="text-xs uppercase tracking-wider text-warning-400 font-semibold">Action Gated — Merchant approval required</span>
          </div>
        )}

        {/* Action buttons */}
        {action && (
          <div className="space-y-4">
            {action.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => approveAction(action.id)}
                  className="btn-primary px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  Approve Action
                </button>
                <button
                  onClick={() => rejectAction(action.id)}
                  className="btn-ghost px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            )}

            {action.status === 'executing' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Loader2 size={18} className="animate-spin text-violet-400" />
                <AIStatus state="executing" />
              </div>
            )}

            {action.status === 'executed' && action.executionResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success-500/10 border border-success-500/20">
                  <CheckCircle2 size={18} className="text-success-400" />
                  <div>
                    <AIStatus state="executed" />
                    <p className="text-xs text-ink-300 mt-1">{action.executionResult.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('audit')}
                  className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  View Audit Trail
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {action.status === 'failed' && action.executionResult && (
              <div className="space-y-3">
                <div className="px-4 py-4 rounded-lg bg-danger-500/10 border border-danger-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={18} className="text-danger-400" />
                    <AIStatus state="failed" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Action could not be completed.</h3>
                  <p className="text-xs text-ink-300 mb-3">{action.executionResult.detail || action.executionResult.message}</p>
                  <div className="text-xs text-ink-300 space-y-1">
                    <div><span className="text-ink-300">Attempted action:</span> <span className="text-white">{action.title}</span></div>
                    <div><span className="text-ink-300">Result:</span> <span className="text-success-400">Failed safely</span></div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => retryAction(action.id)}
                    className="btn-primary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Retry
                  </button>
                  <button
                    onClick={() => onNavigate('audit')}
                    className="btn-ghost px-5 py-2.5 rounded-lg text-sm"
                  >
                    View Audit Trail
                  </button>
                </div>
              </div>
            )}

            {action.status === 'rejected' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                <XCircle size={18} className="text-ink-300" />
                <span className="text-sm text-ink-300">Action rejected by merchant.</span>
              </div>
            )}

            {action.status !== 'pending' && action.status !== 'rejected' && (
              <div className="pt-2">
                <ActionStatusBadge status={action.status} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Need to import Search icon for the empty state
import { Search } from 'lucide-react';
