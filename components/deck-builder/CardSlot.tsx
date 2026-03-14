'use client';

import { CollectibleCard, toWebSpritePath } from '@/lib/CardDatabase';
import GameCard from '@/components/deck-builder/Card';

interface CardSlotProps {
  card: CollectibleCard;
  isInDeck: boolean;
  onClick: () => void;
  onRightClick?: () => void;
  variant: 'collection' | 'deck';
}

export default function CardSlot({ card, isInDeck, onClick, onRightClick, variant }: CardSlotProps) {
  return (
    <div onContextMenu={onRightClick ? (e) => { e.preventDefault(); onRightClick(); } : undefined}>
      <GameCard
        name={card.Name}
        cost={card.Cost}
        power={card.Type !== 'Landmark' ? card.Power : undefined}
        subType={card.SubType || undefined}
        skill={card.Skill || undefined}
        levelUp={card.LevelUp || undefined}
        keywords={card.Keyword}
        regions={card.Region}
        balanceValues={card.BalanceValues}
        artUrl={toWebSpritePath(card.Sprite)}
        isInDeck={isInDeck}
        onClick={onClick}
        width="100%"
        layout={variant === 'deck' ? 'full' : 'full'}
      />
    </div>
  );
}
