import { CanvasFormatId, LayoutMode, LayoutSlot, LayoutTemplate } from '../types/schema';

export type FormatCategory = 'horizontal' | 'square' | 'vertical';

export function getFormatCategory(formatId: CanvasFormatId): FormatCategory {
  switch (formatId) {
    case 'og':
    case '16:9':
      return 'horizontal';
    case '1:1':
      return 'square';
    case '9:16':
      return 'vertical';
    default:
      return 'horizontal';
  }
}

interface BaseLayoutDef {
  hero: LayoutSlot;
  satellites: LayoutSlot[];
  ghosts: LayoutSlot[];
}

const BASE_LAYOUTS: Record<LayoutMode, Record<FormatCategory, BaseLayoutDef>> = {
  headline: {
    horizontal: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.71, normalizedY: 0.52, slotName: 'hero-headline-h' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.53, normalizedY: 0.40, slotName: 'satellite-top-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.88, normalizedY: 0.42, slotName: 'satellite-top-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.82, normalizedY: 0.72, slotName: 'satellite-bottom-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.58, normalizedY: 0.75, slotName: 'satellite-bottom-left' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.48, normalizedY: 0.22, slotName: 'ghost-far-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.92, normalizedY: 0.24, slotName: 'ghost-far-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.72, normalizedY: 0.86, slotName: 'ghost-far-bottom' },
      ],
    },
    square: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.50, normalizedY: 0.66, slotName: 'hero-headline-sq' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.26, normalizedY: 0.60, slotName: 'satellite-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.74, normalizedY: 0.60, slotName: 'satellite-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.35, normalizedY: 0.82, slotName: 'satellite-bottom-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.65, normalizedY: 0.82, slotName: 'satellite-bottom-right' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.18, normalizedY: 0.42, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.82, normalizedY: 0.42, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.50, normalizedY: 0.90, slotName: 'ghost-bottom-center' },
      ],
    },
    vertical: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.50, normalizedY: 0.63, slotName: 'hero-headline-v' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.26, normalizedY: 0.54, slotName: 'satellite-mid-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.74, normalizedY: 0.56, slotName: 'satellite-mid-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.38, normalizedY: 0.78, slotName: 'satellite-bottom-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.64, normalizedY: 0.82, slotName: 'satellite-bottom-right' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.22, normalizedY: 0.40, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.78, normalizedY: 0.42, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.50, normalizedY: 0.92, slotName: 'ghost-bottom-center' },
      ],
    },
  },
  offset: {
    horizontal: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.36, normalizedY: 0.52, slotName: 'hero-offset-h' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.55, normalizedY: 0.45, slotName: 'satellite-trail-1' },
        { role: 'foreground', size: 'S', normalizedX: 0.68, normalizedY: 0.58, slotName: 'satellite-trail-2' },
        { role: 'foreground', size: 'S', normalizedX: 0.82, normalizedY: 0.68, slotName: 'satellite-trail-3' },
        { role: 'foreground', size: 'S', normalizedX: 0.22, normalizedY: 0.66, slotName: 'satellite-flank' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.18, normalizedY: 0.35, slotName: 'ghost-flank-top' },
        { role: 'ghost', size: 'S', normalizedX: 0.88, normalizedY: 0.48, slotName: 'ghost-far-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.72, normalizedY: 0.82, slotName: 'ghost-trail-end' },
      ],
    },
    square: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.39, normalizedY: 0.45, slotName: 'hero-offset-sq' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.58, normalizedY: 0.55, slotName: 'satellite-trail-1' },
        { role: 'foreground', size: 'S', normalizedX: 0.72, normalizedY: 0.72, slotName: 'satellite-trail-2' },
        { role: 'foreground', size: 'S', normalizedX: 0.24, normalizedY: 0.62, slotName: 'satellite-flank' },
        { role: 'foreground', size: 'S', normalizedX: 0.48, normalizedY: 0.78, slotName: 'satellite-bottom' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.18, normalizedY: 0.28, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.82, normalizedY: 0.42, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.80, normalizedY: 0.85, slotName: 'ghost-bottom-right' },
      ],
    },
    vertical: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.40, normalizedY: 0.44, slotName: 'hero-offset-v' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.65, normalizedY: 0.56, slotName: 'satellite-trail-1' },
        { role: 'foreground', size: 'S', normalizedX: 0.45, normalizedY: 0.68, slotName: 'satellite-trail-2' },
        { role: 'foreground', size: 'S', normalizedX: 0.70, normalizedY: 0.78, slotName: 'satellite-trail-3' },
        { role: 'foreground', size: 'S', normalizedX: 0.25, normalizedY: 0.54, slotName: 'satellite-flank' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.20, normalizedY: 0.30, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.80, normalizedY: 0.38, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.38, normalizedY: 0.88, slotName: 'ghost-bottom' },
      ],
    },
  },
  centered: {
    horizontal: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.50, normalizedY: 0.52, slotName: 'hero-centered-h' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.34, normalizedY: 0.44, slotName: 'satellite-top-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.66, normalizedY: 0.44, slotName: 'satellite-top-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.36, normalizedY: 0.68, slotName: 'satellite-bottom-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.64, normalizedY: 0.68, slotName: 'satellite-bottom-right' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.22, normalizedY: 0.30, slotName: 'ghost-far-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.78, normalizedY: 0.30, slotName: 'ghost-far-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.50, normalizedY: 0.82, slotName: 'ghost-far-bottom' },
      ],
    },
    square: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.50, normalizedY: 0.52, slotName: 'hero-centered-sq' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.50, normalizedY: 0.30, slotName: 'satellite-diamond-top' },
        { role: 'foreground', size: 'S', normalizedX: 0.72, normalizedY: 0.52, slotName: 'satellite-diamond-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.50, normalizedY: 0.74, slotName: 'satellite-diamond-bottom' },
        { role: 'foreground', size: 'S', normalizedX: 0.28, normalizedY: 0.52, slotName: 'satellite-diamond-left' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.24, normalizedY: 0.26, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.76, normalizedY: 0.26, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.24, normalizedY: 0.78, slotName: 'ghost-bottom-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.76, normalizedY: 0.78, slotName: 'ghost-bottom-right' },
      ],
    },
    vertical: {
      hero: { role: 'foreground', size: 'L', normalizedX: 0.50, normalizedY: 0.50, slotName: 'hero-centered-v' },
      satellites: [
        { role: 'foreground', size: 'S', normalizedX: 0.50, normalizedY: 0.32, slotName: 'satellite-top' },
        { role: 'foreground', size: 'S', normalizedX: 0.70, normalizedY: 0.48, slotName: 'satellite-right' },
        { role: 'foreground', size: 'S', normalizedX: 0.30, normalizedY: 0.52, slotName: 'satellite-left' },
        { role: 'foreground', size: 'S', normalizedX: 0.50, normalizedY: 0.68, slotName: 'satellite-bottom' },
      ],
      ghosts: [
        { role: 'ghost', size: 'S', normalizedX: 0.25, normalizedY: 0.22, slotName: 'ghost-top-left' },
        { role: 'ghost', size: 'S', normalizedX: 0.75, normalizedY: 0.22, slotName: 'ghost-top-right' },
        { role: 'ghost', size: 'S', normalizedX: 0.50, normalizedY: 0.84, slotName: 'ghost-bottom' },
      ],
    },
  },
};

/**
 * Registry of all 18 canonical layout templates.
 * Key format: `${layoutMode}_${formatCategory}_${includeBackgrounds ? 'bg' : 'nobg'}`
 */
export const LAYOUT_TEMPLATES: Record<string, LayoutTemplate> = {};

const MODES: LayoutMode[] = ['headline', 'offset', 'centered'];
const CATEGORIES: FormatCategory[] = ['horizontal', 'square', 'vertical'];
const BG_OPTIONS: boolean[] = [false, true];

for (const mode of MODES) {
  for (const cat of CATEGORIES) {
    for (const bg of BG_OPTIONS) {
      const def = BASE_LAYOUTS[mode][cat];
      const key = `${mode}_${cat}_${bg ? 'bg' : 'nobg'}`;
      LAYOUT_TEMPLATES[key] = {
        layoutMode: mode,
        formatCategory: cat,
        includeBackgrounds: bg,
        heroSlot: def.hero,
        satelliteSlots: def.satellites,
        ghostSlots: bg ? def.ghosts : [],
      };
    }
  }
}

export function getLayoutTemplate(
  layoutMode: LayoutMode,
  format: CanvasFormatId,
  includeBackgrounds: boolean
): LayoutTemplate {
  const cat = getFormatCategory(format);
  const key = `${layoutMode}_${cat}_${includeBackgrounds ? 'bg' : 'nobg'}`;
  return LAYOUT_TEMPLATES[key] ?? LAYOUT_TEMPLATES[`centered_horizontal_${includeBackgrounds ? 'bg' : 'nobg'}`];
}
