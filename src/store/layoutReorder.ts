import { CanvasFormatId, CanvasItem, LayoutMode, PaletteConfig, PaletteId } from '../types/schema';
import { getFormatSpec } from '../config/formats';
import { registerCustomPalette } from '../config/palettes';

export interface SceneSnapshot {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette?: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
}

export function createSnapshot(state: {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette?: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
}): SceneSnapshot {
  return {
    format: state.format,
    paletteId: state.paletteId,
    customPalette: state.customPalette ? JSON.parse(JSON.stringify(state.customPalette)) : null,
    layoutMode: state.layoutMode,
    includeBackgrounds: state.includeBackgrounds,
    items: JSON.parse(JSON.stringify(state.items)),
    lastPrompt: state.lastPrompt,
  };
}

export function applySnapshot(snap: SceneSnapshot) {
  registerCustomPalette(snap.customPalette ?? null);
  return {
    format: snap.format,
    paletteId: snap.paletteId,
    customPalette: snap.customPalette ?? null,
    layoutMode: snap.layoutMode,
    includeBackgrounds: snap.includeBackgrounds,
    items: snap.items,
    lastPrompt: snap.lastPrompt,
    selectedUid: null,
    selectedUids: [],
  };
}

export const INITIAL_ITEMS: CanvasItem[] = [
  { uid: 'demo-hero', assetId: 'wallet', size: 'L', role: 'foreground', x: 600, y: 315, zHeight: 0, rotation: 0, scale: 0.78, opacity: 1, manualLayerOffset: 0 },
  { uid: 'demo-coin', assetId: 'coin', size: 'S', role: 'foreground', x: 820, y: 400, zHeight: 0, rotation: 30, scale: 0.85, opacity: 1, manualLayerOffset: 1 },
  { uid: 'demo-puzzle', assetId: 'puzzle', size: 'S', role: 'foreground', x: 380, y: 220, zHeight: 0, rotation: -30, scale: 0.85, opacity: 1, manualLayerOffset: -1 },
  { uid: 'demo-folder', assetId: 'folder', size: 'S', role: 'ghost', x: 880, y: 180, zHeight: 0, rotation: 0, scale: 0.9, opacity: 0.22, manualLayerOffset: -5 },
];

/**
 * Calculates the target center of mass for a given layout mode and canvas format.
 * - 'headline' («Под заголовок»): anchors items to leave ample space for title typography:
 *   - 16:9 -> (1320, 620) [right half clear for headline on left]
 *   - 1:1  -> (540, 720)  [lower half clear for headline on top]
 *   - 9:16 -> (540, 1380) [lower half clear for headline on upper 50%]
 * - 'offset' («Диагональ»): items follow a dynamic cascade along the 30° isometric axis:
 *   - 16:9 -> (1080, 580)
 *   - 1:1  -> (480, 580)
 *   - 9:16 -> (540, 1180)
 * - 'centered' («Собрано»): items gather into a balanced cluster in the visual center:
 *   - 16:9 -> (960, 540)
 *   - 1:1  -> (540, 540)
 *   - 9:16 -> (540, 960)
 */
export function getTargetLayoutCenter(
  layoutMode: LayoutMode,
  format: CanvasFormatId
): { x: number; y: number } {
  if (format === '16:9') {
    switch (layoutMode) {
      case 'headline':
        return { x: 1320, y: 620 };
      case 'offset':
        return { x: 1080, y: 580 };
      case 'centered':
      default:
        return { x: 960, y: 540 };
    }
  }

  if (format === '1:1') {
    switch (layoutMode) {
      case 'headline':
        return { x: 540, y: 720 };
      case 'offset':
        return { x: 480, y: 580 };
      case 'centered':
      default:
        return { x: 540, y: 540 };
    }
  }

  if (format === '9:16') {
    switch (layoutMode) {
      case 'headline':
        return { x: 540, y: 1380 };
      case 'offset':
        return { x: 540, y: 1180 };
      case 'centered':
      default:
        return { x: 540, y: 960 };
    }
  }

  if (format === 'og') {
    switch (layoutMode) {
      case 'headline':
        // x ≈ 825 (in range 810–840), keeping left ~45% (0–512px) completely free for title typography
        return { x: 825, y: 360 };
      case 'offset':
        // Shifted along 30° isometric axis rightward/asymmetric (dx=+90, dy=+45)
        return { x: 690, y: 360 };
      case 'centered':
      default:
        return { x: 600, y: 315 };
    }
  }

  // Horizontal presets:
  const spec = getFormatSpec(format);
  switch (layoutMode) {
    case 'headline':
      return {
        x: Math.round(spec.width * (1320 / 1920)),
        y: Math.round(spec.height * (620 / 1080)),
      };
    case 'offset':
      return {
        x: Math.round(spec.width * (1080 / 1920)),
        y: Math.round(spec.height * (580 / 1080)),
      };
    case 'centered':
    default:
      return {
        x: Math.round(spec.width * 0.5),
        y: Math.round(spec.height * 0.5),
      };
  }
}

/**
 * Shifts canvas items to align their center of mass with the target layout center,
 * preserving relative positions, rotations, scales, z-heights, and layering offsets.
 */
export function rearrangeItemsForLayout(
  items: CanvasItem[],
  layoutMode: LayoutMode,
  format: CanvasFormatId
): CanvasItem[] {
  if (!items || items.length === 0) return items;

  const targetCenter = getTargetLayoutCenter(layoutMode, format);
  const spec = getFormatSpec(format);

  const currentCenterX = items.reduce((sum, it) => sum + it.x, 0) / items.length;
  const currentCenterY = items.reduce((sum, it) => sum + it.y, 0) / items.length;

  const dx = Math.round(targetCenter.x - currentCenterX);
  const dy = Math.round(targetCenter.y - currentCenterY);

  if (dx === 0 && dy === 0) return items;

  // Apply layoutMode translation as a whole-group offset (dx, dy),
  // strictly preserving the relative spacing and geometry between all items
  const minX = Math.min(...items.map((it) => it.x));
  const maxX = Math.max(...items.map((it) => it.x));
  const minY = Math.min(...items.map((it) => it.y));
  const maxY = Math.max(...items.map((it) => it.y));

  const margin = 40;
  const safeDx = Math.max(margin - minX, Math.min(spec.width - margin - maxX, dx));
  const safeDy = Math.max(margin - minY, Math.min(spec.height - margin - maxY, dy));

  return items.map((it) => ({
    ...it,
    x: Math.round(it.x + safeDx),
    y: Math.round(it.y + safeDy),
  }));
}
