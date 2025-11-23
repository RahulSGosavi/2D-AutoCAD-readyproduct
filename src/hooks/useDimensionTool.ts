import { useCallback } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { createLinearDimension, createAlignedDimension, createAngularDimension, createRadiusDimension } from '../tools/dimension-tools';
import type { Point } from '../lib/snap-utils';

export const useDimensionTool = () => {
  const tool = useEditorStore((state) => state.tool);
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const addElement = useEditorStore((state) => state.addElement);
  const setDrawingState = useEditorStore((state) => state.setDrawingState);

  const startDimension = useCallback(
    (point: Point) => {
      if (!activeLayerId) return;
      setDrawingState({ isDrawing: true, currentElementId: null, startPoint: point });
    },
    [activeLayerId, setDrawingState],
  );

  const updateDimension = useCallback(
    (point: Point) => {
      const drawingState = useEditorStore.getState().drawingState;
      if (!drawingState?.isDrawing || !drawingState.startPoint) return;

      if (!activeLayerId) return;

      let dimension;
      switch (tool) {
        case 'dimension':
          dimension = createLinearDimension(drawingState.startPoint, point, activeLayerId);
          break;
        default:
          return;
      }

      if (dimension) {
        addElement(dimension);
        setDrawingState({ isDrawing: false, currentElementId: null, startPoint: null });
      }
    },
    [tool, activeLayerId, addElement, setDrawingState],
  );

  const finishDimension = useCallback(() => {
    setDrawingState({ isDrawing: false, currentElementId: null, startPoint: null });
  }, [setDrawingState]);

  return { startDimension, updateDimension, finishDimension };
};

