import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const HeadphonesAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const bandFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const cupFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const cushionFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const accentFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadows for left and right earcups */}
      <ellipse
        cx="-60"
        cy="45"
        rx="45"
        ry="22"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />
      <ellipse
        cx="65"
        cy="48"
        rx="45"
        ry="22"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Headband Under-arch (Shadow/Lining) */}
        <path
          d="M -75 -10 C -80 -95 80 -95 75 -10 L 60 -12 C 65 -78 -65 -78 -60 -12 Z"
          fill={cushionFill}
        />

        {/* Headband Main Top Arch */}
        <path
          d="M -78 -12 C -85 -105 85 -105 78 -12 L 68 -10 C 72 -88 -72 -88 -68 -10 Z"
          fill={bandFill}
        />

        {/* Left Earcup (Isometric Cylinder & Cushion) */}
        <g transform="translate(-75, 10)">
          {/* Cushion thickness */}
          <path
            d="M -30 -10 A 30 42 0 0 0 20 20 L 26 28 A 30 42 0 0 1 -24 -2 Z"
            fill={cushionFill}
          />
          {/* Outer Cup Body */}
          <ellipse
            cx="0"
            cy="10"
            rx="28"
            ry="40"
            transform="rotate(18 0 10)"
            fill={cupFill}
          />
          {/* Outer Cup Dome Center */}
          <ellipse
            cx="2"
            cy="10"
            rx="16"
            ry="24"
            transform="rotate(18 2 10)"
            fill={accentFill}
          />
          {/* Hinge connector */}
          <rect
            x="-5"
            y="-22"
            width="10"
            height="14"
            rx="3"
            fill={accentFill}
          />
        </g>

        {/* Right Earcup (Isometric Cylinder & Cushion) */}
        <g transform="translate(75, 12)">
          {/* Cushion thickness */}
          <path
            d="M -20 20 A 30 42 0 0 0 30 -10 L 24 -2 A 30 42 0 0 1 -26 28 Z"
            fill={cushionFill}
          />
          {/* Outer Cup Body */}
          <ellipse
            cx="0"
            cy="10"
            rx="28"
            ry="40"
            transform="rotate(-18 0 10)"
            fill={cupFill}
          />
          {/* Outer Cup Dome Center */}
          <ellipse
            cx="-2"
            cy="10"
            rx="16"
            ry="24"
            transform="rotate(-18 -2 10)"
            fill={accentFill}
          />
          {/* Hinge connector */}
          <rect
            x="-5"
            y="-22"
            width="10"
            height="14"
            rx="3"
            fill={accentFill}
          />
        </g>
      </g>
    </AssetContainer>
  );
};
