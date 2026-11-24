import React, { useCallback, useRef } from 'react';
import { clientToSvgPoint, snapToIsoGrid } from '../../engine/isometric';
import { getAssetVisualBounds } from '../../assets/registry';
import { CanvasItem } from '../../types/schema';
import { ResizeHandle } from './SelectionOverlay';
import { clampItemPosition, clampItemScale } from './canvasBoundaryClamping';

export interface UseCanvasInteractionsParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  viewportGroupRef: React.RefObject<SVGGElement | null>;
  formatSpec: { width: number; height: number };
  items: CanvasItem[];
  selectedItem: CanvasItem | undefined;
  viewport: { zoom: number; panX: number; panY: number };
  snapToGrid: boolean;
  gridStep: number;
  selectItem: (uid: string | null) => void;
  updateItem: (uid: string, changes: Partial<CanvasItem>, commit?: boolean) => void;
  setViewport: (viewport: Partial<{ zoom: number; panX: number; panY: number }>) => void;
}

export function useCanvasInteractions({
  svgRef,
  viewportGroupRef,
  formatSpec,
  items,
  selectedItem,
  viewport,
  snapToGrid,
  gridStep,
  selectItem,
  updateItem,
  setViewport,
}: UseCanvasInteractionsParams) {
  const dragRef = useRef({
    isDragging: false,
    uid: null as string | null,
    startPoint: { x: 0, y: 0 },
    startItemPos: { x: 0, y: 0 },
  });

  const resizeRef = useRef({
    isResizing: false,
    uid: null as string | null,
    startDist: 1,
    startScale: 1,
    center: { x: 0, y: 0 },
  });

  const panRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

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
  }, [viewportGroupRef]);

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
    [viewportGroupRef, selectedItem]
  );

  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element | null;
    if (
      target === svgRef.current ||
      target?.id === 'canvas-bg-rect' ||
      target?.closest('#canvas-desk-bg') ||
      target?.closest('#isometric-table-background')
    ) {
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

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (resizeRef.current.isResizing && resizeRef.current.uid && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const dx = pt.x - resizeRef.current.center.x;
      const dy = pt.y - resizeRef.current.center.y;
      const currDist = Math.hypot(dx, dy);
      let scale = Math.max(
        0.3,
        Math.min(3.5, +(resizeRef.current.startScale * (currDist / resizeRef.current.startDist)).toFixed(2))
      );
      const item = items.find((it) => it.uid === resizeRef.current.uid);
      if (item) {
        scale = clampItemScale(item, scale, formatSpec.width, formatSpec.height);
      }
      updateItem(resizeRef.current.uid, { scale }, false);
      return;
    }

    if (panRef.current.isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport({
        panX: Math.round(panRef.current.initialPanX + dx),
        panY: Math.round(panRef.current.initialPanY + dy),
      });
      return;
    }

    if (dragRef.current.isDragging && dragRef.current.uid && viewportGroupRef.current) {
      const pt = clientToSvgPoint(viewportGroupRef.current, e.clientX, e.clientY);
      const dx = pt.x - dragRef.current.startPoint.x;
      const dy = pt.y - dragRef.current.startPoint.y;

      let targetX = dragRef.current.startItemPos.x + dx;
      let targetY = dragRef.current.startItemPos.y + dy;
      const item = items.find((it) => it.uid === dragRef.current.uid);

      if (snapToGrid) {
        if (item) {
          const bounds = getAssetVisualBounds(item.assetId, item.size);
          const baseOffsetY = (bounds.offsetY + bounds.height / 2) * (item.scale || 1);
          const snapped = snapToIsoGrid({ x: targetX, y: targetY + baseOffsetY }, gridStep);
          targetX = snapped.x;
          targetY = snapped.y - baseOffsetY;
        } else {
          const snapped = snapToIsoGrid({ x: targetX, y: targetY }, gridStep);
          targetX = snapped.x;
          targetY = snapped.y;
        }
      }

      if (item) {
        const clamped = clampItemPosition(item, targetX, targetY, formatSpec.width, formatSpec.height);
        targetX = clamped.x;
        targetY = clamped.y;
      }

      updateItem(dragRef.current.uid, { x: Math.round(targetX), y: Math.round(targetY) }, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (resizeRef.current.isResizing && resizeRef.current.uid) {
      const uid = resizeRef.current.uid;
      const currentItem = items.find((it) => it.uid === uid);
      if (currentItem && currentItem.scale !== undefined) {
        updateItem(uid, { scale: currentItem.scale }, true);
      }
      resizeRef.current.isResizing = false;
      resizeRef.current.uid = null;
    }

    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
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

  const handlePointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    resizeRef.current.isResizing = false;
    resizeRef.current.uid = null;
    dragRef.current.isDragging = false;
    dragRef.current.uid = null;
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
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

    setViewport({
      panX: Math.round(newPanX),
      panY: Math.round(newPanY),
      zoom: newZoom,
    });
  };

  const handleBadgeZoom = (delta: number) => {
    const newZoom = Math.max(0.3, Math.min(3.0, +(viewport.zoom + delta).toFixed(2)));
    const cx = formatSpec.width / 2;
    const cy = formatSpec.height / 2;
    const newPanX = cx - (cx - viewport.panX) * (newZoom / viewport.zoom);
    const newPanY = cy - (cy - viewport.panY) * (newZoom / viewport.zoom);
    setViewport({ panX: Math.round(newPanX), panY: Math.round(newPanY), zoom: newZoom });
  };

  return {
    handleItemPointerDown,
    handleResizeStart,
    handleCanvasPointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleWheel,
    handleBadgeZoom,
  };
}
