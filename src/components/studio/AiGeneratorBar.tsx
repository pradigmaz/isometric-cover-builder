import React, { useState } from 'react';
import { Sparkles, Dices, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { LayoutMode, PaletteId } from '../../types/schema';
import { PALETTE_PRESETS } from '../../config/palettes';
import { useCanvasStore } from '../../store/canvasStore';

const PROMPT_PRESETS = [
  'Микросервисная архитектура и системная интеграция',
  'Финтех стартап: мобильный банк, кэшбэк и карты',
  'UX/UI дизайн мобильного приложения нового поколения',
  'Подкаст о фокусе, продуктивности и привычках',
  'Уютный лайфстайл, баланс жизни и защита от выгорания',
  'Креативный копирайтинг и редакторские стандарты',
];

const LAYOUT_MODES: Array<{ id: LayoutMode; label: string; desc: string }> = [
  { id: 'headline', label: 'Под заголовок', desc: 'Свободное место под крупную типографику' },
  { id: 'offset', label: 'Диагональ', desc: 'Динамический шлейф вдоль 30° изометрической оси' },
  { id: 'centered', label: 'Собрано', desc: 'Плотный сбалансированный центральный кластер' },
];

export const AiGeneratorBar: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  const layoutMode = useCanvasStore((state) => state.layoutMode);
  const setLayoutMode = useCanvasStore((state) => state.setLayoutMode);
  const paletteId = useCanvasStore((state) => state.paletteId);
  const setPalette = useCanvasStore((state) => state.setPalette);
  const includeBackgrounds = useCanvasStore((state) => state.includeBackgrounds);
  const setIncludeBackgrounds = useCanvasStore((state) => state.setIncludeBackgrounds);
  const isGenerating = useCanvasStore((state) => state.isGenerating);
  const generateCover = useCanvasStore((state) => state.generateCover);

  const handleGenerate = async (customPrompt?: string) => {
    const text = (customPrompt ?? promptText).trim();
    if (!text && !customPrompt) return;
    try {
      await generateCover({
        prompt: text || 'Изометрическая иллюстрация',
        layoutMode,
        paletteId,
        includeBackgrounds,
        seed: Math.floor(Math.random() * 100000),
      });
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleReroll = async () => {
    try {
      await generateCover({
        prompt: promptText.trim() || 'Изометрическая композиция',
        layoutMode,
        paletteId,
        includeBackgrounds,
        seed: Math.floor(Math.random() * 100000),
      });
    } catch (err) {
      console.error('Re-roll failed:', err);
    }
  };

  const handlePresetClick = (preset: string) => {
    setPromptText(preset);
    handleGenerate(preset);
  };

  return (
    <div className="w-full bg-white border-b border-stone-200 px-4 py-2.5 z-10 shadow-2xs">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Main Input Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prompt Field */}
          <div className="flex-1 min-w-[280px] relative">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="Опишите тему статьи или метафору (например: Финтех, мобильный банк и кэшбэк)..."
              disabled={isGenerating}
              className="w-full text-xs pl-3.5 pr-20 py-2 rounded-lg border border-stone-300 bg-stone-50/60 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-800 transition-all"
            />
            {promptText && (
              <button
                type="button"
                onClick={() => setPromptText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-[11px] px-1 py-0.5 rounded"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Layout Mode Selector */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-medium">
            {LAYOUT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setLayoutMode(mode.id)}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  layoutMode === mode.id
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Background Ghosts Toggle */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs text-stone-700 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={includeBackgrounds}
              onChange={(e) => setIncludeBackgrounds(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-stone-900 focus:ring-stone-500 accent-stone-900"
            />
            <span className="text-[11px] font-medium">Силуэты</span>
          </label>

          {/* Palette Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
            >
              <div className="flex -space-x-1 items-center">
                {PALETTE_PRESETS[paletteId].figmaSwatches.map((swatch, idx) => (
                  <span
                    key={idx}
                    className="w-2 h-2 rounded-full border border-stone-300"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <span className="text-[11px]">{PALETTE_PRESETS[paletteId].name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showPaletteMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white border border-stone-200 shadow-lg py-1 z-30 text-xs">
                {(['warm-pastel', 'fresh-mint', 'soft-coral'] as PaletteId[]).map((pid) => {
                  const cfg = PALETTE_PRESETS[pid];
                  const isCur = paletteId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => {
                        setPalette(pid);
                        setShowPaletteMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-stone-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1 items-center">
                          {cfg.figmaSwatches.map((sw, idx) => (
                            <span
                              key={idx}
                              className="w-2 h-2 rounded-full border border-stone-300"
                              style={{ backgroundColor: sw }}
                            />
                          ))}
                        </div>
                        <span className="text-stone-800">{cfg.name}</span>
                      </div>
                      {isCur && <Check className="w-3 h-3 text-stone-800" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons: Generate & Re-roll */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !promptText.trim()}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isGenerating ? 'Генерация...' : 'Сгенерировать'}</span>
            </button>

            <button
              type="button"
              onClick={handleReroll}
              disabled={isGenerating}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs disabled:opacity-50"
              title="Сгенерировать другой вариант с новым случайным сидом"
            >
              <Dices className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        {/* Preset Chips Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] pt-0.5">
          <span className="text-stone-400 font-medium whitespace-nowrap">Примеры:</span>
          {PROMPT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200/80 text-stone-600 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
