import React, { useEffect, useState } from 'react';
import { StudioHeader } from './components/studio/StudioHeader';
import { AssetCatalog } from './components/studio/AssetCatalog';
import { AiGeneratorBar } from './components/studio/AiGeneratorBar';
import { InspectorPanel } from './components/studio/InspectorPanel';
import { IsometricCanvas } from './components/canvas/IsometricCanvas';
import { useCanvasStore } from './store/canvasStore';
import { PanelLeft, PanelRight, Keyboard, LayoutGrid, Box, Sliders, X } from 'lucide-react';

export const App: React.FC = () => {
  const [showLeftDrawer, setShowLeftDrawer] = useState(true);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<'catalog' | 'inspector' | null>(null);

  const {
    selectedUid, setSelectedUid, removeItem, duplicateItem,
    bringForward, sendBackward, updateItem, items, undo, redo,
  } = useCanvasStore();

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
        setSelectedUid(null);
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUid) {
        e.preventDefault();
        removeItem(selectedUid);
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
          updateItem(selectedUid, { rotation: (cur.rotation + 30) % 360 });
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
    selectedUid, items, undo, redo, setSelectedUid, removeItem,
    duplicateItem, bringForward, sendBackward, updateItem, activeMobileDrawer,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 font-sans text-stone-900 antialiased select-none">
      {/* 1. Header with Brand, Format, Palette, Tools, Export */}
      <StudioHeader />

      {/* 2. AI Generator Prompt & Controls Bar */}
      <AiGeneratorBar />

      {/* 3. Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toggle Button (Desktop collapsible) */}
        <button
          type="button"
          onClick={() => setShowLeftDrawer(!showLeftDrawer)}
          className="absolute left-2 top-2 z-20 p-1.5 rounded-md bg-white/90 backdrop-blur-xs border border-stone-200 text-stone-600 hover:text-stone-900 shadow-xs hidden lg:flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
          title="Переключить каталог ассетов"
          aria-label="Переключить каталог ассетов"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Left: Asset Catalog (desktop only in layout flow) */}
        <div
          className={`${
            showLeftDrawer ? 'lg:flex' : 'hidden'
          } hidden h-full z-10 transition-all shrink-0`}
        >
          <AssetCatalog />
        </div>

        {/* Center: Interactive Native SVG Isometric Canvas */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-stone-200/50">
          <IsometricCanvas />
        </main>

        {/* Right Sidebar Toggle Button (Desktop collapsible) */}
        <button
          type="button"
          onClick={() => setShowRightDrawer(!showRightDrawer)}
          className="absolute right-2 top-2 z-20 p-1.5 rounded-md bg-white/90 backdrop-blur-xs border border-stone-200 text-stone-600 hover:text-stone-900 shadow-xs hidden lg:flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
          title="Переключить инспектор свойств"
          aria-label="Переключить инспектор свойств"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Right: Inspector Properties Panel (desktop only in layout flow) */}
        <div
          className={`${
            showRightDrawer ? 'lg:flex' : 'hidden'
          } hidden h-full z-10 transition-all shrink-0`}
        >
          <InspectorPanel />
        </div>
      </div>

      {/* Mobile Bottom Navigation Pill Dock [Холст, Каталог, Инспектор] */}
      <nav
        aria-label="Мобильная навигация студии"
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 lg:hidden flex items-center gap-1 p-1 bg-stone-900/90 text-white backdrop-blur-md rounded-full shadow-2xl border border-stone-800/80"
      >
        <button
          type="button"
          onClick={() => setActiveMobileDrawer(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === null
              ? 'bg-stone-700 text-white shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
          aria-pressed={activeMobileDrawer === null}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Холст</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveMobileDrawer(activeMobileDrawer === 'catalog' ? null : 'catalog')
          }
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === 'catalog'
              ? 'bg-stone-700 text-white shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
          aria-pressed={activeMobileDrawer === 'catalog'}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Каталог</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveMobileDrawer(activeMobileDrawer === 'inspector' ? null : 'inspector')
          }
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMobileDrawer === 'inspector'
              ? 'bg-stone-700 text-white shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
          aria-pressed={activeMobileDrawer === 'inspector'}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Инспектор</span>
        </button>
      </nav>

      {/* Mobile Off-Canvas Bottom Sheet Drawer */}
      {activeMobileDrawer && (
        <>
          {/* Backdrop with touch dismiss */}
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 lg:hidden transition-opacity motion-reduce:transition-none"
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
                : 'Инспектор свойств'
            }
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] h-[82vh] pb-16 bg-stone-50 rounded-t-2xl border-t border-stone-200 shadow-2xl flex flex-col lg:hidden overflow-hidden transition-transform duration-200 ease-out motion-reduce:transition-none"
          >
            {/* Drawer Handle & Header */}
            <div className="flex flex-col items-center pt-2 pb-2 px-4 border-b border-stone-200 bg-white/80 shrink-0">
              <div className="w-10 h-1 bg-stone-300 rounded-full mb-2" />
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                  {activeMobileDrawer === 'catalog'
                    ? 'Каталог ассетов'
                    : 'Инспектор свойств'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMobileDrawer(null)}
                  className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                  aria-label="Закрыть панель"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto min-h-0 [&>aside]:w-full [&>aside]:h-full [&>aside]:border-none">
              {activeMobileDrawer === 'catalog' ? (
                <AssetCatalog />
              ) : (
                <InspectorPanel />
              )}
            </div>
          </div>
        </>
      )}

      {/* 4. Studio Footer & Status Bar */}
      <footer className="h-7 border-t border-stone-200 bg-white px-3 flex items-center justify-between text-[11px] text-stone-500 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-700">Isometric Cover Builder</span>
          <span className="hidden sm:inline text-stone-300">•</span>
          <span className="hidden sm:inline">
            Конструктор изометрических обложек
          </span>
          <span className="hidden md:inline text-stone-300">•</span>
          <span className="text-stone-600 font-medium">
            MIT License
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(!showShortcutsModal)}
            className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="Горячие клавиши"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Горячие клавиши</span>
          </button>
          <span className="text-stone-400 font-mono text-[10px]">
            {items.length} {items.length === 1 ? 'объект' : 'объектов'} на холсте
          </span>
        </div>
      </footer>

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-sm w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Горячие клавиши
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-stone-600">
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
                  <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">{keys}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
