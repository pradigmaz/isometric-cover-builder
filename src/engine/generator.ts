import {
  AICompositionRequest,
  AICompositionResponse,
  AssetId,
  AssetSize,
  CanvasFormatId,
  CanvasItem,
  LayoutMode,
  PaletteId,
} from '../types/schema';
import {
  CANONICAL_COMPOSITIONS,
  CANONICAL_PAIRING_PRESETS,
  CanonicalCompositionConfig,
  CanonicalCompositionId,
  getCanonicalComposition,
} from './canonicalCompositions';
import { COMPONENT_KEYWORD_MAP } from './componentKeywords';
import { clampItemsToArtboard, composeSmartHierarchy, enforceAntiClumping, ParsedItemRequest } from './smartComposer';
import { rearrangeItemsForLayout } from '../store/layoutReorder';
import { createPrng } from './composer/semantics';

export type { ParsedItemRequest };

export const CANONICAL_PALETTES = ['lavender', 'peach-mint', 'turquoise-purple'] as const;

export function resolveDynamicPalette(seed?: number, requestedPalette?: PaletteId | 'auto'): PaletteId {
  if (requestedPalette && requestedPalette !== 'auto') {
    return requestedPalette;
  }
  if (seed === undefined) {
    return 'lavender';
  }
  const abs = Math.abs(seed);
  const idx = abs < 10 ? abs % CANONICAL_PALETTES.length : ((abs >> 2) ^ abs) % CANONICAL_PALETTES.length;
  return CANONICAL_PALETTES[Math.abs(idx) % CANONICAL_PALETTES.length];
}

interface MetaphorDomainDef {
  keywords: string[];
  canonical: CanonicalCompositionId;
  alternates: CanonicalCompositionId[];
}

const METAPHOR_DOMAINS: MetaphorDomainDef[] = [
  {
    keywords: ['tech', 'mobile', 'apps', 'architecture', 'microservices', 'технологии', 'тех', 'айти', 'приложения', 'системы', 'код'],
    canonical: 'phone-puzzles',
    alternates: ['phone-puzzles', 'book-phone', 'lamp-wallet-coin', 'book-puzzles-pen'],
  },
  {
    keywords: ['study', 'education', 'learning', 'knowledge', 'course', 'student', 'учеба', 'учёба', 'образование', 'обучение', 'конспект', 'курс', 'студент'],
    canonical: 'book-phone',
    alternates: ['book-phone', 'book-puzzles-pen'],
  },
  {
    keywords: ['finance', 'banking', 'corporate', 'accounting', 'tax', 'report', 'финансы', 'банк', 'бухгалтерия', 'отчет', 'отчётность', 'налоги', 'корпоратив'],
    canonical: 'folder-wallet-coin',
    alternates: ['folder-wallet-coin', 'book-phone', 'book-puzzles-pen', 'lamp-wallet-coin'],
  },
  {
    keywords: ['music', 'podcast', 'audio', 'sound', 'lifestyle', 'calm', 'музыка', 'подкаст', 'аудио', 'звук', 'лайфстайл', 'трек', 'релакс'],
    canonical: 'headphones-flowers',
    alternates: ['headphones-flowers'],
  },
  {
    keywords: ['fintech', 'venture', 'crypto', 'startup', 'investment', 'capital', 'финтех', 'стартап', 'инвестиции', 'венчур', 'крипта', 'капитал'],
    canonical: 'lamp-wallet-coin',
    alternates: ['lamp-wallet-coin', 'folder-wallet-coin', 'phone-puzzles', 'book-phone'],
  },
  {
    keywords: ['creative', 'design', 'strategy', 'writing', 'editorial', 'story', 'author', 'креатив', 'творчество', 'стратегия', 'дизайн', 'статья', 'писатель', 'копирайтинг'],
    canonical: 'book-puzzles-pen',
    alternates: ['book-puzzles-pen', 'phone-puzzles', 'headphones-flowers', 'lamp-wallet-coin'],
  },
  {
    keywords: ['productivity', 'продуктивность', 'продуктивн', 'эффективность', 'планирование', 'фокус', 'тайм'],
    canonical: 'book-puzzles-pen',
    alternates: ['book-puzzles-pen', 'book-phone'],
  },
];

export function matchComponentKeyword(token: string): AssetId | undefined {
  if (COMPONENT_KEYWORD_MAP[token]) return COMPONENT_KEYWORD_MAP[token];
  if (token.startsWith('кошел')) return 'wallet';
  if (token.startsWith('смартфон') || token.startsWith('телефон') || token.startsWith('мобил')) return 'smartphone';
  if (token.startsWith('монет')) return 'coin';
  if (token.startsWith('наушник')) return 'headphones';
  if (token.startsWith('книг') || token.startsWith('книж') || token.startsWith('блокнот')) return 'notepad';
  if (token.startsWith('папк')) return 'folder';
  if (token.startsWith('пазл')) return 'puzzle';
  if (token.startsWith('ламп')) return 'lamp';
  if (token.startsWith('ваз') || token.startsWith('букет')) return 'flowers_vase';
  if (token.startsWith('ручк') || token.startsWith('карандаш')) return 'pen';
  return undefined;
}

export function parseComponentNames(input: string): AssetId[] {
  if (!input || !input.trim()) return [];
  const rawTokens = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const matchedAssets = new Set<AssetId>();
  for (const token of rawTokens) {
    const matched = matchComponentKeyword(token);
    if (matched) matchedAssets.add(matched);
  }
  return Array.from(matchedAssets);
}

export function parseComponentRequests(input: string): ParsedItemRequest[] {
  if (!input || !input.trim()) return [];
  const words = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const results: ParsedItemRequest[] = [];
  const seenAssets = new Set<AssetId>();

  const isL = (w?: string) => w && ['большая', 'большой', 'большое', 'крупный', 'крупная', 'главный', 'l', 'large', 'big'].includes(w);
  const isS = (w?: string) => w && ['маленький', 'маленькая', 'маленькое', 'мелкий', 'мелкая', 'спутник', 's', 'small', 'tiny', 'mini'].includes(w);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const assetId = matchComponentKeyword(word);
    if (assetId && !seenAssets.has(assetId)) {
      seenAssets.add(assetId);
      let size: AssetSize | undefined;
      const prev = words[i - 1];
      const next = words[i + 1];
      if (isL(prev) || isL(next)) size = 'L';
      else if (isS(prev) || isS(next)) size = 'S';
      results.push({ assetId, size });
    }
  }
  return results;
}

export function resolvePairingFromComponents(assets: AssetId[]): CanonicalCompositionId | null {
  if (!assets.length) return null;
  const has = (id: AssetId) => assets.includes(id);

  if (has('notepad') && has('smartphone')) return 'book-phone';
  if (has('smartphone') && has('puzzle')) return 'phone-puzzles';
  if (has('folder') && (has('wallet') || has('coin'))) return 'folder-wallet-coin';
  if (has('lamp') && (has('wallet') || has('coin'))) return 'lamp-wallet-coin';
  if (has('notepad') && (has('puzzle') || has('pen'))) return 'book-puzzles-pen';
  if (has('headphones') || has('flowers_vase')) return 'headphones-flowers';

  if (has('headphones')) return 'headphones-flowers';
  if (has('lamp')) return 'lamp-wallet-coin';
  if (has('folder')) return 'folder-wallet-coin';
  if (has('pen')) return 'book-puzzles-pen';
  if (has('notepad')) return 'book-phone';
  if (has('smartphone')) return 'phone-puzzles';
  if (has('wallet')) return 'folder-wallet-coin';
  if (has('coin')) return 'folder-wallet-coin';
  if (has('puzzle')) return 'phone-puzzles';
  if (has('flowers_vase')) return 'headphones-flowers';
  return null;
}

export function resolvePairingFromMetaphor(prompt: string, seed?: number): CanonicalCompositionId | null {
  if (!prompt || !prompt.trim()) return null;
  const normalized = prompt.toLowerCase();
  const tokens = normalized.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

  let matchedDomain: MetaphorDomainDef | null = null;
  if (tokens.some((t) => t.includes('fintech') || t.includes('финтех'))) matchedDomain = METAPHOR_DOMAINS[4];
  else if (tokens.some((t) => t.includes('study') || t.includes('учеб') || t.includes('учит'))) matchedDomain = METAPHOR_DOMAINS[1];
  else if (tokens.some((t) => t.includes('creative') || t.includes('креатив') || t.includes('творч'))) matchedDomain = METAPHOR_DOMAINS[5];
  else if (tokens.some((t) => t.includes('finance') || t.includes('финанс') || t.includes('банк'))) matchedDomain = METAPHOR_DOMAINS[2];
  else if (tokens.some((t) => t.includes('tech') || t.includes('технолог') || t.includes('айти'))) matchedDomain = METAPHOR_DOMAINS[0];
  else if (tokens.some((t) => t.includes('music') || t.includes('музык') || t.includes('подкаст'))) matchedDomain = METAPHOR_DOMAINS[3];

  if (!matchedDomain) {
    let bestScore = 0;
    for (const domain of METAPHOR_DOMAINS) {
      let score = 0;
      for (const kw of domain.keywords) {
        if (normalized.includes(kw)) score += kw.length > 4 ? 3 : 1;
      }
      if (score > bestScore) {
        bestScore = score;
        matchedDomain = domain;
      }
    }
  }

  if (!matchedDomain) return null;
  if (seed === undefined) return matchedDomain.canonical;

  const hash = prompt.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const alts = matchedDomain.alternates;
  return alts[(Math.abs(seed) + hash) % alts.length];
}

function isExactCanonicalCombination(assets: AssetId[]): CanonicalCompositionId | null {
  const set = new Set(assets);
  if (set.has('notepad') && set.has('smartphone') && set.size === 2) return 'book-phone';
  if (set.has('smartphone') && set.has('puzzle') && set.size === 2) return 'phone-puzzles';
  if (set.has('folder') && (set.has('wallet') || set.has('coin')) && !set.has('lamp') && !set.has('notepad')) {
    return 'folder-wallet-coin';
  }
  if (set.has('headphones') && !set.has('wallet') && !set.has('folder') && !set.has('lamp')) {
    return 'headphones-flowers';
  }
  if (set.has('lamp') && (set.has('wallet') || set.has('coin')) && !set.has('notepad') && !set.has('folder')) {
    return 'lamp-wallet-coin';
  }
  if (set.has('notepad') && (set.has('puzzle') || set.has('pen')) && !set.has('smartphone') && !set.has('wallet') && !set.has('lamp')) {
    return 'book-puzzles-pen';
  }
  return null;
}

export function resolveCanonicalPairing(input: string, seed?: number): CanonicalCompositionConfig {
  if (!input || !input.trim()) return CANONICAL_COMPOSITIONS['phone-puzzles'];
  const assets = parseComponentNames(input);
  const componentMatch = resolvePairingFromComponents(assets);
  if (componentMatch) return CANONICAL_COMPOSITIONS[componentMatch];

  const metaphorMatch = resolvePairingFromMetaphor(input, seed);
  if (metaphorMatch) return CANONICAL_COMPOSITIONS[metaphorMatch];

  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  const idx = ((seed !== undefined ? Math.abs(seed) : 0) + hash) % CANONICAL_PAIRING_PRESETS.length;
  return CANONICAL_PAIRING_PRESETS[idx];
}

export function applySeedVariation(items: CanvasItem[], seed: number | undefined): CanvasItem[] {
  if (seed === undefined) return items;
  const rng = createPrng(seed);

  return items.map((item, idx) => {
    const isBase = item.assetId === 'notepad' || item.assetId === 'folder';
    if (isBase && idx === 0) return item;

    const stepChoices = [-24, -16, -8, 8, 16, 24];
    const step = stepChoices[Math.floor(rng() * stepChoices.length)];
    const isoDx = step;
    const isoDy = Math.round(step * 0.5);

    return {
      ...item,
      x: item.x + isoDx,
      y: item.y + isoDy,
      rotation: item.rotation || 0,
    };
  });
}

function applyIncludeBackgrounds(items: CanvasItem[], includeBackgrounds?: boolean): CanvasItem[] {
  if (includeBackgrounds !== false) return items;
  const fg = items.filter((it) => it.role !== 'ghost');
  if (fg.length > 0) return fg;
  if (items.length === 0) return items;
  return [{ ...items[0], role: 'foreground', opacity: 1 }];
}

export function generateCover(request: AICompositionRequest): AICompositionResponse {
  const format: CanvasFormatId = request.format || '1:1';
  const resolvedLayout: LayoutMode =
    request.layoutMode && request.layoutMode !== 'auto'
      ? request.layoutMode
      : format === '1:1' ? 'centered' : 'headline';

  const componentRequests = parseComponentRequests(request.prompt);
  const parsedNames = parseComponentNames(request.prompt);
  for (const assetId of parsedNames) {
    if (!componentRequests.some((r) => r.assetId === assetId)) {
      componentRequests.push({ assetId });
    }
  }
  const assetIds = componentRequests.map((r) => r.assetId);

  // 1. If assets match a canonical pairing:
  const canonicalId = isExactCanonicalCombination(assetIds);
  if (canonicalId) {
    const pairingConfig = CANONICAL_COMPOSITIONS[canonicalId];
    const rawItems = applyIncludeBackgrounds(
      getCanonicalComposition(pairingConfig.id, format),
      request.includeBackgrounds
    );

    const arranged = rearrangeItemsForLayout(rawItems, resolvedLayout, format);
    const items = clampItemsToArtboard(applySeedVariation(arranged, request.seed), format);
    const recommendedPalette: PaletteId =
      request.paletteId && request.paletteId !== 'auto'
        ? request.paletteId
        : (request.seed !== undefined ? resolveDynamicPalette(request.seed) : pairingConfig.recommendedPalette);

    return {
      items,
      recommendedPalette,
      resolvedLayout,
      rationale: `Готовая пара #${pairingConfig.pairingNumber}: «${pairingConfig.titleRu}» (${pairingConfig.descriptionRu}).`,
      source: 'offline-heuristic',
    };
  }

  // 2. Custom combination of 2+ components:
  if (componentRequests.length >= 2) {
    const rawItems = composeSmartHierarchy(
      componentRequests,
      format,
      resolvedLayout,
      request.includeBackgrounds,
      request.seed
    );
    const items = clampItemsToArtboard(
      enforceAntiClumping(applySeedVariation(rawItems, request.seed), format),
      format
    );
    const recommendedPalette: PaletteId = resolveDynamicPalette(request.seed, request.paletteId);

    return {
      items,
      recommendedPalette,
      resolvedLayout,
      rationale: `Умная иерархическая композиция: ${items.length} компонентов в гармоничном изометрическом контакте.`,
      source: 'offline-heuristic',
    };
  }

  // 3. Fallback to metaphor resolver:
  const pairingConfig = resolveCanonicalPairing(request.prompt, request.seed);
  const rawItems = applyIncludeBackgrounds(
    getCanonicalComposition(pairingConfig.id, format),
    request.includeBackgrounds
  );

  const arranged = rearrangeItemsForLayout(rawItems, resolvedLayout, format);
  const items = clampItemsToArtboard(applySeedVariation(arranged, request.seed), format);
  const recommendedPalette: PaletteId =
    request.paletteId && request.paletteId !== 'auto'
      ? request.paletteId
      : (request.seed !== undefined ? resolveDynamicPalette(request.seed) : pairingConfig.recommendedPalette);

  return {
    items,
    recommendedPalette,
    resolvedLayout,
    rationale: `Готовая пара #${pairingConfig.pairingNumber}: «${pairingConfig.titleRu}» (${pairingConfig.descriptionRu}).`,
    source: 'offline-heuristic',
  };
}
