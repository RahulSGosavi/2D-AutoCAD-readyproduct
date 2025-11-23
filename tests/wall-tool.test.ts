import { describe, it, expect } from 'vitest';
import { createWall, autoCorner, joinWalls } from '../src/engine/wall-tool';
import type { Segment } from '../src/engine/geometry-core';
import type { Point } from '../src/lib/snap-utils';

const point = (x: number, y: number): Point => ({ x, y });

describe('wall-tool', () => {
  it('creates wall with outer and inner polylines', () => {
    const wall = createWall(point(0, 0), point(10, 0), 2);
    expect(wall.outer.points.length).toBeGreaterThan(0);
    expect(wall.inner.points.length).toBeGreaterThan(0);
  });

  it('joins walls', () => {
    const w1 = createWall(point(0, 0), point(5, 0), 2);
    const w2 = createWall(point(5, 0), point(10, 0), 2);
    const joined = joinWalls(w1, w2);
    expect(joined?.mergedOuter.closed).toBe(true);
  });

  it('builds auto corner poly', () => {
    const segA: Segment = { A: point(0, 0), B: point(10, 0) };
    const segB: Segment = { A: point(10, 0), B: point(10, 10) };
    const corner = autoCorner(segA, segB, 2);
    expect(corner.points.length).toBe(3);
  });
});

