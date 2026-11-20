import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const WalletAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const bodyFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const flapFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const billFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const accentFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const edgeFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <ellipse
        cx="40"
        cy="45"
        rx="135"
        ry="55"
        transform="rotate(-8 40 45)"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Under layer / shadow thickness */}
        <path
          d="M -110 -10 L 0 50 L 110 0 L 110 22 L 0 72 L -110 12 Z"
          fill={edgeFill}
        />

        {/* Exposed bills / cards inside wallet */}
        <path
          d="M -90 -25 L 10 32 L 95 -12 L 5 -65 Z"
          fill={billFill}
          strokeWidth={strokeWidth}
        />
        <path
          d="M -75 -20 L 15 30"
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
        />

        {/* Main top body of folded wallet */}
        <path
          d="M -110 -10 C -110 -15 -105 -22 -95 -20 L 0 35 L 95 -15 C 105 -20 110 -15 110 -10 L 0 50 Z"
          fill={bodyFill}
        />

        {/* Lower flap / folded edge */}
        <path
          d="M -110 12 C -115 5 -115 -5 -110 -10 L 0 50 L 0 72 C -5 74 -10 72 -15 67 Z"
          fill={flapFill}
        />

        {/* Front cover face with rounded corner */}
        <path
          d="M -110 12 L 0 72 L 105 18 C 115 12 115 4 105 -2 L 0 50 L -105 -4 C -112 -1 -115 5 -110 12 Z"
          fill={bodyFill}
        />

        {/* Closure strap extending across */}
        <path
          d="M 25 38 L 85 8 C 96 2 100 8 96 15 L 42 47 C 36 50 30 48 25 38 Z"
          fill={flapFill}
        />

        {/* Snap button on strap */}
        <ellipse
          cx="80"
          cy="16"
          rx="7"
          ry="5"
          fill={accentFill}
        />
        <ellipse
          cx="80"
          cy="16"
          rx="3"
          ry="2"
          fill={isGhost ? 'var(--token-secondary)' : 'var(--token-light)'}
        />
      </g>
    </AssetContainer>
  );
};
