import type { Severity } from '@/types';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const config = {
  critical: {
    label: 'CRITICAL',
    classes: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
    dot: 'bg-danger-500',
    icon: AlertCircle,
  },
  warning: {
    label: 'WARNING',
    classes: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
    dot: 'bg-warning-500',
    icon: AlertTriangle,
  },
  informational: {
    label: 'INFO',
    classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-500',
    icon: Info,
  },
};

export function SeverityBadge({ severity, size = 'md' }: { severity: Severity; size?: 'sm' | 'md' }) {
  const c = config[severity];
  const Icon = c.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center font-semibold tracking-wide rounded-md border ${c.classes} ${sizeClasses}`}>
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  return <span className={`status-dot ${config[severity].dot}`} />;
}
