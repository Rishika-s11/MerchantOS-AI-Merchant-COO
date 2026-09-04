import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { formatINRFull, formatINR } from '@/lib/analytics';
import { X, Search, ArrowUpDown, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction, PaymentMethod, TransactionStatus } from '@/types';

const STATUS_COLORS: Record<TransactionStatus, string> = {
  success: 'text-success-400 bg-success-500/10',
  failed: 'text-danger-400 bg-danger-500/10',
  refunded: 'text-warning-400 bg-warning-500/10',
  pending: 'text-ink-300 bg-white/5',
};

export function TransactionsPage() {
  const { transactions } = useApp();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q)
      );
    }
    if (methodFilter !== 'all') result = result.filter(t => t.paymentMethod === methodFilter);
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    result.sort((a, b) => {
      const cmp = sortBy === 'date'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : a.amount - b.amount;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [transactions, search, methodFilter, statusFilter, sortBy, sortDir]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
        <p className="text-sm text-ink-300 mt-1">{filtered.length.toLocaleString('en-IN')} transactions · Test Mode</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by ID, customer, or order..."
            className="input-field w-full pl-9 pr-3 py-2 rounded-lg text-sm"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value as PaymentMethod | 'all'); setPage(0); }}
          className="input-field px-3 py-2 rounded-lg text-sm cursor-pointer"
        >
          <option value="all">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Netbanking">Netbanking</option>
          <option value="Wallet">Wallet</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TransactionStatus | 'all'); setPage(0); }}
          className="input-field px-3 py-2 rounded-lg text-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Transaction ID</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">
                  <button onClick={() => { setSortBy('date'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }} className="flex items-center gap-1 hover:text-white">
                    Date <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">
                  <button onClick={() => { setSortBy('amount'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }} className="flex items-center gap-1 ml-auto hover:text-white">
                    Amount <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Method</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Customer</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-mono text-violet-400">{tx.id}</td>
                  <td className="px-4 py-3 text-xs text-ink-300">
                    {new Date(tx.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </td>
                  <td className="px-4 py-3 text-xs text-right font-semibold text-white">{formatINRFull(tx.amount)}</td>
                  <td className="px-4 py-3 text-xs text-ink-300">{tx.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[tx.status]}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-300">{tx.customerName}</td>
                  <td className="px-4 py-3 text-center">
                    {tx.isAnomalous && <AlertTriangle size={14} className="text-danger-400 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-ink-300">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} className="text-ink-300" />
            </button>
            <span className="text-xs text-ink-300">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-ink-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function TransactionDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const timeline = [
    { label: 'Created', time: tx.date, status: 'done' },
    { label: 'Payment Attempted', time: tx.date, status: 'done' },
    { label: tx.status === 'success' ? 'Authorized' : 'Authorization Failed', time: tx.date, status: tx.status === 'success' ? 'done' : 'failed' },
    { label: tx.status === 'success' ? 'Captured' : 'Not Captured', time: tx.date, status: tx.status === 'success' ? 'done' : 'failed' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-900 border-l border-white/10 z-50 overflow-y-auto animate-slide-in">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/5 bg-ink-900/95 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white">Transaction Detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={18} className="text-ink-300" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-xs font-mono text-violet-400 mb-1">{tx.id}</div>
            <div className="text-3xl font-bold text-white">{formatINRFull(tx.amount)}</div>
            <span className={`inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[tx.status]}`}>
              {tx.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Payment Method</div>
              <div className="text-sm text-white">{tx.paymentMethod}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Order ID</div>
              <div className="text-sm font-mono text-white">{tx.orderId}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Customer</div>
              <div className="text-sm text-white">{tx.customerName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-300">Customer ID</div>
              <div className="text-sm font-mono text-white">{tx.customerId}</div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-ink-300 font-semibold mb-3">Timeline</h3>
            <div className="space-y-3">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === 'done' ? 'bg-success-500/15' : 'bg-danger-500/15'
                  }`}>
                    {step.status === 'done' ? (
                      <div className="w-2 h-2 rounded-full bg-success-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-danger-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{step.label}</div>
                    <div className="text-xs text-ink-300">
                      {new Date(step.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related anomalies */}
          {tx.isAnomalous && (
            <div className="px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-danger-400" />
                <span className="text-xs font-semibold text-danger-400 uppercase tracking-wide">Related Anomaly</span>
              </div>
              <p className="text-xs text-ink-300">{tx.anomalyNote || 'This transaction occurred during a detected anomaly window.'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
