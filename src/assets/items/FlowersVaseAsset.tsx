import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const FlowersVaseAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const vaseFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const vaseShadowFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const stemFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const blossomAccent = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';
  const blossomPrimary = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const blossomSurface = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <ellipse
        cx="35"
        cy="75"
        rx="55"
        ry="28"
        transform="rotate(15 35 75)"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Flower Stems */}
        <path d="M 0 10 L -45 -55" stroke={stemFill} strokeWidth={3} fill="none" />
        <path d="M 0 10 L -20 -80" stroke={stemFill} strokeWidth={3} fill="none" />
        <path d="M 0 10 L 0 -95" stroke={stemFill} strokeWidth={3} fill="none" />
        <path d="M 0 10 L 25 -75" stroke={stemFill} strokeWidth={3} fill="none" />
        <path d="M 0 10 L 48 -50" stroke={stemFill} strokeWidth={3} fill="none" />

        {/* Leaves */}
        <path
          d="M -10 -5 C -25 -25 -30 -40 -25 -50 C -15 -40 -12 -25 -5 -10 Z"
          fill={vaseShadowFill}
        />
        <path
          d="M 10 -5 C 25 -25 32 -38 28 -48 C 18 -38 14 -22 6 -10 Z"
          fill={vaseShadowFill}
        />

        {/* Tulip Blossoms (5 flowers) */}
        {/* Blossom 1 (Far Left, pink/accent) */}
        <g transform="translate(-48, -62)">
          <path
            d="M 0 15 C -15 0 -18 -20 -5 -30 C 5 -18 15 -18 18 -10 C 18 5 12 12 0 15 Z"
            fill={blossomAccent}
          />
          <path d="M -5 -30 C -2 -15 2 0 0 15" fill="none" stroke={strokeColor} strokeWidth={2} />
        </g>

        {/* Blossom 2 (Mid Left, primary/cyan-blue) */}
        <g transform="translate(-20, -88)">
          <path
            d="M 0 18 C -14 2 -16 -22 -4 -32 C 8 -20 18 -20 20 -10 C 20 8 14 15 0 18 Z"
            fill={blossomPrimary}
          />
          <path d="M -4 -32 C -2 -16 2 2 0 18" fill="none" stroke={strokeColor} strokeWidth={2} />
        </g>

        {/* Blossom 3 (Center Top, surface/cream) */}
        <g transform="translate(0, -102)">
          <path
            d="M 0 18 C -15 2 -15 -24 0 -34 C 15 -24 15 2 0 18 Z"
            fill={blossomSurface}
          />
          <path d="M 0 -34 L 0 18" fill="none" stroke={strokeColor} strokeWidth={2} />
        </g>

        {/* Blossom 4 (Mid Right, primary/blue) */}
        <g transform="translate(26, -82)">
          <path
            d="M 0 18 C -14 4 -16 -18 -4 -28 C 8 -18 16 -18 18 -8 C 18 6 12 14 0 18 Z"
            fill={blossomPrimary}
          />
          <path d="M -4 -28 C -1 -14 2 2 0 18" fill="none" stroke={strokeColor} strokeWidth={2} />
        </g>

        {/* Blossom 5 (Far Right, accent/pink) */}
        <g transform="translate(50, -58)">
          <path
            d="M 0 16 C -12 2 -15 -18 -2 -26 C 8 -16 16 -16 18 -6 C 18 6 10 12 0 16 Z"
            fill={blossomAccent}
          />
          <path d="M -2 -26 C 0 -12 2 2 0 16" fill="none" stroke={strokeColor} strokeWidth={2} />
        </g>

        {/* Ceramic Vase Body */}
        {/* Shaded right/back side of vase */}
        <path
          d="
            M 0 10
            C 18 10 20 30 35 48
            C 48 64 38 78 0 78
            C -38 78 -48 64 -35 48
            C -20 30 -18 10 0 10
            Z
          "
          fill={vaseShadowFill}
        />
        {/* Illuminated front curve of vase */}
        <path
          d="
            M 0 10
            C 15 10 16 30 28 46
            C 38 60 25 78 0 78
            C -25 78 -38 60 -28 46
            C -16 30 -15 10 0 10
            Z
          "
          fill={vaseFill}
        />

        {/* Vase Neck & Rim Ellipse */}
        <ellipse
          cx="0"
          cy="10"
          rx="18"
          ry="9"
          fill={vaseFill}
        />
        <ellipse
          cx="0"
          cy="10"
          rx="12"
          ry="6"
          fill={isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)'}
          opacity={isGhost ? 1 : 0.8}
        />
      </g>
    </AssetContainer>
  );
};
