import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const LampAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const baseTopFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const baseLeftFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const baseRightFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const stemFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const headTopFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const headSideFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const interiorFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const bulbFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow from base */}
      <path
        d="M -30 65 L 45 108 L 105 74 L 30 31 Z"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Lamp Base: 3D Isometric Box (centered near bottom-left) */}
        {/* Base left thickness */}
        <path
          d="M -75 40 L -15 75 L -15 90 L -75 55 Z"
          fill={baseLeftFill}
        />
        {/* Base right thickness */}
        <path
          d="M -15 75 L 45 40 L 45 55 L -15 90 Z"
          fill={baseRightFill}
        />
        {/* Base top surface */}
        <path
          d="M -75 40 L -15 5 L 45 40 L -15 75 Z"
          fill={baseTopFill}
        />

        {/* Stem Mount Socket on Base */}
        <ellipse
          cx="-15"
          cy="40"
          rx="12"
          ry="6"
          fill={stemFill}
        />

        {/* Vertical & Angled Arm / Stem */}
        <path
          d="M -15 40 L -15 -50 L 25 -85"
          fill="none"
          stroke={stemFill}
          strokeWidth={7}
        />
        {/* Elbow / Joint Pivot */}
        <circle
          cx="-15"
          cy="-50"
          r="7"
          fill={interiorFill}
        />

        {/* Lamp Shade / Head (Angled downwards to the left) */}
        {/* Head Top Face */}
        <path
          d="M 25 -85 L 60 -115 L 0 -100 L -35 -70 Z"
          fill={headTopFill}
        />
        {/* Head Outer Side Wall */}
        <path
          d="M 60 -115 L 25 -85 L 0 -35 L 35 -65 Z"
          fill={headSideFill}
        />
        {/* Head Front Interior Opening (Facing Left-Down) */}
        <path
          d="M -35 -70 L 0 -100 L 0 -35 L -35 -5 Z"
          fill={interiorFill}
        />

        {/* Light Bulb inside head aperture */}
        <ellipse
          cx="-12"
          cy="-55"
          rx="12"
          ry="14"
          fill={bulbFill}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {/* Light beam / glow accent lines */}
        {!isGhost && (
          <path
            d="M -45 -10 L -65 15"
            stroke="var(--token-accent)"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            fill="none"
          />
        )}
      </g>
    </AssetContainer>
  );
};
