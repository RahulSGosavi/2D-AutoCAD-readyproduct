import { nanoid } from 'nanoid';
import type { EditorElement, DoorElement, WindowElement, FurnitureElement } from '../state/useEditorStore';
import type { CabinetModuleConfig, FurnitureFinishSet } from '../types/catalog';
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

export interface FurnitureElementOptions {
  category?: string;
  depth?: number;
  moduleClass?: CabinetModuleConfig['moduleClass'];
  cabinet?: CabinetModuleConfig;
  finish?: FurnitureFinishSet;
  manufacturer?: string;
  sku?: string;
  catalogId?: string;
  price?: number;
  currency?: string;
  tags?: string[];
  accessories?: string[];
  sections?: FurnitureElement['sections'];
  metadata?: Record<string, unknown>;
  blockId?: string;
  blockName?: string;
  planSymbolId?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  fill?: string;
}

export const createFurnitureElement = (
  position: Point,
  width: number,
  height: number,
  category: string,
  layerId: string,
  options: FurnitureElementOptions = {},
): FurnitureElement => {
  const {
    depth,
    moduleClass,
    cabinet,
    finish,
    manufacturer,
    sku,
    catalogId,
    price,
    currency,
    tags,
    accessories,
    sections,
    metadata,
    blockId,
    blockName,
    planSymbolId,
    stroke,
    strokeWidth,
    opacity,
    rotation,
    fill,
  } = options;

  return {
    id: nanoid(),
    type: 'furniture',
    layerId,
    width,
    height,
    category: options.category ?? category,
    depth,
    moduleClass,
    cabinet,
    finish,
    manufacturer,
    sku,
    catalogId,
    price,
    currency,
    tags,
    accessories,
    sections,
    metadata: metadata ?? {},
    blockId,
    blockName,
    planSymbolId,
    stroke: stroke ?? '#6b7280',
    strokeWidth: strokeWidth ?? 1.5,
    opacity: opacity ?? 1,
    rotation: rotation ?? 0,
    x: position.x,
    y: position.y,
    fill: fill ?? 'none', // Transparent fill - AutoCAD style
  };
};

export const flipDoorHinge = (door: DoorElement): DoorElement => {
  return {
    ...door,
    swingAngle: door.swingAngle + Math.PI,
  };
};

