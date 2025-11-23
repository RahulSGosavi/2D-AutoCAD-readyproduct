import type { Point } from '../lib/snap-utils';
import type { SnapIndex } from '../lib/snap-utils';
import type { Segment, Poly } from '../engine/geometry-core';
import { createWall, joinWalls } from '../engine/wall-tool';

let currentStart: Point | null = null;
let currentPreview: Segment | null = null;
let currentThickness = 200;

export const startWall = (point: Point, thickness = 200) => {
  currentStart = point;
  currentThickness = thickness;
};

export const updateWall = (point: Point) => {
  if (!currentStart) return;
  currentPreview = {
    A: currentStart,
    B: point,
  };
};

export const finishWall = (point: Point) => {
  if (!currentStart) return null;
  const wallSegment: Segment = { A: currentStart, B: point };
  const wall = createWall(wallSegment.A, wallSegment.B, currentThickness);
  currentStart = null;
  currentPreview = null;
  return wall;
};

export const autoJoinWithNearbyWalls = (
  index: SnapIndex,
  segment: Segment,
  thickness: number,
) => {
  const candidates = index.searchRegion(segment.B.x, segment.B.y, thickness);
  const nearby = candidates
    .map((entity) => {
      const outer = entity.meta?.wallOuter as Poly | undefined;
      const inner = entity.meta?.wallInner as Poly | undefined;
      if (!outer || !inner) return null;
      return { outer, inner };
    })
    .filter((v): v is { outer: Poly; inner: Poly } => Boolean(v));

  if (!nearby.length) return null;

  return nearby.reduce<{ outer: Poly; inner: Poly } | null>((acc, wall) => {
    if (!acc) return wall;
    const merged = joinWalls(acc, wall);
    return merged ? { outer: merged.mergedOuter, inner: merged.mergedInner } : acc;
  }, createWall(segment.A, segment.B, thickness));
};

