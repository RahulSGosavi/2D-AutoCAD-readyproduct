import type { EditorElement } from '../state/useEditorStore';
import type { Segment } from '../engine/geometry-core';

type Point = { x: number; y: number };

const supportedTypes = new Set(['line', 'wall', 'polyline']);

const toAbsolutePoint = (element: EditorElement, x: number, y: number): Point => ({
  x: x + (element.x ?? 0),
  y: y + (element.y ?? 0),
});

export const elementToSegment = (element: EditorElement): Segment | null => {
  if (!supportedTypes.has(element.type)) return null;
  const pts = element.points;
  if (!pts || pts.length < 4) return null;
  return {
    A: toAbsolutePoint(element, pts[0], pts[1]),
    B: toAbsolutePoint(element, pts[2], pts[3]),
  };
};

export const segmentToElementPatch = (
  element: EditorElement,
  segment: Segment,
): Partial<EditorElement> | null => {
  if (!supportedTypes.has(element.type)) return null;
  const offsetX = element.x ?? 0;
  const offsetY = element.y ?? 0;
  return {
    points: [
      segment.A.x - offsetX,
      segment.A.y - offsetY,
      segment.B.x - offsetX,
      segment.B.y - offsetY,
    ],
  };
};

export const collectSegments = (
  elements: EditorElement[],
  excludeId?: string,
): Segment[] =>
  elements
    .filter((el) => el.id !== excludeId)
    .map((el) => elementToSegment(el))
    .filter((seg): seg is Segment => Boolean(seg));

export const pointAlongSegment = (segment: Segment, t: number): Point => ({
  x: segment.A.x + (segment.B.x - segment.A.x) * t,
  y: segment.A.y + (segment.B.y - segment.A.y) * t,
});

export const projectPointOnSegment = (segment: Segment, point: Point) => {
  const vx = segment.B.x - segment.A.x;
  const vy = segment.B.y - segment.A.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq === 0) return { t: 0, point: { ...segment.A } };
  const t = ((point.x - segment.A.x) * vx + (point.y - segment.A.y) * vy) / lenSq;
  const clamped = Math.max(0, Math.min(1, t));
  return {
    t: clamped,
    point: pointAlongSegment(segment, clamped),
  };
};

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

