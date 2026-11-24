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
import {
  CANONICAL_COMPOSITIONS,
  CanonicalCompositionId,
  getCanonicalComposition,
} from '../engine/canonicalCompositions';
import { reorderCanvasLayers } from './layerReorder';
import {
  SceneSnapshot,
  createSnapshot,
  applySnapshot,
  INITIAL_ITEMS,
  rearrangeItemsForLayout,
} from './layoutReorder';

export { reorderCanvasLayers } from './layerReorder';
export { rearrangeItemsForLayout } from './layoutReorder';
export type { SceneSnapshot };

export interface CanvasStoreState {
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;
  selectedUid: string | null;
  selectedUids: string[];
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
  selectItem: (uid: string | null, multi?: boolean) => void;
  selectGroup: (uids: string[]) => void;
  toggleSelectItem: (uid: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  removeSelectedItems: () => void;

  addItem: (assetIdOrItem: AssetId | Partial<CanvasItem>, size?: AssetSize, role?: ItemRole, x?: number, y?: number) => string;
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

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  format: DEFAULT_FORMAT,
  paletteId: DEFAULT_PALETTE,
  customPalette: null,
  layoutMode: 'headline',
  includeBackgrounds: true,
  items: INITIAL_ITEMS,
  lastPrompt: '',
  selectedUid: 'demo-hero',
  selectedUids: ['demo-hero'],
  viewport: { panX: 0, panY: 0, zoom: 1 },
  snapToGrid: true,
  showGrid: false,
  gridStep: 48,
  isGenerating: false,
  past: [],
  future: [],
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setFormat: (format) => {
    const state = get();
    if (state.format === format) return;
    const snap = createSnapshot(state);

    const canonicalItem = state.items.find((i) => i.uid.startsWith('canonical-'));
    if (canonicalItem) {
      const canonicalId = (Object.keys(CANONICAL_COMPOSITIONS) as CanonicalCompositionId[]).find(
        (id) => canonicalItem.uid.startsWith(`canonical-${id}-`)
      );
      if (canonicalId) {
        const newItems = getCanonicalComposition(canonicalId, format);
        set({
          format,
          items: newItems,
          past: [...state.past.slice(-MAX_HISTORY + 1), snap],
          future: [],
        });
        return;
      }
    }

    const oldSpec = getFormatSpec(state.format);
    const newSpec = getFormatSpec(format);
    const scaleRatio = newSpec.defaultHeroScale / oldSpec.defaultHeroScale;

    const transformedItems = state.items.map((it) => ({
      ...it,
      x: Math.round(Math.max(40, Math.min(newSpec.width - 40, (it.x / oldSpec.width) * newSpec.width))),
      y: Math.round(Math.max(40, Math.min(newSpec.height - 40, (it.y / oldSpec.height) * newSpec.height))),
      scale: Number(Math.max(0.2, it.scale * scaleRatio).toFixed(2)),
    }));

    set({ format, items: transformedItems, past: [...state.past.slice(-MAX_HISTORY + 1), snap], future: [] });
  },
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
  setLayoutMode: (layoutMode) => {
    const state = get();
    const newItems = rearrangeItemsForLayout(state.items, layoutMode, state.format);
    const snap = createSnapshot(state);
    set({
      layoutMode,
      items: newItems,
      past: [...state.past.slice(-MAX_HISTORY + 1), snap],
      future: [],
    });
  },
  setIncludeBackgrounds: (includeBackgrounds) => {
    const state = get();
    const snap = createSnapshot(state);
    const activeUids = state.selectedUids.length > 0
      ? state.selectedUids
      : (state.selectedUid ? [state.selectedUid] : []);
    const nextSelectedUids = includeBackgrounds
      ? activeUids
      : activeUids.filter((uid) => {
          const item = state.items.find((it) => it.uid === uid);
          return item?.role !== 'ghost';
        });
    const shouldDeselectPrimary = !includeBackgrounds && state.items.find((it) => it.uid === state.selectedUid)?.role === 'ghost';
    const finalSelectedUid = shouldDeselectPrimary ? null : (nextSelectedUids[0] ?? null);
    set({
      includeBackgrounds,
      selectedUids: nextSelectedUids,
      selectedUid: finalSelectedUid,
      past: [...state.past.slice(-MAX_HISTORY + 1), snap],
      future: [],
    });
  },

  setSelectedUid: (uid) => set({ selectedUid: uid, selectedUids: uid ? [uid] : [] }),
  selectItem: (uid, multi = false) => {
    if (!uid) { set({ selectedUid: null, selectedUids: [] }); return; }
    const state = get();
    if (multi) {
      const exists = state.selectedUids.includes(uid);
      const nextUids = exists ? state.selectedUids.filter((id) => id !== uid) : [...state.selectedUids, uid];
      set({ selectedUids: nextUids, selectedUid: nextUids[0] ?? null });
    } else {
      set({ selectedUid: uid, selectedUids: [uid] });
    }
  },
  selectGroup: (uids) => set({ selectedUids: uids, selectedUid: uids[0] ?? null }),
  toggleSelectItem: (uid) => {
    const state = get(), exists = state.selectedUids.includes(uid);
    const nextUids = exists ? state.selectedUids.filter((id) => id !== uid) : [...state.selectedUids, uid];
    set({ selectedUids: nextUids, selectedUid: nextUids[0] ?? null });
  },
  selectAll: () => {
    const state = get();
    const visibleUids = state.items.filter((it) => state.includeBackgrounds || it.role !== 'ghost').map((it) => it.uid);
    set({ selectedUids: visibleUids, selectedUid: visibleUids[0] ?? null });
  },
  clearSelection: () => set({ selectedUid: null, selectedUids: [] }),

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

    set({ items: [...state.items, newItem], selectedUid: newItem.uid, selectedUids: [newItem.uid], past: [...state.past.slice(-MAX_HISTORY + 1), snap], future: [] });
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
    const toRemoveUids = state.selectedUids.includes(uid) && state.selectedUids.length > 1
      ? state.selectedUids
      : [uid];
    const newItems = state.items.filter((it) => !toRemoveUids.includes(it.uid));
    const newSelectedUids = state.selectedUids.filter((id) => !toRemoveUids.includes(id));
    set({
      items: newItems,
      selectedUids: newSelectedUids,
      selectedUid: newSelectedUids[0] ?? null,
      past: [...state.past.slice(-MAX_HISTORY + 1), snap],
      future: [],
    });
  },

  removeSelectedItems: () => {
    const state = get();
    if (state.selectedUids.length === 0) return;
    const snap = createSnapshot(state);
    const newItems = state.items.filter((it) => !state.selectedUids.includes(it.uid));
    set({
      items: newItems,
      selectedUids: [],
      selectedUid: null,
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
    set({ items: [...state.items, cloned], selectedUid: newUid, selectedUids: [newUid], past: [...state.past.slice(-MAX_HISTORY + 1), snap], future: [] });
    return newUid;
  },

  setItems: (items) => {
    const snap = createSnapshot(get());
    set((s) => ({ items, selectedUid: null, selectedUids: [], past: [...s.past.slice(-MAX_HISTORY + 1), snap], future: [] }));
  },

  clearCanvas: () => {
    const snap = createSnapshot(get());
    set((s) => ({ items: [], selectedUid: null, selectedUids: [], past: [...s.past.slice(-MAX_HISTORY + 1), snap], future: [] }));
  },

  bringForward: (uid) => {
    const s = get(), items = reorderCanvasLayers(s.items, uid, 'forward');
    if (items !== s.items) set({ items, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(s)], future: [] });
  },
  sendBackward: (uid) => {
    const s = get(), items = reorderCanvasLayers(s.items, uid, 'backward');
    if (items !== s.items) set({ items, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(s)], future: [] });
  },
  bringToFront: (uid) => {
    const s = get(), items = reorderCanvasLayers(s.items, uid, 'front');
    if (items !== s.items) set({ items, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(s)], future: [] });
  },
  sendToBack: (uid) => {
    const s = get(), items = reorderCanvasLayers(s.items, uid, 'back');
    if (items !== s.items) set({ items, past: [...s.past.slice(-MAX_HISTORY + 1), createSnapshot(s)], future: [] });
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
      const requestedLayout = typeof request === 'object' && request?.layoutMode ? request.layoutMode : state.layoutMode;
      const targetLayout: LayoutMode | 'auto' = requestedLayout && requestedLayout !== 'auto' ? requestedLayout : 'auto';

      const requestedPalette = typeof request === 'object' && request?.paletteId ? request.paletteId : 'auto';
      const paletteId = requestedPalette;
      const includeBackgrounds = typeof request === 'object' && request?.includeBackgrounds !== undefined
        ? request.includeBackgrounds
        : state.includeBackgrounds;

      const res = await composeCover({
        prompt,
        format: state.format,
        layoutMode: targetLayout,
        paletteId,
        includeBackgrounds,
        seed: typeof request === 'object' ? request?.seed : undefined,
      });

      const effectiveLayout: LayoutMode =
        targetLayout !== 'auto'
          ? targetLayout
          : res.resolvedLayout || 'centered';

      const effectivePalette: PaletteId =
        requestedPalette !== 'auto' && requestedPalette
          ? requestedPalette
          : res.recommendedPalette;

      const finalItems =
        targetLayout !== 'auto' && targetLayout !== res.resolvedLayout
          ? rearrangeItemsForLayout(res.items, targetLayout, state.format)
          : res.items;

      set((curr) => ({
        items: finalItems,
        paletteId: effectivePalette,
        layoutMode: effectiveLayout,
        lastPrompt: prompt,
        selectedUid: null,
        selectedUids: [],
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
    set({ ...applySnapshot(past[past.length - 1]), past: past.slice(0, -1), future: [currentSnap, ...future.slice(0, MAX_HISTORY - 1)] });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const currentSnap = createSnapshot(get());
    set({ ...applySnapshot(future[0]), past: [...past.slice(-MAX_HISTORY + 1), currentSnap], future: future.slice(1) });
  },
}));

export const canvasStore = useCanvasStore;
