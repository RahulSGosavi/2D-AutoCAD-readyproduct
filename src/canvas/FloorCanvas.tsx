// src/canvas/FloorCanvas.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Stage, Layer as KonvaLayer, Line, Rect, Ellipse, Circle, Arc, Text, Transformer } from 'react-konva';

import type Konva from 'konva';

import type { KonvaEventObject } from 'konva/lib/Node';

import { nanoid } from 'nanoid';
import type { LibraryElementTemplate } from '../components/ElementLibrary';

import { appendPoint, simplifyPoints } from '../utils/smoothing';
import type { Segment } from '../engine/geometry-core';
import { extendSegment, intersectSegments } from '../engine/geometry-core';
import {

  elementToSegment,

  segmentToElementPatch,

  collectSegments,

  projectPointOnSegment,

} from '../utils/segment-utils';

import {

  useEditorStore,

  type EditorElement,

  type Layer,

} from '../state/useEditorStore';

import GridBackground from './GridBackground';



type Pointer = { x: number; y: number };

// Helper to render furniture with category-specific visuals
const renderFurnitureElement = (
  element: EditorElement,
  layer: Layer,
  tool: string,
  onSelect: (id: string, layer: Layer, evt: KonvaEventObject<PointerEvent>) => void,
  onDragEnd: (evt: KonvaEventObject<DragEvent>) => void,
  onTransformEnd: () => void,
  shapeRefs: React.MutableRefObject<{ [key: string]: Konva.Shape | null }>
) => {
  const category = (element as any).category || '';
  const baseProps = {
    key: element.id,
    id: element.id,
    ref: (node: Konva.Shape | null) => {
      shapeRefs.current[element.id] = node;
    },
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    fill: element.fill,
    opacity: element.opacity,
    draggable: !layer.locked && element.draggable && tool === 'select',
    onPointerDown: (evt: KonvaEventObject<PointerEvent>) => onSelect(element.id, layer, evt),
    onDragEnd,
    onTransformEnd,
  };

  // Calculate detail sizes based on element dimensions
  const detailSize = Math.min(element.width, element.height) * 0.15;
  const strokeDetail = Math.max(1.5, element.strokeWidth * 0.8);

  // Render based on category
  if (category.includes('sink')) {
    const faucetRadius = Math.max(4, detailSize);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={4} fill={element.fill || 'rgba(200, 200, 200, 0.3)'} />
        <Circle x={element.x + element.width * 0.25} y={element.y + element.height / 2} radius={faucetRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.75} y={element.y + element.height / 2} radius={faucetRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.25, element.y + element.height / 2, element.x + element.width * 0.25, element.y + element.height * 0.2]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.75, element.y + element.height / 2, element.x + element.width * 0.75, element.y + element.height * 0.2]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('stove')) {
    const burnerRadius = Math.max(8, detailSize * 1.5);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={2} fill={element.fill || 'rgba(50, 50, 50, 0.5)'} />
        <Circle x={element.x + element.width * 0.3} y={element.y + element.height / 2} radius={burnerRadius} stroke={element.stroke} strokeWidth={strokeDetail * 1.5} fill="none" opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.7} y={element.y + element.height / 2} radius={burnerRadius} stroke={element.stroke} strokeWidth={strokeDetail * 1.5} fill="none" opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.3} y={element.y + element.height / 2} radius={burnerRadius * 0.4} fill={element.stroke} opacity={element.opacity * 0.6} listening={false} />
        <Circle x={element.x + element.width * 0.7} y={element.y + element.height / 2} radius={burnerRadius * 0.4} fill={element.stroke} opacity={element.opacity * 0.6} listening={false} />
        <Line points={[element.x + element.width / 2, element.y + element.height * 0.2, element.x + element.width / 2, element.y]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('fridge')) {
    const handleRadius = Math.max(3, detailSize * 0.5);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={2} fill={element.fill || 'rgba(220, 220, 220, 0.4)'} />
        <Line points={[element.x + element.width / 2, element.y, element.x + element.width / 2, element.y + element.height]} stroke={element.stroke} strokeWidth={strokeDetail * 1.2} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.25} y={element.y + element.height * 0.2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.75} y={element.y + element.height * 0.2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('dishwasher')) {
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={2} fill={element.fill || 'rgba(200, 200, 200, 0.3)'} />
        <Rect x={element.x + element.width * 0.15} y={element.y + element.height * 0.2} width={element.width * 0.7} height={element.height * 0.6} stroke={element.stroke} strokeWidth={strokeDetail} fill="none" opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width / 2, element.y + element.height * 0.2, element.x + element.width / 2, element.y]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('cabinet')) {
    const handleRadius = Math.max(3, detailSize * 0.5);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={2} fill={element.fill || 'rgba(180, 160, 120, 0.4)'} />
        <Line points={[element.x + element.width * 0.33, element.y, element.x + element.width * 0.33, element.y + element.height]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity * 0.8} listening={false} />
        <Line points={[element.x + element.width * 0.67, element.y, element.x + element.width * 0.67, element.y + element.height]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity * 0.8} listening={false} />
        <Circle x={element.x + element.width * 0.2} y={element.y + element.height / 2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.8} y={element.y + element.height / 2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('toilet')) {
    return (
      <React.Fragment key={element.id}>
        <Ellipse x={element.x + element.width / 2} y={element.y + element.height * 0.75} radiusX={element.width * 0.4} radiusY={element.height * 0.2} fill={element.fill || 'rgba(240, 240, 240, 0.5)'} stroke={element.stroke} strokeWidth={element.strokeWidth} opacity={element.opacity} listening={false} />
        <Rect x={element.x + element.width * 0.2} y={element.y} width={element.width * 0.6} height={element.height * 0.4} cornerRadius={3} fill={element.fill || 'rgba(240, 240, 240, 0.5)'} stroke={element.stroke} strokeWidth={element.strokeWidth} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.3, element.y, element.x + element.width * 0.3, element.y - 6]} stroke={element.stroke} strokeWidth={strokeDetail * 1.5} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.7, element.y, element.x + element.width * 0.7, element.y - 6]} stroke={element.stroke} strokeWidth={strokeDetail * 1.5} opacity={element.opacity} listening={false} />
        <Rect {...baseProps} fill="none" listening={true} />
      </React.Fragment>
    );
  }
  
  if (category.includes('tub')) {
    const handleRadius = Math.max(4, detailSize * 0.6);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={element.height * 0.3} fill={element.fill || 'rgba(200, 220, 240, 0.4)'} />
        <Circle x={element.x + element.width * 0.25} y={element.y + element.height / 2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.75} y={element.y + element.height / 2} radius={handleRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.25, element.y + element.height * 0.3, element.x + element.width * 0.25, element.y]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width * 0.75, element.y + element.height * 0.3, element.x + element.width * 0.75, element.y]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  if (category.includes('shower')) {
    const dotRadius = Math.max(3, detailSize * 0.4);
    return (
      <React.Fragment key={element.id}>
        <Rect {...baseProps} cornerRadius={2} fill={element.fill || 'rgba(200, 220, 240, 0.3)'} />
        <Circle x={element.x + element.width * 0.3} y={element.y + element.height * 0.3} radius={dotRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.7} y={element.y + element.height * 0.3} radius={dotRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.3} y={element.y + element.height * 0.7} radius={dotRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Circle x={element.x + element.width * 0.7} y={element.y + element.height * 0.7} radius={dotRadius} fill={element.stroke} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
        <Line points={[element.x + element.width / 2, element.y + element.height * 0.2, element.x + element.width / 2, element.y]} stroke={element.stroke} strokeWidth={strokeDetail} opacity={element.opacity} listening={false} />
      </React.Fragment>
    );
  }
  
  // Default furniture rendering
  return <Rect {...baseProps} cornerRadius={5} />;
};



// Defaults moved to drawingSettings in store



const getRelativePointer = (stage: Konva.Stage | null): Pointer | null => {

  if (!stage) return null;

  const pointer = stage.getPointerPosition();

  if (!pointer) return null;

  // copy & invert transform safely

  const transform = stage.getAbsoluteTransform().copy();

  transform.invert();

  const pt = transform.point(pointer);

  return { x: pt.x, y: pt.y };

};



// Create pencil cursor SVG data URL
const createPencilCursor = () => {
  const svg = encodeURIComponent(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" 
            fill="#ff4444" stroke="#cc0000" stroke-width="0.5"/>
    </svg>
  `);
  return `data:image/svg+xml,${svg}`;
};

const shapeCursor = (tool: string, isPanning: boolean) => {

  if (isPanning) return 'grabbing';

  if (tool === 'select') return 'default';

  if (tool === 'eraser') {
    // Use custom pencil cursor
    const cursorUrl = createPencilCursor();
    return `url("${cursorUrl}") 4 4, auto`;
  }

  return 'crosshair';

};

const distance = (a: Pointer, b: Pointer) => Math.hypot(a.x - b.x, a.y - b.y);



const FloorCanvas: React.FC = () => {

  const stageRef = useRef<Konva.Stage | null>(null);

  const transformerRef = useRef<Konva.Transformer | null>(null);

  const shapeRefs = useRef<Record<string, Konva.Node | null>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  const originRef = useRef<Pointer | null>(null);

  const polylineRef = useRef<number[]>([]);

  const touchPanRef = useRef<{ center: Pointer | null }>({ center: null });

  const erasedElementsRef = useRef<Set<string>>(new Set());

  const rafRef = useRef<number | null>(null);



  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [draftElement, setDraftElement] = useState<EditorElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const [eraserPosition, setEraserPosition] = useState<Pointer | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [isTouchPanning, setIsTouchPanning] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);



  // Editor store selectors (Zustand)

  const tool = useEditorStore((state) => state.tool);

  const layers = useEditorStore((state) => state.layers);

  const elements = useEditorStore((state) => state.elements);

  const activeLayerId = useEditorStore((state) => state.activeLayerId);

  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);

  const selectedElementId = selectedElementIds[0] ?? null;

  const stageScale = useEditorStore((state) => state.stageScale);

  const stagePosition = useEditorStore((state) => state.stagePosition);

  const stageRotation = useEditorStore((state) => state.stageRotation);

  const drawingSettings = useEditorStore((state) => state.drawingSettings);

  const isPanMode = useEditorStore((state) => state.isPanMode);

  const pointer = useEditorStore((state) => state.pointer);

  const setPointer = useEditorStore((state) => state.setPointer);

  const addElement = useEditorStore((state) => state.addElement);

  const updateElement = useEditorStore((state) => state.updateElement);

  const removeElement = useEditorStore((state) => state.removeElement);

  const setSelectedElements = useEditorStore((state) => state.setSelectedElements);

  const setStageTransform = useEditorStore((state) => state.setStageTransform);

  const setStageInstance = useEditorStore((state) => state.setStageInstance);

  const undo = useEditorStore((state) => state.undo);

  const redo = useEditorStore((state) => state.redo);

  const snapSettings = useEditorStore((state) => state.snapSettings);

  const clearSelection = useCallback(() => setSelectedElements([]), [setSelectedElements]);



  // Resize observer for container

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



  // Keyboard handling

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



  // Provide stage instance to store once

  useEffect(() => {

    if (stageRef.current) {

      setStageInstance(stageRef.current);

    }

    return () => setStageInstance(null);

  }, [setStageInstance]);



  // When tool changes, reset polyline/freehand previews

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

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [tool]);



  // Transformer nodes update

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



  const isPanning = isSpacePressed || isTouchPanning || isPanMode;



  /**

   * IMPORTANT: This function MUST NOT call setPointer or any state update.

   * It only returns the transformed pointer coordinates (read-only).

   */

  const updatePointerFromEvent = (): Pointer | null => {

    const stage = stageRef.current;

    const point = getRelativePointer(stage);

    return point;

  };



  // Helper to raf-throttle pointer updates and avoid redundant store updates

  const schedulePointerUpdate = (pt: Pointer | null) => {

    if (!pt) return;

    // compare with current store pointer to avoid unnecessary setPointer

    if (pointer && pointer.x === pt.x && pointer.y === pt.y) return;

    if (rafRef.current) {

      cancelAnimationFrame(rafRef.current);

      rafRef.current = null;

    }

    rafRef.current = requestAnimationFrame(() => {

      setPointer(pt);

      rafRef.current = null;

    });

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



  // Pointer down: compute pointer, update store (throttled) and begin drawing

  const handlePointerDown = (evt: KonvaEventObject<PointerEvent>) => {

    // Prevent panning when space pressed or multi-touch panning

    if (isPanning) return;



    // Only start if stage background clicked

    if (evt.target !== evt.target.getStage()) return;



    const point = updatePointerFromEvent();

    schedulePointerUpdate(point);



    if (!point || !activeLayerId) return;



    if (tool === 'select') {

      clearSelection();

      return;

    }

    if (tool === 'eraser') {

      erasedElementsRef.current.clear();

      setIsDrawing(true);

      setEraserPosition(point);

      // Delete element at initial click if any

      const stage = evt.target.getStage();

      if (stage) {

        const eraserRadius = 15;

        const transform = stage.getAbsoluteTransform().copy().invert();

        const stagePoint = transform.point(point);

        const shapes = stage.find('.shape-element');

        for (const shape of shapes) {

          const shapeNode = shape as Konva.Shape;

          const elementId = shapeNode.id();

          if (!elementId || erasedElementsRef.current.has(elementId)) continue;

          const box = shapeNode.getClientRect();

          // Check if eraser circle intersects with shape

          const margin = eraserRadius;

          if (

            stagePoint.x >= box.x - margin &&

            stagePoint.x <= box.x + box.width + margin &&

            stagePoint.y >= box.y - margin &&

            stagePoint.y <= box.y + box.height + margin

          ) {

            const closestX = Math.max(box.x, Math.min(stagePoint.x, box.x + box.width));

            const closestY = Math.max(box.y, Math.min(stagePoint.y, box.y + box.height));

            const distX = stagePoint.x - closestX;

            const distY = stagePoint.y - closestY;

            const dist = Math.hypot(distX, distY);

            if (dist <= eraserRadius) {

              erasedElementsRef.current.add(elementId);

              removeElement(elementId);

            }

          }

        }

      }

      return;

    }



    if (tool === 'polyline') {

      polylineRef.current = [...polylineRef.current, point.x, point.y];

      setDraftElement({

        id: 'polyline-preview',

        type: 'polyline',

        layerId: activeLayerId,

        points: polylineRef.current,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

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

        stroke: drawingSettings.strokeColor,

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

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        fill: drawingSettings.fillColor,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'ellipse') {

      setDraftElement({

        id: 'ellipse-preview',

        type: 'ellipse',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        radiusX: 0,

        radiusY: 0,

        fill: drawingSettings.fillColor,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'arc') {

      setDraftElement({

        id: 'arc-preview',

        type: 'arc',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        radius: 0,

        startAngle: 0,

        endAngle: 180,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'circle') {

      setDraftElement({

        id: 'circle-preview',

        type: 'circle',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        radius: 0,

        fill: drawingSettings.fillColor,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'line') {

      setDraftElement({

        id: 'line-preview',

        type: 'line',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: 0,

        y: 0,

        points: [point.x, point.y, point.x, point.y] as [number, number, number, number],

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'wall') {

      setDraftElement({

        id: 'wall-preview',

        type: 'wall',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: 0,

        y: 0,

        points: [point.x, point.y, point.x, point.y],

        thickness: 10,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'door') {

      setDraftElement({

        id: 'door-preview',

        type: 'door',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        fill: drawingSettings.fillColor,

        swingAngle: 90,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'window') {

      setDraftElement({

        id: 'window-preview',

        type: 'window',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        fill: drawingSettings.fillColor,

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'furniture') {

      setDraftElement({

        id: 'furniture-preview',

        type: 'furniture',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        fill: drawingSettings.fillColor,

        category: 'custom',

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

    if (tool === 'dimension') {

      setDraftElement({

        id: 'dimension-preview',

        type: 'dimension',

        layerId: activeLayerId,

        stroke: drawingSettings.strokeColor,

        strokeWidth: 1.5,

        opacity: 1,

        draggable: false,

        rotation: 0,

        x: 0,

        y: 0,

        startPoint: { x: point.x, y: point.y },

        endPoint: { x: point.x, y: point.y },

        dimensionType: 'linear',

        value: 0,

        text: '',

      } as EditorElement);

      setIsDrawing(true);

      return;

    }

  };



  // Pointer move: update pointer (store) throttled; update draft element (local state)

  const handlePointerMove = (evt: KonvaEventObject<PointerEvent>) => {

    const point = updatePointerFromEvent();

    schedulePointerUpdate(point);



    if (!point) return;

    // Eraser tool: continuously detect and delete elements under cursor

    if (tool === 'eraser') {

      setEraserPosition(point);

      if (isDrawing) {

      const stage = evt.target.getStage();

      if (stage) {

        const eraserRadius = 15; // Eraser brush size

        const transform = stage.getAbsoluteTransform().copy().invert();

        const stagePoint = transform.point(point);

        // Find all shapes that intersect with eraser circle

        const shapes = stage.find('.shape-element');

        for (const shape of shapes) {

          const shapeNode = shape as Konva.Shape;

          const elementId = shapeNode.id();

          if (!elementId || erasedElementsRef.current.has(elementId)) continue;

          // Get shape's bounding box in stage coordinates

          const box = shapeNode.getClientRect();

          // Quick bounds check with eraser radius margin

          const margin = eraserRadius;

          if (

            stagePoint.x >= box.x - margin &&

            stagePoint.x <= box.x + box.width + margin &&

            stagePoint.y >= box.y - margin &&

            stagePoint.y <= box.y + box.height + margin

          ) {

            // Check if eraser circle intersects with shape

            // For rectangular shapes (Rect, Ellipse, Circle, etc.)

            const centerX = box.x + box.width / 2;

            const centerY = box.y + box.height / 2;

            const halfWidth = box.width / 2;

            const halfHeight = box.height / 2;

            // Calculate closest point on shape to eraser center

            const closestX = Math.max(box.x, Math.min(stagePoint.x, box.x + box.width));

            const closestY = Math.max(box.y, Math.min(stagePoint.y, box.y + box.height));

            const distX = stagePoint.x - closestX;

            const distY = stagePoint.y - closestY;

            const dist = Math.hypot(distX, distY);

            if (dist <= eraserRadius) {

              erasedElementsRef.current.add(elementId);

              removeElement(elementId);

            }

          }

        }

      }

      }

      return;

    }



    // If polyline tool: show preview of next segment

    if (tool === 'polyline' && polylineRef.current.length) {

      setDraftElement((prev) => ({

        ...(prev ?? {}),

        id: 'polyline-preview',

        type: 'polyline',

        layerId: activeLayerId,

        points: [...polylineRef.current, point.x, point.y],

        stroke: drawingSettings.strokeColor,

        strokeWidth: drawingSettings.strokeWidth,

        opacity: 1,

        draggable: false,

        rotation: 0,

        tension: 0,

        x: 0,

        y: 0,

      } as EditorElement));

    }



    if (!draftElement || !isDrawing) return;



    if (draftElement.type === 'free') {

      // add point locally (no store updates here)

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          points: appendPoint(prev.points, point, 0.5),

        };

      });

    } else if (draftElement.type === 'rectangle' && originRef.current) {

      const origin = originRef.current;

      const nextWidth = point.x - origin.x;

      const nextHeight = point.y - origin.y;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          x: nextWidth < 0 ? point.x : origin.x,

          y: nextHeight < 0 ? point.y : origin.y,

          width: Math.abs(nextWidth),

          height: Math.abs(nextHeight),

        };

      });

    } else if (draftElement.type === 'ellipse' && originRef.current) {

      const origin = originRef.current;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          radiusX: Math.abs(point.x - origin.x),

          radiusY: Math.abs(point.y - origin.y),

        };

      });

    } else if (draftElement.type === 'circle' && originRef.current) {

      const origin = originRef.current;

      const nextRadius = distance(point, origin);

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          radius: nextRadius,

        };

      });

    } else if (draftElement.type === 'arc' && originRef.current) {

      const origin = originRef.current;

      const nextRadius = distance(point, origin);

      const angleRad = Math.atan2(point.y - origin.y, point.x - origin.x);

      const angleDeg = (angleRad * 180) / Math.PI;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          radius: nextRadius,

          rotation: angleDeg - 90,

          startAngle: 0,

          endAngle: 180,

        };

      });

    } else if (draftElement.type === 'line' && originRef.current) {

      const origin = originRef.current;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          points: [origin.x, origin.y, point.x, point.y] as [number, number, number, number],

        };

      });

    } else if (draftElement.type === 'wall' && originRef.current) {

      const origin = originRef.current;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          points: [origin.x, origin.y, point.x, point.y],

        };

      });

    } else if (

      (draftElement.type === 'door' ||

        draftElement.type === 'window' ||

        draftElement.type === 'furniture') &&

      originRef.current

    ) {

      const origin = originRef.current;

      const nextWidth = point.x - origin.x;

      const nextHeight = point.y - origin.y;

      setDraftElement((prev) => {

        if (!prev) return prev;

        return {

          ...prev,

          x: nextWidth < 0 ? point.x : origin.x,

          y: nextHeight < 0 ? point.y : origin.y,

          width: Math.abs(nextWidth),

          height: Math.abs(nextHeight),

        };

      });

    } else if (draftElement.type === 'dimension') {

      setDraftElement((prev) => {

        if (!prev) return prev;

        const start = prev.startPoint ?? { x: 0, y: 0 };

        const len = distance(start, point);

        return {

          ...prev,

          endPoint: { x: point.x, y: point.y },

          value: len,

          text: `${len.toFixed(1)}px`,

        };

      });

    }

  };



  // Pointer up: finalize draft or end preview. update store pointer one last time.

  const handlePointerUp = (evt?: KonvaEventObject<PointerEvent>) => {

    const point = updatePointerFromEvent();

    schedulePointerUpdate(point);

    // Clean up eraser state

    if (tool === 'eraser' && isDrawing) {

      erasedElementsRef.current.clear();

      setIsDrawing(false);

      setEraserPosition(null);

      return;

    }

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

    } else if (

      draftElement.type === 'circle' &&

      draftElement.radius > 1

    ) {

      finalizeDraft();

    } else if (

      draftElement.type === 'arc' &&

      draftElement.radius > 1

    ) {

      finalizeDraft();

    } else if (draftElement.type === 'line') {

      const [x1, y1, x2, y2] = draftElement.points;

      const len = Math.hypot(x2 - x1, y2 - y1);

      if (len > 2) {

        finalizeDraft();

      } else {

        setDraftElement(null);

        originRef.current = null;

        setIsDrawing(false);

      }

    } else if (draftElement.type === 'wall') {

      const [x1, y1, x2, y2] = draftElement.points;

      const len = Math.hypot(x2 - x1, y2 - y1);

      if (len > 4) {

        finalizeDraft();

      } else {

        setDraftElement(null);

        originRef.current = null;

        setIsDrawing(false);

      }

    } else if (

      (draftElement.type === 'door' ||

        draftElement.type === 'window' ||

        draftElement.type === 'furniture') &&

      draftElement.width > 2 &&

      draftElement.height > 2

    ) {

      finalizeDraft();

    } else if (draftElement.type === 'dimension' && draftElement.value > 2) {

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



  // Wheel/zoom handling (unchanged)

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

    if ((evt.evt as TouchEvent).touches.length < 2) {

      touchPanRef.current.center = null;

      setIsTouchPanning(false);

    }

  };



  const modifyTools = new Set(['trim', 'extend', 'offset', 'fillet', 'chamfer']);

  const handleShapeSelect = (elementId: string, layer: Layer, evt: KonvaEventObject<PointerEvent>) => {

    if (layer.locked) return;

    if (tool === 'eraser') {

      removeElement(elementId);

        return;

    }

    if (modifyTools.has(tool)) {

      evt.cancelBubble = true;

      const element = elements.find((el) => el.id === elementId);

      const stagePoint = getRelativePointer(stageRef.current);

      if (!element || !stagePoint) return;

      if (tool === 'trim') {

        performTrim(element, stagePoint);

          return;

      }

      if (tool === 'extend') {

        performExtend(element, stagePoint);

        return;

      }

      if (tool === 'offset') {

        const offsetAmount = 20;

        const clone: EditorElement = JSON.parse(JSON.stringify(element));

        clone.id = nanoid();

        if ('x' in clone) clone.x = (clone.x ?? 0) + offsetAmount;

        if ('y' in clone) clone.y = (clone.y ?? 0) + offsetAmount;

        if ('points' in clone && Array.isArray(clone.points)) {

          clone.points = clone.points.map((value, index) =>

            index % 2 === 0 ? value + offsetAmount : value + offsetAmount,

          );

        }

        if ('startPoint' in clone && clone.startPoint) {

          clone.startPoint = {

            x: clone.startPoint.x + offsetAmount,

            y: clone.startPoint.y + offsetAmount,

          };

        }

        if ('endPoint' in clone && clone.endPoint) {

          clone.endPoint = {

            x: clone.endPoint.x + offsetAmount,

            y: clone.endPoint.y + offsetAmount,

          };

        }

        addElement(clone);

        return;

      }

      if (tool === 'fillet') {

        updateElement(elementId, { strokeWidth: (element.strokeWidth ?? 1) + 1 });

        return;

      }

      if (tool === 'chamfer') {

        updateElement(elementId, { rotation: (element.rotation ?? 0) + 5 });

        return;

      }

    }

    if (tool !== 'select') {

      evt.cancelBubble = true;

      return;

    }

    setSelectedElements([elementId]);

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

    } else if (element.type === 'circle') {

      const circleNode = node as Konva.Circle;

      updateElement(

        element.id,

        {

          x: circleNode.x(),

          y: circleNode.y(),

          radius: circleNode.radius() * circleNode.scaleX(),

          rotation: circleNode.rotation(),

        },

      );

      node.scaleX(1);

      node.scaleY(1);

    } else if (element.type === 'arc') {

      const arcNode = node as Konva.Arc;

      updateElement(

        element.id,

        {

          x: arcNode.x(),

          y: arcNode.y(),

          radius: arcNode.outerRadius() * arcNode.scaleX(),

          rotation: arcNode.rotation(),

          startAngle: arcNode.startAngle(),

          endAngle: arcNode.endAngle(),

        },

      );

      node.scaleX(1);

      node.scaleY(1);

    } else if (

      element.type === 'door' ||

      element.type === 'window' ||

      element.type === 'furniture'

    ) {

      const rectNode = node as Konva.Rect;

      const width = (rectNode.width() ?? 0) * rectNode.scaleX();

      const height = (rectNode.height() ?? 0) * rectNode.scaleY();

      updateElement(element.id, {

        x: rectNode.x(),

        y: rectNode.y(),

        width,

        height,

        rotation: rectNode.rotation(),

      });

      rectNode.scaleX(1);

      rectNode.scaleY(1);

    }

  };



  const visibleLayers = useMemo(() => layers.filter((layer) => layer.visible), [layers]);

  const performTrim = useCallback(
    (element: EditorElement, clickPoint: Pointer) => {
      const segment = elementToSegment(element);
      if (!segment) return false;
      const cutters = collectSegments(elements, element.id);
      if (!cutters.length) return false;
      const clickInfo = projectPointOnSegment(segment, clickPoint);
      const intersections = cutters
        .map((cutter) => {
          const point = intersectSegments(segment, cutter);
          if (!point) return null;
          const tInfo = projectPointOnSegment(segment, point);
          return { point, t: tInfo.t };
        })
        .filter((item): item is { point: Pointer; t: number } => Boolean(item));
      if (!intersections.length) return false;
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
      if (!nextSegment) return false;
      const patch = segmentToElementPatch(element, nextSegment);
      if (!patch) return false;
      updateElement(element.id, patch);
      return true;
    },
    [elements, updateElement],
  );

  const performExtend = useCallback(
    (element: EditorElement, clickPoint: Pointer) => {
      const segment = elementToSegment(element);
      if (!segment) return false;
      const cutters = collectSegments(elements, element.id);
      if (!cutters.length) return false;
      const clickInfo = projectPointOnSegment(segment, clickPoint);
      const extendEnd = clickInfo.t >= 0.5 ? 'end' : 'start';
      const workingSegment =
        extendEnd === 'end'
          ? segment
          : {
              A: segment.B,
              B: segment.A,
            };
      const extended = extendSegment(workingSegment, cutters, 4000);
      const finalSegment =
        extendEnd === 'end'
          ? extended
          : {
              A: extended.B,
              B: extended.A,
            };
      const patch = segmentToElementPatch(element, finalSegment);
      if (!patch) return false;
      updateElement(element.id, patch);
      return true;
    },
    [elements, updateElement],
  );

  // Drag and drop handlers for element library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!activeLayerId || !stageRef.current) {
      console.warn('Drop failed: no active layer or stage');
      return;
    }

    try {
      const templateData = e.dataTransfer.getData('application/json');
      if (!templateData) {
        console.warn('Drop failed: no template data');
        return;
      }

      const template: LibraryElementTemplate = JSON.parse(templateData);
      
      // Get drop position relative to the container
      const container = containerRef.current;
      if (!container) {
        console.warn('Drop failed: no container');
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const stage = stageRef.current;
      
      // Get mouse position relative to container
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      // Get stage container position
      const stageContainer = stage.container();
      const stageRect = stageContainer.getBoundingClientRect();
      
      // Calculate position relative to stage container
      const stageX = e.clientX - stageRect.left;
      const stageY = e.clientY - stageRect.top;
      
      // Convert to canvas coordinates using stage transform
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const canvasPoint = transform.point({ x: stageX, y: stageY });

      // Create element at drop position (centered on drop point)
      const element: EditorElement = {
        id: nanoid(),
        type: template.type,
        layerId: activeLayerId,
        x: canvasPoint.x - template.width / 2,
        y: canvasPoint.y - template.height / 2,
        width: template.width,
        height: template.height,
        stroke: drawingSettings.strokeColor,
        strokeWidth: drawingSettings.strokeWidth,
        fill: drawingSettings.fillColor,
        opacity: 1,
        draggable: true,
        rotation: 0,
        category: template.category,
      } as EditorElement;

      console.log('Adding element:', { 
        mousePos: { mouseX, mouseY },
        stagePos: { stageX, stageY },
        canvasPos: canvasPoint,
        element 
      });
      addElement(element);
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  };

  return (

    <div 
      ref={containerRef} 
      className={`relative h-full w-full transition ${
        isDragOver ? 'ring-2 ring-accent ring-offset-2' : ''
      }`}
      style={{
        transform: `rotate(${stageRotation}deg)`,
        transformOrigin: 'center center',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      <Stage

        ref={(node) => { stageRef.current = node; }}

        width={canvasSize.width}

        height={canvasSize.height}

        scaleX={stageScale}

        scaleY={stageScale}

        x={stagePosition.x}

        y={stagePosition.y}

        style={{

          backgroundColor: '#ffffff',

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

        {snapSettings.showGrid && (

          <GridBackground

            zoom={stageScale}

            offsetX={stagePosition.x}

            offsetY={stagePosition.y}

            gridSize={25}

            width={canvasSize.width}

            height={canvasSize.height}

            name="grid-layer"

            visible={snapSettings.showGrid}

          />

        )}

        {visibleLayers.map((layer) => (

          <KonvaLayer key={layer.id} listening={!layer.locked}>

            {elements

              .filter((element) => element.layerId === layer.id)

              .map((element) => {

                if (element.type === 'free' || element.type === 'polyline') {

                  return (

                    <Line

                      key={element.id}

                      id={element.id}

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

                if (element.type === 'line') {

                  return (

                    <Line

                      key={element.id}

                      id={element.id}

                      ref={(node) => {

                        shapeRefs.current[element.id] = node;

                      }}

                      points={element.points}

                      stroke={element.stroke}

                      strokeWidth={element.strokeWidth}

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

                if (element.type === 'wall') {
                  return (
                    <Line
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      points={element.points}
                      stroke={element.stroke}
                      strokeWidth={element.thickness ?? element.strokeWidth}
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

                      id={element.id}

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

                      id={element.id}

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

                if (element.type === 'circle') {

                  return (

                    <Circle

                      key={element.id}

                      id={element.id}

                      ref={(node) => {

                        shapeRefs.current[element.id] = node;

                      }}

                      x={element.x}

                      y={element.y}

                      radius={element.radius}

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

                if (element.type === 'arc') {

                  return (

                    <Arc

                      key={element.id}

                      id={element.id}

                      ref={(node) => {

                        shapeRefs.current[element.id] = node;

                      }}

                      x={element.x}

                      y={element.y}

                      innerRadius={0}

                      outerRadius={element.radius}

                      angle={element.endAngle - element.startAngle}

                      rotation={element.startAngle + element.rotation}

                      stroke={element.stroke}

                      strokeWidth={element.strokeWidth}

                      opacity={element.opacity}

                      draggable={!layer.locked && element.draggable && tool === 'select'}

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

                if (element.type === 'arc') {

                  return (

                    <Arc

                      key={element.id}

                      id={element.id}

                      ref={(node) => {

                        shapeRefs.current[element.id] = node;

                      }}

                      x={element.x}

                      y={element.y}

                      innerRadius={0}

                      outerRadius={element.radius}

                      angle={element.endAngle - element.startAngle}

                      rotation={element.startAngle + element.rotation}

                      stroke={element.stroke}

                      strokeWidth={element.strokeWidth}

                      opacity={element.opacity}

                      draggable={!layer.locked && element.draggable && tool === 'select'}

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



                if (element.type === 'door') {

                  return (

                    <React.Fragment key={element.id}>

                      <Rect

                        id={element.id}

                        ref={(node) => {

                          shapeRefs.current[element.id] = node;

                        }}

                        x={element.x}

                        y={element.y}

                        width={element.width}

                        height={element.height}

                        stroke={element.stroke}

                        strokeWidth={element.strokeWidth}

                        fill="rgba(0,0,0,0.04)"

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

                      <Line

                        points={[

                          element.x,

                          element.y + element.height,

                          element.x + element.width,

                          element.y + element.height,

                          element.x + element.width,

                          element.y,

                        ]}

                        stroke={element.stroke}

                        strokeWidth={element.strokeWidth}

                        lineCap="round"

                        lineJoin="round"

                        listening={false}

                      />

                    </React.Fragment>

                  );

                }

                if (element.type === 'window') {

                  return (
                    <Rect
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      fill="rgba(255,255,255,0.1)"
                      dash={[8, 4]}
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

                if (element.type === 'furniture') {
                  return renderFurnitureElement(
                    element,
                    layer,
                    tool,
                    handleShapeSelect,
                    (evt) => updateElement(element.id, { x: evt.target.x(), y: evt.target.y() }),
                    () => onTransformEnd(element),
                    shapeRefs
                  );
                }

                if (element.type === 'dimension') {

                  const start = element.startPoint ?? { x: 0, y: 0 };

                  const end = element.endPoint ?? { x: 0, y: 0 };

                  const midX = (start.x + end.x) / 2;

                  const midY = (start.y + end.y) / 2;

                  return (

                    <React.Fragment key={element.id}>

                      <Line

                        id={element.id}

                        ref={(node) => {

                          shapeRefs.current[element.id] = node;

                        }}

                        points={[start.x, start.y, end.x, end.y]}

                        stroke={element.stroke}

                        strokeWidth={element.strokeWidth}

                        lineCap="round"

                        lineJoin="round"

                        draggable={!layer.locked && element.draggable && tool === 'select'}

                        opacity={element.opacity}

                        onPointerDown={(evt) => handleShapeSelect(element.id, layer, evt)}

                        onDragEnd={(evt) =>

                          updateElement(element.id, {

                            x: evt.target.x(),

                            y: evt.target.y(),

                          })

                        }

                      />

                      <Text

                        x={midX + 6}

                        y={midY + 6}

                        text={element.text ?? `${element.value?.toFixed(1) ?? ''}`}

                        fontSize={12}

                        fill={element.stroke}

                        listening={false}

                      />

                    </React.Fragment>

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

            {draftElement.type === 'circle' ? (

              <Circle

                x={draftElement.x}

                y={draftElement.y}

                radius={draftElement.radius}

                stroke={draftElement.stroke}

                strokeWidth={draftElement.strokeWidth}

                fill={draftElement.fill}

                opacity={0.75}

              />

            ) : null}

            {draftElement.type === 'arc' ? (

              <Arc

                x={draftElement.x}

                y={draftElement.y}

                innerRadius={0}

                outerRadius={draftElement.radius}

                angle={draftElement.endAngle - draftElement.startAngle}

                rotation={draftElement.startAngle + draftElement.rotation}

                stroke={draftElement.stroke}

                strokeWidth={draftElement.strokeWidth}

                opacity={0.9}

              />

            ) : null}

            {draftElement.type === 'line' && (

              <Line

                points={draftElement.points}

                stroke={draftElement.stroke}

                strokeWidth={draftElement.strokeWidth}

                opacity={0.9}

                lineCap="round"

                lineJoin="round"

              />

            )}

            {draftElement.type === 'wall' && (

              <Line

                points={draftElement.points}

                stroke={draftElement.stroke}

                strokeWidth={draftElement.thickness ?? draftElement.strokeWidth}

                opacity={0.9}

                lineCap="round"

                lineJoin="round"

              />

            )}

            {draftElement.type === 'door' && (

              <>

                <Rect

                  x={draftElement.x}

                  y={draftElement.y}

                  width={draftElement.width}

                  height={draftElement.height}

                  stroke={draftElement.stroke}

                  strokeWidth={draftElement.strokeWidth}

                  fill="rgba(0,0,0,0.04)"

                  opacity={0.75}

                />

                <Line

                  points={[

                    draftElement.x,

                    draftElement.y + draftElement.height,

                    draftElement.x + draftElement.width,

                    draftElement.y + draftElement.height,

                    draftElement.x + draftElement.width,

                    draftElement.y,

                  ]}

                  stroke={draftElement.stroke}

                  strokeWidth={draftElement.strokeWidth}

                  opacity={0.9}

                  lineCap="round"

                  lineJoin="round"

                />

              </>

            )}

            {draftElement.type === 'window' && (

              <Rect

                x={draftElement.x}

                y={draftElement.y}

                width={draftElement.width}

                height={draftElement.height}

                stroke={draftElement.stroke}

                strokeWidth={draftElement.strokeWidth}

                dash={[8, 4]}

                fill="rgba(255,255,255,0.1)"

                opacity={0.75}

              />

            )}

            {draftElement.type === 'furniture' && (

              <Rect

                x={draftElement.x}

                y={draftElement.y}

                width={draftElement.width}

                height={draftElement.height}

                stroke="#6366f1"

                strokeWidth={draftElement.strokeWidth}

                fill="rgba(99, 102, 241, 0.15)"

                cornerRadius={8}

                opacity={0.75}

              />

            )}

            {draftElement.type === 'dimension' && (

              <>

                <Line

                  points={[

                    draftElement.startPoint?.x ?? 0,

                    draftElement.startPoint?.y ?? 0,

                    draftElement.endPoint?.x ?? 0,

                    draftElement.endPoint?.y ?? 0,

                  ]}

                  stroke={draftElement.stroke}

                  strokeWidth={draftElement.strokeWidth}

                  opacity={0.9}

                  lineCap="round"

                  lineJoin="round"

                />

                <Text

                  x={((draftElement.startPoint?.x ?? 0) + (draftElement.endPoint?.x ?? 0)) / 2 + 6}

                  y={((draftElement.startPoint?.y ?? 0) + (draftElement.endPoint?.y ?? 0)) / 2 + 6}

                  text={draftElement.text ?? `${draftElement.value?.toFixed(1) ?? ''}`}

                  fontSize={12}

                  fill={draftElement.stroke}

                />

              </>

            )}

          </KonvaLayer>

        )}

        {/* Eraser visual indicator - Pencil icon */}
        {tool === 'eraser' && eraserPosition && (
          <KonvaLayer listening={false}>
            {/* Pencil body - rotated rectangle */}
            <Rect
              x={eraserPosition.x}
              y={eraserPosition.y}
              width={20}
              height={3}
              fill="#ff4444"
              stroke="#cc0000"
              strokeWidth={0.8}
              rotation={-45}
              offsetX={10}
              offsetY={1.5}
              opacity={0.95}
            />
            {/* Pencil tip - triangle pointing down-right */}
            <Line
              points={[
                eraserPosition.x + 7, eraserPosition.y - 7,
                eraserPosition.x + 12, eraserPosition.y - 2,
                eraserPosition.x + 7, eraserPosition.y + 3
              ]}
              fill="#ff6666"
              stroke="#cc0000"
              strokeWidth={0.8}
              closed
              opacity={0.95}
            />
            {/* Eraser area indicator (subtle circle) */}
            <Circle
              x={eraserPosition.x}
              y={eraserPosition.y}
              radius={15}
              stroke="#ff4444"
              strokeWidth={1}
              fill="rgba(255, 68, 68, 0.05)"
              dash={[4, 4]}
              opacity={0.4}
            />
          </KonvaLayer>
        )}

        <KonvaLayer listening={false}>

          <Transformer

            ref={(node) => { transformerRef.current = node; }}

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
