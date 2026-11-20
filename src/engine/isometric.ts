import { CanvasItem, IsoGridPoint, Point2D } from '../types/schema';

/**
 * Mathematical constants for 30-degree isometric projection.
 * cos(30°) = √3 / 2 ≈ 0.8660254037844386
 * sin(30°) = 1 / 2 = 0.5
 * tan(30°) = 1 / √3 ≈ 0.5773502691896257
 */
export const COS_30 = Math.cos(Math.PI / 6);
export const SIN_30 = Math.sin(Math.PI / 6);
export const TAN_30 = Math.tan(Math.PI / 6);

export const DEFAULT_GRID_STEP = 48;

/**
 * Direct projection: Isometric Grid (gx, gy, gz) -> Screen (x, y)
 *
 * Formula:
 * Xscreen = Ox + (gx - gy) * S * cos(30°)
 * Yscreen = Oy + (gx + gy) * S * sin(30°) - gz
 */
export function gridToScreen(
  gx: number,
  gy: number,
  origin: Point2D = { x: 0, y: 0 },
  gridStep: number = DEFAULT_GRID_STEP,
  gz: number = 0
): Point2D {
  const x = origin.x + (gx - gy) * gridStep * COS_30;
  const y = origin.y + (gx + gy) * gridStep * SIN_30 - gz;
  return { x, y };
}

/**
 * Inverse projection: Screen (x, y) -> Isometric Grid (gx, gy)
 *
 * Formula:
 * Δx = Xscreen - Ox
 * Δy = Yscreen + gz - Oy
 * gx = (1 / (2 * S)) * (Δx / cos(30°) + Δy / sin(30°))
 * gy = (1 / (2 * S)) * (Δy / sin(30°) - Δx / cos(30°))
 */
export function screenToGrid(
  x: number,
  y: number,
  origin: Point2D = { x: 0, y: 0 },
  gridStep: number = DEFAULT_GRID_STEP,
  zHeight: number = 0
): IsoGridPoint {
  const dx = x - origin.x;
  const dy = y + zHeight - origin.y;

  const inv2S = 1 / (2 * gridStep);
  const gx = inv2S * (dx / COS_30 + dy / SIN_30);
  const gy = inv2S * (dy / SIN_30 - dx / COS_30);

  return { gx, gy, gz: zHeight };
}

/**
 * Snaps a screen point to the nearest isometric grid intersection.
 * Computes exact gx and gy, rounds them to integers, and projects back to screen coordinates.
 */
export function snapToIsoGrid(
  screenPoint: Point2D,
  gridStep: number = DEFAULT_GRID_STEP,
  origin: Point2D = { x: 0, y: 0 },
  zHeight: number = 0
): Point2D & { gx: number; gy: number } {
  const { gx, gy } = screenToGrid(screenPoint.x, screenPoint.y, origin, gridStep, zHeight);
  const roundedGx = Math.round(gx);
  const roundedGy = Math.round(gy);
  const snappedScreen = gridToScreen(roundedGx, roundedGy, origin, gridStep, zHeight);

  return {
    x: snappedScreen.x,
    y: snappedScreen.y,
    gx: roundedGx,
    gy: roundedGy,
  };
}

/**
 * Canonical depth calculation for 30-degree isometric projection.
 * Depth = X + 2 * Y
 * In isometric projection, items with higher depth are rendered further in front (Painter's algorithm).
 */
export function computeDepth(x: number, y: number): number {
  return x + 2 * y;
}

/**
 * Hybrid depth sorting according to Section 7.2 of the architecture plan:
 * 1. Role: 'ghost' items always render underneath 'foreground' items.
 * 2. Manual offset: manualLayerOffset shift (higher renders on top).
 * 3. Isometric depth: Depth = X + 2*Y (ascending sort order for SVG DOM children).
 * 4. Tie-breaker: stable sort by uid.
 */
export function sortCanvasItems<T extends CanvasItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Role level: ghost items come first in SVG DOM (rendered in the background)
    if (a.role !== b.role) {
      return a.role === 'ghost' ? -1 : 1;
    }

    // 2. Manual layer offset level
    const offsetA = a.manualLayerOffset ?? 0;
    const offsetB = b.manualLayerOffset ?? 0;
    if (offsetA !== offsetB) {
      return offsetA - offsetB;
    }

    // 3. Isometric depth: Depth = X + 2*Y
    const depthA = computeDepth(a.x, a.y);
    const depthB = computeDepth(b.x, b.y);
    if (Math.abs(depthA - depthB) > 0.001) {
      return depthA - depthB;
    }

    // 4. Stable tie-breaker by uid
    return a.uid.localeCompare(b.uid);
  });
}

/**
 * Transforms pointer/client coordinates (clientX, clientY) into SVG coordinates
 * using the element's CTM inverse (SVGGraphicsElement.getScreenCTM().inverse()).
 */
export function clientToSvgPoint(
  svgElement: SVGGraphicsElement,
  clientX: number,
  clientY: number
): Point2D {
  const ctm = svgElement.getScreenCTM();
  if (!ctm) {
    return { x: clientX, y: clientY };
  }

  const inverse = ctm.inverse();

  // Try DOMPoint first if available in the execution environment
  if (typeof DOMPoint !== 'undefined') {
    const point = new DOMPoint(clientX, clientY).matrixTransform(inverse);
    return { x: point.x, y: point.y };
  }

  // Fallback to SVGPoint via ownerSVGElement
  const svgRoot = svgElement instanceof SVGSVGElement ? svgElement : svgElement.ownerSVGElement;
  if (svgRoot && typeof svgRoot.createSVGPoint === 'function') {
    const pt = svgRoot.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(inverse);
    return { x: transformed.x, y: transformed.y };
  }

  // Fallback manual 2D affine matrix inversion: [a c e; b d f; 0 0 1]
  const a = inverse.a;
  const b = inverse.b;
  const c = inverse.c;
  const d = inverse.d;
  const e = inverse.e;
  const f = inverse.f;

  return {
    x: a * clientX + c * clientY + e,
    y: b * clientX + d * clientY + f,
  };
}

export interface GridLineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Generates isometric 30-degree grid line segments for drawing in an SVG overlay.
 * For true 30° lines to horizontal: dy / dx = tan(30°) = 1 / √3, so dxSpan = height / TAN_30.
 * Parallel grid lines step along the X-axis at y=0 with spacing: gridStep * 2 * COS_30.
 */
export function generateIsoGridLines(
  width: number,
  height: number,
  gridStep: number = DEFAULT_GRID_STEP,
  origin: Point2D = { x: 0, y: 0 }
): GridLineSegment[] {
  const lines: GridLineSegment[] = [];
  const dxSpan = height / TAN_30;
  const xStep = gridStep * 2 * COS_30;
  const span = Math.max(width, height) + dxSpan * 1.5;

  // Lines oriented at +30° and -30° relative to horizontal
  for (let x = origin.x - span; x <= origin.x + width + span; x += xStep) {
    // Axis 1: slope +tan(30°) -> from (x, 0) to (x + dxSpan, height)
    lines.push({
      x1: x,
      y1: 0,
      x2: x + dxSpan,
      y2: height,
    });

    // Axis 2: slope -tan(30°) -> from (x, 0) to (x - dxSpan, height)
    lines.push({
      x1: x,
      y1: 0,
      x2: x - dxSpan,
      y2: height,
    });
  }

  return lines;
}
