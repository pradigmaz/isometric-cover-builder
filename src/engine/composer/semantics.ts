import { AssetId, CanvasFormatId, LayoutMode, PaletteId } from '../../types/schema';

export interface SemanticDictionaryEntry {
  assetId: AssetId;
  roots: string[];
  fallbackComplements: AssetId[];
  preferredPalettes: PaletteId[];
  baseSuitability: number;
}

export const SEMANTIC_DICTIONARY: SemanticDictionaryEntry[] = [
  {
    assetId: 'wallet',
    roots: [
      'кошел', 'бюджет', 'оплат', 'карт', 'кэшбэк', 'трат', 'экономи', 'банков',
      'кошель', 'финтех', 'платеж', 'расход', 'wallet', 'budget', 'pay', 'card',
      'cash', 'expense', 'bank', 'fintech',
    ],
    fallbackComplements: ['coin', 'smartphone', 'notepad', 'folder'],
    preferredPalettes: ['fresh-mint', 'warm-pastel'],
    baseSuitability: 0.9,
  },
  {
    assetId: 'smartphone',
    roots: [
      'прилож', 'мобил', 'соцсет', 'сервис', 'интерфейс', 'мессендж', 'диджитал',
      'девайс', 'телефон', 'смартфон', 'экран', 'app', 'mobile', 'tech', 'ux',
      'ui', 'phone', 'device', 'digital', 'screen',
    ],
    fallbackComplements: ['headphones', 'puzzle', 'lamp', 'notepad'],
    preferredPalettes: ['warm-pastel', 'fresh-mint'],
    baseSuitability: 0.92,
  },
  {
    assetId: 'puzzle',
    roots: [
      'микросервис', 'систем', 'архитектур', 'интеграц', 'команд', 'решен',
      'логик', 'масштаб', 'пазл', 'модул', 'компонент', 'сложн', 'scale',
      'api', 'system', 'arch', 'puzzle', 'logic', 'modular', 'microservice', 'team',
    ],
    fallbackComplements: ['lamp', 'smartphone', 'folder', 'notepad'],
    preferredPalettes: ['warm-pastel'],
    baseSuitability: 0.95,
  },
  {
    assetId: 'coin',
    roots: [
      'финанс', 'деньг', 'инвест', 'налог', 'доход', 'продаж', 'бизнес', 'крипт',
      'валют', 'монет', 'прибыль', 'выручк', 'казна', 'капитал', 'finance',
      'money', 'roi', 'coin', 'invest', 'crypto', 'revenue', 'profit', 'tax', 'business',
    ],
    fallbackComplements: ['wallet', 'folder', 'smartphone', 'notepad'],
    preferredPalettes: ['fresh-mint'],
    baseSuitability: 0.88,
  },
  {
    assetId: 'headphones',
    roots: [
      'подкаст', 'музык', 'звук', 'аудио', 'фокус', 'медитац', 'стрим', 'плейлист',
      'наушник', 'трек', 'радио', 'голос', 'эфир', 'audio', 'podcast', 'focus',
      'sound', 'music', 'stream', 'playlist', 'track', 'listen', 'headphones',
    ],
    fallbackComplements: ['lamp', 'smartphone', 'pen', 'flowers_vase'],
    preferredPalettes: ['soft-coral', 'warm-pastel'],
    baseSuitability: 0.86,
  },
  {
    assetId: 'lamp',
    roots: [
      'иде', 'инсайт', 'креатив', 'стартап', 'озарен', 'дизайн', 'бренд', 'свет',
      'ламп', 'концепт', 'вдохнов', 'эврика', 'мысл', 'творч', 'idea', 'startup',
      'creative', 'light', 'lamp', 'insight', 'design', 'concept', 'innovation',
    ],
    fallbackComplements: ['puzzle', 'notepad', 'pen', 'smartphone'],
    preferredPalettes: ['warm-pastel', 'soft-coral'],
    baseSuitability: 0.91,
  },
  {
    assetId: 'flowers_vase',
    roots: [
      'лайфстайл', 'дом', 'уют', 'здоров', 'выгоран', 'баланс', 'эко', 'интерьер',
      'цвет', 'ваз', 'природа', 'отдых', 'забот', 'релакс', 'гармони', 'комфорт',
      'life', 'wellness', 'balance', 'flower', 'eco', 'plant', 'home', 'care', 'nature',
    ],
    fallbackComplements: ['notepad', 'headphones', 'lamp', 'wallet'],
    preferredPalettes: ['fresh-mint', 'soft-coral'],
    baseSuitability: 0.82,
  },
  {
    assetId: 'notepad',
    roots: [
      'план', 'чеклист', 'заметк', 'стратеги', 'продуктив', 'задач', 'обучение',
      'конспект', 'блокнот', 'расписан', 'трекер', 'список', 'тайм', 'курс',
      'plan', 'study', 'notes', 'checklist', 'task', 'strategy', 'todo', 'productivity',
    ],
    fallbackComplements: ['pen', 'folder', 'lamp', 'smartphone'],
    preferredPalettes: ['warm-pastel'],
    baseSuitability: 0.85,
  },
  {
    assetId: 'folder',
    roots: [
      'документ', 'отчёт', 'архив', 'договор', 'право', 'hr', 'база', 'файл',
      'процесс', 'папк', 'каталог', 'проект', 'бухгалтер', 'юрист', 'данн',
      'docs', 'report', 'legal', 'file', 'folder', 'archive', 'contract', 'process',
    ],
    fallbackComplements: ['notepad', 'pen', 'wallet', 'coin'],
    preferredPalettes: ['fresh-mint'],
    baseSuitability: 0.83,
  },
  {
    assetId: 'pen',
    roots: [
      'текст', 'стать', 'копирайт', 'редакц', 'блог', 'автор', 'письм', 'гайд',
      'книга', 'ручк', 'перо', 'пост', 'лонгрид', 'контент', 'сценари',
      'write', 'copy', 'blog', 'text', 'article', 'content', 'story', 'author', 'pen',
    ],
    fallbackComplements: ['notepad', 'folder', 'lamp', 'headphones'],
    preferredPalettes: ['soft-coral'],
    baseSuitability: 0.84,
  },
];

export function hashString(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tokenizePrompt(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

export function scoreAssets(
  tokens: string[],
  rng: () => number
): Record<AssetId, number> {
  const scores: Record<AssetId, number> = {
    wallet: 0,
    smartphone: 0,
    puzzle: 0,
    coin: 0,
    headphones: 0,
    lamp: 0,
    flowers_vase: 0,
    notepad: 0,
    folder: 0,
    pen: 0,
  };

  for (const sem of SEMANTIC_DICTIONARY) {
    let matchCount = 0;
    for (const token of tokens) {
      for (const root of sem.roots) {
        if (token.includes(root) || root.includes(token)) {
          matchCount += 1;
        }
      }
    }
    scores[sem.assetId] = matchCount * 10 + sem.baseSuitability + (matchCount === 0 ? rng() * 0.1 : 0);
  }
  return scores;
}

export function recommendPalette(
  heroAsset: AssetId,
  satellites: AssetId[],
  requestedPalette?: PaletteId | 'auto'
): PaletteId {
  if (requestedPalette && requestedPalette !== 'auto') {
    return requestedPalette;
  }
  const votes: Record<PaletteId, number> = {
    'fresh-mint': 0,
    'warm-pastel': 0,
    'soft-coral': 0,
  };
  const heroSem = SEMANTIC_DICTIONARY.find((s) => s.assetId === heroAsset);
  heroSem?.preferredPalettes.forEach((p, idx) => {
    votes[p] += idx === 0 ? 10 : 3;
  });
  for (const satId of satellites) {
    const satSem = SEMANTIC_DICTIONARY.find((s) => s.assetId === satId);
    satSem?.preferredPalettes.forEach((p, idx) => {
      votes[p] += idx === 0 ? 2 : 1;
    });
  }
  let best: PaletteId = 'warm-pastel';
  let max = -1;
  for (const [pal, score] of Object.entries(votes) as [PaletteId, number][]) {
    if (score > max) {
      max = score;
      best = pal;
    }
  }
  return best;
}

export function resolveLayoutMode(
  requestedMode: LayoutMode | 'auto',
  tokens: string[],
  format: CanvasFormatId
): LayoutMode {
  if (requestedMode && requestedMode !== 'auto') {
    return requestedMode;
  }
  for (const token of tokens) {
    if (token.startsWith('заголов') || token.startsWith('head') || token.startsWith('стать')) {
      return 'headline';
    }
    if (token.startsWith('шлейф') || token.startsWith('смещ') || token.startsWith('offset') || token.startsWith('диагон')) {
      return 'offset';
    }
    if (token.startsWith('центр') || token.startsWith('собра') || token.startsWith('center') || token.startsWith('пирамид')) {
      return 'centered';
    }
  }
  return format === '1:1' ? 'centered' : 'headline';
}
