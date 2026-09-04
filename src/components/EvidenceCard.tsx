import type { EvidenceCard as EvidenceCardType } from '@/types';

export function EvidenceCard({ card }: { card: EvidenceCardType }) {
  return (
    <div
      className={`glass rounded-xl p-4 transition-all duration-200 ${
        card.highlight ? 'gradient-border shadow-glow-violet' : ''
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-ink-300 mb-1.5">{card.label}</div>
      <div className={`text-lg font-bold ${card.highlight ? 'gradient-text' : 'text-white'}`}>
        {card.value}
      </div>
      {card.sublabel && (
        <div className="text-[11px] text-ink-300 mt-1">{card.sublabel}</div>
      )}
    </div>
  );
}
