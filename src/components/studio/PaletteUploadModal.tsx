import React, { useState } from 'react';
import { Palette, Sparkles, X } from 'lucide-react';
import { SAMPLE_PALETTES, createCustomPalette } from '../../config/palettes';
import { useCanvasStore } from '../../store/canvasStore';

interface PaletteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaletteUploadModal: React.FC<PaletteUploadModalProps> = ({ isOpen, onClose }) => {
  const setCustomPalette = useCanvasStore((state) => state.setCustomPalette);
  const [rawHexInput, setRawHexInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLiveRecolor = (val: string) => {
    setRawHexInput(val);
    if (!val.trim()) {
      setInputError(null);
      return;
    }
    try {
      const palette = createCustomPalette(val, 'Моя палитра');
      setCustomPalette(palette);
      setInputError(null);
    } catch (err: any) {
      setInputError(err?.message || 'Не удалось распознать HEX-цвета');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="palette-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl p-5 space-y-4 text-xs text-[var(--fg)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 id="palette-modal-title" className="text-sm font-bold text-[var(--fg)]">
                Загрузить цветовую палитру
              </h3>
              <p className="text-[11px] text-[var(--fg-2)]">
                Мгновенная авто-перекраска композиции холста
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

        {/* Quick Demo Presets */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--fg-2)] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            Быстрые демонстрационные палитры:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['cyberpunk', 'autumn'] as const).map((key) => {
              const sample = SAMPLE_PALETTES[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCustomPalette(sample);
                    setRawHexInput(sample.figmaSwatches.join(', '));
                    setInputError(null);
                  }}
                  title={`Демонстрационная палитра: ${key === 'cyberpunk' ? 'Киберпанк' : 'Осенний лес'}`}
                  className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-all cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="font-medium text-xs">{sample.name}</span>
                  <div className="flex -space-x-1 items-center">
                    {sample.figmaSwatches.map((c, i) => (
                      <span
                        key={i}
                        className="w-3 h-3 rounded-full border border-[var(--border)]"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea Input */}
        <div className="space-y-1.5">
          <label htmlFor="hex-palette-input" className="block text-[11px] font-semibold text-[var(--fg-2)]">
            HEX-цвета или JSON-токены:
          </label>
          <textarea
            id="hex-palette-input"
            rows={3}
            value={rawHexInput}
            onChange={(e) => handleLiveRecolor(e.target.value)}
            placeholder="#0F111A, #00F0FF, #FF0055, #FFE600&#10;или JSON { &quot;bg&quot;: &quot;...&quot;, &quot;primary&quot;: &quot;...&quot; }"
            className="w-full font-mono text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] focus:outline-2 focus:outline-[var(--accent)] resize-none"
          />
          {inputError ? (
            <p className="text-[11px] text-rose-500">{inputError}</p>
          ) : (
            <p className="text-[10px] text-[var(--fg-2)]">
              Вставьте HEX через запятую или JSON-токены. Перекраска холста происходит мгновенно.
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] font-semibold text-xs cursor-pointer hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
