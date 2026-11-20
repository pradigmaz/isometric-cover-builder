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
  const toolbarWidth = 320;
  const toolbarHeight = 42;
  const toolbarX = Math.round(item.x - toolbarWidth / 2);
  const toolbarY = Math.max(12, Math.round(rectY - toolbarHeight - 10));

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
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        rx="8"
        className="transition-all"
      />

      {/* 4 Corner Control Handles */}
      <circle cx={rectX} cy={rectY} r="4.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
      <circle cx={rectX + w} cy={rectY} r="4.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
      <circle cx={rectX} cy={rectY + h} r="4.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
      <circle cx={rectX + w} cy={rectY + h} r="4.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />

      {/* Floating Action Toolbar */}
      <foreignObject
        x={toolbarX}
        y={toolbarY}
        width={toolbarWidth}
        height={toolbarHeight}
        className="overflow-visible pointer-events-auto"
      >
        <div
          className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-full bg-neutral-900/95 text-white/90 shadow-2xl border border-white/20 backdrop-blur-md text-xs select-none"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Rotate Controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleRotate(-30)}
              title="Повернуть на -30°"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRotate(30)}
              title="Повернуть на +30°"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-3.5 bg-white/20" />

          {/* Scale Controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleScale(-0.1)}
              title="Уменьшить масштаб (-10%)"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] w-8 text-center text-white/70">
              {Math.round((item.scale || 1) * 100)}%
            </span>
            <button
              onClick={() => handleScale(0.1)}
              title="Увеличить масштаб (+10%)"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-3.5 bg-white/20" />

          {/* Layer Reorder */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onBringForward(item.uid)}
              title="Слой выше"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSendBackward(item.uid)}
              title="Слой ниже"
              className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-3.5 bg-white/20" />

          {/* Size & Role Toggles */}
          <button
            onClick={toggleSize}
            title={`Переключить размер (${item.size === 'L' ? 'Герой L' : 'Деталь S'})`}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/25 transition-colors"
          >
            {item.size}
          </button>
          <button
            onClick={toggleRole}
            title={item.role === 'foreground' ? 'Сделать силуэтом (Ghost)' : 'Сделать основным (Main)'}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              item.role === 'ghost' ? 'bg-amber-500/30 text-amber-300 font-semibold' : 'bg-white/10 hover:bg-white/25'
            }`}
          >
            {item.role === 'ghost' ? 'Ghost' : 'Main'}
          </button>
          <button
            onClick={toggleFlip}
            title="Отразить по горизонтали"
            className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-white/20" />

          {/* Duplicate & Delete */}
          <button
            onClick={() => onDuplicate(item.uid)}
            title="Дублировать объект"
            className="p-1 hover:bg-white/20 hover:text-white rounded-md transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(item.uid)}
            title="Удалить объект"
            className="p-1 hover:bg-red-500/40 text-red-300 hover:text-red-100 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </foreignObject>
    </g>
  );
};
