type Point = { x: number; y: number };

const getDistance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const toPairs = (points: number[]): Point[] => {
  const pairs: Point[] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push({ x: points[i], y: points[i + 1] });
  }
  return pairs;
};

const flatten = (points: Point[]): number[] =>
  points.flatMap((p) => [p.x, p.y]);

const perpendicularDistance = (point: Point, start: Point, end: Point) => {
  const area = Math.abs(
    0.5 *
      (start.x * end.y +
        end.x * point.y +
        point.x * start.y -
        end.x * start.y -
        point.x * end.y -
        start.x * point.y),
  );
  const bottom = getDistance(start, end);
  return bottom === 0 ? getDistance(point, start) : (area * 2) / bottom;
};

const rdp = (points: Point[], epsilon: number): Point[] => {
  if (points.length <= 2) {
    return points.slice();
  }

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance >= epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
};

export const simplifyPoints = (points: number[], tolerance = 1.5): number[] => {
  if (points.length <= 4) return points;
  const simplified = rdp(toPairs(points), tolerance);
  return flatten(simplified);
};

// Improved smooth interpolation for freehand drawing
const smoothInterpolate = (p1: Point, p2: Point, t: number): Point => {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
};

export const appendPoint = (
  points: number[],
  next: Point,
  minDistance = 1,
): number[] => {
  if (points.length < 2) {
    return [...points, next.x, next.y];
  }

  const prevPoint: Point = {
    x: points[points.length - 2],
    y: points[points.length - 1],
  };

  const distance = getDistance(prevPoint, next);
  
  // Skip if too close
  if (distance < minDistance) {
    return points;
  }

  return [...points, next.x, next.y];
};

