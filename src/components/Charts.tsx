import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, LineChart, BarChart, Bar, Cell,
} from 'recharts';
import type { DashboardData } from '@/types';

interface RevenueChartProps {
  data: DashboardData['revenueSeries'];
  metric: 'revenue' | 'transactions' | 'successRate';
  highlightFrom?: number;
}

const metricConfig = {
  revenue: {
    key: 'revenue',
    label: 'Revenue',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.3)',
    format: (v: number) => `₹${(v / 1000).toFixed(0)}K`,
  },
  transactions: {
    key: 'transactions',
    label: 'Transactions',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.3)',
    format: (v: number) => v.toString(),
  },
  successRate: {
    key: 'successRate',
    label: 'Success Rate',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.3)',
    format: (v: number) => `${v}%`,
  },
};

export function RevenueChart({ data, metric }: RevenueChartProps) {
  const cfg = metricConfig[metric];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b6b85', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fill: '#6b6b85', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={cfg.format}
          width={50}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10,10,22,0.95)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
          }}
          labelStyle={{ color: '#e2e2f0', fontWeight: 600 }}
          formatter={(v: number) => [cfg.format(v), cfg.label]}
        />
        <Area
          type="monotone"
          dataKey={cfg.key}
          stroke={cfg.color}
          strokeWidth={2}
          fill={`url(#grad-${metric})`}
          activeDot={{ r: 5, fill: cfg.color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SuccessRateChart({ data }: { data: { time: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#6b6b85', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          minTickGap={20}
        />
        <YAxis
          domain={[80, 100]}
          tick={{ fill: '#6b6b85', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10,10,22,0.95)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '8px',
          }}
          formatter={(v: number) => [`${v}%`, 'Success Rate']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#a78bfa"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodChart({ data }: { data: DashboardData['paymentMethodBreakdown'] }) {
  const colors: Record<string, string> = {
    UPI: '#a78bfa',
    Card: '#22d3ee',
    Netbanking: '#34d399',
    Wallet: '#e879f9',
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="method" tick={{ fill: '#6b6b85', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis domain={[80, 100]} tick={{ fill: '#6b6b85', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{ background: 'rgba(10,10,22,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px' }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Success Rate']}
        />
        <Bar dataKey="successRate" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((entry) => (
            <Cell key={entry.method} fill={colors[entry.method]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimeRangeSelector({ value, onChange }: { value: '7D' | '30D' | '90D'; onChange: (v: '7D' | '30D' | '90D') => void }) {
  const ranges: ('7D' | '30D' | '90D')[] = ['7D', '30D', '90D'];
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/8">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === r ? 'bg-violet-500/30 text-violet-300' : 'text-ink-300 hover:text-white'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
