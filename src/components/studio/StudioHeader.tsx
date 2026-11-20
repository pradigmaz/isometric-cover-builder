import React, { useState } from 'react';
import {
  Download,
  Undo2,
  Redo2,
  Grid,
  Magnet,
  Maximize2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { CanvasFormatId, PaletteId } from '../../types/schema';
import { FORMAT_PRESETS } from '../../config/formats';
import { PALETTE_PRESETS } from '../../config/palettes';
import { useCanvasStore } from '../../store/canvasStore';
import { exportSvg, exportPng } from '../../engine/exporter';

export const StudioHeader: React.FC = () => {
  const format = useCanvasStore((state) => state.format);
  const setFormat = useCanvasStore((state) => state.setFormat);
  const paletteId = useCanvasStore((state) => state.paletteId);
  const setPalette = useCanvasStore((state) => state.setPalette);

  const snapToGrid = useCanvasStore((state) => state.snapToGrid);
  const toggleSnapToGrid = useCanvasStore((state) => state.toggleSnapToGrid);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const toggleShowGrid = useCanvasStore((state) => state.toggleShowGrid);
  const resetViewport = useCanvasStore((state) => state.resetViewport);

  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => (typeof state.canUndo === 'function' ? (state.canUndo as () => boolean)() : Boolean(state.canUndo)));
  const canRedo = useCanvasStore((state) => (typeof state.canRedo === 'function' ? (state.canRedo as () => boolean)() : Boolean(state.canRedo)));

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportSvg = async () => {
    const svgEl = document.getElementById('isometric-canvas-svg') as SVGSVGElement | null;
    if (!svgEl) return;
    setIsExporting(true);
    try {
      await exportSvg(svgEl, {
        format: 'svg',
        inlineTokens: true,
        filename: `cover-${format}-${paletteId}.svg`,
      });
    } catch (err) {
      console.error('Failed to export SVG:', err);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportPng = async (scale: 1 | 2 | 3) => {
    const svgEl = document.getElementById('isometric-canvas-svg') as SVGSVGElement | null;
    if (!svgEl) return;
    setIsExporting(true);
    try {
      await exportPng(svgEl, {
        format: 'png',
        scale,
        filename: `cover-${format}-${paletteId}-${scale}x.png`,
      });
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const formatList: CanvasFormatId[] = ['og', '16:9', '1:1', '9:16'];
  const paletteList: PaletteId[] = ['warm-pastel', 'fresh-mint', 'soft-coral'];

  return (
    <header className="h-14 border-b border-stone-200 bg-white px-4 flex items-center justify-between gap-3 select-none z-20 shrink-0">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            ISO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-stone-900 tracking-tight leading-none">
                Isometric Cover Builder
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium border border-stone-200">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Конструктор изометрических обложек
            </p>
          </div>
        </div>
      </div>

      {/* Format Switcher */}
      <div className="hidden lg:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
        {formatList.map((fmtId) => {
          const spec = FORMAT_PRESETS[fmtId];
          const isActive = format === fmtId;
          return (
            <button
              key={fmtId}
              type="button"
              onClick={() => setFormat(fmtId)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title={spec.description}
            >
              {spec.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Palette Switcher */}
      <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
        {paletteList.map((palId) => {
          const cfg = PALETTE_PRESETS[palId];
          const isActive = paletteId === palId;
          return (
            <button
              key={palId}
              type="button"
              onClick={() => setPalette(palId)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs font-semibold ring-1 ring-stone-300'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title={`Палитра Figma: ${cfg.name}`}
            >
              <div className="flex -space-x-1 items-center">
                {cfg.figmaSwatches.map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-stone-300/80 shadow-2xs"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="hidden sm:inline text-[11px] font-medium">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tools: Undo/Redo, Grid, Snap, Viewport */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => undo()}
          disabled={!canUndo}
          className={`p-1.5 rounded-md border text-stone-700 transition-colors ${
            canUndo
              ? 'border-stone-200 bg-white hover:bg-stone-50 cursor-pointer'
              : 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
          }`}
          title="Отменить действие (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => redo()}
          disabled={!canRedo}
          className={`p-1.5 rounded-md border text-stone-700 transition-colors ${
            canRedo
              ? 'border-stone-200 bg-white hover:bg-stone-50 cursor-pointer'
              : 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
          }`}
          title="Повторить действие (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-stone-200 mx-1" />

        <button
          type="button"
          onClick={() => toggleShowGrid()}
          className={`p-1.5 rounded-md border transition-colors ${
            showGrid
              ? 'border-stone-800 bg-stone-800 text-white'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
          title="Отображение изометрической 30° сетки"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => toggleSnapToGrid()}
          className={`p-1.5 rounded-md border transition-colors ${
            snapToGrid
              ? 'border-stone-800 bg-stone-800 text-white'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
          title="Привязка к узлам изосетки"
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => resetViewport()}
          className="p-1.5 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors"
          title="Сбросить масштаб и положение холста"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Export Button & Menu */}
      <div className="relative">
        <div className="flex rounded-lg shadow-xs">
          <button
            type="button"
            onClick={handleExportSvg}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-l-lg text-xs font-semibold transition-colors disabled:opacity-50"
            title="Экспорт чистого SVG вектора с подстановкой цветов для Figma"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Экспорт...' : 'Экспорт SVG'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="bg-stone-900 hover:bg-stone-800 text-white px-1.5 py-1.5 rounded-r-lg border-l border-stone-700 transition-colors"
            title="Дополнительные опции экспорта"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showExportMenu && (
          <div className="absolute right-0 mt-1.5 w-52 rounded-lg bg-white border border-stone-200 shadow-lg py-1 z-50 text-xs">
            <div className="px-3 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Вектор (Figma Ready)
            </div>
            <button
              type="button"
              onClick={handleExportSvg}
              className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-100 flex items-center justify-between"
            >
              <span>SVG (100% вектор, hex токены)</span>
              <Check className="w-3 h-3 text-emerald-600" />
            </button>

            <div className="my-1 border-t border-stone-100" />
            <div className="px-3 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Растр высокого разрешения
            </div>
            <button
              type="button"
              onClick={() => handleExportPng(2)}
              className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-100 flex items-center justify-between"
            >
              <span>PNG 2x (Рекомендовано)</span>
              <span className="text-[10px] text-stone-400">High-Res</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPng(3)}
              className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-100 flex items-center justify-between"
            >
              <span>PNG 3x (Ultra Print)</span>
              <span className="text-[10px] text-stone-400">Ultra-Res</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPng(1)}
              className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-100"
            >
              <span>PNG 1x (Стандарт)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
