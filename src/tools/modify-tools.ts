import type { EditorElement } from '../state/useEditorStore';
import type { Point } from '../utils/math-utils';

export const moveElements = (elements: EditorElement[], delta: Point): EditorElement[] => {
  return elements.map((el) => ({
    ...el,
    x: el.x + delta.x,
    y: el.y + delta.y,
  }));
};

export const rotateElements = (
  elements: EditorElement[],
  center: Point,
  angle: number,
): EditorElement[] => {
  return elements.map((el) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = el.x - center.x;
    const dy = el.y - center.y;
    return {
      ...el,
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
      rotation: el.rotation + angle,
    };
  });
};

export const scaleElements = (
  elements: EditorElement[],
  center: Point,
  factor: number,
): EditorElement[] => {
  return elements.map((el) => {
    if (el.type === 'rectangle') {
      return {
        ...el,
        x: center.x + (el.x - center.x) * factor,
        y: center.y + (el.y - center.y) * factor,
        width: (el as { width: number }).width * factor,
        height: (el as { height: number }).height * factor,
      };
    }
    if (el.type === 'circle') {
      return {
        ...el,
        x: center.x + (el.x - center.x) * factor,
        y: center.y + (el.y - center.y) * factor,
        radius: (el as { radius: number }).radius * factor,
      };
    }
    return {
      ...el,
      x: center.x + (el.x - center.x) * factor,
      y: center.y + (el.y - center.y) * factor,
    };
  });
};

export const mirrorElements = (
  elements: EditorElement[],
  lineStart: Point,
  lineEnd: Point,
): EditorElement[] => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
  const b = (2 * dx * dy) / (dx * dx + dy * dy);

  return elements.map((el) => {
    const x = a * (el.x - lineStart.x) + b * (el.y - lineStart.y) + lineStart.x;
    const y = b * (el.x - lineStart.x) - a * (el.y - lineStart.y) + lineStart.y;
    return {
      ...el,
      x,
      y,
      rotation: -el.rotation,
    };
  });
};

