import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon?: LucideIcon;
  change?: number;
  changeSuffix?: string;
  accent?: 'violet' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral';
}

const accentConfig = {
  violet: { icon: 'text-violet-400 bg-violet-500/10' },
  cyan: { icon: 'text-cyan-400 bg-cyan-500/10' },
  success: { icon: 'text-success-400 bg-success-500/10' },
  warning: { icon: 'text-warning-400 bg-warning-500/10' },
  danger: { icon: 'text-danger-400 bg-danger-500/10' },
  neutral: { icon: 'text-ink-300 bg-white/5' },
};

export function MetricCard({
  label,
  value,
  format,
  icon: Icon,
  change,
  changeSuffix = '%',
  accent = 'neutral',
}: MetricCardProps) {
  const ac = accentConfig[accent];
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="glass glass-hover rounded-xl p-5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${ac.icon}`}>
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              isPositive ? 'text-success-400' : 'text-danger-400'
            }`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isPositive ? '+' : ''}{change}{changeSuffix}
          </span>
          <span className="text-xs text-ink-300">vs previous period</span>
        </div>
      )}
    </div>
  );
}
