import React, { useCallback, useMemo, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { getFormatSpec } from '../../config/formats';
import { getPaletteConfig, getCssTokensStyle } from '../../config/palettes';
import {
  clientToSvgPoint,
  generateIsoGridLines,
  snapToIsoGrid,
  sortCanvasItems,
} from '../../engine/isometric';
import { CanvasItemView } from './CanvasItemView';
import { SelectionOverlay } from './SelectionOverlay';
import { CanvasItem } from '../../types/schema';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const IsometricCanvas: React.FC = () => {
  const {
    format,
    paletteId,
    items,
    selectedUid,
    viewport,
    snapToGrid,
    showGrid,
    gridStep,
    selectItem,
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    bringForward,
    sendBackward,
    setViewport,
    resetViewport,
  } = useCanvasStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportGroupRef = useRef<SVGGElement | null>(null);

  const formatSpec = useMemo(() => getFormatSpec(format), [format]);
  const paletteConfig = useMemo(() => getPaletteConfig(paletteId), [paletteId]);
  const sortedItems = useMemo(() => sortCanvasItems(items), [items]);
  const selectedItem = useMemo(() => items.find((it) => it.uid === selectedUid), [items, selectedUid]);

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    return generateIsoGridLines(formatSpec.width, formatSpec.height, gridStep);
  }, [showGrid, formatSpec.width, formatSpec.height, gridStep]);

  // Dragging item state
  const dragRef = useRef<{
    isDragging: boolean;
    uid: string | null;
    startPoint: { x: number; y: number };
    startItemPos: { x: number; y: number };
  }>({
    isDragging: false,
    uid: null,
    startPoint: { x: 0, y: 0 },
    startItemPos: { x: 0, y: 0 },
  });

  // Panning canvas state
  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  // Pointer Down on item
  const handleItemPointerDown = useCallback((item: CanvasItem, e: React.PointerEvent) => {
    if (!viewportGroupRef.current) return;
    const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
    dragRef.current = {
      isDragging: true,
      uid: item.uid,
      startPoint: pt,
      startItemPos: { x: item.x, y: item.y },
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);

  // Pointer Down on Canvas (pan or deselect)
  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current || (e.target as Element).id === 'canvas-bg-rect') {
      selectItem(null);
      panRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: viewport.panX,
        initialPanY: viewport.panY,
      };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
  };

  // Pointer Move (handles both item dragging and canvas panning)
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    // 1. Canvas Pan
    if (panRef.current.isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport({
        panX: Math.round(panRef.current.initialPanX + dx),
        panY: Math.round(panRef.current.initialPanY + dy),
      });
      return;
    }

    // 2. Item Drag
    if (dragRef.current.isDragging && dragRef.current.uid && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const dx = pt.x - dragRef.current.startPoint.x;
      const dy = pt.y - dragRef.current.startPoint.y;

      let targetX = dragRef.current.startItemPos.x + dx;
      let targetY = dragRef.current.startItemPos.y + dy;

      if (snapToGrid) {
        const snapped = snapToIsoGrid({ x: targetX, y: targetY }, gridStep);
        targetX = snapped.x;
        targetY = snapped.y;
      }

      updateItem(dragRef.current.uid, { x: Math.round(targetX), y: Math.round(targetY) }, false);
    }
  };

  // Pointer Up (commits final position to undo history)
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // pointer capture may already be released
      }
    }

    if (dragRef.current.isDragging && dragRef.current.uid) {
      const uid = dragRef.current.uid;
      const currentItem = items.find((it) => it.uid === uid);
      if (currentItem) {
        updateItem(uid, { x: currentItem.x, y: currentItem.y }, true);
      }
      dragRef.current.isDragging = false;
      dragRef.current.uid = null;
    }
  };

  // Pointer Cancel (symmetrically resets pointer dragging and panning state if interrupted)
  const handlePointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // pointer capture may already be released
      }
    }

    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      dragRef.current.uid = null;
    }
  };

  // Zoom towards cursor on wheel
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.max(0.3, Math.min(3.0, +(viewport.zoom * zoomFactor).toFixed(3)));

    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const newPanX = cursorX - (cursorX - viewport.panX) * (newZoom / viewport.zoom);
    const newPanY = cursorY - (cursorY - viewport.panY) * (newZoom / viewport.zoom);

    setViewport({
      panX: Math.round(newPanX),
      panY: Math.round(newPanY),
      zoom: newZoom,
    });
  };

  // Drop asset from AssetCatalog
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!viewportGroupRef.current) return;

    let payload: { assetId?: string; size?: 'L' | 'S'; role?: 'foreground' | 'ghost' } = {};
    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (raw) payload = JSON.parse(raw);
    } catch {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) payload = { assetId: raw as any };
    }

    if (!payload.assetId) return;

    const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
    const pos = snapToGrid ? snapToIsoGrid(pt, gridStep) : pt;

    addItem(
      payload.assetId as any,
      payload.size ?? 'L',
      payload.role ?? 'foreground',
      Math.round(pos.x),
      Math.round(pos.y)
    );
  };

  const cssTokensStyle = useMemo(
    () => getCssTokensStyle(paletteConfig.tokens) as React.CSSProperties,
    [paletteConfig.tokens]
  );

  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none bg-stone-200/90"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        id="isometric-canvas-svg"
        data-format-id={format}
        data-palette-id={paletteId}
        viewBox={`0 0 ${formatSpec.width} ${formatSpec.height}`}
        className="w-full h-full max-w-full max-h-full object-contain shadow-2xl ring-1 ring-stone-900/10 overflow-hidden rounded-xs cursor-default touch-none"
        style={{ ...cssTokensStyle, touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <defs>
          <clipPath id="canvas-artboard-clip">
            <rect width={formatSpec.width} height={formatSpec.height} />
          </clipPath>
        </defs>

        {/* Canvas Background Rect */}
        <rect
          id="canvas-bg-rect"
          width={formatSpec.width}
          height={formatSpec.height}
          fill="var(--token-bg)"
        />

        {/* Viewport Transform Group */}
        <g
          ref={viewportGroupRef}
          id="viewport-group"
          data-viewport-group="true"
          transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}
        >
          {/* 30° Isometric Grid Overlay */}
          {showGrid && (
            <g data-editor-only="true" pointerEvents="none" opacity="0.18">
              {gridLines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--token-secondary)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* Canvas Items in Hybrid Depth Sorted Order (clipped to artboard) */}
          <g id="canvas-items-layer" clipPath="url(#canvas-artboard-clip)">
            {sortedItems.map((item) => (
              <CanvasItemView
                key={item.uid}
                item={item}
                isSelected={selectedUid === item.uid}
                onSelect={(uid) => selectItem(uid)}
                onItemPointerDown={handleItemPointerDown}
              />
            ))}
          </g>

          {/* Active Selection Overlay */}
          {selectedItem && (
            <SelectionOverlay
              item={selectedItem}
              canvasWidth={formatSpec.width}
              onUpdate={updateItem}
              onRemove={removeItem}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
              onDuplicate={duplicateItem}
            />
          )}
        </g>
      </svg>

      {/* Floating Bottom Viewport Controls Badge */}
      <div className="absolute bottom-4 left-6 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 text-xs text-white/80 shadow-lg pointer-events-auto">
        <span className="font-mono text-[11px]">{formatSpec.shortLabel} ({formatSpec.width}×{formatSpec.height})</span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <button
          onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(0.3, +(v.zoom - 0.1).toFixed(2)) }))}
          className="hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
        <button
          onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(3.0, +(v.zoom + 0.1).toFixed(2)) }))}
          className="hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetViewport}
          className="hover:text-white transition-colors ml-1 p-0.5 rounded"
          title="Сбросить масштаб и положение"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
