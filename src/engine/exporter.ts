import { CanvasFormatId, ExportOptions, PaletteId, PaletteTokens } from '../types/schema';
import { FORMAT_PRESETS, getFormatSpec } from '../config/formats';
import { getPaletteConfig } from '../config/palettes';

export interface CleanSvgOptions {
  format?: CanvasFormatId;
  paletteId?: PaletteId;
  inlineTokens?: boolean;
}

/**
 * Replaces all CSS token variables var(--token-*) with concrete hex values from the palette.
 */
export function inlineCssTokens(svgString: string, tokens: PaletteTokens): string {
  let result = svgString;
  const tokenMap: Record<string, string> = {
    bg: tokens.bg,
    surface: tokens.surface,
    primary: tokens.primary,
    secondary: tokens.secondary,
    accent: tokens.accent,
    light: tokens.light,
  };

  for (const [key, hex] of Object.entries(tokenMap)) {
    const varPattern = new RegExp(`var\\(--token-${key}(?:,\\s*[^)]+)?\\)`, 'g');
    result = result.replace(varPattern, hex);
  }

  // Replace any remaining token variables with their fallback value if present
  result = result.replace(/var\(--token-[a-zA-Z0-9_-]+,\s*([^)]+)\)/g, '$1');

  return result;
}

/**
 * Builds clean, standalone SVG XML string from a canvas SVG element:
 * - Strips editor overlays [data-editor-only="true"]
 * - Resets editor pan/zoom viewport group transforms
 * - Enforces explicit xmlns, width, height, viewBox
 * - Inlines Figma hex tokens or injects CSS root tokens
 */
export function buildCleanSvgString(
  svgElement: SVGSVGElement,
  options: CleanSvgOptions = {}
): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // 1. Remove all editor-only nodes (grid lines, selection overlay, handles)
  clone.querySelectorAll('[data-editor-only="true"]').forEach((node) => node.remove());

  // 2. Reset editor pan/zoom transforms and ensure structured item IDs for Figma parity
  clone.querySelectorAll('[data-viewport-group="true"]').forEach((node) => {
    node.removeAttribute('transform');
  });
  clone.querySelectorAll('[data-uid]').forEach((node) => {
    const uid = node.getAttribute('data-uid');
    const role = node.getAttribute('data-role') || 'foreground';
    const assetId = node.getAttribute('data-asset-id');
    const size = node.getAttribute('data-size') || 'L';
    const currentId = node.getAttribute('id') || '';
    if (uid && assetId && !/^canvas-item-(foreground|ghost)-[a-z_]+-[ls]-/i.test(currentId)) {
      node.setAttribute('id', `canvas-item-${role}-${assetId}-${size}-${uid}`);
    }
  });

  // 3. Resolve canvas geometry
  const formatId = options.format ?? (clone.getAttribute('data-format-id') as CanvasFormatId) ?? 'og';
  const spec = getFormatSpec(formatId);
  const width = spec.width;
  const height = spec.height;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // 4. Resolve palette tokens
  const paletteId = options.paletteId ?? (clone.getAttribute('data-palette-id') as PaletteId) ?? 'lavender';
  const palette = getPaletteConfig(paletteId);
  const inline = options.inlineTokens ?? true;

  if (!inline) {
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `:root {
      --token-bg: ${palette.tokens.bg};
      --token-surface: ${palette.tokens.surface};
      --token-primary: ${palette.tokens.primary};
      --token-secondary: ${palette.tokens.secondary};
      --token-accent: ${palette.tokens.accent};
      --token-light: ${palette.tokens.light};
    }`;
    const defs = clone.querySelector('defs') || clone.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), clone.firstChild);
    defs.appendChild(styleEl);
  }

  // 5. Serialize to XML string
  const serializer = new XMLSerializer();
  let xml = serializer.serializeToString(clone);

  if (inline) {
    xml = inlineCssTokens(xml, palette.tokens);
  }

  if (!xml.startsWith('<?xml')) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
  }

  return xml;
}

/**
 * Downloads a Blob as a file in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || !window.URL) return;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Exports canvas to clean standalone SVG (Figma-ready by default).
 */
export async function exportSvg(
  svgElement: SVGSVGElement,
  options: Partial<ExportOptions> = {}
): Promise<{ blob: Blob; filename: string }> {
  const filename = options.filename ?? `isometric-cover-${Date.now()}.svg`;
  const xml = buildCleanSvgString(svgElement, {
    inlineTokens: options.inlineTokens ?? true,
  });

  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
  return { blob, filename };
}

/**
 * Exports canvas to crisp high-DPI PNG (2x by default, or 3x) via Image.decode() and HTMLCanvasElement.
 */
export async function exportPng(
  svgElement: SVGSVGElement,
  options: Partial<ExportOptions> = {}
): Promise<{ blob: Blob; filename: string }> {
  const scale = options.scale ?? 2;
  const filename = options.filename ?? `isometric-cover-${Date.now()}@${scale}x.png`;

  const formatId = (svgElement.getAttribute('data-format-id') as CanvasFormatId) ?? 'og';
  const spec = FORMAT_PRESETS[formatId] ?? FORMAT_PRESETS.og;
  const targetWidth = Math.round(spec.width * scale);
  const targetHeight = Math.round(spec.height * scale);

  // Prepare clean SVG XML with Figma hex tokens inlined
  const xml = buildCleanSvgString(svgElement, { inlineTokens: true });
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.src = blobUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not supported in this browser.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate PNG blob from canvas.'));
      }, 'image/png');
    });

    downloadBlob(pngBlob, filename);
    return { blob: pngBlob, filename };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
