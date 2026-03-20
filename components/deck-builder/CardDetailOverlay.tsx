'use client';

import { useEffect, useState } from 'react';
import { CollectibleCard, toWebSpritePath } from '@/lib/CardDatabase';
import Card from '@/components/deck-builder/Card';

interface CardDetailOverlayProps {
  card: CollectibleCard;
  relatedCards: CollectibleCard[];
  onClose: () => void;
}

export default function CardDetailOverlay({ card, relatedCards, onClose }: CardDetailOverlayProps) {
  const cards = [card, ...relatedCards];
  const [index, setIndex] = useState(0);
  const current = cards[index];
  const hasMultiple = cards.length > 1;

  // Reset index when the root card changes
  useEffect(() => { setIndex(0); }, [card.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) setIndex(i => (i - 1 + cards.length) % cards.length);
      if (e.key === 'ArrowRight' && hasMultiple) setIndex(i => (i + 1) % cards.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, hasMultiple, cards.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Card + navigation row */}
      <div
        className="flex items-center gap-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Prev button */}
        <button
          type="button"
          aria-label="Previous card"
          onClick={() => setIndex(i => (i - 1 + cards.length) % cards.length)}
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-black/60 text-white text-2xl hover:bg-black/80 transition-colors ${!hasMultiple ? 'invisible' : ''}`}
        >
          ‹
        </button>

        {/* Card + dots */}
        <div className="flex flex-col items-center gap-4">
          <Card
            name={current.Name}
            cost={current.Cost}
            power={current.Type !== 'Landmark' && current.Type !== 'Spell' ? current.Power : undefined}
            subType={current.SubType || undefined}
            skill={current.Skill || undefined}
            levelUp={current.LevelUp || undefined}
            keywords={current.Keyword}
            regions={current.Region}
            balanceValues={current.BalanceValues}
            artUrl={toWebSpritePath(current.Sprite)}
            width={400}
            layout="full"
            type={current.Type}
          />

          {/* Dot indicators */}
          {hasMultiple && (
            <div className="flex gap-2">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`View ${c.Name}`}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Next button */}
        <button
          type="button"
          aria-label="Next card"
          onClick={() => setIndex(i => (i + 1) % cards.length)}
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-black/60 text-white text-2xl hover:bg-black/80 transition-colors ${!hasMultiple ? 'invisible' : ''}`}
        >
          ›
        </button>
      </div>
    </div>
  );
}
