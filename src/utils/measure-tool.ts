// Measure tool - calculates distance between two points
import type { Point } from './math-utils';
import { dist } from './math-utils';

export interface MeasureResult {
  startPoint: Point;
  endPoint: Point;
  distance: number;
  angle: number; // in degrees
  deltaX: number;
  deltaY: number;
}

export const calculateMeasure = (start: Point, end: Point): MeasureResult => {
  const distance = dist(start, end);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  
  return {
    startPoint: start,
    endPoint: end,
    distance,
    angle,
    deltaX,
    deltaY,
  };
};

export const formatMeasureText = (result: MeasureResult, unit: string = 'px', unitScale: number = 1): string => {
  const scaledDistance = result.distance * unitScale;
  return `${scaledDistance.toFixed(2)} ${unit} @ ${result.angle.toFixed(1)}°`;
};

