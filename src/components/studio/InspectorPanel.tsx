import React from 'react';
import {
  Sliders,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy,
  Box,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ASSET_REGISTRY } from '../../assets/registry';
import { FORMAT_PRESETS } from '../../config/formats';
import { PALETTE_PRESETS } from '../../config/palettes';

const CATEGORY_NAMES_RU: Record<string, string> = {
  finance: 'Финансы',
  tech: 'Технологии',
  work: 'Работа',
  lifestyle: 'Лайфстайл',
};

export interface InspectorPanelProps {
  className?: string;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ className }) => {
  const {
    selectedUid,
    items,
    setSelectedUid,
    updateItem,
    removeItem,
    duplicateItem,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    format,
    paletteId,
  } = useCanvasStore();

  const selectedItem = items.find((it) => it.uid === selectedUid);

  if (!selectedItem) {
    const fgCount = items.filter((it) => it.role === 'foreground').length;
    const ghostCount = items.filter((it) => it.role === 'ghost').length;
    const formatSpec = FORMAT_PRESETS[format];
    const paletteConfig = PALETTE_PRESETS[paletteId];

    return (
      <aside
        className={
          className
            ? `${className} flex flex-col bg-stone-50/90 dark:bg-zinc-900 select-none z-10 p-4`
            : 'w-72 md:w-80 h-full flex flex-col border-l border-stone-200 dark:border-zinc-800 bg-stone-50/90 dark:bg-zinc-900 backdrop-blur-sm select-none z-10 p-4'
        }
        aria-label="Инспектор сцены"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-100">
          <Sliders className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
          <h2 className="text-sm font-semibold tracking-tight">Свойства сцены</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-stone-200/70 dark:bg-zinc-800 flex items-center justify-center text-stone-400 dark:text-zinc-500 mb-3">
            <Box className="w-6 h-6" />
          </div>
          <h3 className="text-xs font-semibold text-stone-700 dark:text-zinc-300">Объект не выбран</h3>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
            Кликните на любой объект на холсте или добавьте новый из каталога слева
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3 space-y-2.5 text-xs">
          <div className="text-[11px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Параметры холста
          </div>
          <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Формат</span>
            <span className="font-medium text-stone-800 dark:text-zinc-200">{formatSpec.label}</span>
          </div>
          <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Разрешение</span>
            <span className="font-mono text-stone-800 dark:text-zinc-200 text-[11px]">
              {formatSpec.width} × {formatSpec.height} px
            </span>
          </div>
          <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Палитра</span>
            <span className="font-medium text-stone-800 dark:text-zinc-200">{paletteConfig.name}</span>
          </div>
          <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Всего объектов</span>
            <span className="font-semibold text-stone-900 dark:text-zinc-100">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-500 dark:text-zinc-400 pl-2">
            <span>• Основных</span>
            <span>{fgCount}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-500 dark:text-zinc-400 pl-2">
            <span>• Силуэтов (фоновых)</span>
            <span>{ghostCount}</span>
          </div>
        </div>
      </aside>
    );
  }

  const meta = ASSET_REGISTRY[selectedItem.assetId]?.metadata;
  const isGhost = selectedItem.role === 'ghost';
  const isL = selectedItem.size === 'L';

  return (
    <aside
      className={
        className
          ? `${className} flex flex-col bg-stone-50/90 dark:bg-zinc-900 select-none z-10`
          : 'w-72 md:w-80 h-full flex flex-col border-l border-stone-200 dark:border-zinc-800 bg-stone-50/90 dark:bg-zinc-900 backdrop-blur-sm select-none z-10'
      }
      aria-label="Свойства выбранного объекта"
    >
      {/* Header with Title and Deselect */}
      <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
              {meta?.nameRu ?? selectedItem.assetId}
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-semibold border border-stone-200 dark:border-zinc-700 uppercase">
              {selectedItem.size}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">
            {meta?.category ? (CATEGORY_NAMES_RU[meta.category] ?? meta.category) : 'Ассет'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedUid(null)}
          className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          title="Снять выделение (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Role Toggle: Foreground vs Ghost */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Роль объекта
          </label>
          <div className="flex rounded-lg bg-stone-200/80 dark:bg-zinc-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { role: 'foreground' })}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                !isGhost
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Основной (100%)</span>
            </button>
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { role: 'ghost' })}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                isGhost
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Силуэт</span>
            </button>
          </div>
        </div>

        {/* Size Toggle: L vs S */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Габарит
          </label>
          <div className="flex rounded-lg bg-stone-200/80 dark:bg-zinc-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { size: 'L' })}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                isL
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>L (600×600)</span>
            </button>
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { size: 'S' })}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                !isL
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>S (200×200)</span>
            </button>
          </div>
        </div>

        {/* Coordinates */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            Координаты холста
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus-within:border-stone-800 dark:focus-within:border-zinc-400">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono w-4 shrink-0">X</span>
              <input
                type="number"
                value={Math.round(selectedItem.x)}
                onChange={(e) => updateItem(selectedItem.uid, { x: Number(e.target.value) })}
                className="flex-1 min-w-0 text-xs text-stone-800 outline-none text-right font-mono bg-transparent dark:text-zinc-100"
              />
            </div>
            <div className="flex items-center rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus-within:border-stone-800 dark:focus-within:border-zinc-400">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono w-4 shrink-0">Y</span>
              <input
                type="number"
                value={Math.round(selectedItem.y)}
                onChange={(e) => updateItem(selectedItem.uid, { y: Number(e.target.value) })}
                className="flex-1 min-w-0 text-xs text-stone-800 outline-none text-right font-mono bg-transparent dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
              Масштаб
            </label>
            <span className="font-mono text-[11px] text-stone-700 dark:text-zinc-300 font-medium">
              {Math.round(selectedItem.scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.35"
            max="1.8"
            step="0.05"
            value={selectedItem.scale}
            onChange={(e) => updateItem(selectedItem.uid, { scale: parseFloat(e.target.value) })}
            className="w-full accent-stone-900 dark:accent-zinc-100 cursor-pointer"
          />
        </div>

        {/* Rotation & Flip */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Поворот и отражение</label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { rotation: (selectedItem.rotation || 0) - 30 })}
              className="flex-1 py-1.5 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex items-center justify-center gap-1 text-stone-700 dark:text-zinc-200 transition-colors"
              title="Повернуть против часовой стрелки на 30°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-30°</span>
            </button>
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { rotation: (selectedItem.rotation || 0) + 30 })}
              className="flex-1 py-1.5 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex items-center justify-center gap-1 text-stone-700 dark:text-zinc-200 transition-colors"
              title="Повернуть по часовой стрелке на 30°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+30°</span>
            </button>
            <button
              type="button"
              onClick={() => updateItem(selectedItem.uid, { flipX: !selectedItem.flipX })}
              className={`p-1.5 rounded-md border transition-colors ${selectedItem.flipX ? 'border-stone-800 dark:border-zinc-200 bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900' : 'border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-700'}`}
              title="Зеркальное отражение по горизонтали"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Порядок слоёв</label>
            <span className="text-[10px] text-stone-400 dark:text-zinc-500">Смещение: {selectedItem.manualLayerOffset}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button type="button" onClick={() => bringToFront(selectedItem.uid)} className="py-1 rounded border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex flex-col items-center justify-center text-[10px] text-stone-700 dark:text-zinc-200 transition-colors" title="На самый передний план">
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => bringForward(selectedItem.uid)} className="py-1 rounded border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex flex-col items-center justify-center text-[10px] text-stone-700 dark:text-zinc-200 transition-colors" title="Слой выше">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => sendBackward(selectedItem.uid)} className="py-1 rounded border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex flex-col items-center justify-center text-[10px] text-stone-700 dark:text-zinc-200 transition-colors" title="Слой ниже">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => sendToBack(selectedItem.uid)} className="py-1 rounded border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 flex flex-col items-center justify-center text-[10px] text-stone-700 dark:text-zinc-200 transition-colors" title="На самый задний план">
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions: Duplicate & Delete */}
      <div className="p-4 border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
        <button
          type="button"
          onClick={() => duplicateItem(selectedItem.uid)}
          className="w-full py-1.5 px-3 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Дублировать объект</span>
        </button>
        <button
          type="button"
          onClick={() => removeItem(selectedItem.uid)}
          className="w-full py-1.5 px-3 rounded-md bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/60"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Удалить с холста</span>
        </button>
      </div>
    </aside>
  );
};
