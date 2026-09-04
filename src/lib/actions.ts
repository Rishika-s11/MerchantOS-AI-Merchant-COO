import type {
  PendingAction, AuditEvent, Alert, Investigation, ActionStatus,
  ActionRisk, DemoScenarioId, ActionPermissions,
} from '@/types';

let actionCounter = 100;
let auditCounter = 100;

export function createPendingAction(
  alert: Alert,
  investigationId: string,
  permissions: ActionPermissions,
): PendingAction {
  const risk: ActionRisk = 'low';
  const requiresApproval = permissions.internalNotifications === 'approval_required' ||
    permissions.internalNotifications === 'disabled';

  return {
    id: `act_${actionCounter++}`,
    title: getActionTitle(alert.scenario),
    triggeredBy: alert.title,
    reason: `${alert.category} threshold breached: ${alert.metric}`,
    scope: 'Internal notification + monitoring',
    risk,
    requiresApproval,
    status: requiresApproval ? 'pending' : 'pending',
    investigationId,
    createdAt: new Date().toISOString(),
  };
}

function getActionTitle(scenario: DemoScenarioId): string {
  switch (scenario) {
    case 'payment_degradation': return 'Notify Operations Team';
    case 'revenue_drop': return 'Notify Revenue Operations';
    case 'settlement_anomaly': return 'Notify Finance Team';
    case 'customer_behavior': return 'Notify Customer Success';
    default: return 'Notify Operations Team';
  }
}

export function executeAction(action: PendingAction): { success: boolean; message: string; detail?: string } {
  // Simulate execution — deterministic: always succeeds except for a specific demo toggle
  // The failure scenario is triggered via a flag in the action itself
  if (action.id === 'act_force_fail') {
    return {
      success: false,
      message: 'Action could not be completed.',
      detail: 'Notification service unavailable. No financial action was performed.',
    };
  }

  return {
    success: true,
    message: 'Notification sent to merchant operations team. Monitoring active on affected payment channel.',
  };
}

export function createAuditEvent(
  event: string,
  aiDecision: string,
  evidence: string,
  executionStatus: AuditEvent['executionStatus'],
  scenario: DemoScenarioId,
  approvedBy?: string,
): AuditEvent {
  return {
    id: `aud_${auditCounter++}`,
    timestamp: new Date().toISOString(),
    event,
    aiDecision,
    evidence,
    approvedBy,
    executionStatus,
    scenario,
  };
}

// Build the full audit trail for an investigation flow
export function buildInvestigationAuditTrail(
  alert: Alert,
  investigation: Investigation,
  action: PendingAction | null,
  scenario: DemoScenarioId,
): AuditEvent[] {
  const events: AuditEvent[] = [];
  const baseTime = new Date(alert.detectedAt).getTime();

  events.push(createAuditEvent(
    'Detected payment degradation',
    'AI detected abnormal UPI failure pattern.',
    `Success rate: ${alert.metric}`,
    'detected',
    scenario,
  ));

  events.push(createAuditEvent(
    'Investigation completed',
    'Evidence-backed recommendation generated.',
    `${investigation.evidence.length} evidence points analysed`,
    'investigated',
    scenario,
  ));

  events.push(createAuditEvent(
    'Recommendation generated',
    `AI recommends: ${investigation.recommendedAction.title}`,
    `Scope: ${investigation.recommendedAction.scope}, Risk: ${investigation.recommendedAction.risk}`,
    'recommended',
    scenario,
  ));

  if (action) {
    if (action.requiresApproval && action.status === 'pending') {
      events.push(createAuditEvent(
        'Action awaiting approval',
        'Merchant approval required before execution.',
        `Action: ${action.title}`,
        'awaiting_approval',
        scenario,
      ));
    } else if (action.status === 'approved' || action.status === 'executing' || action.status === 'executed') {
      events.push(createAuditEvent(
        'Action approved',
        'Merchant Admin approved the recommended action.',
        `Action: ${action.title}`,
        'approved',
        scenario,
        'Merchant Admin',
      ));

      if (action.executionResult) {
        events.push(createAuditEvent(
          action.executionResult.success ? 'Action executed' : 'Action execution failed',
          action.executionResult.success ? 'Action completed successfully.' : 'Execution failed safely.',
          action.executionResult.detail || action.executionResult.message,
          action.executionResult.success ? 'executed' : 'failed',
          scenario,
          'Merchant Admin',
        ));
      }
    } else if (action.status === 'rejected') {
      events.push(createAuditEvent(
        'Action rejected',
        'Merchant Admin rejected the recommended action.',
        `Action: ${action.title}`,
        'rejected',
        scenario,
        'Merchant Admin',
      ));
    }
  }

  return events;
}
