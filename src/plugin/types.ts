import type { ItemRole } from '../types/schema';

export type PluginActionType = 'INSERT_COVER' | 'INSERT_ITEM' | 'NOTIFY' | 'OPEN_EXTERNAL';

export interface PluginItemMetadata {
  uid: string;
  assetId: string;
  name?: string;
  size: 'L' | 'S';
  role: ItemRole;
}

export interface InsertCoverPayload {
  svg: string;
  formatId: string;
  width: number;
  height: number;
  title?: string;
  items?: PluginItemMetadata[];
}

export interface InsertItemPayload {
  svg: string;
  assetId?: string;
  name: string;
  size: 'L' | 'S';
  role?: ItemRole;
}

export interface NotifyPayload {
  message: string;
  error?: boolean;
  timeout?: number;
}

export interface OpenExternalPayload {
  url: string;
}

export type PluginMessage =
  | { type: 'INSERT_COVER'; payload: InsertCoverPayload }
  | { type: 'INSERT_ITEM'; payload: InsertItemPayload }
  | { type: 'NOTIFY'; payload: NotifyPayload }
  | { type: 'OPEN_EXTERNAL'; payload: OpenExternalPayload };

export function isFigmaEnvironment(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

export function postToFigma(message: PluginMessage): void {
  if (isFigmaEnvironment()) {
    window.parent.postMessage({ pluginMessage: message }, '*');
  } else {
    console.warn('[Figma Bridge] Outside Figma environment; message ignored:', message.type);
  }
}
