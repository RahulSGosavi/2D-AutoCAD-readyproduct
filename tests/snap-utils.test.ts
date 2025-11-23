import { describe, it, expect } from 'vitest';
import {
  SnapIndex,
  snapPoint,
  segmentIntersection,
  type Entity,
} from '../src/lib/snap-utils';

const polyline = (id: string, points: number[]): Entity => ({
  id,
  type: 'polyline',
  bbox: [
    Math.min(...points.filter((_, idx) => idx % 2 === 0)),
    Math.min(...points.filter((_, idx) => idx % 2 === 1)),
    Math.max(...points.filter((_, idx) => idx % 2 === 0)),
    Math.max(...points.filter((_, idx) => idx % 2 === 1)),
  ],
  geom: { points },
});

describe('segmentIntersection helper', () => {
  it('finds intersection point', () => {
    const hit = segmentIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    );
    expect(hit?.point.x).toBeCloseTo(5);
    expect(hit?.point.y).toBeCloseTo(5);
  });
});

describe('snapPoint', () => {
  it('returns intersection snap near crossing polylines', () => {
    const idx = new SnapIndex();
    idx.add(polyline('p1', [0, 0, 100, 100]));
    idx.add(polyline('p2', [0, 100, 100, 0]));
    const result = snapPoint(idx, { x: 52, y: 48 }, null, { tolerance: 10 });
    expect(result.type).toBe('intersection');
    expect(result.point.x).toBeCloseTo(50);
    expect(result.point.y).toBeCloseTo(50);
  });
});

