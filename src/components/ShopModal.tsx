import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, Play, ShoppingBag } from 'lucide-react';
import { Skin } from '../types/game';
import { SKINS, getSkinById } from '../utils/skins';
import { soundManager } from '../utils/audio';

interface ShopModalProps {
  coins: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  onUnlockSkin: (skinId: string, price: number) => boolean;
  onSelectSkin: (skinId: string) => void;
  onClose: () => void;
  onPlayDirect: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  unlockedSkins,
  selectedSkinId,
  onUnlockSkin,
  onSelectSkin,
  onClose,
  onPlayDirect,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string>(selectedSkinId);
  const activeSkin = getSkinById(activePreviewId, unlockedSkins);

  const handleUnlock = (skin: Skin) => {
    if (coins < skin.price) return;
    const success = onUnlockSkin(skin.id, skin.price);
    if (success) {
      soundManager.playNewRecord();
      onSelectSkin(skin.id);
      setActivePreviewId(skin.id);
    }
  };

  const handleEquip = (skinId: string) => {
    soundManager.playClick();
    onSelectSkin(skinId);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#07090e] text-slate-100 select-none overflow-hidden p-4 sm:p-6">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          aria-label="Voltar"
          className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-display transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>VOLTAR</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-black font-display tracking-tight text-white uppercase">
            HANGAR DE SKINS
          </h2>
        </div>

        {/* Coin Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm shadow-sm">
          <span>🪙</span>
          <span className="tabular-nums">{coins.toLocaleString('pt-BR')}</span>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
        {/* Active Selected Skin Visual Showcase */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-950/60 rounded-3xl border border-slate-800/80 mb-4 relative overflow-hidden">
          {/* Subtle Ambient Aura */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none blur-2xl"
            style={{ backgroundColor: activeSkin.colors.primary }}
          />

          {/* Jet Character Graphic Presentation */}
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center border shadow-2xl relative mb-3 transition-all duration-300"
            style={{
              backgroundColor: activeSkin.colors.secondary,
              borderColor: activeSkin.colors.primary,
              boxShadow: `0 0 35px ${activeSkin.colors.trail}`,
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Jet Cockpit / Chassis */}
              <div
                className="w-10 h-16 rounded-t-xl relative shadow-md"
                style={{ backgroundColor: activeSkin.colors.primary }}
              >
                <div
                  className="w-5 h-3 mx-auto mt-2.5 rounded-sm"
                  style={{ backgroundColor: activeSkin.colors.visor }}
                />
              </div>
              {/* Engine Exhaust */}
              <div
                className="w-5 h-4 rounded-b-full animate-pulse mt-1"
                style={{ backgroundColor: activeSkin.colors.glow }}
              />
            </div>
          </div>

          <h3 className="text-xl font-black font-display uppercase tracking-wide text-white">
            {activeSkin.name}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs text-center px-4 mt-1">
            {activeSkin.description}
          </p>

          {/* Action on Active Preview Skin */}
          <div className="mt-4">
            {selectedSkinId === activeSkin.id ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs font-extrabold uppercase font-display tracking-wider">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>EQUIPADO</span>
              </div>
            ) : unlockedSkins.includes(activeSkin.id) ? (
              <button
                onClick={() => handleEquip(activeSkin.id)}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase font-display tracking-wider shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                EQUIPAR SKIN
              </button>
            ) : (
              <button
                onClick={() => handleUnlock(activeSkin)}
                disabled={coins < activeSkin.price}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase font-display tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                  coins >= activeSkin.price
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>DESBLOQUEAR (🪙 {activeSkin.price})</span>
              </button>
            )}
          </div>
        </div>

        {/* Skin Selector Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {SKINS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isSelected = selectedSkinId === skin.id;
            const isPreviewed = activePreviewId === skin.id;

            return (
              <button
                key={skin.id}
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewId(skin.id);
                }}
                className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer relative ${
                  isPreviewed
                    ? 'bg-slate-800/90 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Equipped Badge */}
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}

                {/* Skin Color Palette Swatch */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden mb-1.5 shadow-sm"
                  style={{ backgroundColor: skin.colors.secondary }}
                >
                  <div
                    className="w-4 h-6 rounded-t-sm"
                    style={{ backgroundColor: skin.colors.primary }}
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase font-display tracking-tight text-slate-300 truncate w-full text-center">
                  {skin.name.split(' ')[0]}
                </span>

                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                  {isUnlocked ? 'OK' : `🪙${skin.price}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer CTA: Direct JOGAR button */}
      <footer className="pt-2">
        <button
          onClick={() => {
            soundManager.playClick();
            onPlayDirect();
          }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-base tracking-wider uppercase font-display flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>JOGAR COM ESTA SKIN</span>
        </button>
      </footer>
    </div>
  );
};
