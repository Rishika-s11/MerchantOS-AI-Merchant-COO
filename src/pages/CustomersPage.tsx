import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { formatINR, formatINRFull } from '@/lib/analytics';
import { Search, X, Star, Crown, User } from 'lucide-react';
import type { Customer } from '@/types';

const STATUS_CONFIG = {
  vip: { label: 'VIP', classes: 'text-violet-400 bg-violet-500/10', icon: Crown },
  active: { label: 'Active', classes: 'text-success-400 bg-success-500/10', icon: User },
  dormant: { label: 'Dormant', classes: 'text-ink-300 bg-white/5', icon: User },
};

export function CustomersPage() {
  const { customers, transactions } = useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Customer | null>(null);
  const pageSize = 20;

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [customers, search]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
        <p className="text-sm text-ink-300 mt-1">{filtered.length.toLocaleString('en-IN')} customers · Test Mode</p>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search customers..."
          className="input-field w-full pl-9 pr-3 py-2 rounded-lg text-sm"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Customer</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Total Spend</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Transactions</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Refunds</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Avg Order</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Last Payment</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => {
                const sc = STATUS_CONFIG[c.status];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-xs font-bold text-white">
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm text-white">{c.name}</div>
                          <div className="text-[10px] font-mono text-ink-300">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white">{formatINR(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-right text-sm text-ink-300">{c.transactionCount}</td>
                    <td className="px-4 py-3 text-right text-sm text-ink-300">{c.refundCount}</td>
                    <td className="px-4 py-3 text-right text-sm text-ink-300">{formatINR(c.avgOrderValue)}</td>
                    <td className="px-4 py-3 text-xs text-ink-300">
                      {c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${sc.classes}`}>
                        <sc.icon size={10} />
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-ink-300">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 text-xs rounded hover:bg-white/5 disabled:opacity-30">Prev</button>
            <span className="text-xs text-ink-300">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-2 py-1 text-xs rounded hover:bg-white/5 disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>

      {selected && (
        <CustomerDrawer customer={selected} onClose={() => setSelected(null)} transactions={transactions} />
      )}
    </div>
  );
}

function CustomerDrawer({ customer, onClose, transactions }: { customer: Customer; onClose: () => void; transactions: ReturnType<typeof useApp>['transactions'] }) {
  const custTx = transactions.filter(t => t.customerId === customer.id).slice(0, 10);
  const refundRate = customer.transactionCount > 0 ? (customer.refundCount / customer.transactionCount) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-900 border-l border-white/10 z-50 overflow-y-auto animate-slide-in">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/5 bg-ink-900/95 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white">Customer Detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={18} className="text-ink-300" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="text-base font-semibold text-white">{customer.name}</div>
              <div className="text-xs text-ink-300">{customer.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Total Spend</div>
              <div className="text-lg font-bold text-white">{formatINRFull(customer.totalSpend)}</div>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Transactions</div>
              <div className="text-lg font-bold text-white">{customer.transactionCount}</div>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Avg Order Value</div>
              <div className="text-lg font-bold text-white">{formatINR(customer.avgOrderValue)}</div>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Refund Rate</div>
              <div className="text-lg font-bold text-white">{refundRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Star size={12} className="text-violet-400" />
              <span className="text-[10px] uppercase tracking-wide text-violet-400 font-semibold">AI Insight</span>
            </div>
            <p className="text-xs text-ink-300">
              {customer.status === 'vip'
                ? `Top-tier customer contributing ${formatINRFull(customer.totalSpend)} in revenue. High retention priority.`
                : customer.status === 'dormant'
                ? 'This customer has not made a recent payment. Consider re-engagement campaigns.'
                : `Regular customer with ${customer.transactionCount} transactions and ${refundRate.toFixed(1)}% refund rate.`}
            </p>
          </div>

          {/* Recent activity */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-ink-300 font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {custTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <div className="text-xs font-mono text-violet-400">{tx.id}</div>
                    <div className="text-[10px] text-ink-300">
                      {new Date(tx.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} · {tx.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatINRFull(tx.amount)}</div>
                    <div className={`text-[10px] uppercase ${tx.status === 'success' ? 'text-success-400' : tx.status === 'failed' ? 'text-danger-400' : 'text-warning-400'}`}>{tx.status}</div>
                  </div>
                </div>
              ))}
              {custTx.length === 0 && <p className="text-xs text-ink-300">No recent transactions.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
