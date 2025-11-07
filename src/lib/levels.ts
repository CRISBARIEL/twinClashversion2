export interface LevelConfig {
  world: number;
  level: number;
  pairs: number;
  timeLimit: number;
  theme: string;
  unlockReward: number;
}

export const LEVELS: Record<number, LevelConfig> = {
  1: { world: 1, level: 1, pairs: 6, timeLimit: 60, theme: 'nature', unlockReward: 10 },
  2: { world: 1, level: 2, pairs: 7, timeLimit: 55, theme: 'nature', unlockReward: 12 },
  3: { world: 1, level: 3, pairs: 8, timeLimit: 52, theme: 'nature', unlockReward: 15 },
  4: { world: 1, level: 4, pairs: 9, timeLimit: 48, theme: 'nature', unlockReward: 18 },
  5: { world: 1, level: 5, pairs: 10, timeLimit: 45, theme: 'nature', unlockReward: 100 },

  6: { world: 2, level: 1, pairs: 8, timeLimit: 55, theme: 'sports', unlockReward: 15 },
  7: { world: 2, level: 2, pairs: 9, timeLimit: 52, theme: 'sports', unlockReward: 18 },
  8: { world: 2, level: 3, pairs: 10, timeLimit: 48, theme: 'sports', unlockReward: 20 },
  9: { world: 2, level: 4, pairs: 11, timeLimit: 44, theme: 'sports', unlockReward: 25 },
  10: { world: 2, level: 5, pairs: 12, timeLimit: 40, theme: 'sports', unlockReward: 120 },

  11: { world: 3, level: 1, pairs: 10, timeLimit: 50, theme: 'arcade', unlockReward: 20 },
  12: { world: 3, level: 2, pairs: 11, timeLimit: 47, theme: 'arcade', unlockReward: 22 },
  13: { world: 3, level: 3, pairs: 12, timeLimit: 44, theme: 'arcade', unlockReward: 25 },
  14: { world: 3, level: 4, pairs: 13, timeLimit: 40, theme: 'arcade', unlockReward: 30 },
  15: { world: 3, level: 5, pairs: 14, timeLimit: 35, theme: 'arcade', unlockReward: 150 },

  16: { world: 4, level: 1, pairs: 12, timeLimit: 45, theme: 'animals', unlockReward: 30 },
  17: { world: 4, level: 2, pairs: 13, timeLimit: 42, theme: 'animals', unlockReward: 35 },
  18: { world: 4, level: 3, pairs: 14, timeLimit: 38, theme: 'animals', unlockReward: 40 },
  19: { world: 4, level: 4, pairs: 15, timeLimit: 34, theme: 'animals', unlockReward: 45 },
  20: { world: 4, level: 5, pairs: 16, timeLimit: 30, theme: 'animals', unlockReward: 200 },

  21: { world: 5, level: 1, pairs: 14, timeLimit: 40, theme: 'space', unlockReward: 50 },
  22: { world: 5, level: 2, pairs: 15, timeLimit: 36, theme: 'space', unlockReward: 60 },
  23: { world: 5, level: 3, pairs: 16, timeLimit: 32, theme: 'space', unlockReward: 70 },
  24: { world: 5, level: 4, pairs: 17, timeLimit: 28, theme: 'space', unlockReward: 80 },
  25: { world: 5, level: 5, pairs: 18, timeLimit: 25, theme: 'space', unlockReward: 500 },

  26: { world: 6, level: 1, pairs: 16, timeLimit: 38, theme: 'ocean', unlockReward: 70 },
  27: { world: 6, level: 2, pairs: 17, timeLimit: 34, theme: 'ocean', unlockReward: 80 },
  28: { world: 6, level: 3, pairs: 18, timeLimit: 30, theme: 'ocean', unlockReward: 90 },
  29: { world: 6, level: 4, pairs: 19, timeLimit: 26, theme: 'ocean', unlockReward: 100 },
  30: { world: 6, level: 5, pairs: 20, timeLimit: 22, theme: 'ocean', unlockReward: 600 },

  31: { world: 7, level: 1, pairs: 18, timeLimit: 36, theme: 'food', unlockReward: 90 },
  32: { world: 7, level: 2, pairs: 19, timeLimit: 32, theme: 'food', unlockReward: 100 },
  33: { world: 7, level: 3, pairs: 20, timeLimit: 28, theme: 'food', unlockReward: 110 },
  34: { world: 7, level: 4, pairs: 21, timeLimit: 24, theme: 'food', unlockReward: 120 },
  35: { world: 7, level: 5, pairs: 22, timeLimit: 20, theme: 'food', unlockReward: 700 },

  36: { world: 8, level: 1, pairs: 20, timeLimit: 34, theme: 'music', unlockReward: 110 },
  37: { world: 8, level: 2, pairs: 21, timeLimit: 30, theme: 'music', unlockReward: 120 },
  38: { world: 8, level: 3, pairs: 22, timeLimit: 26, theme: 'music', unlockReward: 130 },
  39: { world: 8, level: 4, pairs: 23, timeLimit: 22, theme: 'music', unlockReward: 140 },
  40: { world: 8, level: 5, pairs: 24, timeLimit: 18, theme: 'music', unlockReward: 800 },

  41: { world: 9, level: 1, pairs: 22, timeLimit: 32, theme: 'beauty', unlockReward: 130 },
  42: { world: 9, level: 2, pairs: 23, timeLimit: 28, theme: 'beauty', unlockReward: 140 },
  43: { world: 9, level: 3, pairs: 24, timeLimit: 24, theme: 'beauty', unlockReward: 150 },
  44: { world: 9, level: 4, pairs: 25, timeLimit: 20, theme: 'beauty', unlockReward: 160 },
  45: { world: 9, level: 5, pairs: 26, timeLimit: 16, theme: 'beauty', unlockReward: 900 },

  46: { world: 10, level: 1, pairs: 24, timeLimit: 30, theme: 'tech', unlockReward: 150 },
  47: { world: 10, level: 2, pairs: 25, timeLimit: 26, theme: 'tech', unlockReward: 160 },
  48: { world: 10, level: 3, pairs: 26, timeLimit: 22, theme: 'tech', unlockReward: 170 },
  49: { world: 10, level: 4, pairs: 27, timeLimit: 18, theme: 'tech', unlockReward: 180 },
  50: { world: 10, level: 5, pairs: 28, timeLimit: 15, theme: 'tech', unlockReward: 1000 },
};

export function getLevelConfig(levelId: number): LevelConfig | undefined {
  return LEVELS[levelId];
}

export function getLevelsByWorld(worldId: number): LevelConfig[] {
  return Object.values(LEVELS)
    .filter(l => l.world === worldId)
    .sort((a, b) => a.level - b.level);
}

export function getGlobalLevelId(world: number, level: number): number {
  return (world - 1) * 5 + level;
}
