import { Skin } from '../types/game';

export const SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Cyber Runner',
    price: 0,
    unlocked: true,
    description: 'Traje de combate urbano padrão com blindagem em grafite e propulsor de íons ciano.',
    colors: {
      primary: '#06b6d4', // Cyan 500
      secondary: '#1e293b', // Slate 800
      glow: '#22d3ee', // Cyan 400
      visor: '#e0f2fe', // Sky 100
      trail: 'rgba(6, 182, 212, 0.45)',
    },
  },
  {
    id: 'crimson',
    name: 'Espectro Rubro',
    price: 30,
    unlocked: false,
    description: 'Armadura reforçada em liga de titânio escuro com núcleo de plasma escarlate.',
    colors: {
      primary: '#ef4444', // Red 500
      secondary: '#18181b', // Zinc 900
      glow: '#f87171', // Red 400
      visor: '#fee2e2', // Red 100
      trail: 'rgba(239, 68, 68, 0.5)',
    },
  },
  {
    id: 'gold',
    name: 'Fóton Dourado',
    price: 80,
    unlocked: false,
    description: 'Edição de prestígio revestida em ouro ionizado com rastro estelar radiante.',
    colors: {
      primary: '#f59e0b', // Amber 500
      secondary: '#1c1917', // Stone 900
      glow: '#fbbf24', // Amber 400
      visor: '#fef3c7', // Amber 100
      trail: 'rgba(245, 158, 11, 0.5)',
    },
  },
  {
    id: 'shadow',
    name: 'Fantasma Noturno',
    price: 150,
    unlocked: false,
    description: 'Tecnologia furtiva com absorção de radar e propulsão ultravioleta de baixa assinatura.',
    colors: {
      primary: '#a855f7', // Purple 500
      secondary: '#09090b', // Zinc 950
      glow: '#c084fc', // Purple 400
      visor: '#f3e8ff', // Purple 100
      trail: 'rgba(168, 85, 247, 0.5)',
    },
  },
  {
    id: 'emerald',
    name: 'Hiper Esmeralda',
    price: 250,
    unlocked: false,
    description: 'Protótipo experimental impulsionado por reator quântico de jade líquido.',
    colors: {
      primary: '#10b981', // Emerald 500
      secondary: '#064e3b', // Emerald 900
      glow: '#34d399', // Emerald 400
      visor: '#d1fae5', // Emerald 100
      trail: 'rgba(16, 185, 129, 0.5)',
    },
  },
];

export const getSkinById = (id: string, unlockedList: string[] = ['default']): Skin => {
  const found = SKINS.find((s) => s.id === id) || SKINS[0];
  return {
    ...found,
    unlocked: unlockedList.includes(found.id),
  };
};
