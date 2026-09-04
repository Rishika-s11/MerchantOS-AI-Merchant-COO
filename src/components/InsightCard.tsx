import type { Insight } from '@/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { formatINR } from '@/lib/analytics';

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="glass glass-hover rounded-xl p-5 transition-all duration-200 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">{insight.category}</span>
        <SeverityBadge severity={insight.severity} size="sm" />
      </div>

      <h3 className="text-sm font-semibold text-white mb-2">{insight.title}</h3>
      <p className="text-xs text-ink-300 mb-3 leading-relaxed">{insight.finding}</p>

      <div className="space-y-1.5 mb-3">
        <div className="text-[10px] uppercase tracking-wide text-ink-300">Evidence</div>
        {insight.evidence.map((ev, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-ink-300">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>{ev}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-300">Impact</div>
          <div className="text-xs font-medium text-white">{insight.impact}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-ink-300">Confidence</div>
          <div className="text-xs font-medium text-violet-400">{insight.confidence}%</div>
        </div>
      </div>
    </div>
  );
}
