import type { Point } from '../lib/snap-utils';

export interface Segment {
  A: Point;
  B: Point;
}

export interface Poly {
  points: Point[];
  closed: boolean;
}

const EPS = 1e-6;

const clonePoint = (p: Point): Point => ({ x: p.x, y: p.y });

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, f: number): Point => ({ x: a.x * f, y: a.y * f });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const length = (v: Point) => Math.hypot(v.x, v.y);
const normalize = (v: Point): Point => {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len };
};

const computeIntersection = (s1: Segment, s2: Segment) => {
  const r = sub(s1.B, s1.A);
  const s = sub(s2.B, s2.A);
  const denom = cross(r, s);
  if (Math.abs(denom) < EPS) return null;
  const qmp = sub(s2.A, s1.A);
  const t = cross(qmp, s) / denom; // parameter along s1
  const u = cross(qmp, r) / denom; // parameter along s2
  return { t, u };
};

export const intersectSegments = (s1: Segment, s2: Segment): Point | null => {
  const result = computeIntersection(s1, s2);
  if (!result) return null;
  if (result.t < -EPS || result.t > 1 + EPS) return null;
  if (result.u < -EPS || result.u > 1 + EPS) return null;
  return add(s1.A, scale(sub(s1.B, s1.A), result.t));
};

export const trimSegment = (seg: Segment, cutters: Segment[]): Segment | null => {
  let closest: { point: Point; dist: number } | null = null;
  cutters.forEach((cutter) => {
    const result = computeIntersection(seg, cutter);
    if (!result) return;
    if (result.t <= EPS || result.t >= 1 - EPS) return;
    const point = add(seg.A, scale(sub(seg.B, seg.A), result.t));
    const dist = result.t;
    if (!closest || dist < closest.dist) {
      closest = { point, dist };
    }
  });
  if (!closest) return null;
  return {
    A: clonePoint(seg.A),
    B: closest.point,
  };
};

export const extendSegment = (
  seg: Segment,
  cutters: Segment[],
  maxLength = 1000,
): Segment => {
  const dir = normalize(sub(seg.B, seg.A));
  const baseLength = length(sub(seg.B, seg.A));
  const totalLength = baseLength + maxLength;
  let extension = maxLength;
  cutters.forEach((cutter) => {
    const infiniteSeg: Segment = {
      A: seg.A,
      B: add(seg.A, scale(dir, totalLength)),
    };
    const result = computeIntersection(infiniteSeg, cutter);
    if (!result) return;
    const baseRatio = baseLength / totalLength;
    if (result.t <= baseRatio + EPS) return;
    if (result.u < -EPS || result.u > 1 + EPS) return;
    const hitDistance = result.t * totalLength;
    const extra = hitDistance - baseLength;
    if (extra >= EPS) {
      extension = Math.min(extension, extra);
    }
  });

  return {
    A: clonePoint(seg.A),
    B: add(seg.A, scale(dir, baseLength + extension)),
  };
};

const leftNormal = (dir: Point) => normalize({ x: -dir.y, y: dir.x });

const intersectLines = (l1: Segment, l2: Segment): Point | null => {
  const result = computeIntersection(l1, l2);
  if (!result) return null;
  return add(l1.A, scale(sub(l1.B, l1.A), result.t));
};

export const offsetPolyline = (poly: Poly, distance: number): Poly => {
  const points = poly.points;
  if (points.length < 2) {
    return { points: points.map(clonePoint), closed: poly.closed };
  }
  const closed = poly.closed;
  const edgeCount = closed ? points.length : points.length - 1;
  const offsetEdges: Segment[] = [];
  for (let i = 0; i < edgeCount; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const normal = leftNormal(sub(b, a));
    const offset = scale(normal, distance);
    offsetEdges.push({ A: add(a, offset), B: add(b, offset) });
  }

  const offsetPoints: Point[] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (!closed && i === 0) {
      offsetPoints.push(offsetEdges[0].A);
      continue;
    }
    if (!closed && i === points.length - 1) {
      offsetPoints.push(offsetEdges[offsetEdges.length - 1].B);
      continue;
    }
    const prevEdge = offsetEdges[(i - 1 + offsetEdges.length) % offsetEdges.length];
    const nextEdge = offsetEdges[i % offsetEdges.length];
    const intersection = intersectLines(prevEdge, nextEdge);
    offsetPoints.push(intersection ?? prevEdge.B);
  }

  return { points: offsetPoints, closed };
};

export const joinOffsetPolylines = (base: Poly, offset: Poly): Poly => {
  const joined = [...base.points];
  const reversed = offset.points.slice().reverse();
  joined.push(...reversed);
  return {
    points: joined,
    closed: true,
  };
};

export const polyArea = (poly: Poly): number => {
  let sum = 0;
  const pts = poly.points;
  const count = pts.length;
  if (count < 3) return 0;
  for (let i = 0; i < count; i += 1) {
    const current = pts[i];
    const next = pts[(i + 1) % count];
    sum += current.x * next.y - next.x * current.y;
  }
  if (Math.abs(sum) < EPS && count >= 4) {
    console.warn('polyArea: potential self-crossing poly');
  }
  return 0.5 * sum;
};

