import { CanvasFormatId, FormatSpec } from '../types/schema';

export const FORMAT_PRESETS: Record<CanvasFormatId, FormatSpec> = {
  og: {
    id: 'og',
    label: '1200×630 (Обложка статьи)',
    shortLabel: '1200×630',
    width: 1200,
    height: 630,
    defaultHeroScale: 0.78,
    defaultSatelliteScale: 0.85,
    description: '1200×630 px • Обложка статьи, соцсети, превью',
  },
  '16:9': {
    id: '16:9',
    label: '16:9 Full HD (1920×1080)',
    shortLabel: 'Full HD',
    width: 1920,
    height: 1080,
    defaultHeroScale: 1.0,
    defaultSatelliteScale: 1.0,
    description: '1920×1080 px • Presentations, YouTube, wide banners',
  },
  '1:1': {
    id: '1:1',
    label: '1:1 Square (1080×1080)',
    shortLabel: 'Square',
    width: 1080,
    height: 1080,
    defaultHeroScale: 0.9,
    defaultSatelliteScale: 0.95,
    description: '1080×1080 px • Square posts, social media, feed',
  },
  '9:16': {
    id: '9:16',
    label: '9:16 Stories (1080×1920)',
    shortLabel: 'Stories',
    width: 1080,
    height: 1920,
    defaultHeroScale: 2.85,
    defaultSatelliteScale: 2.45,
    description: '1080×1920 px • Stories, Reels, Shorts, mobile banners',
  },
};

export const DEFAULT_FORMAT: CanvasFormatId = 'og';

export function getFormatSpec(id: CanvasFormatId): FormatSpec {
  return FORMAT_PRESETS[id] ?? FORMAT_PRESETS[DEFAULT_FORMAT];
}
