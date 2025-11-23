// src/engine/snapping-engine.ts
import type { EditorElement } from '../state/useEditorStore';
import type { Segment } from './geometry-core';

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
    excludeElementId?: string
  ): SnapPoint | null {
    const candidates: SnapPoint[] = [];

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
}

