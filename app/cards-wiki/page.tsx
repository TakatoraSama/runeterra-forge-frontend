'use client';

import { useMemo, useState } from 'react';
import { getCollectibleCards, getRelatedCards, CollectibleCard } from '@/lib/CardDatabase';
import FilterBar from '@/components/deck-builder/FilterBar';
import CardSlot from '@/components/deck-builder/CardSlot';
import CardDetailOverlay from '@/components/deck-builder/CardDetailOverlay';

const ALL_CARDS = getCollectibleCards();

function sortCards<T extends { Type: string; Name: string; Cost: number }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const aChamp = a.Type === 'Champion' ? 0 : 1;
    const bChamp = b.Type === 'Champion' ? 0 : 1;
    if (aChamp !== bChamp) return aChamp - bChamp;
    if (a.Cost !== b.Cost) return a.Cost - b.Cost;
    return a.Name.localeCompare(b.Name);
  });
}

export default function CardsWikiPage() {
  const [filterRegion, setFilterRegion] = useState<string[]>([]);
  const [filterCost, setFilterCost] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCard, setPreviewCard] = useState<CollectibleCard | null>(null);

  const filteredCards = useMemo(() => {
    const filtered = ALL_CARDS.filter(card => {
      const matchRegion = filterRegion.length === 0 || filterRegion.some(r => card.Region.includes(r));
      const matchCost =
        filterCost.length === 0 ||
        filterCost.some(c =>
          c === '6+' ? card.Cost >= 6 : c === '1' ? card.Cost <= 1 : card.Cost === Number(c),
        );
      const matchSearch = !searchQuery || card.Name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchCost && matchSearch;
    });
    return sortCards(filtered);
  }, [filterRegion, filterCost, searchQuery]);

  return (
    <div className="h-dvh flex flex-col bg-bg-void text-text-primary font-body overflow-hidden">
      {previewCard && (
        <CardDetailOverlay
          card={previewCard}
          relatedCards={getRelatedCards(previewCard.id)}
          onClose={() => setPreviewCard(null)}
        />
      )}
      <FilterBar
        filterRegion={filterRegion}
        filterCost={filterCost}
        searchQuery={searchQuery}
        onRegionChange={setFilterRegion}
        onCostChange={setFilterCost}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
        {filteredCards.length === 0 ? (
          <div className="text-center mt-20 text-text-disabled font-body text-sm">
            No cards match your filters.
          </div>
        ) : (
          <div
            className="grid gap-3 mx-auto"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', maxWidth: '1440px' }}
          >
            {filteredCards.map(card => (
              <CardSlot
                key={card.id}
                card={card}
                isInDeck={false}
                onClick={() => setPreviewCard(card)}
                onRightClick={() => setPreviewCard(card)}
                variant="collection"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
