export type GameScreen = 'TITLE' | 'PLAYING' | 'GAME_OVER' | 'SHOP';

export interface Skin {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
    visor: string;
    trail: string;
  };
  description: string;
}

export type ObstacleType = 'barrier' | 'spikes' | 'drone' | 'mine';

export interface Obstacle {
  id: number;
  lane: number; // 0 = Left, 1 = Center, 2 = Right
  y: number; // Vertical position along the track (travels downward)
  width: number;
  height: number;
  type: ObstacleType;
  color: string;
  speedMultiplier?: number;
  moving?: boolean;
  moveDirection?: number; // -1 or 1
  minLane?: number;
  maxLane?: number;
}

export interface Coin {
  id: number;
  lane: number; // 0, 1, 2
  y: number;
  collected: boolean;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
  growth?: number;
  shape?: 'circle' | 'streak' | 'dust';
  length?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface GameSaveData {
  highScore: number;
  coins: number;
  totalRuns: number;
  maxDistance: number;
  unlockedSkins: string[];
  selectedSkin: string;
  soundEnabled: boolean;
}
