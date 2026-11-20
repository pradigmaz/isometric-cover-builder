import {
  AssetId,
  AssetSize,
  CanvasItem,
  AICompositionRequest,
  AICompositionResponse,
} from '../../types/schema';
import { getFormatSpec } from '../../config/formats';
import { getLayoutTemplate } from '../../config/layouts';
import {
  COS_30,
  DEFAULT_GRID_STEP,
  SIN_30,
  snapToIsoGrid,
  sortCanvasItems,
} from '../isometric';
import {
  createPrng,
  hashString,
  recommendPalette,
  resolveLayoutMode,
  scoreAssets,
  SEMANTIC_DICTIONARY,
  tokenizePrompt,
} from './semantics';

export {
  createPrng,
  hashString,
  recommendPalette,
  resolveLayoutMode,
  scoreAssets,
  SEMANTIC_DICTIONARY,
  tokenizePrompt,
};
export type { SemanticDictionaryEntry } from './semantics';

const COLLISION_RADIUS: Record<AssetSize, number> = {
  L: 200,
  S: 85,
};

const SAFE_MARGIN = 36;

export function resolveCollisions(
  items: CanvasItem[],
  width: number,
  height: number,
  origin: { x: number; y: number }
): CanvasItem[] {
  const result = items.map((it) => ({ ...it }));
  const foregroundIndices = result
    .map((it, idx) => (it.role === 'foreground' ? idx : -1))
    .filter((idx) => idx !== -1);

  const isoSteps = [
    { dx: COS_30 * DEFAULT_GRID_STEP, dy: SIN_30 * DEFAULT_GRID_STEP },
    { dx: -COS_30 * DEFAULT_GRID_STEP, dy: SIN_30 * DEFAULT_GRID_STEP },
    { dx: -COS_30 * DEFAULT_GRID_STEP, dy: -SIN_30 * DEFAULT_GRID_STEP },
    { dx: COS_30 * DEFAULT_GRID_STEP, dy: -SIN_30 * DEFAULT_GRID_STEP },
  ];

  for (let iter = 0; iter < 6; iter++) {
    let hadCollision = false;
    for (let i = 0; i < foregroundIndices.length; i++) {
      for (let j = i + 1; j < foregroundIndices.length; j++) {
        const idxA = foregroundIndices[i];
        const idxB = foregroundIndices[j];
        const a = result[idxA];
        const b = result[idxB];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rA = COLLISION_RADIUS[a.size] * a.scale;
        const rB = COLLISION_RADIUS[b.size] * b.scale;
        const minDist = (rA + rB) * 0.85;

        if (dist < minDist && dist > 0.0001) {
          hadCollision = true;
          const moverIdx = a.size === 'S' && b.size === 'L' ? idxA : idxB;
          const mover = result[moverIdx];
          const anchor = moverIdx === idxA ? b : a;

          let bestStep = isoSteps[0];
          let bestDist = -1;

          for (const step of isoSteps) {
            const nextX = mover.x + step.dx;
            const nextY = mover.y + step.dy;
            if (
              nextX >= SAFE_MARGIN &&
              nextX <= width - SAFE_MARGIN &&
              nextY >= SAFE_MARGIN &&
              nextY <= height - SAFE_MARGIN
            ) {
              const ndx = nextX - anchor.x;
              const ndy = nextY - anchor.y;
              const newDist = Math.sqrt(ndx * ndx + ndy * ndy);
              if (newDist > bestDist) {
                bestDist = newDist;
                bestStep = step;
              }
            }
          }

          mover.x = Math.max(SAFE_MARGIN, Math.min(width - SAFE_MARGIN, mover.x + bestStep.dx));
          mover.y = Math.max(SAFE_MARGIN, Math.min(height - SAFE_MARGIN, mover.y + bestStep.dy));
        }
      }
    }
    if (!hadCollision) break;
  }

  // Snap all items back to isometric grid and clamp to safe margin
  for (const it of result) {
    const snapped = snapToIsoGrid({ x: it.x, y: it.y }, DEFAULT_GRID_STEP, origin, it.zHeight);
    it.x = Math.max(SAFE_MARGIN, Math.min(width - SAFE_MARGIN, snapped.x));
    it.y = Math.max(SAFE_MARGIN, Math.min(height - SAFE_MARGIN, snapped.y));
  }

  return result;
}

export function composeOfflineHeuristic(request: AICompositionRequest): AICompositionResponse {
  const seed = request.seed ?? hashString(request.prompt || 'default_seed');
  const rng = createPrng(seed);
  const tokens = tokenizePrompt(request.prompt);
  const scores = scoreAssets(tokens, rng);

  // Sort assets by score descending
  const ranked = (Object.keys(scores) as AssetId[]).sort((a, b) => scores[b] - scores[a]);
  const heroAsset = ranked[0];

  // Select 3 to 4 satellites
  const heroSem = SEMANTIC_DICTIONARY.find((s) => s.assetId === heroAsset);
  const candidateSatellites = ranked.filter((id) => id !== heroAsset);
  const satellites: AssetId[] = [];

  for (const cand of candidateSatellites) {
    if (satellites.length < 4 && scores[cand] > 1) {
      satellites.push(cand);
    }
  }

  if (heroSem) {
    for (const comp of heroSem.fallbackComplements) {
      if (satellites.length < 4 && comp !== heroAsset && !satellites.includes(comp)) {
        satellites.push(comp);
      }
    }
  }

  const recommendedPalette = recommendPalette(heroAsset, satellites, request.paletteId);
  const resolvedLayout = resolveLayoutMode(request.layoutMode, tokens, request.format);
  const formatSpec = getFormatSpec(request.format);
  const template = getLayoutTemplate(resolvedLayout, request.format, request.includeBackgrounds);

  // Target scales for hero and satellites: og hero strictly clamped to [0.78, 0.85]
  const heroScale = request.format === 'og'
    ? Math.min(0.85, Math.max(0.78, formatSpec.defaultHeroScale))
    : formatSpec.defaultHeroScale;
  const satelliteScale = formatSpec.defaultSatelliteScale;

  const origin = { x: formatSpec.width / 2, y: formatSpec.height / 2 };
  const rawItems: CanvasItem[] = [];

  // 1. Hero item
  rawItems.push({
    uid: `item-${heroAsset}-hero-${seed % 10000}`,
    assetId: heroAsset,
    size: 'L',
    role: 'foreground',
    x: template.heroSlot.normalizedX * formatSpec.width,
    y: template.heroSlot.normalizedY * formatSpec.height,
    zHeight: 0,
    rotation: template.heroSlot.rotation ?? 0,
    scale: heroScale * (template.heroSlot.scaleMultiplier ?? 1.0),
    opacity: 1.0,
    manualLayerOffset: template.heroSlot.manualLayerOffset ?? 0,
  });

  // 2. Satellite items
  template.satelliteSlots.forEach((slot, idx) => {
    const assetId = satellites[idx % satellites.length] ?? heroAsset;
    rawItems.push({
      uid: `item-${assetId}-sat-${idx}-${(seed + idx) % 10000}`,
      assetId,
      size: 'S',
      role: 'foreground',
      x: slot.normalizedX * formatSpec.width,
      y: slot.normalizedY * formatSpec.height,
      zHeight: 0,
      rotation: slot.rotation ?? 0,
      scale: satelliteScale * (slot.scaleMultiplier ?? 1.0),
      opacity: 1.0,
      manualLayerOffset: slot.manualLayerOffset ?? 0,
    });
  });

  // 3. Ghost items (if requested)
  if (request.includeBackgrounds) {
    template.ghostSlots.forEach((slot, idx) => {
      const assetId = satellites[(idx + 1) % satellites.length] ?? heroAsset;
      rawItems.push({
        uid: `item-${assetId}-ghost-${idx}-${(seed + idx + 10) % 10000}`,
        assetId,
        size: slot.size,
        role: 'ghost',
        x: slot.normalizedX * formatSpec.width,
        y: slot.normalizedY * formatSpec.height,
        zHeight: 0,
        rotation: slot.rotation ?? 0,
        scale: satelliteScale * 0.9 * (slot.scaleMultiplier ?? 1.0),
        opacity: 0.22,
        manualLayerOffset: slot.manualLayerOffset ?? -1,
      });
    });
  }

  // Anti-collision resolution & grid snapping
  const resolvedItems = resolveCollisions(rawItems, formatSpec.width, formatSpec.height, origin);
  const sortedItems = sortCanvasItems(resolvedItems);

  const rationale = `Выбран Hero «${heroAsset}» (${resolvedLayout}, ${formatSpec.shortLabel}). Рекомендована палитра «${recommendedPalette}». Размещено ${sortedItems.length} объектов с защитой от коллизий.`;

  return {
    items: sortedItems,
    recommendedPalette,
    resolvedLayout,
    rationale,
    source: 'offline-heuristic',
  };
}
