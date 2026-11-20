import { CanvasFormatId, FormatSpec } from '../types/schema';

export const FORMAT_PRESETS: Record<CanvasFormatId, FormatSpec> = {
  og: {
    id: 'og',
    label: 'OpenGraph (1200×630)',
    shortLabel: 'OG',
    width: 1200,
    height: 630,
    defaultHeroScale: 0.78,
    defaultSatelliteScale: 0.85,
    description: '1200×630 px • Обложки статей, превью для соцсетей',
  },
  '16:9': {
    id: '16:9',
    label: '16:9 Горизонтальный (1920×1080)',
    shortLabel: '16:9',
    width: 1920,
    height: 1080,
    defaultHeroScale: 1.0,
    defaultSatelliteScale: 1.0,
    description: '1920×1080 px • Презентации, YouTube, широкоформатные баннеры',
  },
  '1:1': {
    id: '1:1',
    label: '1:1 Квадрат (1080×1080)',
    shortLabel: '1:1',
    width: 1080,
    height: 1080,
    defaultHeroScale: 0.9,
    defaultSatelliteScale: 0.95,
    description: '1080×1080 px • Квадратные посты, соцсети, лента',
  },
  '9:16': {
    id: '9:16',
    label: '9:16 Вертикальный (1080×1920)',
    shortLabel: '9:16',
    width: 1080,
    height: 1920,
    defaultHeroScale: 0.95,
    defaultSatelliteScale: 1.0,
    description: '1080×1920 px • Stories, Reels, Shorts, мобильные баннеры',
  },
};

export const DEFAULT_FORMAT: CanvasFormatId = 'og';

export function getFormatSpec(id: CanvasFormatId): FormatSpec {
  return FORMAT_PRESETS[id] ?? FORMAT_PRESETS[DEFAULT_FORMAT];
}
