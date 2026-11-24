import { AssetId, CanvasFormatId, CanvasItem, ItemRole, PaletteId } from '../types/schema';

export type CanonicalCompositionId =
  | 'phone-puzzles'
  | 'book-phone'
  | 'folder-wallet-coin'
  | 'headphones-flowers'
  | 'lamp-wallet-coin'
  | 'book-puzzles-pen';

export type CanonicalPairingNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface CanonicalSlotDefinition {
  assetId: AssetId;
  size: 'L' | 'S';
  role: ItemRole;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  manualLayerOffset: number;
  opacity?: number;
}

export interface CanonicalCompositionConfig {
  id: CanonicalCompositionId;
  pairingNumber: CanonicalPairingNumber;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  metaphors: string[];
  componentNamesRu: string[];
  componentNamesEn: string[];
  recommendedPalette: PaletteId;
  slotsByFormat: Record<CanvasFormatId, CanonicalSlotDefinition[]>;
}

/**
 * 6 Canonical Pairings from Studio «Очень» ТЗ:
 * 1. Phone + Puzzles
 * 2. Book + Phone (Phone resting on Book pages)
 * 3. Folder + Wallet + Coin
 * 4. Headphones (75% frame) + Flowers Vase (Ghost silhouette background)
 * 5. Lamp (Ghost) + Wallet + Coin
 * 6. Book (Ghost) + Puzzles on pages + Pen
 *
 * Scales for standard formats:
 * - 1:1 and 16:9: strictly within 1.4 - 1.8x
 * - 9:16 (vertical Stories 1080x1920): strictly within 2.4 - 3.4x to fill ~80-85% width
 * for primary assets to fill the artboard proportionally.
 */
export const CANONICAL_COMPOSITIONS: Record<CanonicalCompositionId, CanonicalCompositionConfig> = {
  'phone-puzzles': {
    id: 'phone-puzzles',
    pairingNumber: 1,
    titleRu: 'Телефон + Пазлы',
    titleEn: 'Phone + Puzzles',
    descriptionRu: 'Смартфон и стыкующиеся пазлы: мобильные технологии, системная логика, IT',
    metaphors: ['tech', 'mobile', 'apps', 'architecture', 'microservices', 'технологии', 'айти', 'приложения'],
    componentNamesRu: ['телефон', 'смартфон', 'пазл', 'пазлы'],
    componentNamesEn: ['phone', 'smartphone', 'puzzle', 'puzzles'],
    recommendedPalette: 'lavender',
    slotsByFormat: {
      '1:1': [
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 480, y: 640, scale: 1.7, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 620, y: 440, scale: 1.55, rotation: 0, manualLayerOffset: 0 },
      ],
      '16:9': [
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 800, y: 640, scale: 1.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 1080, y: 440, scale: 1.65, rotation: 0, manualLayerOffset: 0 },
      ],
      '9:16': [
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 500, y: 1300, scale: 2.9, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 580, y: 720, scale: 2.6, rotation: 0, manualLayerOffset: 0 },
      ],
      og: [
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 520, y: 360, scale: 1.55, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 680, y: 260, scale: 1.35, rotation: 0, manualLayerOffset: 0 },
      ],
    },
  },

  'book-phone': {
    id: 'book-phone',
    pairingNumber: 2,
    titleRu: 'Книга + Телефон',
    titleEn: 'Book + Phone',
    descriptionRu: 'Смартфон лежит на раскрытых страницах книги: образование, конспекты, диджитал-учёба',
    metaphors: ['study', 'education', 'learning', 'knowledge', 'student', 'учеба', 'обучение', 'книга', 'курс'],
    componentNamesRu: ['книга', 'блокнот', 'телефон', 'смартфон'],
    componentNamesEn: ['book', 'notepad', 'phone', 'smartphone'],
    recommendedPalette: 'lavender',
    slotsByFormat: {
      '1:1': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 460, y: 520, scale: 1.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 620, y: 500, scale: 1.45, rotation: 0, manualLayerOffset: 1 },
      ],
      '16:9': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 880, y: 560, scale: 1.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 1080, y: 540, scale: 1.45, rotation: 0, manualLayerOffset: 1 },
      ],
      '9:16': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 360, y: 940, scale: 3.35, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 600, y: 1040, scale: 2.7, rotation: 0, manualLayerOffset: 1 },
      ],
      og: [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 560, y: 310, scale: 1.55, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'smartphone', size: 'L', role: 'foreground', x: 660, y: 330, scale: 1.40, rotation: 0, manualLayerOffset: 1 },
      ],
    },
  },

  'folder-wallet-coin': {
    id: 'folder-wallet-coin',
    pairingNumber: 3,
    titleRu: 'Папка + Кошелёк + Монета',
    titleEn: 'Folder + Wallet + Coin',
    descriptionRu: 'Папка документов, кошелёк и золотая монета: корпоративные финансы, отчётность, налоги',
    metaphors: ['finance', 'banking', 'money', 'corporate', 'accounting', 'финансы', 'деньги', 'банк', 'отчет', 'документы'],
    componentNamesRu: ['папка', 'кошелек', 'кошелёк', 'монета', 'деньги'],
    componentNamesEn: ['folder', 'wallet', 'coin', 'money'],
    recommendedPalette: 'peach-mint',
    slotsByFormat: {
      '1:1': [
        { assetId: 'folder', size: 'L', role: 'foreground', x: 620, y: 380, scale: 1.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 380, y: 660, scale: 1.5, rotation: 0, manualLayerOffset: 1 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 700, y: 720, scale: 1.45, rotation: 0, manualLayerOffset: 2 },
      ],
      '16:9': [
        { assetId: 'folder', size: 'L', role: 'foreground', x: 1060, y: 380, scale: 1.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 780, y: 660, scale: 1.5, rotation: 0, manualLayerOffset: 1 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 1140, y: 720, scale: 1.45, rotation: 0, manualLayerOffset: 2 },
      ],
      '9:16': [
        { assetId: 'folder', size: 'L', role: 'foreground', x: 340, y: 280, scale: 3.3, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 340, y: 1440, scale: 2.75, rotation: 0, manualLayerOffset: 1 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 760, y: 1560, scale: 2.2, rotation: 0, manualLayerOffset: 2 },
      ],
      og: [
        { assetId: 'folder', size: 'L', role: 'foreground', x: 640, y: 220, scale: 1.55, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 480, y: 380, scale: 1.40, rotation: 0, manualLayerOffset: 1 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 720, y: 440, scale: 1.35, rotation: 0, manualLayerOffset: 2 },
      ],
    },
  },

  'headphones-flowers': {
    id: 'headphones-flowers',
    pairingNumber: 4,
    titleRu: 'Наушники + Ваза с цветами',
    titleEn: 'Headphones + Flowers Vase',
    descriptionRu: 'Крупные наушники (75% кадра) и ваза с цветами на фоне: музыка, подкасты, лайфстайл',
    metaphors: ['music', 'podcast', 'audio', 'sound', 'lifestyle', 'calm', 'музыка', 'подкаст', 'звук', 'лайфстайл', 'цветы'],
    componentNamesRu: ['наушники', 'ваза', 'цветы', 'растение'],
    componentNamesEn: ['headphones', 'vase', 'flowers', 'plant'],
    recommendedPalette: 'turquoise-purple',
    slotsByFormat: {
      '1:1': [
        { assetId: 'flowers_vase', size: 'L', role: 'ghost', x: 380, y: 380, scale: 1.6, rotation: 0, manualLayerOffset: -1, opacity: 0.22 },
        { assetId: 'headphones', size: 'L', role: 'foreground', x: 540, y: 640, scale: 1.8, rotation: 0, manualLayerOffset: 1 },
      ],
      '16:9': [
        { assetId: 'flowers_vase', size: 'L', role: 'ghost', x: 740, y: 380, scale: 1.6, rotation: 0, manualLayerOffset: -1, opacity: 0.22 },
        { assetId: 'headphones', size: 'L', role: 'foreground', x: 980, y: 640, scale: 1.8, rotation: 0, manualLayerOffset: 1 },
      ],
      '9:16': [
        { assetId: 'flowers_vase', size: 'L', role: 'ghost', x: 420, y: 640, scale: 2.9, rotation: 0, manualLayerOffset: -1, opacity: 0.22 },
        { assetId: 'headphones', size: 'L', role: 'foreground', x: 520, y: 1400, scale: 3.05, rotation: 0, manualLayerOffset: 1 },
      ],
      og: [
        { assetId: 'flowers_vase', size: 'L', role: 'ghost', x: 490, y: 220, scale: 1.45, rotation: 0, manualLayerOffset: -1, opacity: 0.22 },
        { assetId: 'headphones', size: 'L', role: 'foreground', x: 630, y: 370, scale: 1.55, rotation: 0, manualLayerOffset: 1 },
      ],
    },
  },

  'lamp-wallet-coin': {
    id: 'lamp-wallet-coin',
    pairingNumber: 5,
    titleRu: 'Лампа + Кошелёк + Монета',
    titleEn: 'Lamp + Wallet + Coin',
    descriptionRu: 'Силуэт лампы идеи на фоне, кошелёк и монета на переднем плане: финтех-инновации, венчур',
    metaphors: ['fintech', 'venture', 'crypto', 'startup', 'investment', 'финтех', 'стартап', 'инвестиции', 'крипта', 'идея'],
    componentNamesRu: ['лампа', 'кошелек', 'кошелёк', 'монета'],
    componentNamesEn: ['lamp', 'wallet', 'coin'],
    recommendedPalette: 'peach-mint',
    slotsByFormat: {
      '1:1': [
        { assetId: 'lamp', size: 'L', role: 'ghost', x: 420, y: 400, scale: 1.6, rotation: 0, manualLayerOffset: -2, opacity: 0.22 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 560, y: 580, scale: 1.5, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 800, y: 640, scale: 1.45, rotation: 0, manualLayerOffset: 1 },
      ],
      '16:9': [
        { assetId: 'lamp', size: 'L', role: 'ghost', x: 800, y: 400, scale: 1.6, rotation: 0, manualLayerOffset: -2, opacity: 0.22 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 960, y: 580, scale: 1.5, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 1210, y: 640, scale: 1.45, rotation: 0, manualLayerOffset: 1 },
      ],
      '9:16': [
        { assetId: 'lamp', size: 'L', role: 'ghost', x: 400, y: 560, scale: 3.0, rotation: 0, manualLayerOffset: -2, opacity: 0.22 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 400, y: 1420, scale: 2.8, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 760, y: 1540, scale: 2.2, rotation: 0, manualLayerOffset: 1 },
      ],
      og: [
        { assetId: 'lamp', size: 'L', role: 'ghost', x: 480, y: 230, scale: 1.45, rotation: 0, manualLayerOffset: -2, opacity: 0.22 },
        { assetId: 'wallet', size: 'L', role: 'foreground', x: 600, y: 340, scale: 1.50, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'coin', size: 'S', role: 'foreground', x: 850, y: 410, scale: 1.35, rotation: 0, manualLayerOffset: 1 },
      ],
    },
  },

  'book-puzzles-pen': {
    id: 'book-puzzles-pen',
    pairingNumber: 6,
    titleRu: 'Книга + Пазлы + Ручка',
    titleEn: 'Book + Puzzles + Pen',
    descriptionRu: 'Открытая книга на столе, пазлы на страницах и перо/ручка: творчество, стратегия, писательство',
    metaphors: ['creative', 'design', 'strategy', 'writing', 'editorial', 'story', 'креатив', 'творчество', 'стратегия', 'дизайн', 'статья'],
    componentNamesRu: ['книга', 'блокнот', 'пазл', 'пазлы', 'ручка', 'перо'],
    componentNamesEn: ['book', 'notepad', 'puzzle', 'puzzles', 'pen'],
    recommendedPalette: 'lavender',
    slotsByFormat: {
      '1:1': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 500, y: 480, scale: 1.7, rotation: 0, manualLayerOffset: -1, opacity: 1.0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 440, y: 440, scale: 1.45, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'pen', size: 'L', role: 'foreground', x: 620, y: 660, scale: 1.5, rotation: 30, manualLayerOffset: 1 },
      ],
      '16:9': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 1020, y: 500, scale: 1.7, rotation: 0, manualLayerOffset: -1, opacity: 1.0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 960, y: 460, scale: 1.45, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'pen', size: 'L', role: 'foreground', x: 1140, y: 680, scale: 1.5, rotation: 30, manualLayerOffset: 1 },
      ],
      '9:16': [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 440, y: 440, scale: 3.35, rotation: 0, manualLayerOffset: -1, opacity: 1.0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 320, y: 460, scale: 2.4, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'pen', size: 'L', role: 'foreground', x: 600, y: 1480, scale: 2.8, rotation: 30, manualLayerOffset: 1 },
      ],
      og: [
        { assetId: 'notepad', size: 'L', role: 'foreground', x: 580, y: 290, scale: 1.55, rotation: 0, manualLayerOffset: -1, opacity: 1.0 },
        { assetId: 'puzzle', size: 'L', role: 'foreground', x: 530, y: 260, scale: 1.35, rotation: 0, manualLayerOffset: 0 },
        { assetId: 'pen', size: 'L', role: 'foreground', x: 680, y: 380, scale: 1.40, rotation: 30, manualLayerOffset: 1 },
      ],
    },
  },
};

export const CANONICAL_PAIRING_PRESETS = Object.values(CANONICAL_COMPOSITIONS);

export function getCanonicalComposition(
  idOrNumber: CanonicalCompositionId | CanonicalPairingNumber | number,
  format: CanvasFormatId = '1:1'
): CanvasItem[] {
  let config: CanonicalCompositionConfig | undefined;

  if (typeof idOrNumber === 'number') {
    config = CANONICAL_PAIRING_PRESETS.find((p) => p.pairingNumber === idOrNumber);
  } else {
    config = CANONICAL_COMPOSITIONS[idOrNumber];
  }

  if (!config) {
    config = CANONICAL_COMPOSITIONS['phone-puzzles'];
  }

  const slots = config.slotsByFormat[format] ?? config.slotsByFormat['1:1'];

  return slots.map((slot, idx) => ({
    uid: `canonical-${config!.id}-${slot.assetId}-${idx}`,
    assetId: slot.assetId,
    size: slot.size,
    role: slot.role,
    x: slot.x,
    y: slot.y,
    zHeight: 0,
    rotation: slot.rotation,
    scale: slot.scale,
    opacity: slot.opacity ?? (slot.role === 'ghost' ? 0.22 : 1.0),
    manualLayerOffset: slot.manualLayerOffset,
  }));
}

/**
 * Returns whether a canonical composition uses a flat background without the 30° diagonal split desk surface.
 * Story 1 ("Телефон + Пазлы") canonically uses a clean, flat lavender background.
 */
export function isFlatCanonicalComposition(
  idOrNumber: CanonicalCompositionId | CanonicalPairingNumber | number
): boolean {
  if (idOrNumber === 1 || idOrNumber === 'phone-puzzles') return true;
  return false;
}
