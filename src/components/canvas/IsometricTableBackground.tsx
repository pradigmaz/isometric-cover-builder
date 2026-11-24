import React from 'react';
import { CanvasFormatId, PaletteId } from '../../types/schema';

export const TAN_30 = Math.tan(Math.PI / 6); // 1 / √3 ≈ 0.5773502691896257

export interface IsometricTableBackgroundProps {
  width: number;
  height: number;
  format?: CanvasFormatId;
  paletteId?: PaletteId;
  /** Optional custom fill for top wall (defaults to var(--token-bg, #DDD5F9)) */
  wallColor?: string;
  /** Optional custom fill for table floor surface (defaults to var(--token-surface, #9E91E8)) */
  tableColor?: string;
  /** Whether to show subtle isometric ambient strokes on the desk surface (default: true) */
  showGridStrokes?: boolean;
  /** Whether to show discreet 'Фон' label in top-left corner (default: true) */
  showLabel?: boolean;
  /** Whether to render flat solid wall background without the 30° diagonal split desk surface (default: false) */
  isFlatBackground?: boolean;
  /** Direction of the 30° diagonal split (default: 'auto') */
  diagonalDirection?: 'down-right' | 'up-right' | 'auto';
  className?: string;
}

export interface TableFloorPathResult {
  pathData: string;
  splitLine: { x1: number; y1: number; x2: number; y2: number };
  slopeAngleDeg: number;
  effectiveDirection: 'down-right' | 'up-right';
}

/**
 * Computes exact 30° isometric floor polygon and split line for any artboard dimensions.
 * Conforms to Studio «Очень» reference geometry where the desk surface supports the 2-3 hero items.
 */
export function calculateTableFloorPath(
  width: number,
  height: number,
  format?: CanvasFormatId,
  direction: 'down-right' | 'up-right' | 'auto' = 'auto'
): TableFloorPathResult {
  const isHorizontal = format === '16:9' || format === 'og' || width > height * 1.3;
  const isVertical = format === '9:16' || height > width * 1.4;
  const effectiveDirection: 'down-right' | 'up-right' =
    direction !== 'auto'
      ? direction
      : 'up-right';

  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;
  let pathData: string;

  if (effectiveDirection === 'up-right') {
    // Edge rises from left/bottom towards top-right at exact 30° angle
    if (isHorizontal) {
      // Passes through bottom edge at x = width * 0.25 and exits on right edge
      x1 = Math.round(width * 0.25);
      y1 = height;
      const dx = width - x1;
      const dy = dx * TAN_30;
      x2 = width;
      y2 = Math.round(y1 - dy);

      // Floor covers bottom-right polygon under the 30° diagonal line
      pathData = `M ${x1} ${y1} L ${x2} ${y2} L ${width} ${height} Z`;
    } else if (isVertical) {
      // 9:16 Stories (1080x1920): Grounded desk surface spanning across lower canvas
      // Edge rises from left edge (y ~ 1720) to right edge (y ~ 1096) at exact 30°
      x1 = 0;
      y1 = Math.round(height * 0.896);
      const dx = width;
      const dy = dx * TAN_30;
      x2 = width;
      y2 = Math.round(y1 - dy);

      // Floor covers grounded desk polygon under the 30° diagonal line
      pathData = `M 0 ${y1} L ${x2} ${y2} L ${width} ${height} L 0 ${height} Z`;
    } else {
      // 1:1 format: spans left edge to right edge
      const yMid = Math.round(height * 0.58);
      const halfDx = width / 2;
      y1 = Math.round(yMid + halfDx * TAN_30);
      y2 = Math.round(yMid - halfDx * TAN_30);
      x1 = 0;
      x2 = width;

      pathData = `M 0 ${y1} L ${width} ${y2} L ${width} ${height} L 0 ${height} Z`;
    }
  } else {
    // effectiveDirection === 'down-right': edge slopes down-right at exact 30°
    if (isHorizontal) {
      // Enters left edge and exits on bottom edge
      x1 = 0;
      y1 = Math.round(height * 0.25);
      const dy = height - y1;
      const dx = dy / TAN_30;
      x2 = Math.round(Math.min(width, dx));
      y2 = height;

      pathData = `M 0 ${y1} L ${x2} ${y2} L 0 ${height} Z`;
    } else {
      // 1:1 format: spans left edge to right edge across canvas
      const yMid = Math.round(height * 0.58);
      const halfDx = width / 2;
      y1 = Math.round(yMid - halfDx * TAN_30);
      y2 = Math.round(yMid + halfDx * TAN_30);
      x1 = 0;
      x2 = width;

      pathData = `M 0 ${y1} L ${width} ${y2} L ${width} ${height} L 0 ${height} Z`;
    }
  }

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const slopeAngleDeg = dx > 0 ? (Math.atan(dy / dx) * 180) / Math.PI : 30;

  return {
    pathData,
    splitLine: { x1, y1, x2, y2 },
    slopeAngleDeg,
    effectiveDirection,
  };
}

/**
 * Reusable SVG Dual-Tone Table Background component for Studio «Очень» isometric covers.
 * Provides:
 * - Top wall: light lavender / theme background token (--token-bg)
 * - Bottom floor: saturated lilac / table surface token (--token-surface)
 * - Split by exact 30° isometric diagonal edge
 * - Subtle isometric ambient strokes and discreet 'Фон' label in top-left corner
 */
export const IsometricTableBackground: React.FC<IsometricTableBackgroundProps> = ({
  width,
  height,
  format,
  paletteId,
  wallColor,
  tableColor,
  showGridStrokes = true,
  showLabel = true,
  isFlatBackground = false,
  diagonalDirection = 'auto',
  className,
}) => {
  const { pathData, splitLine } = calculateTableFloorPath(width, height, format, diagonalDirection);

  const wallFill = wallColor ?? 'var(--token-bg, #DDD5F9)';
  const floorFill = tableColor ?? 'var(--token-surface, #9E91E8)';

  return (
    <g
      id="isometric-table-background"
      data-table-background="true"
      data-palette-id={paletteId}
      className={className}
    >
      {/* 1. Top Wall: light lavender background rect */}
      <rect
        id="canvas-wall-bg"
        width={width}
        height={height}
        fill={wallFill}
      />

      {/* 2. Bottom Floor: saturated lilac table surface split by 30° isometric diagonal edge (omitted for flat background) */}
      {!isFlatBackground && (
        <path
          id="canvas-floor-surface"
          d={pathData}
          fill={floorFill}
        />
      )}

      {/* 3. Subtle 30° Isometric Horizon Split Edge */}
      {!isFlatBackground && (
        <line
          id="canvas-table-edge"
          x1={splitLine.x1}
          y1={splitLine.y1}
          x2={splitLine.x2}
          y2={splitLine.y2}
          stroke="var(--token-secondary, #181817)"
          strokeWidth="1.25"
          opacity="0.25"
        />
      )}

      {/* 4. Authentic 30° Top Diagonal Split Line matching Figma reference */}
      {!isFlatBackground && (
        <line
          id="canvas-top-diagonal"
          x1={Math.round(width * 0.38)}
          y1={0}
          x2={width}
          y2={Math.round((width * 0.62) * TAN_30)}
          stroke="var(--token-secondary, #181817)"
          strokeWidth="1.25"
          opacity="0.2"
        />
      )}

      {/* 5. Subtle isometric ambient group (without decorative wall smudges) */}
      {showGridStrokes && (
        <g id="table-ambient-strokes" pointerEvents="none" />
      )}

      {/* 5. Isometric ambient elements for flat canonical background (Cover 1) */}
      {isFlatBackground && showGridStrokes && (
        <g
          id="flat-isometric-ticks"
          pointerEvents="none"
          stroke="var(--token-secondary, #181817)"
          strokeWidth="1.25"
          opacity="0.22"
        >
          {/* Top-left tick lines (rising at 30°: dy = -dx * TAN_30) */}
          <line
            x1={Math.round(width * 0.11)}
            y1={Math.round(height * 0.28)}
            x2={Math.round(width * 0.11 + width * 0.08)}
            y2={Math.round(height * 0.28 - width * 0.08 * TAN_30)}
          />
          <line
            x1={Math.round(width * 0.14)}
            y1={Math.round(height * 0.23)}
            x2={Math.round(width * 0.14 + width * 0.07)}
            y2={Math.round(height * 0.23 - width * 0.07 * TAN_30)}
          />
          {/* Bottom-right tick lines (rising at 30°) */}
          <line
            x1={Math.round(width * 0.68)}
            y1={Math.round(height * 0.74)}
            x2={Math.round(width * 0.68 + width * 0.09)}
            y2={Math.round(height * 0.74 - width * 0.09 * TAN_30)}
          />
          <line
            x1={Math.round(width * 0.74)}
            y1={Math.round(height * 0.68)}
            x2={Math.round(width * 0.74 + width * 0.08)}
            y2={Math.round(height * 0.68 - width * 0.08 * TAN_30)}
          />
          {/* Mid tick line near phone */}
          <line
            x1={Math.round(width * 0.52)}
            y1={Math.round(height * 0.82)}
            x2={Math.round(width * 0.52 + width * 0.05)}
            y2={Math.round(height * 0.82 - width * 0.05 * TAN_30)}
          />
        </g>
      )}

      {/* 5. Authentic 'Фон' capsule badge in top-left corner */}
      {showLabel && (
        <g id="canvas-bg-label-group" pointerEvents="none" data-editor-only="true">
          <rect
            x={24}
            y={22}
            width={46}
            height={22}
            rx={4}
            fill="white"
            stroke="rgba(24, 24, 23, 0.12)"
            strokeWidth="1"
          />
          <text
            id="canvas-bg-label"
            x={47}
            y={37}
            textAnchor="middle"
            fill="#181817"
            opacity="0.65"
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.04em"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            style={{ userSelect: 'none' }}
          >
            Фон
          </text>
        </g>
      )}
    </g>
  );
};

export default IsometricTableBackground;
