import { getAssetVisualBounds } from '../../assets/registry';
import { CanvasItem } from '../../types/schema';

/**
 * Clamps target (x, y) so the entire visual bounding box of the item
 * stays strictly within artboard boundaries [0, canvasWidth] and [0, canvasHeight].
 */
export function clampItemPosition(
  item: Pick<CanvasItem, 'assetId' | 'size'> & Partial<Pick<CanvasItem, 'scale' | 'zHeight' | 'rotation'>>,
  targetX: number,
  targetY: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const bounds = getAssetVisualBounds(item.assetId, item.size);
  const scale = item.scale || 1;
  const halfW = (bounds.width * scale) / 2;
  const halfH = (bounds.height * scale) / 2;
  const localOffsetY = bounds.offsetY * scale;
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

  const minX = -minDx;
  const maxX = canvasWidth - maxDx;
  const minY = -minDy;
  const maxY = canvasHeight - maxDy;

  const clampedX = minX > maxX ? Math.round(canvasWidth / 2) : Math.max(minX, Math.min(maxX, targetX));
  const clampedY = minY > maxY ? Math.round(canvasHeight / 2) : Math.max(minY, Math.min(maxY, targetY));

  return { x: Math.round(clampedX), y: Math.round(clampedY) };
}

/**
 * Clamps scale so resizing an item cannot push any visual corner outside artboard boundaries.
 */
export function clampItemScale(
  item: Pick<CanvasItem, 'assetId' | 'size' | 'x' | 'y'> & Partial<Pick<CanvasItem, 'zHeight' | 'rotation'>>,
  targetScale: number,
  canvasWidth: number,
  canvasHeight: number
): number {
  const bounds = getAssetVisualBounds(item.assetId, item.size);
  const zH = item.zHeight || 0;
  const pivotY = item.y - zH;
  const rot = item.rotation || 0;
  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const corners = [
    { dx: -halfW, dy: bounds.offsetY - halfH },
    { dx: halfW, dy: bounds.offsetY - halfH },
    { dx: halfW, dy: bounds.offsetY + halfH },
    { dx: -halfW, dy: bounds.offsetY + halfH },
  ];

  let maxScale = 3.5;
  for (const c of corners) {
    const rx1 = c.dx * cos - c.dy * sin;
    const ry1 = c.dx * sin + c.dy * cos;
    if (rx1 < -1e-5) maxScale = Math.min(maxScale, item.x / -rx1);
    if (rx1 > 1e-5) maxScale = Math.min(maxScale, (canvasWidth - item.x) / rx1);
    if (ry1 < -1e-5) maxScale = Math.min(maxScale, pivotY / -ry1);
    if (ry1 > 1e-5) maxScale = Math.min(maxScale, (canvasHeight - pivotY) / ry1);
  }

  const safeMax = Math.max(0.3, +maxScale.toFixed(2));
  return Math.max(0.3, Math.min(safeMax, targetScale));
}
