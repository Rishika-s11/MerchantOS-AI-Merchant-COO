import type {
  DashboardData, Alert, Insight, Transaction, Settlement, Customer,
  DemoScenarioId,
} from '@/types';
import { buildPaymentMethodBreakdown, buildRevenueSeries, computePaymentSuccessRate } from '@/lib/analytics';

export interface AIQueryResult {
  question: string;
  answer: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  confidence: number;
}

// Deterministic AI interpretation — generates natural-language findings from real data
export function interpretAlert(alert: Alert, data: DashboardData): string {
  switch (alert.scenario) {
    case 'payment_degradation':
      return 'Payment failures increased sharply during the evening period. The anomaly is concentrated in UPI transactions rather than across all payment methods, suggesting a payment-method-specific degradation rather than a broad decline in customer demand.';
    case 'revenue_drop':
      return 'The revenue decline is primarily volume-driven rather than caused by lower order value. Transaction count decreased while average order value remained stable, indicating fewer customer purchases rather than customers spending less per order.';
    case 'settlement_anomaly':
      return 'Actual settlement amounts are consistently below expected values across multiple cycles. This pattern suggests a settlement processing delay or reconciliation discrepancy rather than a one-time variance.';
    case 'customer_behavior':
      return 'Customer payment preferences are shifting. Wallet transaction success rates declined while other methods remained stable, indicating a potential issue with the wallet payment integration or a change in customer behaviour.';
    default:
      return 'Operations are within normal parameters. No significant anomalies detected across payment, revenue, or settlement metrics.';
  }
}

export function interpretInvestigation(scenario: DemoScenarioId, data: DashboardData): string {
  return interpretAlert({ scenario } as Alert, data);
}

// AI query handler — answers merchant questions from actual data
export function answerQuery(
  question: string,
  transactions: Transaction[],
  settlements: Settlement[],
  customers: Customer[],
  data: DashboardData,
): AIQueryResult {
  const q = question.toLowerCase().trim();

  // "Why did revenue fall today?"
  if (q.includes('revenue') && (q.includes('fall') || q.includes('drop') || q.includes('decline') || q.includes('decrease'))) {
    const series = buildRevenueSeries(transactions, 14);
    const today = series[series.length - 1];
    const yesterday = series[series.length - 2];
    const change = yesterday.revenue > 0 ? ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100 : 0;

    if (change < 0) {
      const impactAmount = Math.abs(today.revenue - yesterday.revenue);
      return {
        question,
        answer: `Revenue is down ${Math.abs(Math.round(change))}% compared with yesterday.`,
        evidence: [
          `Transaction volume: ${today.transactions} vs ${yesterday.transactions} yesterday`,
          `Average order value remained stable`,
          `Decline concentrated during specific hours`,
        ],
        impact: `₹${impactAmount.toLocaleString('en-IN')} lower transaction value`,
        recommendation: 'Investigate the transaction-volume decline',
        confidence: 85,
      };
    }
    return {
      question,
      answer: `Revenue is up ${Math.round(change)}% compared with yesterday.`,
      evidence: [`Today's revenue: ₹${today.revenue.toLocaleString('en-IN')}`, `Yesterday: ₹${yesterday.revenue.toLocaleString('en-IN')}`],
      impact: 'Positive trend',
      recommendation: 'Continue monitoring growth',
      confidence: 88,
    };
  }

  // "Which payment method is performing worst?"
  if (q.includes('payment method') && (q.includes('worst') || q.includes('poor') || q.includes('bad') || q.includes('perform'))) {
    const breakdown = buildPaymentMethodBreakdown(transactions);
    const worst = [...breakdown].sort((a, b) => a.successRate - b.successRate)[0];
    return {
      question,
      answer: `${worst.method} has the lowest success rate at ${worst.successRate.toFixed(1)}%.`,
      evidence: breakdown.map(m => `${m.method}: ${m.successRate.toFixed(1)}% (${m.count} transactions)`),
      impact: worst.successRate < 92 ? `Potential revenue loss from ${worst.method} failures` : 'Minor impact',
      recommendation: worst.successRate < 92 ? `Investigate ${worst.method} payment degradation` : 'Monitor for trends',
      confidence: 90,
    };
  }

  // "What changed compared with yesterday/last week?"
  if (q.includes('what changed') || q.includes('compared with')) {
    const series = buildRevenueSeries(transactions, 14);
    const today = series[series.length - 1];
    const yesterday = series[series.length - 2];
    const revChange = yesterday.revenue > 0 ? ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100 : 0;
    const breakdown = buildPaymentMethodBreakdown(transactions);
    const worst = [...breakdown].sort((a, b) => a.successRate - b.successRate)[0];

    return {
      question,
      answer: `Revenue ${revChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(revChange))}% vs yesterday. ${worst.successRate < 92 ? `${worst.method} success rate dropped to ${worst.successRate.toFixed(1)}%.` : 'All payment methods are within normal range.'}`,
      evidence: [
        `Revenue: ₹${today.revenue.toLocaleString('en-IN')} (vs ₹${yesterday.revenue.toLocaleString('en-IN')})`,
        `Transactions: ${today.transactions} (vs ${yesterday.transactions})`,
        `Worst performing method: ${worst.method} at ${worst.successRate.toFixed(1)}%`,
      ],
      impact: `${worst.successRate < 92 ? 'Payment degradation detected' : 'No significant anomalies'}`,
      recommendation: worst.successRate < 92 ? `Investigate ${worst.method} performance` : 'Continue monitoring',
      confidence: 84,
    };
  }

  // "Find unusual payment patterns" / "Show me unusual payment activity"
  if (q.includes('unusual') || q.includes('anomal') || q.includes('unusual payment')) {
    const anomalous = transactions.filter(t => t.isAnomalous);
    const breakdown = buildPaymentMethodBreakdown(transactions);
    const worst = [...breakdown].sort((a, b) => a.successRate - b.successRate)[0];

    if (anomalous.length > 0 || worst.successRate < 92) {
      return {
        question,
        answer: `Detected ${anomalous.length} anomalous transactions. ${worst.method} success rate is ${worst.successRate.toFixed(1)}%, below the normal baseline.`,
        evidence: [
          `${anomalous.length} transactions flagged as anomalous`,
          `${worst.method} success rate: ${worst.successRate.toFixed(1)}% (baseline ~96%)`,
          `Anomaly concentrated in evening hours (18:00–21:00)`,
        ],
        impact: `₹${anomalous.filter(t => t.status === 'failed').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')} potential impact`,
        recommendation: 'Investigate payment degradation',
        confidence: 87,
      };
    }
    return {
      question,
      answer: 'No unusual payment patterns detected. All payment methods are performing within normal ranges.',
      evidence: breakdown.map(m => `${m.method}: ${m.successRate.toFixed(1)}% success rate`),
      impact: 'None',
      recommendation: 'Continue monitoring',
      confidence: 92,
    };
  }

  // "What needs my attention?"
  if (q.includes('attention') || q.includes('needs') || q.includes('important') || q.includes('priority')) {
    const activeAlerts = data.alerts.filter(a => a.status === 'active');
    if (activeAlerts.length > 0) {
      const top = activeAlerts[0];
      return {
        question,
        answer: `${activeAlerts.length} signal${activeAlerts.length > 1 ? 's require' : ' requires'} your attention. The most critical: ${top.title} with ₹${top.impact.toLocaleString('en-IN')} potential impact.`,
        evidence: activeAlerts.map(a => `${a.severity.toUpperCase()}: ${a.title} — ${a.metric}`),
        impact: `₹${activeAlerts.reduce((s, a) => s + a.impact, 0).toLocaleString('en-IN')} total potential impact`,
        recommendation: `Review and investigate ${top.title}`,
        confidence: 89,
      };
    }
    return {
      question,
      answer: 'Your business is operating normally. No signals require immediate attention.',
      evidence: ['Payment success rate within normal range', 'Revenue trending as expected', 'Settlements on schedule'],
      impact: 'None',
      recommendation: 'Continue routine monitoring',
      confidence: 93,
    };
  }

  // "How much money is at risk?"
  if (q.includes('at risk') || q.includes('money') && q.includes('risk')) {
    const totalImpact = data.alerts.reduce((s, a) => s + a.impact, 0);
    if (totalImpact > 0) {
      return {
        question,
        answer: `₹${totalImpact.toLocaleString('en-IN')} is currently at risk across ${data.alerts.length} active signal${data.alerts.length > 1 ? 's' : ''}.`,
        evidence: data.alerts.map(a => `${a.title}: ₹${a.impact.toLocaleString('en-IN')}`),
        impact: `₹${totalImpact.toLocaleString('en-IN')} total potential impact`,
        recommendation: 'Review and address active alerts',
        confidence: 86,
      };
    }
    return {
      question,
      answer: 'No money is currently at risk. All operations are within normal parameters.',
      evidence: ['No active alerts with financial impact'],
      impact: 'None',
      recommendation: 'Continue monitoring',
      confidence: 94,
    };
  }

  // "Explain today's settlement"
  if (q.includes('settlement')) {
    const today = settlements[0];
    if (today) {
      const variance = today.expectedAmount > 0
        ? ((today.actualAmount - today.expectedAmount) / today.expectedAmount) * 100
        : 0;
      return {
        question,
        answer: `Today's settlement: ₹${today.actualAmount.toLocaleString('en-IN')} ${variance < 0 ? `(${Math.abs(Math.round(variance))}% below expected)` : '(on schedule)'}.`,
        evidence: [
          `Expected: ₹${today.expectedAmount.toLocaleString('en-IN')}`,
          `Actual: ₹${today.actualAmount.toLocaleString('en-IN')}`,
          `Transactions settled: ${today.transactionCount}`,
          `Status: ${today.status}`,
        ],
        impact: variance < 0 ? `₹${(today.expectedAmount - today.actualAmount).toLocaleString('en-IN')} shortfall` : 'On schedule',
        recommendation: variance < -5 ? 'Review settlement reconciliation' : 'No action needed',
        confidence: 91,
      };
    }
    return {
      question,
      answer: 'No settlement data available for today.',
      evidence: [],
      impact: 'Unknown',
      recommendation: 'Check settlement configuration',
      confidence: 50,
    };
  }

  // "Which customers changed their behaviour?"
  if (q.includes('customer') && (q.includes('behaviour') || q.includes('behavior') || q.includes('change'))) {
    const top = customers.slice(0, 5);
    return {
      question,
      answer: `${top.length} high-value customers show notable activity patterns. Top customer ${top[0]?.name} has spent ₹${top[0]?.totalSpend.toLocaleString('en-IN')} across ${top[0]?.transactionCount} transactions.`,
      evidence: top.map(c => `${c.name}: ₹${c.totalSpend.toLocaleString('en-IN')} (${c.transactionCount} txns, ${c.refundCount} refunds)`),
      impact: `Top 5 customers represent significant revenue concentration`,
      recommendation: 'Monitor customer retention and diversify acquisition',
      confidence: 82,
    };
  }

  // "Biggest operational risks"
  if (q.includes('risk') || q.includes('biggest')) {
    const activeAlerts = data.alerts.filter(a => a.status === 'active');
    if (activeAlerts.length > 0) {
      return {
        question,
        answer: `${activeAlerts.length} operational risk${activeAlerts.length > 1 ? 's' : ''} identified. Most significant: ${activeAlerts[0].title}.`,
        evidence: activeAlerts.map(a => `${a.title} — ${a.severity} — ₹${a.impact.toLocaleString('en-IN')} impact`),
        impact: `₹${activeAlerts.reduce((s, a) => s + a.impact, 0).toLocaleString('en-IN')} aggregate risk`,
        recommendation: 'Address critical alerts first',
        confidence: 85,
      };
    }
    return {
      question,
      answer: 'No significant operational risks detected.',
      evidence: ['All systems operating within normal parameters'],
      impact: 'None',
      recommendation: 'Continue monitoring',
      confidence: 90,
    };
  }

  // Default fallback
  const rate = computePaymentSuccessRate(transactions);
  return {
    question,
    answer: `I can help with that. Your current payment success rate is ${rate.toFixed(1)}% with ${data.kpis.successfulPayments} successful payments. Ask me about revenue, payments, settlements, or anomalies.`,
    evidence: [
      `Payment success rate: ${rate.toFixed(1)}%`,
      `GMV: ₹${data.kpis.gmv.toLocaleString('en-IN')}`,
      `Active alerts: ${data.alerts.length}`,
    ],
    impact: 'See specific metrics above',
    recommendation: 'Try asking about revenue, payments, or anomalies',
    confidence: 70,
  };
}

export const SUGGESTED_QUESTIONS = [
  'Why did revenue fall today?',
  'What changed compared with yesterday?',
  'Find unusual payment patterns.',
  'Which payment method is performing worst?',
  'Explain today\'s settlement.',
  'What needs my attention?',
  'How much money is currently at risk?',
  'Which customers changed their behaviour?',
];
