import type { FC } from 'react';
import type { AssetId, AssetSize, ComponentMetadata } from '../types/schema';
import { ASSET_VIEWBOX_SIZE } from '../types/schema';
import type { AssetProps } from './primitives';

// Import all 10 isometric vector asset components
import { WalletAsset } from './items/WalletAsset';
import { SmartphoneAsset } from './items/SmartphoneAsset';
import { PuzzleAsset } from './items/PuzzleAsset';
import { CoinAsset } from './items/CoinAsset';
import { HeadphonesAsset } from './items/HeadphonesAsset';
import { LampAsset } from './items/LampAsset';
import { FlowersVaseAsset } from './items/FlowersVaseAsset';
import { NotepadAsset } from './items/NotepadAsset';
import { FolderAsset } from './items/FolderAsset';
import { PenAsset } from './items/PenAsset';

export interface AssetRegistryEntry {
  metadata: ComponentMetadata;
  Component: FC<AssetProps>;
}

const DEFAULT_ANCHOR: Record<AssetSize, { x: number; y: number }> = {
  L: { x: 300, y: 300 },
  S: { x: 100, y: 100 },
};

export const ASSET_REGISTRY: Record<AssetId, AssetRegistryEntry> = {
  wallet: {
    Component: WalletAsset,
    metadata: {
      id: 'wallet',
      nameRu: 'Кошелёк',
      nameEn: 'Wallet',
      category: 'finance',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 200, S: 70 },
      keywords: [
        'кошел',
        'бюджет',
        'оплат',
        'карт',
        'кэшбэк',
        'трат',
        'экономи',
        'банков',
        'деньги',
        'платеж',
        'wallet',
        'budget',
        'pay',
        'card',
        'bank',
        'money',
      ],
      heroSuitability: 0.95,
    },
  },
  smartphone: {
    Component: SmartphoneAsset,
    metadata: {
      id: 'smartphone',
      nameRu: 'Смартфон',
      nameEn: 'Smartphone',
      category: 'tech',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 210, S: 75 },
      keywords: [
        'прилож',
        'мобил',
        'соцсет',
        'сервис',
        'интерфейс',
        'мессендж',
        'диджитал',
        'телефон',
        'экран',
        'девайс',
        'app',
        'mobile',
        'tech',
        'ux',
        'ui',
        'phone',
        'digital',
      ],
      heroSuitability: 0.95,
    },
  },
  puzzle: {
    Component: PuzzleAsset,
    metadata: {
      id: 'puzzle',
      nameRu: 'Пазл',
      nameEn: 'Puzzle',
      category: 'tech',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 180, S: 65 },
      keywords: [
        'микросервис',
        'систем',
        'архитектур',
        'интеграц',
        'команд',
        'решен',
        'логик',
        'масштаб',
        'пазл',
        'деталь',
        'модуль',
        'scale',
        'api',
        'system',
        'puzzle',
        'architecture',
        'modular',
      ],
      heroSuitability: 0.9,
    },
  },
  coin: {
    Component: CoinAsset,
    metadata: {
      id: 'coin',
      nameRu: 'Монета',
      nameEn: 'Coin',
      category: 'finance',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 160, S: 55 },
      keywords: [
        'финанс',
        'деньг',
        'инвест',
        'налог',
        'доход',
        'продаж',
        'бизнес',
        'крипт',
        'валют',
        'монет',
        'прибыль',
        'капитал',
        'finance',
        'money',
        'roi',
        'coin',
        'crypto',
        'revenue',
        'investment',
      ],
      heroSuitability: 0.85,
    },
  },
  headphones: {
    Component: HeadphonesAsset,
    metadata: {
      id: 'headphones',
      nameRu: 'Наушники',
      nameEn: 'Headphones',
      category: 'lifestyle',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 190, S: 70 },
      keywords: [
        'подкаст',
        'музык',
        'звук',
        'аудио',
        'фокус',
        'медитац',
        'стрим',
        'плейлист',
        'наушники',
        'контент',
        'audio',
        'podcast',
        'focus',
        'music',
        'headphones',
        'stream',
      ],
      heroSuitability: 0.9,
    },
  },
  lamp: {
    Component: LampAsset,
    metadata: {
      id: 'lamp',
      nameRu: 'Лампа',
      nameEn: 'Desk Lamp',
      category: 'creativity',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 200, S: 75 },
      keywords: [
        'иде',
        'инсайт',
        'креатив',
        'стартап',
        'озарен',
        'дизайн',
        'бренд',
        'свет',
        'лампа',
        'мысль',
        'вдохновение',
        'idea',
        'startup',
        'creative',
        'lamp',
        'insight',
        'design',
        'light',
      ],
      heroSuitability: 0.9,
    },
  },
  flowers_vase: {
    Component: FlowersVaseAsset,
    metadata: {
      id: 'flowers_vase',
      nameRu: 'Ваза с цветами',
      nameEn: 'Flowers in Vase',
      category: 'lifestyle',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 190, S: 70 },
      keywords: [
        'лайфстайл',
        'дом',
        'уют',
        'здоров',
        'выгоран',
        'баланс',
        'эко',
        'интерьер',
        'цветы',
        'ваза',
        'природа',
        'гармония',
        'life',
        'wellness',
        'balance',
        'flowers',
        'vase',
        'eco',
        'harmony',
      ],
      heroSuitability: 0.85,
    },
  },
  notepad: {
    Component: NotepadAsset,
    metadata: {
      id: 'notepad',
      nameRu: 'Блокнот',
      nameEn: 'Notepad',
      category: 'work',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 210, S: 75 },
      keywords: [
        'план',
        'чеклист',
        'заметк',
        'стратеги',
        'продуктив',
        'задач',
        'обучение',
        'конспект',
        'книга',
        'блокнот',
        'спринт',
        'plan',
        'study',
        'notes',
        'notepad',
        'book',
        'tasks',
        'strategy',
      ],
      heroSuitability: 0.95,
    },
  },
  folder: {
    Component: FolderAsset,
    metadata: {
      id: 'folder',
      nameRu: 'Папка',
      nameEn: 'Folder',
      category: 'work',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 200, S: 70 },
      keywords: [
        'документ',
        'отчёт',
        'архив',
        'договор',
        'право',
        'hr',
        'база',
        'файл',
        'процесс',
        'папка',
        'структура',
        'docs',
        'report',
        'legal',
        'folder',
        'archive',
        'files',
        'process',
      ],
      heroSuitability: 0.9,
    },
  },
  pen: {
    Component: PenAsset,
    metadata: {
      id: 'pen',
      nameRu: 'Ручка',
      nameEn: 'Pen',
      category: 'creativity',
      dimensions: ASSET_VIEWBOX_SIZE,
      anchor: DEFAULT_ANCHOR,
      collisionRadiusPx: { L: 150, S: 50 },
      keywords: [
        'текст',
        'стать',
        'копирайт',
        'редакц',
        'блог',
        'автор',
        'письм',
        'гайд',
        'ручка',
        'карандаш',
        'контент',
        'write',
        'copy',
        'blog',
        'pen',
        'pencil',
        'article',
        'author',
      ],
      heroSuitability: 0.75,
    },
  },
};

export function getAsset(id: AssetId): AssetRegistryEntry {
  const entry = ASSET_REGISTRY[id];
  if (!entry) {
    throw new Error(`Unknown asset id: ${id}`);
  }
  return entry;
}

export function getAssetMetadata(id: AssetId): ComponentMetadata {
  return getAsset(id).metadata;
}

export function getAssetComponent(id: AssetId): FC<AssetProps> {
  return getAsset(id).Component;
}

export function getAllAssets(): AssetRegistryEntry[] {
  return Object.values(ASSET_REGISTRY);
}

export function getAllAssetIds(): AssetId[] {
  return Object.keys(ASSET_REGISTRY) as AssetId[];
}

export function getAssetsByCategory(category: ComponentMetadata['category']): AssetRegistryEntry[] {
  return getAllAssets().filter((entry) => entry.metadata.category === category);
}

// Re-export individual components for direct imports
export {
  WalletAsset,
  SmartphoneAsset,
  PuzzleAsset,
  CoinAsset,
  HeadphonesAsset,
  LampAsset,
  FlowersVaseAsset,
  NotepadAsset,
  FolderAsset,
  PenAsset,
};
