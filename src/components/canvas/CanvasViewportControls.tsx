import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { CanvasFormatId } from '../../types/schema';

export interface CanvasViewportControlsProps {
  format?: CanvasFormatId;
  formatSpec?: { label: string; shortLabel: string; width: number; height: number };
  zoom: number;
  onSetFormat?: (format: CanvasFormatId) => void;
  onZoomChange: (delta: number) => void;
  onResetViewport: () => void;
}

export const CanvasViewportControls: React.FC<CanvasViewportControlsProps> = ({
  zoom,
  onZoomChange,
  onResetViewport,
}) => {
  return (
    <div className="hidden lg:flex absolute bottom-24 left-4 lg:bottom-4 lg:left-6 mb-2 lg:mb-3 items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-neutral-900/85 dark:bg-zinc-950/90 backdrop-blur-md border border-white/10 dark:border-zinc-800 text-xs text-white/80 dark:text-zinc-200 shadow-lg pointer-events-auto z-10 transition-all duration-200">
      <button
        type="button"
        onClick={() => onZoomChange(-0.1)}
        className="hover:text-white transition-all duration-150 active:scale-90 cursor-pointer"
        title="Уменьшить масштаб"
        aria-label="Уменьшить масштаб"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="font-mono text-[11px] w-10 text-center select-none font-medium text-white/90">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => onZoomChange(0.1)}
        className="hover:text-white transition-all duration-150 active:scale-90 cursor-pointer"
        title="Увеличить масштаб"
        aria-label="Увеличить масштаб"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" aria-hidden="true" />
      <button
        type="button"
        onClick={onResetViewport}
        className="hover:text-white transition-all duration-150 active:scale-90 p-0.5 rounded cursor-pointer"
        title="Сбросить масштаб и положение холста"
        aria-label="Сбросить масштаб и положение холста"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};
