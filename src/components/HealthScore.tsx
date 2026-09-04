import { useMemo } from 'react';

interface HealthScoreProps {
  score: number;
  label?: string;
  size?: number;
  segments?: { label: string; value: number }[];
}

export function HealthScore({ score, label = 'HEALTHY', size = 180, segments }: HealthScoreProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const color = score >= 90 ? '#34d399' : score >= 75 ? '#a78bfa' : score >= 60 ? '#fbbf24' : '#f87171';
  const glowColor = score >= 90 ? 'rgba(52,211,153,0.4)' : score >= 75 ? 'rgba(167,139,250,0.4)' : 'rgba(251,191,36,0.4)';

  const gradientId = useMemo(() => `health-grad-${Math.random()}`, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="10"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter={`url(#glow-${gradientId})`}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tracking-tight">{score.toFixed(1)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 mt-1">{label}</span>
        </div>
      </div>
      {segments && segments.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <span className="text-xs text-ink-300">{seg.label}</span>
              <span className="text-xs font-semibold text-white">{Math.round(seg.value)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
