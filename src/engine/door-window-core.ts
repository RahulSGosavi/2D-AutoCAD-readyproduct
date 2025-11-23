import type { Point } from '../utils/math-utils';
import type { WallElement } from '../state/useEditorStore';

export interface DoorWindowCut {
  start: Point;
  end: Point;
  width: number;
}

export const cutWallForOpening = (
  wall: WallElement,
  opening: DoorWindowCut,
): { outerPoly: number[]; innerPoly: number[] } | null => {
  if (!wall.outerPoly || !wall.innerPoly) return null;

  const wallStart = { x: wall.points[0], y: wall.points[1] };
  const wallEnd = { x: wall.points[2], y: wall.points[3] };
  const wallDir = {
    x: wallEnd.x - wallStart.x,
    y: wallEnd.y - wallStart.y,
  };
  const wallLen = Math.hypot(wallDir.x, wallDir.y);
  if (wallLen === 0) return null;

  const perp = { x: -wallDir.y / wallLen, y: wallDir.x / wallLen };
  const halfWidth = opening.width / 2;

  const cutOuter: number[] = [];
  const cutInner: number[] = [];

  const offsetOuter = (wall.thickness / 2) * 0.8;
  const offsetInner = (wall.thickness / 2) * 0.6;

  cutOuter.push(
    opening.start.x + perp.x * offsetOuter,
    opening.start.y + perp.y * offsetOuter,
  );
  cutOuter.push(
    opening.end.x + perp.x * offsetOuter,
    opening.end.y + perp.y * offsetOuter,
  );
  cutOuter.push(
    opening.end.x - perp.x * offsetOuter,
    opening.end.y - perp.y * offsetOuter,
  );
  cutOuter.push(
    opening.start.x - perp.x * offsetOuter,
    opening.start.y - perp.y * offsetOuter,
  );

  cutInner.push(
    opening.start.x + perp.x * offsetInner,
    opening.start.y + perp.y * offsetInner,
  );
  cutInner.push(
    opening.end.x + perp.x * offsetInner,
    opening.end.y + perp.y * offsetInner,
  );
  cutInner.push(
    opening.end.x - perp.x * offsetInner,
    opening.end.y - perp.y * offsetInner,
  );
  cutInner.push(
    opening.start.x - perp.x * offsetInner,
    opening.start.y - perp.y * offsetInner,
  );

  return { outerPoly: cutOuter, innerPoly: cutInner };
};

