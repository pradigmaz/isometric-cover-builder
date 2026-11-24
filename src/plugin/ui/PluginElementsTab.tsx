import React, { useState, useMemo } from 'react';
import { ASSET_REGISTRY, getAssetVisualBounds } from '../../assets/registry';
import { AssetId, AssetSize, ItemRole } from '../../types/schema';
import { useCanvasStore } from '../../store/canvasStore';
import { getPaletteConfig, getCssTokensStyle } from '../../config/palettes';

export interface PluginElementsTabProps {
  selectedAssetSize: AssetSize;
  setSelectedAssetSize: (size: AssetSize) => void;
  selectedAssetRole: ItemRole;
  setSelectedAssetRole: (role: ItemRole) => void;
  onInsertAsset: (assetId: AssetId) => void;
}

type FilterCategory = 'all' | 'tech' | 'finance' | 'lifestyle' | 'creativity';

interface CategoryOption {
  id: FilterCategory;
  label: string;
}

const CATEGORY_FILTERS: CategoryOption[] = [
  { id: 'all', label: 'Все' },
  { id: 'tech', label: 'Технологии' },
  { id: 'finance', label: 'Финансы' },
  { id: 'lifestyle', label: 'Лайфстайл' },
  { id: 'creativity', label: 'Творчество' },
];

export const PluginElementsTab: React.FC<PluginElementsTabProps> = ({
  selectedAssetSize,
  setSelectedAssetSize,
  selectedAssetRole,
  setSelectedAssetRole,
  onInsertAsset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const paletteId = useCanvasStore((state) => state.paletteId);
  const activePalette = useMemo(() => getPaletteConfig(paletteId), [paletteId]);
  const previewTokensStyle = useMemo(
    () => getCssTokensStyle(activePalette.tokens) as React.CSSProperties,
    [activePalette.tokens]
  );

  const filteredAssetIds = useMemo(() => {
    return (Object.keys(ASSET_REGISTRY) as AssetId[]).filter((assetId) => {
      if (selectedCategory === 'all') return true;
      const cat = ASSET_REGISTRY[assetId]?.metadata.category;
      if (cat === selectedCategory) return true;
      // Group work assets (notepad, folder) under creativity filter so all 10 assets are accessible
      if (selectedCategory === 'creativity' && cat === 'work') return true;
      return false;
    });
  }, [selectedCategory]);

  return (
    <div className="flex-1 flex flex-col p-2.5 overflow-y-auto gap-2 text-xs">
      {/* Компактная панель управления (Размер L/S, Роль, Категории) */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-[#383838] shrink-0 text-[11px]">
        {/* Строка 1: Размер и Роль */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium text-[10px]">Размер:</span>
            <div className="inline-flex rounded bg-[#1e1e1e] p-0.5 border border-[#383838]">
              <button
                type="button"
                onClick={() => setSelectedAssetSize('L')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  selectedAssetSize === 'L'
                    ? 'bg-[#0d99ff] text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Большой размер (L)"
              >
                L (Большой)
              </button>
              <button
                type="button"
                onClick={() => setSelectedAssetSize('S')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  selectedAssetSize === 'S'
                    ? 'bg-[#0d99ff] text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Малый размер (S)"
              >
                S (Малый)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium text-[10px]">Роль:</span>
            <div className="inline-flex rounded bg-[#1e1e1e] p-0.5 border border-[#383838]">
              <button
                type="button"
                onClick={() => setSelectedAssetRole('foreground')}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  selectedAssetRole === 'foreground'
                    ? 'bg-[#0d99ff] text-white font-medium shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Основной
              </button>
              <button
                type="button"
                onClick={() => setSelectedAssetRole('ghost')}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  selectedAssetRole === 'ghost'
                    ? 'bg-[#0d99ff] text-white font-medium shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Силуэт
              </button>
            </div>
          </div>
        </div>

        {/* Строка 2: Фильтры категорий */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-colors cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0d99ff] text-white font-medium border-[#0d99ff] shadow-xs'
                    : 'bg-[#252525] text-stone-300 hover:bg-[#303030] hover:text-white border-[#383838]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Сетка карточек элементов: компактная 3-колоночная плитка */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 pr-0.5">
        {filteredAssetIds.map((assetId) => {
          const asset = ASSET_REGISTRY[assetId];
          const bounds = getAssetVisualBounds(assetId, selectedAssetSize);
          const maxDim = Math.max(bounds.width, bounds.height);
          const baseDim = selectedAssetSize === 'L' ? 600 : 200;
          // Calculate zoom from visualBounds so graphics fill the card preview prominently
          const zoom = Math.min(1.85, Math.max(1.25, (baseDim * 0.78) / Math.max(maxDim, 1)));
          // Neutralize anchor offset to ensure strict visual centering in card preview
          const translateY = -bounds.offsetY * 0.28;

          return (
            <div
              key={assetId}
              role="button"
              tabIndex={0}
              onClick={() => onInsertAsset(assetId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInsertAsset(assetId);
                }
              }}
              className="bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] hover:border-[#0d99ff] rounded-lg p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer group select-none shadow-xs active:scale-[0.98]"
              title={`Вставить «${asset.metadata.nameRu}» во фрейм Figma`}
            >
              {/* Превью векторного SVG ассета: единая поверхность без лишней тёмной плашки */}
              <div
                className="h-[68px] w-full flex items-center justify-center overflow-hidden relative transition-opacity duration-150"
                style={{
                  ...previewTokensStyle,
                  opacity: selectedAssetRole === 'ghost' ? (activePalette.ghostOpacity ?? 0.22) : 1,
                }}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom.toFixed(2)}) translateY(${translateY.toFixed(1)}px)`,
                  }}
                >
                  <asset.Component
                    size={selectedAssetSize}
                    role={selectedAssetRole}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full drop-shadow-sm transition-transform duration-150 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Название ассета и компактная кнопка вставки без дублирования плюса */}
              <div className="mt-1">
                <span className="block font-semibold text-stone-100 text-[10.5px] truncate text-center mb-1">
                  {asset.metadata.nameRu}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertAsset(assetId);
                  }}
                  className="w-full py-1 px-1 bg-[#333333] group-hover:bg-[#0d99ff] group-hover:text-white text-stone-200 font-medium rounded text-[10px] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                >
                  + Вставить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
