import React from 'react';
import { Keyboard } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export interface StudioFooterProps {
  onOpenShortcuts: () => void;
}

export const StudioFooter: React.FC<StudioFooterProps> = ({ onOpenShortcuts }) => {
  const items = useCanvasStore((state) => state.items);
  const fgCount = items.filter((it) => it.role === 'foreground').length;
  const ghostCount = items.filter((it) => it.role === 'ghost').length;

  return (
    <footer className="h-7 border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400 shrink-0 z-20 select-none overflow-hidden whitespace-nowrap">
      <div className="flex items-center gap-2 sm:gap-3 truncate">
        <span className="font-semibold text-stone-700 dark:text-zinc-200">Isometric Cover Builder</span>
        <span className="hidden sm:inline text-stone-300 dark:text-zinc-700">•</span>
        <span className="hidden md:inline dark:text-zinc-400">
          Конструктор изометрических обложек
        </span>
        <span className="hidden sm:inline text-stone-300 dark:text-zinc-700">•</span>
        <span className="text-stone-600 dark:text-zinc-400 font-medium">
          CC BY-NC 4.0
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Горячие клавиши"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Горячие клавиши</span>
        </button>
        <span className="text-stone-400 dark:text-zinc-500 font-mono text-[10px]">
          {items.length} {items.length === 1 ? 'объект' : 'объектов'} ({fgCount} осн. / {ghostCount} фон.)
        </span>
      </div>
    </footer>
  );
};
