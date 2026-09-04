import { useApp } from '@/store/AppContext';
import { EmptyState } from '@/components/States';
import { formatINR } from '@/lib/analytics';
import { ScrollText, CheckCircle2, XCircle, Clock, ShieldCheck, Activity, AlertCircle } from 'lucide-react';
import type { AuditEvent } from '@/types';

const STATUS_CONFIG: Record<AuditEvent['executionStatus'], { icon: typeof CheckCircle2; color: string; bg: string }> = {
  detected: { icon: AlertCircle, color: 'text-warning-400', bg: 'bg-warning-500/10' },
  investigated: { icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  recommended: { icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  awaiting_approval: { icon: Clock, color: 'text-warning-400', bg: 'bg-warning-500/10' },
  approved: { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-500/10' },
  rejected: { icon: XCircle, color: 'text-ink-300', bg: 'bg-white/5' },
  executed: { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-500/10' },
  failed: { icon: XCircle, color: 'text-danger-400', bg: 'bg-danger-500/10' },
  dismissed: { icon: XCircle, color: 'text-ink-300', bg: 'bg-white/5' },
};

export function AuditPage() {
  const { auditTrail } = useApp();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Audit Trail</h1>
        <p className="text-sm text-ink-300 mt-1">Complete record of AI decisions, approvals, and executions</p>
      </div>

      {auditTrail.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events yet"
          message="When MerchantOS detects anomalies and you approve actions, the complete chain of events — detection, investigation, recommendation, approval, execution, and result — will be recorded here."
        />
      ) : (
        <div className="glass rounded-2xl p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-white/10 to-transparent" />

            <div className="space-y-1">
              {auditTrail.map((event) => {
                const sc = STATUS_CONFIG[event.executionStatus];
                const Icon = sc.icon;
                return (
                  <div key={event.id} className="relative flex gap-4 py-4 animate-fade-in">
                    {/* Node */}
                    <div className={`relative z-10 w-10 h-10 rounded-full ${sc.bg} border border-white/10 flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={sc.color} strokeWidth={2} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{event.event}</h3>
                        <span className="text-xs text-ink-300 shrink-0">
                          {new Date(event.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                      <p className="text-xs text-ink-300 mb-2">{event.aiDecision}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/3 border border-white/8">
                          <span className={`text-[10px] uppercase tracking-wider font-semibold ${sc.color}`}>{event.executionStatus}</span>
                        </div>
                        <span className="text-xs text-ink-300 truncate">{event.evidence}</span>
                      </div>
                      {event.approvedBy && (
                        <div className="text-[10px] text-ink-300 mt-1.5">Approved by: <span className="text-white font-medium">{event.approvedBy}</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
