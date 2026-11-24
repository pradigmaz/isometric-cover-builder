import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\Zaikana\\.gemini\\antigravity\\brain\\92077189-7aea-4a95-987b-24e66f5d1832';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'live_verification');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!fs.existsSync(BROWSER_PATH)) {
  throw new Error(`Edge executable not found at: ${BROWSER_PATH}`);
}

console.log('📸 Capturing live screenshots from dev server http://127.0.0.1:5173 ...');

const TARGETS = [
  {
    name: '01_studio_overview.png',
    url: 'http://127.0.0.1:5173/',
    width: 1440,
    height: 900,
  },
  {
    name: '02_plugin_ui_view.png',
    url: 'http://127.0.0.1:5173/?plugin=true',
    width: 460,
    height: 720,
  },
];

for (const t of TARGETS) {
  const outPath = path.join(SCREENSHOTS_DIR, t.name);
  console.log(`Taking screenshot for ${t.url} (${t.width}x${t.height}) -> ${outPath}`);

  execFileSync(BROWSER_PATH, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${t.width},${t.height}`,
    `--screenshot=${outPath}`,
    '--virtual-time-budget=4000',
    t.url,
  ]);

  if (fs.existsSync(outPath)) {
    const stat = fs.statSync(outPath);
    console.log(`✔ Captured: ${t.name} (${Math.round(stat.size / 1024)} KB)`);
  } else {
    console.error(`❌ Failed to capture ${t.name}`);
  }
}

console.log('🎉 Live screenshots captured successfully!');
