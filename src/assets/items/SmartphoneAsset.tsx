import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const SmartphoneAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const bodyFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const edgeFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const screenFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const accentFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const surfaceFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <ellipse
        cx="45"
        cy="40"
        rx="145"
        ry="65"
        transform="rotate(-15 45 40)"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Phone 3D side edge (thickness) */}
        <path
          d="M -135 -30 L -135 -14 L -40 45 L 85 -25 L 85 -41"
          fill={edgeFill}
        />
        <path
          d="M -40 45 L -40 61 L 85 -9 L 85 -25"
          fill={edgeFill}
        />

        {/* Outer Phone Case / Chassis */}
        <path
          d="M -130 -35 C -140 -28 -140 -20 -130 -14 L -45 38 C -40 41 -30 41 -25 38 L 85 -28 C 95 -34 95 -42 85 -48 L 0 -100 C -10 -105 -20 -105 -25 -100 Z"
          fill={bodyFill}
        />

        {/* Screen Bezel / Inset Glass */}
        <path
          d="M -118 -32 L -38 16 C -34 18 -26 18 -22 16 L 75 -42 L -5 -90 Z"
          fill={screenFill}
        />

        {/* Camera notch / dynamic island at top of screen */}
        <path
          d="M -8 -85 L 8 -76"
          stroke={edgeFill}
          strokeWidth={4}
        />

        {/* UI Graphic / Puzzle icon on phone screen */}
        <g stroke={strokeColor} strokeWidth={2}>
          <path
            d="M -60 -25 L -25 -5 L 0 -20 L -35 -40 Z"
            fill={surfaceFill}
          />
          <path
            d="M -45 -18 C -40 -25 -30 -25 -25 -18 L -5 -30 C -2 -35 -2 -42 -7 -45 L -20 -38 L -45 -18 Z"
            fill={accentFill}
          />
          {/* Subtle UI lines */}
          <path d="M -75 -15 L -40 5" stroke={strokeColor} strokeWidth={2} fill="none" />
          <path d="M 15 -52 L 45 -34" stroke={strokeColor} strokeWidth={2} fill="none" />
          <path d="M 25 -42 L 55 -24" stroke={strokeColor} strokeWidth={2} fill="none" />
        </g>
      </g>
    </AssetContainer>
  );
};
