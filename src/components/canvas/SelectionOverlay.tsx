import React from 'react';
import {
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CanvasItem } from '../../types/schema';

export interface SelectionOverlayProps {
  item: CanvasItem;
  canvasWidth?: number;
  onUpdate: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove: (uid: string) => void;
  onBringForward: (uid: string) => void;
  onSendBackward: (uid: string) => void;
  onDuplicate: (uid: string) => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  item,
  canvasWidth = 1200,
  onUpdate,
  onRemove,
  onBringForward,
  onSendBackward,
  onDuplicate,
}) => {
  const baseDim = item.size === 'L' ? 600 : 200;
  const w = baseDim * (item.scale || 1);
  const h = baseDim * (item.scale || 1);
  const visualY = item.y - (item.zHeight || 0);

  const rectX = item.x - w / 2;
  const rectY = visualY - h / 2;

  // Sleek compact floating toolbar (toolbarWidth = 360 -> 390) with intelligent flipping and clamping
  const toolbarWidth = 390;
  const toolbarHeight = 48;

  // Intelligent vertical flipping: flip below object if it would collide with the top bar
  const fitsAbove = rectY - toolbarHeight - 16 >= 20;
  const toolbarY = fitsAbove ? Math.round(rectY - toolbarHeight - 16) : Math.round(rectY + h + 16);

  // Horizontal clamping within [12, canvasWidth - toolbarWidth - 12]
  const minX = 12;
  const maxX = Math.max(minX, canvasWidth - toolbarWidth - 12);
  const toolbarX = Math.max(minX, Math.min(maxX, Math.round(item.x - toolbarWidth / 2)));

  const handleRotate = (delta: number) => {
    const current = item.rotation || 0;
    const next = (current + delta + 360) % 360;
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

  return (
    <g data-editor-only="true" className="selection-overlay pointer-events-none">
      {/* Dashed Bounding Rectangle */}
      <rect
        x={rectX}
        y={rectY}
        width={w}
        height={h}
        fill="none"
        stroke="var(--token-primary)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        rx="8"
        className="transition-all motion-reduce:transition-none"
      />

      {/* 4 Corner Control Handles */}
      <circle cx={rectX} cy={rectY} r="4.5" fill="var(--token-light)" stroke="var(--token-primary)" strokeWidth="2" />
      <circle cx={rectX + w} cy={rectY} r="4.5" fill="var(--token-light)" stroke="var(--token-primary)" strokeWidth="2" />
      <circle cx={rectX} cy={rectY + h} r="4.5" fill="var(--token-light)" stroke="var(--token-primary)" strokeWidth="2" />
      <circle cx={rectX + w} cy={rectY + h} r="4.5" fill="var(--token-light)" stroke="var(--token-primary)" strokeWidth="2" />

      {/* Floating Action Toolbar */}
      <foreignObject
        x={toolbarX}
        y={toolbarY}
        width={toolbarWidth}
        height={toolbarHeight}
        className="overflow-visible pointer-events-auto"
      >
        <div className="flex justify-center w-full">
          <div
            role="toolbar"
            aria-label="Свойства выделенного объекта"
            className="bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl px-2.5 py-1 flex items-center gap-1 border border-white/10 text-xs select-none"
            onPointerDown={(e) => e.stopPropagation()}
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

            {/* Scale Controls */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleScale(-0.1)}
                title="Уменьшить масштаб (-10%)"
                aria-label="Уменьшить масштаб (-10%)"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-9 text-center text-white/70 select-none">
                {Math.round((item.scale || 1) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleScale(0.1)}
                title="Увеличить масштаб (+10%)"
                aria-label="Увеличить масштаб (+10%)"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <ZoomIn className="w-3.5 h-3.5" />
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
      </foreignObject>
    </g>
  );
};


