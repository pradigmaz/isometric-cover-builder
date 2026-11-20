import { create } from 'zustand';
import {
  AICompositionRequest,
  AssetId,
  AssetSize,
  CanvasFormatId,
  CanvasItem,
  ItemRole,
  LayoutMode,
  PaletteConfig,
  PaletteId,
  ViewportState,
} from '../types/schema';
import { DEFAULT_FORMAT, getFormatSpec } from '../config/formats';
import { DEFAULT_PALETTE, registerCustomPalette } from '../config/palettes';
import { composeCover } from '../engine/composer';
import { snapToIsoGrid } from '../engine/isometric';

export interface SceneSnapshot {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette?: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
}

export interface CanvasStoreState {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
  selectedUid: string | null;
  viewport: ViewportState;
  snapToGrid: boolean;
  showGrid: boolean;
  gridStep: number;
  isGenerating: boolean;
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  canUndo: () => boolean;
  canRedo: () => boolean;

  setFormat: (format: CanvasFormatId) => void;
  setPalette: (paletteId: PaletteId) => void;
  setCustomPalette: (palette: PaletteConfig | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setIncludeBackgrounds: (include: boolean) => void;
  setSelectedUid: (uid: string | null) => void;
  selectItem: (uid: string | null) => void;

  addItem: (
    assetIdOrItem: AssetId | Partial<CanvasItem>,
    size?: AssetSize,
    role?: ItemRole,
    x?: number,
    y?: number
  ) => string;
  updateItem: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  removeItem: (uid: string) => void;
  duplicateItem: (uid: string) => string | null;
  setItems: (items: CanvasItem[]) => void;
  clearCanvas: () => void;

  bringForward: (uid: string) => void;
  sendBackward: (uid: string) => void;
  bringToFront: (uid: string) => void;
  sendToBack: (uid: string) => void;

  setViewport: (viewport: Partial<ViewportState> | ((prev: ViewportState) => ViewportState)) => void;
  resetViewport: () => void;
  toggleSnapToGrid: () => void;
  toggleShowGrid: () => void;
  setGridStep: (step: number) => void;

  setPrompt: (prompt: string) => void;
  generateCover: (request?: Partial<AICompositionRequest> | string) => Promise<void>;

  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 30;

function createSnapshot(state: {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette?: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
}): SceneSnapshot {
  return {
    format: state.format,
    paletteId: state.paletteId,
    customPalette: state.customPalette ? JSON.parse(JSON.stringify(state.customPalette)) : null,
    layoutMode: state.layoutMode,
    includeBackgrounds: state.includeBackgrounds,
    items: JSON.parse(JSON.stringify(state.items)),
    lastPrompt: state.lastPrompt,
  };
}

const INITIAL_ITEMS: CanvasItem[] = [
  { uid: 'demo-hero', assetId: 'wallet', size: 'L', role: 'foreground', x: 600, y: 315, zHeight: 0, rotation: 0, scale: 0.78, opacity: 1, manualLayerOffset: 0 },
  { uid: 'demo-coin', assetId: 'coin', size: 'S', role: 'foreground', x: 820, y: 400, zHeight: 0, rotation: 30, scale: 0.85, opacity: 1, manualLayerOffset: 1 },
  { uid: 'demo-puzzle', assetId: 'puzzle', size: 'S', role: 'foreground', x: 380, y: 220, zHeight: 0, rotation: -30, scale: 0.85, opacity: 1, manualLayerOffset: -1 },
  { uid: 'demo-folder', assetId: 'folder', size: 'S', role: 'ghost', x: 880, y: 180, zHeight: 0, rotation: 0, scale: 0.9, opacity: 0.22, manualLayerOffset: -5 },
];

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  format: DEFAULT_FORMAT,
  paletteId: DEFAULT_PALETTE,
  customPalette: null,
  layoutMode: 'headline',
  includeBackgrounds: true,
  items: INITIAL_ITEMS,
  lastPrompt: '',
  selectedUid: 'demo-hero',
  viewport: { panX: 0, panY: 0, zoom: 1 },
  snapToGrid: true,
  showGrid: true,
  gridStep: 48,
  isGenerating: false,
  past: [],
  future: [],
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setFormat: (format) => set((s) => ({ format, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(get())], future: [] })),
  setPalette: (paletteId) => set((s) => ({ paletteId, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(get())], future: [] })),
  setCustomPalette: (customPalette) => {
    registerCustomPalette(customPalette);
    set((s) => ({
      customPalette,
      paletteId: customPalette ? (s.paletteId === 'custom' ? 'custom-alt' : 'custom') : DEFAULT_PALETTE,
      past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(get())],
      future: [],
    }));
  },
  setLayoutMode: (layoutMode) => set((s) => ({ layoutMode, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(get())], future: [] })),
  setIncludeBackgrounds: (includeBackgrounds) => set((s) => ({ includeBackgrounds, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(get())], future: [] })),

  setSelectedUid: (uid) => set({ selectedUid: uid }),
  selectItem: (uid) => set({ selectedUid: uid }),

  addItem: (assetIdOrItem, size = 'L', role = 'foreground', customX, customY) => {
    const state = get();
    const snap = createSnapshot(state);
    const spec = getFormatSpec(state.format);
    const uid = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    let newItem: CanvasItem;
    if (typeof assetIdOrItem === 'string') {
      const rawX = customX ?? spec.width / 2;
      const rawY = customY ?? spec.height / 2;
      const pos = state.snapToGrid ? snapToIsoGrid({ x: rawX, y: rawY }, state.gridStep) : { x: rawX, y: rawY };
      const scale = size === 'L' ? spec.defaultHeroScale : spec.defaultSatelliteScale;
      newItem = { uid, assetId: assetIdOrItem, size, role, x: Math.round(pos.x), y: Math.round(pos.y), zHeight: 0, rotation: 0, scale, opacity: role === 'ghost' ? 0.22 : 1, manualLayerOffset: 0 };
    } else {
      newItem = {
        uid: assetIdOrItem.uid || uid,
        assetId: assetIdOrItem.assetId || 'wallet',
        size: assetIdOrItem.size || 'L',
        role: assetIdOrItem.role || 'foreground',
        x: assetIdOrItem.x ?? spec.width / 2,
        y: assetIdOrItem.y ?? spec.height / 2,
        zHeight: assetIdOrItem.zHeight ?? 0,
        rotation: assetIdOrItem.rotation ?? 0,
        scale: assetIdOrItem.scale ?? 1,
        opacity: assetIdOrItem.opacity ?? 1,
        manualLayerOffset: assetIdOrItem.manualLayerOffset ?? 0,
        flipX: assetIdOrItem.flipX,
      };
    }

    set({ items: [...state.items, newItem], selectedUid: newItem.uid, past: [...state.past.slice(-MAX_HISTORY + 1), snap], future: [] });
    return newItem.uid;
  },

  updateItem: (uid, patch, recordHistory = false) => {
    const state = get();
    if (recordHistory) {
      const snap = createSnapshot(state);
      set({
        items: state.items.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
        past: [...state.past.slice(-MAX_HISTORY + 1), snap],
        future: [],
      });
    } else {
      set({ items: state.items.map((it) => (it.uid === uid ? { ...it, ...patch } : it)) });
    }
  },

  removeItem: (uid) => {
    const state = get();
    const snap = createSnapshot(state);
    set({
      items: state.items.filter((it) => it.uid !== uid),
      selectedUid: state.selectedUid === uid ? null : state.selectedUid,
      past: [...state.past.slice(-MAX_HISTORY + 1), snap],
      future: [],
    });
  },

  duplicateItem: (uid) => {
    const state = get();
    const target = state.items.find((it) => it.uid === uid);
    if (!target) return null;
    const snap = createSnapshot(state);
    const newUid = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const cloned: CanvasItem = { ...target, uid: newUid, x: target.x + state.gridStep, y: target.y + Math.round(state.gridStep * 0.5), manualLayerOffset: (target.manualLayerOffset ?? 0) + 1 };
    set({ items: [...state.items, cloned], selectedUid: newUid, past: [...state.past.slice(-MAX_HISTORY + 1), snap], future: [] });
    return newUid;
  },

  setItems: (items) => {
    const snap = createSnapshot(get());
    set((s) => ({ items, selectedUid: null, past: [...s.past.slice(-MAX_HISTORY + 1), snap], future: [] }));
  },

  clearCanvas: () => {
    const snap = createSnapshot(get());
    set((s) => ({ items: [], selectedUid: null, past: [...s.past.slice(-MAX_HISTORY + 1), snap], future: [] }));
  },

  bringForward: (uid) => {
    get().updateItem(uid, { manualLayerOffset: (get().items.find((i) => i.uid === uid)?.manualLayerOffset ?? 0) + 1 }, true);
  },
  sendBackward: (uid) => {
    get().updateItem(uid, { manualLayerOffset: (get().items.find((i) => i.uid === uid)?.manualLayerOffset ?? 0) - 1 }, true);
  },
  bringToFront: (uid) => {
    const maxOffset = Math.max(0, ...get().items.map((i) => i.manualLayerOffset ?? 0));
    get().updateItem(uid, { manualLayerOffset: maxOffset + 1 }, true);
  },
  sendToBack: (uid) => {
    const minOffset = Math.min(0, ...get().items.map((i) => i.manualLayerOffset ?? 0));
    get().updateItem(uid, { manualLayerOffset: minOffset - 1 }, true);
  },

  setViewport: (updater) => {
    set((s) => ({ viewport: typeof updater === 'function' ? updater(s.viewport) : { ...s.viewport, ...updater } }));
  },
  resetViewport: () => set({ viewport: { panX: 0, panY: 0, zoom: 1 } }),

  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setGridStep: (gridStep) => set({ gridStep }),

  setPrompt: (lastPrompt) => set({ lastPrompt }),

  generateCover: async (request) => {
    const state = get();
    const prompt = typeof request === 'string' ? request : (request?.prompt ?? state.lastPrompt);
    if (!prompt.trim()) return;

    set({ isGenerating: true });
    try {
      const snap = createSnapshot(state);
      const layoutMode = typeof request === 'object' && request?.layoutMode ? request.layoutMode : 'auto';
      const paletteId = typeof request === 'object' && request?.paletteId ? request.paletteId : 'auto';
      const includeBackgrounds = typeof request === 'object' && request?.includeBackgrounds !== undefined
        ? request.includeBackgrounds
        : state.includeBackgrounds;

      const res = await composeCover({
        prompt,
        format: state.format,
        layoutMode,
        paletteId,
        includeBackgrounds,
        seed: typeof request === 'object' ? request?.seed : undefined,
      });

      set((curr) => ({
        items: res.items,
        paletteId: res.recommendedPalette,
        layoutMode: res.resolvedLayout,
        lastPrompt: prompt,
        selectedUid: null,
        isGenerating: false,
        past: [...curr.past.slice(-MAX_HISTORY + 1), snap],
        future: [],
      }));
    } catch (err) {
      console.error('[canvasStore] generateCover failed:', err);
      set({ isGenerating: false });
    }
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const currentSnap = createSnapshot(get());
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    registerCustomPalette(previous.customPalette ?? null);
    set({
      format: previous.format,
      paletteId: previous.paletteId,
      customPalette: previous.customPalette ?? null,
      layoutMode: previous.layoutMode,
      includeBackgrounds: previous.includeBackgrounds,
      items: previous.items,
      lastPrompt: previous.lastPrompt,
      selectedUid: null,
      past: newPast,
      future: [currentSnap, ...future.slice(0, MAX_HISTORY - 1)],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const currentSnap = createSnapshot(get());
    const next = future[0];
    const newFuture = future.slice(1);
    registerCustomPalette(next.customPalette ?? null);
    set({
      format: next.format,
      paletteId: next.paletteId,
      customPalette: next.customPalette ?? null,
      layoutMode: next.layoutMode,
      includeBackgrounds: next.includeBackgrounds,
      items: next.items,
      lastPrompt: next.lastPrompt,
      selectedUid: null,
      past: [...past.slice(-MAX_HISTORY + 1), currentSnap],
      future: newFuture,
    });
  },
}));

export const canvasStore = useCanvasStore;
