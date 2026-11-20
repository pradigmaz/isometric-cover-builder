import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const NotepadAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const coverFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const coverEdge = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const pageFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const pageShadow = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const ribbonFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <path
        d="M -110 20 L 0 85 L 120 25 L 135 45 L 0 105 L -120 38 Z"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Hardcover Binding Base & Thickness */}
        {/* Left cover spine/edge */}
        <path
          d="M -115 15 L 0 72 L 0 88 L -115 32 Z"
          fill={coverEdge}
        />
        {/* Right cover edge */}
        <path
          d="M 0 72 L 115 15 L 115 32 L 0 88 Z"
          fill={coverEdge}
        />

        {/* Outer Hardcover flaps extending beyond pages */}
        <path
          d="M -115 15 L 0 72 L 115 15 L 105 -35 L 0 15 L -105 -35 Z"
          fill={coverFill}
        />

        {/* Page Block Thickness Edges (Left block & Right block) */}
        <path
          d="M -105 10 L -10 60 L -10 70 L -105 20 Z"
          fill={pageShadow}
        />
        <path
          d="M 10 60 L 105 10 L 105 20 L 10 70 Z"
          fill={pageShadow}
        />

        {/* Left Curved Open Page */}
        <path
          d="
            M -5 18
            C -40 2 -80 -10 -105 -30
            L -105 10
            C -75 25 -35 40 -5 60
            Z
          "
          fill={pageFill}
        />

        {/* Right Curved Open Page */}
        <path
          d="
            M 5 18
            C 40 2 80 -10 105 -30
            L 105 10
            C 75 25 35 40 5 60
            Z
          "
          fill={pageFill}
        />

        {/* Center Spine Crease */}
        <path d="M 0 18 L 0 65" stroke={coverEdge} strokeWidth={3} fill="none" />

        {/* Subtle Text Lines on Left Page */}
        {!isGhost && (
          <g stroke={strokeColor} strokeWidth={1.8} opacity={0.6}>
            <path d="M -85 -10 C -65 0 -45 10 -25 22" fill="none" />
            <path d="M -85 2 C -65 12 -45 22 -25 34" fill="none" />
            <path d="M -85 14 C -65 24 -45 34 -25 46" fill="none" />
          </g>
        )}

        {/* Subtle Text Lines on Right Page */}
        {!isGhost && (
          <g stroke={strokeColor} strokeWidth={1.8} opacity={0.6}>
            <path d="M 25 22 C 45 10 65 0 85 -10" fill="none" />
            <path d="M 25 34 C 45 22 65 12 85 2" fill="none" />
            <path d="M 25 46 C 45 34 65 24 85 14" fill="none" />
          </g>
        )}

        {/* Bookmark Ribbon Hanging Down Right */}
        <path
          d="
            M 0 60
            C 5 75 15 85 28 85
            C 38 85 45 92 48 105
            L 58 100
            L 55 88
            C 45 78 30 75 20 62
            Z
          "
          fill={ribbonFill}
        />
        {/* Ribbon Fishtail Notch */}
        <path
          d="M 48 105 L 53 98 L 58 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
        />
      </g>
    </AssetContainer>
  );
};
