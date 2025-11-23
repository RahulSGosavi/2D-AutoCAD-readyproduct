// src/tools/modify-tools-complete.ts
import type { EditorElement } from '../state/useEditorStore';
import type { Segment } from '../engine/geometry-core';
import { elementToSegment, segmentToElementPatch, collectSegments, projectPointOnSegment } from '../utils/segment-utils';
import { intersectSegments, extendSegment } from '../engine/geometry-core';

export interface ModifyResult {
  elements: EditorElement[];
  deletedIds?: string[];
}

// Move tool - translate elements
export const moveElements = (
  elements: EditorElement[],
  elementIds: string[],
  deltaX: number,
  deltaY: number
): ModifyResult => {
  return {
    elements: elements.map((el) => {
      if (!elementIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'polyline' || el.type === 'wall') {
        return {
          ...el,
          points: el.points.map((p, i) => (i % 2 === 0 ? p + deltaX : p + deltaY)),
        };
      }
      
      return {
        ...el,
        x: (el.x ?? 0) + deltaX,
        y: (el.y ?? 0) + deltaY,
      };
    }),
  };
};

// Rotate tool - rotate elements around a point
export const rotateElements = (
  elements: EditorElement[],
  elementIds: string[],
  centerX: number,
  centerY: number,
  angleRad: number
): ModifyResult => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  return {
    elements: elements.map((el) => {
      if (!elementIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'polyline' || el.type === 'wall') {
        const rotatedPoints = el.points.map((p, i) => {
          if (i % 2 === 0) {
            const x = p + (el.x ?? 0);
            const y = el.points[i + 1] + (el.y ?? 0);
            const dx = x - centerX;
            const dy = y - centerY;
            return (centerX + dx * cos - dy * sin) - (el.x ?? 0);
          } else {
            const x = el.points[i - 1] + (el.x ?? 0);
            const y = p + (el.y ?? 0);
            const dx = x - centerX;
            const dy = y - centerY;
            return (centerY + dx * sin + dy * cos) - (el.y ?? 0);
          }
        });
        return { ...el, points: rotatedPoints, rotation: (el.rotation ?? 0) + angleRad * (180 / Math.PI) };
      }
      
      const x = (el.x ?? 0);
      const y = (el.y ?? 0);
      const dx = x - centerX;
      const dy = y - centerY;
      
      return {
        ...el,
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
        rotation: (el.rotation ?? 0) + angleRad * (180 / Math.PI),
      };
    }),
  };
};

// Scale tool - scale elements from a point
export const scaleElements = (
  elements: EditorElement[],
  elementIds: string[],
  centerX: number,
  centerY: number,
  scaleX: number,
  scaleY: number
): ModifyResult => {
  return {
    elements: elements.map((el) => {
      if (!elementIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'polyline' || el.type === 'wall') {
        const scaledPoints = el.points.map((p, i) => {
          if (i % 2 === 0) {
            const x = p + (el.x ?? 0);
            return ((x - centerX) * scaleX + centerX) - (el.x ?? 0);
          } else {
            const y = p + (el.y ?? 0);
            return ((y - centerY) * scaleY + centerY) - (el.y ?? 0);
          }
        });
        return { ...el, points: scaledPoints };
      }
      
      const x = (el.x ?? 0);
      const y = (el.y ?? 0);
      
      return {
        ...el,
        x: (x - centerX) * scaleX + centerX,
        y: (y - centerY) * scaleY + centerY,
        width: el.type === 'rectangle' || el.type === 'door' || el.type === 'window' || el.type === 'furniture'
          ? (el.width ?? 0) * scaleX
          : el.width,
        height: el.type === 'rectangle' || el.type === 'door' || el.type === 'window' || el.type === 'furniture'
          ? (el.height ?? 0) * scaleY
          : el.height,
        radius: el.type === 'circle' || el.type === 'arc'
          ? (el.radius ?? 0) * Math.max(scaleX, scaleY)
          : el.radius,
        radiusX: el.type === 'ellipse'
          ? (el.radiusX ?? 0) * scaleX
          : el.radiusX,
        radiusY: el.type === 'ellipse'
          ? (el.radiusY ?? 0) * scaleY
          : el.radiusY,
      };
    }),
  };
};

// Mirror tool - mirror elements across a line
export const mirrorElements = (
  elements: EditorElement[],
  elementIds: string[],
  lineStartX: number,
  lineStartY: number,
  lineEndX: number,
  lineEndY: number
): ModifyResult => {
  const dx = lineEndX - lineStartX;
  const dy = lineEndY - lineStartY;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { elements };
  
  const nx = -dy / len;
  const ny = dx / len;
  
  return {
    elements: elements.map((el) => {
      if (!elementIds.includes(el.id)) return el;
      
      // Mirror points
      if (el.type === 'line' || el.type === 'polyline' || el.type === 'wall') {
        const mirroredPoints = el.points.map((p, i) => {
          if (i % 2 === 0) {
            const x = p + (el.x ?? 0);
            const y = el.points[i + 1] + (el.y ?? 0);
            const toLineX = x - lineStartX;
            const toLineY = y - lineStartY;
            const dist = toLineX * nx + toLineY * ny;
            return (x - 2 * dist * nx) - (el.x ?? 0);
          } else {
            const x = el.points[i - 1] + (el.x ?? 0);
            const y = p + (el.y ?? 0);
            const toLineX = x - lineStartX;
            const toLineY = y - lineStartY;
            const dist = toLineX * nx + toLineY * ny;
            return (y - 2 * dist * ny) - (el.y ?? 0);
          }
        });
        return { ...el, points: mirroredPoints };
      }
      
      const x = (el.x ?? 0);
      const y = (el.y ?? 0);
      const toLineX = x - lineStartX;
      const toLineY = y - lineStartY;
      const dist = toLineX * nx + toLineY * ny;
      
      return {
        ...el,
        x: x - 2 * dist * nx,
        y: y - 2 * dist * ny,
      };
    }),
  };
};

// Offset tool - create parallel offset
export const offsetElement = (
  element: EditorElement,
  distance: number
): EditorElement | null => {
  if (element.type !== 'line' && element.type !== 'polyline' && element.type !== 'wall') {
    return null;
  }
  
  // Simple offset for line - create parallel line
  if (element.type === 'line' && element.points.length >= 4) {
    const [x1, y1, x2, y2] = element.points;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    
    const perpX = (-dy / len) * distance;
    const perpY = (dx / len) * distance;
    
    return {
      ...element,
      id: `${element.id}-offset`,
      points: [
        x1 + perpX,
        y1 + perpY,
        x2 + perpX,
        y2 + perpY,
      ] as any,
    };
  }
  
  return null;
};

// Trim tool - already exists in segment-utils, but enhance it
export const trimElement = (
  element: EditorElement,
  trimPoint: { x: number; y: number },
  cutterElements: EditorElement[]
): EditorElement | null => {
  const segment = elementToSegment(element);
  if (!segment) return null;
  
  const cutters = cutterElements
    .map((el) => elementToSegment(el))
    .filter((seg): seg is Segment => Boolean(seg));
  
  if (!cutters.length) return null;
  
  const clickInfo = projectPointOnSegment(segment, trimPoint);
  const intersections = cutters
    .map((cutter) => {
      const point = intersectSegments(segment, cutter);
      if (!point) return null;
      const tInfo = projectPointOnSegment(segment, point);
      return { point, t: tInfo.t };
    })
    .filter((item): item is { point: { x: number; y: number }; t: number } => Boolean(item));
  
  if (!intersections.length) return null;
  
  const above = intersections
    .filter((entry) => entry.t > clickInfo.t + 0.01)
    .sort((a, b) => a.t - b.t)[0];
  const below = intersections
    .filter((entry) => entry.t < clickInfo.t - 0.01)
    .sort((a, b) => b.t - a.t)[0];
  
  let nextSegment: Segment | null = null;
  if (above && (!below || above.t - clickInfo.t <= clickInfo.t - below.t)) {
    nextSegment = { A: segment.A, B: above.point };
  } else if (below) {
    nextSegment = { A: below.point, B: segment.B };
  }
  
  if (!nextSegment) return null;
  const patch = segmentToElementPatch(element, nextSegment);
  if (!patch) return null;
  
  return { ...element, ...patch };
};

// Extend tool - extend element to intersection
export const extendElement = (
  element: EditorElement,
  extendPoint: { x: number; y: number },
  targetElements: EditorElement[]
): EditorElement | null => {
  const segment = elementToSegment(element);
  if (!segment) return null;
  
  const targets = targetElements
    .map((el) => elementToSegment(el))
    .filter((seg): seg is Segment => Boolean(seg));
  
  if (!targets.length) return null;
  
  const clickInfo = projectPointOnSegment(segment, extendPoint);
  const extendEnd = clickInfo.t >= 0.5 ? 'end' : 'start';
  const workingSegment =
    extendEnd === 'end'
      ? segment
      : { A: segment.B, B: segment.A };
  
  const extended = extendSegment(workingSegment, targets, 4000);
  const finalSegment =
    extendEnd === 'end'
      ? extended
      : { A: extended.B, B: extended.A };
  
  const patch = segmentToElementPatch(element, finalSegment);
  if (!patch) return null;
  
  return { ...element, ...patch };
};

// Fillet tool - create rounded corner
export const filletElements = (
  element1: EditorElement,
  element2: EditorElement,
  radius: number
): ModifyResult => {
  const seg1 = elementToSegment(element1);
  const seg2 = elementToSegment(element2);
  if (!seg1 || !seg2) return { elements: [element1, element2] };
  
  const intersection = intersectSegments(seg1, seg2);
  if (!intersection) return { elements: [element1, element2] };
  
  // TODO: Implement fillet arc creation
  return { elements: [element1, element2] };
};

// Chamfer tool - create beveled corner
export const chamferElements = (
  element1: EditorElement,
  element2: EditorElement,
  distance: number
): ModifyResult => {
  const seg1 = elementToSegment(element1);
  const seg2 = elementToSegment(element2);
  if (!seg1 || !seg2) return { elements: [element1, element2] };
  
  const intersection = intersectSegments(seg1, seg2);
  if (!intersection) return { elements: [element1, element2] };
  
  // TODO: Implement chamfer creation
  return { elements: [element1, element2] };
};

// Join tool - connect two elements
export const joinElements = (
  element1: EditorElement,
  element2: EditorElement
): EditorElement | null => {
  if (element1.type !== 'line' && element1.type !== 'polyline') return null;
  if (element2.type !== 'line' && element2.type !== 'polyline') return null;
  
  const pts1 = element1.points;
  const pts2 = element2.points;
  
  if (!pts1 || !pts2) return null;
  
  // Check if endpoints are close
  const end1X = pts1[pts1.length - 2] + (element1.x ?? 0);
  const end1Y = pts1[pts1.length - 1] + (element1.y ?? 0);
  const start2X = pts2[0] + (element2.x ?? 0);
  const start2Y = pts2[1] + (element2.y ?? 0);
  
  const dist = Math.hypot(end1X - start2X, end1Y - start2Y);
  if (dist > 10) return null; // Too far to join
  
  // Join into polyline
  if (element1.type === 'polyline') {
    return {
      ...element1,
      points: [...pts1, ...pts2],
    };
  }
  
  return {
    ...element1,
    type: 'polyline',
    points: [...pts1, ...pts2],
  };
};

// Explode tool - break complex element into primitives
export const explodeElement = (element: EditorElement): EditorElement[] => {
  if (element.type === 'polyline' && element.points) {
    const lines: EditorElement[] = [];
    for (let i = 0; i < element.points.length - 2; i += 2) {
      lines.push({
        ...element,
        id: `${element.id}-line-${i}`,
        type: 'line',
        points: [
          element.points[i],
          element.points[i + 1],
          element.points[i + 2],
          element.points[i + 3],
        ] as any,
      });
    }
    return lines;
  }
  
  if (element.type === 'rectangle') {
    const [x, y, w, h] = [element.x ?? 0, element.y ?? 0, element.width ?? 0, element.height ?? 0];
    return [
      {
        ...element,
        id: `${element.id}-line1`,
        type: 'line',
        points: [x, y, x + w, y] as any,
      },
      {
        ...element,
        id: `${element.id}-line2`,
        type: 'line',
        points: [x + w, y, x + w, y + h] as any,
      },
      {
        ...element,
        id: `${element.id}-line3`,
        type: 'line',
        points: [x + w, y + h, x, y + h] as any,
      },
      {
        ...element,
        id: `${element.id}-line4`,
        type: 'line',
        points: [x, y + h, x, y] as any,
      },
    ];
  }
  
  return [element];
};

