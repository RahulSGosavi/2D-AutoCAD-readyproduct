import Konva from 'konva';
import type { Entity } from './snap-utils';
import { SnapIndex } from './snap-utils';

export type KonvaEntityInput = {
  id: string;
  type: 'line' | 'polyline' | 'rect' | 'circle' | 'point';
  node: Konva.Shape;
};

const getNodeId = (node: Konva.Node) =>
  (node.getAttr('snapId') as string | undefined) ?? `${node._id}`;

const layerNameFromNode = (node: Konva.Node) =>
  (node.getLayer()?.name() ?? '') || (node.getAttr('layerName') as string | undefined) || 'layer-0';

export function computeBBoxFromPoints(points: number[]): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

export function computeBBoxFromRect(
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number, number, number] {
  const minX = Math.min(x, x + width);
  const minY = Math.min(y, y + height);
  const maxX = Math.max(x, x + width);
  const maxY = Math.max(y, y + height);
  return [minX, minY, maxX, maxY];
}

export function computeBBoxFromCircle(
  cx: number,
  cy: number,
  r: number,
): [number, number, number, number] {
  return [cx - r, cy - r, cx + r, cy + r];
}

const ensureAbsolutePoints = (node: Konva.Shape) => {
  const points = node.getAttr('points') as number[] | undefined;
  if (!points) return undefined;
  const absPoints: number[] = [];
  const transform = node.getAbsoluteTransform();
  for (let i = 0; i < points.length; i += 2) {
    const pt = transform.point({ x: points[i], y: points[i + 1] });
    absPoints.push(pt.x, pt.y);
  }
  return absPoints;
};

const bboxFromClientRect = (node: Konva.Shape): [number, number, number, number] => {
  const rect = node.getClientRect({ skipTransform: false, skipShadow: true });
  return [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height];
};

const buildEntityForShape = (node: Konva.Shape): Entity | null => {
  const type = (node.getAttr('snapType') as KonvaEntityInput['type']) ?? node.getClassName().toLowerCase();
  const baseId = getNodeId(node);
  const entity: Entity = {
    id: baseId,
    type:
      type === 'line' || type === 'polyline' || type === 'rect' || type === 'circle' || type === 'point'
        ? type
        : 'point',
    bbox: bboxFromClientRect(node),
    geom: {},
    meta: {
      layer: layerNameFromNode(node),
    },
  };

  switch (entity.type) {
    case 'line':
    case 'polyline': {
      const absolutePoints = ensureAbsolutePoints(node) ?? [];
      entity.geom = { points: absolutePoints };
      entity.bbox = computeBBoxFromPoints(absolutePoints);
      break;
    }
    case 'rect': {
      const absPos = node.getAbsolutePosition();
      const width = node.width() * node.scaleX();
      const height = node.height() * node.scaleY();
      entity.geom = {};
      entity.bbox = computeBBoxFromRect(absPos.x, absPos.y, width, height);
      break;
    }
    case 'circle': {
      const absPos = node.getAbsolutePosition();
      const radius = (node.getAttr('radius') as number | undefined) ?? Math.max(node.width(), node.height()) / 2;
      const scaledRadius = radius * Math.max(node.scaleX(), node.scaleY());
      entity.geom = { center: absPos, radius: scaledRadius };
      entity.bbox = computeBBoxFromCircle(absPos.x, absPos.y, scaledRadius);
      break;
    }
    case 'point': {
      const absPos = node.getAbsolutePosition();
      entity.geom = { point: absPos };
      entity.bbox = computeBBoxFromCircle(absPos.x, absPos.y, 1);
      break;
    }
    default:
      break;
  }

  return entity;
};

const flattenGroupToEntities = (group: Konva.Group): Entity[] => {
  const childEntities: Entity[] = [];
  group.getChildren((node) => node instanceof Konva.Shape).forEach((child) => {
    if (child instanceof Konva.Group) {
      childEntities.push(...flattenGroupToEntities(child));
    } else {
      const entity = buildEntityForShape(child as Konva.Shape);
      if (entity) {
        childEntities.push(entity);
      }
    }
  });
  return childEntities;
};

export const konvaNodeToEntity = (input: KonvaEntityInput): Entity => {
  const entity = buildEntityForShape(input.node);
  if (entity) {
    entity.id = input.id;
    entity.type = input.type;
    return entity;
  }
  return {
    id: input.id,
    type: input.type,
    bbox: bboxFromClientRect(input.node),
    geom: {},
  };
};

const iterateNodeEntities = (node: Konva.Shape): Entity[] => {
  if (node instanceof Konva.Group) {
    return flattenGroupToEntities(node);
  }
  const entity = buildEntityForShape(node);
  return entity ? [entity] : [];
};

export function registerKonvaObjectToIndex(node: Konva.Shape, index: SnapIndex) {
  const entities = iterateNodeEntities(node);
  entities.forEach((entity) => {
    index.add(entity);
    node.setAttr('snapId', entity.id);
  });
}

export function unregisterKonvaObjectFromIndex(node: Konva.Shape, index: SnapIndex) {
  const entities = iterateNodeEntities(node);
  entities.forEach((entity) => index.remove(entity.id));
}

export function updateKonvaObjectInIndex(node: Konva.Shape, index: SnapIndex) {
  const entities = iterateNodeEntities(node);
  entities.forEach((entity) => index.update(entity));
}

