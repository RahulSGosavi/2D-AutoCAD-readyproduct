import type { Point } from '../lib/snap-utils';
import type { Poly, Segment } from './geometry-core';
import { offsetPolyline } from './geometry-core';

const perpendicular = (dir: Point) => ({ x: -dir.y, y: dir.x });

const normalize = (p: Point) => {
  const len = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / len, y: p.y / len };
};

const makeRectanglePoly = (A: Point, B: Point, thickness: number): Poly => {
  const dir = normalize({ x: B.x - A.x, y: B.y - A.y });
  const perp = { x: -dir.y, y: dir.x };
  const offset = { x: perp.x * (thickness / 2), y: perp.y * (thickness / 2) };
  const p1 = { x: A.x + offset.x, y: A.y + offset.y };
  const p2 = { x: B.x + offset.x, y: B.y + offset.y };
  const p3 = { x: B.x - offset.x, y: B.y - offset.y };
  const p4 = { x: A.x - offset.x, y: A.y - offset.y };
  return { points: [p1, p2, p3, p4], closed: true };
};

export const createWall = (
  A: Point,
  B: Point,
  thickness: number,
): { outer: Poly; inner: Poly } => {
  const outer = makeRectanglePoly(A, B, thickness);
  const inner = offsetPolyline(outer, -thickness / 3);
  return { outer, inner };
};

const pointsEqual = (a: Point, b: Point, tol = 1e-3) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= tol;

const mergePolys = (a: Poly, b: Poly): Poly => {
  const merged = [...a.points];
  const start = pointsEqual(a.points[a.points.length - 1], b.points[0])
    ? b.points.slice(1)
    : b.points;
  merged.push(...start);
  return { points: merged, closed: true };
};

export const joinWalls = (
  w1: { outer: Poly; inner: Poly },
  w2: { outer: Poly; inner: Poly },
): { mergedOuter: Poly; mergedInner: Poly } | null => {
  return {
    mergedOuter: mergePolys(w1.outer, w2.outer),
    mergedInner: mergePolys(w1.inner, w2.inner),
  };
};

export const autoCorner = (A: Segment, B: Segment, thickness: number): Poly => {
  const intersection = A.B;
  const perp = perpendicular(normalize({ x: B.B.x - B.A.x, y: B.B.y - B.A.y }));
  const offset = { x: perp.x * thickness, y: perp.y * thickness };
  return {
    points: [
      { x: intersection.x + offset.x, y: intersection.y + offset.y },
      { x: intersection.x - offset.x, y: intersection.y - offset.y },
      { x: intersection.x, y: intersection.y },
    ],
    closed: true,
  };
};

