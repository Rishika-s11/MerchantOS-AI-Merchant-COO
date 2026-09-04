import { CheckCircle2, XCircle, Loader2, ShieldCheck, Clock } from 'lucide-react';
import type { ActionStatus } from '@/types';

interface AIStatusProps {
  state: 'analyzing' | 'complete' | 'gated' | 'executing' | 'executed' | 'failed' | 'live' | 'monitoring';
  label?: string;
}

export function AIStatus({ state, label }: AIStatusProps) {
  const config = {
    analyzing: { dot: 'status-dot-analyzing', icon: Loader2, text: 'ANALYZING', color: 'text-violet-400', spin: true },
    complete: { dot: 'bg-success-400', icon: CheckCircle2, text: 'ANALYSIS COMPLETE', color: 'text-success-400', spin: false },
    gated: { dot: 'bg-warning-400', icon: ShieldCheck, text: 'MERCHANT APPROVAL REQUIRED', color: 'text-warning-400', spin: false },
    executing: { dot: 'status-dot-analyzing', icon: Loader2, text: 'EXECUTING', color: 'text-violet-400', spin: true },
    executed: { dot: 'bg-success-400', icon: CheckCircle2, text: 'EXECUTED', color: 'text-success-400', spin: false },
    failed: { dot: 'bg-danger-400', icon: XCircle, text: 'EXECUTION FAILED', color: 'text-danger-400', spin: false },
    live: { dot: 'status-dot-live', icon: undefined, text: 'LIVE', color: 'text-success-400', spin: false },
    monitoring: { dot: 'status-dot-live', icon: undefined, text: 'MONITORING', color: 'text-success-400', spin: false },
  };

  const c = config[state];
  const Icon = c.icon;

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`status-dot ${c.dot}`} />
      {Icon && <Icon size={12} className={`${c.color} ${c.spin ? 'animate-spin' : ''}`} strokeWidth={2.5} />}
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${c.color}`}>
        {label || c.text}
      </span>
    </div>
  );
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const map: Record<ActionStatus, { label: string; classes: string; icon: typeof Clock }> = {
    pending: { label: 'Pending Approval', classes: 'bg-warning-500/15 text-warning-400 border-warning-500/30', icon: Clock },
    approved: { label: 'Approved', classes: 'bg-violet-500/15 text-violet-400 border-violet-500/30', icon: CheckCircle2 },
    rejected: { label: 'Rejected', classes: 'bg-ink-500/30 text-ink-300 border-white/10', icon: XCircle },
    executing: { label: 'Executing', classes: 'bg-violet-500/15 text-violet-400 border-violet-500/30', icon: Loader2 },
    executed: { label: 'Executed', classes: 'bg-success-500/15 text-success-400 border-success-500/30', icon: CheckCircle2 },
    failed: { label: 'Failed', classes: 'bg-danger-500/15 text-danger-400 border-danger-500/30', icon: XCircle },
  };
  const c = map[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${c.classes}`}>
      <Icon size={12} className={status === 'executing' ? 'animate-spin' : ''} strokeWidth={2} />
      {c.label}
    </span>
  );
}
