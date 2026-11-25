import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Dices, RefreshCw, Search, Bookmark, Trash2, Plus, Check, X, Layers, CopyPlus } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { loadUserTemplates, saveUserTemplate, deleteUserTemplate, UserTemplate } from '../../engine/templates';
import { AssetId, CanvasItem } from '../../types/schema';

const SCENARIO_1_PRESETS = [
  'Финтех и безопасность',
  'UX/UI дизайн мобильного банка',
  'Креативная стратегия и копирайтинг',
  'Дистанционная учёба и курсы',
  'Подкаст о продуктивности и фокусе',
  'Корпоративные финансы и отчётность',
];

const SCENARIO_2_PRESETS = [
  'книга, телефон',
  'папка, кошелёк, монета',
  'наушники, цветы',
  'лампа, кошелёк, монета',
  'книга, пазл, ручка',
  'телефон, пазл',
];

const LIBRARY_ASSETS: { id: AssetId; label: string; nameRu: string }[] = [
  { id: 'notepad', label: 'книга', nameRu: 'Книга' },
  { id: 'folder', label: 'папка', nameRu: 'Папка' },
  { id: 'lamp', label: 'лампа', nameRu: 'Лампа' },
  { id: 'flowers_vase', label: 'ваза', nameRu: 'Ваза' },
  { id: 'smartphone', label: 'телефон', nameRu: 'Телефон' },
  { id: 'headphones', label: 'наушники', nameRu: 'Наушники' },
  { id: 'wallet', label: 'кошелёк', nameRu: 'Кошелёк' },
  { id: 'coin', label: 'монета', nameRu: 'Монета' },
  { id: 'pen', label: 'ручка', nameRu: 'Ручка' },
  { id: 'puzzle', label: 'пазлы', nameRu: 'Пазлы' },
];

export interface AiGeneratorBarProps {
  className?: string;
}

export const AiGeneratorBar: React.FC<AiGeneratorBarProps> = ({ className = '' }) => {
  const [activeScenario, setActiveScenario] = useState<1 | 2>(1);
  const [scenario1Prompt, setScenario1Prompt] = useState('');
  const [scenario2Prompt, setScenario2Prompt] = useState('');
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  const {
    items, selectedUids = [], format, paletteId, layoutMode, includeBackgrounds,
    setFormat, setPalette, setLayoutMode, setIncludeBackgrounds, setItems, selectGroup, isGenerating, generateCover,
  } = useCanvasStore();

  useEffect(() => { setTemplates(loadUserTemplates()); }, []);

  const selectedItems = useMemo(() => items.filter((it) => selectedUids.includes(it.uid)), [items, selectedUids]);
  const hasSelectedGroup = selectedItems.length > 0;

  const handleGenerate = async (customText?: string) => {
    const rawText = customText ?? (activeScenario === 1 ? scenario1Prompt : scenario2Prompt);
    const text = rawText.trim();
    if (!text && !customText) return;
    try {
      await generateCover({
        prompt: text || 'Изометрическая иллюстрация',
        layoutMode,
        paletteId: paletteId.startsWith('custom') ? paletteId : 'auto',
        includeBackgrounds,
        seed: Math.floor(Math.random() * 1000000) + 1,
      });
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleReroll = async () => {
    const rawText = activeScenario === 1 ? scenario1Prompt : scenario2Prompt;
    const fallback = activeScenario === 1 ? 'Финтех и безопасность' : 'папка, кошелёк, монета';
    const activeText = rawText.trim() || fallback;
    const layoutOrder: Array<'centered' | 'offset' | 'headline'> = ['centered', 'offset', 'headline'];
    const nextLayout = layoutOrder[(layoutOrder.indexOf(layoutMode) + 1) % layoutOrder.length];
    try {
      await generateCover({
        prompt: activeText,
        layoutMode: nextLayout,
        paletteId: paletteId.startsWith('custom') ? paletteId : 'auto',
        includeBackgrounds,
        seed: Math.floor(Math.random() * 1000000) + 1,
      });
    } catch (err) {
      console.error('Re-roll failed:', err);
    }
  };

  const handleToggleAssetTag = (label: string) => {
    const parts = scenario2Prompt.split(',').map((s) => s.trim()).filter(Boolean);
    const exists = parts.some((p) => p.toLowerCase() === label.toLowerCase());
    setScenario2Prompt(exists ? parts.filter((p) => p.toLowerCase() !== label.toLowerCase()).join(', ') : [...parts, label].join(', '));
  };

  const handleSaveTemplateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetItems = hasSelectedGroup ? selectedItems : items;
    if (!targetItems.length) return;
    const defaultName = hasSelectedGroup ? `Группа (${targetItems.length} шт.)` : `Шаблон #${templates.length + 1}`;
    const name = templateNameInput.trim() || defaultName;
    saveUserTemplate({ name, format, paletteId, layoutMode, items: targetItems });
    setTemplates(loadUserTemplates());
    setTemplateNameInput('');
    setIsSavingTemplate(false);
  };

  const handleApplyTemplate = (tmpl: UserTemplate) => {
    setItems(tmpl.items.map((it) => ({ ...it })));
    if (tmpl.format) setFormat(tmpl.format);
    if (tmpl.paletteId) setPalette(tmpl.paletteId);
    if (tmpl.layoutMode) setLayoutMode(tmpl.layoutMode);
    selectGroup(tmpl.items.map((it) => it.uid));
  };

  const handleInsertTemplate = (tmpl: UserTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: CanvasItem[] = tmpl.items.map((it) => ({
      ...it,
      uid: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: it.x + 48,
      y: it.y + 24,
    }));
    setItems([...items, ...cloned]);
    selectGroup(cloned.map((c) => c.uid));
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates(deleteUserTemplate(id));
  };

  const currentPromptValue = activeScenario === 1 ? scenario1Prompt : scenario2Prompt;
  const setCurrentPromptValue = activeScenario === 1 ? setScenario1Prompt : setScenario2Prompt;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 select-none ${className}`}>
      {/* 1. Header with Title & Random Re-roll Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-wider">Генератор композиций</h2>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">Сценарии 1 & 2 (Figma Frame 1)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReroll}
          disabled={isGenerating}
          className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          title="Перебросить вариант со случайным сидом"
        >
          <Dices className="w-3.5 h-3.5 text-stone-600 dark:text-zinc-300" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Scenario Tabs (Figma Frame 1) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-stone-100 dark:bg-zinc-800 rounded-lg border border-stone-200/80 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveScenario(1)}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center text-xs cursor-pointer truncate ${
                activeScenario === 1 ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              Сценарий 1: Метафора
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario(2)}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center text-xs cursor-pointer truncate ${
                activeScenario === 2 ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              Сценарий 2: Компоненты
            </button>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-snug px-0.5">
            {activeScenario === 1
              ? 'Задайте заголовок или метафору — сервис сам подберёт гармоничные объекты.'
              : 'Вбивайте названия нужных компонентов — сервис скомпонует их на столе.'}
          </p>
        </div>

        {/* 10 Registered Components Explanation & Interactive Chips (Scenario 2 only) */}
        {activeScenario === 2 && (
          <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-900/90 border border-stone-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-800 dark:text-zinc-200">
              <span>Компоненты библиотеки (10 векторных ассетов):</span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 leading-tight">
              Итоговая композиция состоит только из этих 10 объектов. Кликните для добавления:
            </p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {LIBRARY_ASSETS.map((asset) => {
                const normalizedPrompt = scenario2Prompt.toLowerCase().replace(/ё/g, 'е');
                const normalizedLabel = asset.label.replace(/ё/g, 'е');
                const isSelected = asset.id === 'puzzle'
                  ? normalizedPrompt.includes('пазл')
                  : normalizedPrompt.includes(normalizedLabel);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleToggleAssetTag(asset.label)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)] font-semibold shadow-2xs'
                        : 'bg-[var(--surface)] dark:bg-zinc-800 hover:bg-[var(--border)] dark:hover:bg-zinc-700 text-[var(--fg)] dark:text-zinc-200 border-[var(--border)] dark:border-zinc-700/80'
                    }`}
                    title={`Добавить ${asset.nameRu} в запрос`}
                  >
                    {isSelected ? `✓ ${asset.nameRu}` : `+ ${asset.nameRu}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input & Generate Box */}
        <div className="space-y-2">
          <div className="flex flex-col rounded-lg border border-[var(--border)] dark:border-zinc-700 bg-[var(--bg)] dark:bg-zinc-900 hover:border-[var(--fg-2)] dark:hover:border-zinc-600 focus-within:border-[var(--accent)] focus-within:bg-white dark:focus-within:bg-zinc-900 transition-colors overflow-hidden">
            <div className="flex items-center px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-[var(--fg-2)] dark:text-zinc-500 mr-2 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={currentPromptValue}
                onChange={(e) => setCurrentPromptValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder={activeScenario === 1 ? '«Финтех и безопасность», «UX дизайн»...' : '«книга, телефон», «папка, кошелёк»...'}
                disabled={isGenerating}
                className="flex-1 min-w-0 text-xs py-1 bg-transparent text-[var(--fg)] dark:text-zinc-100 placeholder-[var(--fg-2)] dark:placeholder-zinc-500 focus:outline-none"
              />
              {currentPromptValue && (
                <button type="button" onClick={() => setCurrentPromptValue('')} className="text-[var(--fg-2)] dark:text-zinc-500 hover:text-[var(--fg)] dark:hover:text-zinc-300 p-0.5 rounded cursor-pointer" title="Очистить">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="p-1 border-t border-[var(--border)] dark:border-zinc-800 bg-[var(--surface)] dark:bg-zinc-900/50 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !currentPromptValue.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                title="Сгенерировать композицию по текущему запросу"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-500" />}
                <span>{isGenerating ? 'Генерация...' : 'Сгенерировать'}</span>
              </button>
              <button
                type="button"
                onClick={handleReroll}
                disabled={isGenerating}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                title="Перебросить вариант со случайным сидом"
              >
                <Dices className="w-3.5 h-3.5 text-stone-600 dark:text-zinc-400" />
                <span>Другой вариант</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {(activeScenario === 1 ? SCENARIO_1_PRESETS : SCENARIO_2_PRESETS).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                data-scenario2-chip={activeScenario === 2 ? preset : undefined}
                onClick={() => { setCurrentPromptValue(preset); handleGenerate(preset); }}
                className="px-2.5 py-1 rounded-full bg-[var(--surface)] dark:bg-zinc-800 hover:bg-[var(--border)] dark:hover:bg-zinc-700 text-[var(--fg)] dark:text-zinc-200 border border-[var(--border)] dark:border-zinc-700 transition-colors cursor-pointer text-[11px] font-medium"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Компоновка (3 варианта раскладки) */}
        <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-zinc-400">
            <span className="font-semibold text-stone-800 dark:text-zinc-200">Компоновка</span>
            <span className="text-[11px] text-stone-500 dark:text-zinc-400">3 варианта раскладки</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { mode: 'centered', label: 'Собрано', sub: 'По центру' },
              { mode: 'offset', label: 'Со смещением', sub: 'Диагональ' },
              { mode: 'headline', label: 'Под заголовок', sub: 'Свободное поле' },
            ] as const).map(({ mode, label, sub }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLayoutMode(mode)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${layoutMode === mode
                  ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)] shadow-2xs font-semibold'
                  : 'bg-[var(--surface)] dark:bg-zinc-800 hover:bg-[var(--border)] dark:hover:bg-zinc-700 text-[var(--fg)] dark:text-zinc-300 border-[var(--border)] dark:border-zinc-700'}`}
              >
                <div className="font-semibold text-xs leading-tight">{label}</div>
                <div className="text-[10px] text-stone-400 dark:text-zinc-400 leading-tight">{sub}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-xs">
            <span className="font-medium text-stone-700 dark:text-zinc-300">Фоновый силуэт</span>
            <button
              type="button"
              onClick={() => setIncludeBackgrounds(!includeBackgrounds)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer border ${includeBackgrounds
                ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)] shadow-2xs'
                : 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-300 dark:border-zinc-700'}`}
            >
              {includeBackgrounds ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>
        </div>

        {/* Section: «Мои шаблоны» (User Templates) */}
        <div className="space-y-2.5 pt-3 border-t border-stone-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300" />
              <span className="text-xs font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-wider">Мои шаблоны</span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">({templates.length})</span>
            </div>
            {!isSavingTemplate && (
              <button
                type="button"
                onClick={() => setIsSavingTemplate(true)}
                disabled={!items.length}
                className="flex items-center gap-1 text-[11px] font-semibold text-stone-800 dark:text-zinc-200 hover:text-stone-950 dark:hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
                title={hasSelectedGroup ? `Сохранить группу (${selectedItems.length} шт.) как шаблон` : 'Сохранить холст как шаблон'}
              >
                <Plus className="w-3 h-3" />
                <span>{hasSelectedGroup ? `Сохранить группу (${selectedItems.length})` : 'Сохранить'}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-snug px-0.5">
            Выделите группу объектов на холсте (рамкой или Shift+клик) и сохраните как отдельный шаблон.
          </p>

          {/* Save Template Prompt Form */}
          {isSavingTemplate && (
            <form onSubmit={handleSaveTemplateSubmit} className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="text-[11px] font-semibold text-stone-800 dark:text-zinc-200">
                {hasSelectedGroup ? `Сохранить группу (${selectedItems.length} шт.) как шаблон:` : 'Название нового шаблона:'}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder={hasSelectedGroup ? `Группа (${selectedItems.length} шт.)` : `Шаблон #${templates.length + 1}`}
                  className="flex-1 min-w-0 text-xs px-2.5 py-1 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-zinc-400"
                />
                <button type="submit" className="p-1.5 rounded-md bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-zinc-900 cursor-pointer shadow-2xs" title="Подтвердить сохранение">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => { setIsSavingTemplate(false); setTemplateNameInput(''); }} className="p-1.5 rounded-md bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 cursor-pointer" title="Отмена">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Templates List */}
          {templates.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-stone-200 dark:border-zinc-800 text-center space-y-1 bg-stone-50/50 dark:bg-zinc-900/50">
              <Layers className="w-4 h-4 text-stone-400 dark:text-zinc-500 mx-auto" />
              <p className="text-[11px] font-medium text-stone-600 dark:text-zinc-400">Нет сохранённых шаблонов</p>
              <p className="text-[10px] text-stone-400 dark:text-zinc-500 leading-relaxed">Выделите группу объектов или настройте обложку и нажмите «Сохранить».</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/90 hover:bg-stone-50/80 dark:hover:bg-zinc-800 transition-all cursor-pointer group flex items-center justify-between gap-2 shadow-2xs"
                  title="Кликните для применения шаблона на холст"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">{tmpl.name}</span>
                      <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 shrink-0">{tmpl.format}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-zinc-400 truncate mt-0.5">
                      {tmpl.assetSummary?.join(', ') || `${tmpl.itemCount} объектов`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleInsertTemplate(tmpl, e)}
                      className="flex items-center gap-0.5 px-2 py-1 rounded bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 text-[10px] font-medium transition-colors cursor-pointer"
                      title="Вставить группу объектов на текущий холст"
                    >
                      <CopyPlus className="w-3 h-3 text-stone-500 dark:text-zinc-400" />
                      <span>Вставить</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleApplyTemplate(tmpl); }}
                      className="px-2 py-1 rounded bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-zinc-900 text-[10px] font-medium transition-colors cursor-pointer"
                      title="Заменить холст этим шаблоном"
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                      className="p-1 rounded text-stone-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Удалить шаблон"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
