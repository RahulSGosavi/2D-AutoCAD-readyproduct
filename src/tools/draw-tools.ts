import type { Point } from '../utils/math-utils';
import type { EditorElement } from '../state/useEditorStore';
import { nanoid } from 'nanoid';

export interface DrawTool {
  start(point: Point): void;
  update(point: Point): EditorElement | null;
  finish(point: Point): EditorElement | null;
  cancel(): void;
}

export class LineTool implements DrawTool {
  private startPoint: Point | null = null;
  private layerId: string;

  constructor(layerId: string) {
    this.layerId = layerId;
  }

  start(point: Point): void {
    this.startPoint = point;
  }

  update(point: Point): EditorElement | null {
    if (!this.startPoint) return null;
    return {
      id: 'draft',
      type: 'line',
      layerId: this.layerId,
      points: [this.startPoint.x, this.startPoint.y, point.x, point.y],
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: 0,
      y: 0,
    };
  }

  finish(point: Point): EditorElement | null {
    if (!this.startPoint) return null;
    const element: EditorElement = {
      id: nanoid(),
      type: 'line',
      layerId: this.layerId,
      points: [this.startPoint.x, this.startPoint.y, point.x, point.y],
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: 0,
      y: 0,
    };
    this.startPoint = null;
    return element;
  }

  cancel(): void {
    this.startPoint = null;
  }
}

export class RectangleTool implements DrawTool {
  private startPoint: Point | null = null;
  private layerId: string;

  constructor(layerId: string) {
    this.layerId = layerId;
  }

  start(point: Point): void {
    this.startPoint = point;
  }

  update(point: Point): EditorElement | null {
    if (!this.startPoint) return null;
    return {
      id: 'draft',
      type: 'rectangle',
      layerId: this.layerId,
      width: Math.abs(point.x - this.startPoint.x),
      height: Math.abs(point.y - this.startPoint.y),
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: Math.min(this.startPoint.x, point.x),
      y: Math.min(this.startPoint.y, point.y),
      fill: 'rgba(79, 209, 197, 0.12)',
    };
  }

  finish(point: Point): EditorElement | null {
    if (!this.startPoint) return null;
    const element: EditorElement = {
      id: nanoid(),
      type: 'rectangle',
      layerId: this.layerId,
      width: Math.abs(point.x - this.startPoint.x),
      height: Math.abs(point.y - this.startPoint.y),
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: Math.min(this.startPoint.x, point.x),
      y: Math.min(this.startPoint.y, point.y),
      fill: 'rgba(79, 209, 197, 0.12)',
    };
    this.startPoint = null;
    return element;
  }

  cancel(): void {
    this.startPoint = null;
  }
}

export class CircleTool implements DrawTool {
  private center: Point | null = null;
  private layerId: string;

  constructor(layerId: string) {
    this.layerId = layerId;
  }

  start(point: Point): void {
    this.center = point;
  }

  update(point: Point): EditorElement | null {
    if (!this.center) return null;
    const radius = Math.hypot(point.x - this.center.x, point.y - this.center.y);
    return {
      id: 'draft',
      type: 'circle',
      layerId: this.layerId,
      radius,
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: this.center.x,
      y: this.center.y,
      fill: 'rgba(79, 209, 197, 0.12)',
    };
  }

  finish(point: Point): EditorElement | null {
    if (!this.center) return null;
    const radius = Math.hypot(point.x - this.center.x, point.y - this.center.y);
    const element: EditorElement = {
      id: nanoid(),
      type: 'circle',
      layerId: this.layerId,
      radius,
      stroke: '#f8fafc',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      x: this.center.x,
      y: this.center.y,
      fill: 'rgba(79, 209, 197, 0.12)',
    };
    this.center = null;
    return element;
  }

  cancel(): void {
    this.center = null;
  }
}

