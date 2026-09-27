import { GameSaveData } from '../types/game';

const STORAGE_KEY = 'lastrun_gamedata_v1';

const DEFAULT_SAVE: GameSaveData = {
  highScore: 0,
  coins: 0,
  totalRuns: 0,
  maxDistance: 0,
  unlockedSkins: ['default'],
  selectedSkin: 'default',
  soundEnabled: true,
};

export const loadGameData = (): GameSaveData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      unlockedSkins: Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.includes('default')
        ? parsed.unlockedSkins
        : ['default', ...(parsed.unlockedSkins || [])],
    };
  } catch {
    return DEFAULT_SAVE;
  }
};

export const saveGameData = (data: Partial<GameSaveData>): GameSaveData => {
  try {
    const current = loadGameData();
    const updated: GameSaveData = {
      ...current,
      ...data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SAVE;
  }
};
