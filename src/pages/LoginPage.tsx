import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('ops@urbancart.in');
  const [password, setPassword] = useState('demo1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-ink-950">
      {/* Background mesh */}
      <div className="absolute inset-0 mesh-bg opacity-60" />
      <div className="absolute inset-0 grid-texture opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md px-6">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Sparkles size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-violet-500/30 blur-xl -z-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MerchantOS</h1>
          <p className="text-sm text-ink-300 mt-1">Your business, understood.</p>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl p-6 gradient-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-ink-300 font-semibold mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full px-4 py-2.5 rounded-lg text-sm"
                placeholder="ops@urbancart.in"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-ink-300 font-semibold mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full px-4 py-2.5 rounded-lg text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] uppercase tracking-wider text-ink-300">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <button
            onClick={login}
            className="btn-ghost w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} className="text-violet-400" />
            Enter Demo
          </button>
        </div>

        <p className="text-center text-xs text-ink-300 mt-6">
          Test Mode — All financial data is simulated. No real-money operations.
        </p>
      </div>
    </div>
  );
}
