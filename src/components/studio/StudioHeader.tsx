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

  const closeExportPopover = () => {
    const popover = document.getElementById('export-popover');
    if (popover && 'hidePopover' in popover) {
      try {
        (popover as HTMLElement).hidePopover();
      } catch {
        // Popover already closed or not supported
      }
    }
  };

  const handleExportSvg = async () => {
    closeExportPopover();
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
    }
  };

  const handleExportPng = async (scale: 1 | 2 | 3) => {
    closeExportPopover();
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
    }
  };

  const formatList: CanvasFormatId[] = ['og', '16:9', '1:1', '9:16'];
  const paletteList: PaletteId[] = ['warm-pastel', 'fresh-mint', 'soft-coral'];

  return (
    <header
      role="toolbar"
      aria-label="Studio toolbar"
      aria-controls="isometric-canvas"
      {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
      className="h-14 border-b border-[var(--border)] bg-[var(--bg)] px-4 flex items-center justify-between gap-3 select-none z-20 shrink-0"
    >
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            ISO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-[var(--fg)] tracking-tight leading-none">
                Isometric Cover Builder
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--fg-2)] font-medium border border-[var(--border)]">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-[var(--fg-2)] leading-tight">
              Конструктор изометрических обложек
            </p>
          </div>
        </div>
      </div>

      {/* Format Switcher */}
      <div className="hidden lg:flex items-center bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--border)]">
        {formatList.map((fmtId) => {
          const spec = FORMAT_PRESETS[fmtId];
          const isActive = format === fmtId;
          return (
            <button
              key={fmtId}
              type="button"
              onClick={() => setFormat(fmtId)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs font-semibold'
                  : 'text-[var(--fg-2)] hover:text-[var(--fg)]'
              }`}
              title={spec.description}
              aria-label={`Формат ${spec.shortLabel}`}
            >
              {spec.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Palette Switcher */}
      <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
        {paletteList.map((palId) => {
          const cfg = PALETTE_PRESETS[palId];
          const isActive = paletteId === palId;
          return (
            <button
              key={palId}
              type="button"
              onClick={() => setPalette(palId)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs font-semibold ring-1 ring-[var(--border)]'
                  : 'text-[var(--fg-2)] hover:text-[var(--fg)]'
              }`}
              title={`Палитра Figma: ${cfg.name}`}
              aria-label={`Палитра ${cfg.name}`}
            >
              <div className="flex -space-x-1 items-center">
                {cfg.figmaSwatches.map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-[var(--border)] shadow-2xs"
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
        {/* Undo: one-shot action button (strictly NO aria-pressed) */}
        <button
          type="button"
          onClick={() => undo()}
          disabled={!canUndo}
          className={`p-1.5 rounded-md border text-[var(--fg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            canUndo
              ? 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface)] cursor-pointer'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-2)] opacity-40 cursor-not-allowed'
          }`}
          title="Отменить действие (Ctrl+Z)"
          aria-label="Отменить действие"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo: one-shot action button (strictly NO aria-pressed) */}
        <button
          type="button"
          onClick={() => redo()}
          disabled={!canRedo}
          className={`p-1.5 rounded-md border text-[var(--fg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            canRedo
              ? 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface)] cursor-pointer'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-2)] opacity-40 cursor-not-allowed'
          }`}
          title="Повторить действие (Ctrl+Y)"
          aria-label="Повторить действие"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[var(--border)] mx-1" />

        {/* Grid toggle: state toggle (MUST have aria-pressed) */}
        <button
          type="button"
          onClick={() => toggleShowGrid()}
          aria-pressed={showGrid ? 'true' : 'false'}
          className={`p-1.5 rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            showGrid
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
              : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
          }`}
          title="Отображение изометрической 30° сетки"
          aria-label="Отображение изометрической 30° сетки"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Snap toggle: state toggle (MUST have aria-pressed) */}
        <button
          type="button"
          onClick={() => toggleSnapToGrid()}
          aria-pressed={snapToGrid ? 'true' : 'false'}
          className={`p-1.5 rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            snapToGrid
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
              : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
          }`}
          title="Привязка к узлам изосетки"
          aria-label="Привязка к узлам изосетки"
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        {/* Reset viewport: one-shot action button (strictly NO aria-pressed) */}
        <button
          type="button"
          onClick={() => resetViewport()}
          className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          title="Сбросить масштаб и положение холста"
          aria-label="Сбросить масштаб и положение холста"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Export Button & Popover */}
      <div className="relative">
        <div className="flex rounded-lg shadow-xs">
          {/* Main export trigger: one-shot action (strictly NO aria-pressed) */}
          <button
            type="button"
            onClick={handleExportSvg}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] px-3 py-1.5 rounded-l-lg text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="Экспорт чистого SVG вектора с подстановкой цветов для Figma"
            aria-label="Экспорт SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Экспорт...' : 'Экспорт SVG'}</span>
          </button>

          {/* Export dropdown trigger tethered anchor: one-shot action (strictly NO aria-pressed) */}
          <button
            type="button"
            disabled={isExporting}
            popoverTarget="export-popover"
            {...({ popovertarget: 'export-popover' } as any)}
            className="export-anchor bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] px-1.5 py-1.5 rounded-r-lg border-l border-[var(--bg)]/20 transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="Дополнительные опции экспорта"
            aria-label="Опции экспорта"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Native top-layer Popover */}
        <div
          id="export-popover"
          {...({ popover: 'auto' } as any)}
          className="studio-dropdown w-56 rounded-lg bg-[var(--bg)] border border-[var(--border)] shadow-lg p-1 text-xs text-[var(--fg)]"
        >
          <div className="px-3 py-1 text-[10px] font-semibold text-[var(--fg-2)] uppercase tracking-wider">
            Вектор (Figma Ready)
          </div>
          <button
            type="button"
            onClick={handleExportSvg}
            className="w-full px-3 py-1.5 text-left text-[var(--fg)] hover:bg-[var(--surface)] rounded-md flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>SVG (100% вектор, hex токены)</span>
            <Check className="w-3 h-3 text-emerald-600" />
          </button>

          <div className="my-1 border-t border-[var(--border)]" />
          <div className="px-3 py-1 text-[10px] font-semibold text-[var(--fg-2)] uppercase tracking-wider">
            Растр высокого разрешения
          </div>
          <button
            type="button"
            onClick={() => handleExportPng(2)}
            className="w-full px-3 py-1.5 text-left text-[var(--fg)] hover:bg-[var(--surface)] rounded-md flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>PNG 2x (Рекомендовано)</span>
            <span className="text-[10px] text-[var(--fg-2)]">High-Res</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportPng(3)}
            className="w-full px-3 py-1.5 text-left text-[var(--fg)] hover:bg-[var(--surface)] rounded-md flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>PNG 3x (Ultra Print)</span>
            <span className="text-[10px] text-[var(--fg-2)]">Ultra-Res</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportPng(1)}
            className="w-full px-3 py-1.5 text-left text-[var(--fg)] hover:bg-[var(--surface)] rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>PNG 1x (Стандарт)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
