// src/utils/collision.ts
// Collision detection utilities for preventing overlapping items

import type { EditorElement } from '../state/useEditorStore';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

// Get bounding box for an element
export const getElementBounds = (element: EditorElement): BoundingBox | null => {
  const el = element as any;
  
  if ('width' in el && 'height' in el) {
    return {
      x: el.x || 0,
      y: el.y || 0,
      width: el.width,
      height: el.height,
      rotation: el.rotation || 0,
    };
  }
  
  if ('points' in el && el.points && el.points.length >= 4) {
    const xs = [];
    const ys = [];
    for (let i = 0; i < el.points.length; i += 2) {
      xs.push((el.x || 0) + el.points[i]);
      ys.push((el.y || 0) + el.points[i + 1]);
    }
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
    };
  }
  
  if ('radiusX' in el && 'radiusY' in el) {
    return {
      x: el.x - el.radiusX,
      y: el.y - el.radiusY,
      width: el.radiusX * 2,
      height: el.radiusY * 2,
      rotation: el.rotation || 0,
    };
  }
  
  return null;
};

// Check if two axis-aligned bounding boxes overlap
export const boxesOverlap = (a: BoundingBox, b: BoundingBox): boolean => {
  // Simple AABB collision (ignoring rotation for now)
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
};

// Check if element collides with any other elements
export const checkCollision = (
  element: EditorElement,
  allElements: EditorElement[],
  excludeIds: string[] = []
): EditorElement[] => {
  const bounds = getElementBounds(element);
  if (!bounds) return [];
  
  const collidingElements: EditorElement[] = [];
  
  for (const other of allElements) {
    if (other.id === element.id || excludeIds.includes(other.id)) continue;
    
    const otherBounds = getElementBounds(other);
    if (!otherBounds) continue;
    
    if (boxesOverlap(bounds, otherBounds)) {
      collidingElements.push(other);
    }
  }
  
  return collidingElements;
};

// Get collision-free position (nudge element away from collision)
export const getCollisionFreePosition = (
  element: EditorElement,
  allElements: EditorElement[],
  excludeIds: string[] = []
): { x: number; y: number } | null => {
  const bounds = getElementBounds(element);
  if (!bounds) return null;
  
  const collisions = checkCollision(element, allElements, excludeIds);
  if (collisions.length === 0) return null;
  
  // Find the nearest collision-free position
  const el = element as any;
  const currentX = el.x || 0;
  const currentY = el.y || 0;
  
  // Try nudging in different directions
  const nudgeAmount = 10;
  const directions = [
    { dx: nudgeAmount, dy: 0 },
    { dx: -nudgeAmount, dy: 0 },
    { dx: 0, dy: nudgeAmount },
    { dx: 0, dy: -nudgeAmount },
    { dx: nudgeAmount, dy: nudgeAmount },
    { dx: -nudgeAmount, dy: -nudgeAmount },
    { dx: nudgeAmount, dy: -nudgeAmount },
    { dx: -nudgeAmount, dy: nudgeAmount },
  ];
  
  for (const { dx, dy } of directions) {
    const testElement = { ...element, x: currentX + dx, y: currentY + dy };
    const testCollisions = checkCollision(testElement as EditorElement, allElements, excludeIds);
    if (testCollisions.length === 0) {
      return { x: currentX + dx, y: currentY + dy };
    }
  }
  
  return null;
};

// Check if a proposed move would cause collision
export const wouldCollide = (
  element: EditorElement,
  newX: number,
  newY: number,
  allElements: EditorElement[],
  excludeIds: string[] = []
): boolean => {
  const movedElement = { ...element, x: newX, y: newY } as EditorElement;
  return checkCollision(movedElement, allElements, excludeIds).length > 0;
};

// Get overlap area between two boxes (for visual feedback)
export const getOverlapArea = (a: BoundingBox, b: BoundingBox): BoundingBox | null => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  
  if (width <= 0 || height <= 0) return null;
  
  return { x, y, width, height };
};

