import {
  AssetId,
  AssetSize,
  CanvasFormatId,
  CanvasItem,
  LayoutMode,
} from '../types/schema';
import { rearrangeItemsForLayout } from '../store/layoutReorder';
import { getFormatSpec } from '../config/formats';
import { getAssetVisualBounds } from '../assets/registry';

export interface ParsedItemRequest {
  assetId: AssetId;
  size?: AssetSize;
}

export const SPATIAL_ARCHETYPES = [
  'cluster-triangle',
  'diagonal-cascade',
  'substrate-platform',
  'depth-corridor',
  'side-flanked',
] as const;

export type SpatialArchetypeId = (typeof SPATIAL_ARCHETYPES)[number];

export const MIN_ITEM_DISTANCE_BY_FORMAT: Record<CanvasFormatId, number> = {
  '1:1': 160,
  '16:9': 190,
  '9:16': 220,
  og: 160,
};

interface FormatLayoutConfig {
  center: { x: number; y: number };
  heroScale: number;
  satelliteScale: number;
  stepDx: number;
  stepDy: number;
}

const FORMAT_CONFIGS: Record<CanvasFormatId, FormatLayoutConfig> = {
  '1:1': { center: { x: 540, y: 560 }, heroScale: 1.62, satelliteScale: 1.38, stepDx: 210, stepDy: 121 },
  '16:9': { center: { x: 980, y: 560 }, heroScale: 1.62, satelliteScale: 1.38, stepDx: 240, stepDy: 138 },
  '9:16': { center: { x: 540, y: 1140 }, heroScale: 2.85, satelliteScale: 2.2, stepDx: 190, stepDy: 260 },
  og: { center: { x: 600, y: 320 }, heroScale: 1.55, satelliteScale: 1.30, stepDx: 220, stepDy: 127 },
};

const UNIFORM_SCALE_BY_FORMAT: Record<CanvasFormatId, number> = {
  '1:1': 1.45,
  '16:9': 1.45,
  '9:16': 2.5,
  og: 1.35,
};

export function clampItemsToArtboard(
  items: CanvasItem[],
  format: CanvasFormatId,
  margin = 8
): CanvasItem[] {
  const spec = getFormatSpec(format);
  return items.map((item) => {
    const bounds = getAssetVisualBounds(item.assetId, item.size);
    const scale = item.scale || 1;
    const halfW = (bounds.width * scale) / 2;
    const halfH = (bounds.height * scale) / 2;
    const localOffsetY = (bounds.offsetY || 0) * scale;
    const zH = item.zHeight || 0;
    const rot = item.rotation || 0;

    let minDx = -halfW;
    let maxDx = halfW;
    let minDy = localOffsetY - halfH - zH;
    let maxDy = localOffsetY + halfH - zH;

    if (rot !== 0) {
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const corners = [
        { dx: -halfW, dy: localOffsetY - halfH },
        { dx: halfW, dy: localOffsetY - halfH },
        { dx: halfW, dy: localOffsetY + halfH },
        { dx: -halfW, dy: localOffsetY + halfH },
      ];
      minDx = Infinity;
      maxDx = -Infinity;
      minDy = Infinity;
      maxDy = -Infinity;
      for (const c of corners) {
        const rx = c.dx * cos - c.dy * sin;
        const ry = c.dx * sin + c.dy * cos - zH;
        if (rx < minDx) minDx = rx;
        if (rx > maxDx) maxDx = rx;
        if (ry < minDy) minDy = ry;
        if (ry > maxDy) maxDy = ry;
      }
    }

    const minX = margin - minDx;
    const maxX = spec.width - margin - maxDx;
    const minY = margin - minDy;
    const maxY = spec.height - margin - maxDy;

    const clampedX = minX > maxX ? Math.round(spec.width / 2) : Math.max(minX, Math.min(maxX, item.x));
    const clampedY = minY > maxY ? Math.round(spec.height / 2) : Math.max(minY, Math.min(maxY, item.y));

    if (Math.round(clampedX) === item.x && Math.round(clampedY) === item.y) {
      return item;
    }
    return { ...item, x: Math.round(clampedX), y: Math.round(clampedY) };
  });
}

export function getAssetHierarchy(id: AssetId): 'background' | 'base' | 'middle' | 'foreground' {
  if (id === 'lamp' || id === 'flowers_vase') return 'background';
  if (id === 'notepad' || id === 'folder') return 'base';
  if (id === 'smartphone' || id === 'headphones' || id === 'wallet') return 'middle';
  return 'foreground';
}

export function enforceAntiClumping(
  items: CanvasItem[],
  format: CanvasFormatId = '1:1',
  customMinDist?: number
): CanvasItem[] {
  if (items.length <= 1) return items;
  const minDist = customMinDist ?? (MIN_ITEM_DISTANCE_BY_FORMAT[format] || 160);
  const result = items.map((it) => ({ ...it }));

  for (let pass = 0; pass < 8; pass++) {
    let shifted = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        if (a.role === 'ghost' || b.role === 'ghost') continue;
        if ((a.manualLayerOffset ?? 0) > 0 && ['notepad', 'folder'].includes(b.assetId)) continue;
        if ((b.manualLayerOffset ?? 0) > 0 && ['notepad', 'folder'].includes(a.assetId)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        if (dist < minDist) {
          shifted = true;
          const overlap = minDist - dist;
          const angle = dist > 0.001 ? Math.atan2(dy, dx) : (j % 2 === 0 ? Math.PI / 6 : -Math.PI / 6);
          result[j] = {
            ...b,
            x: b.x + Math.round(Math.cos(angle) * (overlap + 15)),
            y: b.y + Math.round(Math.sin(angle) * (overlap + 15)),
          };
        }
      }
    }
    if (!shifted) break;
  }
  return result;
}

export function composeSmartHierarchy(
  requests: ParsedItemRequest[],
  format: CanvasFormatId = '1:1',
  layoutMode: LayoutMode = 'centered',
  includeBackgrounds: boolean = true,
  seed?: number
): CanvasItem[] {
  if (!requests.length) return [];
  const cfg = FORMAT_CONFIGS[format] || FORMAT_CONFIGS['1:1'];
  const uniformScale = UNIFORM_SCALE_BY_FORMAT[format] ?? 1.45;
  const centerX = layoutMode === 'headline' && format === '16:9' ? cfg.center.x + 80 : cfg.center.x;
  const centerY = cfg.center.y;
  const reqHash = requests.reduce((acc, r, i) => acc + r.assetId.charCodeAt(0) * (i + 1), 0);
  const effectiveSeed = seed !== undefined ? Math.abs(seed) : undefined;

  const bases = requests.filter((r) => getAssetHierarchy(r.assetId) === 'base');
  const backgrounds = requests.filter((r) => getAssetHierarchy(r.assetId) === 'background');
  const middles = requests.filter((r) => getAssetHierarchy(r.assetId) === 'middle');
  const foregrounds = requests.filter((r) => getAssetHierarchy(r.assetId) === 'foreground');

  let sizeProfile: 'hero-satellite' | 'isometric-duo' = 'hero-satellite';
  if (effectiveSeed !== undefined && (effectiveSeed % 5 === 1 || (requests.length === 2 && effectiveSeed % 2 === 1))) {
    sizeProfile = 'isometric-duo';
  }

  let heroIdx = 0;
  // Prefer major anchor items (device, base, middle) as Hero over small accents
  const primaryCandidates = requests
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !['coin', 'puzzle', 'pen'].includes(r.assetId));
  if (primaryCandidates.length > 0) {
    const pIdx = effectiveSeed !== undefined ? (effectiveSeed + reqHash) % primaryCandidates.length : 0;
    heroIdx = primaryCandidates[pIdx].i;
  } else if (effectiveSeed !== undefined) {
    heroIdx = (effectiveSeed + reqHash) % requests.length;
  }

  let archetype: SpatialArchetypeId = 'cluster-triangle';
  if (bases.length > 0 && (effectiveSeed === undefined || effectiveSeed % 3 === 0)) {
    archetype = 'substrate-platform';
  } else if (effectiveSeed !== undefined) {
    archetype = SPATIAL_ARCHETYPES[(effectiveSeed + reqHash) % SPATIAL_ARCHETYPES.length];
  }

  const result: CanvasItem[] = [];

  const computeItemScale = (req: ParsedItemRequest, isHero: boolean, isCoHero: boolean): { scale: number; size: AssetSize } => {
    if (req.size === 'S') return { scale: uniformScale, size: 'S' };
    if (req.size === 'L') return { scale: uniformScale, size: 'L' };
    if (['coin', 'puzzle', 'pen'].includes(req.assetId)) {
      return { scale: uniformScale, size: 'S' };
    }
    if (isHero || (sizeProfile === 'isometric-duo' && isCoHero)) {
      return { scale: uniformScale, size: 'L' };
    }
    // Non-hero secondary items use authentic S variant when >= 3 items for diversity
    return { scale: uniformScale, size: requests.length >= 3 ? 'S' : 'L' };
  };

  if (bases.length > 0 && (archetype === 'substrate-platform' || requests.length <= 3)) {
    const primaryBase = bases[0];
    const baseCoords = format === '9:16'
      ? { x: centerX - cfg.stepDx * 0.4, y: centerY - cfg.stepDy * 0.6 }
      : { x: centerX - cfg.stepDx * 0.35, y: centerY + cfg.stepDy * 0.15 };
    const { scale: bScale, size: bSize } = computeItemScale(primaryBase, heroIdx === requests.indexOf(primaryBase), false);

    result.push({
      uid: `item-${Date.now()}-${result.length}`, assetId: primaryBase.assetId, size: bSize,
      x: Math.round(baseCoords.x), y: Math.round(baseCoords.y), zHeight: 0, rotation: 0, scale: bScale,
      manualLayerOffset: 0, role: 'foreground', opacity: 1,
    });

    backgrounds.forEach((bg, idx) => {
      const bgX = baseCoords.x - cfg.stepDx * (0.75 + idx * 0.6);
      const bgY = format === '9:16' ? baseCoords.y - cfg.stepDy * (1.4 + idx * 0.4) : baseCoords.y - cfg.stepDy * (1.2 + idx * 0.3);
      const { scale: bgScale, size: bgSize } = computeItemScale(bg, heroIdx === requests.indexOf(bg), false);
      result.push({
        uid: `item-${Date.now()}-${result.length}`, assetId: bg.assetId, size: bgSize,
        x: Math.round(bgX), y: Math.round(bgY), zHeight: 0, rotation: 0, scale: bgScale,
        manualLayerOffset: includeBackgrounds ? -2 - idx : -1 - idx,
        role: includeBackgrounds ? 'ghost' : 'foreground',
        opacity: includeBackgrounds ? 0.22 : 1,
      });
    });

    middles.forEach((mid, idx) => {
      const midX = idx === 0 ? baseCoords.x - cfg.stepDx * 1.15 : baseCoords.x + cfg.stepDx * 1.15;
      const midY = baseCoords.y - cfg.stepDy * 0.7;
      const isHero = heroIdx === requests.indexOf(mid);
      const { scale: mScale, size: mSize } = computeItemScale(mid, isHero, idx === 0);
      result.push({
        uid: `item-${Date.now()}-${result.length}`, assetId: mid.assetId, size: mSize,
        x: Math.round(midX), y: Math.round(midY), zHeight: 0, rotation: 0, scale: mScale,
        manualLayerOffset: idx === 0 ? 0 : -1, role: 'foreground', opacity: 1,
      });
    });

    const pageItemIdx = foregrounds.findIndex((f) => f.assetId === 'puzzle' || f.assetId === 'coin');
    const pageItem = pageItemIdx !== -1 ? foregrounds[pageItemIdx] : null;
    const remainingForegrounds = foregrounds.filter((_, i) => i !== pageItemIdx);

    if (pageItem) {
      const isHero = heroIdx === requests.indexOf(pageItem);
      const { scale: pScale, size: pSize } = computeItemScale(pageItem, isHero, false);
      result.push({
        uid: `item-${Date.now()}-${result.length}`, assetId: pageItem.assetId, size: pSize,
        x: Math.round(baseCoords.x - 40), y: Math.round(baseCoords.y - 25), zHeight: 0, rotation: 0, scale: pScale,
        manualLayerOffset: 1, role: 'foreground', opacity: 1,
      });
    }

    remainingForegrounds.forEach((fg, idx) => {
      const isHero = heroIdx === requests.indexOf(fg);
      const { scale: fgScale, size: fgSize } = computeItemScale(fg, isHero, false);
      const rotation = fg.assetId === 'pen' ? 30 : 0;
      const fgX = baseCoords.x + cfg.stepDx * (0.95 + idx * 0.3);
      const fgY = baseCoords.y + cfg.stepDy * (fg.assetId === 'pen' ? 0.95 : 0.65 + idx * 0.3);
      result.push({
        uid: `item-${Date.now()}-${result.length}`, assetId: fg.assetId, size: fgSize,
        x: Math.round(fgX), y: Math.round(fgY), zHeight: 0, rotation, scale: fgScale,
        manualLayerOffset: 2 + idx, role: 'foreground', opacity: 1,
      });
    });

    return clampItemsToArtboard(
      rearrangeItemsForLayout(enforceAntiClumping(result, format), layoutMode, format),
      format
    );
  }

  // Dynamic Archetypes for Non-Base Combinations
  const coHeroIdx = (heroIdx + 1) % requests.length;

  // Determine if any item should be designated as a rear ghost silhouette
  let ghostIdx = -1;
  const ambientIdx = requests.findIndex((r) => getAssetHierarchy(r.assetId) === 'background');

  if (includeBackgrounds && ambientIdx !== -1) {
    ghostIdx = ambientIdx;
  } else if (includeBackgrounds && requests.length >= 3) {
    const nonHeroIndices = requests.map((_, i) => i).filter((i) => i !== heroIdx);
    if (nonHeroIndices.length > 0) {
      const backdropIdx = nonHeroIndices.find((i) => ['folder', 'notepad'].includes(requests[i].assetId));
      if (backdropIdx !== undefined) {
        ghostIdx = backdropIdx;
      } else {
        const pick = effectiveSeed !== undefined ? (effectiveSeed + reqHash) % nonHeroIndices.length : (nonHeroIndices.length - 1);
        ghostIdx = nonHeroIndices[pick];
      }
    }
  }

  type SlotDef = { dx: number; dy: number; offset: number };
  interface ArchetypeLayout { fgSlots: SlotDef[]; rearSlot: SlotDef; }

  const archetypeDefs: Record<SpatialArchetypeId, ArchetypeLayout> = {
    'cluster-triangle': {
      fgSlots: [{ dx: 0, dy: 0, offset: 0 }, { dx: -1.35 * cfg.stepDx, dy: 0.75 * cfg.stepDy, offset: 1 }, { dx: 0.95 * cfg.stepDx, dy: 1.45 * cfg.stepDy, offset: 2 }],
      rearSlot: { dx: -0.40 * cfg.stepDx, dy: -1.50 * cfg.stepDy, offset: -2 },
    },
    'diagonal-cascade': {
      fgSlots: [{ dx: 0, dy: 0, offset: 0 }, { dx: 0.85 * cfg.stepDx, dy: 1.30 * cfg.stepDy, offset: 1 }, { dx: -1.25 * cfg.stepDx, dy: 0.90 * cfg.stepDy, offset: 2 }],
      rearSlot: { dx: -0.80 * cfg.stepDx, dy: -1.35 * cfg.stepDy, offset: -2 },
    },
    'substrate-platform': {
      fgSlots: [{ dx: 0, dy: 0, offset: 0 }, { dx: 0.95 * cfg.stepDx, dy: 1.25 * cfg.stepDy, offset: 1 }, { dx: -1.20 * cfg.stepDx, dy: 0.65 * cfg.stepDy, offset: 2 }],
      rearSlot: { dx: 0.80 * cfg.stepDx, dy: -1.40 * cfg.stepDy, offset: -2 },
    },
    'depth-corridor': {
      fgSlots: [{ dx: -1.15 * cfg.stepDx, dy: 0.15 * cfg.stepDy, offset: 0 }, { dx: 0, dy: 0.35 * cfg.stepDy, offset: 1 }, { dx: 0.90 * cfg.stepDx, dy: 1.35 * cfg.stepDy, offset: 2 }],
      rearSlot: { dx: 0.85 * cfg.stepDx, dy: -1.35 * cfg.stepDy, offset: -2 },
    },
    'side-flanked': {
      fgSlots: [{ dx: 0, dy: 0, offset: 0 }, { dx: -1.30 * cfg.stepDx, dy: 0.45 * cfg.stepDy, offset: 1 }, { dx: 1.20 * cfg.stepDx, dy: 0.55 * cfg.stepDy, offset: 1 }],
      rearSlot: { dx: 0, dy: -1.40 * cfg.stepDy, offset: -2 },
    },
  };

  const layoutDef = archetypeDefs[archetype] || archetypeDefs['cluster-triangle'];

  requests.forEach((req, idx) => {
    const isHero = idx === heroIdx;
    const isCoHero = idx === coHeroIdx;
    const isGhost = idx === ghostIdx;

    let slot: SlotDef;
    let role: 'foreground' | 'ghost';
    let opacity: number;
    let manualLayerOffset: number;

    if (isGhost) {
      slot = layoutDef.rearSlot;
      role = 'ghost';
      opacity = 0.22;
      manualLayerOffset = layoutDef.rearSlot.offset;
    } else {
      const fgIndex = requests.slice(0, idx).filter((_, i) => i !== ghostIdx).length;
      slot = layoutDef.fgSlots[fgIndex % layoutDef.fgSlots.length];
      role = 'foreground';
      opacity = 1;
      manualLayerOffset = slot.offset;
    }

    const { scale, size } = computeItemScale(req, isHero, isCoHero);
    const rotation = req.assetId === 'pen' ? 30 : 0;

    result.push({
      uid: `item-${Date.now()}-${idx}`,
      assetId: req.assetId,
      size,
      x: Math.round(centerX + slot.dx),
      y: Math.round(centerY + slot.dy),
      zHeight: 0,
      rotation,
      scale,
      manualLayerOffset,
      role,
      opacity,
    });
  });

  return clampItemsToArtboard(
    rearrangeItemsForLayout(enforceAntiClumping(result, format), layoutMode, format),
    format
  );
}
