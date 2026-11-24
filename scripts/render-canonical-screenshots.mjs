import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Setup ES module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'scratch', 'canonical_renders');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Find chrome or edge executable
const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const BROWSER_PATH = BROWSER_CANDIDATES.find((p) => fs.existsSync(p));
if (!BROWSER_PATH) {
  throw new Error(`No browser executable found in: ${BROWSER_CANDIDATES.join(', ')}`);
}

// Dynamically import compiled or tsx helper
const { renderCoverSvgString } = await import('../src/plugin/svgHelper.ts');
const { getFormatSpec } = await import('../src/config/formats.ts');

const PAIRINGS = [
  'phone-puzzles',
  'book-phone',
  'folder-wallet-coin',
  'headphones-flowers',
  'lamp-wallet-coin',
  'book-puzzles-pen',
];

const FORMATS = ['1:1', '16:9', '9:16'];

console.log('🎨 Starting Canonical Cover Headless Rendering...');

for (const pairingId of PAIRINGS) {
  for (const format of FORMATS) {
    const spec = getFormatSpec(format);
    const svg = renderCoverSvgString(pairingId, format);

    const svgFile = path.join(OUT_DIR, `${pairingId}_${format.replace(':', 'x')}.svg`);
    const htmlFile = path.join(OUT_DIR, `${pairingId}_${format.replace(':', 'x')}.html`);
    const pngFile = path.join(OUT_DIR, `${pairingId}_${format.replace(':', 'x')}.png`);

    fs.writeFileSync(svgFile, svg, 'utf-8');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;

    fs.writeFileSync(htmlFile, html, 'utf-8');

    // Run headless Chrome to take high-res screenshot matching format width and height
    // To ensure exact artboard capture without chrome window borders:
    // Scale window-size or capture at 1:1 pixel size
    // For fast rendering and high readability, we capture at 960x... or 1x
    const scale = format === '9:16' ? 0.5 : format === '16:9' ? 0.5 : 0.6;
    const w = Math.round(spec.width * scale);
    const h = Math.round(spec.height * scale);

    execFileSync(BROWSER_PATH, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${w},${h}`,
      `--screenshot=${pngFile}`,
      htmlFile,
    ]);

    console.log(`✔ Rendered: ${pairingId} [${format}] -> ${path.relative(ROOT, pngFile)} (${w}x${h})`);
  }
}

console.log('🎉 All 18 canonical covers successfully rendered to PNG!');
