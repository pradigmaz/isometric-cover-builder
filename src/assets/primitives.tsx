import React, { type SVGProps } from 'react';
import type { AssetSize, ItemRole } from '../types/schema';

export interface AssetProps extends SVGProps<SVGSVGElement> {
  size?: AssetSize;
  role?: ItemRole;
}

export const ISO_COS = 0.8660254; // cos(30 deg) = sqrt(3)/2
export const ISO_SIN = 0.5;       // sin(30 deg) = 1/2

/**
 * 3D to 2D isometric projection:
 * u: axis down-right (+30 deg)
 * v: axis down-left (+150 deg)
 * w: vertical axis straight UP (+90 deg)
 */
export function projectIso(u: number, v: number, w = 0): { x: number; y: number } {
  return {
    x: (u - v) * ISO_COS,
    y: (u + v) * ISO_SIN - w,
  };
}

export function isoPointStr(u: number, v: number, w = 0): string {
  const p = projectIso(u, v, w);
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}

export function isoPolygonPath(points: Array<[number, number, number]>): string {
  if (points.length === 0) return '';
  return (
    points
      .map((pt, i) => {
        const p = projectIso(pt[0], pt[1], pt[2]);
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
}

export interface AssetContainerProps extends AssetProps {
  children: React.ReactNode;
}

/**
 * Standard container for all 10 isometric vector assets.
 * Guarantees viewBox 600x600 for L with anchor (300, 300),
 * and viewBox 200x200 for S with anchor (100, 100).
 */
export const AssetContainer: React.FC<AssetContainerProps> = ({
  size = 'L',
  role = 'foreground',
  children,
  className,
  style,
  ...props
}) => {
  const isL = size === 'L';
  const viewBox = isL ? '0 0 600 600' : '0 0 200 200';
  const width = isL ? 600 : 200;
  const height = isL ? 600 : 200;
  const center = isL ? 300 : 100;
  const scale = isL ? 1 : 0.3333333333;

  return (
    <svg
      viewBox={viewBox}
      width={props.width ?? width}
      height={props.height ?? height}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={props.preserveAspectRatio ?? 'xMidYMid meet'}
      className={className}
      style={{
        overflow: 'visible',
        display: 'inline-block',
        ...style,
      }}
      {...props}
    >
      <g
        transform={`translate(${center}, ${center}) scale(${scale})`}
      >
        {children}
      </g>
    </svg>
  );
};

/**
 * Maps raw Figma hex colors to semantic CSS variables with full dark/light theme support.
 * In ghost mode, preserves 3D isometric facet shading (light top, medium side, dark stroke)
 * instead of flattening everything into a single uniform color.
 */
export function getAssetFill(color: string, isGhost: boolean): string {
  if (color === 'none' || !color) return 'none';

  if (isGhost) {
    switch (color) {
      case '#181817':
      case 'black':
      case 'secondary':
      case 'accent':
      case 'coral':
      case 'lilac':
      case '#7864D7':
      case '#AA9BF0':
      case '#F9A3AA':
      case '#80DADA':
      case '#5ABEBE':
        return 'var(--token-primary)';
      case 'white':
      case 'light':
      case '#FFFDF9':
      case 'primary':
      case '#F9ECB0':
      case 'surface':
      case '#D7CDF5':
      case '#FAC896':
      case '#FDD7B9':
      default:
        return 'var(--token-surface)';
    }
  }

  // Foreground mode:
  // Preserves authentic SVG Figma illustration colors
  switch (color) {
    case '#181817':
    case 'black':
    case 'secondary':
      return 'var(--token-secondary, #181817)';
    case 'white':
    case 'light':
    case '#FFFDF9':
      return 'var(--token-light, #FFFFFF)';
    case 'primary':
    case '#F9ECB0':
      return 'var(--token-primary, #F9ECB0)'; // Soft pastel yellow hero
    case 'coral':
      return 'var(--token-accent, #F9A3AA)';
    case '#F9A3AA':
    case '#F1899C':
      return '#F9A3AA'; // Authentic coral/pink puzzle piece
    case 'surface':
    case '#D7CDF5':
      return 'var(--token-surface, #D7CDF5)'; // Authentic soft lilac
    case 'lilac':
    case 'accent':
      return 'var(--token-accent, #AA9BF0)';
    case '#8571D9':
    case '#7864D7':
    case '#AA9BF0':
      return color; // Authentic Figma purple/lilac shades
    case '#FAC896':
    case '#FDD7B9':
      return color; // Authentic gold / warm peach
    case '#80DADA':
    case '#BEEBEB':
    case '#5ABEBE':
      return color; // Authentic turquoise / mint
    default:
      return color;
  }
}

export interface IsoBoxProps {
  u: number;
  v: number;
  w?: number;
  length: number;
  width: number;
  height: number;
  fillTop?: string;
  fillLeft?: string;
  fillRight?: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Renders an isometric box with 3 faces (top, left, right).
 */
export const IsoBox: React.FC<IsoBoxProps> = ({
  u,
  v,
  w = 0,
  length,
  width,
  height,
  fillTop = 'var(--token-light)',
  fillLeft = 'var(--token-primary)',
  fillRight = 'var(--token-secondary)',
  stroke = 'var(--token-secondary)',
  strokeWidth = 3,
}) => {
  const u0 = u - length / 2;
  const u1 = u + length / 2;
  const v0 = v - width / 2;
  const v1 = v + width / 2;
  const wBottom = w;
  const wTop = w + height;

  // Top face (horizontal plane at wTop)
  const topPath = isoPolygonPath([
    [u0, v0, wTop],
    [u1, v0, wTop],
    [u1, v1, wTop],
    [u0, v1, wTop],
  ]);

  // Left face (front-left plane at v1)
  const leftPath = isoPolygonPath([
    [u0, v1, wTop],
    [u1, v1, wTop],
    [u1, v1, wBottom],
    [u0, v1, wBottom],
  ]);

  // Right face (front-right plane at u1)
  const rightPath = isoPolygonPath([
    [u1, v0, wTop],
    [u1, v1, wTop],
    [u1, v1, wBottom],
    [u1, v0, wBottom],
  ]);

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={leftPath} fill={fillLeft} stroke={stroke} strokeWidth={strokeWidth} />
      <path d={rightPath} fill={fillRight} stroke={stroke} strokeWidth={strokeWidth} />
      <path d={topPath} fill={fillTop} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
};

export interface IsoDropShadowProps {
  cx?: number;
  cy?: number;
  rx: number;
  ry: number;
  rotation?: number;
  opacity?: number;
}

/**
 * Ground drop shadow cast in the isometric plane.
 */
export const IsoDropShadow: React.FC<IsoDropShadowProps> = ({
  cx = 0,
  cy = 0,
  rx,
  ry,
  rotation = 0,
  opacity = 0.85,
}) => {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      fill="var(--token-secondary)"
      opacity={opacity}
    />
  );
};
