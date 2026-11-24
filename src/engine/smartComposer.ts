import {
  AssetId,
  AssetSize,
  CanvasFormatId,
  CanvasItem,
  LayoutMode,
} from '../types/schema';
import { rearrangeItemsForLayout } from '../store/layoutReorder';

export interface ParsedItemRequest {
  assetId: AssetId;
  size?: AssetSize;
}

interface FormatLayoutConfig {
  center: { x: number; y: number };
  heroScale: number;
  satelliteScale: number;
  stepDx: number;
  stepDy: number;
}

const FORMAT_CONFIGS: Record<CanvasFormatId, FormatLayoutConfig> = {
  '1:1': {
    center: { x: 540, y: 560 },
    heroScale: 1.48,
    satelliteScale: 1.36,
    stepDx: 210,
    stepDy: 110,
  },
  '16:9': {
    center: { x: 980, y: 560 },
    heroScale: 1.48,
    satelliteScale: 1.36,
    stepDx: 240,
    stepDy: 120,
  },
  '9:16': {
    center: { x: 540, y: 1140 },
    heroScale: 2.6,
    satelliteScale: 2.1,
    stepDx: 190,
    stepDy: 260,
  },
  og: {
    center: { x: 600, y: 320 },
    heroScale: 1.55,
    satelliteScale: 1.30,
    stepDx: 220,
    stepDy: 110,
  },
};

/**
 * Categorizes asset for hierarchical desk stacking:
 * - 'background': tall objects that stand behind (lamp, vase)
 * - 'base': flat surfaces that act as desk substrates (book/notepad, folder)
 * - 'middle': devices and containers (smartphone, headphones, wallet)
 * - 'foreground': small details and tokens (coin, pen, puzzle)
 */
export function getAssetHierarchy(id: AssetId): 'background' | 'base' | 'middle' | 'foreground' {
  if (id === 'lamp' || id === 'flowers_vase') return 'background';
  if (id === 'notepad' || id === 'folder') return 'base';
  if (id === 'smartphone' || id === 'headphones' || id === 'wallet') return 'middle';
  return 'foreground'; // coin, pen, puzzle
}

/**
 * Smart Hierarchical Composer:
 * Arranges 2-4 items into a tight, cohesive isometric desk composition.
 * Preserves every requested item with proper scaling and realistic isometric offsets.
 */
export function composeSmartHierarchy(
  requests: ParsedItemRequest[],
  format: CanvasFormatId = '1:1',
  layoutMode: LayoutMode = 'centered',
  includeBackgrounds: boolean = false
): CanvasItem[] {
  if (!requests.length) return [];

  const cfg = FORMAT_CONFIGS[format] || FORMAT_CONFIGS['1:1'];
  // Adjust center based on layoutMode
  const centerX = layoutMode === 'headline' && format === '16:9' ? cfg.center.x + 80 : cfg.center.x;
  const centerY = cfg.center.y;

  const result: CanvasItem[] = [];

  const getScale = (req: ParsedItemRequest, defaultRole: 'hero' | 'satellite') => {
    if (req.size === 'S') {
      return format === '9:16' ? 1.5 : 1.0;
    }
    return defaultRole === 'hero' ? cfg.heroScale : cfg.satelliteScale;
  };

  const bases = requests.filter((r) => getAssetHierarchy(r.assetId) === 'base');
  const backgrounds = requests.filter((r) => getAssetHierarchy(r.assetId) === 'background');
  const middles = requests.filter((r) => getAssetHierarchy(r.assetId) === 'middle');
  const foregrounds = requests.filter((r) => getAssetHierarchy(r.assetId) === 'foreground');

  const hasDeskItems = bases.length > 0 || middles.length > 0 || foregrounds.length > 0;

  const getRoleAndOpacity = (assetId: AssetId) => {
    const isBg = getAssetHierarchy(assetId) === 'background';
    if (isBg && (includeBackgrounds || hasDeskItems)) {
      return { role: 'ghost' as const, opacity: 0.22 };
    }
    return { role: 'foreground' as const, opacity: 1 };
  };

  // --- Case 1: Base item exists (e.g. notepad or folder) ---
  if (bases.length > 0) {
    const primaryBase = bases[0];
    const baseCoords =
      format === '9:16'
        ? { x: centerX - cfg.stepDx * 0.4, y: centerY - cfg.stepDy * 0.6 }
        : { x: centerX - cfg.stepDx * 0.35, y: centerY + cfg.stepDy * 0.15 };

    // 1. Primary base (book / folder)
    result.push({
      uid: `item-${Date.now()}-${result.length}`,
      assetId: primaryBase.assetId,
      size: primaryBase.size || 'L',
      x: Math.round(baseCoords.x),
      y: Math.round(baseCoords.y),
      zHeight: 0,
      rotation: 0,
      scale: getScale(primaryBase, 'hero'),
      manualLayerOffset: 0,
      role: 'foreground',
      opacity: 1,
    });

    // 2. Background silhouettes (lamp, vase) behind base
    backgrounds.forEach((bg, idx) => {
      const bgX = baseCoords.x - cfg.stepDx * (0.75 + idx * 0.6);
      const bgY =
        format === '9:16'
          ? baseCoords.y - cfg.stepDy * (1.4 + idx * 0.4)
          : baseCoords.y - cfg.stepDy * (1.2 + idx * 0.3);

      result.push({
        uid: `item-${Date.now()}-${result.length}`,
        assetId: bg.assetId,
        size: bg.size || 'L',
        x: Math.round(bgX),
        y: Math.round(bgY),
        zHeight: 0,
        rotation: 0,
        scale: getScale(bg, 'hero'),
        manualLayerOffset: -2 - idx,
        role: 'ghost',
        opacity: 0.22,
      });
    });

    // 3. Middle items (phone, headphones, wallet) on desk beside book, never stacked on it!
    middles.forEach((mid, idx) => {
      const midX = idx === 0
        ? baseCoords.x - cfg.stepDx * 1.15
        : baseCoords.x + cfg.stepDx * 1.15;
      const midY = baseCoords.y - cfg.stepDy * 0.7;

      result.push({
        uid: `item-${Date.now()}-${result.length}`,
        assetId: mid.assetId,
        size: mid.size || 'L',
        x: Math.round(midX),
        y: Math.round(midY),
        zHeight: 0,
        rotation: 0,
        scale: getScale(mid, idx === 0 ? 'hero' : 'satellite'),
        manualLayerOffset: idx === 0 ? 0 : -1,
        role: 'foreground',
        opacity: 1,
      });
    });

    // 4. Foregrounds: at most ONE small item rests on book page (puzzle or coin)
    const pageItemIdx = foregrounds.findIndex((f) => f.assetId === 'puzzle' || f.assetId === 'coin');
    const pageItem = pageItemIdx !== -1 ? foregrounds[pageItemIdx] : null;
    const remainingForegrounds = foregrounds.filter((_, i) => i !== pageItemIdx);

    if (pageItem) {
      result.push({
        uid: `item-${Date.now()}-${result.length}`,
        assetId: pageItem.assetId,
        size: pageItem.size || 'L',
        x: Math.round(baseCoords.x - 40),
        y: Math.round(baseCoords.y - 25),
        zHeight: 0,
        rotation: 0,
        scale: getScale(pageItem, 'satellite'),
        manualLayerOffset: 1,
        role: 'foreground',
        opacity: 1,
      });
    }

    // Remaining foreground items on table
    remainingForegrounds.forEach((fg, idx) => {
      let rotation = 0;
      let fgX: number;
      let fgY: number;

      if (fg.assetId === 'pen') {
        rotation = 30;
        fgX = baseCoords.x + cfg.stepDx * 0.95;
        fgY = baseCoords.y + cfg.stepDy * 0.95;
      } else {
        fgX = baseCoords.x + cfg.stepDx * (0.95 + idx * 0.3);
        fgY = baseCoords.y + cfg.stepDy * (0.65 + idx * 0.3);
      }

      result.push({
        uid: `item-${Date.now()}-${result.length}`,
        assetId: fg.assetId,
        size: fg.size || 'L',
        x: Math.round(fgX),
        y: Math.round(fgY),
        zHeight: 0,
        rotation,
        scale: getScale(fg, 'satellite'),
        manualLayerOffset: 2 + idx,
        role: 'foreground',
        opacity: 1,
      });
    });

    // 5. Additional bases (if > 1 base)
    bases.slice(1).forEach((extraBase, idx) => {
      result.push({
        uid: `item-${Date.now()}-${result.length}`,
        assetId: extraBase.assetId,
        size: extraBase.size || 'L',
        x: Math.round(baseCoords.x + cfg.stepDx * (0.9 + idx * 0.5)),
        y: Math.round(baseCoords.y + cfg.stepDy * (0.4 + idx * 0.3)),
        zHeight: 0,
        rotation: 0,
        scale: getScale(extraBase, 'satellite'),
        manualLayerOffset: 1 + idx,
        role: 'foreground',
        opacity: 1,
      });
    });

    return rearrangeItemsForLayout(result, layoutMode, format);
  }

  // --- Case 2: No base item present (e.g. Phone + Lamp + Headphones) ---
  const sortedNonBase = [...backgrounds, ...middles, ...foregrounds];

  if (sortedNonBase.length === 1) {
    const single = sortedNonBase[0];
    result.push({
      uid: `item-${Date.now()}-0`,
      assetId: single.assetId,
      size: single.size || 'L',
      x: centerX,
      y: centerY,
      zHeight: 0,
      rotation: single.assetId === 'pen' ? 30 : 0,
      scale: getScale(single, 'hero'),
      manualLayerOffset: 0,
      ...getRoleAndOpacity(single.assetId),
    });
    return rearrangeItemsForLayout(result, layoutMode, format);
  }

  if (sortedNonBase.length === 2) {
    const item0 = sortedNonBase[0];
    const item1 = sortedNonBase[1];
    result.push({
      uid: `item-${Date.now()}-0`,
      assetId: item0.assetId,
      size: item0.size || 'L',
      x: Math.round(centerX - cfg.stepDx * 0.5),
      y: Math.round(centerY - cfg.stepDy * 0.3),
      zHeight: 0,
      rotation: item0.assetId === 'pen' ? 30 : 0,
      scale: getScale(item0, 'hero'),
      manualLayerOffset: getAssetHierarchy(item0.assetId) === 'background' ? -2 : 0,
      ...getRoleAndOpacity(item0.assetId),
    });
    result.push({
      uid: `item-${Date.now()}-1`,
      assetId: item1.assetId,
      size: item1.size || 'L',
      x: Math.round(centerX + cfg.stepDx * 0.5),
      y: Math.round(centerY + cfg.stepDy * 0.4),
      zHeight: 0,
      rotation: item1.assetId === 'pen' ? 30 : 0,
      scale: getScale(item1, 'satellite'),
      manualLayerOffset: getAssetHierarchy(item1.assetId) === 'background' ? -2 : 1,
      ...getRoleAndOpacity(item1.assetId),
    });
    return rearrangeItemsForLayout(result, layoutMode, format);
  }

  if (sortedNonBase.length === 3) {
    if (backgrounds.length === 1 && middles.length === 2) {
      const lamp = backgrounds[0];
      const phone = middles.find((m) => m.assetId === 'smartphone') || middles[0];
      const headphones = middles.find((m) => m !== phone) || middles[1];

      // Phone (top-left)
      result.push({
        uid: `item-${Date.now()}-0`,
        assetId: phone.assetId,
        size: phone.size || 'L',
        x: Math.round(centerX - cfg.stepDx * 0.75),
        y: Math.round(centerY - cfg.stepDy * 0.4),
        zHeight: 0,
        rotation: 0,
        scale: getScale(phone, 'hero'),
        manualLayerOffset: 0,
        ...getRoleAndOpacity(phone.assetId),
      });

      // Lamp (top-right)
      result.push({
        uid: `item-${Date.now()}-1`,
        assetId: lamp.assetId,
        size: lamp.size || 'L',
        x: Math.round(centerX + cfg.stepDx * 0.75),
        y: Math.round(centerY - cfg.stepDy * 0.7),
        zHeight: 0,
        rotation: 0,
        scale: getScale(lamp, 'hero'),
        manualLayerOffset: -2,
        ...getRoleAndOpacity(lamp.assetId),
      });

      // Headphones (foreground)
      result.push({
        uid: `item-${Date.now()}-2`,
        assetId: headphones.assetId,
        size: headphones.size || 'L',
        x: Math.round(centerX),
        y: Math.round(centerY + cfg.stepDy * 0.65),
        zHeight: 0,
        rotation: 0,
        scale: getScale(headphones, 'satellite'),
        manualLayerOffset: 1,
        ...getRoleAndOpacity(headphones.assetId),
      });

      return rearrangeItemsForLayout(result, layoutMode, format);
    }

    const it0 = sortedNonBase[0];
    const it1 = sortedNonBase[1];
    const it2 = sortedNonBase[2];

    result.push({
      uid: `item-${Date.now()}-0`,
      assetId: it0.assetId,
      size: it0.size || 'L',
      x: Math.round(centerX - cfg.stepDx * 0.7),
      y: Math.round(centerY - cfg.stepDy * 0.5),
      zHeight: 0,
      rotation: it0.assetId === 'pen' ? 30 : 0,
      scale: getScale(it0, 'hero'),
      manualLayerOffset: getAssetHierarchy(it0.assetId) === 'background' ? -2 : -1,
      ...getRoleAndOpacity(it0.assetId),
    });

    result.push({
      uid: `item-${Date.now()}-1`,
      assetId: it1.assetId,
      size: it1.size || 'L',
      x: Math.round(centerX + cfg.stepDx * 0.65),
      y: Math.round(centerY - cfg.stepDy * 0.25),
      zHeight: 0,
      rotation: it1.assetId === 'pen' ? 30 : 0,
      scale: getScale(it1, 'hero'),
      manualLayerOffset: getAssetHierarchy(it1.assetId) === 'background' ? -2 : 0,
      ...getRoleAndOpacity(it1.assetId),
    });

    result.push({
      uid: `item-${Date.now()}-2`,
      assetId: it2.assetId,
      size: it2.size || 'L',
      x: Math.round(centerX),
      y: Math.round(centerY + cfg.stepDy * 0.65),
      zHeight: 0,
      rotation: it2.assetId === 'pen' ? 30 : 0,
      scale: getScale(it2, 'satellite'),
      manualLayerOffset: 1,
      ...getRoleAndOpacity(it2.assetId),
    });

    return rearrangeItemsForLayout(result, layoutMode, format);
  }

  // --- Case 3: 4+ items without base ---
  sortedNonBase.forEach((it, idx) => {
    const isBg = getAssetHierarchy(it.assetId) === 'background';
    const angleX = (idx % 2 === 0 ? -1 : 1) * cfg.stepDx * (0.6 + Math.floor(idx / 2) * 0.35);
    const angleY = (idx < 2 ? -1 : 1) * cfg.stepDy * (0.4 + Math.floor(idx / 2) * 0.35);

    result.push({
      uid: `item-${Date.now()}-${idx}`,
      assetId: it.assetId,
      size: it.size || 'L',
      x: Math.round(centerX + angleX),
      y: Math.round(centerY + angleY),
      zHeight: 0,
      rotation: it.assetId === 'pen' ? 30 : 0,
      scale: getScale(it, idx < 2 ? 'hero' : 'satellite'),
      manualLayerOffset: isBg ? -2 : (idx < 2 ? 0 : 1),
      ...getRoleAndOpacity(it.assetId),
    });
  });

  return rearrangeItemsForLayout(result, layoutMode, format);
}
