// src/tools/architectural-tools-complete.ts
import type { EditorElement, WallElement, DoorElement, WindowElement } from '../state/useEditorStore';
import { createWallGeometry, joinWallGeometries } from '../engine/wall-core';
import type { Segment } from '../engine/geometry-core';
import { elementToSegment, collectSegments } from '../utils/segment-utils';
import { intersectSegments } from '../engine/geometry-core';

// Auto-join walls at endpoints
export const autoJoinWalls = (
  newWall: WallElement,
  existingWalls: WallElement[],
  tolerance: number = 5
): WallElement[] => {
  const results: WallElement[] = [];
  const newPoints = newWall.points;
  if (!newPoints || newPoints.length < 4) return [newWall];
  
  const newStart = { x: newPoints[0] + (newWall.x ?? 0), y: newPoints[1] + (newWall.y ?? 0) };
  const newEnd = { x: newPoints[newPoints.length - 2] + (newWall.x ?? 0), y: newPoints[newPoints.length - 1] + (newWall.y ?? 0) };
  
  let joined = false;
  
  for (const wall of existingWalls) {
    const wallPoints = wall.points;
    if (!wallPoints || wallPoints.length < 4) {
      results.push(wall);
      continue;
    }
    
    const wallStart = { x: wallPoints[0] + (wall.x ?? 0), y: wallPoints[1] + (wall.y ?? 0) };
    const wallEnd = { x: wallPoints[wallPoints.length - 2] + (wall.x ?? 0), y: wallPoints[wallPoints.length - 1] + (wall.y ?? 0) };
    
    // Check if endpoints are close
    const distStartStart = Math.hypot(newStart.x - wallStart.x, newStart.y - wallStart.y);
    const distStartEnd = Math.hypot(newStart.x - wallEnd.x, newStart.y - wallEnd.y);
    const distEndStart = Math.hypot(newEnd.x - wallStart.x, newEnd.y - wallStart.y);
    const distEndEnd = Math.hypot(newEnd.x - wallEnd.x, newEnd.y - wallEnd.y);
    
    if (distStartStart < tolerance || distStartEnd < tolerance || distEndStart < tolerance || distEndEnd < tolerance) {
      // Join walls
      const wall1Geo = createWallGeometry(
        { x: newPoints[0], y: newPoints[1] },
        { x: newPoints[newPoints.length - 2], y: newPoints[newPoints.length - 1] },
        newWall.thickness
      );
      const wall2Geo = createWallGeometry(
        { x: wallPoints[0], y: wallPoints[1] },
        { x: wallPoints[wallPoints.length - 2], y: wallPoints[wallPoints.length - 1] },
        wall.thickness
      );
      
      const joinedGeo = joinWallGeometries(wall1Geo, wall2Geo);
      if (joinedGeo) {
        const joinedPoints: number[] = [];
        joinedGeo.outer.points.forEach((pt) => {
          joinedPoints.push(pt.x - (newWall.x ?? 0), pt.y - (newWall.y ?? 0));
        });
        
        results.push({
          ...newWall,
          points: joinedPoints,
          outerPoly: joinedPoints,
          innerPoly: joinedGeo.inner.points.flatMap((pt) => [pt.x - (newWall.x ?? 0), pt.y - (newWall.y ?? 0)]),
        });
        joined = true;
        continue;
      }
    }
    
    results.push(wall);
  }
  
  if (!joined) {
    results.push(newWall);
  }
  
  return results;
};

// Auto-cut wall for door/window insertion
export const autoCutWall = (
  wall: WallElement,
  opening: DoorElement | WindowElement,
  openingWidth: number
): { wall1: WallElement | null; wall2: WallElement | null; opening: DoorElement | WindowElement } => {
  const wallPoints = wall.points;
  if (!wallPoints || wallPoints.length < 4) {
    return { wall1: wall, wall2: null, opening };
  }
  
  const wallStart = { x: wallPoints[0] + (wall.x ?? 0), y: wallPoints[1] + (wall.y ?? 0) };
  const wallEnd = { x: wallPoints[wallPoints.length - 2] + (wall.x ?? 0), y: wallPoints[wallPoints.length - 1] + (wall.y ?? 0) };
  const openingCenter = { x: (opening.x ?? 0), y: (opening.y ?? 0) };
  
  // Project opening center onto wall line
  const dx = wallEnd.x - wallStart.x;
  const dy = wallEnd.y - wallStart.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { wall1: wall, wall2: null, opening };
  
  const t = ((openingCenter.x - wallStart.x) * dx + (openingCenter.y - wallStart.y) * dy) / (len * len);
  const clampedT = Math.max(0, Math.min(1, t));
  
  const projection = {
    x: wallStart.x + clampedT * dx,
    y: wallStart.y + clampedT * dy,
  };
  
  // Calculate cut points
  const perpX = (-dy / len) * (openingWidth / 2);
  const perpY = (dx / len) * (openingWidth / 2);
  
  const cutStart = {
    x: projection.x - perpX,
    y: projection.y - perpY,
  };
  const cutEnd = {
    x: projection.x + perpX,
    y: projection.y + perpY,
  };
  
  // Split wall into two segments
  const wall1Points: number[] = [];
  const wall2Points: number[] = [];
  
  // First segment: from wall start to cut start
  wall1Points.push(
    wallPoints[0],
    wallPoints[1],
    cutStart.x - (wall.x ?? 0),
    cutStart.y - (wall.y ?? 0)
  );
  
  // Second segment: from cut end to wall end
  wall2Points.push(
    cutEnd.x - (wall.x ?? 0),
    cutEnd.y - (wall.y ?? 0),
    wallPoints[wallPoints.length - 2],
    wallPoints[wallPoints.length - 1]
  );
  
  const wall1: WallElement | null = wall1Points.length >= 4 ? {
    ...wall,
    id: `${wall.id}-1`,
    points: wall1Points,
  } : null;
  
  const wall2: WallElement | null = wall2Points.length >= 4 ? {
    ...wall,
    id: `${wall.id}-2`,
    points: wall2Points,
  } : null;
  
  return {
    wall1,
    wall2,
    opening: {
      ...opening,
      wallId: wall.id,
    },
  };
};

// Insert door with auto wall cut
export const insertDoor = (
  door: DoorElement,
  walls: WallElement[]
): { walls: WallElement[]; door: DoorElement } => {
  const doorWidth = door.width ?? 900; // Default door width
  const doorCenter = { x: door.x ?? 0, y: door.y ?? 0 };
  
  // Find closest wall
  let closestWall: WallElement | null = null;
  let minDist = Infinity;
  
  for (const wall of walls) {
    const segment = elementToSegment(wall);
    if (!segment) continue;
    
    // Project door center onto wall
    const dx = segment.B.x - segment.A.x;
    const dy = segment.B.y - segment.A.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    
    const t = ((doorCenter.x - segment.A.x) * dx + (doorCenter.y - segment.A.y) * dy) / (len * len);
    if (t < 0 || t > 1) continue;
    
    const projection = {
      x: segment.A.x + t * dx,
      y: segment.A.y + t * dy,
    };
    
    const dist = Math.hypot(doorCenter.x - projection.x, doorCenter.y - projection.y);
    if (dist < minDist && dist < 50) { // Within 50 units
      minDist = dist;
      closestWall = wall;
    }
  }
  
  if (!closestWall) {
    return { walls, door };
  }
  
  // Cut wall
  const { wall1, wall2, opening } = autoCutWall(closestWall, door, doorWidth);
  
  const newWalls = walls
    .filter((w) => w.id !== closestWall!.id)
    .concat(wall1 ? [wall1] : [])
    .concat(wall2 ? [wall2] : []);
  
  return {
    walls: newWalls,
    door: opening as DoorElement,
  };
};

// Insert window with auto wall cut
export const insertWindow = (
  window: WindowElement,
  walls: WallElement[]
): { walls: WallElement[]; window: WindowElement } => {
  const windowWidth = window.width ?? 1200; // Default window width
  const windowCenter = { x: window.x ?? 0, y: window.y ?? 0 };
  
  // Find closest wall
  let closestWall: WallElement | null = null;
  let minDist = Infinity;
  
  for (const wall of walls) {
    const segment = elementToSegment(wall);
    if (!segment) continue;
    
    const dx = segment.B.x - segment.A.x;
    const dy = segment.B.y - segment.A.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    
    const t = ((windowCenter.x - segment.A.x) * dx + (windowCenter.y - segment.A.y) * dy) / (len * len);
    if (t < 0 || t > 1) continue;
    
    const projection = {
      x: segment.A.x + t * dx,
      y: segment.A.y + t * dy,
    };
    
    const dist = Math.hypot(windowCenter.x - projection.x, windowCenter.y - projection.y);
    if (dist < minDist && dist < 50) {
      minDist = dist;
      closestWall = wall;
    }
  }
  
  if (!closestWall) {
    return { walls, window };
  }
  
  // Cut wall
  const { wall1, wall2, opening } = autoCutWall(closestWall, window, windowWidth);
  
  const newWalls = walls
    .filter((w) => w.id !== closestWall!.id)
    .concat(wall1 ? [wall1] : [])
    .concat(wall2 ? [wall2] : []);
  
  return {
    walls: newWalls,
    window: opening as WindowElement,
  };
};

// Create column
export const createColumn = (
  x: number,
  y: number,
  width: number,
  height: number,
  layerId: string,
  stroke: string,
  strokeWidth: number
): EditorElement => {
  return {
    id: `column-${Date.now()}`,
    type: 'rectangle',
    layerId,
    x,
    y,
    width,
    height,
    stroke,
    strokeWidth,
    fill: 'rgba(100, 100, 100, 0.3)',
    opacity: 1,
    rotation: 0,
  } as EditorElement;
};

// Create beam
export const createBeam = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thickness: number,
  layerId: string,
  stroke: string,
  strokeWidth: number
): EditorElement => {
  return {
    id: `beam-${Date.now()}`,
    type: 'wall',
    layerId,
    x: 0,
    y: 0,
    points: [startX, startY, endX, endY],
    thickness,
    stroke,
    strokeWidth,
    opacity: 1,
    rotation: 0,
  } as EditorElement;
};

