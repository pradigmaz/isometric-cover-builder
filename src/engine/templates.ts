import {
  CanvasFormatId,
  CanvasItem,
  LayoutMode,
  PaletteId,
} from '../types/schema';
import { getAssetMetadata } from '../assets/registry';

export const USER_TEMPLATES_STORAGE_KEY = 'isometric_cover_user_templates';

export interface UserTemplate {
  id: string;
  name: string;
  createdAt: number;
  format: CanvasFormatId;
  paletteId: PaletteId;
  layoutMode: LayoutMode;
  items: CanvasItem[];
  itemCount: number;
  assetSummary: string[];
}

export interface SaveTemplateInput {
  name: string;
  format: CanvasFormatId;
  paletteId: PaletteId;
  layoutMode: LayoutMode;
  items: CanvasItem[];
}

function getSafeStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Cross-origin or restricted iframe storage access
  }
  return null;
}

/**
 * Loads all user saved templates from localStorage.
 */
export function loadUserTemplates(): UserTemplate[] {
  const storage = getSafeStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(USER_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('[templates] Failed to parse stored templates:', err);
  }
  return [];
}

/**
 * Persists the entire list of user templates to localStorage.
 */
export function persistUserTemplates(templates: UserTemplate[]): void {
  const storage = getSafeStorage();
  if (!storage) return;

  try {
    storage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.warn('[templates] Failed to save templates to localStorage:', err);
  }
}

/**
 * Saves current composition as a user template.
 */
export function saveUserTemplate(input: SaveTemplateInput): UserTemplate {
  const existing = loadUserTemplates();
  const trimmedName = input.name.trim() || `Шаблон #${existing.length + 1}`;

  // Generate asset summary (unique asset names in Russian)
  const uniqueAssetIds = Array.from(new Set(input.items.map((it) => it.assetId)));
  const assetSummary = uniqueAssetIds.map((id) => {
    try {
      return getAssetMetadata(id).nameRu;
    } catch {
      return id;
    }
  });

  const newTemplate: UserTemplate = {
    id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmedName,
    createdAt: Date.now(),
    format: input.format,
    paletteId: input.paletteId,
    layoutMode: input.layoutMode,
    items: input.items.map((item) => ({ ...item })),
    itemCount: input.items.length,
    assetSummary,
  };

  const updated = [newTemplate, ...existing];
  persistUserTemplates(updated);
  return newTemplate;
}

/**
 * Deletes a template by ID and returns the updated template array.
 */
export function deleteUserTemplate(id: string): UserTemplate[] {
  const existing = loadUserTemplates();
  const updated = existing.filter((tmpl) => tmpl.id !== id);
  persistUserTemplates(updated);
  return updated;
}
