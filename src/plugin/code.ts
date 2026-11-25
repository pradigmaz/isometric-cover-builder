/// <reference types="@figma/plugin-typings" />
import type { PluginMessage } from './types';

const ASSET_NAME_MAP: Record<string, string> = {
  smartphone: 'Smartphone',
  notepad: 'Notepad',
  puzzle: 'Puzzle',
  folder: 'Folder',
  lamp: 'Lamp',
  flowers_vase: 'Flowers Vase',
  flowers: 'Flowers Vase',
  vase: 'Flowers Vase',
  headphones: 'Headphones',
  wallet: 'Wallet',
  coin: 'Coin',
  pen: 'Pen',
};

const STRUCTURED_ITEM_ID_RE = /^canvas-item-(foreground|ghost)-([a-z_]+)-([ls])-(.+)$/i;

export function resolveItemDisplayName(rawName: string, fallbackAssetId?: string, fallbackSize?: string): string {
  const structured = rawName.match(STRUCTURED_ITEM_ID_RE);
  if (structured) {
    const assetKey = structured[2].toLowerCase();
    const foundName = ASSET_NAME_MAP[assetKey] || (fallbackAssetId && ASSET_NAME_MAP[fallbackAssetId.toLowerCase()]) || 'Object';
    const size = structured[3].toUpperCase();
    return `[Item] ${foundName} ${size}`;
  }

  const lower = rawName.toLowerCase();
  let foundName = '';
  if (fallbackAssetId && ASSET_NAME_MAP[fallbackAssetId.toLowerCase()]) {
    foundName = ASSET_NAME_MAP[fallbackAssetId.toLowerCase()];
  } else {
    for (const [id, en] of Object.entries(ASSET_NAME_MAP)) {
      if (lower.includes(id)) {
        foundName = en;
        break;
      }
    }
  }
  if (!foundName) {
    foundName = 'Object';
  }

  const sizeMatch = rawName.match(/[-_ ]([LS])[-_ ]/i) || rawName.match(/\b([LS])\b/i);
  const size = (sizeMatch ? sizeMatch[1] : (fallbackSize || 'L')).toUpperCase();

  return `[Item] ${foundName} ${size}`;
}

if (typeof figma !== 'undefined') {
  // Show Figma Plugin UI iframe
  figma.showUI(__html__, {
    width: 440,
    height: 680,
    themeColors: true,
    title: 'Isometric Cover Builder',
  });

  // Listen for messages from Plugin UI iframe
  figma.ui.onmessage = async (msg: PluginMessage) => {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'INSERT_COVER': {
      try {
        const { svg, formatId, width, height, title } = msg.payload;
        if (!svg) throw new Error('Пустая строка SVG для обложки');

        // 1. Create vector nodes from SVG XML string
        const svgNode = figma.createNodeFromSvg(svg);

        // 2. Wrap into an artboard FrameNode matching cover dimensions
        const frame = figma.createFrame();
        const rawFormat = (formatId || '16:9').toLowerCase();
        const cleanFormat = rawFormat === 'og' ? '1200×630' : (formatId || '16:9').toUpperCase();
        frame.name = `Isometric Cover [${cleanFormat}] — ${title || 'Default'}`;
        frame.resize(width, height);
        frame.clipsContent = true;

        // Position frame at viewport center
        const center = figma.viewport.center;
        frame.x = Math.round(center.x - width / 2);
        frame.y = Math.round(center.y - height / 2);

        // Unpack top-level nodes from svgNode directly into frame
        const rawChildren: SceneNode[] = [];
        while (svgNode.children.length > 0) {
          const child = svgNode.children[0];
          frame.appendChild(child);
          rawChildren.push(child);
        }
        svgNode.remove();

        // Identify table/background nodes vs items container/nodes
        const tableNodes: SceneNode[] = [];
        const itemNodes: SceneNode[] = [];

        for (const node of rawChildren) {
          const lower = node.name.toLowerCase();
          if (lower.includes('items-layer') || lower.includes('items_layer')) {
            if ('children' in node) {
              const containerChildren = [...(node as ChildrenMixin).children];
              for (const itemChild of containerChildren) {
                frame.appendChild(itemChild);
                itemNodes.push(itemChild);
              }
              node.remove();
            }
          } else if (lower.includes('item') || lower.includes('asset')) {
            itemNodes.push(node);
          } else {
            tableNodes.push(node);
          }
        }

        // 3. Structure children into named vector groups:
        // Group A: Table Surface (30°)
        if (tableNodes.length > 0) {
          const tableGroup = figma.group(tableNodes, frame);
          tableGroup.name = 'Table Surface (30°)';
        }

        // Separate items into ghost (Background Objects) and foreground (Foreground Objects)
        const bgItemNodes: SceneNode[] = [];
        const fgItemNodes: SceneNode[] = [];
        const payloadItems = msg.payload.items || [];

        itemNodes.forEach((node, idx) => {
          const rawName = node.name || '';
          const structured = rawName.match(STRUCTURED_ITEM_ID_RE);
          const matchedMeta = structured
            ? payloadItems.find((it) => it.uid === structured[4])
            : payloadItems.find((it) => rawName.includes(it.uid)) ||
              (payloadItems.length === itemNodes.length ? payloadItems[idx] : undefined);
          const isGhost = structured
            ? structured[1].toLowerCase() === 'ghost'
            : matchedMeta
              ? matchedMeta.role === 'ghost'
              : rawName.toLowerCase().includes('ghost') || rawName.toLowerCase().includes('background');
          node.name = resolveItemDisplayName(rawName, matchedMeta?.assetId, matchedMeta?.size);

          if (isGhost) {
            bgItemNodes.push(node);
          } else {
            fgItemNodes.push(node);
          }
        });

        // Group B: Background Objects
        if (bgItemNodes.length > 0) {
          const bgGroup = figma.group(bgItemNodes, frame);
          bgGroup.name = 'Background Objects';
        } else {
          const bgFrame = figma.createFrame();
          bgFrame.name = 'Background Objects';
          bgFrame.fills = [];
          bgFrame.resize(width, height);
          bgFrame.clipsContent = false;
          frame.appendChild(bgFrame);
        }

        // Group C: Foreground Objects
        if (fgItemNodes.length > 0) {
          const fgGroup = figma.group(fgItemNodes, frame);
          fgGroup.name = 'Foreground Objects';
        }

        // 4. Append to page, select and zoom
        figma.currentPage.appendChild(frame);
        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);

        figma.notify('Изометрическая обложка вставлена!');
      } catch (err) {
        figma.notify(`Ошибка вставки обложки: ${String(err)}`, { error: true });
      }
      break;
    }

    case 'INSERT_ITEM': {
      try {
        const { svg, name, size, role } = msg.payload;
        if (!svg) throw new Error('Пустая строка SVG для ассета');

        const itemNode = figma.createNodeFromSvg(svg);
        const baseName = resolveItemDisplayName(name || 'Item', undefined, size);
        const isGhost = role === 'ghost';
        const resolvedName = isGhost ? `${baseName} (Ghost)` : baseName;
        itemNode.name = resolvedName;

        const center = figma.viewport.center;
        itemNode.x = Math.round(center.x - itemNode.width / 2);
        itemNode.y = Math.round(center.y - itemNode.height / 2);

        figma.currentPage.appendChild(itemNode);
        figma.currentPage.selection = [itemNode];
        figma.viewport.scrollAndZoomIntoView([itemNode]);

        figma.notify(`Элемент "${resolvedName}" вставлен на холст`);
      } catch (err) {
        figma.notify(`Ошибка вставки элемента: ${String(err)}`, { error: true });
      }
      break;
    }

    case 'NOTIFY': {
      figma.notify(msg.payload.message, {
        error: msg.payload.error,
        timeout: msg.payload.timeout,
      });
      break;
    }

    case 'OPEN_EXTERNAL': {
      try {
        const { url } = msg.payload;
        if (url && typeof figma.openExternal === 'function') {
          figma.openExternal(url);
        }
      } catch (err) {
        figma.notify(`Ошибка открытия ссылки: ${String(err)}`, { error: true });
      }
      break;
    }

    default:
      console.warn('Unhandled plugin message:', msg);
  }
  };
}
