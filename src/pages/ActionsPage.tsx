import { useApp } from '@/store/AppContext';
import { ActionStatusBadge } from '@/components/AIStatus';
import { EmptyState } from '@/components/States';
import { formatINR } from '@/lib/analytics';
import { ShieldCheck, ShieldAlert, CheckCircle2, X, RotateCcw, Loader2 } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

export function ActionsPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { actions, approveAction, rejectAction, retryAction, permissions } = useApp();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Actions</h1>
        <p className="text-sm text-ink-300 mt-1">Approval queue for AI-recommended bounded actions</p>
      </div>

      {/* Permission summary */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Action Permissions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(permissions) as [string, string][]).map(([key, val]) => (
            <div key={key} className="px-3 py-2 rounded-lg bg-white/3 border border-white/8">
              <div className="text-[10px] uppercase tracking-wide text-ink-300">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className={`text-xs font-semibold capitalize ${
                val === 'allowed' ? 'text-success-400' : val === 'approval_required' ? 'text-warning-400' : 'text-danger-400'
              }`}>
                {val.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions queue */}
      {actions.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending actions"
          message="When MerchantOS detects an anomaly and generates a recommendation, the action will appear here for your approval."
        />
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="glass rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{action.title}</h3>
                  <div className="text-xs text-ink-300 mt-0.5">{action.triggeredBy}</div>
                </div>
                <ActionStatusBadge status={action.status} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-300">Reason</div>
                  <div className="text-xs text-white">{action.reason}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-300">Scope</div>
                  <div className="text-xs text-white">{action.scope}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-300">Risk</div>
                  <div className="text-xs text-success-400 capitalize">{action.risk}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-300">Approval</div>
                  <div className="text-xs text-warning-400">{action.requiresApproval ? 'Required' : 'Not required'}</div>
                </div>
              </div>

              {/* Action gated banner */}
              {action.status === 'pending' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warning-500/10 border border-warning-500/20 mb-3">
                  <ShieldAlert size={14} className="text-warning-400" />
                  <span className="text-[10px] uppercase tracking-wider text-warning-400 font-semibold">Action Gated — Merchant approval required</span>
                </div>
              )}

              {/* Buttons */}
              {action.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => approveAction(action.id)} className="btn-primary px-5 py-2 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                  <button onClick={() => rejectAction(action.id)} className="btn-ghost px-5 py-2 rounded-lg text-sm flex items-center gap-2">
                    <X size={15} />
                    Reject
                  </button>
                </div>
              )}

              {action.status === 'executing' && (
                <div className="flex items-center gap-2 text-sm text-violet-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Executing...</span>
                </div>
              )}

              {action.status === 'executed' && action.executionResult && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success-500/10 border border-success-500/20">
                  <CheckCircle2 size={14} className="text-success-400" />
                  <span className="text-xs text-ink-300">{action.executionResult.message}</span>
                </div>
              )}

              {action.status === 'failed' && action.executionResult && (
                <div className="space-y-3">
                  <div className="px-4 py-2.5 rounded-lg bg-danger-500/10 border border-danger-500/20">
                    <span className="text-xs text-ink-300">{action.executionResult.detail || action.executionResult.message}</span>
                  </div>
                  <button onClick={() => retryAction(action.id)} className="btn-primary px-5 py-2 rounded-lg text-sm flex items-center gap-2">
                    <RotateCcw size={15} />
                    Retry
                  </button>
                </div>
              )}

              {action.status === 'rejected' && (
                <div className="text-xs text-ink-300">Action rejected by merchant.</div>
              )}

              {(action.status === 'executed' || action.status === 'failed') && (
                <button onClick={() => onNavigate('audit')} className="text-xs text-violet-400 hover:text-violet-300 mt-3">
                  View in Audit Trail →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
