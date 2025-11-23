import type { Point } from '../utils/math-utils';
import { dist, angle } from '../utils/math-utils';

export interface DimensionData {
  startPoint: Point;
  endPoint: Point;
  dimensionType: 'linear' | 'aligned' | 'angular' | 'radius' | 'area';
  value: number;
  text?: string;
}

export const calculateLinearDimension = (start: Point, end: Point): DimensionData => {
  const distance = dist(start, end);
  return {
    startPoint: start,
    endPoint: end,
    dimensionType: 'linear',
    value: distance,
    text: `${distance.toFixed(2)}`,
  };
};

export const calculateAngularDimension = (
  center: Point,
  start: Point,
  end: Point,
): DimensionData => {
  const angle1 = angle(center, start);
  const angle2 = angle(center, end);
  const angleDeg = Math.abs(angle2 - angle1) * (180 / Math.PI);
  return {
    startPoint: center,
    endPoint: end,
    dimensionType: 'angular',
    value: angleDeg,
    text: `${angleDeg.toFixed(1)}°`,
  };
};

export const calculateRadiusDimension = (center: Point, pointOnCircle: Point): DimensionData => {
  const radius = dist(center, pointOnCircle);
  return {
    startPoint: center,
    endPoint: pointOnCircle,
    dimensionType: 'radius',
    value: radius,
    text: `R${radius.toFixed(2)}`,
  };
};

export const formatDimensionText = (value: number, type: string): string => {
  switch (type) {
    case 'angular':
      return `${value.toFixed(1)}°`;
    case 'radius':
      return `R${value.toFixed(2)}`;
    case 'area':
      return `${value.toFixed(2)} sq units`;
    default:
      return `${value.toFixed(2)}`;
  }
};

