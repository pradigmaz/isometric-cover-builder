import React, { memo } from 'react';
import { CanvasItem } from '../../types/schema';
import { getAssetComponent } from '../../assets/registry';

export interface CanvasItemViewProps {
  item: CanvasItem;
  isSelected?: boolean;
  onSelect: (uid: string, e: React.PointerEvent) => void;
  onItemPointerDown: (item: CanvasItem, e: React.PointerEvent) => void;
}

export const CanvasItemView: React.FC<CanvasItemViewProps> = memo(({
  item,
  isSelected = false,
  onSelect,
  onItemPointerDown,
}) => {
  const AssetComponent = getAssetComponent(item.assetId);
  const center = item.size === 'L' ? 300 : 100;
  const visualY = item.y - (item.zHeight || 0);
  const scaleX = (item.flipX ? -1 : 1) * (item.scale || 1);
  const scaleY = item.scale || 1;
  const rotation = item.rotation || 0;

  const transform = `translate(${item.x}, ${visualY}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(-${center}, -${center})`;

  return (
    <g
      id={`canvas-item-${item.uid}`}
      data-uid={item.uid}
      data-role={item.role}
      data-selected={isSelected}
      transform={transform}
      opacity={item.opacity ?? (item.role === 'ghost' ? 0.22 : 1)}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.uid, e);
        onItemPointerDown(item, e);
      }}
    >
      <AssetComponent size={item.size} role={item.role} />
    </g>
  );
});

CanvasItemView.displayName = 'CanvasItemView';
