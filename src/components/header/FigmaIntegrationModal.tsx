import React, { useState } from 'react';
import { X, Copy, Download, Check, Figma, Sparkles } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { buildCleanSvgString } from '../../engine/exporter';

interface FigmaIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FigmaIntegrationModal: React.FC<FigmaIntegrationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'copy' | 'plugin'>('copy');
  const [copied, setCopied] = useState(false);
  const format = useCanvasStore((state) => state.format);
  const paletteId = useCanvasStore((state) => state.paletteId);

  if (!isOpen) return null;

  const handleCopyVector = async () => {
    const svgEl = document.querySelector<SVGSVGElement>('#isometric-canvas-svg');
    if (!svgEl) return;

    try {
      const cleanSvg = buildCleanSvgString(svgEl, {
        format,
        paletteId,
        inlineTokens: true,
      });
      await navigator.clipboard.writeText(cleanSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy clean SVG:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="figma-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl p-5 space-y-4 text-xs text-[var(--fg)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#0ACF83]/10 text-[#0ACF83]">
              <Figma className="w-4 h-4" />
            </div>
            <div>
              <h3 id="figma-modal-title" className="text-sm font-bold text-[var(--fg)]">
                Интеграция с Figma
              </h3>
              <p className="text-[11px] text-[var(--fg-2)]">
                Прямая вставка векторных обложек и нативный плагин для Figma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--surface)] text-[var(--fg-2)] hover:text-[var(--fg)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[var(--surface)] rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('copy')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'copy'
                ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs'
                : 'text-[var(--fg-2)] hover:text-[var(--fg)]'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Скопировать вектор (Ctrl+V)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plugin')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'plugin'
                ? 'bg-[var(--bg)] text-[var(--fg)] shadow-xs'
                : 'text-[var(--fg-2)] hover:text-[var(--fg)]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Скачать плагин (.zip)
          </button>
        </div>

        {/* Tab 1: Direct Copy */}
        {activeTab === 'copy' && (
          <div className="space-y-3 py-1">
            <p className="text-[var(--fg-2)] leading-relaxed">
              Скопируйте текущую композицию холста в чистом SVG-формате со всеми запечёнными токенами цвета и вставьте прямо во фрейм Figma через <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px]">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px]">Cmd+V</kbd>.
            </p>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--fg-2)]">Формат холста:</span>
                <span className="font-semibold text-[var(--fg)] uppercase">{format}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--fg-2)]">Цветовая схема:</span>
                <span className="font-semibold text-[var(--fg)]">{paletteId}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyVector}
              className="w-full py-2 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--bg)] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Скопировано в буфер обмена!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать SVG в буфер</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Plugin Download & 3 steps installation */}
        {activeTab === 'plugin' && (
          <div className="space-y-3 py-1">
            <p className="text-[var(--fg-2)] leading-relaxed">
              Полноценный нативный плагин Figma с поддержкой сценариев метафор, каталогом векторных элементов и прямой генерацией во фрейм.
            </p>

            <a
              href="/isometric-cover-builder-plugin.zip"
              download="isometric-cover-builder-plugin.zip"
              className="w-full py-2 px-4 rounded-lg bg-[#0ACF83] hover:bg-[#09B875] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs no-underline text-center"
            >
              <Download className="w-4 h-4" />
              <span>Скачать isometric-cover-builder-plugin.zip</span>
            </a>

            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
              <h4 className="font-bold text-[var(--fg)] text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                3 шага установки плагина в Figma:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--fg-2)] leading-relaxed">
                <li>
                  Распакуйте скачанный архив <strong className="text-[var(--fg)]">isometric-cover-builder-plugin.zip</strong> в любую удобную папку на компьютере.
                </li>
                <li>
                  В приложении Figma перейдите в меню: <strong className="text-[var(--fg)]">Plugins → Development → Import plugin from manifest...</strong>
                </li>
                <li>
                  Выберите файл <strong className="text-[var(--fg)]">manifest.json</strong> из распакованной папки. Плагин мгновенно появится в вашем списке разработки!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[var(--border)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--fg)] font-medium cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
