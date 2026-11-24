import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { SelectionOverlay, ResizeHandle } from './SelectionOverlay';
import { FloatingActionToolbar } from './FloatingActionToolbar';
import { IsometricTableBackground } from './IsometricTableBackground';
import { getAssetVisualBounds } from '../../assets/registry';
import { CanvasItem } from '../../types/schema';
import { clampItemPosition, clampItemScale } from './canvasBoundaryClamping';
import { CanvasViewportControls } from './CanvasViewportControls';
import { isFlatCanonicalComposition } from '../../engine/canonicalCompositions';
import {
  INITIAL_MARQUEE_STATE,
  MarqueeState,
  getMarqueeIntersectingUids,
  getMarqueeRect,
} from './canvasMarquee';

export { clampItemPosition, clampItemScale } from './canvasBoundaryClamping';

export interface IsometricCanvasProps {
  isModalOpen?: boolean;
}

export const IsometricCanvas: React.FC<IsometricCanvasProps> = ({ isModalOpen = false }) => {
  const {
    format, paletteId, items, selectedUids = [], viewport, snapToGrid, showGrid, gridStep,
    includeBackgrounds, selectItem, selectGroup, addItem, updateItem, removeItem, duplicateItem,
    bringForward, sendBackward, setViewport, resetViewport,
  } = useCanvasStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportGroupRef = useRef<SVGGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const formatSpec = useMemo(() => getFormatSpec(format), [format]);
  const paletteConfig = useMemo(() => getPaletteConfig(paletteId), [paletteId]);
  const visibleItems = useMemo(
    () => (includeBackgrounds ? items : items.filter((it) => it.uid?.startsWith('canonical-') || it.role !== 'ghost')),
    [items, includeBackgrounds]
  );
  const sortedItems = useMemo(() => sortCanvasItems(visibleItems), [visibleItems]);
  const selectedItems = useMemo(
    () => items.filter((it) => selectedUids.includes(it.uid) && (includeBackgrounds || it.uid?.startsWith('canonical-') || it.role !== 'ghost')),
    [items, selectedUids, includeBackgrounds]
  );
  const selectedItem = selectedItems[0];

  const isFlatBackground = useMemo(() => {
    if (items.some((i) => i.uid.includes('phone-puzzles'))) return isFlatCanonicalComposition('phone-puzzles');
    return items.length === 2 && items.some((i) => i.assetId === 'smartphone') && items.some((i) => i.assetId === 'puzzle') && isFlatCanonicalComposition(1);
  }, [items]);

  const gridLines = useMemo(() => (!showGrid ? [] : generateIsoGridLines(formatSpec.width, formatSpec.height, gridStep)), [showGrid, formatSpec.width, formatSpec.height, gridStep]);

  const dragRef = useRef({
    isDragging: false,
    hasMoved: false,
    uid: null as string | null,
    isMulti: false,
    startPoint: { x: 0, y: 0 },
    startPositions: {} as Record<string, { x: number; y: number }>,
  });
  const resizeRef = useRef({ isResizing: false, uid: null as string | null, startDist: 1, startScale: 1, center: { x: 0, y: 0 } });
  const panRef = useRef({ isPanning: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });
  const [marqueeState, setMarqueeState] = useState<MarqueeState>(INITIAL_MARQUEE_STATE);

  const handleItemPointerDown = useCallback((item: CanvasItem, e: React.PointerEvent) => {
    if (!viewportGroupRef.current) return;
    const isMulti = e.shiftKey || e.metaKey || e.ctrlKey;
    const currentUids = useCanvasStore.getState().selectedUids;
    let activeUids: string[];
    if (isMulti) {
      activeUids = currentUids.includes(item.uid) ? currentUids.filter((id) => id !== item.uid) : [...currentUids, item.uid];
      selectGroup(activeUids);
    } else if (!currentUids.includes(item.uid)) {
      activeUids = [item.uid];
      selectItem(item.uid);
    } else {
      activeUids = currentUids;
    }

    const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
    const startPositions: Record<string, { x: number; y: number }> = {};
    items.forEach((it) => {
      if (activeUids.includes(it.uid)) startPositions[it.uid] = { x: it.x, y: it.y };
    });

    dragRef.current = { isDragging: true, hasMoved: false, uid: item.uid, isMulti, startPoint: pt, startPositions };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [items, selectGroup, selectItem]);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, _handle: ResizeHandle) => {
      if (!viewportGroupRef.current || !selectedItem) return;
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const bounds = getAssetVisualBounds(selectedItem.assetId, selectedItem.size);
      const startScale = selectedItem.scale || 1;
      const visualY = selectedItem.y - (selectedItem.zHeight || 0) + bounds.offsetY * startScale;
      const center = { x: selectedItem.x, y: visualY };
      const startDist = Math.hypot(pt.x - center.x, pt.y - center.y) || 1;
      resizeRef.current = { isResizing: true, uid: selectedItem.uid, startDist, startScale, center };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [selectedItem]
  );

  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element | null;
    const isBg = target === svgRef.current || target?.id === 'canvas-bg-rect' || target?.closest('#canvas-desk-bg') || target?.closest('#isometric-table-background');
    if (!isBg) return;

    if (e.button === 1 || e.altKey) {
      panRef.current = { isPanning: true, startX: e.clientX, startY: e.clientY, initialPanX: viewport.panX, initialPanY: viewport.panY };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const isAdditive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (!isAdditive) selectItem(null);
      setMarqueeState({ isSelecting: true, isAdditive, initialUids: isAdditive ? useCanvasStore.getState().selectedUids : [], startPt: pt, currentPt: pt });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (resizeRef.current.isResizing && resizeRef.current.uid && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const currDist = Math.hypot(pt.x - resizeRef.current.center.x, pt.y - resizeRef.current.center.y);
      let scale = Math.max(0.3, Math.min(3.5, +(resizeRef.current.startScale * (currDist / resizeRef.current.startDist)).toFixed(2)));
      const item = items.find((it) => it.uid === resizeRef.current.uid);
      if (item) scale = clampItemScale(item, scale, formatSpec.width, formatSpec.height);
      updateItem(resizeRef.current.uid, { scale }, false);
      return;
    }

    if (panRef.current.isPanning) {
      setViewport({ panX: Math.round(panRef.current.initialPanX + e.clientX - panRef.current.startX), panY: Math.round(panRef.current.initialPanY + e.clientY - panRef.current.startY) });
      return;
    }

    if (dragRef.current.isDragging && dragRef.current.uid && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const dx = pt.x - dragRef.current.startPoint.x;
      const dy = pt.y - dragRef.current.startPoint.y;
      if (Math.hypot(dx, dy) > 2) dragRef.current.hasMoved = true;

      let effDx = dx;
      let effDy = dy;
      const primaryItem = items.find((it) => it.uid === dragRef.current.uid);
      if (snapToGrid && primaryItem && dragRef.current.startPositions[primaryItem.uid]) {
        const startPos = dragRef.current.startPositions[primaryItem.uid];
        const bounds = getAssetVisualBounds(primaryItem.assetId, primaryItem.size);
        const baseOffsetY = (bounds.offsetY + bounds.height / 2) * (primaryItem.scale || 1);
        const snapped = snapToIsoGrid({ x: startPos.x + dx, y: startPos.y + dy + baseOffsetY }, gridStep);
        effDx = snapped.x - startPos.x;
        effDy = (snapped.y - baseOffsetY) - startPos.y;
      }

      const updated = items.map((it) => {
        const startPos = dragRef.current.startPositions[it.uid];
        if (!startPos) return it;
        const clamped = clampItemPosition(it, startPos.x + effDx, startPos.y + effDy, formatSpec.width, formatSpec.height);
        return { ...it, x: Math.round(clamped.x), y: Math.round(clamped.y) };
      });
      useCanvasStore.setState({ items: updated });
      return;
    }

    if (marqueeState.isSelecting && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      setMarqueeState((prev) => ({ ...prev, currentPt: pt }));
      const hitUids = getMarqueeIntersectingUids(visibleItems, marqueeState.startPt, pt);
      selectGroup(marqueeState.isAdditive ? Array.from(new Set([...marqueeState.initialUids, ...hitUids])) : hitUids);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (marqueeState.isSelecting) {
      setMarqueeState((prev) => ({ ...prev, isSelecting: false }));
      try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    }
    if (resizeRef.current.isResizing && resizeRef.current.uid) {
      const uid = resizeRef.current.uid;
      const cur = items.find((it) => it.uid === uid);
      if (cur?.scale !== undefined) updateItem(uid, { scale: cur.scale }, true);
      resizeRef.current = { isResizing: false, uid: null, startDist: 1, startScale: 1, center: { x: 0, y: 0 } };
    }
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    }
    if (dragRef.current.isDragging) {
      if (!dragRef.current.hasMoved && !dragRef.current.isMulti && selectedUids.length > 1 && dragRef.current.uid) {
        selectItem(dragRef.current.uid);
      }
      if (dragRef.current.hasMoved && dragRef.current.uid) {
        const cur = items.find((it) => it.uid === dragRef.current.uid);
        if (cur) updateItem(cur.uid, { x: cur.x, y: cur.y }, true);
      }
      dragRef.current = { isDragging: false, hasMoved: false, uid: null, isMulti: false, startPoint: { x: 0, y: 0 }, startPositions: {} };
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    setMarqueeState(INITIAL_MARQUEE_STATE);
    resizeRef.current = { isResizing: false, uid: null, startDist: 1, startScale: 1, center: { x: 0, y: 0 } };
    dragRef.current = { isDragging: false, hasMoved: false, uid: null, isMulti: false, startPoint: { x: 0, y: 0 }, startPositions: {} };
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.max(0.3, Math.min(3.0, +(viewport.zoom * zoomFactor).toFixed(3)));
    const svgPt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
    const newPanX = svgPt.x - (svgPt.x - viewport.panX) * (newZoom / viewport.zoom);
    const newPanY = svgPt.y - (svgPt.y - viewport.panY) * (newZoom / viewport.zoom);
    setViewport({ panX: Math.round(newPanX), panY: Math.round(newPanY), zoom: newZoom });
  };

  const handleBadgeZoom = (delta: number) => {
    const newZoom = Math.max(0.3, Math.min(3.0, +(viewport.zoom + delta).toFixed(2)));
    const cx = formatSpec.width / 2, cy = formatSpec.height / 2;
    setViewport({ panX: Math.round(cx - (cx - viewport.panX) * (newZoom / viewport.zoom)), panY: Math.round(cy - (cy - viewport.panY) * (newZoom / viewport.zoom)), zoom: newZoom });
  };

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
      payload = { assetId: e.dataTransfer.getData('text/plain') as any };
    }
    if (!payload.assetId) return;

    const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
    let pos = pt;
    if (snapToGrid) {
      const bounds = getAssetVisualBounds(payload.assetId as any, payload.size ?? 'L');
      const baseOffsetY = bounds.offsetY + bounds.height / 2;
      const snapped = snapToIsoGrid({ x: pt.x, y: pt.y + baseOffsetY }, gridStep);
      pos = { x: snapped.x, y: snapped.y - baseOffsetY };
    }
    const clamped = clampItemPosition({ assetId: payload.assetId as any, size: payload.size ?? 'L' }, pos.x, pos.y, formatSpec.width, formatSpec.height);
    addItem(payload.assetId as any, payload.size ?? 'L', payload.role ?? 'foreground', clamped.x, clamped.y);
  };

  const cssTokensStyle = useMemo(() => getCssTokensStyle(paletteConfig.tokens) as React.CSSProperties, [paletteConfig.tokens]);
  const marqueeRect = useMemo(() => getMarqueeRect(marqueeState.startPt, marqueeState.currentPt), [marqueeState.startPt, marqueeState.currentPt]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-stone-200/90 dark:bg-zinc-900 ${
        format === '9:16' ? 'p-2 sm:p-3 md:p-4' : 'p-4 sm:p-6 lg:p-8'
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        id="isometric-canvas-svg"
        data-format-id={format}
        data-palette-id={paletteId}
        viewBox={`0 0 ${formatSpec.width} ${formatSpec.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-full max-h-full object-contain shadow-2xl ring-1 ring-stone-900/10 dark:ring-white/10 overflow-hidden rounded-xs cursor-default touch-none"
        style={{
          ...cssTokensStyle,
          touchAction: 'none',
          aspectRatio: `${formatSpec.width} / ${formatSpec.height}`,
        }}
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

        <g
          ref={viewportGroupRef}
          id="viewport-group"
          data-viewport-group="true"
          transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}
        >
          <rect id="canvas-bg-rect" width={formatSpec.width} height={formatSpec.height} fill="var(--token-bg)" />

          <g id="canvas-desk-bg" clipPath="url(#canvas-artboard-clip)">
            <IsometricTableBackground
              width={formatSpec.width}
              height={formatSpec.height}
              format={format}
              paletteId={paletteId}
              isFlatBackground={isFlatBackground}
            />
          </g>

          {showGrid && (
            <g data-editor-only="true" pointerEvents="none" opacity="0.38" clipPath="url(#canvas-artboard-clip)">
              {gridLines.map((line, idx) => (
                <line key={idx} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--token-secondary)" strokeWidth="1.25" strokeDasharray="4 4" />
              ))}
            </g>
          )}

          <g id="canvas-items-layer" clipPath="url(#canvas-artboard-clip)">
            {sortedItems.map((item) => (
              <CanvasItemView
                key={item.uid}
                item={item}
                isSelected={selectedUids.includes(item.uid)}
                isDragging={
                  (dragRef.current.isDragging && !!dragRef.current.startPositions[item.uid]) ||
                  (resizeRef.current.isResizing && resizeRef.current.uid === item.uid)
                }
                onSelect={(uid) => selectItem(uid)}
                onItemPointerDown={handleItemPointerDown}
              />
            ))}
          </g>

          {selectedItems.map((item) => (
            <SelectionOverlay
              key={item.uid}
              item={item}
              zoom={viewport.zoom}
              canvasWidth={formatSpec.width}
              onResizeStart={handleResizeStart}
            />
          ))}

          {marqueeState.isSelecting && (
            <rect
              id="canvas-marquee-box"
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="var(--token-primary, #AA9BF0)"
              fillOpacity={0.15}
              stroke="var(--token-primary, #8571D9)"
              strokeWidth={1.5 / viewport.zoom}
              strokeDasharray={`${5 / viewport.zoom} ${3 / viewport.zoom}`}
              rx={3 / viewport.zoom}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {selectedItem && !isModalOpen && (
        <FloatingActionToolbar
          key={selectedItem.uid} item={selectedItem} viewport={viewport} containerRef={containerRef}
          containerRect={containerRef.current?.getBoundingClientRect() ?? null}
          canvasWidth={formatSpec.width} canvasHeight={formatSpec.height}
          onUpdate={updateItem} onRemove={removeItem} onBringForward={bringForward}
          onSendBackward={sendBackward} onDuplicate={duplicateItem}
        />
      )}

      <CanvasViewportControls
        zoom={viewport.zoom}
        onZoomChange={handleBadgeZoom}
        onResetViewport={resetViewport}
      />
    </div>
  );
};
