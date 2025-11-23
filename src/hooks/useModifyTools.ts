import { useCallback } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { moveElement, copyElement, rotateElement, scaleElement, mirrorElement } from '../tools/modify-tools';

export const useModifyTools = () => {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const updateElement = useEditorStore((state) => state.updateElement);
  const addElement = useEditorStore((state) => state.addElement);
  const elements = useEditorStore((state) => state.elements);

  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (!selectedElementId) return;
      const element = elements.find((e) => e.id === selectedElementId);
      if (!element) return;
      const moved = moveElement(element, dx, dy);
      updateElement(moved);
    },
    [selectedElementId, elements, updateElement],
  );

  const handleCopy = useCallback(() => {
    if (!selectedElementId) return;
    const element = elements.find((e) => e.id === selectedElementId);
    if (!element) return;
    const copied = copyElement(element);
    addElement(copied);
  }, [selectedElementId, elements, addElement]);

  const handleRotate = useCallback(
    (angle: number) => {
      if (!selectedElementId) return;
      const element = elements.find((e) => e.id === selectedElementId);
      if (!element) return;
      const rotated = rotateElement(element, angle);
      updateElement(rotated);
    },
    [selectedElementId, elements, updateElement],
  );

  const handleScale = useCallback(
    (scaleX: number, scaleY: number) => {
      if (!selectedElementId) return;
      const element = elements.find((e) => e.id === selectedElementId);
      if (!element) return;
      const scaled = scaleElement(element, scaleX, scaleY);
      updateElement(scaled);
    },
    [selectedElementId, elements, updateElement],
  );

  const handleMirror = useCallback(
    (axis: 'x' | 'y') => {
      if (!selectedElementId) return;
      const element = elements.find((e) => e.id === selectedElementId);
      if (!element) return;
      const mirrored = mirrorElement(element, axis);
      updateElement(mirrored);
    },
    [selectedElementId, elements, updateElement],
  );

  return { handleMove, handleCopy, handleRotate, handleScale, handleMirror };
};

