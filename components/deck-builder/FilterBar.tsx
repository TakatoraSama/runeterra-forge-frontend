'use client';

import MultiSelectDropdown from './MultiSelectDropdown';
import { getAllRegions } from '@/lib/CardDatabase';

const regionSpriteMap: Record<string, string> = {
  'Demacia':       'Demacia',
  'Noxus':         'Noxus',
  'Freljord':      'Freljord',
  'Piltover':      'PiltoverZaun',
  'Piltover Zaun': 'PiltoverZaun',
  'Bilgewater':    'Bilgewater',
  'Ionia':         'Ionia',
  'Shadow Isles':  'ShadowIsles',
  'Shurima':       'Shurima',
  'Targon':        'Targon',
  'Bandle City':   'BandleCity',
  'Ixtal':         'Ixtal',
  'Void':          'Void',
  'Runeterra':     'Runeterra',
};

const regionOptions = getAllRegions().map(r => ({
  value: r,
  label: r,
  icon: regionSpriteMap[r] ? `/RegionSprites/${regionSpriteMap[r]}.webp` : undefined,
}));

const costOptions = [
  { value: '1',  label: '1' },
  { value: '2',  label: '2' },
  { value: '3',  label: '3' },
  { value: '4',  label: '4' },
  { value: '5',  label: '5' },
  { value: '6+', label: '6+' },
];

interface FilterBarProps {
  filterRegion: string[];
  filterCost: string[];
  searchQuery: string;
  onRegionChange: (v: string[]) => void;
  onCostChange: (v: string[]) => void;
  onSearchChange: (v: string) => void;
}

export default function FilterBar({
  filterRegion,
  filterCost,
  searchQuery,
  onRegionChange,
  onCostChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-panel border-b border-border-dark shrink-0 z-10">
      <MultiSelectDropdown
        options={regionOptions}
        values={filterRegion}
        onChange={onRegionChange}
        placeholder="All Regions"
      />

      <MultiSelectDropdown
        options={costOptions}
        values={filterCost}
        onChange={onCostChange}
        placeholder="All Costs"
      />

      {/* Search input */}
      <div className="relative flex-1">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <circle cx="6" cy="6" r="4.5" stroke="var(--color-text-disabled)" strokeWidth="1.5" />
          <path d="M9.5 9.5L12.5 12.5" stroke="var(--color-text-disabled)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="input-field py-1.5 pl-8 pr-3"
        />
      </div>
    </div>
  );
}
