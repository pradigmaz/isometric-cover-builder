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
  Figma,
  Upload,
} from 'lucide-react';
import { CanvasFormatId, PaletteId } from '../../types/schema';
import { PALETTE_PRESETS } from '../../config/palettes';
import { useCanvasStore } from '../../store/canvasStore';
import { exportSvg, exportPng } from '../../engine/exporter';
import { FigmaIntegrationModal } from '../header/FigmaIntegrationModal';
import { PaletteUploadModal } from './PaletteUploadModal';
import { ThemeToggle } from './ThemeToggle';

const FORMAT_OPTIONS: Array<{
  id: CanvasFormatId;
  label: string;
  dims: string;
}> = [
  { id: '1:1', label: '1:1', dims: '1080×1080' },
  { id: 'og', label: 'OG', dims: '1200×630' },
  { id: '9:16', label: '9:16', dims: '1080×1920' },
  { id: '16:9', label: '16:9', dims: '1920×1080' },
];

interface StudioHeaderProps {
  onOpenFigmaModal?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({ onOpenFigmaModal }) => {
  const format = useCanvasStore((state) => state.format);
  const setFormat = useCanvasStore((state) => state.setFormat);
  const paletteId = useCanvasStore((state) => state.paletteId);
  const setPalette = useCanvasStore((state) => state.setPalette);
  const customPalette = useCanvasStore((state) => state.customPalette);

  const snapToGrid = useCanvasStore((state) => state.snapToGrid);
  const toggleSnapToGrid = useCanvasStore((state) => state.toggleSnapToGrid);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const toggleShowGrid = useCanvasStore((state) => state.toggleShowGrid);
  const resetViewport = useCanvasStore((state) => state.resetViewport);

  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) =>
    typeof state.canUndo === 'function' ? (state.canUndo as () => boolean)() : Boolean(state.canUndo)
  );
  const canRedo = useCanvasStore((state) =>
    typeof state.canRedo === 'function' ? (state.canRedo as () => boolean)() : Boolean(state.canRedo)
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isFigmaModalOpen, setIsFigmaModalOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);

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

  const canonicalPaletteIds: PaletteId[] = ['lavender', 'peach-mint', 'turquoise-purple'];

  return (
    <header
      role="toolbar"
      aria-label="Studio toolbar"
      aria-controls="isometric-canvas"
      {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
      className="h-13 border-b border-[var(--border)] bg-[var(--bg)] px-2 sm:px-3 lg:px-4 flex items-center justify-between gap-1.5 sm:gap-2 select-none z-20 shrink-0 overflow-x-auto no-scrollbar"
    >
      {/* 1. Brand & Logo */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
          ISO
        </div>
        <div className="hidden lg:block">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-[var(--fg)] tracking-tight leading-none whitespace-nowrap">
              <span className="hidden xl:inline">Isometric Cover Builder</span>
              <span className="xl:hidden">Cover Builder</span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--fg-2)] font-medium border border-[var(--border)]">
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Prominent First-Class Canvas Format Selector */}
      <div
        role="group"
        aria-label="Canvas format selection"
        className="flex items-center bg-[var(--surface)] dark:bg-zinc-900/90 p-0.5 rounded-lg border border-[var(--border)] dark:border-zinc-800 shrink-0"
      >
        {FORMAT_OPTIONS.map((opt) => {
          const isActive = format === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFormat(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs font-semibold ring-1 ring-[var(--border)] dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                  : 'text-[var(--fg-2)] hover:text-[var(--fg)] hover:bg-[var(--bg)]/40 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
              title={`Формат ${opt.label} (${opt.dims})`}
              aria-label={`Формат ${opt.label} (${opt.dims})`}
            >
              <span className="font-semibold whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Nicely Grouped Palette Pills */}
      <div className="flex items-center gap-1 bg-[var(--surface)] dark:bg-zinc-900/90 p-0.5 rounded-lg border border-[var(--border)] dark:border-zinc-800 shrink-0">
        {canonicalPaletteIds.map((palId) => {
          const cfg = PALETTE_PRESETS[palId];
          if (!cfg) return null;
          const isActive = paletteId === palId;
          return (
            <button
              key={palId}
              type="button"
              onClick={() => setPalette(palId)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs font-semibold ring-1 ring-[var(--border)] dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                  : 'text-[var(--fg-2)] hover:text-[var(--fg)] dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              title={`Палитра: ${cfg.name}`}
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
              <span className="hidden 2xl:inline text-[11px] whitespace-nowrap">{cfg.name}</span>
            </button>
          );
        })}

        {customPalette && (
          <button
            type="button"
            onClick={() => setPalette(customPalette.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              paletteId === customPalette.id
                ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs font-semibold ring-1 ring-[var(--border)] dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                : 'text-[var(--fg-2)] hover:text-[var(--fg)] dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
            title={`Палитра: ${customPalette.name}`}
            aria-label={`Палитра ${customPalette.name}`}
          >
            <div className="flex -space-x-1 items-center">
              {customPalette.figmaSwatches.map((color, idx) => (
                <span
                  key={idx}
                  className="w-2.5 h-2.5 rounded-full border border-[var(--border)] shadow-2xs"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="hidden 2xl:inline text-[11px] whitespace-nowrap max-w-[84px] truncate">
              {customPalette.name}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsPaletteModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] hover:bg-[var(--bg)]/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          title="Загрузить свою палитру"
          aria-label="Загрузить свою палитру"
        >
          <Upload className="w-3 h-3" />
          <span className="whitespace-nowrap">Загрузить</span>
        </button>
      </div>

      {/* 4. Tools: Undo/Redo, Grid, Snap, Viewport */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
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

        <div className="h-4 w-px bg-[var(--border)] mx-0.5" />

        <button
          type="button"
          onClick={() => toggleShowGrid()}
          aria-pressed={showGrid ? 'true' : 'false'}
          className={`p-1.5 rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer ${
            showGrid
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
              : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
          }`}
          title="Отображение изометрической 30° сетки"
          aria-label="Отображение изометрической 30° сетки"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => toggleSnapToGrid()}
          aria-pressed={snapToGrid ? 'true' : 'false'}
          className={`p-1.5 rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer ${
            snapToGrid
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
              : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
          }`}
          title="Привязка к узлам изосетки"
          aria-label="Привязка к узлам изосетки"
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => resetViewport()}
          className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-2)] hover:bg-[var(--surface)] hover:text-[var(--fg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
          title="Сбросить масштаб и положение холста"
          aria-label="Сбросить масштаб и положение холста"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Figma Integration & Export Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeToggle />

        <button
          type="button"
          onClick={() => (onOpenFigmaModal ? onOpenFigmaModal() : setIsFigmaModalOpen(true))}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-[var(--border)] dark:border-zinc-800 bg-[var(--surface)] dark:bg-zinc-900 hover:bg-[var(--bg)] dark:hover:bg-zinc-800 text-[var(--fg)] dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] shrink-0"
          title="Интеграция с Figma: копирование вектора или скачивание плагина"
          aria-label="Плагин Figma"
        >
          <Figma className="w-3.5 h-3.5" style={{ color: '#F24E1E' }} />
          <span className="hidden xl:inline">Плагин Figma</span>
        </button>

        {/* Export Button & Popover */}
        <div className="relative shrink-0">
          <div className="flex rounded-lg shadow-xs">
            <button
              type="button"
              onClick={handleExportSvg}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-[var(--accent)] dark:bg-zinc-100 text-[var(--bg)] dark:text-zinc-900 hover:opacity-90 dark:hover:bg-white px-2.5 sm:px-3 py-1.5 rounded-l-lg text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] whitespace-nowrap"
              title="Экспорт чистого SVG вектора с подстановкой цветов для Figma"
              aria-label="Экспорт SVG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Экспорт...' : 'Экспорт SVG'}</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              popoverTarget="export-popover"
              {...({ popovertarget: 'export-popover' } as any)}
              className="export-anchor bg-[var(--accent)] dark:bg-zinc-100 text-[var(--bg)] dark:text-zinc-900 hover:opacity-90 dark:hover:bg-white px-1.5 py-1.5 rounded-r-lg border-l border-[var(--bg)]/20 dark:border-zinc-300 transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              title="Дополнительные опции экспорта"
              aria-label="Опции экспорта"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

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
      </div>

      {!onOpenFigmaModal && (
        <FigmaIntegrationModal isOpen={isFigmaModalOpen} onClose={() => setIsFigmaModalOpen(false)} />
      )}
      <PaletteUploadModal isOpen={isPaletteModalOpen} onClose={() => setIsPaletteModalOpen(false)} />
    </header>
  );
};
