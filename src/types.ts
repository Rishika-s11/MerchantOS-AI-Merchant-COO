// Core domain types for MerchantOS

export type PaymentMethod = 'UPI' | 'Card' | 'Netbanking' | 'Wallet';
export type TransactionStatus = 'success' | 'failed' | 'refunded' | 'pending';
export type Severity = 'critical' | 'warning' | 'informational';
export type AlertStatus = 'active' | 'investigating' | 'awaiting_approval' | 'resolved';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed';
export type ActionRisk = 'low' | 'medium' | 'high';
export type DemoScenarioId = 'normal' | 'payment_degradation' | 'revenue_drop' | 'settlement_anomaly' | 'customer_behavior';

export interface Merchant {
  id: string;
  name: string;
  email: string;
  industry: string;
  testMode: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpend: number;
  transactionCount: number;
  refundCount: number;
  lastPaymentDate: string;
  status: 'active' | 'dormant' | 'vip';
  avgOrderValue: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerId: string;
  customerName: string;
  orderId: string;
  isAnomalous: boolean;
  anomalyNote?: string;
}

export interface Settlement {
  id: string;
  date: string;
  expectedAmount: number;
  actualAmount: number;
  status: 'settled' | 'pending' | 'variance';
  transactionCount: number;
}

export interface Alert {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detectedAt: string;
  metric: string;
  impact: number;
  status: AlertStatus;
  scenario: DemoScenarioId;
  evidence: string[];
  confidence: number;
  investigationId?: string;
}

export interface InvestigationStep {
  key: string;
  label: string;
  status: 'complete' | 'pending';
}

export interface EvidenceCard {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}

export interface Investigation {
  id: string;
  alertId: string;
  title: string;
  severity: Severity;
  status: 'investigating' | 'complete' | 'awaiting_approval' | 'action_approved' | 'action_executed' | 'action_failed';
  scenario: DemoScenarioId;
  whatChanged: { before: string; after: string; chartData: { time: string; value: number }[] };
  evidence: EvidenceCard[];
  aiFinding: string;
  confidence: number;
  impact: { amount: number; affectedTransactions: number; timeWindow: string; confidence: number };
  recommendedAction: { title: string; scope: string; risk: ActionRisk; financialImpact: string; requiresApproval: boolean };
  steps: InvestigationStep[];
  createdAt: string;
}

export interface Insight {
  id: string;
  category: 'Payment' | 'Revenue' | 'Customer' | 'Settlement' | 'Operations';
  title: string;
  finding: string;
  evidence: string[];
  impact: string;
  confidence: number;
  recommendedAction: string;
  scenario: DemoScenarioId;
  severity: Severity;
}

export interface PendingAction {
  id: string;
  title: string;
  triggeredBy: string;
  reason: string;
  scope: string;
  risk: ActionRisk;
  requiresApproval: boolean;
  status: ActionStatus;
  investigationId?: string;
  createdAt: string;
  executionResult?: { success: boolean; message: string; detail?: string };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  event: string;
  aiDecision: string;
  evidence: string;
  approvedBy?: string;
  executionStatus: 'detected' | 'investigated' | 'recommended' | 'awaiting_approval' | 'approved' | 'rejected' | 'executed' | 'failed' | 'dismissed';
  scenario: DemoScenarioId;
}

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  description: string;
}

export interface Thresholds {
  paymentSuccessDrop: number; // percentage points
  revenueAnomaly: number; // percentage
  settlementVariance: number; // percentage
  customerConcentration: number; // percentage
}

export interface ActionPermissions {
  internalNotifications: 'allowed' | 'approval_required' | 'disabled';
  monitoring: 'allowed' | 'approval_required' | 'disabled';
  financialActions: 'allowed' | 'approval_required' | 'disabled';
  highImpactActions: 'allowed' | 'approval_required' | 'disabled';
}

export interface MerchantHealth {
  overall: number;
  payments: number;
  revenue: number;
  settlements: number;
  customers: number;
  operations: number;
}

export interface DashboardData {
  merchant: Merchant;
  health: MerchantHealth;
  kpis: {
    gmv: number;
    successfulPayments: number;
    paymentSuccessRate: number;
    refunds: number;
    expectedSettlement: number;
    gmvChange: number;
    successRateChange: number;
    refundsChange: number;
    settlementChange: number;
  };
  revenueSeries: { date: string; revenue: number; transactions: number; successRate: number }[];
  paymentMethodBreakdown: { method: PaymentMethod; count: number; successRate: number; volume: number }[];
  alerts: Alert[];
  insights: Insight[];
  scenario: DemoScenarioId;
}
