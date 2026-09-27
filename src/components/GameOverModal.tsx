import React from 'react';
import { RotateCcw, Home, ShoppingBag, Trophy, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface GameOverModalProps {
  score: number;
  highScore: number;
  coinsEarned: number;
  totalCoins: number;
  distance: number;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  coinsEarned,
  totalCoins,
  distance,
  isNewRecord,
  onPlayAgain,
  onMainMenu,
  onOpenShop,
}) => {
  const handlePlayAgain = () => {
    soundManager.playClick();
    onPlayAgain();
  };

  const handleMainMenu = () => {
    soundManager.playClick();
    onMainMenu();
  };

  const handleShop = () => {
    soundManager.playClick();
    onOpenShop();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center flex flex-col items-center">
        {/* New Record Banner if applicable */}
        {isNewRecord ? (
          <div className="mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/50 flex items-center gap-2 animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black font-display tracking-widest text-amber-300 uppercase">
              NOVO RECORDE!
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        ) : (
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase font-mono mb-2">
            FIM DA CORRIDA
          </span>
        )}

        {/* GAME OVER TITLE */}
        <h2 className="text-4xl font-black font-display tracking-tight text-white mb-6 uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          GAME OVER
        </h2>

        {/* Stats Grid */}
        <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800/90 divide-y divide-slate-800 mb-6 text-left">
          {/* Pontuação */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pontuação
            </span>
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              {score.toLocaleString('pt-BR')}
            </span>
          </div>

          {/* Recorde */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recorde
            </span>
            <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {highScore.toLocaleString('pt-BR')}
            </span>
          </div>

          {/* Moedas */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Moedas
            </span>
            <div className="flex items-center gap-2">
              {coinsEarned > 0 && (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  (+{coinsEarned})
                </span>
              )}
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums flex items-center gap-1">
                <span>🪙</span>
                {totalCoins.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Distância */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 rounded-b-2xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Distância percorrida
            </span>
            <span className="text-sm font-bold font-mono text-slate-300 tabular-nums">
              {distance} metros
            </span>
          </div>
        </div>

        {/* Primary Action: JOGAR NOVAMENTE */}
        <button
          onClick={handlePlayAgain}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-lg tracking-wider uppercase font-display flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer mb-3"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          <span>JOGAR NOVAMENTE</span>
        </button>

        {/* Secondary Actions: MENU PRINCIPAL & LOJA */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          <button
            onClick={handleMainMenu}
            className="h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 font-bold text-xs tracking-wider uppercase font-display flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>MENU</span>
          </button>

          <button
            onClick={handleShop}
            className="h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 font-bold text-xs tracking-wider uppercase font-display flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>LOJA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
