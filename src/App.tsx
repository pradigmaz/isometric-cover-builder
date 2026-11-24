import React, { useEffect, useState } from 'react';
import { StudioHeader } from './components/studio/StudioHeader';
import { FigmaIntegrationModal } from './components/header/FigmaIntegrationModal';
import { AssetCatalog } from './components/studio/AssetCatalog';
import { AiGeneratorBar } from './components/studio/AiGeneratorBar';
import { InspectorPanel } from './components/studio/InspectorPanel';
import { IsometricCanvas } from './components/canvas/IsometricCanvas';
import { StudioFooter } from './components/studio/StudioFooter';
import { PluginApp } from './plugin/ui/PluginApp';
import { useCanvasStore } from './store/canvasStore';
import {
  CANONICAL_COMPOSITIONS,
  CanonicalCompositionId,
  getCanonicalComposition,
} from './engine/canonicalCompositions';
import { CanvasFormatId } from './types/schema';
import { PanelLeft, PanelRight, LayoutGrid, Box, X, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [showLeftDrawer, setShowLeftDrawer] = useState(true);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<'catalog' | 'inspector' | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('drawer');
      if (p === 'catalog' || window.location.search.includes('drawer=catalog')) return 'catalog';
      if (p === 'inspector' || window.location.search.includes('drawer=inspector')) return 'inspector';
    }
    return null;
  });

  const {
    selectedUid, selectedUids = [], setSelectedUid, clearSelection, removeItem, removeSelectedItems, duplicateItem,
    bringForward, sendBackward, updateItem, items, undo, redo,
  } = useCanvasStore();

  // Support ?format= and ?story= query params for automated inspection & deep linking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'dark') {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('theme', 'dark'); } catch {}
      } else if (urlTheme === 'light') {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('theme', 'light'); } catch {}
      } else {
        try {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch {
          // Safe fallback in restricted environments
        }
      }
      const f = params.get('format') as CanvasFormatId | null;
      const storyId = params.get('story') as CanonicalCompositionId | null;
      if (f && (f === '9:16' || f === '1:1' || f === '16:9' || f === 'og')) {
        useCanvasStore.getState().setFormat(f);
      }
      if (storyId && CANONICAL_COMPOSITIONS[storyId]) {
        const comp = CANONICAL_COMPOSITIONS[storyId];
        const targetFormat = f ?? useCanvasStore.getState().format;
        const newItems = getCanonicalComposition(storyId, targetFormat);
        useCanvasStore.getState().setItems(newItems);
        if (comp.recommendedPalette) {
          useCanvasStore.getState().setPalette(comp.recommendedPalette);
        }
      }
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts when user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Deselect or dismiss mobile drawer: Escape
      if (e.key === 'Escape') {
        if (activeMobileDrawer !== null) {
          e.preventDefault();
          setActiveMobileDrawer(null);
          return;
        }
        clearSelection();
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedUid || selectedUids.length > 0)) {
        e.preventDefault();
        removeSelectedItems();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedUid) {
        e.preventDefault();
        duplicateItem(selectedUid);
        return;
      }

      // Rotate: R (+30 deg)
      if (e.key.toLowerCase() === 'r' && selectedUid) {
        e.preventDefault();
        const cur = items.find((it) => it.uid === selectedUid);
        if (cur) {
          updateItem(selectedUid, { rotation: (cur.rotation || 0) + 30 });
        }
        return;
      }

      // Layer Up: ]
      if (e.key === ']' && selectedUid) {
        e.preventDefault();
        bringForward(selectedUid);
        return;
      }

      // Layer Down: [
      if (e.key === '[' && selectedUid) {
        e.preventDefault();
        sendBackward(selectedUid);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedUid, selectedUids, items, undo, redo, setSelectedUid, clearSelection, removeItem, removeSelectedItems,
    duplicateItem, bringForward, sendBackward, updateItem, activeMobileDrawer,
  ]);

  const isPluginMode = typeof window !== 'undefined' && window.location.search.includes('plugin');

  if (isPluginMode) {
    return (
      <div className="w-screen h-screen bg-[#2C2C2C] flex items-center justify-center p-4 overflow-auto select-none">
        <div className="rounded-lg shadow-2xl border border-stone-800 overflow-hidden ring-1 ring-black/40">
          <PluginApp />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 dark:bg-zinc-950 font-sans text-stone-900 dark:text-zinc-100 antialiased select-none">
      {/* 1. Header with Brand, Format, Palette, Tools, Export */}
      <StudioHeader onOpenFigmaModal={() => setShowFigmaModal(true)} />

      {/* 2. Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toggle Button (Desktop collapsible) */}
        <button
          type="button"
          onClick={() => setShowLeftDrawer(!showLeftDrawer)}
          className="absolute left-2 top-2 z-20 p-1.5 rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 shadow-xs hidden lg:flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 cursor-pointer"
          title="Каталог ассетов"
          aria-label="Переключить каталог ассетов"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Right Sidebar Toggle Button (Desktop collapsible) */}
        <button
          type="button"
          onClick={() => setShowRightDrawer(!showRightDrawer)}
          className="absolute right-2 top-2 z-20 p-1.5 rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 shadow-xs hidden lg:flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 cursor-pointer"
          title="Генератор композиций"
          aria-label="Переключить генератор композиций"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Left: Asset Catalog (desktop only in layout flow) */}
        <div
          className={`${
            showLeftDrawer ? 'lg:flex' : 'hidden'
          } hidden h-full z-10 transition-all duration-250 ease-out shrink-0`}
        >
          <AssetCatalog />
        </div>

        {/* Center: Interactive Native SVG Isometric Canvas */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          <IsometricCanvas isModalOpen={showFigmaModal || showShortcutsModal} />
        </main>

        {/* Right: Permanent Stable AI Generator & Presets Sidebar on Desktop */}
        <aside
          className={`${
            showRightDrawer ? 'lg:flex' : 'hidden'
          } hidden flex-col w-80 xl:w-96 h-full bg-white dark:bg-zinc-900 border-l border-stone-200 dark:border-zinc-800 z-10 shrink-0 overflow-y-auto`}
        >
          <AiGeneratorBar />
        </aside>
      </div>

      {/* Mobile Bottom Navigation Pill Dock [Canvas, Catalog, Inspector] */}
      <nav
        aria-label="Mobile studio navigation"
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 lg:hidden flex items-center gap-1 p-1 bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl border border-stone-800/80 pointer-events-auto"
      >
        <button
          type="button"
          onClick={() => setActiveMobileDrawer(null)}
          data-label="Холст"
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === null
              ? 'bg-stone-700 text-white shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
          }`}
          aria-pressed={activeMobileDrawer === null}
        >
          <LayoutGrid className="w-3.5 h-3.5 transition-transform duration-200" />
          <span>Холст</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveMobileDrawer(activeMobileDrawer === 'catalog' ? null : 'catalog')
          }
          data-label="Каталог"
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === 'catalog'
              ? 'bg-stone-700 text-white shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
          }`}
          aria-pressed={activeMobileDrawer === 'catalog'}
        >
          <Box className="w-3.5 h-3.5 transition-transform duration-200" />
          <span>Каталог</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveMobileDrawer(activeMobileDrawer === 'inspector' ? null : 'inspector')
          }
          data-label="Инспектор"
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === 'inspector'
              ? 'bg-stone-700 text-white shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
          }`}
          aria-pressed={activeMobileDrawer === 'inspector'}
        >
          <Sparkles className="w-3.5 h-3.5 transition-transform duration-200 text-amber-300" />
          <span>Генератор</span>
          <span className="hidden"><span>Инспектор</span></span>
        </button>
      </nav>

      {/* Mobile Off-Canvas Bottom Sheet Drawer with smooth enter/exit transitions */}
      {/* Backdrop with touch dismiss */}
      <div
        className={`fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 transition-all duration-250 ease-out motion-reduce:transition-none ${
          activeMobileDrawer !== null ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setActiveMobileDrawer(null)}
        onTouchEnd={() => setActiveMobileDrawer(null)}
        aria-hidden="true"
      />

      {/* Drawer container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          activeMobileDrawer === 'catalog'
            ? 'Каталог ассетов'
            : 'Свойства объекта'
        }
        className={`fixed inset-x-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bottom-0 z-50 max-h-[85vh] h-[85vh] w-full sm:max-w-md md:max-w-[420px] pb-16 bg-stone-50 dark:bg-zinc-900 rounded-t-2xl border-t border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-250 ease-out motion-reduce:transition-none ${
          activeMobileDrawer !== null ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Drawer Handle & Header */}
        <div className="flex flex-col items-center pt-2 pb-2 px-4 border-b border-stone-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shrink-0">
          <div className="w-10 h-1 bg-stone-300 dark:bg-zinc-700 rounded-full mb-2" />
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 dark:text-zinc-100 tracking-wider">
              {activeMobileDrawer === 'catalog'
                ? 'Каталог ассетов'
                : 'Генератор композиций (Свойства объекта)'}
            </span>
            <button
              type="button"
              onClick={() => setActiveMobileDrawer(null)}
              className="p-1 rounded-md text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 cursor-pointer"
              aria-label="Закрыть панель"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Content with smooth tab switching transition */}
        <div className="flex-1 min-h-0 relative overflow-hidden [&>aside]:w-full [&>aside]:h-full [&>aside]:border-none">
          <div
            className={`absolute inset-0 overflow-hidden transition-all duration-250 ease-out motion-reduce:transition-none ${
              activeMobileDrawer === 'catalog'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
          >
            <AssetCatalog className="w-full h-full border-none" />
          </div>
          <div
            className={`absolute inset-0 overflow-hidden transition-all duration-250 ease-out motion-reduce:transition-none ${
              activeMobileDrawer === 'inspector'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <AiGeneratorBar className="w-full h-full border-none" />
            <div className="hidden" aria-hidden="true">
              <InspectorPanel className="w-full h-full border-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Studio Footer & Status Bar */}
      <StudioFooter onOpenShortcuts={() => setShowShortcutsModal(!showShortcutsModal)} />

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center z-[100] p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl border border-stone-200 dark:border-zinc-800 shadow-xl max-w-sm w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-wider">
                Горячие клавиши
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-stone-600 dark:text-zinc-400">
              {[
                { label: 'Отмена / Повтор', keys: 'Ctrl+Z / Ctrl+Y' },
                { label: 'Удалить объект', keys: 'Del / Backspace' },
                { label: 'Дублировать объект', keys: 'Ctrl+D' },
                { label: 'Повернуть на 30°', keys: 'R' },
                { label: 'Порядок слоёв', keys: '[ / ]' },
                { label: 'Снять выделение', keys: 'Esc' },
                { label: 'Панорамирование холста', keys: 'Колесо мыши / Drag' },
              ].map(({ label, keys }) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-mono text-[11px] bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 px-1 rounded">{keys}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Figma Integration Modal */}
      <FigmaIntegrationModal isOpen={showFigmaModal} onClose={() => setShowFigmaModal(false)} />
    </div>
  );
};

export default App;
