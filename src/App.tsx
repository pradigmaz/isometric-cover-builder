import React, { useEffect, useState } from 'react';
import { StudioHeader } from './components/studio/StudioHeader';
import { AssetCatalog } from './components/studio/AssetCatalog';
import { AiGeneratorBar } from './components/studio/AiGeneratorBar';
import { InspectorPanel } from './components/studio/InspectorPanel';
import { IsometricCanvas } from './components/canvas/IsometricCanvas';
import { useCanvasStore } from './store/canvasStore';
import { PanelLeft, PanelRight, Keyboard } from 'lucide-react';

export const App: React.FC = () => {
  const [showLeftDrawer, setShowLeftDrawer] = useState(true);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const selectedUid = useCanvasStore((state) => state.selectedUid);
  const setSelectedUid = useCanvasStore((state) => state.setSelectedUid);
  const removeItem = useCanvasStore((state) => state.removeItem);
  const duplicateItem = useCanvasStore((state) => state.duplicateItem);
  const bringForward = useCanvasStore((state) => state.bringForward);
  const sendBackward = useCanvasStore((state) => state.sendBackward);
  const updateItem = useCanvasStore((state) => state.updateItem);
  const items = useCanvasStore((state) => state.items);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);

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

      // Deselect: Escape
      if (e.key === 'Escape') {
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
    selectedUid,
    items,
    undo,
    redo,
    setSelectedUid,
    removeItem,
    duplicateItem,
    bringForward,
    sendBackward,
    updateItem,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 font-sans text-stone-900 antialiased select-none">
      {/* 1. Header with Brand, Format, Palette, Tools, Export */}
      <StudioHeader />

      {/* 2. AI Generator Prompt & Controls Bar */}
      <AiGeneratorBar />

      {/* 3. Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toggle Button (Mobile/Tablet or collapsed) */}
        <button
          type="button"
          onClick={() => setShowLeftDrawer(!showLeftDrawer)}
          className="absolute left-2 top-2 z-20 p-1.5 rounded-md bg-white/90 backdrop-blur-xs border border-stone-200 text-stone-600 hover:text-stone-900 shadow-xs lg:hidden"
          title="Переключить каталог ассетов"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Left: Asset Catalog */}
        <div
          className={`${
            showLeftDrawer ? 'flex' : 'hidden'
          } h-full z-10 transition-all shrink-0`}
        >
          <AssetCatalog />
        </div>

        {/* Center: Interactive Native SVG Isometric Canvas */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-stone-200/50">
          <IsometricCanvas />
        </main>

        {/* Right Sidebar Toggle Button (Mobile/Tablet or collapsed) */}
        <button
          type="button"
          onClick={() => setShowRightDrawer(!showRightDrawer)}
          className="absolute right-2 top-2 z-20 p-1.5 rounded-md bg-white/90 backdrop-blur-xs border border-stone-200 text-stone-600 hover:text-stone-900 shadow-xs lg:hidden"
          title="Переключить инспектор свойств"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Right: Inspector Properties Panel */}
        <div
          className={`${
            showRightDrawer ? 'flex' : 'hidden'
          } h-full z-10 transition-all shrink-0`}
        >
          <InspectorPanel />
        </div>
      </div>

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
              <div className="flex justify-between">
                <span>Отмена / Повтор</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">Ctrl+Z / Ctrl+Y</span>
              </div>
              <div className="flex justify-between">
                <span>Удалить объект</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">Del / Backspace</span>
              </div>
              <div className="flex justify-between">
                <span>Дублировать объект</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">Ctrl+D</span>
              </div>
              <div className="flex justify-between">
                <span>Повернуть на 30°</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">R</span>
              </div>
              <div className="flex justify-between">
                <span>Порядок слоёв</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">[ / ]</span>
              </div>
              <div className="flex justify-between">
                <span>Снять выделение</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">Esc</span>
              </div>
              <div className="flex justify-between">
                <span>Панорамирование холста</span>
                <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">Колесо мыши / Drag</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
