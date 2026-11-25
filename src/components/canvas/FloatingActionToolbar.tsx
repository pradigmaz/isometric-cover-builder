import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import {
  GripVertical, RotateCcw, RotateCw, ArrowUp, ArrowDown,
  Trash2, Copy, FlipHorizontal, Plus, Minus, Ghost,
} from 'lucide-react';
import { CanvasItem, ViewportState } from '../../types/schema';
import { getAssetVisualBounds } from '../../assets/registry';

export interface FloatingActionToolbarProps {
  item: CanvasItem;
  viewport: ViewportState;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  containerRect?: DOMRectReadOnly | DOMRect | null;
  canvasWidth?: number;
  canvasHeight?: number;
  onUpdate: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove: (uid: string) => void;
  onBringForward: (uid: string) => void;
  onSendBackward: (uid: string) => void;
  onDuplicate: (uid: string) => void;
}

export const FloatingActionToolbar: React.FC<FloatingActionToolbarProps> = ({
  item, viewport, containerRef, containerRect, canvasWidth = 1200, canvasHeight = 630,
  onUpdate, onRemove, onBringForward, onSendBackward, onDuplicate,
}) => {
  // User drag repositioning offset state
  const [userOffset, setUserOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentUid, setCurrentUid] = useState(item.uid);

  // Symmetrically reset user drag offset when selected item changes
  if (item.uid !== currentUid) {
    setCurrentUid(item.uid);
    setUserOffset({ x: 0, y: 0 });
  }

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialOffsetRef.current = { ...userOffset };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [userOffset]
  );

  const handleDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setUserOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    e.stopPropagation();
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // pointer capture may already be released
    }
  }, []);

  // Sleek compact floating toolbar with handle
  const toolbarWidth = 496;
  const toolbarHeight = 44;
  const defaultMargin = 24;
  const bottomMargin = 32;

  const [basePos, setBasePos] = useState<{ x: number; y: number; cWidth: number; cHeight: number }>(() => {
    const containerWidth = containerRect?.width || canvasWidth;
    const containerHeight = containerRect?.height || canvasHeight;
    return { x: 12, y: 12, cWidth: containerWidth, cHeight: containerHeight };
  });

  const recomputePosition = useCallback(() => {
    const itemEl = document.querySelector(`[data-uid="${item.uid}"]`) || document.getElementById(`canvas-item-${item.uid}`);
    const containerEl =
      containerRef?.current ||
      (itemEl?.closest('.relative') as HTMLElement | null) ||
      document.getElementById('isometric-canvas-svg')?.parentElement;

    if (!containerEl) return;

    const containerRect = containerEl.getBoundingClientRect();
    const cWidth = containerRect.width || canvasWidth;
    const cHeight = containerRect.height || canvasHeight;

    const bounds = getAssetVisualBounds(item.assetId, item.size);
    const h = bounds.height * (item.scale || 1);
    const visualY = item.y - (item.zHeight || 0) + bounds.offsetY * (item.scale || 1);
    const anchorY = visualY - h / 2;

    const viewportGroupEl = document.getElementById('viewport-group') as SVGGElement | null;
    const ctm = viewportGroupEl?.getScreenCTM();

    let targetX: number;
    let targetY: number;

    if (ctm && typeof DOMPoint !== 'undefined') {
      const pt = new DOMPoint(item.x, anchorY).matrixTransform(ctm);
      targetX = pt.x - containerRect.left - toolbarWidth / 2;
      targetY = pt.y - containerRect.top - toolbarHeight - 16;

      if (targetY < 12) {
        const ptBottom = new DOMPoint(item.x, visualY + h / 2).matrixTransform(ctm);
        targetY = ptBottom.y - containerRect.top + 16;
      }
    } else {
      const screenX = viewport.panX + item.x * viewport.zoom;
      const screenY = viewport.panY + anchorY * viewport.zoom;
      const screenBottomY = viewport.panY + (visualY + h / 2) * viewport.zoom;
      targetX = screenX - toolbarWidth / 2;
      targetY =
        screenY - toolbarHeight - defaultMargin >= 12
          ? screenY - toolbarHeight - defaultMargin
          : screenBottomY + defaultMargin;
    }

    targetX = Math.max(12, Math.min(containerRect.width - toolbarWidth - 12, targetX));
    targetY = Math.max(12, Math.min(containerRect.height - toolbarHeight - bottomMargin, targetY));

    setBasePos((prev) => {
      const nextX = Math.round(targetX);
      const nextY = Math.round(targetY);
      if (
        prev.x === nextX &&
        prev.y === nextY &&
        prev.cWidth === cWidth &&
        prev.cHeight === cHeight
      ) {
        return prev;
      }
      return { x: nextX, y: nextY, cWidth, cHeight };
    });
  }, [
    item.uid, item.x, item.y, item.scale, item.rotation, item.zHeight, item.assetId, item.size,
    viewport.panX, viewport.panY, viewport.zoom, canvasWidth, canvasHeight, containerRef,
  ]);

  useLayoutEffect(() => {
    recomputePosition();
    const rafId = requestAnimationFrame(recomputePosition);
    return () => cancelAnimationFrame(rafId);
  }, [recomputePosition]);

  useLayoutEffect(() => {
    const containerEl =
      containerRef?.current ||
      document.getElementById('isometric-canvas-svg')?.parentElement;
    if (!containerEl) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        recomputePosition();
      });
      ro.observe(containerEl);
    }

    window.addEventListener('resize', recomputePosition);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recomputePosition);
    };
  }, [containerRef, recomputePosition]);

  // Interactive user repositioning clamped to container bounds
  const minX = 12;
  const maxX = Math.max(minX, basePos.cWidth - toolbarWidth - 12);
  const minY = 12;
  const maxY = Math.max(minY, basePos.cHeight - toolbarHeight - bottomMargin);

  const toolbarX = Math.max(minX, Math.min(maxX, Math.round(basePos.x + userOffset.x)));
  const toolbarY = Math.max(minY, Math.min(maxY, Math.round(basePos.y + userOffset.y)));

  const handleRotate = (delta: number) => {
    const current = item.rotation || 0;
    const next = current + delta;
    onUpdate(item.uid, { rotation: next }, true);
  };

  const handleScale = (delta: number) => {
    const next = Math.max(0.3, Math.min(2.5, +((item.scale || 1) + delta).toFixed(2)));
    onUpdate(item.uid, { scale: next }, true);
  };

  const toggleFlip = () => onUpdate(item.uid, { flipX: !item.flipX }, true);

  const isGhost = item.role === 'ghost';
  const toggleRole = () => {
    const nextRole = item.role === 'foreground' ? 'ghost' : 'foreground';
    onUpdate(item.uid, { role: nextRole, opacity: nextRole === 'ghost' ? 0.22 : 1 }, true);
  };

  const scalePercent = Math.round((item.scale || 1) * 100);
  const btnCls =
    'w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300';
  const divider = <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />;

  return (
    <div
      role="toolbar"
      aria-label="Свойства выделенного объекта"
      className={`absolute z-30 pointer-events-auto select-none flex items-center justify-center ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        left: `${toolbarX}px`,
        top: `${toolbarY}px`,
        width: `${toolbarWidth}px`,
        height: `${toolbarHeight}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl px-2 py-1 flex items-center gap-1 border border-white/10 text-xs">
        {/* Drag Handle */}
        <div
          role="button"
          tabIndex={0}
          title="Перетащить панель"
          aria-label="Перетащить панель"
          className="cursor-grab active:cursor-grabbing p-1 -ml-0.5 text-stone-400 hover:text-white transition-colors flex items-center justify-center touch-none select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {divider}

        {/* Rotate Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleRotate(-30)}
            title="Повернуть на -30°"
            aria-label="Повернуть на -30°"
            className={btnCls}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRotate(30)}
            title="Повернуть на +30°"
            aria-label="Повернуть на +30°"
            className={btnCls}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {divider}

        {/* Object Scale Controls with Plus/Minus */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleScale(-0.1)}
            title={`Уменьшить размер объекта (-10%). Текущий: ${scalePercent}%`}
            aria-label="Уменьшить масштаб объекта"
            className={btnCls}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span
            className="font-mono text-[11px] w-9 text-center text-white/80 select-none cursor-default"
            title={`Размер объекта: ${scalePercent}%`}
          >
            {scalePercent}%
          </span>
          <button
            type="button"
            onClick={() => handleScale(0.1)}
            title={`Увеличить размер объекта (+10%). Текущий: ${scalePercent}%`}
            aria-label="Увеличить масштаб объекта"
            className={btnCls}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {divider}

        {/* Size Preset: L vs S */}
        <div className="flex items-center rounded-full bg-white/10 p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onUpdate(item.uid, { size: 'L' }, true)}
            title="Размер L (600×600)"
            aria-label="Размер L"
            aria-pressed={item.size === 'L'}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
              item.size === 'L'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            L
          </button>
          <button
            type="button"
            onClick={() => onUpdate(item.uid, { size: 'S' }, true)}
            title="Размер S (200×200)"
            aria-label="Размер S"
            aria-pressed={item.size === 'S'}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
              item.size === 'S'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            S
          </button>
        </div>

        {divider}

        {/* Layer Reorder */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onBringForward(item.uid)}
            title="Слой выше"
            aria-label="Слой выше"
            className={btnCls}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSendBackward(item.uid)}
            title="Слой ниже"
            aria-label="Слой ниже"
            className={btnCls}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {divider}

        {/* Flip Horizontal & Silhouette */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleFlip}
            title="Отразить по горизонтали"
            aria-label="Отразить по горизонтали"
            className={btnCls}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleRole}
            title={isGhost ? 'Сделать основным (сейчас силуэт)' : 'Сделать силуэтом (Ghost)'}
            aria-label={isGhost ? 'Сделать основным (сейчас силуэт)' : 'Сделать силуэтом (Ghost)'}
            aria-pressed={isGhost}
            className={`w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 ${
              isGhost
                ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/40 hover:bg-amber-500/35 focus-visible:ring-amber-400'
                : 'hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white focus-visible:ring-stone-300'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" />
          </button>
        </div>

        {divider}

        {/* Duplicate & Delete */}
        <button
          type="button"
          onClick={() => onDuplicate(item.uid)}
          title="Дублировать объект"
          aria-label="Дублировать объект"
          className={btnCls}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.uid)}
          title="Удалить объект"
          aria-label="Удалить объект"
          className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-300 hover:text-rose-100 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
