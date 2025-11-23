import { nanoid } from 'nanoid';
import type { EditorElement, DimensionElement } from '../state/useEditorStore';
import type { Point } from '../utils/math-utils';
import { dist } from '../utils/math-utils';

export const createLinearDimension = (
  startPoint: Point,
  endPoint: Point,
  layerId: string,
): DimensionElement => {
  const distance = dist(startPoint, endPoint);
  return {
    id: nanoid(),
    type: 'dimension',
    layerId,
    startPoint,
    endPoint,
    dimensionType: 'linear',
    value: distance,
    text: `${distance.toFixed(2)}`,
    stroke: '#4fd1c5',
    strokeWidth: 1.5,
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
  };
};

export const createAlignedDimension = (
  startPoint: Point,
  endPoint: Point,
  layerId: string,
): DimensionElement => {
  const distance = dist(startPoint, endPoint);
  return {
    id: nanoid(),
    type: 'dimension',
    layerId,
    startPoint,
    endPoint,
    dimensionType: 'aligned',
    value: distance,
    text: `${distance.toFixed(2)}`,
    stroke: '#4fd1c5',
    strokeWidth: 1.5,
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
  };
};

export const createAngularDimension = (
  center: Point,
  startPoint: Point,
  endPoint: Point,
  layerId: string,
): DimensionElement => {
  const angle1 = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
  const angle2 = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
  const angle = Math.abs(angle2 - angle1) * (180 / Math.PI);
  return {
    id: nanoid(),
    type: 'dimension',
    layerId,
    startPoint: center,
    endPoint: endPoint,
    dimensionType: 'angular',
    value: angle,
    text: `${angle.toFixed(1)}°`,
    stroke: '#4fd1c5',
    strokeWidth: 1.5,
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
  };
};

export const createRadiusDimension = (
  center: Point,
  radius: number,
  layerId: string,
): DimensionElement => {
  const endPoint: Point = { x: center.x + radius, y: center.y };
  return {
    id: nanoid(),
    type: 'dimension',
    layerId,
    startPoint: center,
    endPoint,
    dimensionType: 'radius',
    value: radius,
    text: `R${radius.toFixed(2)}`,
    stroke: '#4fd1c5',
    strokeWidth: 1.5,
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
  };
};

