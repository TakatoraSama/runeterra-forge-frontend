'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getCollectibleCards } from '@/lib/CardDatabase';
import DeckManager from '@/components/deck-builder/DeckManager';
import FilterBar from '@/components/deck-builder/FilterBar';
import CardCollection from '@/components/deck-builder/CardCollection';

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

export default function DeckBuildingPage() {
  const [deckName, setDeckName] = useState('New Deck');
  const [deckCards, setDeckCards] = useState<string[]>([]);
  const [savedDeckCards, setSavedDeckCards] = useState<string[]>([]);
  const [filterRegion, setFilterRegion] = useState<string[]>([]);
  const [filterCost, setFilterCost] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardWidth, setCardWidth] = useState(100);
  const filteredCards = useMemo(() => {
    const filtered = ALL_CARDS.filter(card => {
      const matchRegion = filterRegion.length === 0 || filterRegion.some(r => card.Region.includes(r));
      const matchCost =
        filterCost.length === 0 ||
        filterCost.some(c =>
          c === '6+' ? card.Cost >= 6 : c === '1' ? card.Cost <= 1 : card.Cost === Number(c),
        );
      const matchSearch =
        !searchQuery || card.Name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchCost && matchSearch;
    });
    return sortCards(filtered);
  }, [filterRegion, filterCost, searchQuery]);

  function handleToggleCard(id: string) {
    setDeckCards(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 12) {
        toast.error('Deck is full — remove a card first.');
        return prev;
      }
      return [...prev, id];
    });
  }

  function handleCancel() {
    setDeckCards(savedDeckCards);
  }

  function handleSave() {
    setSavedDeckCards(deckCards);
  }

  return (
    <div className="h-dvh flex overflow-hidden bg-bg-void text-text-primary font-body">
      {/* Centered wrapper for both panels */}
      <div className="flex mx-auto">
        {/* Left panel — Deck Manager (fixed width) */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: `${3 * cardWidth + 56}px` }}
        >
          <DeckManager
            deckName={deckName}
            deckCards={deckCards}
            allCards={ALL_CARDS}
            cardWidth={cardWidth}
            onNameChange={setDeckName}
            onToggleCard={handleToggleCard}
            onCancel={handleCancel}
            onSave={handleSave}
            onCardWidthChange={setCardWidth}
          />
        </div>

        {/* Right panel — Filter + Collection (fixed width) */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: `${6 * cardWidth * 1.2 + 92}px` }}
        >
          <FilterBar
            filterRegion={filterRegion}
            filterCost={filterCost}
            searchQuery={searchQuery}
            onRegionChange={setFilterRegion}
            onCostChange={setFilterCost}
            onSearchChange={setSearchQuery}
          />
          <CardCollection
            cards={filteredCards}
            deckCards={deckCards}
            cardWidth={cardWidth}
            onToggleCard={handleToggleCard}
          />
        </div>
      </div>
    </div>
  );
}
