import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const CoinAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const topFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const rimFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const sideFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const innerFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <ellipse
        cx="35"
        cy="25"
        rx="90"
        ry="42"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* 3D Extruded Cylinder Rim (depth 18px) */}
        <path
          d="M -75 0 A 75 38 0 0 0 75 0 L 75 18 A 75 38 0 0 1 -75 18 Z"
          fill={sideFill}
        />

        {/* Top Face of Coin (Outer Ellipse) */}
        <ellipse
          cx="0"
          cy="0"
          rx="75"
          ry="38"
          fill={topFill}
        />

        {/* Inner Coin Rim / Groove */}
        <ellipse
          cx="0"
          cy="0"
          rx="60"
          ry="30"
          fill={innerFill}
        />

        {/* Inner Coin Center Inset */}
        <ellipse
          cx="0"
          cy="0"
          rx="45"
          ry="22"
          fill={rimFill}
        />

        {/* Center Star / Coin Emblem */}
        <path
          d="
            M 0 -12
            L 4 -4
            L 14 0
            L 4 4
            L 0 12
            L -4 4
            L -14 0
            L -4 -4
            Z
          "
          fill={accentFill(isGhost)}
        />
      </g>
    </AssetContainer>
  );
};

function accentFill(isGhost: boolean): string {
  return isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
}
