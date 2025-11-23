import type { Point } from '../lib/snap-utils';
import { segmentIntersection, dist } from '../lib/snap-utils';

type Segment = { A: Point; B: Point };

const EPS = 1e-6;

const direction = (seg: Segment) => ({
  x: seg.B.x - seg.A.x,
  y: seg.B.y - seg.A.y,
});

const normalize = (vec: Point): Point => {
  const length = Math.hypot(vec.x, vec.y) || 1;
  return { x: vec.x / length, y: vec.y / length };
};

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s });

const segmentIntersectionWithParams = (s1: Segment, s2: Segment) => {
  const hit = segmentIntersection(s1.A, s1.B, s2.A, s2.B);
  if (!hit) return null;
  return {
    point: hit.point,
    t: hit.t1,
  };
};

/**
 * Trim subject segment by cutter segments.
 */
export function trimSegmentToSegments(
  subjectSeg: Segment,
  cutterSegs: Segment[],
): Segment | null {
  const ts: Array<{ t: number; point: Point }> = [];
  cutterSegs.forEach((cutter) => {
    const hit = segmentIntersectionWithParams(subjectSeg, cutter);
    if (hit) {
      ts.push({ t: hit.t, point: hit.point });
    }
  });
  if (!ts.length) return null;
  ts.sort((a, b) => a.t - b.t);
  const startHit = ts.find((entry) => entry.t > EPS);
  const endHit = [...ts].reverse().find((entry) => entry.t < 1 - EPS);
  if (startHit && endHit && endHit.t > startHit.t) {
    return { A: startHit.point, B: endHit.point };
  }
  const single = ts[0];
  if (single.t >= 0.5) {
    return { A: subjectSeg.A, B: single.point };
  }
  return { A: single.point, B: subjectSeg.B };
}

type ExtendOptions =
  | { length: number; cutters?: Segment[] }
  | { cutters: Segment[]; length?: number };

/**
 * Extend a segment forward until it hits another segment or reaches a length.
 */
export function extendSegment(
  subjectSeg: Segment,
  target: ExtendOptions,
): Segment | Point {
  const cutters = 'cutters' in target ? target.cutters : undefined;
  const desiredLength = 'length' in target && target.length ? target.length : 100;
  const dir = normalize(direction(subjectSeg));
  let closestHit: { point: Point; distance: number } | null = null;
  if (cutters?.length) {
    for (const cutter of cutters) {
      const hit = segmentIntersection(subjectSeg.B, add(subjectSeg.B, scale(dir, 10000)), cutter.A, cutter.B);
      if (hit) {
        const d = dist(subjectSeg.B, hit.point);
        if (!closestHit || d < closestHit.distance) {
          closestHit = { point: hit.point, distance: d };
        }
      }
    }
  }
  if (closestHit) {
    return closestHit.point;
  }
  const extended = add(subjectSeg.B, scale(dir, desiredLength));
  return {
    A: subjectSeg.A,
    B: extended,
  };
}

const isClosed = (points: Point[]) =>
  points.length >= 3 && dist(points[0], points[points.length - 1]) < 1e-3;

const computeNormal = (a: Point, b: Point) => {
  const dir = normalize(sub(b, a));
  return { x: -dir.y, y: dir.x };
};

const arcPoints = (center: Point, start: Point, end: Point, steps: number) => {
  const pts: Point[] = [];
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    pts.push({
      x: center.x + (start.x - center.x) * (1 - t) + (end.x - center.x) * t,
      y: center.y + (start.y - center.y) * (1 - t) + (end.y - center.y) * t,
    });
  }
  return pts;
};

/**
 * Offset a polyline/poly polygon by a distance.
 * @note This is a light-weight implementation suited for editor previews.
 */
export function offsetPolyline(
  poly: Point[],
  distance: number,
  joinStyle: 'miter' | 'round' | 'bevel' = 'miter',
): Point[] {
  if (poly.length < 2) return poly.slice();
  const closed = isClosed(poly);
  const pts = closed ? poly.slice(0, -1) : poly.slice();
  const normals: Point[] = [];
  const len = pts.length;

  for (let i = 0; i < len - 1; i += 1) {
    normals.push(computeNormal(pts[i], pts[i + 1]));
  }
  if (closed) {
    normals.push(computeNormal(pts[len - 1], pts[0]));
  } else {
    normals.push(normals[normals.length - 1]);
  }

  const result: Point[] = [];
  for (let i = 0; i < len; i += 1) {
    const prevNormal = normals[i === 0 ? (closed ? len - 1 : i) : i - 1];
    const nextNormal = normals[i];
    let offsetDir = normalize(add(prevNormal, nextNormal));
    if (!Number.isFinite(offsetDir.x)) {
      offsetDir = nextNormal;
    }
    const denom = Math.max(
      EPS,
      Math.abs(offsetDir.x * prevNormal.x + offsetDir.y * prevNormal.y),
    );
    const offsetPoint = add(pts[i], scale(offsetDir, distance / denom));

    if (!closed && (i === 0 || i === len - 1)) {
      result.push(add(pts[i], scale(nextNormal, distance)));
      continue;
    }

    if (joinStyle === 'bevel') {
      result.push(add(pts[i], scale(prevNormal, distance)));
      result.push(add(pts[i], scale(nextNormal, distance)));
    } else if (joinStyle === 'round') {
      const start = add(pts[i], scale(prevNormal, distance));
      const end = add(pts[i], scale(nextNormal, distance));
      result.push(start);
      result.push(...arcPoints(pts[i], start, end, 4));
      result.push(end);
    } else {
      result.push(offsetPoint);
    }
  }

  if (closed) {
    result.push(result[0]);
  }
  return result;
}

