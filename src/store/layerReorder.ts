import { CanvasItem } from '../types/schema';
import { sortCanvasItems } from '../engine/isometric';

/**
 * Reorders canvas layers by adjusting manualLayerOffset and visual stacking order.
 * Ensures that 'forward' moves the item above its visual neighbor, and 'backward' moves it below.
 * Maintains role segregation (ghost background silhouettes stay in the background).
 */
export function reorderCanvasLayers(
  items: CanvasItem[],
  uid: string,
  action: 'forward' | 'backward' | 'front' | 'back'
): CanvasItem[] {
  const target = items.find((it) => it.uid === uid);
  if (!target) return items;

  const sorted = sortCanvasItems(items);
  const currentIndex = sorted.findIndex((it) => it.uid === uid);
  if (currentIndex === -1) return items;

  const isGhost = target.role === 'ghost';
  const roleGroup = sorted.filter((it) => (it.role === 'ghost') === isGhost);
  const indexInGroup = roleGroup.findIndex((it) => it.uid === uid);
  if (indexInGroup === -1) return items;

  let newRoleGroup: CanvasItem[];

  switch (action) {
    case 'forward': {
      if (indexInGroup >= roleGroup.length - 1) return items;
      newRoleGroup = [...roleGroup];
      const temp = newRoleGroup[indexInGroup];
      newRoleGroup[indexInGroup] = newRoleGroup[indexInGroup + 1];
      newRoleGroup[indexInGroup + 1] = temp;
      break;
    }
    case 'backward': {
      if (indexInGroup <= 0) return items;
      newRoleGroup = [...roleGroup];
      const temp = newRoleGroup[indexInGroup];
      newRoleGroup[indexInGroup] = newRoleGroup[indexInGroup - 1];
      newRoleGroup[indexInGroup - 1] = temp;
      break;
    }
    case 'front': {
      if (indexInGroup >= roleGroup.length - 1) return items;
      newRoleGroup = roleGroup.filter((it) => it.uid !== uid);
      newRoleGroup.push(target);
      break;
    }
    case 'back': {
      if (indexInGroup <= 0) return items;
      newRoleGroup = [target, ...roleGroup.filter((it) => it.uid !== uid)];
      break;
    }
  }

  const offsetMap = new Map<string, number>();
  if (isGhost) {
    const G = newRoleGroup.length;
    newRoleGroup.forEach((it, idx) => {
      offsetMap.set(it.uid, idx - G);
    });
  } else {
    newRoleGroup.forEach((it, idx) => {
      offsetMap.set(it.uid, idx);
    });
  }

  const updatedItems = items.map((it) => {
    const newOffset = offsetMap.get(it.uid);
    return newOffset !== undefined ? { ...it, manualLayerOffset: newOffset } : it;
  });

  return sortCanvasItems(updatedItems);
}
