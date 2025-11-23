import type { Point } from '../utils/math-utils';

export const calculatePolygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export const calculateRectangleArea = (width: number, height: number): number => {
  return width * height;
};

export const calculateCircleArea = (radius: number): number => {
  return Math.PI * radius * radius;
};

export const calculateEllipseArea = (radiusX: number, radiusY: number): number => {
  return Math.PI * radiusX * radiusY;
};

export const formatArea = (area: number, unit: string = 'sq units'): string => {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(2)}M ${unit}`;
  }
  if (area >= 1000) {
    return `${(area / 1000).toFixed(2)}K ${unit}`;
  }
  return `${area.toFixed(2)} ${unit}`;
};

