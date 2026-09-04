import { useApp } from '@/store/AppContext';
import { getScenarioConfig } from '@/data/dataset';
import { getDefaultThresholds } from '@/lib/analytics';
import {
  Settings, Sliders, ShieldCheck, Bell, Database, RotateCcw,
  Check, Sparkles,
} from 'lucide-react';
import type { DemoScenarioId, Thresholds, ActionPermissions } from '@/types';

const SCENARIOS: DemoScenarioId[] = ['normal', 'payment_degradation', 'revenue_drop', 'settlement_anomaly', 'customer_behavior'];

export function SettingsPage() {
  const {
    scenario, setScenario, thresholds, setThresholds,
    permissions, setPermissions, forceFailure, setForceFailure,
  } = useApp();

  const updateThreshold = (key: keyof Thresholds, value: number) => {
    setThresholds({ ...thresholds, [key]: value });
  };

  const updatePermission = (key: keyof ActionPermissions, value: 'allowed' | 'approval_required' | 'disabled') => {
    setPermissions({ ...permissions, [key]: value });
  };

  const permissionOptions: ('allowed' | 'approval_required' | 'disabled')[] = ['allowed', 'approval_required', 'disabled'];

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-ink-300 mt-1">Configure MerchantOS behaviour, thresholds, and permissions</p>
      </div>

      {/* Merchant Profile */}
      <Section icon={Settings} title="Merchant Profile">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name" value="UrbanCart" />
          <Field label="Industry" value="E-commerce / Lifestyle" />
          <Field label="Contact Email" value="ops@urbancart.in" />
          <Field label="Mode" value="Test Mode" />
        </div>
      </Section>

      {/* Alert Thresholds */}
      <Section icon={Sliders} title="Alert Thresholds">
        <p className="text-xs text-ink-300 mb-4">The detection engine uses these values to trigger alerts. Changes apply immediately.</p>
        <div className="space-y-4">
          <ThresholdSlider
            label="Payment Success Drop"
            value={thresholds.paymentSuccessDrop}
            onChange={(v) => updateThreshold('paymentSuccessDrop', v)}
            min={2}
            max={15}
            step={0.5}
            unit="pp"
          />
          <ThresholdSlider
            label="Revenue Anomaly"
            value={thresholds.revenueAnomaly}
            onChange={(v) => updateThreshold('revenueAnomaly', v)}
            min={5}
            max={30}
            step={1}
            unit="%"
          />
          <ThresholdSlider
            label="Settlement Variance"
            value={thresholds.settlementVariance}
            onChange={(v) => updateThreshold('settlementVariance', v)}
            min={2}
            max={20}
            step={1}
            unit="%"
          />
          <ThresholdSlider
            label="Customer Concentration"
            value={thresholds.customerConcentration}
            onChange={(v) => updateThreshold('customerConcentration', v)}
            min={20}
            max={80}
            step={5}
            unit="%"
          />
        </div>
        <button
          onClick={() => setThresholds(getDefaultThresholds())}
          className="btn-ghost mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </Section>

      {/* Action Permissions */}
      <Section icon={ShieldCheck} title="Action Permissions">
        <p className="text-xs text-ink-300 mb-4">Controls what MerchantOS can do autonomously versus what requires your approval.</p>
        <div className="space-y-3">
          {(Object.entries(permissions) as [keyof ActionPermissions, string][]).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/8">
                {permissionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updatePermission(key, opt)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                      val === opt
                        ? opt === 'allowed' ? 'bg-success-500/20 text-success-400'
                          : opt === 'approval_required' ? 'bg-warning-500/20 text-warning-400'
                          : 'bg-danger-500/20 text-danger-400'
                        : 'text-ink-300 hover:text-white'
                    }`}
                  >
                    {opt.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Notification Preferences */}
      <Section icon={Bell} title="Notification Preferences">
        <div className="space-y-3">
          {['Critical alerts', 'Warning alerts', 'Completed actions', 'Failed actions', 'Daily summary'].map((item) => (
            <label key={item} className="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer">
              <span className="text-sm text-white">{item}</span>
              <ToggleSwitch defaultChecked />
            </label>
          ))}
        </div>
      </Section>

      {/* AI Configuration */}
      <Section icon={Sparkles} title="AI Configuration">
        <div className="space-y-3">
          <label className="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer">
            <div>
              <span className="text-sm text-white">Force action failure (demo)</span>
              <p className="text-xs text-ink-300">Simulate execution failure to demonstrate the failure experience</p>
            </div>
            <ToggleSwitch checked={forceFailure} onChange={setForceFailure} />
          </label>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-white">AI Interpretation Mode</span>
            <span className="text-xs text-violet-400 font-medium">Deterministic (built-in)</span>
          </div>
        </div>
      </Section>

      {/* Demo Data */}
      <Section icon={Database} title="Demo Scenarios">
        <p className="text-xs text-ink-300 mb-4">Switch scenarios to see MerchantOS detect different anomalies. The underlying dataset changes when you switch.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCENARIOS.map((s) => {
            const cfg = getScenarioConfig(s);
            const isActive = scenario === s;
            return (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`glass rounded-xl p-4 text-left transition-all ${
                  isActive ? 'gradient-border shadow-glow-violet' : 'glass-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{cfg.label}</span>
                  {isActive && <Check size={16} className="text-violet-400" />}
                </div>
                <p className="text-xs text-ink-300">{cfg.description}</p>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setScenario('normal')}
          className="btn-ghost mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Reset Demo
        </button>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Settings; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-300">{label}</div>
      <div className="text-sm text-white mt-0.5">{value}</div>
    </div>
  );
}

function ThresholdSlider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white">{label}</span>
        <span className="text-sm font-bold text-violet-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-violet-500 cursor-pointer"
      />
    </div>
  );
}

function ToggleSwitch({ defaultChecked, checked, onChange }: { defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void }) {
  const isControlled = checked !== undefined;
  // Simple visual toggle
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        (isControlled ? checked : defaultChecked) ? 'bg-violet-500' : 'bg-white/10'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
        (isControlled ? checked : defaultChecked) ? 'translate-x-5' : ''
      }`} />
    </button>
  );
}
