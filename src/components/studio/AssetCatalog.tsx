import React, { useState, useMemo } from 'react';
import { Search, Plus, Layers, Box, Sparkles } from 'lucide-react';
import { getAllAssets } from '../../assets/registry';
import type { AssetId, AssetSize } from '../../types/schema';
import { useCanvasStore } from '../../store/canvasStore';

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

export const AssetCatalog: React.FC = () => {
  const [activeSize, setActiveSize] = useState<AssetSize>('L');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const addItem = useCanvasStore((state) => state.addItem);

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
      className="w-72 md:w-80 h-full flex flex-col border-r border-stone-200 bg-stone-50/90 backdrop-blur-sm select-none z-10"
      aria-label="Каталог векторных ассетов"
    >
      {/* Заголовок панели */}
      <div className="p-3.5 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-700" />
          <h2 className="text-sm font-semibold text-stone-800 tracking-tight">Каталог ассетов</h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 font-medium">
          10 ассетов
        </span>
      </div>

      {/* Переключатель размеров L / S */}
      <div className="p-3 border-b border-stone-200 bg-white/70">
        <div className="flex rounded-lg bg-stone-200/80 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSize('L')}
            className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeSize === 'L'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Крупный доминирующий объект (600×600 px)"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Размер L (Hero)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSize('S')}
            className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeSize === 'S'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Компактный сателлит (200×200 px)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Размер S (Деталь)</span>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-stone-500 text-center">
          {activeSize === 'L'
            ? '600×600 px • Центральная фигура композиции'
            : '200×200 px • Вспомогательные акценты и шлейфы'}
        </p>
      </div>

      {/* Поиск */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или тегу..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-stone-300 bg-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 transition-colors"
          />
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="px-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-stone-800 text-white font-medium'
                : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Список ассетов */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredAssets.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center text-stone-400 text-xs">
            <p>Ничего не найдено</p>
            <p className="text-[10px] text-stone-400 mt-1">Попробуйте изменить поисковый запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredAssets.map(({ metadata, Component }) => {
              const isHeroSuit = metadata.heroSuitability >= 0.85;

              return (
                <div
                  key={metadata.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, metadata.id)}
                  onClick={() => handleAddClick(metadata.id)}
                  className="group relative flex flex-col items-center p-2.5 rounded-lg border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                  title={`Кликните для добавления или перетащите на холст (${metadata.nameRu})`}
                >
                  {/* Бейджик Hero suitability */}
                  {isHeroSuit && activeSize === 'L' && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-medium">
                      Hero
                    </span>
                  )}

                  {/* SVG Thumbnail */}
                  <div className="w-16 h-16 flex items-center justify-center relative my-1 overflow-visible">
                    <Component
                      size={activeSize}
                      className="w-full h-full drop-shadow-xs transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* Подписи */}
                  <div className="w-full mt-1.5 text-center">
                    <div className="text-xs font-semibold text-stone-800 truncate">
                      {metadata.nameRu}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      {metadata.nameEn}
                    </div>
                  </div>

                  {/* Кнопка добавления по наведению */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick(metadata.id);
                    }}
                    className="mt-2 w-full py-1 text-[11px] rounded bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-700 font-medium flex items-center justify-center gap-1 transition-colors"
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
      <div className="p-2.5 border-t border-stone-200 bg-white/50 text-[11px] text-stone-500 flex items-center justify-between">
        <span>Перетащите объект на холст</span>
        <span className="text-stone-400 font-mono text-[10px]">30° изометрия</span>
      </div>
    </aside>
  );
};
