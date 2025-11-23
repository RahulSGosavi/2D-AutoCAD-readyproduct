import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Line, Rect, Ellipse, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { nanoid } from 'nanoid';
import { appendPoint, simplifyPoints } from '../utils/smoothing';
import {
  useEditorStore,
  type EditorElement,
  type Layer,
} from '../store/useEditorStore';

type Pointer = { x: number; y: number };

const DEFAULT_STROKE = '#f8fafc';
const DEFAULT_FILL = 'rgba(79, 209, 197, 0.12)';

const getRelativePointer = (stage: Konva.Stage | null) => {
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
};

const shapeCursor = (tool: string, isPanning: boolean) => {
  if (isPanning) return 'grabbing';
  if (tool === 'select') return 'default';
  if (tool === 'eraser') return 'not-allowed';
  return 'crosshair';
};

const FloorCanvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<Pointer | null>(null);
  const polylineRef = useRef<number[]>([]);
  const touchPanRef = useRef<{ center: Pointer | null }>({ center: null });

  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [draftElement, setDraftElement] = useState<EditorElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);

  const tool = useEditorStore((state) => state.tool);
  const layers = useEditorStore((state) => state.layers);
  const elements = useEditorStore((state) => state.elements);
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const stageScale = useEditorStore((state) => state.stageScale);
  const stagePosition = useEditorStore((state) => state.stagePosition);
  const pointer = useEditorStore((state) => state.pointer);
  const setPointer = useEditorStore((state) => state.setPointer);
  const addElement = useEditorStore((state) => state.addElement);
  const updateElement = useEditorStore((state) => state.updateElement);
  const removeElement = useEditorStore((state) => state.removeElement);
  const setSelectedElement = useEditorStore((state) => state.setSelectedElement);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setStageTransform = useEditorStore((state) => state.setStageTransform);
  const setStageInstance = useEditorStore((state) => state.setStageInstance);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.touchAction = 'none';
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setCanvasSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsSpacePressed(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedElementId) {
        event.preventDefault();
        removeElement(selectedElementId);
      }
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [selectedElementId, undo, redo, removeElement, clearSelection]);

  useEffect(() => {
    if (stageRef.current) {
      setStageInstance(stageRef.current);
    }
    return () => setStageInstance(null);
  }, [setStageInstance]);

  useEffect(() => {
    setDraftElement((current) => {
      if (tool !== 'polyline' && current?.type === 'polyline') {
        polylineRef.current = [];
        return null;
      }
      if (tool !== 'pencil' && current?.type === 'free') {
        setIsDrawing(false);
        return null;
      }
      return current;
    });
    if (tool !== 'polyline') {
      polylineRef.current = [];
    }
  }, [tool]);

  useEffect(() => {
    if (!transformerRef.current) return;
    if (!selectedElementId) {
      transformerRef.current.nodes([]);
      return;
    }
    const node = shapeRefs.current[selectedElementId];
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId, elements]);

  const isPanning = isSpacePressed || isTouchPanning;

  const updatePointerFromEvent = () => {
    const stage = stageRef.current;
    const point = getRelativePointer(stage);
    if (point) {
      setPointer(point);
    }
    return point;
  };

  const finalizeDraft = () => {
    if (!draftElement) return;
    addElement({
      ...draftElement,
      id: nanoid(),
      draggable: true,
    });
    setDraftElement(null);
    originRef.current = null;
    setIsDrawing(false);
  };

  const handlePointerDown = (evt: KonvaEventObject<PointerEvent>) => {
    if (isPanning) return;
    if (evt.target !== evt.target.getStage()) return;
    const point = updatePointerFromEvent();
    if (!point || !activeLayerId) return;

    if (tool === 'select') {
      clearSelection();
      return;
    }

    if (tool === 'polyline') {
      polylineRef.current = [...polylineRef.current, point.x, point.y];
      setDraftElement({
        id: 'polyline-preview',
        type: 'polyline',
        layerId: activeLayerId,
        points: polylineRef.current,
        stroke: DEFAULT_STROKE,
        strokeWidth: 2,
        opacity: 1,
        draggable: false,
        rotation: 0,
        tension: 0,
        x: 0,
        y: 0,
      } as EditorElement);
      return;
    }

    originRef.current = point;

    if (tool === 'pencil') {
      setDraftElement({
        id: 'free-preview',
        type: 'free',
        points: [point.x, point.y],
        layerId: activeLayerId,
        stroke: DEFAULT_STROKE,
        strokeWidth: Math.max(1.5, (evt.evt.pressure || 0.5) * 3),
        opacity: 1,
        draggable: false,
        tension: 0.5,
        x: 0,
        y: 0,
        rotation: 0,
      });
      setIsDrawing(true);
      return;
    }

    if (tool === 'rectangle') {
      setDraftElement({
        id: 'rect-preview',
        type: 'rectangle',
        layerId: activeLayerId,
        stroke: DEFAULT_STROKE,
        strokeWidth: 2,
        opacity: 1,
        draggable: false,
        rotation: 0,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        fill: DEFAULT_FILL,
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'ellipse') {
      setDraftElement({
        id: 'ellipse-preview',
        type: 'ellipse',
        layerId: activeLayerId,
        stroke: DEFAULT_STROKE,
        strokeWidth: 2,
        opacity: 1,
        draggable: false,
        rotation: 0,
        x: point.x,
        y: point.y,
        radiusX: 0,
        radiusY: 0,
        fill: DEFAULT_FILL,
      } as EditorElement);
      setIsDrawing(true);
    }
  };

  const handlePointerMove = () => {
    const point = updatePointerFromEvent();
    if (!point) return;

    if (tool === 'polyline' && polylineRef.current.length) {
      setDraftElement({
        id: 'polyline-preview',
        type: 'polyline',
        layerId: activeLayerId,
        points: [...polylineRef.current, point.x, point.y],
        stroke: DEFAULT_STROKE,
        strokeWidth: 2,
        opacity: 1,
        draggable: false,
        rotation: 0,
        tension: 0,
        x: 0,
        y: 0,
      } as EditorElement);
    }

    if (!draftElement || !isDrawing) return;

    if (draftElement.type === 'free') {
      setDraftElement({
        ...draftElement,
        points: appendPoint(draftElement.points, point, 0.5),
      });
    } else if (draftElement.type === 'rectangle' && originRef.current) {
      const nextWidth = point.x - originRef.current.x;
      const nextHeight = point.y - originRef.current.y;
      setDraftElement({
        ...draftElement,
        x: nextWidth < 0 ? point.x : originRef.current.x,
        y: nextHeight < 0 ? point.y : originRef.current.y,
        width: Math.abs(nextWidth),
        height: Math.abs(nextHeight),
      });
    } else if (draftElement.type === 'ellipse' && originRef.current) {
      setDraftElement({
        ...draftElement,
        radiusX: Math.abs(point.x - originRef.current.x),
        radiusY: Math.abs(point.y - originRef.current.y),
      });
    }
  };

  const handlePointerUp = () => {
    if (!draftElement) return;
    if (draftElement.type === 'free') {
      const simplified = simplifyPoints(draftElement.points, 1.2);
      finalizeDraftWithPoints(simplified);
    } else if (
      draftElement.type === 'rectangle' &&
      draftElement.width > 2 &&
      draftElement.height > 2
    ) {
      finalizeDraft();
    } else if (
      draftElement.type === 'ellipse' &&
      draftElement.radiusX > 1 &&
      draftElement.radiusY > 1
    ) {
      finalizeDraft();
    } else {
      setDraftElement(null);
      originRef.current = null;
      setIsDrawing(false);
    }
  };

  const finalizeDraftWithPoints = (points: number[]) => {
    if (!draftElement) return;
    if (draftElement.type !== 'free' && draftElement.type !== 'polyline') return;
    addElement({
      ...draftElement,
      id: nanoid(),
      points,
      draggable: true,
    });
    setDraftElement(null);
    originRef.current = null;
    setIsDrawing(false);
  };

  const finishPolyline = () => {
    if (!polylineRef.current.length || !activeLayerId) return;
    if (polylineRef.current.length < 4) {
      polylineRef.current = [];
      setDraftElement(null);
      return;
    }
    addElement({
      id: nanoid(),
      type: 'polyline',
      points: simplifyPoints(polylineRef.current, 0.75),
      layerId: activeLayerId,
      stroke: DEFAULT_STROKE,
      strokeWidth: 2,
      opacity: 1,
      draggable: true,
      tension: 0,
      x: 0,
      y: 0,
      rotation: 0,
    } as EditorElement);
    polylineRef.current = [];
    setDraftElement(null);
  };

  const handleWheel = (evt: KonvaEventObject<WheelEvent>) => {
    evt.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stageScale;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    const scaleBy = 1.04;
    const direction = evt.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(4, Math.max(0.2, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));
    const mousePointTo = {
      x: (pointerPos.x - stagePosition.x) / oldScale,
      y: (pointerPos.y - stagePosition.y) / oldScale,
    };
    const newPos = {
      x: pointerPos.x - mousePointTo.x * newScale,
      y: pointerPos.y - mousePointTo.y * newScale,
    };
    setStageTransform({ scale: newScale, position: newPos });
  };

  const handleStageDragEnd = () => {
    const stage = stageRef.current;
    if (!stage) return;
    setStageTransform({
      position: stage.position(),
    });
  };

  const handleTouchMove = (evt: KonvaEventObject<TouchEvent>) => {
    const touchEvent = evt.evt;
    if (touchEvent.touches.length === 2) {
      evt.evt.preventDefault();
      const center: Pointer = {
        x: (touchEvent.touches[0].clientX + touchEvent.touches[1].clientX) / 2,
        y: (touchEvent.touches[0].clientY + touchEvent.touches[1].clientY) / 2,
      };
      if (touchPanRef.current.center) {
        const dx = center.x - touchPanRef.current.center.x;
        const dy = center.y - touchPanRef.current.center.y;
        setStageTransform({
          position: {
            x: stagePosition.x + dx,
            y: stagePosition.y + dy,
          },
        });
      }
      touchPanRef.current.center = center;
      setIsTouchPanning(true);
    }
  };

  const handleTouchEnd = (evt: KonvaEventObject<TouchEvent>) => {
    if (evt.evt.touches.length < 2) {
      touchPanRef.current.center = null;
      setIsTouchPanning(false);
    }
  };

  const handleShapeSelect = (elementId: string, layer: Layer, evt: KonvaEventObject<PointerEvent>) => {
    if (layer.locked) return;
    if (tool === 'eraser') {
      removeElement(elementId);
      return;
    }
    if (tool !== 'select') {
      evt.cancelBubble = true;
      return;
    }
    setSelectedElement(elementId);
  };

  const onTransformEnd = (element: EditorElement) => {
    const node = shapeRefs.current[element.id];
    if (!node) return;
    if (element.type === 'rectangle') {
      const width = (node.width() ?? 0) * node.scaleX();
      const height = (node.height() ?? 0) * node.scaleY();
      updateElement(
        element.id,
        {
          x: node.x(),
          y: node.y(),
          width,
          height,
          rotation: node.rotation(),
        },
      );
      node.scaleX(1);
      node.scaleY(1);
    } else if (element.type === 'ellipse') {
      updateElement(
        element.id,
        {
          x: node.x(),
          y: node.y(),
          radiusX: (node as Konva.Ellipse).radiusX() * node.scaleX(),
          radiusY: (node as Konva.Ellipse).radiusY() * node.scaleY(),
          rotation: node.rotation(),
        },
      );
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  const visibleLayers = useMemo(() => layers.filter((layer) => layer.visible), [layers]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        style={{
          backgroundColor: '#0f1115',
          cursor: shapeCursor(tool, isPanning),
          touchAction: 'none',
        }}
        draggable={isPanning}
        onDragEnd={handleStageDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDblClick={finishPolyline}
      >
        {visibleLayers.map((layer) => (
          <KonvaLayer key={layer.id} listening={!layer.locked}>
            {elements
              .filter((element) => element.layerId === layer.id)
              .map((element) => {
                if (element.type === 'free' || element.type === 'polyline') {
                  return (
                    <Line
                      key={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      points={element.points}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      tension={element.type === 'free' ? 0.5 : 0}
                      lineCap="round"
                      lineJoin="round"
                      draggable={!layer.locked && element.draggable && tool === 'select'}
                      x={element.x}
                      y={element.y}
                      opacity={element.opacity}
                      onPointerDown={(evt) => handleShapeSelect(element.id, layer, evt)}
                      onDragEnd={(evt) =>
                        updateElement(element.id, {
                          x: evt.target.x(),
                          y: evt.target.y(),
                        })
                      }
                    />
                  );
                }

                if (element.type === 'rectangle') {
                  return (
                    <Rect
                      key={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      fill={element.fill}
                      opacity={element.opacity}
                      draggable={!layer.locked && element.draggable && tool === 'select'}
                      onPointerDown={(evt) => handleShapeSelect(element.id, layer, evt)}
                      onDragEnd={(evt) =>
                        updateElement(element.id, {
                          x: evt.target.x(),
                          y: evt.target.y(),
                        })
                      }
                      onTransformEnd={() => onTransformEnd(element)}
                    />
                  );
                }

                if (element.type === 'ellipse') {
                  return (
                    <Ellipse
                      key={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      radiusX={element.radiusX}
                      radiusY={element.radiusY}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      fill={element.fill}
                      opacity={element.opacity}
                      draggable={!layer.locked && element.draggable && tool === 'select'}
                      onPointerDown={(evt) => handleShapeSelect(element.id, layer, evt)}
                      onDragEnd={(evt) =>
                        updateElement(element.id, {
                          x: evt.target.x(),
                          y: evt.target.y(),
                        })
                      }
                      onTransformEnd={() => onTransformEnd(element)}
                    />
                  );
                }

                return null;
              })}
          </KonvaLayer>
        ))}

        {draftElement && (
          <KonvaLayer listening={false}>
            {draftElement.type === 'free' || draftElement.type === 'polyline' ? (
              <Line
                points={draftElement.points}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                tension={draftElement.type === 'free' ? 0.5 : 0}
                lineCap="round"
                lineJoin="round"
                opacity={0.9}
              />
            ) : null}
            {draftElement.type === 'rectangle' ? (
              <Rect
                x={draftElement.x}
                y={draftElement.y}
                width={draftElement.width}
                height={draftElement.height}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                fill={draftElement.fill}
                opacity={0.75}
              />
            ) : null}
            {draftElement.type === 'ellipse' ? (
              <Ellipse
                x={draftElement.x}
                y={draftElement.y}
                radiusX={draftElement.radiusX}
                radiusY={draftElement.radiusY}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                fill={draftElement.fill}
                opacity={0.75}
              />
            ) : null}
          </KonvaLayer>
        )}

        <KonvaLayer listening={false}>
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          />
        </KonvaLayer>
      </Stage>
      <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-6 rounded-full bg-surface-raised/80 px-6 py-2 font-mono text-xs text-slate-300 shadow-panel backdrop-blur">
        <span>
          X: {pointer.x.toFixed(1)} Y: {pointer.y.toFixed(1)}
        </span>
        <span>Zoom: {(stageScale * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default FloorCanvas;

