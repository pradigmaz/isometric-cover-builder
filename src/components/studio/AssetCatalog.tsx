import React, { useState, useMemo } from 'react';
import { Search, Plus, Layers, Box, Sparkles } from 'lucide-react';
import { getAllAssets } from '../../assets/registry';
import type { AssetId, AssetSize } from '../../types/schema';
import { useCanvasStore } from '../../store/canvasStore';
import { getPaletteConfig, getCssTokensStyle } from '../../config/palettes';

type FilterCategory = 'all' | 'finance' | 'tech' | 'work' | 'lifestyle' | 'creativity';

interface CategoryOption {
  id: FilterCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'Все' },
  { id: 'finance', label: 'Финансы' },
  { id: 'tech', label: 'Технологии' },
  { id: 'work', label: 'Работа' },
  { id: 'lifestyle', label: 'Лайфстайл' },
  { id: 'creativity', label: 'Творчество' },
];

const CATEGORY_NAMES_RU: Record<string, string> = {
  finance: 'Финансы',
  tech: 'Технологии',
  work: 'Работа',
  lifestyle: 'Лайфстайл',
  creativity: 'Творчество',
};

export interface AssetCatalogProps {
  className?: string;
}

export const AssetCatalog: React.FC<AssetCatalogProps> = ({ className }) => {
  const [activeSize, setActiveSize] = useState<AssetSize>('L');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const addItem = useCanvasStore((state) => state.addItem);
  const paletteId = useCanvasStore((state) => state.paletteId);
  const activePalette = useMemo(() => getPaletteConfig(paletteId), [paletteId]);
  const previewTokensStyle = useMemo(
    () => getCssTokensStyle(activePalette.tokens) as React.CSSProperties,
    [activePalette.tokens]
  );

  const allEntries = useMemo(() => getAllAssets(), []);

  const filteredAssets = useMemo(() => {
    return allEntries.filter((entry) => {
      const { metadata } = entry;
      const matchesCategory = selectedCategory === 'all' || metadata.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesQuery =
        metadata.nameRu.toLowerCase().includes(q) ||
        metadata.nameEn.toLowerCase().includes(q) ||
        metadata.keywords.some((kw) => kw.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [allEntries, selectedCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent, assetId: AssetId) => {
    const payload = JSON.stringify({ assetId, size: activeSize });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddClick = (assetId: AssetId) => {
    addItem(assetId, activeSize, 'foreground');
  };

  return (
    <aside
      className={
        className
          ? `${className} flex flex-col bg-stone-50/90 dark:bg-zinc-900 select-none z-10`
          : 'w-72 md:w-80 h-full flex flex-col border-r border-stone-200 dark:border-zinc-800 bg-stone-50/90 dark:bg-zinc-900 backdrop-blur-sm select-none z-10'
      }
      aria-label="Каталог векторных ассетов"
    >
      {/* Заголовок панели */}
      <div className="p-3.5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold text-stone-800 dark:text-zinc-100 tracking-tight">Каталог ассетов</h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 font-medium">
          10 ассетов
        </span>
      </div>

      {/* Переключатель размеров L / S */}
      <div className="p-3 border-b border-stone-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70">
        <div className="flex rounded-lg bg-stone-200/80 dark:bg-zinc-800 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSize('L')}
            aria-label="Выбрать размер L (Главный, 600×600 px)"
            className={`h-9 flex-1 px-1.5 rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 ${
              activeSize === 'L'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-stone-700 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
            }`}
            title="Крупный доминирующий объект (600×600 px)"
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Размер L (Главный)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSize('S')}
            aria-label="Выбрать размер S (Деталь, 200×200 px)"
            className={`h-9 flex-1 px-1.5 rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 ${
              activeSize === 'S'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-stone-700 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
            }`}
            title="Компактный сателлит (200×200 px)"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Размер S (Деталь)</span>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-stone-600 dark:text-zinc-400 text-center">
          {activeSize === 'L'
            ? '600×600 px • Центральная фигура композиции'
            : '200×200 px • Вспомогательные акценты и шлейфы'}
        </p>
      </div>

      {/* Поиск */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--fg-2)] dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или тегу..."
            aria-label="Поиск по названию или тегу"
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[var(--border)] dark:border-zinc-700 bg-[var(--bg)] dark:bg-zinc-800 text-[var(--fg)] dark:text-zinc-100 placeholder-[var(--fg-2)] dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            aria-label={`Фильтр: ${cat.label}`}
            aria-pressed={selectedCategory === cat.id}
            className={`whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 ${
              selectedCategory === cat.id
                ? 'bg-[var(--accent)] text-[var(--bg)] font-medium shadow-2xs'
                : 'bg-[var(--surface)] dark:bg-zinc-800 text-[var(--fg-2)] dark:text-zinc-300 hover:bg-[var(--border)] dark:hover:bg-zinc-700 hover:text-[var(--fg)] dark:hover:text-zinc-100 font-medium'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Список ассетов */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredAssets.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center text-stone-500 text-xs">
            <p className="font-medium">Ничего не найдено</p>
            <p className="text-[10px] text-stone-500 mt-1">Попробуйте изменить поисковый запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredAssets.map(({ metadata, Component }) => {
              const isHeroSuit = metadata.heroSuitability >= 0.85;

              return (
                <div
                  key={metadata.id}
                  tabIndex={0}
                  role="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, metadata.id)}
                  onClick={() => handleAddClick(metadata.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAddClick(metadata.id);
                    }
                  }}
                  aria-label={`Добавить ${metadata.nameRu} (${metadata.nameEn}) на холст`}
                  className="group relative flex flex-col items-center p-2.5 rounded-lg border border-[var(--border)] dark:border-zinc-800 bg-[var(--surface)] dark:bg-zinc-950 hover:border-[var(--fg-2)] dark:hover:border-zinc-600 hover:shadow-xs transition-all cursor-pointer active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                  title={`Кликните для добавления или перетащите на холст (${metadata.nameRu})`}
                >
                  {/* Бейджик Hero suitability */}
                  {isHeroSuit && activeSize === 'L' && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] px-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/40">
                      Главный
                    </span>
                  )}

                  {/* SVG Thumbnail with active palette token style */}
                  <div
                    className="w-16 h-16 flex items-center justify-center relative my-1 overflow-visible"
                    style={previewTokensStyle}
                  >
                    <Component
                      size={activeSize}
                      className="w-full h-full drop-shadow-xs transition-transform group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>

                  {/* Подписи */}
                  <div className="w-full mt-1.5 text-center">
                    <div className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                      {metadata.nameRu}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium truncate">
                      {CATEGORY_NAMES_RU[metadata.category] ?? metadata.category}
                    </div>
                  </div>

                  {/* Кнопка добавления по наведению */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick(metadata.id);
                    }}
                    aria-label={`Добавить ${metadata.nameRu} на холст`}
                    className="mt-2 w-full py-1 text-[11px] rounded bg-stone-100 dark:bg-zinc-800 group-hover:bg-stone-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 text-stone-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Добавить</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Футер каталога */}
      <div className="p-2.5 border-t border-stone-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[11px] text-stone-600 dark:text-zinc-400 flex items-center justify-between">
        <span>Перетащите объект на холст</span>
        <span className="text-stone-500 dark:text-zinc-500 font-mono text-[10px]">30° изометрия</span>
      </div>
    </aside>
  );
};
