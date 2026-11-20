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
  onUpdate: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove: (uid: string) => void;
  onBringForward: (uid: string) => void;
  onSendBackward: (uid: string) => void;
  onDuplicate: (uid: string) => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  item,
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

  // Floating toolbar coordinates centered above or below item
  const toolbarWidth = 580;
  const toolbarHeight = 52;
  const toolbarX = Math.round(item.x - toolbarWidth / 2);
  const toolbarY = Math.max(12, Math.round(rectY - toolbarHeight - 12));

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

  const toggleSize = () => {
    const nextSize = item.size === 'L' ? 'S' : 'L';
    onUpdate(item.uid, { size: nextSize }, true);
  };

  const toggleRole = () => {
    const nextRole = item.role === 'foreground' ? 'ghost' : 'foreground';
    onUpdate(item.uid, { role: nextRole, opacity: nextRole === 'ghost' ? 0.22 : 1 }, true);
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
            className="bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl px-2.5 py-1.5 flex items-center gap-1.5 border border-white/10 text-xs select-none"
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
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRotate(30)}
                title="Повернуть на +30°"
                aria-label="Повернуть на +30°"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />

            {/* Scale Controls */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleScale(-0.1)}
                title="Уменьшить масштаб (-10%)"
                aria-label="Уменьшить масштаб (-10%)"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <ZoomOut className="w-4 h-4" />
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
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />

            {/* Layer Reorder */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onBringForward(item.uid)}
                title="Слой выше"
                aria-label="Слой выше"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSendBackward(item.uid)}
                title="Слой ниже"
                aria-label="Слой ниже"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />

            {/* Size & Role Toggles */}
            <button
              type="button"
              onClick={toggleSize}
              title={`Переключить размер (${item.size === 'L' ? 'Герой L' : 'Деталь S'})`}
              aria-label={`Переключить размер (${item.size === 'L' ? 'Герой L' : 'Деталь S'})`}
              className="min-w-[36px] min-h-[36px] px-2 rounded-full font-bold text-[11px] bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors motion-reduce:transition-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              {item.size}
            </button>
            <button
              type="button"
              onClick={toggleRole}
              title={item.role === 'foreground' ? 'Сделать силуэтом (Ghost)' : 'Сделать основным (Main)'}
              aria-label={item.role === 'foreground' ? 'Сделать силуэтом (Ghost)' : 'Сделать основным (Main)'}
              className={`min-w-[36px] min-h-[36px] px-2.5 rounded-full text-[11px] font-semibold transition-colors motion-reduce:transition-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                item.role === 'ghost'
                  ? 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/40'
                  : 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white'
              }`}
            >
              {item.role === 'ghost' ? 'Ghost' : 'Main'}
            </button>
            <button
              type="button"
              onClick={toggleFlip}
              title="Отразить по горизонтали"
              aria-label="Отразить по горизонтали"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />

            {/* Duplicate & Delete */}
            <button
              type="button"
              onClick={() => onDuplicate(item.uid)}
              title="Дублировать объект"
              aria-label="Дублировать объект"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 text-stone-200 hover:text-white transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.uid)}
              title="Удалить объект"
              aria-label="Удалить объект"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-300 hover:text-rose-100 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
