'use client';

import { CollectibleCard } from '@/lib/CardDatabase';
import CardSlot from './CardSlot';

interface CardCollectionProps {
  cards: CollectibleCard[];
  deckCards: string[];
  cardWidth: number;
  onToggleCard: (id: string) => void;
  onRightClick?: (card: CollectibleCard) => void;
}

export default function CardCollection({ cards, deckCards, cardWidth, onToggleCard, onRightClick }: CardCollectionProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
      {cards.length === 0 ? (
        <div className="text-center mt-20 text-text-disabled font-body text-sm">
          No cards match your filters.
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(6, ${cardWidth * 1.2}px)` }}
        >
          {cards.map(card => (
            <CardSlot
              key={card.id}
              card={card}
              isInDeck={deckCards.includes(card.id)}
              onClick={() => onToggleCard(card.id)}
              onRightClick={onRightClick ? () => onRightClick(card) : undefined}
              variant="collection"
            />
          ))}
        </div>
      )}
    </div>
  );
}
