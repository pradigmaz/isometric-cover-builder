import { PaletteConfig, PaletteId, PaletteTokens } from '../types/schema';

const RAW_PALETTE_PRESETS: Record<string, PaletteConfig> = {
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

export const DEFAULT_CUSTOM_PALETTE: PaletteConfig = {
  id: 'custom',
  name: 'Пользовательская',
  figmaSwatches: ['#1A1C29', '#00F0FF', '#FF0055', '#FFE600'],
  tokens: {
    bg: '#1A1C29',
    surface: '#24283B',
    primary: '#00F0FF',
    secondary: '#FF0055',
    accent: '#FFE600',
    light: '#E0F7FF',
  },
  ghostOpacity: 0.22,
  semanticDomains: ['custom'],
};

export const SAMPLE_PALETTES: Record<'cyberpunk' | 'autumn', PaletteConfig> = {
  cyberpunk: {
    id: 'custom',
    name: 'Киберпанк',
    figmaSwatches: ['#0F111A', '#00F0FF', '#FF0055', '#FFE600'],
    tokens: {
      bg: '#0F111A',
      surface: '#00F0FF',
      primary: '#FF0055',
      secondary: '#FFE600',
      accent: '#00F0FF',
      light: '#E0F7FF',
    },
    ghostOpacity: 0.25,
    semanticDomains: ['cyberpunk', 'neon', 'dark', 'future'],
  },
  autumn: {
    id: 'custom',
    name: 'Осенний лес',
    figmaSwatches: ['#F5EFEB', '#D46938', '#543A2A', '#E8A34A'],
    tokens: {
      bg: '#F5EFEB',
      surface: '#D46938',
      primary: '#543A2A',
      secondary: '#E8A34A',
      accent: '#D46938',
      light: '#FFFDFC',
    },
    ghostOpacity: 0.22,
    semanticDomains: ['nature', 'warm', 'forest', 'autumn'],
  },
};

let registeredCustomPalette: PaletteConfig = DEFAULT_CUSTOM_PALETTE;

export function registerCustomPalette(palette: PaletteConfig | null): void {
  if (palette) {
    registeredCustomPalette = palette;
    RAW_PALETTE_PRESETS['custom'] = palette;
  }
}

RAW_PALETTE_PRESETS['custom'] = DEFAULT_CUSTOM_PALETTE;

export const PALETTE_PRESETS: Record<string, PaletteConfig> = new Proxy(RAW_PALETTE_PRESETS, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return registeredCustomPalette ?? target['custom'] ?? target[DEFAULT_PALETTE];
  },
});

export function normalizeHex(color: string): string {
  let c = color.trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  return `#${c.toUpperCase()}`;
}

export function parseHexColors(input: string): string[] {
  const matches = input.match(/#?[0-9a-fA-F]{6}|#?[0-9a-fA-F]{3}/g);
  if (!matches) return [];
  return matches.map(normalizeHex);
}

export function createCustomPalette(
  input: string | Partial<PaletteTokens> | string[],
  name = 'Пользовательская'
): PaletteConfig {
  let tokens: PaletteTokens = { ...DEFAULT_CUSTOM_PALETTE.tokens };

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed === 'object' && parsed !== null) {
        return createCustomPalette(parsed, name);
      }
    } catch {
      // Plain text or CSV
    }
    const hexList = parseHexColors(input);
    if (hexList.length > 0) {
      return createCustomPalette(hexList, name);
    }
  } else if (Array.isArray(input)) {
    const valid = input.map(normalizeHex).filter((h) => /^#[0-9A-F]{6}$/i.test(h));
    if (valid.length >= 1) {
      tokens = {
        bg: valid[0],
        surface: valid[1] ?? valid[0],
        primary: valid[2] ?? valid[1] ?? valid[0],
        secondary: valid[3] ?? valid[2] ?? valid[0],
        accent: valid[4] ?? valid[1] ?? valid[0],
        light: valid[5] ?? '#FFFFFF',
      };
    }
  } else if (typeof input === 'object' && input !== null) {
    tokens = {
      bg: input.bg ? normalizeHex(input.bg) : tokens.bg,
      surface: input.surface ? normalizeHex(input.surface) : tokens.surface,
      primary: input.primary ? normalizeHex(input.primary) : tokens.primary,
      secondary: input.secondary ? normalizeHex(input.secondary) : tokens.secondary,
      accent: input.accent ? normalizeHex(input.accent) : tokens.accent,
      light: input.light ? normalizeHex(input.light) : tokens.light,
    };
  }

  const figmaSwatches: [string, string, string, string] = [
    tokens.bg,
    tokens.surface,
    tokens.primary,
    tokens.secondary,
  ];

  return {
    id: 'custom',
    name,
    figmaSwatches,
    tokens,
    ghostOpacity: 0.22,
    semanticDomains: ['custom'],
  };
}

export function getPaletteConfig(id: PaletteId, customPalette?: PaletteConfig | null): PaletteConfig {
  if (id in RAW_PALETTE_PRESETS && id !== 'custom') {
    return RAW_PALETTE_PRESETS[id];
  }
  return customPalette ?? registeredCustomPalette ?? RAW_PALETTE_PRESETS['custom'] ?? RAW_PALETTE_PRESETS[DEFAULT_PALETTE];
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
