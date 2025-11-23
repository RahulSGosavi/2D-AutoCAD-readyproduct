import { useCallback } from 'react';
import type { Point } from '../lib/snap-utils';
import { calculateLinearDimension, calculateAngularDimension, calculateRadiusDimension } from '../engine/dimension-core';

export const useDimensionIntegration = () => {
  const calculateLinear = useCallback((start: Point, end: Point) => {
    return calculateLinearDimension(start, end);
  }, []);

  const calculateAngular = useCallback((center: Point, start: Point, end: Point) => {
    return calculateAngularDimension(center, start, end);
  }, []);

  const calculateRadius = useCallback((center: Point, pointOnCircle: Point) => {
    return calculateRadiusDimension(center, pointOnCircle);
  }, []);

  return { calculateLinear, calculateAngular, calculateRadius };
};

