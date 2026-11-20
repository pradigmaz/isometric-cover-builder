import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const PenAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const barrelTop = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const barrelSide = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const clipFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const tipFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const gripFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow along the diagonal pen */}
      <path
        d="M -70 42 L 65 -35 L 75 -28 L -60 50 Z"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Pen Tip Cone / Nib */}
        <path
          d="M -90 45 L -75 30 L -65 48 Z"
          fill={tipFill}
        />
        {/* Metal nib point */}
        <circle cx="-88" cy="44" r="2.5" fill={clipFill} />

        {/* Grip Section */}
        <path
          d="M -75 30 L -50 15 L -40 33 L -65 48 Z"
          fill={gripFill}
        />
        {/* Grip Rings */}
        <path d="M -70 33 L -60 45" stroke={strokeColor} strokeWidth={2} fill="none" />
        <path d="M -60 27 L -50 39" stroke={strokeColor} strokeWidth={2} fill="none" />

        {/* Main Barrel Top Half (Illuminated) */}
        <path
          d="M -50 15 L 45 -40 L 55 -28 L -40 33 Z"
          fill={barrelTop}
        />

        {/* Main Barrel Bottom/Side Half (Shadow) */}
        <path
          d="M -40 33 L 55 -28 L 50 -20 L -45 40 Z"
          fill={barrelSide}
        />

        {/* End Cap / Finial */}
        <path
          d="M 45 -40 L 65 -52 L 72 -42 L 55 -28 Z"
          fill={gripFill}
        />

        {/* Metallic Clip extending along barrel */}
        <path
          d="M 52 -40 L 15 -18 L 18 -12 L 55 -34 Z"
          fill={clipFill}
        />
        {/* Clip Ball Accent */}
        <circle cx="16" cy="-15" r="4" fill={clipFill} />
      </g>
    </AssetContainer>
  );
};
