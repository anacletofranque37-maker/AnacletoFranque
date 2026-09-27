import { useState, useEffect, useRef, useCallback } from 'react';
import { GameScreen } from './types/game';
import { loadGameData, saveGameData } from './utils/storage';
import { getSkinById } from './utils/skins';
import { soundManager } from './utils/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';

export default function App() {
  const [saveData, setSaveData] = useState(() => loadGameData());
  const [gameScreen, setGameScreen] = useState<GameScreen>('TITLE');
  const [isPaused, setIsPaused] = useState(false);
  const [runKey, setRunKey] = useState(1); // Key to cleanly remount canvas on restart

  // Active run state
  const [currentScore, setCurrentScore] = useState(0);
  const [coinsEarnedThisRun, setCoinsEarnedThisRun] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Registered canvas controls for HUD buttons
  const canvasControlsRef = useRef<{ moveLeft: () => void; moveRight: () => void } | null>(null);

  // Initialize sound settings
  useEffect(() => {
    soundManager.setEnabled(saveData.soundEnabled);
  }, [saveData.soundEnabled]);

  // Start new run
  const startNewRun = useCallback(() => {
    setCurrentScore(0);
    setCoinsEarnedThisRun(0);
    setCurrentDistance(0);
    setCurrentLevel(1);
    setIsNewRecord(false);
    setIsPaused(false);
    setRunKey((k) => k + 1);
    setGameScreen('PLAYING');
  }, []);

  // Score updates from canvas 60fps loop
  const handleScoreUpdate = useCallback(
    (score: number, coins: number, distance: number, level: number) => {
      setCurrentScore(score);
      setCoinsEarnedThisRun(coins);
      setCurrentDistance(distance);
      setCurrentLevel(level);
    },
    []
  );

  // New record broken in-game event
  const handleNewRecordTriggered = useCallback(() => {
    setIsNewRecord(true);
  }, []);

  // Collision / Game Over event
  const handleGameOver = useCallback(
    (finalScore: number, coinsEarned: number, distance: number, newRecord: boolean) => {
      // Save stats to LocalStorage
      const updatedTotalCoins = saveData.coins + coinsEarned;
      const updatedHighScore = Math.max(saveData.highScore, finalScore);
      const updatedMaxDistance = Math.max(saveData.maxDistance, distance);
      const updatedTotalRuns = saveData.totalRuns + 1;

      const newSave = saveGameData({
        highScore: updatedHighScore,
        coins: updatedTotalCoins,
        maxDistance: updatedMaxDistance,
        totalRuns: updatedTotalRuns,
      });

      setSaveData(newSave);
      setCurrentScore(finalScore);
      setCoinsEarnedThisRun(coinsEarned);
      setCurrentDistance(distance);
      setIsNewRecord(newRecord);
      setGameScreen('GAME_OVER');
    },
    [saveData]
  );

  // Toggle audio
  const handleToggleSound = useCallback(() => {
    const nextVal = !saveData.soundEnabled;
    soundManager.setEnabled(nextVal);
    const updated = saveGameData({ soundEnabled: nextVal });
    setSaveData(updated);
  }, [saveData.soundEnabled]);

  // Skin unlock in shop
  const handleUnlockSkin = useCallback(
    (skinId: string, price: number): boolean => {
      if (saveData.coins < price) return false;
      const updatedCoins = saveData.coins - price;
      const updatedUnlocked = [...saveData.unlockedSkins, skinId];
      const updated = saveGameData({
        coins: updatedCoins,
        unlockedSkins: updatedUnlocked,
        selectedSkin: skinId,
      });
      setSaveData(updated);
      return true;
    },
    [saveData.coins, saveData.unlockedSkins]
  );

  // Select skin
  const handleSelectSkin = useCallback((skinId: string) => {
    const updated = saveGameData({ selectedSkin: skinId });
    setSaveData(updated);
  }, []);

  const activeSkin = getSkinById(saveData.selectedSkin, saveData.unlockedSkins);

  return (
    <div className="w-full h-full min-h-[100dvh] flex items-center justify-center bg-[#05070b] overflow-hidden">
      {/* Mobile Frame Container */}
      <div className="relative w-full max-w-md h-[100dvh] max-h-[920px] bg-[#07090e] shadow-2xl overflow-hidden flex flex-col sm:rounded-3xl sm:border sm:border-slate-800/80">
        {/* Title Screen */}
        {gameScreen === 'TITLE' && (
          <TitleScreen
            highScore={saveData.highScore}
            coins={saveData.coins}
            selectedSkin={activeSkin}
            soundEnabled={saveData.soundEnabled}
            onToggleSound={handleToggleSound}
            onStartGame={startNewRun}
            onOpenShop={() => setGameScreen('SHOP')}
          />
        )}

        {/* Active Gameplay & HUD */}
        {(gameScreen === 'PLAYING' || gameScreen === 'GAME_OVER') && (
          <div className="relative w-full h-full overflow-hidden">
            <GameCanvas
              key={runKey}
              skin={activeSkin}
              highScore={saveData.highScore}
              isPaused={isPaused}
              onScoreUpdate={handleScoreUpdate}
              onGameOver={handleGameOver}
              onNewRecord={handleNewRecordTriggered}
              registerControls={(controls) => {
                canvasControlsRef.current = controls;
              }}
            />

            {/* In-Game HUD (Visible during gameplay and paused states) */}
            {gameScreen === 'PLAYING' && (
              <GameHUD
                score={currentScore}
                highScore={saveData.highScore}
                coins={coinsEarnedThisRun}
                level={currentLevel}
                distance={currentDistance}
                isPaused={isPaused}
                soundEnabled={saveData.soundEnabled}
                onTogglePause={() => setIsPaused((p) => !p)}
                onToggleSound={handleToggleSound}
                onMoveLeft={() => canvasControlsRef.current?.moveLeft()}
                onMoveRight={() => canvasControlsRef.current?.moveRight()}
              />
            )}

            {/* Game Over Modal overlay */}
            {gameScreen === 'GAME_OVER' && (
              <GameOverModal
                score={currentScore}
                highScore={saveData.highScore}
                coinsEarned={coinsEarnedThisRun}
                totalCoins={saveData.coins}
                distance={currentDistance}
                isNewRecord={isNewRecord}
                onPlayAgain={startNewRun}
                onMainMenu={() => setGameScreen('TITLE')}
                onOpenShop={() => setGameScreen('SHOP')}
              />
            )}
          </div>
        )}

        {/* Shop Modal Screen */}
        {gameScreen === 'SHOP' && (
          <ShopModal
            coins={saveData.coins}
            unlockedSkins={saveData.unlockedSkins}
            selectedSkinId={saveData.selectedSkin}
            onUnlockSkin={handleUnlockSkin}
            onSelectSkin={handleSelectSkin}
            onClose={() => setGameScreen('TITLE')}
            onPlayDirect={startNewRun}
          />
        )}
      </div>
    </div>
  );
}
