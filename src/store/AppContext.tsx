import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type {
  DemoScenarioId, DashboardData, Transaction, Customer, Settlement,
  Alert, Investigation, PendingAction, AuditEvent, Thresholds, ActionPermissions,
} from '@/types';
import { generateDataset, getScenarioConfig } from '@/data/dataset';
import { buildDashboardData, detectAnomalies, buildInvestigationEvidence, buildWhatChangedChart, getDefaultThresholds } from '@/lib/analytics';
import { interpretInvestigation } from '@/lib/ai';
import { createPendingAction, executeAction, createAuditEvent, buildInvestigationAuditTrail } from '@/lib/actions';

interface AppStore {
  // Data
  transactions: Transaction[];
  customers: Customer[];
  settlements: Settlement[];
  dashboard: DashboardData;
  scenario: DemoScenarioId;

  // Alerts & investigations
  alerts: Alert[];
  investigations: Investigation[];
  actions: PendingAction[];
  auditTrail: AuditEvent[];

  // Settings
  thresholds: Thresholds;
  permissions: ActionPermissions;
  forceFailure: boolean;

  // Auth
  isAuthenticated: boolean;

  // Actions
  setScenario: (s: DemoScenarioId) => void;
  setThresholds: (t: Thresholds) => void;
  setPermissions: (p: ActionPermissions) => void;
  setForceFailure: (v: boolean) => void;
  login: () => void;
  logout: () => void;

  // Investigation flow
  startInvestigation: (alertId: string) => string | null;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  retryAction: (actionId: string) => void;

  // Audit
  addAuditEvent: (event: string, aiDecision: string, evidence: string, status: AuditEvent['executionStatus']) => void;
}

const defaultPermissions: ActionPermissions = {
  internalNotifications: 'approval_required',
  monitoring: 'allowed',
  financialActions: 'approval_required',
  highImpactActions: 'disabled',
};

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioState] = useState<DemoScenarioId>('normal');
  const [thresholds, setThresholdsState] = useState<Thresholds>(getDefaultThresholds());
  const [permissions, setPermissionsState] = useState<ActionPermissions>(defaultPermissions);
  const [forceFailure, setForceFailureState] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);

  // Regenerate dataset when scenario changes
  const dataset = useMemo(() => generateDataset(scenario), [scenario]);
  const { transactions, customers, settlements } = dataset;

  const dashboard = useMemo(
    () => buildDashboardData(transactions, settlements, customers, scenario, thresholds),
    [transactions, settlements, customers, scenario, thresholds],
  );

  const alerts = useMemo(
    () => detectAnomalies(transactions, settlements, customers, scenario, thresholds).alerts,
    [transactions, settlements, customers, scenario, thresholds],
  );

  const setScenario = useCallback((s: DemoScenarioId) => {
    setScenarioState(s);
    // Reset investigations/actions/audit when scenario changes
    setInvestigations([]);
    setActions([]);
    setAuditTrail([]);
  }, []);

  const setThresholds = useCallback((t: Thresholds) => setThresholdsState(t), []);
  const setPermissions = useCallback((p: ActionPermissions) => setPermissionsState(p), []);
  const setForceFailure = useCallback((v: boolean) => setForceFailureState(v), []);

  const login = useCallback(() => setIsAuthenticated(true), []);
  const logout = useCallback(() => setIsAuthenticated(false), []);

  const addAuditEvent = useCallback(
    (event: string, aiDecision: string, evidence: string, status: AuditEvent['executionStatus']) => {
      setAuditTrail((prev) => [createAuditEvent(event, aiDecision, evidence, status, scenario), ...prev]);
    },
    [scenario],
  );

  const startInvestigation = useCallback((alertId: string): string | null => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return null;

    // Check if investigation already exists
    const existing = investigations.find(inv => inv.alertId === alertId);
    if (existing) return existing.id;

    const investigationId = `inv_${Date.now()}`;
    const whatChanged = buildWhatChangedChart(transactions, scenario);
    const evidence = buildInvestigationEvidence(transactions, scenario);
    const aiFinding = interpretInvestigation(scenario, dashboard);

    const investigation: Investigation = {
      id: investigationId,
      alertId,
      title: alert.title,
      severity: alert.severity,
      status: 'awaiting_approval',
      scenario,
      whatChanged,
      evidence,
      aiFinding,
      confidence: alert.confidence,
      impact: {
        amount: alert.impact,
        affectedTransactions: transactions.filter(t => t.isAnomalous && t.status === 'failed').length,
        timeWindow: '18:00–21:00',
        confidence: alert.confidence,
      },
      recommendedAction: {
        title: scenario === 'payment_degradation' ? 'Notify Operations Team' : 'Notify Operations Team',
        scope: 'Internal notification + monitoring',
        risk: 'low',
        financialImpact: 'None',
        requiresApproval: true,
      },
      steps: [
        { key: 'what_changed', label: 'What Changed', status: 'complete' },
        { key: 'evidence', label: 'Evidence', status: 'complete' },
        { key: 'ai_finding', label: 'AI Finding', status: 'complete' },
        { key: 'impact', label: 'Business Impact', status: 'complete' },
        { key: 'recommendation', label: 'Recommended Action', status: 'complete' },
        { key: 'approval', label: 'Approval', status: 'pending' },
        { key: 'execution', label: 'Execution', status: 'pending' },
        { key: 'audit', label: 'Audit', status: 'pending' },
      ],
      createdAt: new Date().toISOString(),
    };

    setInvestigations((prev) => [investigation, ...prev]);

    // Create pending action
    const action = createPendingAction(alert, investigationId, permissions);
    setActions((prev) => [action, ...prev]);

    // Add audit events for detection + investigation
    const auditEvents = buildInvestigationAuditTrail(alert, investigation, action, scenario);
    setAuditTrail((prev) => [...auditEvents, ...prev]);

    return investigationId;
  }, [alerts, investigations, transactions, scenario, dashboard, permissions]);

  const approveAction = useCallback((actionId: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== actionId) return a;
        // Set to executing
        return { ...a, status: 'executing' as const };
      }),
    );

    // Simulate async execution
    setTimeout(() => {
      setActions((prev) =>
        prev.map((a) => {
          if (a.id !== actionId) return a;
          const forcedAction = forceFailure ? { ...a, id: 'act_force_fail' as const } : a;
          const result = executeAction(forcedAction);
          return { ...a, status: result.success ? 'executed' as const : 'failed' as const, executionResult: result };
        }),
      );

      // Add audit event for execution result
      setActions((prev) => {
        const action = prev.find(a => a.id === actionId);
        if (action?.executionResult) {
          setAuditTrail((prevAudit) => [
            createAuditEvent(
              action.executionResult!.success ? 'Action executed' : 'Action execution failed',
              action.executionResult!.success ? 'Action completed successfully.' : 'Execution failed safely.',
              action.executionResult!.detail || action.executionResult!.message,
              action.executionResult!.success ? 'executed' : 'failed',
              scenario,
              'Merchant Admin',
            ),
            ...prevAudit,
          ]);
        }
        return prev;
      });
    }, 1800);
  }, [forceFailure, scenario]);

  const rejectAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' as const } : a));
    setAuditTrail((prev) => [
      createAuditEvent(
        'Action rejected',
        'Merchant Admin rejected the recommended action.',
        `Action ${actionId} rejected by merchant`,
        'rejected',
        scenario,
        'Merchant Admin',
      ),
      ...prev,
    ]);
  }, [scenario]);

  const retryAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map(a => a.id === actionId ? { ...a, status: 'executing' as const } : a));

    setTimeout(() => {
      setActions((prev) =>
        prev.map((a) => {
          if (a.id !== actionId) return a;
          // On retry, don't force failure (give it a chance to succeed)
          const result = executeAction(a);
          return { ...a, status: result.success ? 'executed' as const : 'failed' as const, executionResult: result };
        }),
      );

      setAuditTrail((prev) => [
        createAuditEvent(
          'Action retry executed',
          'Retry attempt completed.',
          `Retry of action ${actionId}`,
          'executed',
          scenario,
          'Merchant Admin',
        ),
        ...prev,
      ]);
    }, 1800);
  }, [scenario]);

  const store: AppStore = {
    transactions,
    customers,
    settlements,
    dashboard,
    scenario,
    alerts,
    investigations,
    actions,
    auditTrail,
    thresholds,
    permissions,
    forceFailure,
    isAuthenticated,
    setScenario,
    setThresholds,
    setPermissions,
    setForceFailure,
    login,
    logout,
    startInvestigation,
    approveAction,
    rejectAction,
    retryAction,
    addAuditEvent,
  };

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
