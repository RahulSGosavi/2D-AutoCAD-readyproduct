import { useCallback } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { createWallElement } from '../tools/wall-tools';
import type { Point } from '../lib/snap-utils';

export const useWallTool = () => {
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const addElement = useEditorStore((state) => state.addElement);
  const updateElement = useEditorStore((state) => state.updateElement);
  const setDrawingState = useEditorStore((state) => state.setDrawingState);

  const startWall = useCallback(
    (point: Point, thickness: number = 6) => {
      if (!activeLayerId) return;

      const wall = createWallElement(point, point, thickness, activeLayerId);
      addElement(wall);
      setDrawingState({ isDrawing: true, currentElementId: wall.id, startPoint: point });
    },
    [activeLayerId, addElement, setDrawingState],
  );

  const updateWall = useCallback(
    (point: Point) => {
      const drawingState = useEditorStore.getState().drawingState;
      if (!drawingState?.isDrawing || !drawingState.currentElementId) return;

      const element = useEditorStore.getState().elements.find((e) => e.id === drawingState.currentElementId);
      if (!element || element.type !== 'wall') return;

      const thickness = element.thickness || 6;
      const updated = createWallElement(drawingState.startPoint, point, thickness, element.layerId);
      updateElement({ ...element, points: updated.points, outerPoly: updated.outerPoly, innerPoly: updated.innerPoly });
    },
    [updateElement],
  );

  const finishWall = useCallback(() => {
    setDrawingState({ isDrawing: false, currentElementId: null, startPoint: null });
  }, [setDrawingState]);

  return { startWall, updateWall, finishWall };
};

