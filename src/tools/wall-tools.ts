import { nanoid } from 'nanoid';
import type { EditorElement, WallElement } from '../state/useEditorStore';
import type { Point } from '../utils/math-utils';
import { createWall } from '../engine/wall-tool';

export const createWallElement = (
  start: Point,
  end: Point,
  thickness: number,
  layerId: string,
): WallElement => {
  const wall = createWall(start, end, thickness);
  return {
    id: nanoid(),
    type: 'wall',
    layerId,
    points: [start.x, start.y, end.x, end.y],
    thickness,
    outerPoly: wall.outer.points.flatMap((p) => [p.x, p.y]),
    innerPoly: wall.inner.points.flatMap((p) => [p.x, p.y]),
    stroke: '#8b8b8b',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
  };
};

export const autoJoinWalls = (walls: WallElement[], newWall: WallElement): WallElement[] => {
  const joined = [...walls];
  const tolerance = 10;
  
  walls.forEach((wall) => {
    const newStart = { x: newWall.points[0], y: newWall.points[1] };
    const newEnd = { x: newWall.points[2], y: newWall.points[3] };
    const wallStart = { x: wall.points[0], y: wall.points[1] };
    const wallEnd = { x: wall.points[2], y: wall.points[3] };
    
    const distToStart = Math.hypot(newStart.x - wallEnd.x, newStart.y - wallEnd.y);
    if (distToStart < tolerance) {
      newWall.points[0] = wallEnd.x;
      newWall.points[1] = wallEnd.y;
    }
    
    const distToEnd = Math.hypot(newEnd.x - wallStart.x, newEnd.y - wallStart.y);
    if (distToEnd < tolerance) {
      newWall.points[2] = wallStart.x;
      newWall.points[3] = wallStart.y;
    }
  });
  
  return joined;
};

