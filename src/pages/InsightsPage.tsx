import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { InsightCard } from '@/components/InsightCard';
import { EmptyState } from '@/components/States';
import { Lightbulb } from 'lucide-react';
import type { Insight } from '@/types';

type Category = 'All' | 'Payment' | 'Revenue' | 'Customer' | 'Settlement' | 'Operations';

export function InsightsPage() {
  const { dashboard } = useApp();
  const insights = dashboard.insights;
  const [category, setCategory] = useState<Category>('All');

  const categories: Category[] = ['All', 'Payment', 'Revenue', 'Customer', 'Settlement', 'Operations'];
  const filtered = category === 'All' ? insights : insights.filter(i => i.category === category);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Insights</h1>
        <p className="text-sm text-ink-300 mt-1">Operational intelligence generated from your business data</p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/8 w-fit">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              category === c ? 'bg-violet-500/30 text-violet-300' : 'text-ink-300 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights for this category"
          message="MerchantOS is continuously monitoring your operations. Insights will appear here when patterns are detected."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
