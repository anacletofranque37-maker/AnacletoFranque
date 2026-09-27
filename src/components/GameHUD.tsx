import React from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface GameHUDProps {
  score: number;
  highScore: number;
  coins: number;
  level: number;
  distance: number;
  isPaused: boolean;
  soundEnabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  coins,
  level,
  distance,
  isPaused,
  soundEnabled,
  onTogglePause,
  onToggleSound,
  onMoveLeft,
  onMoveRight,
}) => {
  // Ultra-responsive touch event handlers (firing on touchStart with zero delay)
  const handleLeftTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onMoveLeft();
  };

  const handleRightTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onMoveRight();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5 select-none">
      {/* Top HUD: PONTOS, RECORDE, MOEDAS */}
      <header className="pointer-events-auto flex items-start justify-between gap-2">
        {/* Main Stats Block */}
        <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md shadow-lg">
          {/* PONTOS */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              PONTOS
            </span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 tabular-nums leading-tight">
              {score.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-slate-800" />

          {/* RECORDE */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              RECORDE
            </span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-200 tabular-nums leading-tight">
              {Math.max(score, highScore).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-slate-800" />

          {/* MOEDAS */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              MOEDAS
            </span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 tabular-nums leading-tight flex items-center gap-1">
              <span>🪙</span>
              {coins.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Right Quick Controls & Level Badge */}
        <div className="flex items-center gap-2">
          {/* Level Pill Indicator */}
          <div className="hidden xs:flex flex-col items-end px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              NÍVEL {level}
            </span>
            <span className="text-[11px] font-bold text-cyan-400 font-mono">
              {distance}m
            </span>
          </div>

          {/* Pause */}
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePause();
            }}
            aria-label={isPaused ? 'Continuar jogo' : 'Pausar jogo'}
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            {isPaused ? <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Sound */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleSound();
            }}
            aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Pause Overlay (if paused) */}
      {isPaused && (
        <div className="pointer-events-auto my-auto mx-auto px-8 py-6 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center max-w-xs">
          <h2 className="text-2xl font-black font-display text-white tracking-wider uppercase mb-2">
            PAUSADO
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Toque abaixo para retomar sua corrida.
          </p>
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePause();
            }}
            className="w-full py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold uppercase font-display tracking-wider shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all active:scale-95 cursor-pointer"
          >
            CONTINUAR
          </button>
        </div>
      )}

      {/* Bottom Ergonomic Mobile Controls: ← ESQUERDA and DIREITA → */}
      <footer className="pointer-events-auto flex items-center justify-between gap-4 pb-2">
        {/* Left Button */}
        <button
          onTouchStart={handleLeftTouch}
          onMouseDown={handleLeftTouch}
          aria-label="Mover para esquerda"
          className="flex-1 h-18 sm:h-20 rounded-2xl bg-gradient-to-t from-slate-900 via-slate-800/90 to-slate-800/70 border border-slate-700/80 active:border-cyan-400 text-slate-200 active:text-cyan-300 font-extrabold font-display text-lg tracking-wider flex items-center justify-center gap-2 shadow-2xl backdrop-blur-md transition-all active:scale-95 active:bg-cyan-950/40 cursor-pointer touch-manipulation select-none"
        >
          <ChevronLeft className="w-7 h-7 text-cyan-400" />
          <span className="uppercase">ESQUERDA</span>
        </button>

        {/* Right Button */}
        <button
          onTouchStart={handleRightTouch}
          onMouseDown={handleRightTouch}
          aria-label="Mover para direita"
          className="flex-1 h-18 sm:h-20 rounded-2xl bg-gradient-to-t from-slate-900 via-slate-800/90 to-slate-800/70 border border-slate-700/80 active:border-cyan-400 text-slate-200 active:text-cyan-300 font-extrabold font-display text-lg tracking-wider flex items-center justify-center gap-2 shadow-2xl backdrop-blur-md transition-all active:scale-95 active:bg-cyan-950/40 cursor-pointer touch-manipulation select-none"
        >
          <span className="uppercase">DIREITA</span>
          <ChevronRight className="w-7 h-7 text-cyan-400" />
        </button>
      </footer>
    </div>
  );
};
