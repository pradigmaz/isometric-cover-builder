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
import { composeSmartHierarchy, ParsedItemRequest } from './smartComposer';
import { rearrangeItemsForLayout } from '../store/layoutReorder';

export type { ParsedItemRequest };

/**
 * Scenario 1 (Metaphor/Prompt): deterministic mapping of primary theme keywords
 * to the 6 canonical pairings.
 */
const METAPHOR_TO_PAIRING: Array<{
  keywords: string[];
  pairingId: CanonicalCompositionId;
}> = [
  // 1. Phone + Puzzles (Tech, Mobile, Apps)
  {
    keywords: ['tech', 'mobile', 'apps', 'architecture', 'microservices', 'технологии', 'тех', 'айти', 'приложения', 'системы', 'код'],
    pairingId: 'phone-puzzles',
  },
  // 2. Book + Phone (Study, Education, Learning)
  {
    keywords: ['study', 'education', 'learning', 'knowledge', 'course', 'student', 'учеба', 'учёба', 'образование', 'обучение', 'конспект', 'курс', 'студент'],
    pairingId: 'book-phone',
  },
  // 3. Folder + Wallet + Coin (Finance, Corporate, Banking)
  {
    keywords: ['finance', 'banking', 'corporate', 'accounting', 'tax', 'report', 'финансы', 'банк', 'бухгалтерия', 'отчет', 'отчётность', 'налоги', 'корпоратив'],
    pairingId: 'folder-wallet-coin',
  },
  // 4. Headphones + Flowers (Music, Podcast, Audio, Lifestyle)
  {
    keywords: ['music', 'podcast', 'audio', 'sound', 'lifestyle', 'calm', 'музыка', 'подкаст', 'аудио', 'звук', 'лайфстайл', 'трек', 'релакс'],
    pairingId: 'headphones-flowers',
  },
  // 5. Lamp + Wallet + Coin (Fintech, Venture, Startup)
  {
    keywords: ['fintech', 'venture', 'crypto', 'startup', 'investment', 'capital', 'финтех', 'стартап', 'инвестиции', 'венчур', 'крипта', 'капитал'],
    pairingId: 'lamp-wallet-coin',
  },
  // 6. Book + Puzzles + Pen (Creative, Strategy, Writing)
  {
    keywords: ['creative', 'design', 'strategy', 'writing', 'editorial', 'story', 'author', 'креатив', 'творчество', 'стратегия', 'дизайн', 'статья', 'писатель', 'копирайтинг'],
    pairingId: 'book-puzzles-pen',
  },
];

/**
 * Parses user input to extract recognized component names (Scenario 2).
 */
export function parseComponentNames(input: string): AssetId[] {
  if (!input || !input.trim()) return [];

  const rawTokens = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const matchedAssets = new Set<AssetId>();

  for (const token of rawTokens) {
    if (COMPONENT_KEYWORD_MAP[token]) {
      matchedAssets.add(COMPONENT_KEYWORD_MAP[token]);
    }
  }

  return Array.from(matchedAssets);
}

/**
 * Parses user input to extract components with explicit size modifiers (L or S).
 */
export function parseComponentRequests(input: string): ParsedItemRequest[] {
  if (!input || !input.trim()) return [];

  const words = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const results: ParsedItemRequest[] = [];
  const seenAssets = new Set<AssetId>();

  const isL = (w?: string) =>
    w && ['большая', 'большой', 'большое', 'крупный', 'крупная', 'главный', 'l', 'large', 'big'].includes(w);
  const isS = (w?: string) =>
    w && ['маленький', 'маленькая', 'маленькое', 'мелкий', 'мелкая', 'спутник', 's', 'small', 'tiny', 'mini'].includes(w);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const assetId = COMPONENT_KEYWORD_MAP[word];
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

/**
 * Scenario 2 Resolver: Given extracted assets, finds the canonical pairing that best covers them.
 */
export function resolvePairingFromComponents(assets: AssetId[]): CanonicalCompositionId | null {
  if (!assets.length) return null;

  const has = (id: AssetId) => assets.includes(id);

  if (has('notepad') && has('smartphone')) return 'book-phone';
  if (has('smartphone') && has('puzzle')) return 'phone-puzzles';
  if (has('folder') && (has('wallet') || has('coin'))) return 'folder-wallet-coin';
  if (has('lamp') && (has('wallet') || has('coin'))) return 'lamp-wallet-coin';
  if (has('notepad') && (has('puzzle') || has('pen'))) return 'book-puzzles-pen';
  if (has('headphones') || has('flowers_vase')) return 'headphones-flowers';

  // Single-asset direct associations
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

/**
 * Scenario 1 Resolver: Given prompt text, finds the matching canonical pairing by theme/metaphor keyword.
 */
export function resolvePairingFromMetaphor(prompt: string): CanonicalCompositionId | null {
  if (!prompt || !prompt.trim()) return null;

  const normalized = prompt.toLowerCase();
  const tokens = normalized.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

  if (tokens.some((t) => t.includes('fintech') || t.includes('финтех'))) return 'lamp-wallet-coin';
  if (tokens.some((t) => t.includes('study') || t.includes('учеб') || t.includes('учит'))) return 'book-phone';
  if (tokens.some((t) => t.includes('creative') || t.includes('креатив') || t.includes('творч'))) return 'book-puzzles-pen';
  if (tokens.some((t) => t.includes('finance') || t.includes('финанс') || t.includes('банк'))) return 'folder-wallet-coin';
  if (tokens.some((t) => t.includes('tech') || t.includes('технолог') || t.includes('айти'))) return 'phone-puzzles';
  if (tokens.some((t) => t.includes('music') || t.includes('музык') || t.includes('подкаст'))) return 'headphones-flowers';

  let bestPairing: CanonicalCompositionId | null = null;
  let bestScore = 0;

  for (const entry of METAPHOR_TO_PAIRING) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length > 4 ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPairing = entry.pairingId;
    }
  }

  return bestScore > 0 ? bestPairing : null;
}

/**
 * Checks if a set of assets is an exact match for one of the 6 canonical pairings.
 */
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

/**
 * Unified resolver for both Scenario 1 (metaphors) and Scenario 2 (component inputs).
 */
export function resolveCanonicalPairing(input: string): CanonicalCompositionConfig {
  if (!input || !input.trim()) {
    return CANONICAL_COMPOSITIONS['phone-puzzles'];
  }

  const assets = parseComponentNames(input);
  const componentMatch = resolvePairingFromComponents(assets);
  if (componentMatch) {
    return CANONICAL_COMPOSITIONS[componentMatch];
  }

  const metaphorMatch = resolvePairingFromMetaphor(input);
  if (metaphorMatch) {
    return CANONICAL_COMPOSITIONS[metaphorMatch];
  }

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const idx = hash % CANONICAL_PAIRING_PRESETS.length;
  return CANONICAL_PAIRING_PRESETS[idx];
}

/**
 * Primary Generator function replacing legacy 8-9 item scattering.
 * Supports both canonical pairings and dynamic smart hierarchical placement for custom combinations.
 */
export function generateCover(request: AICompositionRequest): AICompositionResponse {
  const format: CanvasFormatId = request.format || '1:1';
  const resolvedLayout: LayoutMode =
    request.layoutMode && request.layoutMode !== 'auto'
      ? request.layoutMode
      : format === '1:1'
        ? 'centered'
        : 'headline';

  const componentRequests = parseComponentRequests(request.prompt);
  const assetIds = componentRequests.map((r) => r.assetId);

  // 1. If assets match a canonical pairing, use the authentic canonical slots
  const canonicalId = isExactCanonicalCombination(assetIds);
  if (canonicalId) {
    const pairingConfig = CANONICAL_COMPOSITIONS[canonicalId];
    const rawItems: CanvasItem[] = getCanonicalComposition(pairingConfig.id, format);
    const items = rearrangeItemsForLayout(rawItems, resolvedLayout, format);
    const recommendedPalette: PaletteId =
      request.paletteId && request.paletteId !== 'auto'
        ? request.paletteId
        : pairingConfig.recommendedPalette;

    return {
      items,
      recommendedPalette,
      resolvedLayout,
      rationale: `Готовая пара #${pairingConfig.pairingNumber}: «${pairingConfig.titleRu}» (${pairingConfig.descriptionRu}). Группа из ${items.length} элементов в плотном изометрическом контакте (заполнение 70–85% артборда).`,
      source: 'offline-heuristic',
    };
  }

  // 2. If user requested a custom combination of 2+ components, use Smart Hierarchy
  if (componentRequests.length >= 2) {
    const items = composeSmartHierarchy(
      componentRequests,
      format,
      resolvedLayout,
      request.includeBackgrounds
    );
    const recommendedPalette: PaletteId =
      request.paletteId && request.paletteId !== 'auto' ? request.paletteId : 'lavender';

    return {
      items,
      recommendedPalette,
      resolvedLayout,
      rationale: `Умная иерархическая композиция: ${items.length} компонентов в плотном контакте на плоскости стола.`,
      source: 'offline-heuristic',
    };
  }

  // 3. Fallback to standard canonical pairing resolver
  const pairingConfig = resolveCanonicalPairing(request.prompt);
  const rawItems: CanvasItem[] = getCanonicalComposition(pairingConfig.id, format);
  const items = rearrangeItemsForLayout(rawItems, resolvedLayout, format);
  const recommendedPalette: PaletteId =
    request.paletteId && request.paletteId !== 'auto'
      ? request.paletteId
      : pairingConfig.recommendedPalette;

  return {
    items,
    recommendedPalette,
    resolvedLayout,
    rationale: `Готовая пара #${pairingConfig.pairingNumber}: «${pairingConfig.titleRu}» (${pairingConfig.descriptionRu}). Группа из ${items.length} элементов в плотном изометрическом контакте (заполнение 70–85% артборда).`,
    source: 'offline-heuristic',
  };
}
