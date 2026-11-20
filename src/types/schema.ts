/**
 * Strict TypeScript contracts for Isometric Cover Builder
 * Based on isometric_cover_builder_plan.md Section 5
 */

export type AssetId =
  | 'wallet'
  | 'smartphone'
  | 'puzzle'
  | 'coin'
  | 'headphones'
  | 'lamp'
  | 'flowers_vase'
  | 'notepad'
  | 'folder'
  | 'pen';

export type AssetSize = 'L' | 'S';

/** foreground = 100% контрастный объект; ghost = полупрозрачный силуэт (0.15–0.25) */
export type ItemRole = 'foreground' | 'ghost';

/** og = 1200x630 (основной горизонтальный), 16:9 = 1920x1080, 1:1 = 1080x1080, 9:16 = 1080x1920 */
export type CanvasFormatId = 'og' | '16:9' | '1:1' | '9:16';

export type LayoutMode = 'headline' | 'offset' | 'centered';

export type PaletteId = 'warm-pastel' | 'fresh-mint' | 'soft-coral' | 'custom' | (string & {});

/** Канонические размеры ассетов из Figma */
export const ASSET_VIEWBOX_SIZE: Record<AssetSize, { width: number; height: number }> = {
  L: { width: 600, height: 600 },
  S: { width: 200, height: 200 },
};

export interface Point2D {
  x: number;
  y: number;
}

export interface IsoGridPoint {
  gx: number;
  gy: number;
  gz?: number;
}

export interface FormatSpec {
  id: CanvasFormatId;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  /** Рекомендуемый масштаб Hero (600x600) по умолчанию для данного формата */
  defaultHeroScale: number;
  /** Рекомендуемый масштаб Satellite (200x200) по умолчанию для данного формата */
  defaultSatelliteScale: number;
  description?: string;
}

export interface PaletteTokens {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  light: string;
}

export interface PaletteConfig {
  id: PaletteId;
  name: string;
  /** 4 исходных hex-цвета из Figma для отображения в UI-свотчах */
  figmaSwatches: [string, string, string, string];
  tokens: PaletteTokens;
  ghostOpacity: number;
  semanticDomains: string[];
}

export interface ComponentMetadata {
  id: AssetId;
  nameRu: string;
  nameEn: string;
  category: 'finance' | 'tech' | 'work' | 'lifestyle' | 'creativity';
  dimensions: Record<AssetSize, { width: number; height: number }>;
  /** Опорная точка (pivot) внутри локального viewBox: { x: 300, y: 300 } для L, { x: 100, y: 100 } для S */
  anchor: Record<AssetSize, { x: number; y: number }>;
  /** Радиус коллизии в px при scale = 1.0 (используется анти-коллизией автогенератора) */
  collisionRadiusPx: Record<AssetSize, number>;
  keywords: string[];
  heroSuitability: number; // 0..1
}

export interface CanvasItem {
  uid: string;
  assetId: AssetId;
  size: AssetSize;
  role: ItemRole;
  /** Экранные координаты центра объекта внутри viewBox холста (px) */
  x: number;
  y: number;
  zHeight: number;
  /** Угол поворота (шаг 30° / 60° / 90°) */
  rotation: number;
  /** Множитель масштаба (0.35 .. 1.8) */
  scale: number;
  opacity: number;
  manualLayerOffset: number;
  flipX?: boolean;
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number; // 0.25 .. 3.0
}

export interface LayoutSlot {
  role: ItemRole;
  size: AssetSize;
  /** Относительные координаты слота (0..1) */
  normalizedX: number;
  normalizedY: number;
  rotation?: number;
  scaleMultiplier?: number;
  manualLayerOffset?: number;
  slotName?: string;
}

export interface LayoutTemplate {
  layoutMode: LayoutMode;
  formatCategory: 'horizontal' | 'square' | 'vertical';
  includeBackgrounds: boolean;
  heroSlot: LayoutSlot;
  satelliteSlots: LayoutSlot[];
  ghostSlots: LayoutSlot[];
}

export interface AICompositionRequest {
  prompt: string;
  format: CanvasFormatId;
  layoutMode: LayoutMode | 'auto';
  paletteId?: PaletteId | 'auto';
  includeBackgrounds: boolean;
  seed?: number;
}

export interface AICompositionResponse {
  items: CanvasItem[];
  recommendedPalette: PaletteId;
  resolvedLayout: LayoutMode;
  rationale: string;
  source: 'offline-heuristic' | 'llm-api';
}

export interface CanvasState {
  // --- Сериализуемое состояние сцены (Undo/Redo через zundo) ---
  format: CanvasFormatId;
  paletteId: PaletteId;
  customPalette?: PaletteConfig | null;
  layoutMode: LayoutMode;
  includeBackgrounds: boolean;
  items: CanvasItem[];
  lastPrompt: string;

  // --- Эфемерное UI-состояние (вне Undo/Redo) ---
  selectedUid: string | null;
  viewport: ViewportState;
  snapToGrid: boolean;
  showGrid: boolean;
  gridStep: number; // шаг изосетки в px (по умолчанию 48)
  isGenerating: boolean;
}

export interface ExportOptions {
  format: 'svg' | 'png';
  scale?: 1 | 2 | 3;
  inlineTokens?: boolean;
  filename?: string;
}
