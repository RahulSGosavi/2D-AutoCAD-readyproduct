// src/tools/dimension-engine-complete.ts
import type { EditorElement, DimensionElement } from '../state/useEditorStore';
import { calculateLinearDimension, calculateAngularDimension, calculateRadiusDimension, formatDimensionText, type DimensionData } from '../engine/dimension-core';
import type { Point } from '../utils/math-utils';
import { dist, angle } from '../utils/math-utils';

// Extended DimensionData with additional properties
export interface ExtendedDimensionData extends DimensionData {
  offset?: number;
  isDiameter?: boolean;
}

// Calculate aligned dimension (parallel to line between two points)
export const calculateAlignedDimension = (
  start: Point,
  end: Point,
  offset: number = 20
): ExtendedDimensionData => {
  const distance = dist(start, end);
  const angleRad = angle(start, end);
  
  // Calculate dimension line position (offset perpendicular)
  const perpAngle = angleRad + Math.PI / 2;
  const offsetX = Math.cos(perpAngle) * offset;
  const offsetY = Math.sin(perpAngle) * offset;
  
  return {
    startPoint: { x: start.x + offsetX, y: start.y + offsetY },
    endPoint: { x: end.x + offsetX, y: end.y + offsetY },
    dimensionType: 'aligned',
    value: distance,
    text: `${distance.toFixed(2)}`,
    offset,
  };
};

// Calculate diameter dimension
export const calculateDiameterDimension = (
  center: Point,
  pointOnCircle: Point
): ExtendedDimensionData => {
  const radius = dist(center, pointOnCircle);
  const diameter = radius * 2;
  
  return {
    startPoint: center,
    endPoint: pointOnCircle,
    dimensionType: 'radius',
    value: diameter,
    text: `⌀${diameter.toFixed(2)}`,
    isDiameter: true,
  };
};

// Calculate room area from closed polyline or rectangle
export const calculateRoomArea = (
  element: EditorElement
): ExtendedDimensionData | null => {
  if (element.type === 'rectangle') {
    const width = element.width ?? 0;
    const height = element.height ?? 0;
    const area = width * height;
    
    return {
      startPoint: { x: element.x ?? 0, y: element.y ?? 0 },
      endPoint: { x: (element.x ?? 0) + width, y: (element.y ?? 0) + height },
      dimensionType: 'area',
      value: area,
      text: `${area.toFixed(2)} sq units`,
    };
  }
  
  if (element.type === 'polyline' && element.points && element.points.length >= 6) {
    // Calculate area using shoelace formula
    const points = element.points;
    let area = 0;
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i] + (element.x ?? 0);
      const y1 = points[i + 1] + (element.y ?? 0);
      const x2 = points[i + 2] + (element.x ?? 0);
      const y2 = points[i + 3] + (element.y ?? 0);
      area += x1 * y2 - x2 * y1;
    }
    area = Math.abs(area / 2);
    
    return {
      startPoint: { x: points[0] + (element.x ?? 0), y: points[1] + (element.y ?? 0) },
      endPoint: { x: points[points.length - 2] + (element.x ?? 0), y: points[points.length - 1] + (element.y ?? 0) },
      dimensionType: 'area',
      value: area,
      text: `${area.toFixed(2)} sq units`,
    };
  }
  
  return null;
};

// Create dimension element from dimension data
export const createDimensionElement = (
  data: ExtendedDimensionData,
  layerId: string,
  stroke: string = '#000000',
  strokeWidth: number = 1.5
): DimensionElement => {
  return {
    id: `dimension-${Date.now()}`,
    type: 'dimension',
    layerId,
    x: 0,
    y: 0,
    startPoint: data.startPoint,
    endPoint: data.endPoint,
    dimensionType: data.dimensionType,
    value: data.value,
    text: data.text || formatDimensionText(data.value, data.dimensionType),
    stroke,
    strokeWidth,
    opacity: 1,
    rotation: 0,
  };
};

// Update dimension when referenced element moves
export const updateDimension = (
  dimension: DimensionElement,
  referencedElements: EditorElement[]
): DimensionElement => {
  // For now, dimensions are static
  // In a full implementation, you'd track which elements the dimension references
  // and recalculate when those elements change
  return dimension;
};

// Render dimension line with extension lines and text
export const getDimensionRenderData = (dimension: DimensionElement) => {
  const { startPoint, endPoint, dimensionType, value, text } = dimension;
  const extensionLength = 10;
  const offset = 20;
  
  if (dimensionType === 'linear' || dimensionType === 'aligned') {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const len = Math.hypot(dx, dy);
    const angleRad = Math.atan2(dy, dx);
    
    // Extension lines
    const ext1Start = startPoint;
    const ext1End = {
      x: startPoint.x - Math.cos(angleRad + Math.PI / 2) * extensionLength,
      y: startPoint.y - Math.sin(angleRad + Math.PI / 2) * extensionLength,
    };
    const ext2Start = endPoint;
    const ext2End = {
      x: endPoint.x - Math.cos(angleRad + Math.PI / 2) * extensionLength,
      y: endPoint.y - Math.sin(angleRad + Math.PI / 2) * extensionLength,
    };
    
    // Dimension line (offset)
    const perpAngle = angleRad + Math.PI / 2;
    const offsetX = Math.cos(perpAngle) * offset;
    const offsetY = Math.sin(perpAngle) * offset;
    
    const dimStart = {
      x: startPoint.x + offsetX,
      y: startPoint.y + offsetY,
    };
    const dimEnd = {
      x: endPoint.x + offsetX,
      y: endPoint.y + offsetY,
    };
    
    // Text position (center of dimension line)
    const textPos = {
      x: (dimStart.x + dimEnd.x) / 2,
      y: (dimStart.y + dimEnd.y) / 2,
    };
    
    return {
      extensionLines: [
        { start: ext1Start, end: ext1End },
        { start: ext2Start, end: ext2End },
      ],
      dimensionLine: { start: dimStart, end: dimEnd },
      textPosition: textPos,
      text: text || `${value.toFixed(2)}`,
    };
  }
  
  if (dimensionType === 'angular') {
    // Angular dimension rendering
    return {
      extensionLines: [],
      dimensionLine: { start: startPoint, end: endPoint },
      textPosition: { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
      text: text || `${value.toFixed(1)}°`,
    };
  }
  
  if (dimensionType === 'radius') {
    // Radius dimension rendering
    return {
      extensionLines: [],
      dimensionLine: { start: startPoint, end: endPoint },
      textPosition: { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
      text: text || `R${value.toFixed(2)}`,
    };
  }
  
  if (dimensionType === 'area') {
    // Area label rendering
    return {
      extensionLines: [],
      dimensionLine: { start: startPoint, end: endPoint },
      textPosition: { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
      text: text || `${value.toFixed(2)} sq units`,
    };
  }
  
  return null;
};

