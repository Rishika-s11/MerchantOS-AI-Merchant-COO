import type {
  Transaction, Settlement, Customer, DashboardData, MerchantHealth,
  Alert, Insight, PaymentMethod, DemoScenarioId, Thresholds, EvidenceCard,
} from '@/types';
import { getScenarioConfig } from '@/data/dataset';

const DEFAULT_THRESHOLDS: Thresholds = {
  paymentSuccessDrop: 5,
  revenueAnomaly: 12,
  settlementVariance: 5,
  customerConcentration: 40,
};

export function getDefaultThresholds(): Thresholds {
  return { ...DEFAULT_THRESHOLDS };
}

// ---- Core metrics ----

export function computePaymentSuccessRate(transactions: Transaction[]): number {
  const attempted = transactions.filter(t => t.status === 'success' || t.status === 'failed');
  if (attempted.length === 0) return 100;
  const success = attempted.filter(t => t.status === 'success').length;
  return (success / attempted.length) * 100;
}

export function computeGMV(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.status === 'success' || t.status === 'refunded')
    .reduce((s, t) => s + t.amount, 0);
}

export function computeSuccessfulPayments(transactions: Transaction[]): number {
  return transactions.filter(t => t.status === 'success').length;
}

export function computeRefundAmount(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.status === 'refunded')
    .reduce((s, t) => s + t.amount, 0);
}

export function computeExpectedSettlement(settlements: Settlement[]): number {
  return settlements.reduce((s, x) => s + x.expectedAmount, 0);
}

export function computeActualSettlement(settlements: Settlement[]): number {
  return settlements.reduce((s, x) => s + x.actualAmount, 0);
}

// ---- Time series ----

export function buildRevenueSeries(transactions: Transaction[], days: number) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const series: { date: string; revenue: number; transactions: number; successRate: number }[] = [];

  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const dayTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td >= day && td < next;
    });

    const successTx = dayTx.filter(t => t.status === 'success' || t.status === 'refunded');
    const attempted = dayTx.filter(t => t.status === 'success' || t.status === 'failed');
    const revenue = successTx.reduce((s, t) => s + t.amount, 0);
    const successRate = attempted.length > 0
      ? (attempted.filter(t => t.status === 'success').length / attempted.length) * 100
      : 100;

    series.push({
      date: day.toISOString().slice(0, 10),
      revenue: Math.round(revenue),
      transactions: attempted.length,
      successRate: Math.round(successRate * 10) / 10,
    });
  }

  return series;
}

// ---- Payment method breakdown ----

export function buildPaymentMethodBreakdown(transactions: Transaction[]) {
  const methods: PaymentMethod[] = ['UPI', 'Card', 'Netbanking', 'Wallet'];
  return methods.map(method => {
    const methodTx = transactions.filter(t => t.paymentMethod === method);
    const attempted = methodTx.filter(t => t.status === 'success' || t.status === 'failed');
    const success = attempted.filter(t => t.status === 'success').length;
    const volume = methodTx.filter(t => t.status === 'success' || t.status === 'refunded')
      .reduce((s, t) => s + t.amount, 0);
    return {
      method,
      count: methodTx.length,
      successRate: attempted.length > 0 ? (success / attempted.length) * 100 : 100,
      volume,
    };
  });
}

// ---- Health score ----

export function computeHealth(
  transactions: Transaction[],
  settlements: Settlement[],
  customers: Customer[],
  scenario: DemoScenarioId,
): MerchantHealth {
  const successRate = computePaymentSuccessRate(transactions);
  const paymentsHealth = Math.min(100, Math.max(0, successRate));

  // Revenue health: compare last 7 days vs previous 7 days
  const series = buildRevenueSeries(transactions, 30);
  const last7 = series.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prev7 = series.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const revenueChange = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;
  const revenueHealth = Math.min(100, Math.max(0, 100 + revenueChange));

  // Settlement health
  const recentSettlements = settlements.slice(0, 7);
  const expectedTotal = recentSettlements.reduce((s, x) => s + x.expectedAmount, 0);
  const actualTotal = recentSettlements.reduce((s, x) => s + x.actualAmount, 0);
  const settlementVariance = expectedTotal > 0
    ? Math.abs((actualTotal - expectedTotal) / expectedTotal) * 100
    : 0;
  const settlementHealth = Math.min(100, Math.max(0, 100 - settlementVariance * 3));

  // Customer health: concentration
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0);
  const top5Revenue = customers.slice(0, 5).reduce((s, c) => s + c.totalSpend, 0);
  const concentration = totalRevenue > 0 ? (top5Revenue / totalRevenue) * 100 : 0;
  const customerHealth = Math.min(100, Math.max(0, 100 - concentration));

  // Operations health: blend of payment + settlement
  const operationsHealth = (paymentsHealth + settlementHealth) / 2;

  // Overall weighted
  const overall = Math.round(
    paymentsHealth * 0.3 +
    revenueHealth * 0.25 +
    settlementHealth * 0.2 +
    customerHealth * 0.15 +
    operationsHealth * 0.1
  );

  return {
    overall,
    payments: Math.round(paymentsHealth),
    revenue: Math.round(revenueHealth),
    settlements: Math.round(settlementHealth),
    customers: Math.round(customerHealth),
    operations: Math.round(operationsHealth),
  };
}

// ---- Anomaly detection ----

export interface DetectionResult {
  alerts: Alert[];
  insights: Insight[];
}

export function detectAnomalies(
  transactions: Transaction[],
  settlements: Settlement[],
  customers: Customer[],
  scenario: DemoScenarioId,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): DetectionResult {
  const alerts: Alert[] = [];
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  // --- Payment degradation detection ---
  const methodBreakdown = buildPaymentMethodBreakdown(transactions);
  const upiData = methodBreakdown.find(m => m.method === 'UPI');
  const cardData = methodBreakdown.find(m => m.method === 'Card');
  const nbData = methodBreakdown.find(m => m.method === 'Netbanking');

  // Historical baseline (normal) vs current
  const baselineUPI = 96.2;
  if (upiData && baselineUPI - upiData.successRate >= thresholds.paymentSuccessDrop) {
    const drop = Math.round((baselineUPI - upiData.successRate) * 10) / 10;
    const affectedTx = transactions.filter(t => t.isAnomalous && t.paymentMethod === 'UPI' && t.status === 'failed');
    const potentialImpact = affectedTx.reduce((s, t) => s + t.amount, 0);
    const confidence = Math.min(95, 70 + Math.round(drop * 2));

    alerts.push({
      id: 'alert_payment_degradation',
      severity: 'critical',
      category: 'Payment',
      title: 'UPI Payment Degradation',
      detectedAt: now,
      metric: `${baselineUPI}% → ${upiData.successRate.toFixed(1)}%`,
      impact: potentialImpact,
      status: 'active',
      scenario,
      evidence: [
        `UPI success rate dropped ${drop} percentage points`,
        `Card success rate remained normal at ${cardData?.successRate.toFixed(1)}%`,
        `Netbanking remained normal at ${nbData?.successRate.toFixed(1)}%`,
        `Degradation concentrated in 18:00–21:00 time window`,
      ],
      confidence,
    });

    insights.push({
      id: 'insight_payment_reliability',
      category: 'Payment',
      title: 'Payment reliability declining',
      finding: `UPI failure rate increased ${(drop / (100 - baselineUPI)).toFixed(1)}× during evening hours.`,
      evidence: [
        `UPI success rate fell from ${baselineUPI}% to ${upiData.successRate.toFixed(1)}%`,
        `${affectedTx.length} failed transactions in the degradation window`,
        `Other payment methods remained within normal range`,
      ],
      impact: `Potential transaction loss of ₹${(potentialImpact / 1000).toFixed(0)}K`,
      confidence,
      recommendedAction: 'Investigate payment degradation',
      scenario,
      severity: 'critical',
    });
  }

  // --- Revenue drop detection ---
  const series = buildRevenueSeries(transactions, 30);
  const last7 = series.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prev7 = series.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const revenueChange = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;

  if (Math.abs(revenueChange) >= thresholds.revenueAnomaly && revenueChange < 0) {
    const drop = Math.round(Math.abs(revenueChange));
    const impactAmount = Math.abs(last7 - prev7);
    const confidence = Math.min(92, 75 + Math.round(drop / 2));

    alerts.push({
      id: 'alert_revenue_drop',
      severity: 'warning',
      category: 'Revenue',
      title: 'Revenue Decline Detected',
      detectedAt: now,
      metric: `−${drop}% vs previous period`,
      impact: impactAmount,
      status: 'active',
      scenario,
      evidence: [
        `Revenue fell ${drop}% compared with the previous 7-day period`,
        `Transaction volume decreased significantly`,
        `Average order value remained relatively stable`,
        `Decline concentrated during specific time periods`,
      ],
      confidence,
    });

    insights.push({
      id: 'insight_revenue_drop',
      category: 'Revenue',
      title: 'Revenue trending downward',
      finding: `Revenue declined ${drop}% — primarily volume-driven rather than price-driven.`,
      evidence: [
        `Transaction volume decreased while average order value held steady`,
        `Revenue impact: ₹${(impactAmount / 1000).toFixed(0)}K lower than previous period`,
      ],
      impact: `₹${(impactAmount / 1000).toFixed(0)}K lower transaction value`,
      confidence,
      recommendedAction: 'Investigate transaction-volume decline',
      scenario,
      severity: 'warning',
    });
  }

  // --- Settlement anomaly detection ---
  const recentSettlements = settlements.slice(0, 7);
  const expectedTotal = recentSettlements.reduce((s, x) => s + x.expectedAmount, 0);
  const actualTotal = recentSettlements.reduce((s, x) => s + x.actualAmount, 0);
  const settlementVariance = expectedTotal > 0
    ? Math.abs((actualTotal - expectedTotal) / expectedTotal) * 100
    : 0;

  if (settlementVariance >= thresholds.settlementVariance && actualTotal < expectedTotal) {
    const variance = Math.round(settlementVariance);
    const varianceAmount = expectedTotal - actualTotal;
    const confidence = Math.min(90, 72 + Math.round(variance));

    alerts.push({
      id: 'alert_settlement_anomaly',
      severity: 'warning',
      category: 'Settlement',
      title: 'Settlement Variance Detected',
      detectedAt: now,
      metric: `${variance}% below expected`,
      impact: varianceAmount,
      status: 'active',
      scenario,
      evidence: [
        `Actual settlements fell ${variance}% below expected amounts`,
        `Variance observed across ${recentSettlements.filter(s => s.status === 'variance').length} recent settlement cycles`,
        `Expected: ₹${(expectedTotal / 100000).toFixed(2)}L, Actual: ₹${(actualTotal / 100000).toFixed(2)}L`,
      ],
      confidence,
    });

    insights.push({
      id: 'insight_settlement',
      category: 'Settlement',
      title: 'Settlement shortfall detected',
      finding: `Actual settlements are ${variance}% below expected, indicating a potential processing delay or reconciliation gap.`,
      evidence: [
        `Expected settlement: ₹${(expectedTotal / 100000).toFixed(2)}L`,
        `Actual settlement: ₹${(actualTotal / 100000).toFixed(2)}L`,
        `Variance: ₹${(varianceAmount / 1000).toFixed(0)}K`,
      ],
      impact: `₹${(varianceAmount / 1000).toFixed(0)}K settlement variance`,
      confidence,
      recommendedAction: 'Review settlement reconciliation process',
      scenario,
      severity: 'warning',
    });
  }

  // --- Customer concentration detection ---
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0);
  const top5Revenue = customers.slice(0, 5).reduce((s, c) => s + c.totalSpend, 0);
  const concentration = totalRevenue > 0 ? (top5Revenue / totalRevenue) * 100 : 0;

  if (concentration >= thresholds.customerConcentration) {
    const confidence = 80;
    alerts.push({
      id: 'alert_customer_concentration',
      severity: 'informational',
      category: 'Customer',
      title: 'Customer Concentration Risk',
      detectedAt: now,
      metric: `${concentration.toFixed(0)}% revenue from top 5 customers`,
      impact: 0,
      status: 'active',
      scenario,
      evidence: [
        `Top 5 customers account for ${concentration.toFixed(0)}% of total revenue`,
        `Revenue concentration above the ${thresholds.customerConcentration}% threshold`,
        `Diversification recommended to reduce dependency risk`,
      ],
      confidence,
    });

    insights.push({
      id: 'insight_concentration',
      category: 'Customer',
      title: 'Revenue concentration elevated',
      finding: `${concentration.toFixed(0)}% of revenue comes from just 5 customers, creating dependency risk.`,
      evidence: [
        `Top customer: ${customers[0]?.name} (₹${(customers[0]?.totalSpend / 1000).toFixed(0)}K)`,
        `Top 5 combined: ₹${(top5Revenue / 100000).toFixed(2)}L of ₹${(totalRevenue / 100000).toFixed(2)}L total`,
      ],
      impact: `High concentration creates revenue vulnerability`,
      confidence,
      recommendedAction: 'Diversify customer acquisition channels',
      scenario,
      severity: 'informational',
    });
  }

  // --- Customer behavior change (wallet) ---
  if (scenario === 'customer_behavior') {
    const walletData = methodBreakdown.find(m => m.method === 'Wallet');
    if (walletData && walletData.successRate < 92) {
      alerts.push({
        id: 'alert_wallet_behavior',
        severity: 'warning',
        category: 'Customer',
        title: 'Wallet Payment Behaviour Change',
        detectedAt: now,
        metric: `Wallet success rate ${walletData.successRate.toFixed(1)}%`,
        impact: 0,
        status: 'active',
        scenario,
        evidence: [
          `Wallet success rate declined to ${walletData.successRate.toFixed(1)}%`,
          `Shift in customer payment preferences detected`,
          `Wallet transaction volume changed relative to other methods`,
        ],
        confidence: 78,
      });

      insights.push({
        id: 'insight_wallet_behavior',
        category: 'Customer',
        title: 'Customer payment behaviour shifting',
        finding: `Wallet success rate declined while usage patterns shifted, suggesting a change in customer payment preferences.`,
        evidence: [
          `Wallet success rate: ${walletData.successRate.toFixed(1)}% (baseline: 94.8%)`,
          `Other payment methods remained stable`,
        ],
        impact: `Potential friction in wallet payment flow`,
        confidence: 78,
        recommendedAction: 'Review wallet payment integration',
        scenario,
        severity: 'warning',
      });
    }
  }

  // --- Normal scenario: positive insight ---
  if (scenario === 'normal') {
    insights.push({
      id: 'insight_revenue_up',
      category: 'Revenue',
      title: 'Revenue trending upward',
      finding: 'Revenue increased 11.8% compared with the previous period.',
      evidence: [
        'Transaction volume +7.4%',
        'Average order value +4.1%',
      ],
      impact: 'Healthy growth trajectory',
      confidence: 88,
      recommendedAction: 'Continue monitoring growth trends',
      scenario,
      severity: 'informational',
    });
  }

  return { alerts, insights };
}

// ---- Investigation builders ----

export function buildInvestigationEvidence(transactions: Transaction[], scenario: DemoScenarioId): EvidenceCard[] {
  const cards: EvidenceCard[] = [];

  if (scenario === 'payment_degradation') {
    const methodBreakdown = buildPaymentMethodBreakdown(transactions);
    const upi = methodBreakdown.find(m => m.method === 'UPI')!;
    const card = methodBreakdown.find(m => m.method === 'Card')!;
    const nb = methodBreakdown.find(m => m.method === 'Netbanking')!;
    const wallet = methodBreakdown.find(m => m.method === 'Wallet')!;

    const upiFailRate = (100 - upi.successRate).toFixed(1);
    const affectedTx = transactions.filter(t => t.isAnomalous && t.status === 'failed');
    const potentialValue = affectedTx.reduce((s, t) => s + t.amount, 0);

    cards.push({ label: 'UPI failure rate', value: `3.1% → ${upiFailRate}%`, sublabel: 'Evening window', highlight: true });
    cards.push({ label: 'Evening failure rate', value: '2.8× normal', sublabel: '18:00–21:00', highlight: true });
    cards.push({ label: 'Affected transactions', value: `${affectedTx.length}`, highlight: true });
    cards.push({ label: 'Potential transaction value', value: `₹${potentialValue.toLocaleString('en-IN')}`, highlight: true });
    cards.push({ label: 'Card failure rate', value: `${(100 - card.successRate).toFixed(1)}%`, sublabel: 'Normal' });
    cards.push({ label: 'Netbanking failure rate', value: `${(100 - nb.successRate).toFixed(1)}%`, sublabel: 'Normal' });
    cards.push({ label: 'Wallet failure rate', value: `${(100 - wallet.successRate).toFixed(1)}%`, sublabel: 'Normal' });
  }

  return cards;
}

export function buildWhatChangedChart(transactions: Transaction[], scenario: DemoScenarioId) {
  if (scenario === 'payment_degradation') {
    // Hourly success rate for last 2 days, showing the dip
    const series: { time: string; value: number }[] = [];
    const now = new Date();
    now.setHours(21, 0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const hourTx = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getHours() === h && td > new Date(now.getTime() - 2 * 86400000);
      });
      const attempted = hourTx.filter(t => t.status === 'success' || t.status === 'failed');
      const successRate = attempted.length > 0
        ? (attempted.filter(t => t.status === 'success').length / attempted.length) * 100
        : 96.2;
      series.push({ time: `${h.toString().padStart(2, '0')}:00`, value: Math.round(successRate * 10) / 10 });
    }
    return { before: '96.2%', after: '88.4%', chartData: series };
  }
  return { before: '—', after: '—', chartData: [] };
}

// ---- Dashboard aggregation ----

export function buildDashboardData(
  transactions: Transaction[],
  settlements: Settlement[],
  customers: Customer[],
  scenario: DemoScenarioId,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): DashboardData {
  const health = computeHealth(transactions, settlements, customers, scenario);
  const { alerts, insights } = detectAnomalies(transactions, settlements, customers, scenario, thresholds);

  const gmv = computeGMV(transactions);
  const successfulPayments = computeSuccessfulPayments(transactions);
  const paymentSuccessRate = computePaymentSuccessRate(transactions);
  const refunds = computeRefundAmount(transactions);
  const expectedSettlement = computeExpectedSettlement(settlements);

  // Changes vs previous period
  const series = buildRevenueSeries(transactions, 60);
  const last30 = series.slice(-30).reduce((s, d) => s + d.revenue, 0);
  const prev30 = series.slice(-60, -30).reduce((s, d) => s + d.revenue, 0);
  const gmvChange = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0;

  const last30Tx = transactions.filter(t => {
    const td = new Date(t.date);
    return td > new Date(Date.now() - 30 * 86400000);
  });
  const prev30Tx = transactions.filter(t => {
    const td = new Date(t.date);
    return td <= new Date(Date.now() - 30 * 86400000) && td > new Date(Date.now() - 60 * 86400000);
  });
  const last30Rate = computePaymentSuccessRate(last30Tx);
  const prev30Rate = computePaymentSuccessRate(prev30Tx);
  const successRateChange = last30Rate - prev30Rate;

  return {
    merchant: {
      id: 'mrc_urbancart',
      name: 'UrbanCart',
      email: 'ops@urbancart.in',
      industry: 'E-commerce / Lifestyle',
      testMode: true,
    },
    health,
    kpis: {
      gmv,
      successfulPayments,
      paymentSuccessRate,
      refunds,
      expectedSettlement,
      gmvChange: Math.round(gmvChange * 10) / 10,
      successRateChange: Math.round(successRateChange * 10) / 10,
      refundsChange: 0,
      settlementChange: 0,
    },
    revenueSeries: buildRevenueSeries(transactions, 30),
    paymentMethodBreakdown: buildPaymentMethodBreakdown(transactions),
    alerts,
    insights,
    scenario,
  };
}

export function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatINRFull(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
