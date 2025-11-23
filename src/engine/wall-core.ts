import type { Point } from '../lib/snap-utils';
import type { Segment, Poly } from './geometry-core';

export interface WallGeometry {
  outer: Poly;
  inner: Poly;
  thickness: number;
}

export const createWallGeometry = (
  start: Point,
  end: Point,
  thickness: number,
): WallGeometry => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return {
      outer: { points: [], closed: false },
      inner: { points: [], closed: false },
      thickness: 0,
    };
  }

  const perpX = (-dy / len) * (thickness / 2);
  const perpY = (dx / len) * (thickness / 2);

  const outer: Point[] = [
    { x: start.x + perpX, y: start.y + perpY },
    { x: end.x + perpX, y: end.y + perpY },
    { x: end.x - perpX, y: end.y - perpY },
    { x: start.x - perpX, y: start.y - perpY },
  ];

  const innerOffset = thickness * 0.1;
  const innerPerpX = (-dy / len) * (thickness / 2 - innerOffset);
  const innerPerpY = (dx / len) * (thickness / 2 - innerOffset);

  const inner: Point[] = [
    { x: start.x + innerPerpX, y: start.y + innerPerpY },
    { x: end.x + innerPerpX, y: end.y + innerPerpY },
    { x: end.x - innerPerpX, y: end.y - innerPerpY },
    { x: start.x - innerPerpX, y: start.y - innerPerpY },
  ];

  return {
    outer: { points: outer, closed: true },
    inner: { points: inner, closed: true },
    thickness,
  };
};

export const joinWallGeometries = (
  wall1: WallGeometry,
  wall2: WallGeometry,
): WallGeometry | null => {
  const mergedOuter = [...wall1.outer.points, ...wall2.outer.points];
  const mergedInner = [...wall1.inner.points, ...wall2.inner.points];

  return {
    outer: { points: mergedOuter, closed: true },
    inner: { points: mergedInner, closed: true },
    thickness: Math.max(wall1.thickness, wall2.thickness),
  };
};

