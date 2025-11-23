import { describe, it, expect } from 'vitest';
import { trimSegmentToSegments, extendSegment, offsetPolyline } from '../src/tools/geom-tools';
import type { Point } from '../src/lib/snap-utils';

const point = (x: number, y: number): Point => ({ x, y });

describe('trimSegmentToSegments', () => {
  it('trims a segment using a perpendicular cutter', () => {
    const subject = { A: point(0, 0), B: point(10, 0) };
    const cutter = { A: point(5, -5), B: point(5, 5) };
    const trimmed = trimSegmentToSegments(subject, [cutter]);
    expect(trimmed).not.toBeNull();
    expect(trimmed?.B).toEqual(point(5, 0));
  });
});

describe('extendSegment', () => {
  it('extends to intersection when cutters provided', () => {
    const subject = { A: point(0, 0), B: point(5, 0) };
    const cutter = { A: point(8, -5), B: point(8, 5) };
    const hit = extendSegment(subject, { cutters: [cutter] });
    if (!hit || typeof (hit as Point).x !== 'number') {
      throw new Error('Expected intersection point');
    }
    expect(hit).toEqual(point(8, 0));
  });
});

describe('offsetPolyline', () => {
  it('offsets a rectangle outward', () => {
    const rect = [
      point(0, 0),
      point(10, 0),
      point(10, 10),
      point(0, 10),
      point(0, 0),
    ];
    const offset = offsetPolyline(rect, 2, 'miter');
    expect(offset[0].x).toBeLessThan(0);
    expect(offset[0].y).toBeLessThan(0);
  });
});

