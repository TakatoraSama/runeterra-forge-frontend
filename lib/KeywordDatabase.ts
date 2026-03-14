export interface KeywordData {
  Description: string;
  Sprite: string;
  Stackable: boolean;
  Generatable: boolean;
  Transferable: boolean;
  Positive: boolean;
}

export const KEYWORDS: Record<string, KeywordData> = {
  Fearsome: {
    Description: '{Play} skill from enemy units with less than 3 Power cannot target this unit.',
    Sprite: '/KeywordSprites/Fearsome.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Barrier: {
    Description: 'Negates the next {Kill} effect from the enemy. Remove this keyword at the next round end.',
    Sprite: '/KeywordSprites/Barrier.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Regeneration: {
    Description: '{Round End}: Cleanses the permanent negative Power debuff.',
    Sprite: '/KeywordSprites/Regeneration.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Tough: {
    Description: 'Reduces the number of negative Power debuffs received from all sources by 1.',
    Sprite: '/KeywordSprites/Tough.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Challenger: {
    Description: 'While this keyword is active, +2 Power if enemy plays a card here. Inactivate this keyword at round end.',
    Sprite: '/KeywordSprites/Challenger.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Lifesteal: {
    Description: "When this unit decreases other cards' Power, grant this Power that much.",
    Sprite: '/KeywordSprites/Lifesteal.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Augmented: {
    Description: 'When you play a created card, grant me +1 Power.',
    Sprite: '/KeywordSprites/Augmented.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Elusive: {
    Description: 'Each round, You can {swap lane} me.',
    Sprite: '/KeywordSprites/Elusive.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Evolve: {
    Description: "I have +2 once you've had units with 4+ other unique positive keywords in play this game.",
    Sprite: '/KeywordSprites/Evolve.webp',
    Stackable: false,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Spirit: {
    Description: 'This unit has +1 Power. This keyword can stack.',
    Sprite: '/KeywordSprites/Spirit.webp',
    Stackable: true,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Impact: {
    Description: 'This lane has +1 Power. This keyword can stack.',
    Sprite: '/KeywordSprites/Impact.webp',
    Stackable: true,
    Generatable: true,
    Transferable: true,
    Positive: true,
  },
  Stun: {
    Description: 'Stunned units cannot activate their Round End, Round Start, Elusive effects. Remove this keyword at play next resolve phase.',
    Sprite: '/KeywordSprites/Stun.webp',
    Stackable: false,
    Generatable: false,
    Transferable: false,
    Positive: false,
  },
  Deep: {
    Description: "You are Deep when you're running out of deck. When that happens, grant units with the Deep keyword +3 Power.",
    Sprite: '/KeywordSprites/Deep.webp',
    Stackable: false,
    Generatable: false,
    Transferable: true,
    Positive: true,
  },
};
