import { PaletteConfig, PaletteId, PaletteTokens } from '../types/schema';

export const PALETTE_PRESETS: Record<PaletteId, PaletteConfig> = {
  'warm-pastel': {
    id: 'warm-pastel',
    name: 'Тёплая пастель',
    figmaSwatches: ['#F5DEC2', '#D8D2F8', '#C8E3F8', '#745C4B'],
    tokens: {
      bg: '#F5DEC2',
      surface: '#D8D2F8',
      primary: '#C8E3F8',
      secondary: '#745C4B',
      accent: '#D8D2F8',
      light: '#FFFDF9',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['tech', 'systems', 'strategy', 'education', 'architecture'],
  },
  'fresh-mint': {
    id: 'fresh-mint',
    name: 'Свежая мята',
    figmaSwatches: ['#E8F4D9', '#DBEFF5', '#FEDEC0', '#4F5535'],
    tokens: {
      bg: '#E8F4D9',
      surface: '#DBEFF5',
      primary: '#DBEFF5',
      secondary: '#4F5535',
      accent: '#FEDEC0',
      light: '#FCFFF7',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['finance', 'analytics', 'eco', 'wellness', 'growth', 'money'],
  },
  'soft-coral': {
    id: 'soft-coral',
    name: 'Мягкий коралл',
    figmaSwatches: ['#FFE8D6', '#F2E3E8', '#E0EBF7', '#5A4B4B'],
    tokens: {
      bg: '#FFE8D6',
      surface: '#F2E3E8',
      primary: '#E0EBF7',
      secondary: '#5A4B4B',
      accent: '#F2E3E8',
      light: '#FFFBF8',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['creative', 'content', 'audio', 'lifestyle', 'culture', 'writing'],
  },
};

export const DEFAULT_PALETTE: PaletteId = 'warm-pastel';

export function getPaletteConfig(id: PaletteId): PaletteConfig {
  return PALETTE_PRESETS[id] ?? PALETTE_PRESETS[DEFAULT_PALETTE];
}

/**
 * Transforms PaletteTokens into a React inline style dictionary with CSS Custom Properties.
 */
export function getCssTokensStyle(tokens: PaletteTokens): Record<string, string> {
  return {
    '--token-bg': tokens.bg,
    '--token-surface': tokens.surface,
    '--token-primary': tokens.primary,
    '--token-secondary': tokens.secondary,
    '--token-accent': tokens.accent,
    '--token-light': tokens.light,
  };
}
