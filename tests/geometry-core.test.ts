import { describe, it, expect } from 'vitest';
import {
  intersectSegments,
  trimSegment,
  extendSegment,
  offsetPolyline,
  polyArea,
  type Segment,
  type Poly,
} from '../src/engine/geometry-core';
import type { Point } from '../src/lib/snap-utils';

const point = (x: number, y: number): Point => ({ x, y });

describe('intersectSegments', () => {
  it('finds intersection of diagonal segments', () => {
    const s1: Segment = { A: point(0, 0), B: point(10, 10) };
    const s2: Segment = { A: point(0, 10), B: point(10, 0) };
    const intersection = intersectSegments(s1, s2);
    expect(intersection).toEqual(point(5, 5));
  });
});

describe('trimSegment', () => {
  it('trims segment at first cutter', () => {
    const seg: Segment = { A: point(0, 0), B: point(10, 0) };
    const cutter: Segment = { A: point(5, -5), B: point(5, 5) };
    const trimmed = trimSegment(seg, [cutter]);
    expect(trimmed?.B.x).toBeCloseTo(5);
  });
});

describe('extendSegment', () => {
  it('extends to nearest cutter', () => {
    const seg: Segment = { A: point(0, 0), B: point(5, 0) };
    const cutter: Segment = { A: point(12, -5), B: point(12, 5) };
    const extended = extendSegment(seg, [cutter], 20);
    expect(extended.B.x).toBeCloseTo(12);
  });
});

describe('offsetPolyline', () => {
  it('offsets open polyline', () => {
    const poly: Poly = { points: [point(0, 0), point(10, 0)], closed: false };
    const offset = offsetPolyline(poly, 2);
    expect(offset.points.length).toBe(poly.points.length);
  });
});

describe('polyArea', () => {
  it('computes area of square', () => {
    const square: Poly = {
      points: [point(0, 0), point(10, 0), point(10, 10), point(0, 10)],
      closed: true,
    };
    expect(polyArea(square)).toBeCloseTo(100);
  });
});

