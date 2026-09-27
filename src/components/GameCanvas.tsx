import React, { useEffect, useRef, useCallback } from 'react';
import { Coin, FloatingText, Obstacle, Particle, Skin } from '../types/game';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  skin: Skin;
  highScore: number;
  onScoreUpdate: (score: number, coins: number, distance: number, level: number) => void;
  onGameOver: (finalScore: number, coinsEarned: number, distance: number, isNewRecord: boolean) => void;
  onNewRecord: () => void;
  isPaused?: boolean;
  registerControls?: (controls: { moveLeft: () => void; moveRight: () => void }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  skin,
  highScore,
  onScoreUpdate,
  onGameOver,
  onNewRecord,
  isPaused = false,
  registerControls,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game internal state stored in refs for maximum 60fps performance without React re-render lag
  const gameStateRef = useRef({
    lane: 1, // 0: Left, 1: Center, 2: Right
    currentX: 0,
    targetX: 0,
    playerY: 0,
    playerWidth: 44,
    playerHeight: 64,
    speed: 340, // px per second
    baseSpeed: 340,
    score: 0,
    coinsEarned: 0,
    distance: 0,
    level: 1,
    gameOver: false,
    newRecordTriggered: false,
    shakeDuration: 0,
    shakeIntensity: 0,
    invulnerableTimer: 0,
    levelBanner: { text: '', alpha: 0 },
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const trackOffsetRef = useRef(0);
  const nextObstacleIdRef = useRef(1);
  const nextCoinIdRef = useRef(1);
  const nextTextIdRef = useRef(1);
  const lastObstacleSpawnRef = useRef(0);
  const lastCoinSpawnRef = useRef(0);

  // Swipe handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Lane movement with sound and clamp
  const changeLane = useCallback(
    (direction: -1 | 1) => {
      if (gameStateRef.current.gameOver) return;
      const currentLane = gameStateRef.current.lane;
      const nextLane = Math.max(0, Math.min(2, currentLane + direction));
      if (nextLane !== currentLane) {
        gameStateRef.current.lane = nextLane;
        soundManager.playDodge();
      }
    },
    []
  );

  const setLaneDirect = useCallback((targetLane: number) => {
    if (gameStateRef.current.gameOver) return;
    const clamped = Math.max(0, Math.min(2, targetLane));
    if (clamped !== gameStateRef.current.lane) {
      gameStateRef.current.lane = clamped;
      soundManager.playDodge();
    }
  }, []);

  const moveLeft = useCallback(() => changeLane(-1), [changeLane]);
  const moveRight = useCallback(() => changeLane(1), [changeLane]);

  // Expose controls to parent component for large HUD buttons
  useEffect(() => {
    if (registerControls) {
      registerControls({ moveLeft, moveRight });
    }
  }, [registerControls, moveLeft, moveRight]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Canvas sizing
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Position player at bottom 24% of screen
      gameStateRef.current.playerY = rect.height * 0.76;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial lane positions
    const getLaneX = (lane: number, width: number) => {
      const trackPadding = width * 0.08;
      const trackWidth = width - trackPadding * 2;
      const laneWidth = trackWidth / 3;
      return trackPadding + laneWidth * (lane + 0.5);
    };

    // Helper to spawn floating text
    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTextsRef.current.push({
        id: nextTextIdRef.current++,
        x,
        y,
        text,
        color,
        alpha: 1,
        life: 0,
      });
    };

    // Helper to spawn explosion / trail particles
    const addParticles = (x: number, y: number, count: number, color: string, speedSpread: number = 180) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (Math.random() * 0.7 + 0.3) * speedSpread;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color,
          alpha: 1,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.4,
          size: 2 + Math.random() * 3.5,
        });
      }
    };

    // Spawner for obstacles with guaranteed solvability
    const spawnObstacles = (rectWidth: number, currentLevel: number) => {
      const laneWidth = (rectWidth * 0.84) / 3;
      const obsWidth = Math.min(laneWidth * 0.76, 56);
      const obsHeight = 32;

      // Determine how many obstacles to spawn
      // Level 1: 1 obstacle
      // Level 2: 1 obstacle
      // Level 3+: 1 or 2 obstacles (NEVER 3 - at least one lane is ALWAYS open)
      const allowDouble = currentLevel >= 3 && Math.random() < Math.min(0.45, 0.2 + currentLevel * 0.05);

      if (allowDouble) {
        // Pick one guaranteed open lane (0, 1, or 2)
        const openLane = Math.floor(Math.random() * 3);
        const lanesToBlock = [0, 1, 2].filter((l) => l !== openLane);

        lanesToBlock.forEach((lane) => {
          obstaclesRef.current.push({
            id: nextObstacleIdRef.current++,
            lane,
            y: -obsHeight - 20,
            width: obsWidth,
            height: obsHeight,
            type: Math.random() > 0.5 ? 'barrier' : 'spikes',
            color: '#ef4444',
          });
        });
      } else {
        const lane = Math.floor(Math.random() * 3);
        const isDrone = currentLevel >= 4 && Math.random() < 0.35;
        const isSpike = Math.random() < 0.4;

        obstaclesRef.current.push({
          id: nextObstacleIdRef.current++,
          lane,
          y: -obsHeight - 20,
          width: obsWidth,
          height: obsHeight,
          type: isDrone ? 'drone' : isSpike ? 'spikes' : 'barrier',
          color: isDrone ? '#a855f7' : isSpike ? '#f97316' : '#ef4444',
          moving: isDrone,
          moveDirection: Math.random() > 0.5 ? 1 : -1,
          speedMultiplier: isDrone ? 1.1 : 1.0,
        });
      }
    };

    // Spawner for coins (single or small stream)
    const spawnCoins = (rectWidth: number) => {
      const streamCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 coins
      const lane = Math.floor(Math.random() * 3);
      const spacing = 52;

      for (let i = 0; i < streamCount; i++) {
        coinsRef.current.push({
          id: nextCoinIdRef.current++,
          lane,
          y: -30 - i * spacing,
          collected: false,
          pulsePhase: Math.random() * Math.PI,
        });
      }
    };

    // Game loop step
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // clamp delta
      lastTime = timestamp;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (!isPaused && !gameStateRef.current.gameOver) {
        const state = gameStateRef.current;

        // 1. Progression & Level Difficulty
        // Level 1: 0 - 300
        // Level 2: 300 - 750
        // Level 3: 750 - 1500
        // Level 4: 1500 - 2500
        // Level 5+: 2500+
        const prevLevel = state.level;
        if (state.score < 300) {
          state.level = 1;
          state.speed = 340;
        } else if (state.score < 750) {
          state.level = 2;
          state.speed = 410;
        } else if (state.score < 1500) {
          state.level = 3;
          state.speed = 475;
        } else if (state.score < 2500) {
          state.level = 4;
          state.speed = 540;
        } else {
          state.level = 5 + Math.floor((state.score - 2500) / 2000);
          state.speed = Math.min(640, 570 + (state.level - 5) * 15);
        }

        if (state.level > prevLevel) {
          soundManager.playLevelUp();
          state.levelBanner = {
            text: `NÍVEL ${state.level} · VELOCIDADE ${Math.round(state.speed)} KM/H`,
            alpha: 1,
          };
          addFloatingText(width * 0.5, height * 0.35, `NÍVEL ${state.level}!`, '#38bdf8');
        }

        // Distance & continuous score
        const distDelta = (state.speed * dt) / 10;
        state.distance += distDelta;
        state.score += Math.round(dt * (10 + state.level * 2));

        // High score trigger during gameplay
        if (highScore > 0 && state.score > highScore && !state.newRecordTriggered) {
          state.newRecordTriggered = true;
          soundManager.playNewRecord();
          onNewRecord();
          addFloatingText(width * 0.5, height * 0.4, 'NOVO RECORDE!', '#fbbf24');
        }

        // Sync HUD updates
        onScoreUpdate(state.score, state.coinsEarned, Math.floor(state.distance), state.level);

        // Track vertical scrolling offset
        trackOffsetRef.current = (trackOffsetRef.current + state.speed * dt) % 80;

        // Player lateral interpolation
        state.targetX = getLaneX(state.lane, width);
        const prevX = state.currentX;
        if (state.currentX === 0) {
          state.currentX = state.targetX;
        } else {
          state.currentX += (state.targetX - state.currentX) * 0.28;
        }
        const lateralDelta = state.currentX - prevX;
        const isTurning = Math.abs(lateralDelta) > 0.8;

        // Speed ratio (1.0 at base speed 340, up to ~1.9 at top speeds)
        const speedRatio = state.speed / state.baseSpeed;

        // ============================================
        // DUST & TRAIL PARTICLE EMITTER
        // ============================================

        // 1. Ground Dust Puffs (Poeira no asfalto que se intensifica com a velocidade)
        // Spawn rate scales with speed: Level 1 spawns 1 puff regularly, higher levels spawn dense clouds
        const dustChance = 0.5 + Math.min(0.5, (speedRatio - 1) * 0.6);
        if (Math.random() < dustChance) {
          const dustCount = Math.floor(1 + (speedRatio - 1) * 1.8) + (isTurning ? 1 : 0);
          for (let d = 0; d < dustCount; d++) {
            // Emitted from ground contact behind left or right hover skirts
            const side = Math.random() > 0.5 ? 1 : -1;
            const dustX = state.currentX + side * (state.playerWidth * 0.32 + Math.random() * 4);
            const dustY = state.playerY + state.playerHeight * 0.38 + Math.random() * 4;

            // Lateral drift kick (extra drift burst when changing lanes)
            const skidDrift = isTurning ? -Math.sign(lateralDelta) * (35 + Math.random() * 35) : (Math.random() - 0.5) * 20;

            particlesRef.current.push({
              x: dustX,
              y: dustY,
              vx: skidDrift,
              vy: state.speed * (0.85 + Math.random() * 0.2), // Moves back at pavement speed
              color: Math.random() > 0.4 ? '#94a3b8' : '#cbd5e1',
              alpha: 0.38 + Math.min(0.25, (speedRatio - 1) * 0.25),
              life: 0,
              maxLife: 0.35 + Math.random() * 0.25,
              size: (3 + Math.random() * 2.5) * (0.9 + speedRatio * 0.25),
              growth: 24 + speedRatio * 16, // Expands as it dissipates into the wind
              shape: 'dust',
            });
          }
        }

        // 2. High-Speed Thruster Ion Trails & Sparks (Rastro luminoso dos propulsores)
        const trailFrequency = 0.8 + Math.min(0.2, (speedRatio - 1) * 0.3);
        if (Math.random() < trailFrequency) {
          const numStreaks = Math.floor(1 + (speedRatio - 1) * 1.5);
          for (let s = 0; s < numStreaks; s++) {
            const side = Math.random() > 0.5 ? -1 : 1;
            const thrusterX = state.currentX + side * (state.playerWidth * 0.27) + (Math.random() - 0.5) * 3;
            const thrusterY = state.playerY + state.playerHeight * 0.42;

            // Trail streak elongates with vehicle velocity
            const streakLen = (10 + Math.random() * 12) * speedRatio;

            particlesRef.current.push({
              x: thrusterX,
              y: thrusterY,
              vx: (Math.random() - 0.5) * 12 + (isTurning ? -Math.sign(lateralDelta) * 15 : 0),
              vy: state.speed * (0.95 + Math.random() * 0.25),
              color: Math.random() > 0.25 ? skin.colors.glow : skin.colors.primary,
              alpha: 0.9,
              life: 0,
              maxLife: 0.2 + (speedRatio - 1) * 0.08,
              size: 2 + Math.random() * 1.8,
              shape: 'streak',
              length: streakLen,
            });
          }
        }

        // 3. Aerodynamic Speed Streaks (Efeito de rastro de vento em altas velocidades)
        if (speedRatio > 1.25 && Math.random() < (speedRatio - 1.25) * 0.7) {
          const wingSide = Math.random() > 0.5 ? 1 : -1;
          const wingX = state.currentX + wingSide * (state.playerWidth * 0.45);
          particlesRef.current.push({
            x: wingX,
            y: state.playerY - state.playerHeight * 0.15 + Math.random() * 15,
            vx: (Math.random() - 0.5) * 6,
            vy: state.speed * 1.05,
            color: '#e2e8f0',
            alpha: 0.5,
            life: 0,
            maxLife: 0.16,
            size: 1.5,
            shape: 'streak',
            length: 18 + speedRatio * 18,
          });
        }

        // Spawning Obstacles
        const obstacleInterval = Math.max(0.78, 1.65 - state.level * 0.14);
        if (timestamp - lastObstacleSpawnRef.current > obstacleInterval * 1000) {
          spawnObstacles(width, state.level);
          lastObstacleSpawnRef.current = timestamp;
        }

        // Spawning Coins
        const coinInterval = Math.max(1.1, 2.2 - state.level * 0.1);
        if (timestamp - lastCoinSpawnRef.current > coinInterval * 1000) {
          spawnCoins(width);
          lastCoinSpawnRef.current = timestamp;
        }

        // Update Obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          const obsSpeed = state.speed * (obs.speedMultiplier || 1);
          obs.y += obsSpeed * dt;

          // Drone movement
          if (obs.moving && obs.moveDirection) {
            // Sway lane
            const currentLaneX = getLaneX(obs.lane, width);
            const targetLaneX = getLaneX(obs.lane + obs.moveDirection, width);
            if (targetLaneX < width * 0.1 || targetLaneX > width * 0.9) {
              obs.moveDirection = -obs.moveDirection as 1 | -1;
            }
          }

          // Check Collision with player
          // Precise rectangular hitbox with slight forgiveness
          const obsX = getLaneX(obs.lane, width);
          const pLeft = state.currentX - state.playerWidth * 0.36;
          const pRight = state.currentX + state.playerWidth * 0.36;
          const pTop = state.playerY - state.playerHeight * 0.38;
          const pBottom = state.playerY + state.playerHeight * 0.38;

          const oLeft = obsX - obs.width * 0.45;
          const oRight = obsX + obs.width * 0.45;
          const oTop = obs.y - obs.height * 0.45;
          const oBottom = obs.y + obs.height * 0.45;

          const hit = pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom;

          if (hit && !state.gameOver) {
            // GAME OVER TRIGGER
            state.gameOver = true;
            state.shakeDuration = 0.45;
            state.shakeIntensity = 14;

            soundManager.playCrash();
            addParticles(state.currentX, state.playerY, 40, '#ef4444', 320);
            addParticles(state.currentX, state.playerY, 25, skin.colors.glow, 280);

            const isRecord = state.score > highScore;
            onGameOver(state.score, state.coinsEarned, Math.floor(state.distance), isRecord);
            break;
          }

          // Remove offscreen obstacles
          if (obs.y > height + 80) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Update Coins
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
          const coin = coinsRef.current[i];
          coin.y += state.speed * dt;
          coin.pulsePhase += dt * 6;

          // Check pickup
          if (!coin.collected) {
            const coinX = getLaneX(coin.lane, width);
            const dx = Math.abs(state.currentX - coinX);
            const dy = Math.abs(state.playerY - coin.y);

            // Pickup radius
            if (dx < 36 && dy < 38) {
              coin.collected = true;
              state.coinsEarned += 1;
              state.score += 50;
              soundManager.playCoin();
              addFloatingText(coinX, coin.y - 12, '+50', '#fbbf24');
              addParticles(coinX, coin.y, 12, '#fbbf24', 140);
              coinsRef.current.splice(i, 1);
              continue;
            }
          }

          if (coin.y > height + 40) {
            coinsRef.current.splice(i, 1);
          }
        }

        // Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.life += dt;
          if (p.life >= p.maxLife) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.growth) {
            p.size += p.growth * dt;
          }
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }

        // Update Floating Texts
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const ft = floatingTextsRef.current[i];
          ft.life += dt;
          ft.y -= dt * 45;
          ft.alpha = Math.max(0, 1 - ft.life / 0.8);
          if (ft.life >= 0.8) {
            floatingTextsRef.current.splice(i, 1);
          }
        }

        // Level Banner fade
        if (state.levelBanner.alpha > 0) {
          state.levelBanner.alpha = Math.max(0, state.levelBanner.alpha - dt * 0.45);
        }
      }

      // Camera Shake
      let offsetX = 0;
      let offsetY = 0;
      if (gameStateRef.current.shakeDuration > 0) {
        gameStateRef.current.shakeDuration -= dt;
        const intensity = gameStateRef.current.shakeIntensity * (gameStateRef.current.shakeDuration / 0.45);
        offsetX = (Math.random() - 0.5) * intensity;
        offsetY = (Math.random() - 0.5) * intensity;
      }

      // ============================================
      // RENDERING CANVAS
      // ============================================
      ctx.save();
      ctx.translate(offsetX, offsetY);

      // 1. Dark Road Backdrop
      ctx.fillStyle = '#070a11';
      ctx.fillRect(0, 0, width, height);

      // Track area boundaries
      const trackPadding = width * 0.08;
      const trackWidth = width - trackPadding * 2;
      const laneWidth = trackWidth / 3;

      // Track surface
      const roadGrad = ctx.createLinearGradient(0, 0, 0, height);
      roadGrad.addColorStop(0, '#0c1322');
      roadGrad.addColorStop(1, '#080d18');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(trackPadding, 0, trackWidth, height);

      // Track side curbs (Glowing Cyber Guardrails)
      const curbWidth = 4;
      // Left Guardrail
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(trackPadding - curbWidth, 0, curbWidth, height);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(trackPadding - curbWidth, 0, 2, height);
      ctx.shadowBlur = 0;

      // Right Guardrail
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(trackPadding + trackWidth, 0, curbWidth, height);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(trackPadding + trackWidth + 2, 0, 2, height);
      ctx.shadowBlur = 0;

      // Moving Dashed Lane Dividers
      const dashLength = 34;
      const gapLength = 46;
      const totalDashCycle = dashLength + gapLength;
      const offset = trackOffsetRef.current % totalDashCycle;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 2;
      ctx.setLineDash([dashLength, gapLength]);
      ctx.lineDashOffset = -offset;

      // Divider 1 (between lane 0 and 1)
      ctx.beginPath();
      ctx.moveTo(trackPadding + laneWidth, -totalDashCycle);
      ctx.lineTo(trackPadding + laneWidth, height + totalDashCycle);
      ctx.stroke();

      // Divider 2 (between lane 1 and 2)
      ctx.beginPath();
      ctx.moveTo(trackPadding + laneWidth * 2, -totalDashCycle);
      ctx.lineTo(trackPadding + laneWidth * 2, height + totalDashCycle);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dash

      // Speed grid / horizon lines (Cyber sensation)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 1;
      for (let y = offset; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(trackPadding, y);
        ctx.lineTo(trackPadding + trackWidth, y);
        ctx.stroke();
      }

      // 2. Render Coins (Golden 3D spinning projection)
      coinsRef.current.forEach((coin) => {
        const coinX = getLaneX(coin.lane, width);
        const squash = Math.abs(Math.cos(coin.pulsePhase)); // horizontal 3D flip
        const coinRadius = 14;

        ctx.save();
        ctx.translate(coinX, coin.y);

        // Glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;

        // Outer coin edge
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(3, coinRadius * squash), coinRadius, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Inner core
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(2, (coinRadius - 3) * squash), coinRadius - 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();

        // Hexagon / diamond symbol
        if (squash > 0.4) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(0, 0, 3 * squash, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 3. Render Obstacles
      obstaclesRef.current.forEach((obs) => {
        const obsX = getLaneX(obs.lane, width);
        ctx.save();
        ctx.translate(obsX, obs.y);

        if (obs.type === 'barrier') {
          // Industrial cyber barricade
          ctx.shadowColor = obs.color;
          ctx.shadowBlur = 12;

          // Main heavy bar
          ctx.fillStyle = '#18181b';
          ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

          // Yellow/orange warning stripes
          ctx.fillStyle = obs.color;
          const stripeW = 8;
          for (let sx = -obs.width / 2; sx < obs.width / 2; sx += stripeW * 2) {
            ctx.beginPath();
            ctx.moveTo(sx, -obs.height / 2);
            ctx.lineTo(sx + stripeW, -obs.height / 2);
            ctx.lineTo(sx + stripeW + 6, obs.height / 2);
            ctx.lineTo(sx + 6, obs.height / 2);
            ctx.fill();
          }

          // Blinking warning beacon in center
          const pulse = Math.sin(performance.now() * 0.012) > 0;
          ctx.fillStyle = pulse ? '#ffedd5' : '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          // Border outline
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        } else if (obs.type === 'spikes') {
          // Spike trap
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;

          // Base plate
          ctx.fillStyle = '#27272a';
          ctx.fillRect(-obs.width / 2, obs.height * 0.1, obs.width, obs.height * 0.4);

          // 3 triangular spikes
          ctx.fillStyle = '#f97316';
          const numSpikes = 3;
          const spikeSpacing = obs.width / numSpikes;
          for (let s = 0; s < numSpikes; s++) {
            const sx = -obs.width / 2 + s * spikeSpacing + spikeSpacing / 2;
            ctx.beginPath();
            ctx.moveTo(sx - spikeSpacing * 0.35, obs.height * 0.2);
            ctx.lineTo(sx, -obs.height * 0.5);
            ctx.lineTo(sx + spikeSpacing * 0.35, obs.height * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffedd5';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else {
          // Patrol Drone / Mine
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 14;

          // Rotating hover drone
          const rot = performance.now() * 0.003;
          ctx.rotate(rot);

          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Outer spikes
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Core
          ctx.fillStyle = '#e879f9';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 4. Render Particles (Dust puffs, speed streaks, and sparks)
      particlesRef.current.forEach((p) => {
        ctx.save();

        if (p.shape === 'dust') {
          // Ground Dust Puffs: Soft, feathered expanding smoke puff
          ctx.globalAlpha = p.alpha * 0.45;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'streak' && p.length) {
          // High-speed glow streak
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.04, p.y + p.length);
          ctx.stroke();
        } else {
          // Standard circular particle (sparks, explosions, coin pickup)
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 5. Render Player Character (Futuristic Runner / Hover craft with Selected Skin)
      if (!gameStateRef.current.gameOver) {
        const state = gameStateRef.current;
        const px = state.currentX;
        const py = state.playerY;
        const pw = state.playerWidth;
        const ph = state.playerHeight;

        // Dynamic tilt banking into turns
        const tilt = (state.targetX - state.currentX) * 0.004;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, ph * 0.45, pw * 0.65, ph * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thruster glow
        ctx.shadowColor = skin.colors.glow;
        ctx.shadowBlur = 16;

        // Dual Engine Thrusters (Left & Right rear)
        ctx.fillStyle = skin.colors.primary;
        ctx.fillRect(-pw * 0.38, ph * 0.28, pw * 0.22, ph * 0.16);
        ctx.fillRect(pw * 0.16, ph * 0.28, pw * 0.22, ph * 0.16);

        // Thruster flame cones
        const flameLength = 12 + Math.random() * 8;
        ctx.fillStyle = skin.colors.glow;
        ctx.beginPath();
        ctx.moveTo(-pw * 0.38, ph * 0.44);
        ctx.lineTo(-pw * 0.27, ph * 0.44 + flameLength);
        ctx.lineTo(-pw * 0.16, ph * 0.44);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pw * 0.16, ph * 0.44);
        ctx.lineTo(pw * 0.27, ph * 0.44 + flameLength);
        ctx.lineTo(pw * 0.38, ph * 0.44);
        ctx.fill();

        // Main Armored Chassis
        ctx.fillStyle = skin.colors.secondary;
        ctx.beginPath();
        ctx.moveTo(0, -ph * 0.5); // Nose tip
        ctx.lineTo(pw * 0.45, -ph * 0.1);
        ctx.lineTo(pw * 0.4, ph * 0.38);
        ctx.lineTo(pw * 0.2, ph * 0.42);
        ctx.lineTo(0, ph * 0.32);
        ctx.lineTo(-pw * 0.2, ph * 0.42);
        ctx.lineTo(-pw * 0.4, ph * 0.38);
        ctx.lineTo(-pw * 0.45, -ph * 0.1);
        ctx.closePath();
        ctx.fill();

        // Primary Armor Highlights / Wings
        ctx.fillStyle = skin.colors.primary;
        ctx.beginPath();
        ctx.moveTo(0, -ph * 0.35);
        ctx.lineTo(pw * 0.3, 0);
        ctx.lineTo(pw * 0.22, ph * 0.26);
        ctx.lineTo(0, ph * 0.18);
        ctx.lineTo(-pw * 0.22, ph * 0.26);
        ctx.lineTo(-pw * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        // Glowing Visor / Cockpit
        ctx.fillStyle = skin.colors.visor;
        ctx.shadowColor = skin.colors.visor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -ph * 0.38);
        ctx.lineTo(pw * 0.14, -ph * 0.18);
        ctx.lineTo(-pw * 0.14, -ph * 0.18);
        ctx.closePath();
        ctx.fill();

        // Neon outline edge
        ctx.strokeStyle = skin.colors.glow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -ph * 0.5);
        ctx.lineTo(pw * 0.45, -ph * 0.1);
        ctx.lineTo(pw * 0.4, ph * 0.38);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -ph * 0.5);
        ctx.lineTo(-pw * 0.45, -ph * 0.1);
        ctx.lineTo(-pw * 0.4, ph * 0.38);
        ctx.stroke();

        ctx.restore();
      }

      // 6. Floating Score & Text Feedbacks
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 20px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 7. Level Up Banner overlay if active
      if (gameStateRef.current.levelBanner.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = gameStateRef.current.levelBanner.alpha;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, height * 0.28, width, 48);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, height * 0.28, width, 48);

        ctx.font = 'bold 15px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(gameStateRef.current.levelBanner.text, width * 0.5, height * 0.28 + 29);
        ctx.restore();
      }

      ctx.restore();

      // Next frame
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [skin, highScore, isPaused, onScoreUpdate, onGameOver, onNewRecord]);

  // Touch & Swipe Event Listeners on the Canvas
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;

    // Swipe detection (quick horizontal flick)
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 0.8) {
      if (dx < 0) {
        moveLeft();
      } else {
        moveRight();
      }
    } else if (dt < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // Tap on canvas: direct lane selection or half-screen tap
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const tapX = touch.clientX - rect.left;
        const relativeX = tapX / rect.width;

        if (relativeX < 0.35) {
          setLaneDirect(0); // Left lane
        } else if (relativeX > 0.65) {
          setLaneDirect(2); // Right lane
        } else {
          setLaneDirect(1); // Center lane
        }
      }
    }

    touchStartRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full block cursor-pointer select-none touch-none"
    />
  );
};
