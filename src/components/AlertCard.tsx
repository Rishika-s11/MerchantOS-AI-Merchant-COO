import type { Alert } from '@/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { ChevronRight, Clock } from 'lucide-react';
import { formatINR } from '@/lib/analytics';

interface AlertCardProps {
  alert: Alert;
  onInvestigate?: (alertId: string) => void;
  compact?: boolean;
}

export function AlertCard({ alert, onInvestigate, compact }: AlertCardProps) {
  const timeStr = new Date(alert.detectedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="glass glass-hover rounded-xl p-4 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <SeverityBadge severity={alert.severity} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">{alert.category}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-300">
          <Clock size={11} />
          {timeStr}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-white mb-2">{alert.title}</h3>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-300">Metric</div>
          <div className="text-sm font-medium text-white">{alert.metric}</div>
        </div>
        {alert.impact > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-300">Impact</div>
            <div className="text-sm font-medium text-danger-400">{formatINR(alert.impact)}</div>
          </div>
        )}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-300">Confidence</div>
          <div className="text-sm font-medium text-violet-400">{alert.confidence}%</div>
        </div>
      </div>

      {!compact && alert.evidence.length > 0 && (
        <div className="mb-3 space-y-1">
          {alert.evidence.slice(0, 2).map((ev, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-ink-300">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>{ev}</span>
            </div>
          ))}
        </div>
      )}

      {onInvestigate && (
        <button
          onClick={() => onInvestigate(alert.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors group"
        >
          Investigate
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
