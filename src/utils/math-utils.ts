export type Point = { x: number; y: number };

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const angle = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);

export const normalize = (p: Point): Point => {
  const len = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / len, y: p.y / len };
};

export const rotate = (point: Point, center: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

export const scale = (point: Point, center: Point, factor: number): Point => ({
  x: center.x + (point.x - center.x) * factor,
  y: center.y + (point.y - center.y) * factor,
});

export const mirror = (point: Point, lineStart: Point, lineEnd: Point): Point => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
  const b = (2 * dx * dy) / (dx * dx + dy * dy);
  const x = a * (point.x - lineStart.x) + b * (point.y - lineStart.y) + lineStart.x;
  const y = b * (point.x - lineStart.x) - a * (point.y - lineStart.y) + lineStart.y;
  return { x, y };
};

