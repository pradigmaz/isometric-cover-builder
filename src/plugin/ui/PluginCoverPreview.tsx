import React, { useMemo } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { getFormatSpec } from '../../config/formats';
import { getPaletteConfig, getCssTokensStyle } from '../../config/palettes';
import { generateIsoGridLines, sortCanvasItems } from '../../engine/isometric';
import { getAssetComponent, ASSET_REGISTRY } from '../../assets/registry';
import { IsometricTableBackground } from '../../components/canvas/IsometricTableBackground';
import { Sparkles } from 'lucide-react';

export const PluginCoverPreview: React.FC = () => {
  const format = useCanvasStore((state) => state.format);
  const paletteId = useCanvasStore((state) => state.paletteId);
  const items = useCanvasStore((state) => state.items);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const includeBackgrounds = useCanvasStore((state) => state.includeBackgrounds);

  const spec = useMemo(() => getFormatSpec(format), [format]);
  const paletteConfig = useMemo(() => getPaletteConfig(paletteId), [paletteId]);
  const visibleItems = useMemo(
    () => (includeBackgrounds ? items : items.filter((it) => it.role !== 'ghost')),
    [items, includeBackgrounds]
  );
  const sortedItems = useMemo(() => sortCanvasItems(visibleItems), [visibleItems]);

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    return generateIsoGridLines(spec.width, spec.height, 48);
  }, [showGrid, spec.width, spec.height]);

  const isFlatBackground = useMemo(() => {
    if (items.length === 2) {
      const hasPhone = items.some((i) => i.assetId === 'smartphone');
      const hasPuzzle = items.some((i) => i.assetId === 'puzzle');
      if (hasPhone && hasPuzzle) return true;
    }
    return items.some((i) => i.uid.includes('phone-puzzles'));
  }, [items]);

  const cssTokensStyle = useMemo(
    () => getCssTokensStyle(paletteConfig.tokens) as React.CSSProperties,
    [paletteConfig.tokens]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        id="isometric-canvas-svg"
        data-format-id={format}
        data-palette-id={paletteId}
        viewBox={`0 0 ${spec.width} ${spec.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full max-h-full object-contain rounded-xs shadow-md transition-all duration-300"
        style={{
          ...cssTokensStyle,
          aspectRatio: `${spec.width} / ${spec.height}`,
        }}
      >
        <defs>
          <clipPath id="plugin-preview-artboard-clip">
            <rect width={spec.width} height={spec.height} />
          </clipPath>
        </defs>

        {/* Artboard background rect with active palette tokens */}
        <rect
          id="canvas-bg-rect"
          width={spec.width}
          height={spec.height}
          fill="var(--token-bg)"
        />

        {/* 30° Dual-Tone Isometric Desk Surface & Wall Background under clipPath */}
        <g clipPath="url(#plugin-preview-artboard-clip)">
          <IsometricTableBackground
            width={spec.width}
            height={spec.height}
            format={format}
            paletteId={paletteId}
            isFlatBackground={isFlatBackground}
            showGridStrokes={true}
            showLabel={false}
          />
        </g>

        {/* 30° Isometric Grid Overlay (light opacity 0.2, stripped during clean SVG export) */}
        {showGrid && (
          <g
            data-editor-only="true"
            pointerEvents="none"
            opacity="0.2"
            clipPath="url(#plugin-preview-artboard-clip)"
          >
            {gridLines.map((line, idx) => (
              <line
                key={idx}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="var(--token-secondary)"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )}

        {/* Scene Items in Depth-Sorted Order */}
        <g id="canvas-items-layer" clipPath="url(#plugin-preview-artboard-clip)">
          {sortedItems.map((item) => {
            if (!ASSET_REGISTRY[item.assetId]) return null;
            const AssetComponent = getAssetComponent(item.assetId);
            const center = item.size === 'L' ? 300 : 100;
            const visualY = item.y - (item.zHeight || 0);
            const scaleX = (item.flipX ? -1 : 1) * (item.scale || 1);
            const scaleY = item.scale || 1;
            const rotation = item.rotation || 0;

            const transform = `translate(${item.x}, ${visualY}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(-${center}, -${center})`;
            const isGhost = item.role === 'ghost';
            const effectiveOpacity = isGhost ? 1 : (item.opacity ?? 1);

            return (
              <g
                key={item.uid}
                id={`canvas-item-${item.role}-${item.assetId}-${item.size}-${item.uid}`}
                data-uid={item.uid}
                data-role={item.role}
                data-asset-id={item.assetId}
                data-size={item.size}
                transform={transform}
                opacity={effectiveOpacity}
              >
                <AssetComponent size={item.size} role={item.role} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty Placeholder */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none bg-stone-950/40 backdrop-blur-2xs">
          <div className="w-10 h-10 rounded-full bg-stone-800/90 border border-stone-700/80 flex items-center justify-center text-[#0d99ff] mb-2 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-stone-200">Холст пуст</div>
          <div className="text-[10px] text-stone-400 mt-1 max-w-[200px] leading-tight">
            Выберите готовый пресет выше
          </div>
        </div>
      )}
    </div>
  );
};
