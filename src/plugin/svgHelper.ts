import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ASSET_REGISTRY } from '../assets/registry';
import {
  ASSET_VIEWBOX_SIZE,
  AssetId,
  AssetSize,
  CanvasFormatId,
  ItemRole,
  PaletteId,
} from '../types/schema';
import { getPaletteConfig } from '../config/palettes';
import { getFormatSpec } from '../config/formats';
import { inlineCssTokens } from '../engine/exporter';
import { sortCanvasItems } from '../engine/isometric';
import {
  CANONICAL_COMPOSITIONS,
  CanonicalCompositionId,
  getCanonicalComposition,
  isFlatCanonicalComposition,
} from '../engine/canonicalCompositions';
import { IsometricTableBackground } from '../components/canvas/IsometricTableBackground';

export function renderAssetSvgString(
  assetId: AssetId,
  size: AssetSize = 'L',
  paletteId: PaletteId = 'lavender',
  role: ItemRole = 'foreground'
): string {
  const entry = ASSET_REGISTRY[assetId];
  if (!entry) throw new Error(`Unknown asset: ${assetId}`);

  const dims = ASSET_VIEWBOX_SIZE[size];
  const palette = getPaletteConfig(paletteId);

  // Directly render the asset component (which renders AssetContainer with exact viewBox 600x600 for L / 200x200 for S
  // and preserveAspectRatio="xMidYMid meet"), eliminating double-nested <svg> tags that break Figma import.
  const isGhost = role === 'ghost';
  const ghostOpacity = 1;

  let rawXml = renderToStaticMarkup(
    React.createElement(entry.Component, {
      size,
      role,
      opacity: isGhost ? ghostOpacity : undefined,
      width: dims.width,
      height: dims.height,
      preserveAspectRatio: 'xMidYMid meet',
    })
  );

  if (isGhost && !rawXml.includes('opacity=')) {
    rawXml = rawXml.replace(/^<svg\b/, `<svg opacity="${ghostOpacity}"`);
  }

  return inlineCssTokens(rawXml, palette.tokens);
}

export function renderCoverSvgString(
  compositionId: CanonicalCompositionId,
  format: CanvasFormatId = '1:1',
  paletteId?: PaletteId
): string {
  const comp = CANONICAL_COMPOSITIONS[compositionId];
  if (!comp) throw new Error(`Unknown composition: ${compositionId}`);

  const spec = getFormatSpec(format);
  const activePaletteId = paletteId ?? comp.recommendedPalette;
  const palette = getPaletteConfig(activePaletteId);
  const items = sortCanvasItems(getCanonicalComposition(compositionId, format));
  const isFlat = isFlatCanonicalComposition(compositionId);

  const rawXml = renderToStaticMarkup(
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: `0 0 ${spec.width} ${spec.height}`,
        width: spec.width,
        height: spec.height,
      },
      React.createElement(
        'defs',
        null,
        React.createElement(
          'clipPath',
          { id: `artboard-clip-${compositionId}` },
          React.createElement('rect', { width: spec.width, height: spec.height })
        )
      ),
      React.createElement('rect', { width: spec.width, height: spec.height, fill: 'var(--token-bg)' }),
      React.createElement(
        'g',
        { clipPath: `url(#artboard-clip-${compositionId})` },
        React.createElement(IsometricTableBackground, {
          width: spec.width,
          height: spec.height,
          format,
          paletteId: activePaletteId,
          isFlatBackground: isFlat,
          showGridStrokes: true,
          showLabel: false,
        })
      ),
      React.createElement(
        'g',
        { id: 'canvas-items-layer', clipPath: `url(#artboard-clip-${compositionId})` },
        items.map((item) => {
          const entry = ASSET_REGISTRY[item.assetId];
          if (!entry) return null;
          const center = item.size === 'L' ? 300 : 100;
          const visualY = item.y - (item.zHeight || 0);
          const scaleX = (item.flipX ? -1 : 1) * (item.scale || 1);
          const scaleY = item.scale || 1;
          const rotation = item.rotation || 0;
          const transform = `translate(${item.x}, ${visualY}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(-${center}, -${center})`;
          const isGhost = item.role === 'ghost';
          const effectiveOpacity = isGhost ? 1 : (item.opacity ?? 1);

          return React.createElement(
            'g',
            {
              key: item.uid,
              id: `canvas-item-${item.role}-${item.assetId}-${item.size}-${item.uid}`,
              transform,
              opacity: effectiveOpacity,
            },
            React.createElement(entry.Component, { size: item.size, role: item.role })
          );
        })
      )
    )
  );

  return inlineCssTokens(rawXml, palette.tokens);
}
