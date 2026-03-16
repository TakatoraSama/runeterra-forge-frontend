export interface VocabData {
  Description: string;
  Typo?: string[];
}

export const VOCABS: Record<string, VocabData> = {
  Play: {
    Typo: ['Play', 'Played'],
    Description: 'This card skill activates when you play a card from your hand.',
  },
  Aura: {
    Typo: ['Aura', 'Auras'],
    Description: 'This card skill always effects while the unit is on the field.',
  },
  GameStart: {
    Typo: ['Game Start'],
    Description: 'This card skill activates at the start of the game.',
  },
  GameEnd: {
    Typo: ['Game End'],
    Description: 'This card skill activates if this is in play at the end of the game.',
  },
  RoundStart: {
    Typo: ['Round Start'],
    Description: 'This card skill activates if this is in play at the start of each round.',
  },
  RoundEnd: {
    Typo: ['Round End'],
    Description: 'This card skill activates if this is in play at the end of each round.',
  },
  Swap: {
    Typo: ['Swap'],
    Description: 'Move a unit to a different lane.',
  },
  Recall: {
    Typo: ['Recall', 'Recalled'],
    Description: "Return a unit from the lane to its owner's hand.",
  },
  Updraft: {
    Typo: ['Updraft', 'Updrafted'],
    Description: 'Shuffle X rightmost card(s) from your hand into your deck and reduce their cost by 1.',
  },
  RestoredTheSunDisc: {
    Typo: ['Restored the Sun Disc'],
    Description: 'Draw 1 for each Ascended ally that is not beheld. For the rest of the game, your level 2 Ascended allies are level 3.',
  },
};
