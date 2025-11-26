// src/engine/snapping-engine.ts
import type { EditorElement } from '../state/useEditorStore';
import type { Segment } from './geometry-core';
import { intersectSegments } from './geometry-core';

export interface SnapPoint {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'intersection' | 'perpendicular' | 'parallel' | 'grid' | 'angle';
  elementId?: string;
  distance: number;
}

export interface SnapSettings {
  endpoint: boolean;
  midpoint: boolean;
  intersection: boolean;
  perpendicular: boolean;
  parallel: boolean;
  grid: boolean;
  angle: boolean;
  angleStep: number;
  gridSize: number;
  tolerance: number;
}

export class SnappingEngine {
  private elements: EditorElement[] = [];
  private snapSettings: SnapSettings;

  constructor(snapSettings: SnapSettings) {
    this.snapSettings = snapSettings;
  }

  updateElements(elements: EditorElement[]) {
    this.elements = elements;
  }

  updateSettings(settings: Partial<SnapSettings>) {
    this.snapSettings = { ...this.snapSettings, ...settings };
  }

  findSnapPoint(
    pointer: { x: number; y: number },
    excludeElementId?: string,
    referencePoint?: { x: number; y: number },
  ): SnapPoint | null {
    const candidates: SnapPoint[] = [];
    const tolerance = this.snapSettings.tolerance;

    // Grid snap
    if (this.snapSettings.grid) {
      const gridX = Math.round(pointer.x / this.snapSettings.gridSize) * this.snapSettings.gridSize;
      const gridY = Math.round(pointer.y / this.snapSettings.gridSize) * this.snapSettings.gridSize;
      const dist = Math.hypot(pointer.x - gridX, pointer.y - gridY);
      if (dist <= this.snapSettings.tolerance) {
        candidates.push({
          x: gridX,
          y: gridY,
          type: 'grid',
          distance: dist,
        });
      }
    }

    const elementSegments: Array<{ segment: Segment; elementId: string }> = [];

    // Element snaps
    for (const element of this.elements) {
      if (element.id === excludeElementId) continue;

      const points = this.getElementPoints(element);
      if (!points.length) continue;

      // Endpoint snap
      if (this.snapSettings.endpoint) {
        for (const point of points) {
          const dist = Math.hypot(pointer.x - point.x, pointer.y - point.y);
          if (dist <= this.snapSettings.tolerance) {
            candidates.push({
              x: point.x,
              y: point.y,
              type: 'endpoint',
              elementId: element.id,
              distance: dist,
            });
          }
        }
      }

      // Midpoint snap
      if (this.snapSettings.midpoint && points.length >= 2) {
        for (let i = 0; i < points.length - 1; i++) {
          const mid = {
            x: (points[i].x + points[i + 1].x) / 2,
            y: (points[i].y + points[i + 1].y) / 2,
          };
          const dist = Math.hypot(pointer.x - mid.x, pointer.y - mid.y);
          if (dist <= this.snapSettings.tolerance) {
            candidates.push({
              x: mid.x,
              y: mid.y,
              type: 'midpoint',
              elementId: element.id,
              distance: dist,
            });
          }
        }
      }

      const segments = this.getElementSegments(element);
      elementSegments.push(
        ...segments.map((segment) => ({
          segment,
          elementId: element.id,
        })),
      );

      if (this.snapSettings.perpendicular) {
        segments.forEach((segment) => {
          const projection = this.projectPointOntoSegment(pointer, segment);
          if (!projection) return;
          const dist = Math.hypot(pointer.x - projection.x, pointer.y - projection.y);
          if (dist <= tolerance) {
            candidates.push({
              x: projection.x,
              y: projection.y,
              type: 'perpendicular',
              elementId: element.id,
              distance: dist,
            });
          }
        });
      }
    }

    if (this.snapSettings.intersection) {
      for (let i = 0; i < elementSegments.length; i++) {
        for (let j = i + 1; j < elementSegments.length; j++) {
          const segA = elementSegments[i];
          const segB = elementSegments[j];
          if (segA.elementId === segB.elementId) continue;
          const intersection = intersectSegments(segA.segment, segB.segment);
          if (!intersection) continue;
          const dist = Math.hypot(pointer.x - intersection.x, pointer.y - intersection.y);
          if (dist <= tolerance) {
            candidates.push({
              x: intersection.x,
              y: intersection.y,
              type: 'intersection',
              distance: dist,
            });
          }
        }
      }
    }

    if (this.snapSettings.parallel) {
      for (const element of this.elements) {
        const points = this.getElementPoints(element);
        points.forEach((pt) => {
          if (Math.abs(pointer.x - pt.x) <= tolerance) {
            candidates.push({
              x: pt.x,
              y: pointer.y,
              type: 'parallel',
              elementId: element.id,
              distance: Math.abs(pointer.x - pt.x),
            });
          }
          if (Math.abs(pointer.y - pt.y) <= tolerance) {
            candidates.push({
              x: pointer.x,
              y: pt.y,
              type: 'parallel',
              elementId: element.id,
              distance: Math.abs(pointer.y - pt.y),
            });
          }
        });
      }
    }

    if (this.snapSettings.angle && referencePoint) {
      const snapped = this.getAngleSnap(pointer, referencePoint);
      if (snapped) {
        const dist = Math.hypot(pointer.x - snapped.x, pointer.y - snapped.y);
        candidates.push({
          x: snapped.x,
          y: snapped.y,
          type: 'angle',
          distance: dist,
        });
      }
    }

    // Find closest snap point
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0];
  }

  private getElementPoints(element: EditorElement): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    switch (element.type) {
      case 'line':
        points.push({ x: element.points[0], y: element.points[1] });
        points.push({ x: element.points[2], y: element.points[3] });
        break;
      case 'polyline':
        for (let i = 0; i < element.points.length; i += 2) {
          points.push({ x: element.points[i], y: element.points[i + 1] });
        }
        break;
      case 'rectangle':
        points.push({ x: element.x, y: element.y });
        points.push({ x: element.x + element.width, y: element.y });
        points.push({ x: element.x + element.width, y: element.y + element.height });
        points.push({ x: element.x, y: element.y + element.height });
        break;
      case 'circle':
        points.push({ x: element.x, y: element.y });
        break;
      case 'wall':
        for (let i = 0; i < element.points.length; i += 2) {
          points.push({ x: element.points[i], y: element.points[i + 1] });
        }
        break;
    }

    return points;
  }

  private getElementSegments(element: EditorElement): Segment[] {
    const segments: Segment[] = [];
    const points = this.getElementPoints(element);
    if (points.length < 2) return segments;
    switch (element.type) {
      case 'line':
      case 'wall':
        segments.push({ A: points[0], B: points[1] });
        break;
      case 'polyline':
        for (let i = 0; i < points.length - 1; i++) {
          segments.push({ A: points[i], B: points[i + 1] });
        }
        break;
      case 'rectangle':
        for (let i = 0; i < 4; i++) {
          segments.push({
            A: points[i],
            B: points[(i + 1) % 4],
          });
        }
        break;
    }
    return segments;
  }

  private projectPointOntoSegment(point: { x: number; y: number }, segment: Segment) {
    const ax = segment.A.x;
    const ay = segment.A.y;
    const bx = segment.B.x;
    const by = segment.B.y;
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby;
    if (lengthSq === 0) return null;
    let t = ((point.x - ax) * abx + (point.y - ay) * aby) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    return {
      x: ax + abx * t,
      y: ay + aby * t,
    };
  }

  private getAngleSnap(pointer: { x: number; y: number }, origin: { x: number; y: number }) {
    const dx = pointer.x - origin.x;
    const dy = pointer.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.snapSettings.tolerance * 2) return null;
    const rawAngle = Math.atan2(dy, dx);
    const step = (this.snapSettings.angleStep * Math.PI) / 180;
    const snappedAngle = Math.round(rawAngle / step) * step;
    return {
      x: origin.x + Math.cos(snappedAngle) * distance,
      y: origin.y + Math.sin(snappedAngle) * distance,
    };
  }
}

