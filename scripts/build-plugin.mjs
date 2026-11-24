import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const outDir = path.resolve(rootDir, 'dist/plugin');
const tempDir = path.resolve(rootDir, 'dist/plugin-temp');

function createZipBuffer(entries) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(dataBuf);
    const crc = zlib.crc32(dataBuf);

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    localHeaders.push(localHeader, compressed);
    centralHeaders.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

async function buildPlugin() {
  console.log('🚀 Building Figma Plugin artifacts...');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Bundle Figma QuickJS Sandbox code (code.ts -> dist/plugin/code.js)
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/plugin/code.ts')],
    bundle: true,
    outfile: path.resolve(outDir, 'code.js'),
    target: 'es2020',
    format: 'iife',
    minify: true,
  });
  console.log('✔ Bundled dist/plugin/code.js');

  // 2. Build Plugin UI with Vite
  const viteBin = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');
  const viteCmd = fs.existsSync(viteBin)
    ? `node "${viteBin}" build --config vite.config.plugin.ts`
    : `npx vite build --config vite.config.plugin.ts`;
  execSync(viteCmd, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  // 3. Inline JS and CSS into self-contained dist/plugin/ui.html
  const tempHtmlPath = path.resolve(tempDir, 'index.html');
  if (!fs.existsSync(tempHtmlPath)) {
    throw new Error(`Vite build output missing: ${tempHtmlPath}`);
  }

  let html = fs.readFileSync(tempHtmlPath, 'utf8');
  const assetsDir = path.resolve(tempDir, 'assets');

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    let combinedCss = '';
    let combinedJs = '';

    for (const file of assetFiles) {
      const filePath = path.resolve(assetsDir, file);
      if (file.endsWith('.css')) {
        combinedCss += fs.readFileSync(filePath, 'utf8') + '\n';
      } else if (file.endsWith('.js')) {
        combinedJs += fs.readFileSync(filePath, 'utf8') + '\n';
      }
    }

    // Strip external stylesheet links and module script tags
    html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*type=["']module["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/gi, '');

    // Escape script tags inside inlined JS to prevent HTML parser confusion
    combinedJs = combinedJs.replace(/<script/gi, '\\x3cscript').replace(/<\/script/gi, '<\\/script');

    // Wrap in IIFE to keep global execution clean
    const wrappedJs = `;(function(){\n${combinedJs}\n})();`;

    // Inject inlined stylesheet
    if (combinedCss) {
      html = html.replace('</head>', () => `<style>\n${combinedCss}\n</style></head>`);
    }

    // Inject inlined script with function replacer to prevent $& / $ patterns from corrupting JS
    if (combinedJs) {
      html = html.replace('</body>', () => `<script>\n${wrappedJs}\n</script></body>`);
    }
  }

  const finalHtmlPath = path.resolve(outDir, 'ui.html');
  fs.writeFileSync(finalHtmlPath, html, 'utf8');
  console.log('✔ Generated self-contained dist/plugin/ui.html');

  // 4. Clean up temporary directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // 5. Generate public/isometric-cover-builder-plugin.zip
  const manifestPath = path.resolve(rootDir, 'manifest.json');
  const codePath = path.resolve(outDir, 'code.js');
  const uiPath = path.resolve(outDir, 'ui.html');
  const publicDir = path.resolve(rootDir, 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const readmeContent = `===================================================================
       Isometric Cover Builder — Плагин для Figma Desktop
===================================================================

О плагине:
Конструктор изометрических обложек и библиотека векторных ассетов.
Позволяет в один клик генерировать изометрические обложки
(1200x630, 1080x1080, 1080x1920) и вставлять отдельные векторные ассеты прямо в Figma.

Пошаговая инструкция установки в Figma Desktop (3 простых шага):

1. Распаковка архива:
   Распакуйте этот zip-архив в постоянную папку на компьютере
   (например, в Документы или папку проектов). Не перемещайте папку после импорта.

2. Импорт манифеста в Figma Desktop:
   Откройте приложение Figma Desktop и перейдите в меню:
   Plugins -> Development -> Import plugin from manifest...
   (или в панели плагинов: Plugins -> Manage plugins... -> Development -> Import plugin from manifest...)

3. Выбор файла manifest.json:
   В открывшемся окне выберите файл "manifest.json" из распакованной папки.

Готово! Плагин "Isometric Cover Builder" появится в списке Development plugins
и готов к запуску в любом вашем документе Figma.
===================================================================
`;

  const zipBuffer = createZipBuffer([
    { name: 'manifest.json', data: fs.readFileSync(manifestPath) },
    { name: 'dist/plugin/code.js', data: fs.readFileSync(codePath) },
    { name: 'dist/plugin/ui.html', data: fs.readFileSync(uiPath) },
    { name: 'README.txt', data: Buffer.from(readmeContent, 'utf8') },
  ]);

  const publicZipPath = path.resolve(publicDir, 'isometric-cover-builder-plugin.zip');
  fs.writeFileSync(publicZipPath, zipBuffer);
  console.log(`✔ Generated ${publicZipPath} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);

  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.resolve(distDir, 'isometric-cover-builder-plugin.zip'), zipBuffer);
  }

  console.log('🎉 Figma Plugin build completed successfully!');
}

buildPlugin().catch((err) => {
  console.error('Plugin build failed:', err);
  process.exit(1);
});
