import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const PuzzleAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const topFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const leftSideFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const rightSideFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <path
        d="M -70 20 C -70 20 -40 85 20 85 C 60 85 130 50 130 20 C 130 -10 90 20 50 35 C 10 50 -50 25 -70 20 Z"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Extruded 3D Bottom/Side walls (depth = 26px) */}
        {/* Left-facing extrusion */}
        <path
          d="M -100 0 L -100 26 L -45 32 C -50 48 -25 58 -20 42 L 0 52 L 0 26"
          fill={leftSideFill}
        />
        {/* Right-facing extrusion */}
        <path
          d="M 0 26 L 0 52 L 25 38 C 30 25 50 25 55 40 L 100 16 L 100 -10 L 55 14 C 50 -1 30 -1 25 12 L 0 26"
          fill={rightSideFill}
        />

        {/* Top Face of Isometric Puzzle Piece */}
        <path
          d="
            M -100 0
            C -90 -10 -75 5 -65 -5
            C -60 -25 -40 -25 -35 -5
            L 0 -26
            C 10 -35 25 -20 35 -30
            C 40 -50 60 -50 65 -30
            L 100 -10
            L 55 14
            C 50 -1 30 -1 25 12
            L 0 26
            L -20 16
            C -25 2 -50 12 -45 22
            L -100 0
            Z
          "
          fill={topFill}
        />

        {/* Subtle highlight sheen across top face */}
        {!isGhost && (
          <path
            d="M -75 -4 L -35 -24"
            fill="none"
            stroke="var(--token-light)"
            strokeWidth={2.5}
          />
        )}
      </g>
    </AssetContainer>
  );
};
