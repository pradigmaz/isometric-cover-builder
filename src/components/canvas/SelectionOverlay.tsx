import React from 'react';
import { CanvasItem } from '../../types/schema';
import { getAssetVisualBounds } from '../../assets/registry';

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

export interface SelectionOverlayProps {
  item: CanvasItem;
  zoom?: number;
  canvasWidth?: number;
  onResizeStart?: (e: React.PointerEvent, handle: ResizeHandle) => void;
  onUpdate?: (uid: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemove?: (uid: string) => void;
  onBringForward?: (uid: string) => void;
  onSendBackward?: (uid: string) => void;
  onDuplicate?: (uid: string) => void;
}

/**
 * SelectionOverlay renders strictly SVG elements (dashed bounding box & zoom-invariant handles)
 * rotated around (item.x, visualY). The interactive toolbar is decoupled into HTML FloatingActionToolbar.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  item,
  zoom = 1,
  onResizeStart,
}) => {
  const bounds = getAssetVisualBounds(item.assetId, item.size);
  const w = bounds.width * (item.scale || 1);
  const h = bounds.height * (item.scale || 1);
  const visualY = item.y - (item.zHeight || 0) + bounds.offsetY * (item.scale || 1);

  const rectX = item.x - w / 2;
  const rectY = visualY - h / 2;

  const rotation = item.rotation || 0;
  const pivotY = item.y - (item.zHeight || 0);

  // Counter-scaled stroke widths and handle radius for zoom invariance
  const rectStrokeWidth = 1.5 / zoom;
  const dashArray = `${5 / zoom} ${4 / zoom}`;
  const cornerRadius = Math.max(2, 6 / zoom);

  return (
    <g
      data-editor-only="true"
      className="selection-overlay pointer-events-none"
      transform={`rotate(${rotation} ${item.x} ${pivotY})`}
    >
      {/* Dashed Bounding Rectangle */}
      <rect
        x={rectX}
        y={rectY}
        width={w}
        height={h}
        fill="none"
        stroke="var(--token-primary)"
        strokeWidth={rectStrokeWidth}
        strokeDasharray={dashArray}
        rx={cornerRadius}
        className="transition-all motion-reduce:transition-none"
      />

      {/* 4 Corner Control Handles (Zoom-Invariant with Resize Dragging) */}
      <circle
        cx={rectX}
        cy={rectY}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nwse-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'tl');
        }}
      />
      <circle
        cx={rectX + w}
        cy={rectY}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nesw-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'tr');
        }}
      />
      <circle
        cx={rectX}
        cy={rectY + h}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nesw-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'bl');
        }}
      />
      <circle
        cx={rectX + w}
        cy={rectY + h}
        r={4.5 / zoom}
        fill="var(--token-light)"
        stroke="var(--token-primary)"
        strokeWidth={2 / zoom}
        className="pointer-events-auto cursor-nwse-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, 'br');
        }}
      />
    </g>
  );
};
