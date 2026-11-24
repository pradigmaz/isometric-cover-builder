import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\Zaikana\\.gemini\\antigravity\\brain\\92077189-7aea-4a95-987b-24e66f5d1832';
const OUT_DIR = path.join(ARTIFACT_DIR, 'scenario_renders');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const { generateCover } = await import('../src/engine/generator.ts');
const { getFormatSpec } = await import('../src/config/formats.ts');
const { getPaletteConfig } = await import('../src/config/palettes.ts');
const { inlineCssTokens } = await import('../src/engine/exporter.ts');
const { sortCanvasItems } = await import('../src/engine/isometric.ts');
const { ASSET_REGISTRY } = await import('../src/assets/registry.ts');
const { IsometricTableBackground } = await import('../src/components/canvas/IsometricTableBackground.tsx');

function renderItemsToSvg(items, format, paletteId = 'lavender') {
  const spec = getFormatSpec(format);
  const palette = getPaletteConfig(paletteId);
  const sorted = sortCanvasItems(items);

  const rawXml = renderToStaticMarkup(
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: `0 0 ${spec.width} ${spec.height}`,
        width: spec.width,
        height: spec.height,
      },
      React.createElement(
        'defs',
        null,
        React.createElement(
          'clipPath',
          { id: 'artboard-clip' },
          React.createElement('rect', { width: spec.width, height: spec.height })
        )
      ),
      React.createElement('rect', { width: spec.width, height: spec.height, fill: 'var(--token-bg)' }),
      React.createElement(
        'g',
        { clipPath: 'url(#artboard-clip)' },
        React.createElement(IsometricTableBackground, {
          width: spec.width,
          height: spec.height,
          format,
          paletteId,
          showGridStrokes: true,
          showLabel: false,
        })
      ),
      React.createElement(
        'g',
        { id: 'canvas-items-layer', clipPath: 'url(#artboard-clip)' },
        sorted.map((item) => {
          const entry = ASSET_REGISTRY[item.assetId];
          if (!entry) return null;
          const center = item.size === 'L' ? 300 : 100;
          const visualY = item.y - (item.zHeight || 0);
          const scaleX = (item.flipX ? -1 : 1) * (item.scale || 1);
          const scaleY = item.scale || 1;
          const rotation = item.rotation || 0;
          const transform = `translate(${item.x}, ${visualY}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(-${center}, -${center})`;
          const isGhost = item.role === 'ghost';
          const effectiveOpacity = isGhost ? (item.opacity ?? 0.22) : (item.opacity ?? 1);

          return React.createElement(
            'g',
            {
              key: item.uid,
              id: `canvas-item-${item.uid}`,
              transform,
              opacity: effectiveOpacity,
            },
            React.createElement(entry.Component, { size: item.size, role: item.role })
          );
        })
      )
    )
  );

  return inlineCssTokens(rawXml, palette.tokens);
}

const TEST_CASES = [
  {
    id: '01_metaphor_ux_design',
    title: 'Сценарий 1: Метафора «UX дизайн»',
    prompt: 'UX дизайн и архитектура',
    format: 'og',
    layoutMode: 'centered',
    paletteId: 'lavender',
    includeBackgrounds: true,
  },
  {
    id: '02_metaphor_fintech_offset',
    title: 'Сценарий 1: Метафора «Финтех» (Со смещением)',
    prompt: 'Финтех и безопасность',
    format: 'og',
    layoutMode: 'offset',
    paletteId: 'peach-mint',
    includeBackgrounds: true,
  },
  {
    id: '03_metaphor_music_headline',
    title: 'Сценарий 1: Метафора «Музыка и подкасты» (Под заголовок)',
    prompt: 'Музыка и подкасты',
    format: '1:1',
    layoutMode: 'headline',
    paletteId: 'turquoise-purple',
    includeBackgrounds: true,
  },
  {
    id: '04_components_book_phone_centered',
    title: 'Сценарий 2: Компоненты «книга, пазлы, ручка, телефон» (Собрано)',
    prompt: 'книга, пазлы, ручка, телефон',
    format: 'og',
    layoutMode: 'centered',
    paletteId: 'lavender',
    includeBackgrounds: false,
  },
  {
    id: '05_components_book_phone_offset',
    title: 'Сценарий 2: Компоненты «книга, пазлы, ручка, телефон» (Со смещением)',
    prompt: 'книга, пазлы, ручка, телефон',
    format: 'og',
    layoutMode: 'offset',
    paletteId: 'lavender',
    includeBackgrounds: false,
  },
  {
    id: '06_components_book_phone_headline',
    title: 'Сценарий 2: Компоненты «книга, пазлы, ручка, телефон» (Под заголовок)',
    prompt: 'книга, пазлы, ручка, телефон',
    format: 'og',
    layoutMode: 'headline',
    paletteId: 'lavender',
    includeBackgrounds: false,
  },
  {
    id: '07_components_silhouette_lamp_wallet_coin',
    title: 'Сценарий 2: Компоненты с силуэтом «лампа, кошелёк, монета»',
    prompt: 'лампа, кошелёк, монета',
    format: 'og',
    layoutMode: 'headline',
    paletteId: 'peach-mint',
    includeBackgrounds: true,
  },
];

console.log('🚀 Running Engine Verification for Scenario 1 (Metaphor) and Scenario 2 (Components)...');

const results = [];

for (const tc of TEST_CASES) {
  const res = generateCover({
    prompt: tc.prompt,
    format: tc.format,
    layoutMode: tc.layoutMode,
    paletteId: tc.paletteId,
    includeBackgrounds: tc.includeBackgrounds,
  });

  const svg = renderItemsToSvg(res.items, tc.format, tc.paletteId);
  const spec = getFormatSpec(tc.format);

  const svgPath = path.join(OUT_DIR, `${tc.id}.svg`);
  const htmlPath = path.join(OUT_DIR, `${tc.id}.html`);
  const pngPath = path.join(OUT_DIR, `${tc.id}.png`);

  fs.writeFileSync(svgPath, svg, 'utf-8');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #121212; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, 'utf-8');

  // Capture headless Edge screenshot
  const scale = tc.format === 'og' ? 0.6 : 0.5;
  const w = Math.round(spec.width * scale);
  const h = Math.round(spec.height * scale);

  execFileSync(BROWSER_PATH, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${w},${h}`,
    `--screenshot=${pngPath}`,
    htmlPath,
  ]);

  const itemsSummary = res.items.map((it) => `${it.assetId} (${it.role}, x=${it.x}, y=${it.y})`).join('; ');
  console.log(`✔ [${tc.id}] ${tc.title}`);
  console.log(`  Items (${res.items.length}): ${itemsSummary}`);
  console.log(`  Saved screenshot: ${path.relative(ROOT, pngPath)} (${w}x${h})`);

  results.push({
    id: tc.id,
    title: tc.title,
    pngPath,
    itemsCount: res.items.length,
    items: res.items,
  });
}

console.log(`\n🎉 Verification Complete! All ${results.length} scenario test renders generated.`);
