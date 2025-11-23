import { nanoid } from 'nanoid';
import type { EditorElement, DoorElement, WindowElement, FurnitureElement } from '../state/useEditorStore';
import type { Point } from '../utils/math-utils';

export const createDoorElement = (
  position: Point,
  width: number,
  height: number,
  swingAngle: number,
  layerId: string,
  wallId?: string,
): DoorElement => {
  return {
    id: nanoid(),
    type: 'door',
    layerId,
    width,
    height,
    swingAngle,
    wallId,
    stroke: '#8b7355',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    x: position.x,
    y: position.y,
  };
};

export const createWindowElement = (
  position: Point,
  width: number,
  height: number,
  layerId: string,
  wallId?: string,
): WindowElement => {
  return {
    id: nanoid(),
    type: 'window',
    layerId,
    width,
    height,
    wallId,
    stroke: '#4a90e2',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    x: position.x,
    y: position.y,
  };
};

export const createFurnitureElement = (
  position: Point,
  width: number,
  height: number,
  category: string,
  layerId: string,
): FurnitureElement => {
  return {
    id: nanoid(),
    type: 'furniture',
    layerId,
    width,
    height,
    category,
    stroke: '#6b7280',
    strokeWidth: 1.5,
    opacity: 1,
    rotation: 0,
    x: position.x,
    y: position.y,
    fill: 'none', // Transparent fill - AutoCAD style
  };
};

export const flipDoorHinge = (door: DoorElement): DoorElement => {
  return {
    ...door,
    swingAngle: door.swingAngle + Math.PI,
  };
};

