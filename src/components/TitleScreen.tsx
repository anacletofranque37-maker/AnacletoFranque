import React from 'react';
import { Volume2, VolumeX, ShoppingBag, Play, ShieldAlert } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { Skin } from '../types/game';

interface TitleScreenProps {
  highScore: number;
  coins: number;
  selectedSkin: Skin;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStartGame: () => void;
  onOpenShop: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScore,
  coins,
  selectedSkin,
  soundEnabled,
  onToggleSound,
  onStartGame,
  onOpenShop,
}) => {
  const handlePlayClick = () => {
    soundManager.playClick();
    onStartGame();
  };

  const handleShopClick = () => {
    soundManager.playClick();
    onOpenShop();
  };

  const handleSoundClick = () => {
    soundManager.playClick();
    onToggleSound();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-[#07090e] text-slate-100 overflow-hidden select-none">
      {/* Background Subtle Cyber Speed Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Top Bar Utilities */}
      <header className="relative z-10 flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-slate-300 font-mono">
            V1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute/Unmute */}
          <button
            onClick={handleSoundClick}
            aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Shop Button */}
          <button
            onClick={handleShopClick}
            aria-label="Abrir loja de skins"
            className="h-11 px-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:border-cyan-500/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider font-display uppercase">LOJA</span>
          </button>
        </div>
      </header>

      {/* Center Hero & Branding */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
        {/* Active Skin Icon / Visual Silhouette */}
        <div className="relative mb-6 flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center border shadow-2xl relative transition-transform duration-500 hover:scale-105"
            style={{
              backgroundColor: selectedSkin.colors.secondary,
              borderColor: selectedSkin.colors.primary,
              boxShadow: `0 0 35px ${selectedSkin.colors.trail}`,
            }}
          >
            {/* Jet Silhouette */}
            <div className="relative flex flex-col items-center">
              <div
                className="w-8 h-12 rounded-t-lg relative"
                style={{ backgroundColor: selectedSkin.colors.primary }}
              >
                <div
                  className="w-4 h-2.5 mx-auto mt-2 rounded-sm"
                  style={{ backgroundColor: selectedSkin.colors.visor }}
                />
              </div>
              {/* Thruster Flame */}
              <div
                className="w-4 h-3 rounded-b-full animate-pulse mt-0.5"
                style={{ backgroundColor: selectedSkin.colors.glow }}
              />
            </div>
          </div>
          {/* Skin Name Kicker */}
          <span className="absolute -bottom-3 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
            {selectedSkin.name}
          </span>
        </div>

        {/* Game Title */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight font-display text-white mb-2 uppercase drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]">
          LAST RUN
        </h1>

        {/* Minimalist Stats Display (Clean, non-pill metadata according to user request) */}
        <div className="flex items-center gap-6 mt-6 py-3 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              MELHOR RECORDE
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {highScore.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="w-[1px] h-8 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              MOEDAS
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {coins.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Main Action Button */}
      <footer className="relative z-10 flex flex-col gap-3 pb-4">
        <button
          onClick={handlePlayClick}
          className="w-full h-15 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xl tracking-wider uppercase font-display flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>JOGAR</span>
        </button>

        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>Desvie dos obstáculos · Colete moedas · Sobreviva</span>
        </p>
      </footer>
    </div>
  );
};
