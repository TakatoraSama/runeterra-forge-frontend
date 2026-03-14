export interface Card {
  id: string;
  name: string;
  cost: number;
  region: string;
  type: 'Unit' | 'Spell' | 'Landmark' | 'Equipment';
}

export const ALL_CARDS: Card[] = [
  // Demacia
  { id: 'demacia-01', name: 'Radiant Guardian', cost: 5, region: 'Demacia', type: 'Unit' },
  { id: 'demacia-02', name: 'Vanguard Sergeant', cost: 3, region: 'Demacia', type: 'Unit' },
  { id: 'demacia-03', name: "Judgment", cost: 6, region: 'Demacia', type: 'Spell' },

  // Noxus
  { id: 'noxus-01', name: 'Legion Rearguard', cost: 1, region: 'Noxus', type: 'Unit' },
  { id: 'noxus-02', name: 'Noxian Guillotine', cost: 3, region: 'Noxus', type: 'Spell' },
  { id: 'noxus-03', name: 'Darius', cost: 6, region: 'Noxus', type: 'Unit' },

  // Freljord
  { id: 'freljord-01', name: 'Omen Hawk', cost: 1, region: 'Freljord', type: 'Unit' },
  { id: 'freljord-02', name: 'Tryndamere', cost: 7, region: 'Freljord', type: 'Unit' },
  { id: 'freljord-03', name: 'Blighted Ravine', cost: 4, region: 'Freljord', type: 'Landmark' },

  // Piltover
  { id: 'piltover-01', name: 'Zap Sprocket', cost: 1, region: 'Piltover', type: 'Spell' },
  { id: 'piltover-02', name: 'Hexcore Foundry', cost: 4, region: 'Piltover', type: 'Landmark' },
  { id: 'piltover-03', name: 'Jayce', cost: 5, region: 'Piltover', type: 'Unit' },

  // Bilgewater
  { id: 'bilgewater-01', name: 'Gangplank', cost: 5, region: 'Bilgewater', type: 'Unit' },
  { id: 'bilgewater-02', name: 'Powder Kegs', cost: 1, region: 'Bilgewater', type: 'Spell' },
  { id: 'bilgewater-03', name: 'Dreadway', cost: 8, region: 'Bilgewater', type: 'Landmark' },

  // Ionia
  { id: 'ionia-01', name: 'Deny', cost: 3, region: 'Ionia', type: 'Spell' },
  { id: 'ionia-02', name: 'Lee Sin', cost: 6, region: 'Ionia', type: 'Unit' },
  { id: 'ionia-03', name: 'Zed', cost: 4, region: 'Ionia', type: 'Unit' },

  // Shadow Isles
  { id: 'shadow-01', name: 'Frenzied Skitterer', cost: 4, region: 'Shadow Isles', type: 'Unit' },
  { id: 'shadow-02', name: 'Harrowing', cost: 10, region: 'Shadow Isles', type: 'Spell' },
  { id: 'shadow-03', name: 'Kalista', cost: 2, region: 'Shadow Isles', type: 'Unit' },

  // Shurima
  { id: 'shurima-01', name: 'Azir', cost: 8, region: 'Shurima', type: 'Unit' },
  { id: 'shurima-02', name: 'Renekton', cost: 4, region: 'Shurima', type: 'Unit' },

  // Targon
  { id: 'targon-01', name: 'Aurelion Sol', cost: 10, region: 'Targon', type: 'Unit' },
  { id: 'targon-02', name: 'Soraka', cost: 4, region: 'Targon', type: 'Unit' },

  // Bandle City
  { id: 'bandle-01', name: 'Teemo', cost: 1, region: 'Bandle City', type: 'Unit' },
  { id: 'bandle-02', name: 'Yordle Squire', cost: 2, region: 'Bandle City', type: 'Unit' },
];

export const REGIONS = [
  'Demacia', 'Noxus', 'Freljord', 'Piltover', 'Bilgewater',
  'Ionia', 'Shadow Isles', 'Shurima', 'Targon', 'Bandle City',
];

export const COSTS = Array.from({ length: 11 }, (_, i) => i); // 0–10
