import React from 'react';
import {
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  FlipHorizontal,
  Plus,
  Minus,
} from 'lucide-react';
import { CanvasItem, ViewportState } from '../../types/schema';
import { getAssetVisualBounds } from '../../assets/registry';

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

export interface SelectionOverlayProps {
  item: CanvasItem;
  zoom?: number;
  canvasWidth?: number;
  onResizeStart?: (e: React.PointerEvent, handle: ResizeHandle) => void;
  onUpdate?: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove?: (uid: string) => void;
  onBringForward?: (uid: string) => void;
  onSendBackward?: (uid: string) => void;
  onDuplicate?: (uid: string) => void;
}

/**
 * SelectionOverlay renders strictly SVG elements (dashed bounding box & zoom-invariant handles)
 * rotated around (item.x, visualY). The interactive toolbar is decoupled into HTML FloatingActionToolbar.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  item,
  zoom = 1,
  onResizeStart,
}) => {
  const bounds = getAssetVisualBounds(item.assetId, item.size);
  const w = bounds.width * (item.scale || 1);
  const h = bounds.height * (item.scale || 1);
  const visualY = item.y - (item.zHeight || 0) + bounds.offsetY * (item.scale || 1);

  const rectX = item.x - w / 2;
  const rectY = visualY - h / 2;

  const rotation = item.rotation || 0;
  const pivotY = item.y - (item.zHeight || 0);

  // Counter-scaled stroke widths and handle radius for zoom invariance
  const rectStrokeWidth = 1.5 / zoom;
  const dashArray = `${5 / zoom} ${4 / zoom}`;
  const cornerRadius = Math.max(2, 6 / zoom);

  return (
    <g
      data-editor-only="true"
      className="selection-overlay pointer-events-none"
      transform={`rotate(${rotation} ${item.x} ${pivotY})`}
    >
      {/* Dashed Bounding Rectangle */}
      <rect
        x={rectX}
        y={rectY}
        width={w}
        height={h}
        fill="none"
        stroke="var(--token-primary)"
        strokeWidth={rectStrokeWidth}
        strokeDasharray={dashArray}
        rx={cornerRadius}
        className="transition-all motion-reduce:transition-none"
      />

      {/* 4 Corner Control Handles (Zoom-Invariant with Resize Dragging) */}
      <circle
        cx={rectX}
        cy={rectY}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nwse-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'tl');
        }}
      />
      <circle
        cx={rectX + w}
        cy={rectY}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nesw-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'tr');
        }}
      />
      <circle
        cx={rectX}
        cy={rectY + h}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nesw-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'bl');
        }}
      />
      <circle
        cx={rectX + w}
        cy={rectY + h}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nwse-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'br');
        }}
      />
    </g>
  );
};

export interface FloatingActionToolbarProps {
  item: CanvasItem;
  viewport: ViewportState;
  containerRect?: DOMRectReadOnly | DOMRect | null;
  canvasWidth?: number;
  canvasHeight?: number;
  onUpdate: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove: (uid: string) => void;
  onBringForward: (uid: string) => void;
  onSendBackward: (uid: string) => void;
  onDuplicate: (uid: string) => void;
}

/**
 * Decoupled HTML overlay toolbar rendered as sibling to <svg> in container screen coordinates.
 */
export const FloatingActionToolbar: React.FC<FloatingActionToolbarProps> = ({
  item,
  viewport,
  containerRect,
  canvasWidth = 1200,
  canvasHeight = 630,
  onUpdate,
  onRemove,
  onBringForward,
  onSendBackward,
  onDuplicate,
}) => {
  const bounds = getAssetVisualBounds(item.assetId, item.size);
  const h = bounds.height * (item.scale || 1);
  const visualY = item.y - (item.zHeight || 0) + bounds.offsetY * (item.scale || 1);

  // Position in container screen coordinates
  const screenX = viewport.panX + item.x * viewport.zoom;
  const screenY = viewport.panY + (visualY - h / 2) * viewport.zoom;
  const screenBottomY = viewport.panY + (visualY + h / 2) * viewport.zoom;

  // Sleek compact floating toolbar (toolbarWidth = 360) with intelligent flipping and clamping
  const toolbarWidth = 360;
  const toolbarHeight = 44;

  const containerWidth = containerRect?.width || canvasWidth;
  const containerHeight = containerRect?.height || canvasHeight;

  // Intelligent vertical flipping: flip below object if it would collide with the top bar
  const fitsAbove = screenY - toolbarHeight - 16 >= 12;
  const rawToolbarY = fitsAbove ? Math.round(screenY - toolbarHeight - 16) : Math.round(screenBottomY + 16);

  // Horizontal clamping within [12, containerWidth - toolbarWidth - 12]
  const minX = 12;
  const maxX = Math.max(minX, containerWidth - toolbarWidth - 12);
  const toolbarX = Math.max(minX, Math.min(maxX, Math.round(screenX - toolbarWidth / 2)));

  // Vertical clamping within container bounds [12, containerHeight - toolbarHeight - 12]
  const minY = 12;
  const maxY = Math.max(minY, containerHeight - toolbarHeight - 12);
  const toolbarY = Math.max(minY, Math.min(maxY, rawToolbarY));

  const handleRotate = (delta: number) => {
    const current = item.rotation || 0;
    const next = current + delta;
    onUpdate(item.uid, { rotation: next }, true);
  };

  const handleScale = (delta: number) => {
    const current = item.scale || 1;
    const next = Math.max(0.3, Math.min(2.5, +(current + delta).toFixed(2)));
    onUpdate(item.uid, { scale: next }, true);
  };

  const toggleFlip = () => {
    onUpdate(item.uid, { flipX: !item.flipX }, true);
  };

  const scalePercent = Math.round((item.scale || 1) * 100);

  return (
    <div
      className="absolute z-30 pointer-events-auto select-none flex items-center justify-center transition-all duration-75 motion-reduce:transition-none"
      style={{
        left: `${toolbarX}px`,
        top: `${toolbarY}px`,
        width: `${toolbarWidth}px`,
        height: `${toolbarHeight}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="toolbar"
        aria-label="Свойства выделенного объекта"
        className="bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl px-2 py-1 flex items-center gap-1 border border-white/10 text-xs"
      >
        {/* Rotate Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleRotate(-30)}
            title="Повернуть на -30°"
            aria-label="Повернуть на -30°"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRotate(30)}
            title="Повернуть на +30°"
            aria-label="Повернуть на +30°"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />

        {/* Object Scale Controls with Plus/Minus */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleScale(-0.1)}
            title={`Уменьшить размер объекта (-10%). Текущий: ${scalePercent}%`}
            aria-label="Уменьшить масштаб объекта"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
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
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />

        {/* Layer Reorder */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onBringForward(item.uid)}
            title="Слой выше"
            aria-label="Слой выше"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSendBackward(item.uid)}
            title="Слой ниже"
            aria-label="Слой ниже"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />

        {/* Flip Horizontal */}
        <button
          type="button"
          onClick={toggleFlip}
          title="Отразить по горизонтали"
          aria-label="Отразить по горизонтали"
          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />

        {/* Duplicate & Delete */}
        <button
          type="button"
          onClick={() => onDuplicate(item.uid)}
          title="Дублировать объект"
          aria-label="Дублировать объект"
          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.uid)}
          title="Удалить объект"
          aria-label="Удалить объект"
          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-300 hover:text-rose-100 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
