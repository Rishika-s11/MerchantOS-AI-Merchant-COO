import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { answerQuery, SUGGESTED_QUESTIONS, type AIQueryResult } from '@/lib/ai';
import { AIStatus } from '@/components/AIStatus';
import { Sparkles, Send, Loader2, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

interface ChatMessage {
  question: string;
  result: AIQueryResult;
}

export function AIChatPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { transactions, settlements, customers, dashboard } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleQuery = (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setInput('');

    setTimeout(() => {
      const result = answerQuery(q, transactions, settlements, customers, dashboard);
      setMessages((prev) => [...prev, { question: q, result }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-5 animate-fade-in h-full flex flex-col">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Ask MerchantOS</h1>
            <p className="text-sm text-ink-300">Ask questions about your business, payments and operations.</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !loading && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AIStatus state="monitoring" />
            </div>
            <p className="text-sm text-ink-300 mb-4">I'm continuously monitoring your business operations. Ask me anything about your data — I'll answer using your actual transaction, revenue, and settlement data.</p>
            <div className="text-[10px] uppercase tracking-wider text-ink-300 font-semibold mb-3">Suggested Questions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuery(q)}
                  className="glass glass-hover rounded-lg p-3 text-left text-sm text-ink-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <ChevronRight size={14} className="text-ink-300 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="space-y-3 animate-fade-in">
            {/* Question */}
            <div className="flex justify-end">
              <div className="glass rounded-xl px-4 py-3 max-w-md">
                <p className="text-sm text-white">{msg.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 max-w-2xl space-y-3">
                {/* Answer */}
                <div className="relative gradient-border rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold mb-2">Answer</div>
                  <p className="text-sm text-white leading-relaxed">{msg.result.answer}</p>
                </div>

                {/* Evidence */}
                {msg.result.evidence.length > 0 && (
                  <div className="glass rounded-xl p-4">
                    <div className="text-[10px] uppercase tracking-wider text-ink-300 font-semibold mb-2">Evidence</div>
                    <div className="space-y-1.5">
                      {msg.result.evidence.map((ev, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-xs text-ink-300">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact + Recommendation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={12} className="text-warning-400" />
                      <div className="text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Impact</div>
                    </div>
                    <p className="text-sm text-white">{msg.result.impact}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb size={12} className="text-violet-400" />
                      <div className="text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Recommended Next Step</div>
                    </div>
                    <p className="text-sm text-white">{msg.result.recommendation}</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-violet-400" />
                    <span className="text-[10px] uppercase tracking-wider text-ink-300 font-semibold">Confidence</span>
                    <span className="text-xs font-bold text-violet-400">{msg.result.confidence}%</span>
                  </div>
                  {(msg.result.recommendation.toLowerCase().includes('investigate') || msg.result.recommendation.toLowerCase().includes('review')) && (
                    <button
                      onClick={() => onNavigate('alerts')}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      Take action <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="text-white animate-spin" />
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <AIStatus state="analyzing" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0">
        <div className="glass rounded-xl p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(input); }}
            placeholder="Ask about your business, payments, revenue..."
            className="input-field flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent border-0 focus:ring-0"
          />
          <button
            onClick={() => handleQuery(input)}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
