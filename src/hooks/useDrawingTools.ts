import { useCallback } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { createLineElement, createPolylineElement, createRectElement, createCircleElement } from '../tools/draw-tools';
import type { Point } from '../lib/snap-utils';

export const useDrawingTools = () => {
  const tool = useEditorStore((state) => state.tool);
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const addElement = useEditorStore((state) => state.addElement);
  const updateElement = useEditorStore((state) => state.updateElement);
  const setDrawingState = useEditorStore((state) => state.setDrawingState);

  const startDrawing = useCallback(
    (point: Point) => {
      if (!activeLayerId) return;

      const layer = useEditorStore.getState().layers.find((l) => l.id === activeLayerId);
      if (!layer) return;

      switch (tool) {
        case 'line':
          const line = createLineElement(point, point, activeLayerId);
          addElement(line);
          setDrawingState({ isDrawing: true, currentElementId: line.id, startPoint: point });
          break;
        case 'polyline':
          const polyline = createPolylineElement([point], activeLayerId);
          addElement(polyline);
          setDrawingState({ isDrawing: true, currentElementId: polyline.id, startPoint: point });
          break;
        case 'rect':
          const rect = createRectElement(point, point, activeLayerId);
          addElement(rect);
          setDrawingState({ isDrawing: true, currentElementId: rect.id, startPoint: point });
          break;
        case 'circle':
          const circle = createCircleElement(point, 0, activeLayerId);
          addElement(circle);
          setDrawingState({ isDrawing: true, currentElementId: circle.id, startPoint: point });
          break;
      }
    },
    [tool, activeLayerId, addElement, setDrawingState],
  );

  const updateDrawing = useCallback(
    (point: Point) => {
      const drawingState = useEditorStore.getState().drawingState;
      if (!drawingState?.isDrawing || !drawingState.currentElementId) return;

      const element = useEditorStore.getState().elements.find((e) => e.id === drawingState.currentElementId);
      if (!element) return;

      switch (tool) {
        case 'line':
          if (element.type === 'line') {
            updateElement({ ...element, points: [drawingState.startPoint.x, drawingState.startPoint.y, point.x, point.y] });
          }
          break;
        case 'rect':
          if (element.type === 'rect') {
            const width = point.x - drawingState.startPoint.x;
            const height = point.y - drawingState.startPoint.y;
            updateElement({ ...element, x: Math.min(drawingState.startPoint.x, point.x), y: Math.min(drawingState.startPoint.y, point.y), width: Math.abs(width), height: Math.abs(height) });
          }
          break;
        case 'circle':
          if (element.type === 'circle') {
            const radius = Math.hypot(point.x - drawingState.startPoint.x, point.y - drawingState.startPoint.y);
            updateElement({ ...element, radius });
          }
          break;
        case 'polyline':
          if (element.type === 'polyline') {
            const newPoints = [...(element.points || []), point.x, point.y];
            updateElement({ ...element, points: newPoints });
          }
          break;
      }
    },
    [tool, updateElement],
  );

  const finishDrawing = useCallback(() => {
    setDrawingState({ isDrawing: false, currentElementId: null, startPoint: null });
  }, [setDrawingState]);

  return { startDrawing, updateDrawing, finishDrawing };
};
