import { CanvasItem } from '../../types/schema';
import { getAssetVisualBounds } from '../../assets/registry';

export interface MarqueeState {
  isSelecting: boolean;
  isAdditive: boolean;
  initialUids: string[];
  startPt: { x: number; y: number };
  currentPt: { x: number; y: number };
}

export const INITIAL_MARQUEE_STATE: MarqueeState = {
  isSelecting: false,
  isAdditive: false,
  initialUids: [],
  startPt: { x: 0, y: 0 },
  currentPt: { x: 0, y: 0 },
};

/**
 * Calculates which canvas items intersect the marquee bounding rectangle.
 */
export function getMarqueeIntersectingUids(
  items: CanvasItem[],
  startPt: { x: number; y: number },
  currentPt: { x: number; y: number }
): string[] {
  const minX = Math.min(startPt.x, currentPt.x);
  const maxX = Math.max(startPt.x, currentPt.x);
  const minY = Math.min(startPt.y, currentPt.y);
  const maxY = Math.max(startPt.y, currentPt.y);

  const hitUids: string[] = [];
  for (const it of items) {
    const bounds = getAssetVisualBounds(it.assetId, it.size);
    const scale = it.scale || 1;
    const w = bounds.width * scale;
    const h = bounds.height * scale;
    const visualY = it.y - (it.zHeight || 0) + bounds.offsetY * scale;

    const left = it.x - w / 2;
    const right = it.x + w / 2;
    const top = visualY - h / 2;
    const bottom = visualY + h / 2;

    const intersects = !(right < minX || left > maxX || bottom < minY || top > maxY);
    if (intersects) hitUids.push(it.uid);
  }
  return hitUids;
}

/**
 * Returns normalized SVG rect bounds for marquee box rendering.
 */
export function getMarqueeRect(startPt: { x: number; y: number }, currentPt: { x: number; y: number }) {
  return {
    x: Math.min(startPt.x, currentPt.x),
    y: Math.min(startPt.y, currentPt.y),
    width: Math.abs(currentPt.x - startPt.x),
    height: Math.abs(currentPt.y - startPt.y),
  };
}
