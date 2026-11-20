import React from 'react';
import { AssetContainer, type AssetProps } from '../primitives';

export const FolderAsset: React.FC<AssetProps> = ({
  size = 'L',
  role = 'foreground',
  ...props
}) => {
  const isGhost = role === 'ghost';
  const strokeColor = 'var(--token-secondary)';
  const strokeWidth = 3.5;

  const backFolderFill = isGhost ? 'var(--token-secondary)' : 'var(--token-primary)';
  const frontFolderFill = isGhost ? 'var(--token-secondary)' : 'var(--token-surface)';
  const paperFill = isGhost ? 'var(--token-secondary)' : 'var(--token-light)';
  const edgeFill = isGhost ? 'var(--token-secondary)' : 'var(--token-secondary)';
  const tabFill = isGhost ? 'var(--token-secondary)' : 'var(--token-accent)';

  return (
    <AssetContainer size={size} role={role} {...props}>
      {/* Ground drop shadow */}
      <path
        d="M -100 15 L 10 75 L 125 15 L 140 32 L 20 95 L -95 35 Z"
        fill="var(--token-secondary)"
        opacity={isGhost ? 0.15 : 0.9}
      />

      <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Back Cover of Folder with Raised File Tab */}
        <path
          d="
            M -110 -5
            L -110 -20
            L -60 -50
            L -10 -50
            L 0 -44
            L 90 8
            L 90 22
            L -5 75
            Z
          "
          fill={backFolderFill}
        />

        {/* Tab color highlight */}
        <path
          d="M -60 -50 L -10 -50 L 0 -44 L -48 -44 Z"
          fill={tabFill}
        />

        {/* Interior Document Sheets Peeking Out */}
        {/* Document 1 */}
        <path
          d="M -90 -12 L 0 -64 L 75 -20 L -15 32 Z"
          fill={paperFill}
        />
        {/* Document text lines */}
        {!isGhost && (
          <g stroke={strokeColor} strokeWidth={1.8} opacity={0.6}>
            <path d="M -70 -12 L -20 18" />
            <path d="M -50 -24 L 0 5" />
            <path d="M -30 -36 L 20 -7" />
          </g>
        )}

        {/* Folder Spine / Thickness Bottom Edge */}
        <path
          d="M -110 -5 L -5 55 L -5 70 L -110 10 Z"
          fill={edgeFill}
        />
        <path
          d="M -5 70 L 105 7 L 105 -5 L -5 55 Z"
          fill={edgeFill}
        />

        {/* Front Cover of Folder (Slightly lowered/open) */}
        <path
          d="
            M -110 5
            L -5 68
            L 105 5
            L 95 -18
            L -12 45
            L -100 -8
            Z
          "
          fill={frontFolderFill}
        />

        {/* Diagonal fold crease on front cover */}
        <path
          d="M -100 -8 L -12 45"
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
        />
      </g>
    </AssetContainer>
  );
};
