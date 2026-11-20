import {
  AICompositionRequest,
  AICompositionResponse,
  AssetId,
  AssetSize,
  CanvasItem,
  ItemRole,
  LayoutMode,
  PaletteId,
} from '../../types/schema';
import { getFormatSpec } from '../../config/formats';
import { sortCanvasItems } from '../isometric';

const CANONICAL_ASSETS: readonly AssetId[] = [
  'wallet',
  'smartphone',
  'puzzle',
  'coin',
  'headphones',
  'lamp',
  'flowers_vase',
  'notepad',
  'folder',
  'pen',
];

const VALID_PALETTES: readonly PaletteId[] = ['warm-pastel', 'fresh-mint', 'soft-coral'];
const VALID_LAYOUTS: readonly LayoutMode[] = ['headline', 'offset', 'centered'];

export interface LlmAdapterConfig {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export function buildLlmPrompt(request: AICompositionRequest): string {
  const spec = getFormatSpec(request.format);
  return JSON.stringify({
    task: 'Generate isometric 2D cover composition',
    prompt: request.prompt,
    format: request.format,
    canvasDimensions: { width: spec.width, height: spec.height },
    defaultHeroScale: spec.defaultHeroScale,
    defaultSatelliteScale: spec.defaultSatelliteScale,
    allowedAssets: CANONICAL_ASSETS,
    allowedPalettes: VALID_PALETTES,
    allowedLayouts: VALID_LAYOUTS,
    includeBackgrounds: request.includeBackgrounds,
    outputSchema: {
      recommendedPalette: 'warm-pastel | fresh-mint | soft-coral',
      resolvedLayout: 'headline | offset | centered',
      rationale: 'string',
      items: [
        {
          assetId: 'AssetId',
          size: 'L | S',
          role: 'foreground | ghost',
          x: 'number',
          y: 'number',
          rotation: 'number (0, 30, 60, 90)',
          scale: 'number',
          opacity: 'number (1.0 or 0.22)',
        },
      ],
    },
  });
}

export function parseAndValidateLlmResponse(
  rawJson: unknown,
  request: AICompositionRequest
): AICompositionResponse | null {
  if (!rawJson || typeof rawJson !== 'object') {
    return null;
  }
  const payload = rawJson as Partial<AICompositionResponse>;
  const spec = getFormatSpec(request.format);

  if (!VALID_PALETTES.includes(payload.recommendedPalette as PaletteId)) {
    return null;
  }
  if (!VALID_LAYOUTS.includes(payload.resolvedLayout as LayoutMode)) {
    return null;
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return null;
  }

  const validatedItems: CanvasItem[] = [];
  let hasHero = false;

  for (let i = 0; i < payload.items.length; i++) {
    const raw = payload.items[i] as Partial<CanvasItem>;
    if (!CANONICAL_ASSETS.includes(raw.assetId as AssetId)) {
      continue;
    }
    const size: AssetSize = raw.size === 'L' ? 'L' : 'S';
    const role: ItemRole = raw.role === 'ghost' ? 'ghost' : 'foreground';

    if (size === 'L' && role === 'foreground') {
      hasHero = true;
    }

    const x = typeof raw.x === 'number' && !isNaN(raw.x)
      ? Math.max(36, Math.min(spec.width - 36, raw.x))
      : spec.width / 2;
    const y = typeof raw.y === 'number' && !isNaN(raw.y)
      ? Math.max(36, Math.min(spec.height - 36, raw.y))
      : spec.height / 2;

    let scale = typeof raw.scale === 'number' && !isNaN(raw.scale)
      ? Math.max(0.35, Math.min(1.8, raw.scale))
      : (size === 'L' ? spec.defaultHeroScale : spec.defaultSatelliteScale);

    if (size === 'L' && request.format === 'og') {
      scale = Math.min(0.85, Math.max(0.78, scale));
    }

    validatedItems.push({
      uid: raw.uid || `llm-item-${raw.assetId}-${i}`,
      assetId: raw.assetId as AssetId,
      size,
      role,
      x,
      y,
      zHeight: typeof raw.zHeight === 'number' ? raw.zHeight : 0,
      rotation: typeof raw.rotation === 'number' ? raw.rotation : 0,
      scale,
      opacity: role === 'ghost' ? 0.22 : 1.0,
      manualLayerOffset: typeof raw.manualLayerOffset === 'number' ? raw.manualLayerOffset : 0,
      flipX: Boolean(raw.flipX),
    });
  }

  if (!hasHero || validatedItems.length < 3) {
    return null;
  }

  const sortedItems = sortCanvasItems(validatedItems);

  return {
    items: sortedItems,
    recommendedPalette: payload.recommendedPalette as PaletteId,
    resolvedLayout: payload.resolvedLayout as LayoutMode,
    rationale: payload.rationale || 'Сгенерировано через LLM JSON API',
    source: 'llm-api',
  };
}

export async function callLlmComposition(
  request: AICompositionRequest,
  config: LlmAdapterConfig = {}
): Promise<AICompositionResponse> {
  const globalEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const endpoint = config.endpoint || globalEnv?.AI_COMPOSER_ENDPOINT;
  if (!endpoint) {
    throw new Error('LLM endpoint is not configured. Falling back to offline heuristic.');
  }

  const promptBody = buildLlmPrompt(request);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 8000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ prompt: promptBody, model: config.model ?? 'gemini-2.5-flash' }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`LLM endpoint HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const validated = parseAndValidateLlmResponse(json, request);
    if (!validated) {
      throw new Error('LLM output failed schema validation');
    }
    return validated;
  } finally {
    clearTimeout(timer);
  }
}
