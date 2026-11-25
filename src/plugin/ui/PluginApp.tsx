import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { postToFigma } from '../types';
import { renderAssetSvgString } from '../svgHelper';
import { buildCleanSvgString } from '../../engine/exporter';
import { ASSET_REGISTRY } from '../../assets/registry';
import { getFormatSpec } from '../../config/formats';
import { CANONICAL_COMPOSITIONS, CanonicalCompositionId, getCanonicalComposition } from '../../engine/canonicalCompositions';
import { PluginCoverPreview } from './PluginCoverPreview';
import { PluginElementsTab } from './PluginElementsTab';
import { AssetId, AssetSize, CanvasFormatId, ItemRole, LayoutMode } from '../../types/schema';
import { Box, Wand2, Sparkles, Shuffle, Search, X, ExternalLink, ClipboardPaste, Layers, Layout } from 'lucide-react';
import { rearrangeItemsForLayout } from '../../store/layoutReorder';

const CANONICAL_FORMATS = [
  { id: '16:9' as const, label: '16:9', dims: '1920×1080' },
  { id: '1:1' as const, label: '1:1', dims: '1080×1080' },
  { id: '9:16' as const, label: '9:16', dims: '1080×1920' },
  { id: 'og' as const, label: '1200×630', dims: 'Обложка статьи' },
];

const LAYOUT_MODES: { id: LayoutMode; label: string; sublabel: string; description: string }[] = [
  { id: 'centered', label: 'Собранно', sublabel: 'По центру', description: 'Сбалансированная композиция по центру' },
  { id: 'offset', label: 'Со смещением', sublabel: 'Диагональ', description: 'Динамичное смещение по изометрической оси' },
  { id: 'headline', label: 'Под заголовок', sublabel: 'Свободное поле', description: 'Свободное пространство для типографики заголовка' },
];

const CANONICAL_SCHEMES = [
  { id: 'lavender' as const, name: 'Лавандовая', paletteLabel: 'Тёплая / Лаванда', wall: '#DDD5F9', desk: '#9E91E8' },
  { id: 'peach-mint' as const, name: 'Персиково-мятная', paletteLabel: 'Свежая / Мята', wall: '#FEEFE3', desk: '#FDD7B9' },
  { id: 'turquoise-purple' as const, name: 'Бирюзовая', paletteLabel: 'Мягкая / Бирюза', wall: '#E1FAF9', desk: '#9FE5E5' },
];

const CANONICAL_STORIES = [
  { id: 'phone-puzzles' as const, label: '1. Телефон + Пазлы', tag: 'Технологии', desc: 'Смартфон и пазлы' },
  { id: 'book-phone' as const, label: '2. Книга + Телефон', tag: 'Учёба', desc: 'Книга и телефон' },
  { id: 'folder-wallet-coin' as const, label: '3. Папка + Кошелёк + Монета', tag: 'Финансы', desc: 'Папка и кошелёк' },
  { id: 'headphones-flowers' as const, label: '4. Наушники + Ваза', tag: 'Музыка', desc: 'Наушники и ваза' },
  { id: 'lamp-wallet-coin' as const, label: '5. Лампа + Кошелёк + Монета', tag: 'Финтех', desc: 'Лампа и монета' },
  { id: 'book-puzzles-pen' as const, label: '6. Книга + Пазлы + Ручка', tag: 'Креатив', desc: 'Книга, пазлы и ручка' },
];

const METAPHOR_CHIPS = ['Финтех', 'UX дизайн', 'Креатив', 'Учёба', 'Музыка', 'Финансы'];

const LIBRARY_ASSET_CHIPS: { id: AssetId; label: string; nameRu: string }[] = [
  { id: 'notepad', label: 'книга', nameRu: 'Книга' }, { id: 'folder', label: 'папка', nameRu: 'Папка' },
  { id: 'lamp', label: 'лампа', nameRu: 'Лампа' }, { id: 'flowers_vase', label: 'ваза', nameRu: 'Ваза' },
  { id: 'smartphone', label: 'телефон', nameRu: 'Телефон' }, { id: 'headphones', label: 'наушники', nameRu: 'Наушники' },
  { id: 'wallet', label: 'кошелёк', nameRu: 'Кошелёк' }, { id: 'coin', label: 'монета', nameRu: 'Монета' },
  { id: 'pen', label: 'ручка', nameRu: 'Ручка' }, { id: 'puzzle', label: 'пазлы', nameRu: 'Пазлы' },
];

export const PluginApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cover' | 'catalog'>('cover');
  const [generatorMode, setGeneratorMode] = useState<'presets' | 'smart'>('presets');
  const [prompt, setPrompt] = useState('Финтех и безопасность');
  const [selectedAssetSize, setSelectedAssetSize] = useState<AssetSize>('L');
  const [selectedAssetRole, setSelectedAssetRole] = useState<ItemRole>('foreground');
  const [activeStoryId, setActiveStoryId] = useState<CanonicalCompositionId | null>('phone-puzzles');
  const [isInserting, setIsInserting] = useState(false);

  const {
    format, setFormat, paletteId, setPalette,
    items, setItems, generateCover, isGenerating,
    layoutMode, setLayoutMode,
    includeBackgrounds, setIncludeBackgrounds,
  } = useCanvasStore();

  const loadStory = (storyId: CanonicalCompositionId, targetFormat: CanvasFormatId = format) => {
    setActiveStoryId(storyId);
    const storyConfig = CANONICAL_COMPOSITIONS[storyId];
    if (storyConfig?.recommendedPalette && !CANONICAL_SCHEMES.some((s) => s.id === paletteId)) {
      setPalette(storyConfig.recommendedPalette);
    }
    const rawItems = getCanonicalComposition(storyId, targetFormat);
    setItems(rearrangeItemsForLayout(rawItems, layoutMode, targetFormat));
  };

  useEffect(() => { loadStory('phone-puzzles', format); }, []);

  const handleFormatChange = (newFormat: CanvasFormatId) => {
    setFormat(newFormat);
  };

  const handleLayoutModeChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  const handleSmartGenerate = async (rawPrompt: string) => {
    const text = rawPrompt.trim();
    if (!text) return;
    setActiveStoryId(null);
    await generateCover({
      prompt: text,
      layoutMode,
      paletteId: 'auto',
      includeBackgrounds,
      seed: Math.floor(Math.random() * 1000000) + 1,
    });
  };

  const handleToggleComponentChip = (label: string) => {
    const parts = prompt.split(',').map((s) => s.trim()).filter(Boolean);
    const exists = parts.some((p) => p.toLowerCase() === label.toLowerCase());
    const next = exists ? parts.filter((p) => p.toLowerCase() !== label.toLowerCase()) : [...parts, label];
    const newPrompt = next.join(', ');
    setPrompt(newPrompt);
    if (next.length > 0) handleSmartGenerate(newPrompt);
  };

  const handleRandomComposition = async () => {
    const layoutOrder: LayoutMode[] = ['centered', 'offset', 'headline'];
    const nextLayout = layoutOrder[(layoutOrder.indexOf(layoutMode) + 1) % layoutOrder.length];
    const randomPresets = [
      'Финтех и безопасность',
      'UX дизайн',
      'Креатив',
      'Учёба',
      'Музыка',
      'Финансы',
      'книга, телефон',
      'папка, кошелёк, монета',
      'наушники, цветы',
      'лампа, кошелёк, монета',
    ];
    const candidates = randomPresets.filter((p) => p !== prompt.trim());
    const text = candidates[Math.floor(Math.random() * candidates.length)] || randomPresets[0];
    setPrompt(text);
    setActiveStoryId(null);
    await generateCover({
      prompt: text,
      layoutMode: nextLayout,
      paletteId: paletteId.startsWith('custom') ? paletteId : 'auto',
      includeBackgrounds,
      seed: Math.floor(Math.random() * 1000000) + 1,
    });
  };

  const handleOpenWebStudio = () => {
    const p = new URLSearchParams();
    if (activeStoryId) p.set('story', activeStoryId);
    if (format) p.set('format', format);
    if (paletteId) p.set('palette', paletteId);
    const url = `http://127.0.0.1:5173/?${p.toString()}`;
    try { window.open(url, '_blank'); } catch {}
    postToFigma({ type: 'OPEN_EXTERNAL', payload: { url } });
  };

  const handleInsertFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.includes('<svg') || !text.includes('</svg>')) {
        postToFigma({ type: 'NOTIFY', payload: { message: 'Буфер не содержит SVG. Скопируйте обложку в веб-студии.', error: true } });
        return;
      }
      const fmt = (text.match(/data-format-id=["']([^"']+)["']/i)?.[1] || format || '16:9') as CanvasFormatId;
      const vb = text.match(/viewBox=["']\s*0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
      const spec = getFormatSpec(fmt);
      const width = vb ? Math.round(parseFloat(vb[1])) : spec.width;
      const height = vb ? Math.round(parseFloat(vb[2])) : spec.height;
      postToFigma({ type: 'INSERT_COVER', payload: { svg: text, formatId: fmt, width, height, title: 'Из веб-студии' } });
    } catch (err) {
      postToFigma({ type: 'NOTIFY', payload: { message: `Ошибка чтения буфера: ${String(err)}`, error: true } });
    }
  };

  const handleInsertCover = () => {
    setIsInserting(true);
    try {
      const svgEl = document.getElementById('isometric-canvas-svg') as SVGSVGElement | null;
      if (!svgEl) {
        postToFigma({ type: 'NOTIFY', payload: { message: 'Элемент холста не найден', error: true } });
        return;
      }
      const spec = getFormatSpec(format);
      const cleanSvg = buildCleanSvgString(svgEl, { format, paletteId, inlineTokens: true });
      const title = activeStoryId
        ? (CANONICAL_COMPOSITIONS[activeStoryId]?.titleRu || CANONICAL_COMPOSITIONS[activeStoryId]?.titleEn)
        : prompt;
      const itemsMetadata = items.map((it) => ({
        uid: it.uid, assetId: it.assetId,
        name: ASSET_REGISTRY[it.assetId]?.metadata.nameEn || it.assetId,
        size: it.size, role: it.role,
      }));
      postToFigma({
        type: 'INSERT_COVER',
        payload: { svg: cleanSvg, formatId: format, width: spec.width, height: spec.height, title: title || 'Изометрическая', items: itemsMetadata },
      });
    } catch (err) {
      postToFigma({ type: 'NOTIFY', payload: { message: `Ошибка вставки: ${String(err)}`, error: true } });
    } finally {
      setIsInserting(false);
    }
  };

  const handleInsertAsset = (assetId: AssetId) => {
    try {
      const entry = ASSET_REGISTRY[assetId];
      const cleanSvg = renderAssetSvgString(assetId, selectedAssetSize, paletteId, selectedAssetRole);
      const name = entry?.metadata.nameEn || entry?.metadata.nameRu || assetId;
      postToFigma({
        type: 'INSERT_ITEM',
        payload: { svg: cleanSvg, assetId, name, size: selectedAssetSize, role: selectedAssetRole },
      });
    } catch (err) {
      postToFigma({ type: 'NOTIFY', payload: { message: `Ошибка вставки ассета: ${String(err)}`, error: true } });
    }
  };

  return (
    <div className="w-[440px] h-[680px] bg-[#1e1e1e] text-stone-100 flex flex-col select-none overflow-hidden font-sans">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#383838] bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight text-stone-200">
          <Box className="w-3.5 h-3.5 text-[#0d99ff]" />
          <span>Isometric Cover Builder</span>
        </div>
        <div className="flex bg-[#2c2c2c] p-0.5 rounded text-[11px] border border-[#383838]">
          <button onClick={() => setActiveTab('cover')} className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'cover' ? 'bg-[#383838] text-white font-medium shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}>
            Обложки
          </button>
          <button onClick={() => setActiveTab('catalog')} className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'catalog' ? 'bg-[#383838] text-white font-medium shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}>
            Элементы
          </button>
        </div>
      </div>

      {activeTab === 'cover' ? (
        <div className="flex-1 flex flex-col p-3 overflow-y-auto gap-2.5 text-xs">
          <div className="flex bg-[#2c2c2c] p-0.5 rounded text-[11px] border border-[#383838] shrink-0">
            <button onClick={() => { setGeneratorMode('presets'); if (!activeStoryId) loadStory('phone-puzzles', format); }} className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer truncate ${generatorMode === 'presets' ? 'bg-[#383838] text-white font-medium shadow-xs' : 'text-stone-400 hover:text-stone-200'}`} title="Готовые шаблоны / Готовые пресеты">
              Готовые шаблоны
            </button>
            <button onClick={() => setGeneratorMode('smart')} className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer truncate ${generatorMode === 'smart' ? 'bg-[#383838] text-white font-medium shadow-xs' : 'text-stone-400 hover:text-stone-200'}`} title="Умный генератор">
              Умный генератор
            </button>
          </div>

          {generatorMode === 'presets' && (
            <div className="space-y-1.5 bg-[#252525] p-2 rounded border border-[#383838]">
              <div className="flex items-center justify-between text-[11px] font-medium text-stone-300">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#0d99ff]" /> 6 готовых пресетов</span>
                <button type="button" onClick={handleRandomComposition} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2c2c2c] hover:bg-[#383838] text-stone-200 border border-[#383838] transition-colors text-[10px] font-medium cursor-pointer" title="Случайная композиция">
                  <Shuffle className="w-3 h-3" />
                  <span>Случайная композиция</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {CANONICAL_STORIES.map((s) => (
                  <button key={s.id} onClick={() => loadStory(s.id)} className={`py-1.5 px-2 rounded text-left border text-[10px] transition-colors flex flex-col justify-between cursor-pointer ${activeStoryId === s.id ? 'border-[#0d99ff] bg-[#0d99ff]/15 text-white font-medium shadow-xs' : 'border-[#383838] bg-[#1e1e1e] text-stone-300 hover:border-stone-500 hover:text-white'}`}>
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="truncate font-medium">{s.label}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-[#2c2c2c] text-stone-400 rounded shrink-0">{s.tag}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 opacity-70 truncate mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {generatorMode === 'smart' && (
            <div className="space-y-1.5 p-2 bg-[#252525] rounded border border-[#383838]">
              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span>Сценарий 1: Метафора или Сценарий 2: Компоненты</span>
                <span className="text-[9px] text-[#0d99ff]">Авто-определение</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#383838] rounded px-2 py-1 focus-within:border-[#0d99ff]">
                <Search className="w-3 h-3 text-stone-400 shrink-0" />
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSmartGenerate(prompt); }} placeholder="«Финтех и безопасность», «UX дизайн» или «книга, телефон»..." className="w-full bg-transparent text-[11px] text-white placeholder-stone-500 focus:outline-none" />
                {prompt && <button onClick={() => setPrompt('')} className="text-stone-500 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {METAPHOR_CHIPS.map((chip) => (
                    <button key={chip} onClick={() => { setPrompt(chip); handleSmartGenerate(chip); }} className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${prompt.toLowerCase().includes(chip.toLowerCase()) ? 'border-[#0d99ff] bg-[#0d99ff]/20 text-white font-medium' : 'border-[#383838] bg-[#2c2c2c] text-stone-300 hover:border-stone-500'}`}>
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {LIBRARY_ASSET_CHIPS.map((asset) => {
                    const normalizedPrompt = prompt.toLowerCase().replace(/ё/g, 'е');
                    const normalizedLabel = asset.label.replace(/ё/g, 'е');
                    const isSelected = asset.id === 'puzzle'
                      ? normalizedPrompt.includes('пазл')
                      : normalizedPrompt.includes(normalizedLabel);
                    return (
                      <button key={asset.id} onClick={() => handleToggleComponentChip(asset.label)} className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${isSelected ? 'border-[#0d99ff] bg-[#0d99ff]/20 text-white font-medium' : 'border-[#383838] bg-[#1e1e1e] text-stone-300 hover:border-stone-500'}`}>
                        {isSelected ? `✓ ${asset.nameRu}` : `+ ${asset.nameRu}`}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <button onClick={() => handleSmartGenerate(prompt)} disabled={isGenerating || !prompt.trim()} className="flex-1 py-1 px-2 bg-[#0d99ff] hover:bg-[#008ae6] text-white rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50">
                  <Wand2 className="w-3 h-3" />
                  <span>{isGenerating ? 'Сборка...' : 'Сгенерировать'}</span>
                </button>
                <button type="button" onClick={handleRandomComposition} className="px-2 py-1 bg-[#2c2c2c] hover:bg-[#383838] text-stone-300 rounded text-[10px] border border-[#383838] flex items-center gap-1 transition-colors cursor-pointer" title="Случайная композиция">
                  <Shuffle className="w-3 h-3" />
                  <span>Случайная композиция</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-medium text-stone-300 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#0d99ff]" /> Формат холста
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CANONICAL_FORMATS.map((f) => (
                <button key={f.id} onClick={() => handleFormatChange(f.id)} className={`py-1 px-1 rounded text-center border text-[10px] transition-colors cursor-pointer ${format === f.id ? 'border-[#0d99ff] bg-[#0d99ff]/15 text-white font-medium shadow-xs' : 'border-[#383838] bg-[#2c2c2c] text-stone-400 hover:border-stone-600 hover:text-stone-300'}`}>
                  <div>{f.label}</div>
                  <div className="text-[9px] text-stone-400 opacity-70">{f.dims}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1"><Layout className="w-3 h-3 text-[#0d99ff]" /> Компоновка</span>
              <span className="text-[9px] text-stone-400 opacity-80">3 варианта раскладки</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LAYOUT_MODES.map((lm) => (
                <button key={lm.id} type="button" onClick={() => handleLayoutModeChange(lm.id)} title={lm.description} className={`py-1 px-1 rounded text-center border text-[10px] transition-colors cursor-pointer ${layoutMode === lm.id ? 'border-[#0d99ff] bg-[#0d99ff]/15 text-white font-medium shadow-xs' : 'border-[#383838] bg-[#2c2c2c] text-stone-400 hover:border-stone-600 hover:text-stone-300'}`}>
                  <div className="font-medium">{lm.label}</div>
                  <div className="text-[9px] text-stone-400 opacity-70">{lm.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-300 mb-1">
              Цветовая палитра (Студия «Очень»)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CANONICAL_SCHEMES.map((s) => (
                <button key={s.id} type="button" onClick={() => setPalette(s.id)} title={`${s.name} — ${s.paletteLabel}`} className={`flex items-center justify-center gap-1 py-1 px-1 rounded border text-[10px] transition-colors cursor-pointer ${paletteId === s.id ? 'border-[#0d99ff] bg-[#2c2c2c] text-white font-medium shadow-xs' : 'border-[#383838] bg-[#2c2c2c]/60 text-stone-400 hover:border-stone-600 hover:text-stone-300'}`}>
                  <div className="flex gap-0.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.wall }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.desk }} />
                  </div>
                  <span className="truncate">{s.paletteLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1 bg-[#252525] rounded border border-[#383838] text-[11px]">
            <span className="text-stone-300 font-medium">Фоновый силуэт</span>
            <button
              type="button"
              onClick={() => setIncludeBackgrounds(!includeBackgrounds)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${includeBackgrounds ? 'bg-[#0d99ff]/20 border-[#0d99ff] text-white' : 'bg-[#2c2c2c] border-[#383838] text-stone-400 hover:text-stone-200'}`}
              title="Переключить отображение силуэтов на фоне"
            >
              {includeBackgrounds ? 'С силуэтом' : 'Без силуэта'}
            </button>
          </div>

          <div className="flex-1 min-h-[160px] bg-[#141414] rounded-lg border border-[#383838] flex items-center justify-center p-2 overflow-hidden relative shadow-inner">
            <PluginCoverPreview />
          </div>

          <div className="grid grid-cols-2 gap-1.5 shrink-0">
            <button type="button" onClick={handleOpenWebStudio} className="py-1.5 px-2 bg-[#252525] hover:bg-[#323232] text-stone-200 hover:text-white rounded border border-[#383838] hover:border-stone-500 text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer" title="Открыть сцену в браузере (127.0.0.1:5173) для детального 3D-редактирования">
              <ExternalLink className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
              <span className="truncate">🎨 Открыть в веб-студии</span>
            </button>
            <button type="button" onClick={handleInsertFromClipboard} className="py-1.5 px-2 bg-[#252525] hover:bg-[#323232] text-stone-200 hover:text-white rounded border border-[#383838] hover:border-stone-500 text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer" title="Вставить скопированный из веб-сервиса SVG прямо во фрейм Figma">
              <ClipboardPaste className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
              <span className="truncate">📥 Вставить из буфера студии</span>
            </button>
          </div>

          <button
            onClick={handleInsertCover}
            disabled={isInserting}
            title="Вставить обложку на холст Figma"
            className="w-full py-2.5 px-4 bg-[#0d99ff] hover:bg-[#008ae6] text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs shrink-0"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isInserting ? 'Вставка во фрейм Figma...' : 'Вставить во фрейм Figma'}</span>
          </button>
        </div>
      ) : (
        <PluginElementsTab
          selectedAssetSize={selectedAssetSize}
          setSelectedAssetSize={setSelectedAssetSize}
          selectedAssetRole={selectedAssetRole}
          setSelectedAssetRole={setSelectedAssetRole}
          onInsertAsset={handleInsertAsset}
        />
      )}
    </div>
  );
};
