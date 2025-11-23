/**
 * External deps: install via
 *   npm i rbush konva react-konva
 *   npm i -D vitest @testing-library/react @types/jest @types/rbush
 */
import RBush from 'rbush';

export type Point = { x: number; y: number };

export type Entity = {
  id: string;
  type: 'line' | 'polyline' | 'rect' | 'circle' | 'point';
  bbox: [number, number, number, number];
  geom?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type SnapOptions = {
  gridSize?: number;
  tolerance?: number;
  enableGrid?: boolean;
  angleSnapStep?: number;
  enableEndpoint?: boolean;
  enableMidpoint?: boolean;
  enableIntersection?: boolean;
  enablePerp?: boolean;
};

type SnapBase = {
  point: Point;
};

export type SnapEndpoint = SnapBase & {
  type: 'endpoint';
  entityId: string;
};

export type SnapMidpoint = SnapBase & {
  type: 'midpoint';
  entityId: string;
};

export type SnapIntersection = SnapBase & {
  type: 'intersection';
  entityIds: [string, string];
};

export type SnapPerpendicular = SnapBase & {
  type: 'perpendicular';
  entityId: string;
};

export type SnapGrid = SnapBase & {
  type: 'grid';
  gridSize: number;
};

export type SnapAngle = SnapBase & {
  type: 'angle';
  snappedAngle: number;
  step: number;
};

export type SnapNone = SnapBase & {
  type: 'none';
};

export type SnapResult =
  | SnapEndpoint
  | SnapMidpoint
  | SnapIntersection
  | SnapPerpendicular
  | SnapGrid
  | SnapAngle
  | SnapNone;

interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  entity: Entity;
}

type NormalizedOptions = Required<Omit<SnapOptions, 'angleSnapStep'>> & {
  angleSnapStep?: number;
};

const DEFAULT_OPTIONS: NormalizedOptions = {
  gridSize: 50,
  tolerance: 8,
  enableGrid: true,
  enableEndpoint: true,
  enableMidpoint: true,
  enableIntersection: true,
  enablePerp: true,
  angleSnapStep: undefined,
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const dist = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const angleDeg = (a: Point, b: Point) => toDeg(Math.atan2(b.y - a.y, b.x - a.x));

export const snapAngle = (angle: number, step: number) =>
  Math.round(angle / step) * step;

export const nearestPointOnSegment = (p: Point, a: Point, b: Point): Point => {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const lenSq = ab.x * ab.x + ab.y * ab.y;
  if (lenSq === 0) return { ...a };
  const t = clamp(((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / lenSq, 0, 1);
  return {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
  };
};

export type SegmentIntersectionResult =
  | {
      point: Point;
      t1: number;
      t2: number;
    }
  | null;

export const segmentIntersection = (
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): SegmentIntersectionResult => {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-6) return null;
  const s = ((a1.x - b1.x) * dby - (a1.y - b1.y) * dbx) / denom;
  const t = ((a1.x - b1.x) * day - (a1.y - b1.y) * dax) / denom;
  if (s < 0 || s > 1 || t < 0 || t > 1) return null;
  return {
    point: {
      x: a1.x + s * dax,
      y: a1.y + s * day,
    },
    t1: s,
    t2: t,
  };
};

export const entityToRBushItem = (entity: Entity): RBushItem => {
  const [minX, minY, maxX, maxY] = entity.bbox;
  return { minX, minY, maxX, maxY, entity };
};

export class SnapIndex {
  private tree = new RBush<RBushItem>();
  private items = new Map<string, RBushItem>();

  add(entity: Entity) {
    const item = entityToRBushItem(entity);
    this.tree.insert(item);
    this.items.set(entity.id, item);
  }

  remove(id: string) {
    const item = this.items.get(id);
    if (!item) return;
    this.tree.remove(item, (a, b) => a.entity.id === b.entity.id);
    this.items.delete(id);
  }

  update(entity: Entity) {
    this.remove(entity.id);
    this.add(entity);
  }

  clear() {
    this.tree.clear();
    this.items.clear();
  }

  searchRegion(x: number, y: number, radius: number): Entity[] {
    const hits = this.tree.search({
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    });
    return hits.map((hit) => hit.entity);
  }
}

type Segment = { a: Point; b: Point; entityId: string };

const collectVertices = (entity: Entity): Point[] => {
  const { bbox, type, geom } = entity;
  switch (type) {
    case 'point': {
      if (geom && 'point' in geom) return [geom.point as Point];
      return [{ x: (bbox[0] + bbox[2]) / 2, y: (bbox[1] + bbox[3]) / 2 }];
    }
    case 'line': {
      if (geom && 'A' in geom && 'B' in geom) return [geom.A as Point, geom.B as Point];
      break;
    }
    case 'polyline': {
      if (geom && 'points' in geom && Array.isArray(geom.points)) {
        const pts: Point[] = [];
        const arr = geom.points as number[];
        for (let i = 0; i < arr.length; i += 2) {
          pts.push({ x: arr[i], y: arr[i + 1] });
        }
        return pts;
      }
      break;
    }
    case 'rect': {
      return [
        { x: bbox[0], y: bbox[1] },
        { x: bbox[2], y: bbox[1] },
        { x: bbox[2], y: bbox[3] },
        { x: bbox[0], y: bbox[3] },
      ];
    }
    case 'circle': {
      if (geom && 'center' in geom) {
        const r = (geom.radius as number) ?? Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]) / 2;
        const center = geom.center as Point;
        return [
          center,
          { x: center.x + r, y: center.y },
          { x: center.x - r, y: center.y },
          { x: center.x, y: center.y + r },
          { x: center.x, y: center.y - r },
        ];
      }
      break;
    }
    default:
      break;
  }
  return [];
};

const collectSegments = (entity: Entity): Segment[] => {
  const points = collectVertices(entity);
  const segments: Segment[] = [];
  if (entity.type === 'circle') {
    const center = points[0] ?? { x: 0, y: 0 };
    const r = (entity.geom?.radius as number) ?? (entity.bbox[2] - entity.bbox[0]) / 2;
    const steps = 16;
    for (let i = 0; i < steps; i += 1) {
      const theta = (i / steps) * Math.PI * 2;
      const nextTheta = ((i + 1) / steps) * Math.PI * 2;
      segments.push({
        a: { x: center.x + Math.cos(theta) * r, y: center.y + Math.sin(theta) * r },
        b: { x: center.x + Math.cos(nextTheta) * r, y: center.y + Math.sin(nextTheta) * r },
        entityId: entity.id,
      });
    }
    return segments;
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    segments.push({ a: points[i], b: points[i + 1], entityId: entity.id });
  }
  if (entity.type === 'rect' && points.length > 0) {
    segments.push({ a: points[points.length - 1], b: points[0], entityId: entity.id });
  }
  return segments;
};

const createNoneResult = (raw: Point): SnapNone => ({
  type: 'none',
  point: { ...raw },
});

const pickGrid = (raw: Point, options: NormalizedOptions): SnapGrid => {
  const size = options.gridSize;
  const snapped = {
    x: Math.round(raw.x / size) * size,
    y: Math.round(raw.y / size) * size,
  };
  return {
    type: 'grid',
    point: snapped,
    gridSize: size,
  };
};

/**
 * Snap a raw pointer to the closest available helper (endpoint, intersection, etc.).
 *
 * @example
 * const result = snapPoint(index, { x: 100, y: 42 }, null, { tolerance: 10 });
 * if (result.type !== 'none') drawMarker(result.point);
 */
export function snapPoint(
  idx: SnapIndex,
  raw: Point,
  lastPoint: Point | null,
  options?: SnapOptions,
): SnapResult {
  const opts: NormalizedOptions = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  const tolerance = opts.tolerance;
  const searchRadius = tolerance;
  const candidates = idx.searchRegion(raw.x, raw.y, searchRadius);

  const segments: Segment[] = [];
  const vertices: Array<{ point: Point; entityId: string }> = [];

  for (const entity of candidates) {
    if (opts.enableEndpoint) {
      for (const p of collectVertices(entity)) {
        vertices.push({ point: p, entityId: entity.id });
      }
    }
    if (opts.enableIntersection || opts.enableMidpoint || opts.enablePerp) {
      segments.push(...collectSegments(entity));
    }
  }

  if (opts.enableEndpoint) {
    for (const vertex of vertices) {
      if (dist(vertex.point, raw) <= tolerance) {
        return {
          type: 'endpoint',
          point: vertex.point,
          entityId: vertex.entityId,
        };
      }
    }
  }

  if (opts.enableIntersection && segments.length > 1) {
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const hit = segmentIntersection(segments[i].a, segments[i].b, segments[j].a, segments[j].b);
        if (hit && dist(hit.point, raw) <= tolerance) {
          return {
            type: 'intersection',
            point: hit.point,
            entityIds: [segments[i].entityId, segments[j].entityId],
          };
        }
      }
    }
  }

  if (opts.enableMidpoint) {
    for (const seg of segments) {
      const mid = midpoint(seg.a, seg.b);
      if (dist(mid, raw) <= tolerance) {
        return {
          type: 'midpoint',
          point: mid,
          entityId: seg.entityId,
        };
      }
    }
  }

  if (opts.enablePerp) {
    for (const seg of segments) {
      const proj = nearestPointOnSegment(raw, seg.a, seg.b);
      if (dist(proj, raw) <= tolerance) {
        return {
          type: 'perpendicular',
          point: proj,
          entityId: seg.entityId,
        };
      }
    }
  }

  if (opts.enableGrid) {
    const grid = pickGrid(raw, opts as Required<SnapOptions>);
    if (dist(grid.point, raw) <= tolerance) {
      return grid;
    }
  }

  if (lastPoint && opts.angleSnapStep) {
    const angle = angleDeg(lastPoint, raw);
    const snappedAngle = snapAngle(angle, opts.angleSnapStep);
    const radius = dist(lastPoint, raw);
    const snappedPoint = {
      x: lastPoint.x + Math.cos(toRad(snappedAngle)) * radius,
      y: lastPoint.y + Math.sin(toRad(snappedAngle)) * radius,
    };
    if (dist(snappedPoint, raw) <= tolerance * 1.5) {
      return {
        type: 'angle',
        point: snappedPoint,
        snappedAngle,
        step: opts.angleSnapStep,
      };
    }
  }

  return createNoneResult(raw);
}

