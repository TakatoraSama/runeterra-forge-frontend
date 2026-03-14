'use client';

import { useEffect, useRef } from 'react';
import { CollectibleCard } from '@/lib/CardDatabase';
import CardSlot from './CardSlot';

interface DeckManagerProps {
  deckName: string;
  deckCards: string[];
  allCards: CollectibleCard[];
  cardWidth: number;
  onNameChange: (name: string) => void;
  onToggleCard: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onCardWidthChange: (w: number) => void;
  onRightClick?: (card: CollectibleCard) => void;
}

export default function DeckManager({
  deckName,
  deckCards,
  allCards,
  cardWidth,
  onNameChange,
  onToggleCard,
  onCancel,
  onSave,
  onCardWidthChange,
  onRightClick,
}: DeckManagerProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const h = entries[0].contentRect.height;
      const innerH = h - 32; // 16px top + bottom padding
      const cardH = (innerH - 3 * 12) / 4;
      onCardWidthChange(Math.max(60, Math.floor(cardH * 63 / 88)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onCardWidthChange]);

  const cardsInDeck = deckCards
    .map(id => allCards.find(c => c.id === id))
    .filter((c): c is CollectibleCard => c !== undefined)
    .sort((a, b) => {
      if (a.Cost !== b.Cost) return a.Cost - b.Cost;
      return a.Name.localeCompare(b.Name);
    });

  return (
    <div className="flex flex-col h-full bg-bg-panel border-r border-border-dark">
      {/* Header: title + deck name input */}
      <div className="px-4 py-3 border-b border-border-dark shrink-0">
        {/* <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'var(--color-gold-mid)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Deck Manager
        </div> */}
        <input
          type="text"
          value={deckName}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Deck Name"
          className="input-field py-2 px-3"
          style={{ fontFamily: 'var(--font-display)' }}
        />

        {/* <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-muted)',
          }}
        >
          {deckCards.length} card{deckCards.length !== 1 ? 's' : ''}
        </div> */}
      </div>

      {/* Scrollable deck card grid */}
      <div
        ref={gridContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
      >
        {cardsInDeck.length === 0 ? (
          <div className="text-center mt-12 text-text-disabled font-body text-[13px] leading-relaxed">
            No cards yet.
            <br />
            Click cards to add them.
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(3, ${cardWidth}px)` }}
          >
            {cardsInDeck.map(card => (
              <CardSlot
                key={card.id}
                card={card}
                isInDeck={false}
                onClick={() => onToggleCard(card.id)}
                onRightClick={onRightClick ? () => onRightClick(card) : undefined}
                variant="deck"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: Cancel + Save */}
      <div className="px-4 py-3 border-t border-border-dark flex gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost flex-1 py-2"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          className="btn-gold flex-1 py-2"
        >
          Save
        </button>
      </div>
    </div>
  );
}
