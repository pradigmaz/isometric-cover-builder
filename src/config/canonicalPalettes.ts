import { PaletteConfig } from '../types/schema';

export type CanonicalPaletteId = 'lavender' | 'peach-mint' | 'turquoise-purple';

export const CANONICAL_PALETTE_IDS: readonly CanonicalPaletteId[] = [
  'lavender',
  'peach-mint',
  'turquoise-purple',
];

/**
 * 3 strict canonical color schemes defined in Studio «Очень» ТЗ:
 * 1. Lavender (main) — light lavender wall (#DDD5F9), saturated lilac table surface (#9E91E8),
 *    pastel yellow hero (#F9ECB0), dark contour (#181817).
 * 2. Peach-Mint — light peach wall (#FEEFE3), warm peach table surface (#FDD7B9),
 *    mint-turquoise hero (#80DADA), dark contour (#181817).
 * 3. Turquoise-Purple — light turquoise wall (#E1FAF9), turquoise table surface (#9FE5E5),
 *    purple/lavender hero (#7C6EE6), dark contour (#181817).
 */
export const CANONICAL_PALETTES: Record<CanonicalPaletteId, PaletteConfig> = {
  lavender: {
    id: 'lavender',
    name: 'Лаванда (Основная)',
    figmaSwatches: ['#DDD5F9', '#9E91E8', '#F9ECB0', '#181817'],
    tokens: {
      bg: '#DDD5F9',
      surface: '#9E91E8',
      primary: '#F9ECB0',
      secondary: '#181817',
      accent: '#F6ABC4',
      light: '#FFFFFF',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['general', 'tech', 'systems', 'strategy', 'education', 'studio', 'main', 'lavender'],
  },
  'peach-mint': {
    id: 'peach-mint',
    name: 'Персик-Мята',
    figmaSwatches: ['#FEEFE3', '#FDD7B9', '#80DADA', '#181817'],
    tokens: {
      bg: '#FEEFE3',
      surface: '#FDD7B9',
      primary: '#80DADA',
      secondary: '#181817',
      accent: '#F9ECB0',
      light: '#FFFFFF',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['finance', 'analytics', 'eco', 'wellness', 'growth', 'money', 'peach', 'mint'],
  },
  'turquoise-purple': {
    id: 'turquoise-purple',
    name: 'Бирюза-Пурпур',
    figmaSwatches: ['#E1FAF9', '#9FE5E5', '#7C6EE6', '#181817'],
    tokens: {
      bg: '#E1FAF9',
      surface: '#9FE5E5',
      primary: '#7C6EE6',
      secondary: '#181817',
      accent: '#F6ABC4',
      light: '#FFFFFF',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['creative', 'content', 'audio', 'lifestyle', 'culture', 'writing', 'turquoise', 'purple'],
  },
};

export const CANONICAL_PALETTES_LIST: PaletteConfig[] = [
  CANONICAL_PALETTES['lavender'],
  CANONICAL_PALETTES['peach-mint'],
  CANONICAL_PALETTES['turquoise-purple'],
];

export const DEFAULT_CANONICAL_PALETTE_ID: CanonicalPaletteId = 'lavender';
export const DEFAULT_CANONICAL_PALETTE: PaletteConfig = CANONICAL_PALETTES['lavender'];

export function isCanonicalPaletteId(id: string): id is CanonicalPaletteId {
  return id === 'lavender' || id === 'peach-mint' || id === 'turquoise-purple';
}

export function getCanonicalPalette(id: string): PaletteConfig {
  if (isCanonicalPaletteId(id)) {
    return CANONICAL_PALETTES[id];
  }
  return DEFAULT_CANONICAL_PALETTE;
}
