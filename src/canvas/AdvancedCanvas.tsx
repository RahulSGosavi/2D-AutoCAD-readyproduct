// src/canvas/AdvancedCanvas.tsx
// This is a comprehensive AutoCAD-style canvas with all features
// Integrated with complete drawing tools from FloorCanvas

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer as KonvaLayer, Line, Rect, Circle, Arc, Ellipse, Text, Transformer, Group, Image } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { nanoid } from 'nanoid';
import { useEditorStore, type EditorElement, type WallElement, type DoorElement, type WindowElement, type FurnitureElement, type FloorPlanPage, lineTypeToDash } from '../state/useEditorStore';
import type { FurnitureSection } from '../types/catalog';
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';
import { usePerformanceTelemetry } from '../hooks/usePerformanceTelemetry';
import { AutoCADRulers } from './AutoCADRulers';
import { SelectionWindow } from './SelectionWindow';
import { SmartGuides } from './SmartGuides';
import { SnappingEngine } from '../engine/snapping-engine';
import GridBackground from './GridBackground';
import { appendPoint, simplifyPoints } from '../utils/smoothing';
import { calculateMeasure, formatMeasureText } from '../utils/measure-tool';
import { moveElements, rotateElements, offsetElement, trimElement, extendElement, filletElements, chamferElements } from '../tools/modify-tools-complete';
import { createWallElement } from '../tools/wall-tools';
import { createDoorElement, createWindowElement, createFurnitureElement } from '../tools/block-tools';
import { BLOCKS_BY_ID } from '../data/blockCatalog';
import type { BlockDefinition } from '../data/blockCatalog';
import { useCatalogStore } from '../state/useCatalogStore';
import { ContextMenu } from '../components/modern/ContextMenu';

// PDF Background Layer Component
const PDFBackgroundLayer: React.FC<{
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}> = ({ imageData, x, y, width, height, opacity }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setImageError(false);
    };
    img.onerror = () => {
      console.error('Failed to load PDF image');
      setImageError(true);
    };
    img.src = imageData;
  }, [imageData]);

  // Debug logging - must be before conditional returns
  useEffect(() => {
    if (image && !imageError) {
      console.log('PDF Image loaded:', {
        imageWidth: image.width,
        imageHeight: image.height,
        displayWidth: width,
        displayHeight: height,
        x,
        y,
        opacity,
      });
    }
  }, [image, imageError, width, height, x, y, opacity]);

  // Conditional returns must come after all hooks
  if (imageError) {
    return null;
  }

  if (!image) {
    return null;
  }

  return (
    <KonvaLayer name="pdf-background-layer" listening={false} imageSmoothingEnabled={true}>
      <Image
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        listening={false}
        imageSmoothingEnabled={true}
        perfectDrawEnabled={false}
      />
    </KonvaLayer>
  );
};
import { createTextElement } from '../tools/text-tools';

type Pointer = { x: number; y: number };

const radiansToDegrees = (rad: number) => (rad * 180) / Math.PI;

const projectPointOntoSegment = (point: Pointer, start: Pointer, end: Pointer) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy || 1;
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
  const distance = Math.hypot(point.x - projection.x, point.y - projection.y);
  return { point: projection, t, distance };
};

const getWallAngleDeg = (wall: WallElement) => {
  if (!wall.points || wall.points.length < 4) return 0;
  const dx = wall.points[2] - wall.points[0];
  const dy = wall.points[3] - wall.points[1];
  return radiansToDegrees(Math.atan2(dy, dx));
};

// Render furniture element with visual design based on category
const renderCatalogBlockShapes = (
  element: FurnitureElement,
  blockDefinition: BlockDefinition | undefined,
  groupProps: any,
  shapeRefs: React.MutableRefObject<Record<string, Konva.Node | null>>,
) => {
  if (!blockDefinition) return null;
  const width = element.width;
  const height = element.height;
  const minDim = Math.min(width, height);
  const baseStroke = element.stroke || '#0f172a';
  const baseFill = element.fill && element.fill !== 'none' ? element.fill : 'transparent';
  const detailStroke = '#475569';
  const detailFill = 'rgba(148,163,184,0.35)';

  const resolveStroke = (token?: string) => {
    if (!token || token === 'base') return baseStroke;
    if (token === 'detail') return detailStroke;
    return token;
  };

  const resolveFill = (token?: string) => {
    if (!token || token === 'base') return baseFill;
    if (token === 'detail') return detailFill;
    return token;
  };

  return (
    <Group
      key={element.id}
      id={element.id}
      ref={(node) => {
        shapeRefs.current[element.id] = node;
      }}
      {...groupProps}
    >
      <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
      {blockDefinition.planSymbols.map((shape, index) => {
        if (shape.kind === 'rect') {
          return (
            <Rect
              key={index}
              x={shape.x * width}
              y={shape.y * height}
              width={shape.width * width}
              height={shape.height * height}
              cornerRadius={(shape.cornerRadius ?? 0) * minDim}
              stroke={resolveStroke(shape.stroke)}
              strokeWidth={(shape.strokeWidth ?? 1) * 1.5}
              dash={shape.dash?.map((d) => d * minDim)}
              fill={resolveFill(shape.fill)}
              listening={false}
            />
          );
        }
        if (shape.kind === 'line') {
          return (
            <Line
              key={index}
              points={[
                shape.points[0] * width,
                shape.points[1] * height,
                shape.points[2] * width,
                shape.points[3] * height,
              ]}
              stroke={resolveStroke(shape.stroke)}
              strokeWidth={(shape.strokeWidth ?? 1) * 1.4}
              dash={shape.dash?.map((d) => d * minDim)}
              listening={false}
            />
          );
        }
        if (shape.kind === 'circle') {
          return (
            <Circle
              key={index}
              x={shape.x * width}
              y={shape.y * height}
              radius={shape.radius * minDim}
              stroke={resolveStroke(shape.stroke)}
              strokeWidth={(shape.strokeWidth ?? 1) * 1.3}
              fill={resolveFill(shape.fill)}
              dash={shape.dash?.map((d) => d * minDim)}
              listening={false}
            />
          );
        }
        return null;
      })}
    </Group>
  );
};

const renderFurnitureElement = (
  element: EditorElement,
  layer: any,
  tool: string,
  selectedElementIds: string[],
  setSelectedElements: (ids: string[]) => void,
  updateElement: (id: string, updates: Partial<EditorElement>) => void,
  shapeRefs: React.MutableRefObject<Record<string, Konva.Node | null>>,
  onTransformEnd: (element: EditorElement) => void,
  isSelectingRef?: React.MutableRefObject<boolean>,
  setSelectionWindow?: (window: any) => void,
  selectionStartRef?: React.MutableRefObject<{ x: number; y: number } | null>,
  stageRef?: React.MutableRefObject<Konva.Stage | null>,
  catalogById?: Record<string, BlockDefinition>
) => {
  if (element.type !== 'furniture') return null;
  
  const furnitureElement = element as any; // FurnitureElement
  let category = (furnitureElement.category || '').toLowerCase().trim();
  const width = furnitureElement.width;
  const height = furnitureElement.height;
  
  // Debug: Uncomment to see what category elements have
  // if (!category || category === 'furniture') {
  //   console.log('Element category issue:', { 
  //     id: element.id, 
  //     category: furnitureElement.category, 
  //     element: furnitureElement 
  //   });
  // }
  
  const groupProps = {
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    scaleX: (element as any).scaleX || 1,
    scaleY: (element as any).scaleY || 1,
    draggable: !layer.locked && tool === 'select',
    onPointerDown: (evt: KonvaEventObject<PointerEvent>) => {
      if (tool === 'select' && !layer.locked) {
        evt.cancelBubble = true;
        evt.evt.stopPropagation();
        
        // Cancel any ongoing selection window
        if (isSelectingRef?.current !== undefined) {
          isSelectingRef.current = false;
        }
        if (setSelectionWindow) {
          setSelectionWindow(null);
        }
        if (selectionStartRef?.current !== undefined) {
          selectionStartRef.current = null;
        }
        
        // Handle multi-selection with Shift key
        if (evt.evt.shiftKey) {
          // Toggle selection
          if (selectedElementIds.includes(element.id)) {
            setSelectedElements(selectedElementIds.filter(id => id !== element.id));
          } else {
            setSelectedElements([...selectedElementIds, element.id]);
          }
        } else {
          // Single selection
          setSelectedElements([element.id]);
        }
      }
    },
    listening: tool === 'select' || tool === 'pan' || tool === 'erase' || ['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool),
    onDragStart: (evt: KonvaEventObject<DragEvent>) => {
      // Prevent stage from being dragged when dragging furniture
      const stage = stageRef?.current;
      if (stage) {
        stage.setAttrs({ draggable: false });
      }
      evt.evt.stopPropagation();
    },
    onDragEnd: (evt: KonvaEventObject<DragEvent>) => {
      const node = evt.target;
      updateElement(element.id, {
        x: node.x(),
        y: node.y(),
      });
      // Ensure stage stays non-draggable after drag
      const stage = stageRef?.current;
      if (stage && tool === 'select') {
        stage.setAttrs({ draggable: false });
      }
      // Stop propagation to prevent stage from updating its transform
      evt.evt.stopPropagation();
      evt.cancelBubble = true;
    },
    onTransformEnd: () => {
      onTransformEnd(element);
      // Ensure stage stays non-draggable after transform
      const stage = stageRef?.current;
      if (stage && tool === 'select') {
        stage.setAttrs({ draggable: false });
      }
    },
  };

  // Use element's stroke color, or default to black if not set
  const elementDash = (element as any).dash !== undefined ? (element as any).dash : [];
  const baseShapeProps = {
    stroke: element.stroke || '#000000',
    strokeWidth: element.strokeWidth || 1.5,
    opacity: element.opacity || 1,
    dash: elementDash,
  };

  // Calculate detail sizes based on element dimensions
  const detailSize = Math.min(width, height) * 0.12;
  const strokeDetail = Math.max(0.8, (element.strokeWidth || 1.5) * 0.6); // Thinner lines for details

  // Common props for detail elements (non-interactive) - use element's stroke color
  const detailProps = {
    stroke: element.stroke || '#000000',
    strokeWidth: strokeDetail,
    opacity: element.opacity || 1,
    dash: elementDash,
    listening: false,
  };

  const blockKey = (element as FurnitureElement).blockId || ((element as any).metadata?.blockId as string | undefined);
  const blockDefinition = blockKey ? catalogById?.[blockKey] || BLOCKS_BY_ID[blockKey] : undefined;
  if (blockDefinition) {
    return renderCatalogBlockShapes(element as FurnitureElement, blockDefinition, groupProps, shapeRefs);
  }

  // Bed - AutoCAD Style (rectangle with headboard and footboard)
  if (category.includes('bed')) {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Headboard - thicker line */}
        <Line points={[0, height * 0.1, width, height * 0.1]} stroke={element.stroke || '#000000'} strokeWidth={(element.strokeWidth || 1.5) * 1.5} opacity={element.opacity || 1} listening={false} />
        {/* Footboard */}
        <Line points={[0, height * 0.9, width, height * 0.9]} stroke={element.stroke || '#000000'} strokeWidth={(element.strokeWidth || 1.5) * 1.5} opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Sofa - AutoCAD Style (rectangle with cushion divisions)
  if (category.includes('sofa')) {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Cushion divisions - AutoCAD style */}
        <Line points={[width * 0.33, 0, width * 0.33, height]} {...detailProps} />
        <Line points={[width * 0.67, 0, width * 0.67, height]} {...detailProps} />
      </Group>
    );
  }

  // Table - AutoCAD Style (simple shape, no details)
  if (category.includes('table')) {
    const isRound = category.includes('round');
    if (isRound) {
      return (
        <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
          {/* Transparent hit area for easy selection */}
          <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
          <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) / 2} {...baseShapeProps} />
        </Group>
      );
    } else {
      return (
        <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
          {/* Transparent hit area for easy selection */}
          <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
          <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        </Group>
      );
    }
  }

  // Wardrobe - AutoCAD Style (rectangle with door, shelves, and handles)
  if (category.includes('wardrobe')) {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Door division */}
        <Line points={[width / 2, 0, width / 2, height]} stroke={element.stroke || '#000000'} strokeWidth={strokeDetail * 1.2} opacity={element.opacity || 1} listening={false} />
        {/* Shelf lines */}
        <Line points={[0, height * 0.33, width, height * 0.33]} {...detailProps} />
        <Line points={[0, height * 0.67, width, height * 0.67]} {...detailProps} />
        {/* Handles */}
        <Circle x={width * 0.2} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />
        <Circle x={width * 0.8} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // TV Unit - AutoCAD Style (rectangle with TV screen indicator)
  if (category.includes('tv') || category === 'tv-unit' || category === 'tvUnit') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* TV screen - inner rectangle */}
        <Rect x={width * 0.1} y={height * 0.15} width={width * 0.8} height={height * 0.6} {...detailProps} />
        {/* Stand/base */}
        <Rect x={width * 0.3} y={height * 0.75} width={width * 0.4} height={height * 0.2} {...detailProps} />
      </Group>
    );
  }

  // Sink - AutoCAD Style (rectangle with faucet and basin)
  if (category.includes('sink') || category.includes('wash-basin') || category.includes('sink-unit') || category === 'wash-basin') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Basin - inner rounded rectangle */}
        <Rect x={width * 0.15} y={height * 0.2} width={width * 0.7} height={height * 0.6} cornerRadius={height * 0.15} {...detailProps} />
        {/* Faucet - AutoCAD style circle with line */}
        <Circle x={width / 2} y={height * 0.2} radius={detailSize * 0.6} {...detailProps} />
        <Line points={[width / 2, height * 0.2, width / 2, height * 0.05]} stroke={element.stroke || '#000000'} strokeWidth={strokeDetail * 1.2} opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Stove/Hob - AutoCAD Style (rectangle with 4 burners)
  if (category.includes('stove') || category.includes('hob') || category === 'hob-unit' || category === 'hobUnit') {
    const burnerRadius = Math.max(6, detailSize * 0.8);
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* 4 burners - AutoCAD style */}
        <Circle x={width * 0.25} y={height * 0.35} radius={burnerRadius} {...detailProps} />
        <Circle x={width * 0.75} y={height * 0.35} radius={burnerRadius} {...detailProps} />
        <Circle x={width * 0.25} y={height * 0.65} radius={burnerRadius} {...detailProps} />
        <Circle x={width * 0.75} y={height * 0.65} radius={burnerRadius} {...detailProps} />
        {/* Control panel line */}
        <Line points={[0, height * 0.15, width, height * 0.15]} {...detailProps} />
      </Group>
    );
  }

  // Refrigerator/Fridge - AutoCAD Style (rectangle with door division and handles)
  if (category.includes('fridge') || category.includes('refrigerator') || category === 'refrigerator') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Door division line */}
        <Line points={[width / 2, 0, width / 2, height]} stroke={element.stroke || '#000000'} strokeWidth={strokeDetail * 1.2} opacity={element.opacity || 1} listening={false} />
        {/* Handles - small circles */}
        <Circle x={width * 0.2} y={height * 0.15} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />
        <Circle x={width * 0.8} y={height * 0.15} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Cabinet - AutoCAD Style (rectangle with door divisions and handles)
  if (category.includes('cabinet') || category === 'base-cabinet' || category === 'wall-cabinet' || element.moduleClass) {
    const sections = element.sections && element.sections.length > 0 ? element.sections : null;
    const finishFill = element.finish?.front || element.fill || 'transparent';
    const toeKickHeight = element.cabinet?.toeKick ? Math.max(4, height * 0.08) : 0;
    let cumulativeX = 0;

    const sectionGraphics = sections
      ? sections.flatMap((section, index) => {
          const ratio = Math.max(section.widthRatio ?? 1 / sections.length, 0.05);
          const sectionWidth = width * ratio;
          const startX = cumulativeX;
          cumulativeX += sectionWidth;
          const elementsArray: React.ReactNode[] = [];

          if (index < sections.length - 1) {
            elementsArray.push(
              <Line
                key={`${element.id}-divider-${index}`}
                points={[startX + sectionWidth, 0, startX + sectionWidth, height]}
                {...detailProps}
              />,
            );
          }

          if (section.type === 'drawer') {
            const drawers = Math.max(section.drawerCount ?? 3, 1);
            for (let i = 1; i < drawers; i++) {
              elementsArray.push(
                <Line
                  key={`${element.id}-drawer-${index}-${i}`}
                  points={[startX, (height / drawers) * i, startX + sectionWidth, (height / drawers) * i]}
                  {...detailProps}
                />,
              );
            }
          }

          if (section.type === 'door') {
            const handleX = section.swing === 'right' ? startX + sectionWidth * 0.15 : startX + sectionWidth * 0.85;
            elementsArray.push(
              <Circle key={`${element.id}-handle-${index}`} x={handleX} y={height / 2} radius={detailSize * 0.3} fill={element.stroke || '#000000'} opacity={element.opacity || 1} listening={false} />,
            );
          }

          if (section.type === 'open') {
            elementsArray.push(
              <Rect
                key={`${element.id}-open-${index}`}
                x={startX + detailSize * 0.3}
                y={detailSize * 0.3}
                width={sectionWidth - detailSize * 0.6}
                height={height - detailSize * 0.6}
                strokeDash={[6, 4]}
                {...detailProps}
              />,
            );
          }

          return elementsArray;
        })
      : [
          <Line key={`${element.id}-cabinet-default-1`} points={[width * 0.33, 0, width * 0.33, height]} {...detailProps} />,
          <Line key={`${element.id}-cabinet-default-2`} points={[width * 0.67, 0, width * 0.67, height]} {...detailProps} />,
          <Circle key={`${element.id}-cabinet-handle-1`} x={width * 0.15} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />,
          <Circle key={`${element.id}-cabinet-handle-2`} x={width * 0.5} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />,
          <Circle key={`${element.id}-cabinet-handle-3`} x={width * 0.85} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />,
        ];

    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} fill={finishFill} />
        {sectionGraphics}
        {toeKickHeight > 0 && (
          <Rect
            x={0}
            y={height - toeKickHeight}
            width={width}
            height={toeKickHeight}
            fill={element.finish?.carcass || '#94a3b8'}
            opacity={(element.opacity || 1) * 0.8}
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Toilet/WC - AutoCAD Style (standard toilet symbol)
  if (category.includes('toilet') || category === 'wc') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        {/* Bowl (bottom ellipse) - AutoCAD style */}
        <Ellipse 
          x={width / 2} 
          y={height * 0.7} 
          radiusX={width * 0.35} 
          radiusY={height * 0.15} 
          stroke={element.stroke || '#000000'} 
          strokeWidth={element.strokeWidth || 1.5} 
          opacity={element.opacity || 1} 
          listening={false} 
        />
        {/* Tank (top rectangle) - AutoCAD style */}
        <Rect 
          x={width * 0.25} 
          y={0} 
          width={width * 0.5} 
          height={height * 0.35} 
          stroke={element.stroke || '#000000'} 
          strokeWidth={element.strokeWidth || 1.5} 
          opacity={element.opacity || 1} 
          listening={false} 
        />
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
      </Group>
    );
  }

  // Shower - AutoCAD Style (rectangle with drain symbol)
  if (category.includes('shower') || category === 'shower-panel' || category === 'showerPanel') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Drain symbol - AutoCAD style cross */}
        <Circle x={width / 2} y={height / 2} radius={detailSize * 0.4} {...detailProps} />
        <Line points={[width / 2, height * 0.3, width / 2, height * 0.7]} {...detailProps} />
        <Line points={[width * 0.3, height / 2, width * 0.7, height / 2]} {...detailProps} />
      </Group>
    );
  }

  // Bathtub - AutoCAD Style (rounded rectangle)
  if (category.includes('tub') || category.includes('bathroom-tub')) {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} cornerRadius={height * 0.2} {...baseShapeProps} />
      </Group>
    );
  }

  // Dishwasher - AutoCAD Style (rectangle with door panel and handle)
  if (category.includes('dishwasher')) {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Door panel - inner rectangle */}
        <Rect x={width * 0.1} y={height * 0.15} width={width * 0.8} height={height * 0.7} {...detailProps} />
        {/* Handle */}
        <Line points={[width * 0.85, height * 0.2, width * 0.85, height * 0.8]} stroke={element.stroke || '#000000'} strokeWidth={strokeDetail * 1.5} opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Floor Drain - AutoCAD Style (circle with cross)
  if (category.includes('drain') && !category.includes('pipe') || category === 'floor-drain') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) / 2} {...baseShapeProps} />
        {/* Cross lines - AutoCAD drain symbol */}
        <Line points={[width / 2, 0, width / 2, height]} {...detailProps} />
        <Line points={[0, height / 2, width, height / 2]} {...detailProps} />
      </Group>
    );
  }

  // Microwave - AutoCAD Style (rectangle with door and control panel)
  if (category.includes('microwave') || category === 'microwave') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        <Rect x={0} y={0} width={width} height={height} {...baseShapeProps} />
        {/* Door - inner rectangle */}
        <Rect x={width * 0.1} y={height * 0.1} width={width * 0.8} height={height * 0.7} {...detailProps} />
        {/* Control panel */}
        <Rect x={width * 0.2} y={height * 0.8} width={width * 0.6} height={height * 0.15} {...detailProps} />
        {/* Handle */}
        <Circle x={width * 0.9} y={height / 2} radius={detailSize * 0.3} fill="#000000" opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Electrical/Plumbing points - AutoCAD Style (transparent circle with outline)
  if (category.includes('socket') || category.includes('point') || category.includes('line') || category.includes('pipe') || 
      category === 'power-socket' || category === 'light-point' || category === 'fan-point' || category === 'ac-point' ||
      category === 'hot-water-line' || category === 'cold-water-line' || category === 'drain-pipe' || category === 'switchboard') {
    return (
      <Group key={element.id} id={element.id} ref={(node) => { shapeRefs.current[element.id] = node; }} {...groupProps}>
        {/* Transparent hit area for easy selection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" listening={true} />
        {/* AutoCAD style - transparent circle with black outline */}
        <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) / 2} opacity={element.opacity || 1} stroke={element.stroke || '#000000'} strokeWidth={element.strokeWidth || 1.5} listening={false} />
        <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) / 3} stroke={element.stroke || '#000000'} strokeWidth={strokeDetail} opacity={element.opacity || 1} listening={false} />
      </Group>
    );
  }

  // Default: AutoCAD Style - simple rectangle (no fill, black outline)
  // If we reach here, the category didn't match any specific furniture type
  // Log it for debugging (uncomment to debug)
  // if (category && category !== 'furniture') {
  //   console.warn('Unmatched furniture category:', category, 'for element:', element.id);
  // }
  
  return (
      <Rect
      key={element.id}
      id={element.id}
      ref={(node) => { shapeRefs.current[element.id] = node; }}
      x={element.x}
      y={element.y}
      width={width}
      height={height}
      {...baseShapeProps}
      rotation={element.rotation}
      draggable={!layer.locked && tool === 'select'}
      onPointerDown={(evt: KonvaEventObject<PointerEvent>) => {
        if (tool === 'select' && !layer.locked) {
          evt.cancelBubble = true;
          setSelectedElements([element.id]);
        }
      }}
      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 0 : -1}
      perfectDrawEnabled={false}
      onDragEnd={(evt: KonvaEventObject<DragEvent>) => {
        const node = evt.target;
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
        });
      }}
      onTransformEnd={() => {
        onTransformEnd(element);
      }}
    />
  );
};

export const AdvancedCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const snappingEngineRef = useRef<SnappingEngine | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSelectingRef = useRef<boolean>(false);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickElementRef = useRef<string | null>(null);
  const draftUpdateRafRef = useRef<number | null>(null);
  const lastDraftUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const originRef = useRef<Pointer | null>(null);
  const polylineRef = useRef<number[]>([]);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node | null>>({});

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [draftElement, setDraftElement] = useState<EditorElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const eraserPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const erasedElementsRef = useRef<Set<string>>(new Set()); // Track already erased elements in current stroke
  const [selectionWindow, setSelectionWindow] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isLeftToRight: boolean;
  } | null>(null);
  const [smartGuides] = useState<Array<{ type: 'horizontal' | 'vertical'; position: number }>>([]);
  const [snapPoint, setSnapPoint] = useState<{ x: number; y: number } | null>(null);
  const [measureStart, setMeasureStart] = useState<Pointer | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Pointer | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateCenter, setRotateCenter] = useState<Pointer | null>(null);
  const [modifyTarget, setModifyTarget] = useState<EditorElement | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const textInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const textMeasureRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  const {
    tool,
    stageScale,
    stagePosition,
    setStageTransform,
    setPointer,
    pointer,
    elements,
    selectedElementIds,
    setSelectedElements,
    snapSettings,
    activeLayerId,
    layers,
    setStageInstance,
    drawingSettings,
    addElement,
    updateElement,
    removeElement,
    pdfBackground,
    setActiveLayer,
    // Multi-page floor plan
    floorPlanPages,
    currentFloorPlanPageId,
    autoSaveEnabled,
    lastAutoSave,
    addFloorPlanPage,
    removeFloorPlanPage,
    setCurrentFloorPlanPage,
    renameFloorPlanPage,
    saveCurrentPageElements,
    setAutoSaveEnabled,
  } = useEditorStore();
  const catalogById = useCatalogStore((state) => state.byId);
  const catalogStatus = useCatalogStore((state) => state.status);
  const loadCatalog = useCatalogStore((state) => state.loadBlocks);
  useEffect(() => {
    if (catalogStatus === 'idle') {
      loadCatalog();
    }
  }, [catalogStatus, loadCatalog]);
  const { presence } = useRealtimeCollaboration('default-session');
  usePerformanceTelemetry();

  // Ensure activeLayerId is set - if not, use first visible layer or create one
  useEffect(() => {
    if (layers.length === 0) {
      console.error('No layers available! Creating default layer...');
      // This shouldn't happen if loadFromProjectData works correctly, but as a safety net:
      const { addLayer } = useEditorStore.getState();
      addLayer();
      return;
    }
    
    if (!activeLayerId || !layers.find(l => l.id === activeLayerId)) {
      console.warn('Active layer not found, fixing...', { activeLayerId, availableLayers: layers.map(l => l.id) });
      const firstVisibleLayer = layers.find(l => l.visible && !l.locked);
      if (firstVisibleLayer) {
        console.log('Auto-setting active layer:', firstVisibleLayer.id);
        setActiveLayer(firstVisibleLayer.id);
      } else if (layers.length > 0) {
        console.log('Auto-setting active layer to first layer:', layers[0].id);
        setActiveLayer(layers[0].id);
      }
    }
  }, [activeLayerId, layers, setActiveLayer]);

  // Debug: Log tool changes
  useEffect(() => {
    console.log('Tool changed to:', tool);
  }, [tool]);

  // Debug: Log canvas size
  useEffect(() => {
    console.log('Canvas size:', canvasSize);
  }, [canvasSize]);

  // Auto-save effect - save current page elements every 5 seconds when enabled
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const autoSaveInterval = setInterval(() => {
      if (elements.length > 0) {
        saveCurrentPageElements();
      }
    }, 5000); // Auto-save every 5 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, elements.length, saveCurrentPageElements]);

  // State for editing page name
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');

  // Helper to add PDF page number to elements when PDF is loaded
  const addElementWithPage = useCallback((element: EditorElement) => {
    const elementWithPage = {
      ...element,
      pdfPageNumber: pdfBackground && pdfBackground.visible ? pdfBackground.currentPage : undefined,
    };
    addElement(elementWithPage);
  }, [addElement, pdfBackground]);

  // Helper to get pointer position in stage coordinates
  const getStagePointer = (evt: KonvaEventObject<PointerEvent>): Pointer | null => {
    const stage = evt.target.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePoint = transform.point(pos);
    return { x: stagePoint.x, y: stagePoint.y };
  };

  // Helper: Distance from point to line segment
  const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };

  // Helper: Get bounding box for any element
  const getElementBounds = (element: EditorElement): { left: number; top: number; right: number; bottom: number } | null => {
    if (element.type === 'rectangle') {
      const rect = element as any;
      return {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
      };
    } else if (element.type === 'circle') {
      const circle = element as any;
      return {
        left: circle.x - circle.radius,
        top: circle.y - circle.radius,
        right: circle.x + circle.radius,
        bottom: circle.y + circle.radius,
      };
    } else if (element.type === 'ellipse') {
      const ellipse = element as any;
      return {
        left: ellipse.x - ellipse.radiusX,
        top: ellipse.y - ellipse.radiusY,
        right: ellipse.x + ellipse.radiusX,
        bottom: ellipse.y + ellipse.radiusY,
      };
    } else if (element.type === 'line' || element.type === 'polyline' || element.type === 'free') {
      const points = element.points || [];
      if (points.length < 2) return null;
      let minX = points[0] + (element.x || 0);
      let minY = points[1] + (element.y || 0);
      let maxX = minX;
      let maxY = minY;
      for (let i = 0; i < points.length; i += 2) {
        const x = points[i] + (element.x || 0);
        const y = points[i + 1] + (element.y || 0);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      return { left: minX, top: minY, right: maxX, bottom: maxY };
    }
    return null;
  };

  const alignDoorWindowToWall = useCallback((point: Pointer) => {
    const walls = elements.filter((el): el is WallElement => el.type === 'wall' && Array.isArray(el.points) && el.points.length >= 4);
    let bestPoint = point;
    let bestRotation: number | undefined;
    let bestWallId: string | undefined;
    let bestDistance = 60; // px tolerance

    walls.forEach((wall) => {
      const wallStart = { x: wall.points[0], y: wall.points[1] };
      const wallEnd = { x: wall.points[2], y: wall.points[3] };
      const projection = projectPointOntoSegment(point, wallStart, wallEnd);
      if (projection.distance < bestDistance) {
        bestDistance = projection.distance;
        bestPoint = projection.point;
        bestRotation = getWallAngleDeg(wall);
        bestWallId = wall.id;
      }
    });

    return { point: bestPoint, rotation: bestRotation, wallId: bestWallId };
  }, [elements]);

  const splitWallAtPoint = useCallback((wall: WallElement, point: Pointer) => {
    if (!wall.points || wall.points.length < 4) return false;
    const [x1, y1, x2, y2] = wall.points;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;

    let t = ((point.x - x1) * dx + (point.y - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    if (t <= 0.05 || t >= 0.95) {
      return false; // avoid extremely small segments
    }

    const splitPoint = {
      x: x1 + t * dx,
      y: y1 + t * dy,
    };

    const applyWallStyle = (base: WallElement): WallElement => ({
      ...base,
      stroke: wall.stroke,
      strokeWidth: wall.strokeWidth,
      opacity: wall.opacity,
      dash: (wall as any).dash !== undefined ? (wall as any).dash : (base as any).dash,
      fill: (wall as any).fill !== undefined ? (wall as any).fill : (base as any).fill,
    });

    removeElement(wall.id);
    const firstWall = createWallElement({ x: x1, y: y1 }, splitPoint, wall.thickness || 20, wall.layerId);
    const secondWall = createWallElement(splitPoint, { x: x2, y: y2 }, wall.thickness || 20, wall.layerId);
    addElementWithPage(applyWallStyle(firstWall));
    addElementWithPage(applyWallStyle(secondWall));
    return true;
  }, [addElementWithPage, removeElement]);

  // Split line at intersection points with eraser path
  const splitLineAtIntersections = useCallback((
    element: EditorElement,
    pathStart: { x: number; y: number },
    pathEnd: { x: number; y: number },
    eraserRadius: number
  ): Array<number[]> => {
    const elementAny = element as any;
    const points = elementAny.points || [];
    if (points.length < 4) return [points]; // Can't split if less than 2 points
    
    const elementX = element.x || 0;
    const elementY = element.y || 0;
    const segments: Array<number[]> = [];
    let currentSegment: number[] = [];
    
    for (let i = 0; i < points.length - 1; i += 2) {
      const x1 = points[i] + elementX;
      const y1 = points[i + 1] + elementY;
      const x2 = points[i + 2] !== undefined ? points[i + 2] + elementX : x1;
      const y2 = points[i + 3] !== undefined ? points[i + 3] + elementY : y1;
      
      // Check if this line segment intersects with eraser path
      const dist1 = distanceToLineSegment(pathStart.x, pathStart.y, x1, y1, x2, y2);
      const dist2 = distanceToLineSegment(pathEnd.x, pathEnd.y, x1, y1, x2, y2);
      const dist3 = distanceToLineSegment(x1, y1, pathStart.x, pathStart.y, pathEnd.x, pathEnd.y);
      const dist4 = distanceToLineSegment(x2, y2, pathStart.x, pathStart.y, pathEnd.x, pathEnd.y);
      
      const minDist = Math.min(dist1, dist2, dist3, dist4);
      const intersects = minDist <= eraserRadius;
      
      if (intersects) {
        // Segment intersects - end current segment and start new one
        if (currentSegment.length >= 4) {
          segments.push([...currentSegment]);
        }
        currentSegment = [];
      } else {
        // Segment doesn't intersect - add to current segment
        if (currentSegment.length === 0) {
          currentSegment.push(points[i] - elementX, points[i + 1] - elementY);
        }
        if (points[i + 2] !== undefined && points[i + 3] !== undefined) {
          currentSegment.push(points[i + 2] - elementX, points[i + 3] - elementY);
        }
      }
    }
    
    // Add final segment if it has points
    if (currentSegment.length >= 4) {
      segments.push(currentSegment);
    }
    
    return segments;
  }, [distanceToLineSegment]);

  // Erase elements at a point (simpler, faster approach for smooth erasing)
  const eraseAtPoint = useCallback((point: { x: number; y: number }) => {
    const eraserRadius = Math.max(10, (drawingSettings.strokeWidth || 10) * 2);
    const elementsToModify: Array<{ id: string; newPoints?: number[]; shouldRemove: boolean }> = [];

    // Check all visible, unlocked elements
    elements.forEach((element) => {
      // Skip if already processed in this stroke
      if (erasedElementsRef.current.has(element.id)) return;
      
      const layer = layers.find((l) => l.id === element.layerId);
      if (!layer || layer.locked || !layer.visible) return;

      // For line-based elements, check if point is near any segment
      if (element.type === 'line' || element.type === 'polyline' || element.type === 'free') {
        const elementAny = element as any;
        const points = elementAny.points || [];
        if (points.length < 4) return;
        
        const elementX = element.x || 0;
        const elementY = element.y || 0;
        let foundIntersection = false;
        
        // Check each segment
        for (let i = 0; i < points.length - 1; i += 2) {
          const x1 = points[i] + elementX;
          const y1 = points[i + 1] + elementY;
          const x2 = points[i + 2] !== undefined ? points[i + 2] + elementX : x1;
          const y2 = points[i + 3] !== undefined ? points[i + 3] + elementY : y1;
          
          const dist = distanceToLineSegment(point.x, point.y, x1, y1, x2, y2);
          if (dist <= eraserRadius) {
            foundIntersection = true;
            break;
          }
        }
        
        if (foundIntersection) {
          // Split line at intersection
          const segments = splitLineAtIntersections(element, point, point, eraserRadius);
          
          if (segments.length === 0) {
            elementsToModify.push({ id: element.id, shouldRemove: true });
          } else if (segments.length === 1 && segments[0].length === points.length) {
            // No change
          } else {
            const firstSegment = segments[0];
            if (firstSegment.length >= 4) {
              elementsToModify.push({
                id: element.id,
                newPoints: firstSegment,
                shouldRemove: false,
              });
              
              for (let i = 1; i < segments.length; i++) {
                if (segments[i].length >= 4) {
                  const newElement: EditorElement = {
                    ...element,
                    id: nanoid(),
                    x: 0,
                    y: 0,
                  } as EditorElement;
                  (newElement as any).points = segments[i];
                  addElementWithPage(newElement);
                }
              }
            } else {
              elementsToModify.push({ id: element.id, shouldRemove: true });
            }
          }
        }
      } else {
        // For other element types, check if point is within eraser radius
        const bounds = getElementBounds(element);
        if (bounds) {
          const closestX = Math.max(bounds.left, Math.min(point.x, bounds.right));
          const closestY = Math.max(bounds.top, Math.min(point.y, bounds.bottom));
          const dist = Math.hypot(point.x - closestX, point.y - closestY);
          if (dist <= eraserRadius) {
            elementsToModify.push({ id: element.id, shouldRemove: true });
          }
        }
      }
    });

    // Apply modifications
    elementsToModify.forEach((mod) => {
      erasedElementsRef.current.add(mod.id);
      if (mod.shouldRemove) {
        removeElement(mod.id);
      } else if (mod.newPoints) {
        updateElement(mod.id, { points: mod.newPoints });
      }
    });
  }, [elements, layers, drawingSettings.strokeWidth, removeElement, distanceToLineSegment, splitLineAtIntersections, addElementWithPage, updateElement, getElementBounds]);

  // Erase elements along a path segment (brush-like erasing)
  const eraseAlongPath = useCallback((pathStart: { x: number; y: number }, pathEnd: { x: number; y: number }) => {
    // For very short paths, just erase at the point
    const distance = Math.hypot(pathEnd.x - pathStart.x, pathEnd.y - pathStart.y);
    if (distance < 1) {
      eraseAtPoint(pathStart);
      return;
    }
    
    // Check multiple points along the path for smooth coverage
    const eraserRadius = Math.max(10, (drawingSettings.strokeWidth || 10) * 2);
    const numPoints = Math.max(3, Math.ceil(distance / (eraserRadius * 0.3)));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const checkPoint = {
        x: pathStart.x + (pathEnd.x - pathStart.x) * t,
        y: pathStart.y + (pathEnd.y - pathStart.y) * t,
      };
      eraseAtPoint(checkPoint);
    }
  }, [eraseAtPoint, drawingSettings.strokeWidth]);

  // Initialize snapping engine
  useEffect(() => {
    snappingEngineRef.current = new SnappingEngine(snapSettings);
  }, []);

  useEffect(() => {
    if (snappingEngineRef.current) {
      snappingEngineRef.current.updateSettings(snapSettings);
      snappingEngineRef.current.updateElements(elements);
    }
  }, [snapSettings, elements]);

  // Reset drawing state when tool changes
  useEffect(() => {
    if (tool !== 'polyline') {
      polylineRef.current = [];
      if (draftElement?.type === 'polyline') {
        setDraftElement(null);
      }
    }
    if (tool !== 'pencil' && draftElement?.type === 'free') {
      setDraftElement(null);
      setIsDrawing(false);
    }
    // Stop editing when tool changes (but allow editing when text tool is active)
    if (tool !== 'select' && tool !== 'text' && editingTextId) {
      setEditingTextId(null);
      setEditingTextValue('');
    }
  }, [tool]);

  // Keyboard handlers for text editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) {
        // If editing, handle text editing keys
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          // Save text
          const textElement = elements.find(el => el.id === editingTextId);
          if (textElement && textElement.type === 'text') {
            const txtEl = textElement as any;
            updateElement(editingTextId, { text: editingTextValue || txtEl.text || '' });
          }
          setEditingTextId(null);
          setEditingTextValue('');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Cancel editing
          setEditingTextId(null);
          setEditingTextValue('');
        }
        // Don't handle Delete/Backspace here - let the input handle it
      } else if (tool === 'dimension' && isDrawing && draftElement && draftElement.type === 'dimension') {
        // Cancel dimension drawing with Escape
        if (e.key === 'Escape') {
          e.preventDefault();
          setDraftElement(null);
          setIsDrawing(false);
          originRef.current = null;
        }
      } else if (selectedElementIds.length > 0 && !editingTextId) {
        // If elements are selected, handle delete for ALL element types
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          selectedElementIds.forEach((id) => {
            removeElement(id);
          });
          setSelectedElements([]);
        } else if (e.key === 'Enter' || e.key === 'F2') {
          // Start editing selected text
          const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
          if (selectedElement && selectedElement.type === 'text') {
            e.preventDefault();
            const textElement = selectedElement as any;
            setEditingTextId(selectedElement.id);
            setEditingTextValue(textElement.text || '');
          }
        } else if ((e.key === 's' || e.key === 'S') && selectedElementIds.length === 1) {
          const selectedElement = elements.find(el => el.id === selectedElementIds[0]);
          if (selectedElement && selectedElement.type === 'wall' && pointer) {
            e.preventDefault();
            const success = splitWallAtPoint(selectedElement as WallElement, pointer);
            if (success) {
              setSelectedElements([]);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId, editingTextValue, selectedElementIds, elements, updateElement, removeElement, setSelectedElements, tool, isDrawing, draftElement, splitWallAtPoint, pointer]);

  // Focus text input when editing starts
  useEffect(() => {
    if (editingTextId) {
      const timeoutId = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
          textInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [editingTextId]);

  // Dimension tool uses draftElement like other tools, no special cleanup needed

  // Connect transformer to selected shapes
  useEffect(() => {
    if (!transformerRef.current) return;
    const nodes = selectedElementIds
      .map((id) => shapeRefs.current[id])
      .filter((node): node is Konva.Node => Boolean(node));
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedElementIds, elements]);

  // Resize handler - uses ResizeObserver to detect container size changes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        setCanvasSize({ width, height });
      }
    };
    updateSize();
    
    // ResizeObserver to detect when panels are hidden/shown
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Pointer-centered zoom
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    // Prevent accidental zoom when using select tool - require Ctrl/Cmd for zoom
    if (tool === 'select' && !e.evt.ctrlKey && !e.evt.metaKey) {
      return;
    }
    
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(10, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageTransform({ scale: clampedScale, position: newPos });
  }, [stageScale, stagePosition, setStageTransform, tool]);

  // Smooth pan
  const handlePointerDown = useCallback((e: KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) {
      console.warn('Cannot draw: stage not initialized');
      return;
    }

    console.log('handlePointerDown called', { tool, activeLayerId, layers: layers.length });

    // Get pointer position early for all tools
    const point = getStagePointer(e);
    if (!point || !activeLayerId) {
      console.warn('Cannot draw: missing point or activeLayerId', { point, activeLayerId, tool });
      return;
    }

    // Check if active layer exists and is not locked
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) {
      console.warn('Cannot draw: active layer not found', { activeLayerId, layers });
      return;
    }
    if (activeLayer.locked) {
      console.warn('Cannot draw: active layer is locked', { activeLayerId, activeLayer });
      return;
    }

    const isOnShape = e.target !== e.target.getStage();
    
    // For drawing/modify/furniture/annotation tools, always process even if clicking on shapes
    const drawingToolsList = ['line', 'polyline', 'rectangle', 'circle', 'ellipse', 'arc', 'pencil', 'wall', 'door', 'window'];
    const modifyToolsList = ['trim', 'extend', 'offset', 'fillet', 'chamfer'];
    const furnitureToolsList = ['bed', 'sofa', 'table', 'wardrobe', 'tvUnit', 'dining', 'wc', 'washBasin', 'showerPanel', 'floorDrain', 'mirror', 'baseCabinet', 'wallCabinet', 'sinkUnit', 'hobUnit', 'refrigerator', 'microwave', 'switchboard', 'powerSocket', 'lightPoint', 'fanPoint', 'acPoint', 'hotWaterLine', 'coldWaterLine', 'drainPipe'];
    const annotationToolsList = ['text', 'dimension'];
    const shouldProcessOnShape = drawingToolsList.includes(tool) || modifyToolsList.includes(tool) || furnitureToolsList.includes(tool) || annotationToolsList.includes(tool) || tool === 'measure' || tool === 'move' || tool === 'rotate';
    
    // Eraser tool - simple and smooth erasing
    if (tool === 'erase') {
      // If elements are selected, remove all selected elements
      if (selectedElementIds.length > 0 && !isErasing) {
        selectedElementIds.forEach((id) => {
          const el = elements.find(e => e.id === id);
          if (el && !layers.find(l => l.id === el.layerId)?.locked) {
            removeElement(id);
          }
        });
        setSelectedElements([]);
        return;
      }
      
      // Start erasing (like starting a freehand stroke)
      setIsErasing(true);
      eraserPathRef.current = [point];
      setEraserPosition(point);
      erasedElementsRef.current.clear(); // Reset erased elements for new stroke
      
      // Erase at initial point (brush touch)
      eraseAlongPath(point, point);
      return;
    }
    
    // Only skip if clicking on shape AND tool shouldn't process on shapes AND not select/pan tool
    // Note: erase tool is handled above, so we don't need to check it here
    if (isOnShape && !shouldProcessOnShape && tool !== 'select' && tool !== 'pan') {
      return;
    }

    // Select tool - modern, user-friendly implementation
    if (tool === 'select') {
      // Always prevent stage dragging when using select tool
      stage.setAttrs({ draggable: false });
      
      // If clicking on a shape, let the shape handle selection
      if (isOnShape) {
        return; // Shape's onPointerDown will handle selection
      }
      
      // Click on empty space - start selection window or clear selection
      const pos = stage.getPointerPosition();
      if (pos) {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTimeRef.current;
        
        // Check if this is a quick click (for clearing selection)
        if (timeSinceLastClick < 300 && !selectionStartRef.current) {
          // Quick click on empty space - clear selection
          setSelectedElements([]);
          setSelectionWindow(null);
          return;
        }
        
        // Start drag selection
        isSelectingRef.current = true;
        selectionStartRef.current = { x: pos.x, y: pos.y };
        setSelectionWindow({
          startX: pos.x,
          startY: pos.y,
          endX: pos.x,
          endY: pos.y,
          isLeftToRight: true,
        });
        lastClickTimeRef.current = now;
      }
      return;
    }

    // For pan tool - only allow pan when explicitly using pan tool or middle mouse button
    if (tool === 'pan' || (e.evt.button === 1)) {
      stage.setAttrs({ draggable: true });
      return;
    }

    // Zoom tool - zoom in on click
    if (tool === 'zoom') {
      const newScale = Math.min(4, stageScale * 1.2);
      const pos = stage.getPointerPosition();
      if (pos) {
        const mousePointTo = {
          x: (pos.x - stagePosition.x) / stageScale,
          y: (pos.y - stagePosition.y) / stageScale,
        };
        const newPos = {
          x: pos.x - mousePointTo.x * newScale,
          y: pos.y - mousePointTo.y * newScale,
        };
        setStageTransform({ scale: newScale, position: newPos });
      }
      return;
    }

    // Measure tool
    if (tool === 'measure') {
      if (!measureStart) {
        setMeasureStart(point);
        setMeasureEnd(null);
      } else {
        setMeasureEnd(point);
      }
      return;
    }

    // Move tool - start moving selected elements
    if (tool === 'move' && selectedElementIds.length > 0) {
      setIsMoving(true);
      originRef.current = point;
      return;
    }

    // Rotate tool - start rotating selected elements
    if (tool === 'rotate' && selectedElementIds.length > 0) {
      setIsRotating(true);
      // Calculate center of selected elements
      const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
      if (selectedElements.length > 0) {
        let sumX = 0, sumY = 0, count = 0;
        selectedElements.forEach(el => {
          if ('x' in el && 'y' in el) {
            sumX += el.x;
            sumY += el.y;
            count++;
          }
        });
        setRotateCenter({ x: sumX / count, y: sumY / count });
      } else {
        setRotateCenter(point);
      }
      originRef.current = point;
      return;
    }

    // Modify tools (trim, extend, offset, fillet, chamfer) - need target element
    if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
      // Ensure stage is not draggable when using modify tools
      stage.setAttrs({ draggable: false });
      
      // Get screen position for hit testing
      const screenPos = stage.getPointerPosition();
      if (screenPos) {
        // Try to find element at click position
        const hitShape = stage.getIntersection(screenPos);
        if (hitShape && hitShape.id()) {
          const targetElement = elements.find(el => el.id === hitShape.id());
          if (targetElement) {
            // For offset - apply immediately on first click
            if (tool === 'offset') {
              const offset = offsetElement(targetElement, 20); // Default offset distance
              if (offset) {
                addElementWithPage(offset);
              }
              return;
            }
            
            // For fillet and chamfer - need two elements, set first target
            if (tool === 'fillet' || tool === 'chamfer') {
              if (!modifyTarget) {
                // First click - set target
                setModifyTarget(targetElement);
                originRef.current = point;
                return;
              } else if (modifyTarget.id !== targetElement.id) {
                // Second click on different element - apply fillet/chamfer
                let result: { elements: EditorElement[]; deletedIds?: string[] } | null = null;
                if (tool === 'fillet') {
                  result = filletElements(modifyTarget, targetElement, 10); // Default fillet radius
                } else if (tool === 'chamfer') {
                  result = chamferElements(modifyTarget, targetElement, 10); // Default chamfer distance
                }
                if (result) {
                  if (result.deletedIds && result.deletedIds.length > 0) {
                    result.deletedIds.forEach((id: string) => removeElement(id));
                  }
                  result.elements.forEach((el: EditorElement) => {
                    if (el && el.id === modifyTarget.id) {
                      updateElement(el.id, el);
                    } else if (el) {
                      addElementWithPage(el);
                    }
                  });
                }
                setModifyTarget(null);
                originRef.current = null;
                return;
              }
            }
            
            // For trim and extend - set target on first click, apply on second
            if (tool === 'trim' || tool === 'extend') {
              if (!modifyTarget) {
                // First click - set target
                setModifyTarget(targetElement);
                originRef.current = point;
                return;
              } else {
                // Second click - apply trim/extend
                let result: { elements: EditorElement[]; deletedIds?: string[] } | null = null;
                if (tool === 'trim') {
                  const trimmed = trimElement(modifyTarget, point, elements.filter(el => el.id !== modifyTarget.id));
                  if (trimmed) {
                    result = { elements: [trimmed], deletedIds: [] };
                  }
                } else if (tool === 'extend') {
                  const extended = extendElement(modifyTarget, point, elements.filter(el => el.id !== modifyTarget.id));
                  if (extended) {
                    result = { elements: [extended], deletedIds: [] };
                  }
                }
                if (result) {
                  if (result.deletedIds && result.deletedIds.length > 0) {
                    result.deletedIds.forEach((id: string) => removeElement(id));
                  }
                  result.elements.forEach((el: EditorElement) => {
                    if (el && el.id === modifyTarget.id) {
                      updateElement(el.id, el);
                    } else if (el) {
                      addElementWithPage(el);
                    }
                  });
                }
                setModifyTarget(null);
                originRef.current = null;
                return;
              }
            }
            
            // Fallback: set target for other modify tools
            setModifyTarget(targetElement);
            originRef.current = point;
            return;
          }
        }
        
        // Alternative: find closest element to click point
        if (!modifyTarget) {
          let closestElement: EditorElement | null = null;
          let closestDist = Infinity;
          
          elements.forEach((el) => {
            const layer = layers.find((l) => l.id === el.layerId);
            if (!layer || !layer.visible || layer.locked) return;
            
            // Calculate distance to element
            let dist = Infinity;
            if (el.type === 'line' && 'points' in el && el.points.length >= 4) {
              const [x1, y1, x2, y2] = el.points;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len2 = dx * dx + dy * dy;
              if (len2 > 0) {
                const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / len2));
                const projX = x1 + t * dx;
                const projY = y1 + t * dy;
                dist = Math.hypot(point.x - projX, point.y - projY);
              }
            } else if (el.x !== undefined && el.y !== undefined) {
              dist = Math.hypot(point.x - el.x, point.y - el.y);
            }
            
            if (dist < closestDist && dist < 50) { // 50px threshold
              closestDist = dist;
              closestElement = el;
            }
          });
          
          if (closestElement) {
            setModifyTarget(closestElement);
            originRef.current = point;
          }
        }
      }
      return;
    }

    // Architectural tools
    if (tool === 'wall') {
      originRef.current = point;
      setDraftElement({
        id: 'wall-preview',
        type: 'wall',
        layerId: activeLayerId,
        points: [point.x, point.y, point.x, point.y],
        thickness: 20, // Default wall thickness
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        rotation: 0,
        x: 0,
        y: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'door') {
      const alignment = alignDoorWindowToWall(point);
      originRef.current = alignment.point;
      setDraftElement({
        id: 'door-preview',
        type: 'door',
        layerId: activeLayerId,
        x: alignment.point.x,
        y: alignment.point.y,
        width: 80, // Default door width
        height: 5,
        swingAngle: 90,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent',
        rotation: alignment.rotation ?? 0,
        wallId: alignment.wallId,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'window') {
      const alignment = alignDoorWindowToWall(point);
      originRef.current = alignment.point;
      setDraftElement({
        id: 'window-preview',
        type: 'window',
        layerId: activeLayerId,
        x: alignment.point.x,
        y: alignment.point.y,
        width: 0, // Start with 0 for smooth dynamic drawing
        height: 8, // Default window height (thicker for visibility)
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent',
        rotation: alignment.rotation ?? 0,
        wallId: alignment.wallId,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }


    // For drawing tools, allow drawing even when clicking on shapes
    // The shapes have listening=false when drawing tools are active, so events pass through
    // Update pointer with snapping
    let finalPoint = point;
    if (snappingEngineRef.current) {
      const snap = snappingEngineRef.current.findSnapPoint(point, undefined, originRef.current ?? undefined);
      finalPoint = snap ? { x: snap.x, y: snap.y } : point;
      setPointer(finalPoint);
      setSnapPoint(snap ? { x: snap.x, y: snap.y } : null);
    } else {
      setPointer(finalPoint);
    }

    // Furniture/Block tools - create furniture elements on click
    const furnitureTools: Record<
      string,
      {
        width: number;
        height: number;
        category: string;
        moduleClass?: FurnitureElement['moduleClass'];
        depth?: number;
        sections?: FurnitureSection[];
        metadata?: Record<string, unknown>;
      }
    > = {
      bed: { width: 200, height: 150, category: 'bed' },
      sofa: { width: 200, height: 80, category: 'sofa' },
      table: { width: 120, height: 80, category: 'table' },
      wardrobe: { width: 100, height: 200, category: 'wardrobe' },
      tvUnit: { width: 180, height: 40, category: 'tv-unit' },
      dining: { width: 150, height: 100, category: 'dining' },
      wc: { width: 60, height: 70, category: 'wc' },
      washBasin: { width: 50, height: 40, category: 'wash-basin' },
      showerPanel: { width: 80, height: 80, category: 'shower' },
      floorDrain: { width: 30, height: 30, category: 'floor-drain' },
      mirror: { width: 60, height: 80, category: 'mirror' },
      baseCabinet: {
        width: 60,
        height: 35,
        depth: 60,
        category: 'base-cabinet',
        moduleClass: 'base',
        sections: [
          { id: 'left', type: 'door', widthRatio: 0.5, swing: 'left' },
          { id: 'right', type: 'door', widthRatio: 0.5, swing: 'right' },
        ],
        metadata: { layout: 'double-door' },
      },
      wallCabinet: {
        width: 60,
        height: 35,
        depth: 35,
        category: 'wall-cabinet',
        moduleClass: 'wall',
        sections: [{ id: 'open', type: 'open' }],
        metadata: { layout: 'open' },
      },
      sinkUnit: {
        width: 80,
        height: 60,
        depth: 60,
        category: 'sink-unit',
        moduleClass: 'base',
        sections: [
          { id: 'door', type: 'door', widthRatio: 0.6, swing: 'left' },
          { id: 'drawer', type: 'drawer', widthRatio: 0.4, drawerCount: 2 },
        ],
        metadata: { layout: 'door-drawer' },
      },
      hobUnit: {
        width: 80,
        height: 60,
        depth: 60,
        category: 'hob-unit',
        moduleClass: 'base',
        sections: [{ id: 'drawers', type: 'drawer', drawerCount: 3 }],
        metadata: { layout: 'drawer-stack' },
      },
      refrigerator: { width: 70, height: 180, category: 'refrigerator' },
      microwave: { width: 50, height: 40, category: 'microwave' },
      switchboard: { width: 40, height: 60, category: 'switchboard' },
      powerSocket: { width: 20, height: 20, category: 'power-socket' },
      lightPoint: { width: 15, height: 15, category: 'light-point' },
      fanPoint: { width: 20, height: 20, category: 'fan-point' },
      acPoint: { width: 30, height: 30, category: 'ac-point' },
      hotWaterLine: { width: 100, height: 5, category: 'hot-water-line' },
      coldWaterLine: { width: 100, height: 5, category: 'cold-water-line' },
      drainPipe: { width: 100, height: 5, category: 'drain-pipe' },
    };

    if (furnitureTools[tool]) {
      const config = furnitureTools[tool];
      const furniture = createFurnitureElement(
        finalPoint,
        config.width,
        config.height,
        config.category,
        activeLayerId,
        {
          moduleClass: config.moduleClass,
          depth: config.depth,
          sections: config.sections,
          metadata: config.metadata,
        }
      );
      // Apply drawing settings to furniture element
      const furnitureWithSettings = {
        ...furniture,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : (furniture.stroke || '#000000'),
        strokeWidth: drawingSettings.strokeWidth || furniture.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : (furniture.opacity || 1),
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : (furniture.fill || 'transparent'),
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      };
      addElement(furnitureWithSettings);
      return;
    }

    // Text tool - create text element and start editing immediately
    if (tool === 'text') {
      // Stop event propagation to prevent other handlers from interfering
      e.evt.stopPropagation();
      
      const textElement = createTextElement(
        finalPoint,
        '',
        activeLayerId,
        16,
        'Arial',
        'left',
        'middle'
      ) as any;
      
      // Use stroke color for text color
      // Ensure fill is transparent (text elements should not have background fill)
      const finalTextElement: EditorElement = {
        ...textElement,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: undefined, // Explicitly ensure no fill for text elements
      } as EditorElement;
      
      addElementWithPage(finalTextElement);
      
      // Start editing immediately - use setTimeout to ensure element is in DOM
      setTimeout(() => {
        setEditingTextId(finalTextElement.id);
        setEditingTextValue('');
        setSelectedElements([finalTextElement.id]);
      }, 0);
      
      return;
    }

    // Dimension tool - works like line tool, easy drawing
    if (tool === 'dimension') {
      // If already drawing, finish the dimension
      if (isDrawing && draftElement && draftElement.type === 'dimension') {
        return; // Let handlePointerUp handle finishing
      }
      
      // Start new dimension - similar to line tool
      setDraftElement({
        id: 'dimension-preview',
        type: 'dimension',
        layerId: activeLayerId,
        stroke: drawingSettings.strokeColor,
        strokeWidth: drawingSettings.strokeWidth,
        opacity: 1,
        rotation: 0,
        x: 0,
        y: 0,
        startPoint: finalPoint,
        endPoint: finalPoint,
        value: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
        style: drawingSettings.dimensionStyle,
      } as any);
      originRef.current = finalPoint;
      setIsDrawing(true);
      return;
    }

    // Drawing tools - check if this is a drawing tool
    const drawingTools = ['line', 'polyline', 'rectangle', 'circle', 'ellipse', 'arc', 'pencil', 'wall', 'door', 'window'];
    if (!drawingTools.includes(tool)) {
      return; // Not a drawing tool, exit early
    }

    originRef.current = finalPoint;

    console.log('Starting drawing with tool:', tool, 'at point:', finalPoint);

    if (tool === 'line') {
      const lineElement = {
        id: 'line-preview',
        type: 'line' as const,
        layerId: activeLayerId,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        rotation: 0,
        x: 0,
        y: 0,
        points: [finalPoint.x, finalPoint.y, finalPoint.x, finalPoint.y] as [number, number, number, number],
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement;
      console.log('Setting draft element for line:', lineElement);
      setDraftElement(lineElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'polyline') {
      polylineRef.current = [...polylineRef.current, finalPoint.x, finalPoint.y];
      setDraftElement({
        id: 'polyline-preview',
        type: 'polyline',
        layerId: activeLayerId,
        points: polylineRef.current,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        rotation: 0,
        x: 0,
        y: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      return;
    }

    if (tool === 'rectangle') {
      setDraftElement({
        id: 'rect-preview',
        type: 'rectangle',
        layerId: activeLayerId,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent',
        rotation: 0,
        x: finalPoint.x,
        y: finalPoint.y,
        width: 0,
        height: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'circle') {
      setDraftElement({
        id: 'circle-preview',
        type: 'circle',
        layerId: activeLayerId,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent',
        rotation: 0,
        x: finalPoint.x,
        y: finalPoint.y,
        radius: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'ellipse') {
      setDraftElement({
        id: 'ellipse-preview',
        type: 'ellipse',
        layerId: activeLayerId,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent',
        rotation: 0,
        x: finalPoint.x,
        y: finalPoint.y,
        radiusX: 0,
        radiusY: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'arc') {
      setDraftElement({
        id: 'arc-preview',
        type: 'arc',
        layerId: activeLayerId,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        rotation: 0,
        x: finalPoint.x,
        y: finalPoint.y,
        radius: 0,
        startAngle: 0,
        endAngle: 180,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }

    if (tool === 'pencil') {
      setDraftElement({
        id: 'free-preview',
        type: 'free',
        layerId: activeLayerId,
        points: [finalPoint.x, finalPoint.y],
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : '#000000',
        strokeWidth: Math.max(1.5, (e.evt.pressure || 0.5) * 3) || drawingSettings.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : 1,
        rotation: 0,
        x: 0,
        y: 0,
        dash: drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : [],
      } as EditorElement);
      setIsDrawing(true);
      return;
    }
  }, [tool, activeLayerId, drawingSettings, elements, selectedElementIds, measureStart, isMoving, isRotating, modifyTarget, layers, stageScale, stagePosition, alignDoorWindowToWall]);

  const handlePointerMove = useCallback((e: KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Prevent default for touch events to improve smoothness
    if (e.evt.pointerType === 'touch') {
      e.evt.preventDefault();
    }

    const point = getStagePointer(e);
    if (!point) return;

    // Update pointer with snapping - skip snapping for freehand/eraser for smoothness
    let finalPoint = point;
    if (snappingEngineRef.current && tool !== 'pencil' && tool !== 'erase') {
      const snap = snappingEngineRef.current.findSnapPoint(point, undefined, originRef.current ?? undefined);
      finalPoint = snap ? { x: snap.x, y: snap.y } : point;
      setSnapPoint(snap ? { x: snap.x, y: snap.y } : null);
    }
    setPointer(finalPoint);

    // Update selection window for select tool
    if (tool === 'select' && isSelectingRef.current && selectionStartRef.current) {
      // Ensure stage is never draggable during selection
      if (stageRef.current) {
        stageRef.current.setAttrs({ draggable: false });
      }
      
      const pos = stage.getPointerPosition();
      if (pos) {
        const start = selectionStartRef.current;
        const end = pos;
        const isLeftToRight = end.x >= start.x && end.y >= start.y;
        
        // Update selection window smoothly
        setSelectionWindow({
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          isLeftToRight,
        });
      }
    }

    // Measure tool - update end point
    if (tool === 'measure' && measureStart) {
      setMeasureEnd(finalPoint);
    }

    // Move tool - update element positions
    if (tool === 'move' && isMoving && originRef.current && selectedElementIds.length > 0) {
      const deltaX = finalPoint.x - originRef.current.x;
      const deltaY = finalPoint.y - originRef.current.y;
      const result = moveElements(elements, selectedElementIds, deltaX, deltaY);
      result.elements.forEach(el => {
        updateElement(el.id, el);
      });
      originRef.current = finalPoint;
    }

    // Rotate tool - update element rotations
    if (tool === 'rotate' && isRotating && originRef.current && rotateCenter && selectedElementIds.length > 0) {
      const startAngle = Math.atan2(originRef.current.y - rotateCenter.y, originRef.current.x - rotateCenter.x);
      const currentAngle = Math.atan2(finalPoint.y - rotateCenter.y, finalPoint.x - rotateCenter.x);
      const angleRad = currentAngle - startAngle;
      const result = rotateElements(elements, selectedElementIds, rotateCenter.x, rotateCenter.y, angleRad);
      result.elements.forEach(el => {
        updateElement(el.id, el);
      });
      originRef.current = finalPoint;
    }

    // Eraser tool - smooth continuous erasing (like freehand drawing)
    if (tool === 'erase' && isErasing) {
      // Update eraser position for visual feedback immediately
      setEraserPosition(finalPoint);
      
      // Add point to eraser path (like freehand drawing)
      const lastPoint = eraserPathRef.current[eraserPathRef.current.length - 1];
      eraserPathRef.current.push(finalPoint);
      
      // Erase immediately without RAF for smooth, responsive erasing
      if (lastPoint) {
        // Calculate distance to determine how many intermediate points to check
        const distance = Math.hypot(finalPoint.x - lastPoint.x, finalPoint.y - lastPoint.y);
        const eraserRadius = Math.max(10, (drawingSettings.strokeWidth || 10) * 2);
        
        // Check multiple points along the path for smooth coverage
        // More points for longer distances to ensure no gaps
        const numPoints = Math.max(2, Math.ceil(distance / (eraserRadius * 0.5)));
        
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const checkPoint = {
            x: lastPoint.x + (finalPoint.x - lastPoint.x) * t,
            y: lastPoint.y + (finalPoint.y - lastPoint.y) * t,
          };
          
          // Erase at this point (treat as small path segment)
          const prevCheckPoint = i > 0 ? {
            x: lastPoint.x + (finalPoint.x - lastPoint.x) * ((i - 1) / numPoints),
            y: lastPoint.y + (finalPoint.y - lastPoint.y) * ((i - 1) / numPoints),
          } : lastPoint;
          
          eraseAlongPath(prevCheckPoint, checkPoint);
        }
      } else {
        // First point - erase at point location
        eraseAlongPath(finalPoint, finalPoint);
      }
      
      return;
    }

    // Update draft element for drawing tools
    if (tool === 'polyline' && polylineRef.current.length) {
      setDraftElement((prev) => ({
        ...(prev ?? {}),
        id: 'polyline-preview',
        type: 'polyline',
        layerId: activeLayerId,
        points: [...polylineRef.current, finalPoint.x, finalPoint.y],
        stroke: drawingSettings.strokeColor,
        strokeWidth: drawingSettings.strokeWidth,
        opacity: 1,
        rotation: 0,
        x: 0,
        y: 0,
      } as EditorElement));
    }

    if (!draftElement || !isDrawing) return;

    // Freehand drawing - update immediately without RAF for smoothness
    if (draftElement.type === 'free' && 'points' in draftElement) {
      setDraftElement((prev) => {
        if (!prev || prev.type !== 'free' || !('points' in prev)) return prev;
        const freeElement = prev as any;
        return {
          ...prev,
          points: appendPoint(freeElement.points, finalPoint, 0.5),
        } as EditorElement;
      });
      return;
    }

    // Wall, door, window - update immediately for smooth drawing
    if (draftElement.type === 'wall' && originRef.current && 'points' in draftElement) {
      const origin = originRef.current;
      setDraftElement((prev) => {
        if (!prev || prev.type !== 'wall' || !('points' in prev) || !origin) return prev;
        return { ...prev, points: [origin.x, origin.y, finalPoint.x, finalPoint.y] } as EditorElement;
      });
      return;
    }

    if (draftElement.type === 'door' && originRef.current) {
      const origin = originRef.current;
      const dx = finalPoint.x - origin.x;
      const dy = finalPoint.y - origin.y;
      const width = Math.hypot(dx, dy);
      const angle = radiansToDegrees(Math.atan2(dy, dx));
      setDraftElement((prev) => {
        if (!prev) return prev;
        return { ...prev, width: Math.max(40, width), rotation: angle };
      });
      return;
    }

    if (draftElement.type === 'window' && originRef.current) {
      const origin = originRef.current;
      const dx = finalPoint.x - origin.x;
      const dy = finalPoint.y - origin.y;
      const width = Math.hypot(dx, dy);
      const angle = radiansToDegrees(Math.atan2(dy, dx));
      setDraftElement((prev) => {
        if (!prev) return prev;
        return { ...prev, width: Math.max(10, width), rotation: angle };
      });
      return;
    }

    // Throttle other draft element updates using requestAnimationFrame
    if (draftUpdateRafRef.current) cancelAnimationFrame(draftUpdateRafRef.current);
    
    draftUpdateRafRef.current = requestAnimationFrame(() => {
      if (draftElement.type === 'line' && originRef.current) {
        const origin = originRef.current; // Capture value before setState
        setDraftElement((prev) => {
          if (!prev || !origin) return prev;
          return {
            ...prev,
            points: [origin.x, origin.y, finalPoint.x, finalPoint.y] as [number, number, number, number],
          };
        });
      } else if (draftElement.type === 'rectangle' && originRef.current) {
        const origin = originRef.current;
        const nextWidth = finalPoint.x - origin.x;
        const nextHeight = finalPoint.y - origin.y;
        setDraftElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            x: nextWidth < 0 ? finalPoint.x : origin.x,
            y: nextHeight < 0 ? finalPoint.y : origin.y,
            width: Math.abs(nextWidth),
            height: Math.abs(nextHeight),
          };
        });
      } else if (draftElement.type === 'circle' && originRef.current) {
        const origin = originRef.current;
        const nextRadius = Math.hypot(finalPoint.x - origin.x, finalPoint.y - origin.y);
        setDraftElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            radius: nextRadius,
          };
        });
      } else if (draftElement.type === 'ellipse' && originRef.current) {
        const origin = originRef.current;
        setDraftElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            radiusX: Math.abs(finalPoint.x - origin.x),
            radiusY: Math.abs(finalPoint.y - origin.y),
          };
        });
      } else if (draftElement.type === 'arc' && originRef.current) {
        const origin = originRef.current;
        const nextRadius = Math.hypot(finalPoint.x - origin.x, finalPoint.y - origin.y);
        const angleRad = Math.atan2(finalPoint.y - origin.y, finalPoint.x - origin.x);
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
      }
      
      // Update dimension preview while drawing - similar to line tool
      if (draftElement && draftElement.type === 'dimension' && originRef.current) {
        const start = originRef.current;
        const distance = Math.hypot(finalPoint.x - start.x, finalPoint.y - start.y);
        setDraftElement((prev) => {
          if (!prev || prev.type !== 'dimension') return prev;
          return {
            ...prev,
            startPoint: start,
            endPoint: finalPoint,
            value: distance,
          };
        });
      }
    });
  }, [tool, isDrawing, draftElement, activeLayerId, drawingSettings, isMoving, isRotating, rotateCenter, selectedElementIds, elements, measureStart, pointer, alignDoorWindowToWall]);

  const handlePointerUp = useCallback(() => {
    // Cancel any pending draft updates for smooth cleanup
    if (draftUpdateRafRef.current) {
      cancelAnimationFrame(draftUpdateRafRef.current);
      draftUpdateRafRef.current = null;
    }
    lastDraftUpdateRef.current = null;

    const stage = stageRef.current;
    if (stage) {
      stage.setAttrs({ draggable: false });
    }

    // Finalize measure tool
    if (tool === 'measure') {
      if (measureStart && measureEnd) {
        const result = calculateMeasure(measureStart, measureEnd);
        const text = formatMeasureText(result, drawingSettings.unit, drawingSettings.unitScale);
        alert(`Distance: ${text}`);
      }
      setMeasureStart(null);
      setMeasureEnd(null);
      return;
    }

    // Finalize move tool
    if (tool === 'move' && isMoving) {
      setIsMoving(false);
      originRef.current = null;
      return;
    }

    // Finalize rotate tool
    if (tool === 'rotate' && isRotating) {
      setIsRotating(false);
      setRotateCenter(null);
      originRef.current = null;
      return;
    }

    // Finalize modify tools - handle second click for trim/extend
    // Note: offset, fillet, chamfer are handled in handlePointerDown
    if (['trim', 'extend'].includes(tool) && modifyTarget && originRef.current) {
      const point = pointer;
      let result: { elements: EditorElement[]; deletedIds?: string[] } | null = null;
      
      if (tool === 'trim') {
        const trimmed = trimElement(modifyTarget, point, elements.filter(el => el.id !== modifyTarget.id));
        if (trimmed) {
          result = { elements: [trimmed], deletedIds: [] };
        }
      } else if (tool === 'extend') {
        const extended = extendElement(modifyTarget, point, elements.filter(el => el.id !== modifyTarget.id));
        if (extended) {
          result = { elements: [extended], deletedIds: [] };
        }
      }

      if (result) {
        if (result.deletedIds && result.deletedIds.length > 0) {
          result.deletedIds.forEach((id: string) => removeElement(id));
        }
        result.elements.forEach((el: EditorElement) => {
          if (el && el.id === modifyTarget.id) {
            updateElement(el.id, el);
          } else if (el) {
            addElement(el);
          }
        });
      }
      setModifyTarget(null);
      originRef.current = null;
      return;
    }
    
    // Reset modify target if clicking empty space
    if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool) && modifyTarget) {
      const stage = stageRef.current;
      if (stage) {
        const screenPos = stage.getPointerPosition();
        if (screenPos) {
          const hitShape = stage.getIntersection(screenPos);
          // If clicking empty space, reset target (except for trim/extend which need second click)
          if (!hitShape && (tool === 'offset' || tool === 'fillet' || tool === 'chamfer')) {
            setModifyTarget(null);
            originRef.current = null;
          }
        }
      }
    }

    // Finalize selection for select tool
    if (tool === 'select') {
      const stage = stageRef.current;
      if (stage) {
        // Always ensure stage is not draggable
        stage.setAttrs({ draggable: false });
        
        // Finalize selection window if we were selecting
        if (isSelectingRef.current && selectionWindow && selectionStartRef.current) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const start = transform.point(selectionStartRef.current);
          const end = transform.point({ x: selectionWindow.endX, y: selectionWindow.endY });
          
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y);
          
          // If selection window is very small, treat as click (already handled)
          if (width > 5 || height > 5) {
            // Calculate selection bounds
            const minX = Math.min(start.x, end.x);
            const maxX = Math.max(start.x, end.x);
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);
            
            // Select elements within bounds
            const selectedIds: string[] = [];
            elements.forEach((element) => {
              const layer = layers.find((l) => l.id === element.layerId);
              if (!layer || !layer.visible || layer.locked) return;
              
              // Get element bounds
              const elementX = element.x || 0;
              const elementY = element.y || 0;
              const elementWidth = (element as any).width || 0;
              const elementHeight = (element as any).height || 0;
              
              // Check if element intersects with selection rectangle
              const elementRight = elementX + elementWidth;
              const elementBottom = elementY + elementHeight;
              
              if (elementX <= maxX && elementRight >= minX && 
                  elementY <= maxY && elementBottom >= minY) {
                selectedIds.push(element.id);
              }
            });
            
            if (selectedIds.length > 0) {
              setSelectedElements(selectedIds);
            }
          }
        }
      }
      
      // Reset selection state
      isSelectingRef.current = false;
      setSelectionWindow(null);
      selectionStartRef.current = null;
    }

    // Eraser tool - finish erasing
    if (tool === 'erase' && isErasing) {
      // Reset eraser state
      setIsErasing(false);
      eraserPathRef.current = [];
      setEraserPosition(null);
      erasedElementsRef.current.clear();
      return;
    }

    // Finalize drawing
    if (!draftElement) return;

    if (draftElement.type === 'free') {
      const simplified = simplifyPoints(draftElement.points, 1.2);
      if (simplified.length >= 4) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
          points: simplified,
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      return;
    }

    if (draftElement.type === 'line') {
      const [x1, y1, x2, y2] = draftElement.points;
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len > 2) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      return;
    }

    if (draftElement.type === 'rectangle') {
      if (draftElement.width > 2 && draftElement.height > 2) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'circle') {
      if (draftElement.radius > 1) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    // Finish dimension - works like line tool, no notification
    if (draftElement && draftElement.type === 'dimension') {
      const dimensionElement = draftElement as any;
      const start = dimensionElement.startPoint || { x: 0, y: 0 };
      const end = dimensionElement.endPoint || { x: 0, y: 0 };
      const distance = dimensionElement.value || Math.hypot(end.x - start.x, end.y - start.y);
      
      if (distance > 2) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
          startPoint: start,
          endPoint: end,
          value: distance,
          text: `${(distance * drawingSettings.unitScale).toFixed(2)} ${drawingSettings.unit}`,
          x: start.x,
          y: start.y,
          fill: drawingSettings.fillColor || '#000000',
          style: drawingSettings.dimensionStyle,
        } as any);
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'ellipse') {
      if (draftElement.radiusX > 1 && draftElement.radiusY > 1) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'arc') {
      if (draftElement.radius > 1) {
        addElementWithPage({
          ...draftElement,
          id: nanoid(),
        });
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'wall') {
      const [x1, y1, x2, y2] = draftElement.points;
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len > 10) {
        const wall = createWallElement(
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          draftElement.thickness || 20,
          activeLayerId
        );
        // Apply drawing settings to wall
        const wallWithSettings = {
          ...wall,
          stroke: draftElement.stroke || ((drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : wall.stroke),
          strokeWidth: draftElement.strokeWidth || drawingSettings.strokeWidth || wall.strokeWidth,
          opacity: draftElement.opacity !== undefined ? draftElement.opacity : (drawingSettings.opacity !== undefined ? drawingSettings.opacity : wall.opacity),
          fill: (draftElement as any).fill || ((drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent'),
          dash: (draftElement as any).dash !== undefined ? (draftElement as any).dash : (drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : []),
        };
        addElementWithPage(wallWithSettings);
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'door') {
      const doorPreview = draftElement as DoorElement;
      const finalWidth = Math.max(60, doorPreview.width);
      if (finalWidth > 10) {
        const door = createDoorElement(
          { x: doorPreview.x, y: doorPreview.y },
          finalWidth,
          doorPreview.height || 5,
          doorPreview.swingAngle || 90,
          activeLayerId,
          doorPreview.wallId
        );
        // Apply drawing settings to door
        const doorWithSettings = {
          ...door,
          stroke: draftElement.stroke || ((drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : door.stroke),
          strokeWidth: draftElement.strokeWidth || drawingSettings.strokeWidth || door.strokeWidth,
          opacity: draftElement.opacity !== undefined ? draftElement.opacity : (drawingSettings.opacity !== undefined ? drawingSettings.opacity : door.opacity),
          fill: (draftElement as any).fill || ((drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent'),
          rotation: draftElement.rotation || 0,
          dash: (draftElement as any).dash !== undefined ? (draftElement as any).dash : (drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : []),
        };
        addElementWithPage(doorWithSettings);
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    if (draftElement.type === 'window') {
      const windowPreview = draftElement as WindowElement;
      const finalWidth = Math.max(30, windowPreview.width);
      if (finalWidth > 10) {
        const window = createWindowElement(
          { x: windowPreview.x, y: windowPreview.y },
          finalWidth,
          windowPreview.height || 8,
          activeLayerId,
          windowPreview.wallId
        );
        // Apply drawing settings to window
        const windowWithSettings = {
          ...window,
          stroke: draftElement.stroke || ((drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : window.stroke),
          strokeWidth: draftElement.strokeWidth || drawingSettings.strokeWidth || window.strokeWidth,
          opacity: draftElement.opacity !== undefined ? draftElement.opacity : (drawingSettings.opacity !== undefined ? drawingSettings.opacity : window.opacity),
          fill: (draftElement as any).fill || ((drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : 'transparent'),
          rotation: draftElement.rotation || 0,
          dash: (draftElement as any).dash !== undefined ? (draftElement as any).dash : (drawingSettings.lineType ? lineTypeToDash(drawingSettings.lineType) : []),
        };
        addElementWithPage(windowWithSettings);
      }
      setDraftElement(null);
      setIsDrawing(false);
      originRef.current = null;
      return;
    }

    setDraftElement(null);
    setIsDrawing(false);
    originRef.current = null;
  }, [selectionWindow, draftElement, tool, measureStart, measureEnd, isMoving, isRotating, modifyTarget, pointer, elements, activeLayerId, drawingSettings]);

  // Crosshair cursor
  const getCursor = () => {
    if (tool === 'pan') return 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'measure') return 'crosshair';
    if (tool === 'zoom') return 'zoom-in';
    return 'crosshair';
  };

  const visibleLayers = layers.filter((l) => l.visible);

  // Handle drag-drop from Block Library
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeLayerId || !stageRef.current) return;

    try {
      // Get the JSON data from the drag event
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const blockTemplate = JSON.parse(data) as {
        blockId?: string;
        id?: string;
        name?: string;
        category?: string;
        width?: number;
        height?: number;
        type?: string;
      };

      // Get drop position in screen coordinates
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Convert screen coordinates to stage coordinates
      const stage = stageRef.current;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const stagePoint = transform.point({ x: screenX, y: screenY });

      let catalogBlock: BlockDefinition | undefined;
      if (blockTemplate.blockId) {
        catalogBlock = catalogById[blockTemplate.blockId] || BLOCKS_BY_ID[blockTemplate.blockId];
      } else if (blockTemplate.id) {
        catalogBlock = catalogById[blockTemplate.id] || BLOCKS_BY_ID[blockTemplate.id];
      }

      const baseWidth = catalogBlock ? catalogBlock.width : blockTemplate.width || 100;
      const baseHeight = catalogBlock ? catalogBlock.height : blockTemplate.height || 100;

      const isFromBlocksPanel = Boolean(catalogBlock) || baseWidth > 100;
      const canvasWidth = isFromBlocksPanel ? baseWidth / 10 : baseWidth;
      const canvasHeight = isFromBlocksPanel ? baseHeight / 10 : baseHeight;

      const furnitureCategory = catalogBlock?.category || blockTemplate.category || 'furniture';

      // Create furniture element
      const furniture = createFurnitureElement(
        { x: stagePoint.x, y: stagePoint.y },
        canvasWidth,
        canvasHeight,
        furnitureCategory,
        activeLayerId,
        catalogBlock
          ? {
              blockId: catalogBlock.id,
              blockName: catalogBlock.name,
              manufacturer: catalogBlock.manufacturer,
              sku: catalogBlock.sku,
              tags: catalogBlock.tags,
              moduleClass: catalogBlock.moduleClass,
              depth: catalogBlock.depth ? catalogBlock.depth / 10 : undefined,
              metadata: { description: catalogBlock.description, blockId: catalogBlock.id },
            }
          : undefined,
      );
      // Apply drawing settings to furniture element
      const furnitureWithSettings = {
        ...furniture,
        stroke: (drawingSettings.strokeColor && drawingSettings.strokeColor.trim()) ? drawingSettings.strokeColor : (furniture.stroke || '#000000'),
        strokeWidth: drawingSettings.strokeWidth || furniture.strokeWidth || 1.5,
        opacity: drawingSettings.opacity !== undefined ? drawingSettings.opacity : (furniture.opacity || 1),
        fill: (drawingSettings.fillColor && drawingSettings.fillColor.trim()) ? drawingSettings.fillColor : (furniture.fill || 'transparent'),
        // Assign PDF page number if PDF is loaded
        pdfPageNumber: pdfBackground && pdfBackground.visible ? pdfBackground.currentPage : undefined,
      };
      addElement(furnitureWithSettings);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [activeLayerId, addElement, catalogById, drawingSettings]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-white"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.preventDefault();
        // Show context menu at click position
        if (selectedElementIds.length > 0) {
          setContextMenu({ x: e.clientX, y: e.clientY, elementId: selectedElementIds[0] });
        }
      }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-1 bg-slate-800/90 backdrop-blur rounded-lg p-1 shadow-lg">
        <button
          onClick={() => setStageTransform({ scale: Math.min(4, stageScale * 1.25), position: stagePosition })}
          className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-700 rounded transition-colors"
          title="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button
          onClick={() => setStageTransform({ scale: Math.max(0.1, stageScale * 0.8), position: stagePosition })}
          className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-700 rounded transition-colors"
          title="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <div className="w-full h-px bg-slate-600 my-0.5" />
        <button
          onClick={() => setStageTransform({ scale: 1, position: { x: 0, y: 0 } })}
          className="w-8 h-8 flex items-center justify-center text-cyan-400 hover:bg-slate-700 rounded transition-colors text-xs font-bold"
          title="Reset Zoom (Fit to Window)"
        >
          1:1
        </button>
        <button
          onClick={() => {
            // Fit all elements to window
            if (elements.length === 0) {
              setStageTransform({ scale: 1, position: { x: canvasSize.width / 2, y: canvasSize.height / 2 } });
              return;
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            elements.forEach(el => {
              const x = (el as any).x || 0;
              const y = (el as any).y || 0;
              const w = (el as any).width || (el as any).length || 100;
              const h = (el as any).height || (el as any).thickness || 100;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x + w);
              maxY = Math.max(maxY, y + h);
            });
            const contentWidth = maxX - minX + 100;
            const contentHeight = maxY - minY + 100;
            const scaleX = canvasSize.width / contentWidth;
            const scaleY = canvasSize.height / contentHeight;
            const newScale = Math.min(scaleX, scaleY, 2) * 0.9;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            setStageTransform({
              scale: newScale,
              position: {
                x: canvasSize.width / 2 - centerX * newScale,
                y: canvasSize.height / 2 - centerY * newScale,
              }
            });
          }}
          className="w-8 h-8 flex items-center justify-center text-emerald-400 hover:bg-slate-700 rounded transition-colors"
          title="Fit All to Window"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
          </svg>
        </button>
        <div className="text-[10px] text-slate-400 text-center px-1">
          {Math.round(stageScale * 100)}%
        </div>
      </div>

      {/* Rulers */}
      {snapSettings.showGrid && (
        <AutoCADRulers
          width={canvasSize.width}
          height={canvasSize.height}
          scale={stageScale}
          offsetX={stagePosition.x}
          offsetY={stagePosition.y}
          gridSize={snapSettings.gridSize}
        />
      )}

      {/* Canvas */}
      <Stage
        ref={(node) => {
          if (node && stageRef.current !== node) {
            stageRef.current = node;
            setStageInstance(node);
            // Also set as floor plan stage for Layout export (only if changed)
            const currentFloorPlanStage = useEditorStore.getState().floorPlanStage;
            if (currentFloorPlanStage !== node) {
              useEditorStore.getState().setFloorPlanStage(node);
            }
          }
        }}
        width={Math.max(canvasSize.width, 100)}
        height={Math.max(canvasSize.height, 100)}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        style={{ cursor: getCursor(), touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={(e) => {
          console.log('Stage onPointerDown event:', { tool, target: e.target });
          handlePointerDown(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDblClick={() => {
          // Finish dimension on double-click - no notification, works like line tool
          if (draftElement && draftElement.type === 'dimension') {
            const dimensionElement = draftElement as any;
            const start = dimensionElement.startPoint || { x: 0, y: 0 };
            const end = dimensionElement.endPoint || { x: 0, y: 0 };
            const distance = dimensionElement.value || Math.hypot(end.x - start.x, end.y - start.y);
            
            if (distance > 2) {
              addElement({
                ...draftElement,
                id: nanoid(),
                startPoint: start,
                endPoint: end,
                value: distance,
                text: `${(distance * drawingSettings.unitScale).toFixed(2)} ${drawingSettings.unit}`,
                x: start.x,
                y: start.y,
                fill: drawingSettings.fillColor || '#000000',
                style: drawingSettings.dimensionStyle,
              } as any);
            }
            setDraftElement(null);
            setIsDrawing(false);
            originRef.current = null;
            return;
          }
          
          // Finish polyline on double-click
          if (tool === 'polyline' && polylineRef.current.length >= 4) {
            addElement({
              id: nanoid(),
              type: 'polyline',
              layerId: activeLayerId,
              points: polylineRef.current,
              stroke: drawingSettings.strokeColor,
              strokeWidth: drawingSettings.strokeWidth,
              opacity: 1,
              rotation: 0,
              x: 0,
              y: 0,
            } as EditorElement);
            polylineRef.current = [];
            setDraftElement(null);
          }
        }}
        onDragEnd={(e) => {
          // Only update stage transform if stage itself was dragged (pan tool)
          // Don't update if elements were dragged (they handle their own position)
          const stage = e.target as Konva.Stage;
          // Only update if this is actually the stage being dragged, not an element
          // Check if the target is the stage itself and pan tool is active
          if (tool === 'pan' && e.target === stage) {
            setStageTransform({ position: { x: stage.x(), y: stage.y() } });
          }
          // Always disable stage dragging after any drag ends
          stage.setAttrs({ draggable: false });
        }}
      >
        {/* PDF Background Layer - Render before grid */}
        {pdfBackground && pdfBackground.visible && (
          <PDFBackgroundLayer
            imageData={pdfBackground.imageData}
            x={pdfBackground.x}
            y={pdfBackground.y}
            width={pdfBackground.width}
            height={pdfBackground.height}
            opacity={pdfBackground.opacity}
          />
        )}

        {/* Grid Layer - Render directly without nested Layer */}
        {snapSettings.showGrid && (
          <GridBackground
            zoom={stageScale}
            offsetX={stagePosition.x}
            offsetY={stagePosition.y}
            gridSize={snapSettings.gridSize}
            width={Math.max(canvasSize.width, window.innerWidth)}
            height={Math.max(canvasSize.height, window.innerHeight)}
            name="grid-layer"
            visible={snapSettings.showGrid}
          />
        )}

        {/* Drawing Layers */}
        {visibleLayers.map((layer) => (
          <KonvaLayer key={layer.id} name={`layer-${layer.id}`} listening={!layer.locked}>
            {elements
              .filter((el) => {
                // Filter by layer
                if (el.layerId !== layer.id) return false;
                // If PDF is loaded, only show elements for current page
                if (pdfBackground && pdfBackground.visible) {
                  const elementPage = (el as any).pdfPageNumber;
                  const currentPage = pdfBackground.currentPage;
                  // Show element if it belongs to current page, or if it has no page assigned (legacy elements)
                  return elementPage === undefined || elementPage === currentPage;
                }
                return true;
              })
              .map((element) => {
                if (element.type === 'line') {
                  const safePoints = (element.points || []).map(p => isNaN(p) ? 0 : p);
                  return (
                    <Line
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      points={safePoints}
                      x={element.x || 0}
                      y={element.y || 0}
                      rotation={(element as any).rotation || 0}
                      scaleX={(element as any).scaleX || 1}
                      scaleY={(element as any).scaleY || 1}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      opacity={element.opacity}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - let it handle erasing
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 10 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging line
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        if (element.type === 'line' && 'points' in node && typeof (node as any).points === 'function') {
                          const points = (node as any).points() as number[];
                          updateElement(element.id, {
                            points: points as any,
                            x: node.x(),
                            y: node.y(),
                          });
                        }
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                    />
                  );
                }
                if (element.type === 'polyline') {
                  const safePoints = (element.points || []).map(p => isNaN(p) ? 0 : p);
                  return (
                    <Line
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      points={safePoints}
                      x={element.x || 0}
                      y={element.y || 0}
                      rotation={(element as any).rotation || 0}
                      scaleX={(element as any).scaleX || 1}
                      scaleY={(element as any).scaleY || 1}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      opacity={element.opacity}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      closed={element.closed}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - handled by brush preview mode (don't erase immediately)
                        if (tool === 'erase' && !layer.locked) {
                          // Let the brush preview handle it - don't erase on click
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 10 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging polyline
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        if ('points' in node && typeof (node as any).points === 'function') {
                          const points = (node as any).points();
                          updateElement(element.id, {
                            points: points,
                            x: node.x(),
                            y: node.y(),
                          });
                        }
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
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
                      rotation={(element as any).rotation || 0}
                      scaleX={(element as any).scaleX || 1}
                      scaleY={(element as any).scaleY || 1}
                      fill={(element as any).fill || 'transparent'}
                      stroke={element.stroke || '#000000'}
                      strokeWidth={element.strokeWidth || 1.5}
                      opacity={element.opacity || 1}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - handled by brush preview mode (don't erase immediately)
                        if (tool === 'erase' && !layer.locked) {
                          // Let the brush preview handle it - don't erase on click
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 0 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging rectangle
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Rect;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            width: node.width() * node.scaleX(),
                            height: node.height() * node.scaleY(),
                            rotation: node.rotation(),
                          });
                          node.scaleX(1);
                          node.scaleY(1);
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
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
                      rotation={(element as any).rotation || 0}
                      scaleX={(element as any).scaleX || 1}
                      scaleY={(element as any).scaleY || 1}
                      fill={(element as any).fill || 'transparent'}
                      stroke={element.stroke || '#000000'}
                      strokeWidth={element.strokeWidth || 1.5}
                      opacity={element.opacity || 1}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - handled by brush preview mode (don't erase immediately)
                        if (tool === 'erase' && !layer.locked) {
                          // Let the brush preview handle it - don't erase on click
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 0 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging circle
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Circle;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            radius: node.radius() * node.scaleX(),
                            rotation: node.rotation(),
                          });
                          node.scaleX(1);
                          node.scaleY(1);
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
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
                      rotation={(element as any).rotation || 0}
                      scaleX={(element as any).scaleX || 1}
                      scaleY={(element as any).scaleY || 1}
                      fill={(element as any).fill || 'transparent'}
                      stroke={element.stroke || '#000000'}
                      strokeWidth={element.strokeWidth || 1.5}
                      opacity={element.opacity || 1}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - handled by brush preview mode (don't erase immediately)
                        if (tool === 'erase' && !layer.locked) {
                          // Let the brush preview handle it - don't erase on click
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 0 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging ellipse
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Ellipse;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            radiusX: node.radiusX() * node.scaleX(),
                            radiusY: node.radiusY() * node.scaleY(),
                            rotation: node.rotation(),
                          });
                          node.scaleX(1);
                          node.scaleY(1);
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
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
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - let it handle erasing
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 0 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging arc
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Arc;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            radius: node.outerRadius() * node.scaleX(),
                            rotation: node.rotation(),
                          });
                          node.scaleX(1);
                          node.scaleY(1);
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
                    />
                  );
                }
                if (element.type === 'free') {
                  const safePoints = (element.points || []).map(p => isNaN(p) ? 0 : p);
                  return (
                    <Line
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      points={safePoints}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      opacity={element.opacity}
                      dash={(element as any).dash !== undefined ? (element as any).dash : []}
                      tension={(element as any).tension || 0}
                      lineCap="round"
                      lineJoin="round"
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        // Allow modify tools to process first
                        if (['trim', 'extend', 'offset', 'fillet', 'chamfer'].includes(tool)) {
                          // Don't stop propagation - let modify tool handler process
                          return;
                        }
                        // Eraser tool - handled by brush preview mode (don't erase immediately)
                        if (tool === 'erase' && !layer.locked) {
                          // Let the brush preview handle it - don't erase on click
                          evt.cancelBubble = true;
                          return;
                        }
                        // Handle selection - modern, user-friendly approach
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                          
                          lastClickElementRef.current = element.id;
                          lastClickTimeRef.current = Date.now();
                        }
                        // For drawing/modify tools, don't stop propagation - let event bubble to stage
                        // This allows drawing/modify tools to work even when clicking on shapes
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      hitStrokeWidth={tool === 'select' || tool === 'pan' || tool === 'erase' ? 15 : -1}
                      perfectDrawEnabled={false}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging free hand line
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        if ('points' in node && typeof (node as any).points === 'function') {
                          const points = (node as any).points();
                          updateElement(element.id, {
                            points: points,
                            x: node.x(),
                            y: node.y(),
                          });
                        }
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                    />
                  );
                }
                if (element.type === 'furniture') {
                  return renderFurnitureElement(
                    element,
                    layer,
                    tool,
                    selectedElementIds,
                    setSelectedElements,
                    updateElement,
                    shapeRefs,
                    (el) => {
                      const node = shapeRefs.current[el.id] as Konva.Group;
                      if (node) {
                        const children = node.getChildren();
                        const baseRect = children.find((child) => child instanceof Konva.Rect || child instanceof Konva.Circle || child instanceof Konva.Ellipse);
                        if (baseRect) {
                          updateElement(el.id, {
                            x: node.x(),
                            y: node.y(),
                            width: (baseRect as any).width ? (baseRect as any).width() * node.scaleX() : (el as any).width,
                            height: (baseRect as any).height ? (baseRect as any).height() * node.scaleY() : (el as any).height,
                          });
                          node.scaleX(1);
                          node.scaleY(1);
                        } else {
                          updateElement(el.id, {
                            x: node.x(),
                            y: node.y(),
                          });
                        }
                      }
                    },
                    isSelectingRef,
                    setSelectionWindow,
                    selectionStartRef,
                    stageRef,
                    catalogById,
                  );
                }
                if (element.type === 'wall') {
                  const wallElement = element as any;
                  return (
                    <Group
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          removeElement(element.id);
                          return;
                        }
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                        }
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      onDblClick={() => {
                        // Double-click wall to open elevation view
                        useEditorStore.getState().setSelectedWallForElevation(element.id);
                        useEditorStore.getState().setViewMode('elevation');
                      }}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging wall
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                    >
                      {/* Transparent hit area for easy selection - calculate bounds from polygon */}
                      {wallElement.outerPoly && wallElement.outerPoly.length >= 4 && (() => {
                        const points = wallElement.outerPoly;
                        const xs = points.filter((_: any, i: number) => i % 2 === 0);
                        const ys = points.filter((_: any, i: number) => i % 2 === 1);
                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);
                        return (
                          <Rect 
                            x={minX} 
                            y={minY} 
                            width={maxX - minX} 
                            height={maxY - minY} 
                            fill="transparent" 
                            listening={true} 
                          />
                        );
                      })()}
                      {/* Wall outer polygon - AutoCAD style (with fill support) */}
                      {wallElement.outerPoly && (
                        <>
                          {/* Fill polygon if fill color is set */}
                          {(wallElement as any).fill && (wallElement as any).fill !== 'transparent' && (
                            <Line
                              points={wallElement.outerPoly}
                              closed
                              fill={(wallElement as any).fill || 'transparent'}
                              stroke={undefined}
                              strokeWidth={0}
                              opacity={wallElement.opacity || 1}
                              listening={false}
                            />
                          )}
                          {/* Stroke outline */}
                          <Line
                            points={wallElement.outerPoly}
                            closed
                            fill={undefined}
                            stroke={wallElement.stroke || '#000000'}
                            strokeWidth={wallElement.strokeWidth || 2}
                            opacity={wallElement.opacity || 1}
                            dash={(wallElement as any).dash !== undefined ? (wallElement as any).dash : []}
                            listening={false}
                          />
                        </>
                      )}
                      {/* Wall inner polygon - AutoCAD style (transparent, creates double line effect with outer) */}
                      {wallElement.innerPoly && (
                        <Line
                          points={wallElement.innerPoly}
                          closed
                          stroke="#FFFFFF"
                          strokeWidth={wallElement.strokeWidth || 2}
                          opacity={1}
                          listening={false}
                        />
                      )}
                      {/* Fallback: thick line if polygons not available - AutoCAD style */}
                      {!wallElement.outerPoly && wallElement.points && (
                        <Line
                          points={wallElement.points}
                          stroke={wallElement.stroke || '#000000'}
                          strokeWidth={wallElement.thickness || wallElement.strokeWidth || 20}
                          opacity={wallElement.opacity || 1}
                          dash={(wallElement as any).dash !== undefined ? (wallElement as any).dash : []}
                          listening={false}
                        />
                      )}
                    </Group>
                  );
                }
                if (element.type === 'door') {
                  const doorElement = element as any;
                  const swingRadius = doorElement.width || 80;
                  const swingAngle = doorElement.swingAngle || 90;
                  
                  return (
                    <Group
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          removeElement(element.id);
                          return;
                        }
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                        }
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging door
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Group;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                          });
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
                    >
                      {/* Transparent hit area for easy selection */}
                      <Rect
                        x={0}
                        y={0}
                        width={doorElement.width || 80}
                        height={doorElement.height || 5}
                        fill="transparent"
                        listening={true}
                      />
                      {/* Door opening - AutoCAD style (rectangle) */}
                      <Rect
                        x={0}
                        y={0}
                        width={doorElement.width || 80}
                        height={doorElement.height || 5}
                        fill={(doorElement as any).fill || 'transparent'}
                        stroke={doorElement.stroke || '#000000'}
                        strokeWidth={doorElement.strokeWidth || 2}
                        opacity={doorElement.opacity || 1}
                        dash={(doorElement as any).dash !== undefined ? (doorElement as any).dash : []}
                        listening={false}
                      />
                      {/* Door swing arc - AutoCAD style (dashed arc) */}
                      <Arc
                        x={0}
                        y={0}
                        innerRadius={0}
                        outerRadius={swingRadius}
                        angle={swingAngle}
                        rotation={0}
                        stroke={doorElement.stroke || '#000000'}
                        strokeWidth={1}
                        opacity={doorElement.opacity || 1}
                        dash={[4, 2]}
                        listening={false}
                      />
                      {/* Door panel - AutoCAD style (uses element dash) */}
                      <Line
                        points={[0, 0, doorElement.width || 80, 0]}
                        stroke={doorElement.stroke || '#000000'}
                        strokeWidth={doorElement.strokeWidth || 2}
                        opacity={doorElement.opacity || 1}
                        dash={(doorElement as any).dash !== undefined ? (doorElement as any).dash : []}
                        listening={false}
                      />
                    </Group>
                  );
                }
                if (element.type === 'window') {
                  const windowElement = element as any;
                  return (
                    <Group
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          removeElement(element.id);
                          return;
                        }
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          evt.evt.stopPropagation();
                          
                          // Cancel any ongoing selection window
                          isSelectingRef.current = false;
                          setSelectionWindow(null);
                          selectionStartRef.current = null;
                          
                          // Handle multi-selection with Shift key
                          if (evt.evt.shiftKey) {
                            // Toggle selection
                            if (selectedElementIds.includes(element.id)) {
                              setSelectedElements(selectedElementIds.filter(id => id !== element.id));
                            } else {
                              setSelectedElements([...selectedElementIds, element.id]);
                            }
                          } else {
                            // Single selection
                            setSelectedElements([element.id]);
                          }
                        }
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      onDragStart={(evt) => {
                        // Prevent stage from being dragged when dragging door
                        const stage = stageRef.current;
                        if (stage) {
                          stage.setAttrs({ draggable: false });
                        }
                        evt.evt.stopPropagation();
                      }}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                        // Ensure stage stays non-draggable after drag
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                        // Stop propagation to prevent stage from updating its transform
                        evt.evt.stopPropagation();
                        evt.cancelBubble = true;
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Group;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                          });
                        }
                        // Ensure stage stays non-draggable after transform
                        const stage = stageRef.current;
                        if (stage && tool === 'select') {
                          stage.setAttrs({ draggable: false });
                        }
                      }}
                    >
                      {/* Transparent hit area for easy selection */}
                      <Rect
                        x={0}
                        y={0}
                        width={windowElement.width || 100}
                        height={windowElement.height || 8}
                        fill="transparent"
                        listening={true}
                      />
                      {/* Window frame - AutoCAD style (double line) */}
                      <Rect
                        x={0}
                        y={0}
                        width={windowElement.width || 100}
                        height={windowElement.height || 8}
                        fill={(windowElement as any).fill || 'transparent'}
                        stroke={windowElement.stroke || '#000000'}
                        strokeWidth={windowElement.strokeWidth || 2}
                        opacity={windowElement.opacity || 1}
                        dash={(windowElement as any).dash !== undefined ? (windowElement as any).dash : []}
                        listening={false}
                      />
                      {/* Inner frame line - AutoCAD style - only show if width is sufficient */}
                      {windowElement.width > 4 && (
                        <Rect
                          x={2}
                          y={2}
                          width={(windowElement.width || 100) - 4}
                          height={Math.max(0, (windowElement.height || 8) - 4)}
                          fill={(windowElement as any).fill || 'transparent'}
                          stroke={windowElement.stroke || '#000000'}
                          strokeWidth={0.5}
                          opacity={windowElement.opacity || 1}
                          dash={(windowElement as any).dash !== undefined ? (windowElement as any).dash : []}
                          listening={false}
                        />
                      )}
                      {/* Window mullion - AutoCAD style (vertical line) - only show if width is sufficient */}
                      {windowElement.width > 20 && (
                        <Line
                          points={[
                            (windowElement.width || 100) / 2,
                            0,
                            (windowElement.width || 100) / 2,
                            windowElement.height || 8,
                          ]}
                          stroke={windowElement.stroke || '#000000'}
                          strokeWidth={0.5}
                          opacity={windowElement.opacity || 1}
                          listening={false}
                        />
                      )}
                    </Group>
                  );
                }
                if (element.type === 'text') {
                  const textElement = element as any;
                  const isSelected = selectedElementIds.includes(element.id);
                  const isEditing = editingTextId === element.id;
                  
                  return (
                    <Group
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      draggable={!layer.locked && tool === 'select' && !isEditing}
                      onPointerDown={(evt) => {
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          removeElement(element.id);
                          return;
                        }
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          setSelectedElements([element.id]);
                          // Start editing text immediately when selected with select tool
                          // Single click or double-click both start editing
                          setEditingTextId(element.id);
                          setEditingTextValue(textElement.text || '');
                        }
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                        });
                      }}
                      onTransformEnd={() => {
                        const node = shapeRefs.current[element.id] as Konva.Group;
                        if (node) {
                          updateElement(element.id, {
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                          });
                        }
                      }}
                    >
                      {/* Selection highlight - dynamic based on text content */}
                      {isSelected && !isEditing && (() => {
                        const textLines = textElement.text ? textElement.text.split('\n') : [];
                        const maxLineLength = Math.max(...textLines.map((line: string) => line.length), 1);
                        const lineCount = Math.max(textLines.length, 1);
                        const fontSize = textElement.fontSize || 16;
                        const highlightWidth = Math.max(200, maxLineLength * fontSize * 0.6);
                        const highlightHeight = lineCount * fontSize * 1.4 + 10;
                        return (
                          <Rect
                            x={-5}
                            y={-5}
                            width={highlightWidth}
                            height={highlightHeight}
                            fill="rgba(66, 153, 225, 0.1)"
                            stroke="#4299E1"
                            strokeWidth={1}
                            listening={false}
                            perfectDrawEnabled={false}
                          />
                        );
                      })()}
                      {/* Text rendering - dynamic and user-friendly with multi-line support */}
                      {textElement.text && textElement.text.includes('\n') ? (
                        // Multi-line text - render each line separately
                        textElement.text.split('\n').map((line: string, index: number) => (
                          <Text
                            key={index}
                            text={line || ' '}
                            fontSize={textElement.fontSize || 16}
                            fontFamily={textElement.fontFamily || 'Arial'}
                            align={textElement.align || 'left'}
                            verticalAlign={index === 0 ? textElement.verticalAlign || 'middle' : 'top'}
                            fill={element.stroke || '#000000'}
                            stroke={undefined}
                            strokeWidth={0}
                            opacity={element.opacity || 1}
                            listening={false}
                            perfectDrawEnabled={false}
                            fontStyle={textElement.fontSize >= 18 ? 'bold' : 'normal'}
                            lineHeight={1.4}
                            y={index * (textElement.fontSize || 16) * 1.4}
                          />
                        ))
                      ) : (
                        // Single line text
                        <Text
                          text={textElement.text || ''}
                          fontSize={textElement.fontSize || 16}
                          fontFamily={textElement.fontFamily || 'Arial'}
                          align={textElement.align || 'left'}
                          verticalAlign={textElement.verticalAlign || 'middle'}
                          fill={element.stroke || '#000000'}
                          stroke={undefined}
                          strokeWidth={0}
                          opacity={element.opacity || 1}
                          listening={false}
                          perfectDrawEnabled={false}
                          fontStyle={textElement.fontSize >= 18 ? 'bold' : 'normal'}
                          lineHeight={1.4}
                        />
                      )}
                      {/* Hit area for easier selection - dynamic based on text content with multi-line support */}
                      <Rect
                        x={-5}
                        y={-5}
                        width={(() => {
                          if (!textElement.text) return 150;
                          const textLines = textElement.text.split('\n');
                          const maxLineLength = Math.max(...textLines.map((line: string) => line.length), 1);
                          return Math.max(150, maxLineLength * (textElement.fontSize || 16) * 0.6);
                        })()}
                        height={(() => {
                          if (!textElement.text) return (textElement.fontSize || 16) + 10;
                          const lineCount = textElement.text.split('\n').length;
                          return lineCount * (textElement.fontSize || 16) * 1.4 + 10;
                        })()}
                        fill="transparent"
                        stroke="transparent"
                        listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      />
                      {/* Show placeholder hint only when text is empty AND not currently editing */}
                      {!textElement.text && editingTextId !== element.id && (
                        <Text
                          text="Click to add text"
                          fontSize={textElement.fontSize || 16}
                          fontFamily={textElement.fontFamily || 'Arial'}
                          align={textElement.align || 'left'}
                          verticalAlign={textElement.verticalAlign || 'middle'}
                          fill="#999999"
                          opacity={0.5}
                          listening={false}
                          perfectDrawEnabled={false}
                        />
                      )}
                    </Group>
                  );
                }
                if (element.type === 'dimension') {
                  const dimensionElement = element as any;
                  const start = dimensionElement.startPoint || { x: element.x, y: element.y };
                  const end = dimensionElement.endPoint || { 
                    x: element.x + (dimensionElement.value || 100), 
                    y: element.y 
                  };
                  
                  const strokeWidth = element.strokeWidth || drawingSettings.strokeWidth || 1.5;
                  const totalDistance = dimensionElement.value || Math.hypot(end.x - start.x, end.y - start.y);
                  const deltaX = end.x - start.x;
                  const deltaY = end.y - start.y;
                  const angle = Math.atan2(deltaY, deltaX);
                  const perpAngle = angle + Math.PI / 2;
                  const dimStyle = dimensionElement.style || drawingSettings.dimensionStyle;
                  
                  // Simple scale calculation - show measurements at regular intervals
                  const scaleValue = totalDistance * drawingSettings.unitScale;
                  const numMarkers = Math.max(5, Math.min(20, Math.floor(totalDistance / 30)));
                  
                  // Format value
                  const formatValue = (val: number): string => {
                    if (drawingSettings.unit === 'mm' || drawingSettings.unit === 'cm') {
                      return val.toFixed(1);
                    } else if (drawingSettings.unit === 'm') {
                      return val.toFixed(3);
                    }
                    return val.toFixed(2);
                  };

                  const labelText = dimensionElement.text || `${formatValue(scaleValue)} ${drawingSettings.unit}`;
                  const labelFontSize = dimStyle.fontSize ?? 12;
                  const labelWidth = Math.max(80, labelText.length * (labelFontSize * 0.7));
                  const labelHeight = labelFontSize * 1.8;
                  
                  return (
                    <Group
                      key={element.id}
                      id={element.id}
                      ref={(node) => {
                        shapeRefs.current[element.id] = node;
                      }}
                      draggable={!layer.locked && tool === 'select'}
                      onPointerDown={(evt) => {
                        if (tool === 'erase' && !layer.locked) {
                          evt.cancelBubble = true;
                          removeElement(element.id);
                          return;
                        }
                        if (tool === 'select' && !layer.locked) {
                          evt.cancelBubble = true;
                          setSelectedElements([element.id]);
                        }
                      }}
                      listening={tool === 'select' || tool === 'pan' || tool === 'erase'}
                      onDragEnd={(evt) => {
                        const node = evt.target;
                        const deltaX = node.x() - element.x;
                        const deltaY = node.y() - element.y;
                        updateElement(element.id, {
                          x: node.x(),
                          y: node.y(),
                          startPoint: { x: start.x + deltaX, y: start.y + deltaY },
                          endPoint: { x: end.x + deltaX, y: end.y + deltaY },
                        });
                      }}
                    >
                      {/* Main scale line - uses element dash */}
                      <Line
                        points={[start.x, start.y, end.x, end.y]}
                        stroke={element.stroke || '#000000'}
                        strokeWidth={strokeWidth}
                        opacity={element.opacity || 1}
                        dash={(element as any).dash !== undefined ? (element as any).dash : []}
                        listening={false}
                      />

                        {dimStyle.showExtensions && (
                          <>
                            <Line
                              points={[
                                start.x,
                                start.y,
                                start.x + Math.cos(perpAngle) * 12,
                                start.y + Math.sin(perpAngle) * 12,
                              ]}
                              stroke={element.stroke || '#000000'}
                              strokeWidth={strokeWidth * 0.8}
                              opacity={element.opacity || 1}
                              listening={false}
                            />
                            <Line
                              points={[
                                end.x,
                                end.y,
                                end.x + Math.cos(perpAngle) * 12,
                                end.y + Math.sin(perpAngle) * 12,
                              ]}
                              stroke={element.stroke || '#000000'}
                              strokeWidth={strokeWidth * 0.8}
                              opacity={element.opacity || 1}
                              listening={false}
                            />
                          </>
                        )}
                      
                      {/* Simplified scale markers - fewer, cleaner */}
                      {Array.from({ length: numMarkers + 1 }).map((_, i) => {
                        const t = i / numMarkers;
                        const markerX = start.x + deltaX * t;
                        const markerY = start.y + deltaY * t;
                        const isStart = i === 0;
                        const isEnd = i === numMarkers;
                        const isMajor = isStart || isEnd || i % Math.ceil(numMarkers / 4) === 0;
                        
                        // Tick mark length - simpler sizing
                        const tickLen = isMajor ? strokeWidth * 5 : strokeWidth * 2.5;
                        const tickX1 = markerX - Math.cos(perpAngle) * tickLen;
                        const tickY1 = markerY - Math.sin(perpAngle) * tickLen;
                        const tickX2 = markerX + Math.cos(perpAngle) * tickLen;
                        const tickY2 = markerY + Math.sin(perpAngle) * tickLen;
                        
                        return (
                          <Line
                            key={`marker-${i}`}
                            points={[tickX1, tickY1, tickX2, tickY2]}
                            stroke={element.stroke || '#000000'}
                            strokeWidth={isMajor ? strokeWidth : strokeWidth * 0.6}
                            opacity={element.opacity || 1}
                            listening={false}
                          />
                        );
                      })}
                      
                        {/* Show total measurement at midpoint - user friendly */}
                        <Group
                          x={(start.x + end.x) / 2 - Math.cos(perpAngle) * (strokeWidth * 10)}
                          y={(start.y + end.y) / 2 - Math.sin(perpAngle) * (strokeWidth * 10)}
                        >
                          <Rect
                            x={-labelWidth / 2}
                            y={-labelHeight / 2}
                            width={labelWidth}
                            height={labelHeight}
                            fill="#1e293b"
                            stroke={element.stroke || '#00bcd4'}
                            strokeWidth={1}
                            cornerRadius={4}
                            opacity={element.opacity || 1}
                            listening={false}
                          />
                          <Text
                            text={labelText}
                            fontSize={labelFontSize}
                            fontFamily="Arial"
                            fontStyle="bold"
                            fill="#00bcd4"
                            width={labelWidth}
                            opacity={element.opacity || 1}
                            listening={false}
                            align="center"
                            verticalAlign="middle"
                            offsetX={labelWidth / 2}
                            offsetY={labelFontSize / 2}
                          />
                        </Group>
                      
                      {/* Start and end point markers */}
                      <Circle
                        x={start.x}
                        y={start.y}
                        radius={strokeWidth * 2}
                        fill={element.stroke || '#000000'}
                        opacity={element.opacity || 1}
                        listening={false}
                      />
                      <Circle
                        x={end.x}
                        y={end.y}
                        radius={strokeWidth * 2}
                        fill={element.stroke || '#000000'}
                        opacity={element.opacity || 1}
                        listening={false}
                      />
                        {dimStyle.showTicks && (
                          <>
                            <Line
                              points={[
                                start.x,
                                start.y,
                                start.x + Math.cos(perpAngle + Math.PI / 4) * 8,
                                start.y + Math.sin(perpAngle + Math.PI / 4) * 8,
                              ]}
                              stroke={element.stroke || '#000000'}
                              strokeWidth={strokeWidth * 0.8}
                              opacity={element.opacity || 1}
                              listening={false}
                            />
                            <Line
                              points={[
                                end.x,
                                end.y,
                                end.x + Math.cos(perpAngle - Math.PI / 4) * 8,
                                end.y + Math.sin(perpAngle - Math.PI / 4) * 8,
                              ]}
                              stroke={element.stroke || '#000000'}
                              strokeWidth={strokeWidth * 0.8}
                              opacity={element.opacity || 1}
                              listening={false}
                            />
                          </>
                        )}
                    </Group>
                  );
                }
                return null;
              })}
          </KonvaLayer>
        ))}

        {/* UI Overlay Layer - Combined all UI overlays into one layer for better performance */}
        <KonvaLayer name="ui-overlay-layer" listening={false}>
          {/* Eraser Preview */}
          {tool === 'erase' && eraserPosition && (
            <Group name="eraser-preview-group">
              {/* Show eraser brush circle at current position */}
              <Circle
                x={eraserPosition.x}
                y={eraserPosition.y}
                radius={(drawingSettings.strokeWidth || 10) * 2}
                fill="rgba(255, 0, 0, 0.2)"
                stroke="rgba(255, 0, 0, 0.6)"
                strokeWidth={2}
                dash={[5, 5]}
                perfectDrawEnabled={false}
              />
              {/* Show eraser path (brush stroke preview) */}
              {eraserPathRef.current.length > 1 && (
                <Line
                  points={eraserPathRef.current.flatMap(p => [p.x, p.y])}
                  stroke="rgba(255, 0, 0, 0.4)"
                  strokeWidth={(drawingSettings.strokeWidth || 10) * 4}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                  perfectDrawEnabled={false}
                  listening={false}
                />
              )}
            </Group>
          )}

          {/* Draft Element Preview */}
          {draftElement && (
            <Group name="draft-preview-group">
            {draftElement.type === 'line' && (
              <Line
                points={draftElement.points}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'polyline' && (
              <Line
                points={draftElement.points}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'circle' && (
              <Circle
                x={draftElement.x}
                y={draftElement.y}
                radius={draftElement.radius}
                fill={(draftElement as any).fill || 'transparent'}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'ellipse' && (
              <Ellipse
                x={draftElement.x}
                y={draftElement.y}
                radiusX={draftElement.radiusX}
                radiusY={draftElement.radiusY}
                fill={(draftElement as any).fill || 'transparent'}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'rectangle' && (
              <Rect
                x={draftElement.x}
                y={draftElement.y}
                width={draftElement.width}
                height={draftElement.height}
                fill={(draftElement as any).fill || 'transparent'}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'arc' && (
              <Arc
                x={draftElement.x}
                y={draftElement.y}
                innerRadius={0}
                outerRadius={draftElement.radius}
                angle={draftElement.endAngle - draftElement.startAngle}
                rotation={draftElement.startAngle + draftElement.rotation}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                dash={[5, 5]}
              />
            )}
            {draftElement.type === 'free' && (
              <Line
                points={draftElement.points}
                stroke={draftElement.stroke}
                strokeWidth={draftElement.strokeWidth}
                opacity={draftElement.opacity * 0.8}
                tension={(draftElement as any).tension || 0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {draftElement.type === 'wall' && 'points' in draftElement && (() => {
              const wallPoints = draftElement.points;
              const thickness = (draftElement as any).thickness || 20;
              const [x1, y1, x2, y2] = wallPoints;
              
              // Calculate perpendicular vector for wall thickness
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.hypot(dx, dy);
              if (len < 0.1) {
                // Fallback: simple thick line
                return (
                  <Line
                    points={wallPoints}
                    stroke={draftElement.stroke}
                    strokeWidth={thickness}
                    opacity={draftElement.opacity * 0.8}
                    dash={[5, 5]}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              }
              
              // Calculate perpendicular offset
              const perpX = (-dy / len) * (thickness / 2);
              const perpY = (dx / len) * (thickness / 2);
              const wallAngle = Math.atan2(dy, dx);
              const perpAngle = wallAngle + Math.PI / 2;
              
              // Create outer polygon (double-line wall effect)
              const outerPoly = [
                x1 + perpX, y1 + perpY,
                x2 + perpX, y2 + perpY,
                x2 - perpX, y2 - perpY,
                x1 - perpX, y1 - perpY,
              ];
              
              // Inner polygon (white fill for double-line effect)
              const innerOffset = thickness * 0.3;
              const innerPerpX = (-dy / len) * (innerOffset / 2);
              const innerPerpY = (dx / len) * (innerOffset / 2);
              const innerPoly = [
                x1 + innerPerpX, y1 + innerPerpY,
                x2 + innerPerpX, y2 + innerPerpY,
                x2 - innerPerpX, y2 - innerPerpY,
                x1 - innerPerpX, y1 - innerPerpY,
              ];
              
              const dimensionOffset = 25;
              const labelPoint = {
                x: (x1 + x2) / 2 + Math.cos(perpAngle) * dimensionOffset,
                y: (y1 + y2) / 2 + Math.sin(perpAngle) * dimensionOffset,
              };
              const wallLength = Math.hypot(x2 - x1, y2 - y1);
              const convertedLength = wallLength * (drawingSettings.unitScale || 1);
              const unitLabel = drawingSettings.unit || 'mm';
              const lengthLabel = `${convertedLength.toFixed(convertedLength >= 100 ? 0 : 1)} ${unitLabel}`;
              const dimLinePoints = [
                x1 + Math.cos(perpAngle) * dimensionOffset,
                y1 + Math.sin(perpAngle) * dimensionOffset,
                x2 + Math.cos(perpAngle) * dimensionOffset,
                y2 + Math.sin(perpAngle) * dimensionOffset,
              ];

              return (
                <>
                  {/* Outer polygon - AutoCAD style with fill support */}
                  <>
                    {/* Fill polygon if fill color is set */}
                    {(draftElement as any).fill && (draftElement as any).fill !== 'transparent' && (
                      <Line
                        points={outerPoly}
                        closed
                        fill={(draftElement as any).fill || 'transparent'}
                        stroke={undefined}
                        strokeWidth={0}
                        opacity={draftElement.opacity * 0.8}
                        listening={false}
                      />
                    )}
                    {/* Stroke outline */}
                    <Line
                      points={outerPoly}
                      closed
                      fill={undefined}
                      stroke={draftElement.stroke || '#000000'}
                      strokeWidth={draftElement.strokeWidth || 2}
                      opacity={draftElement.opacity * 0.8}
                      dash={[5, 5]}
                      listening={false}
                    />
                  </>
                  {/* Inner polygon - AutoCAD style (white fill for double-line effect) */}
                  <Line
                    points={innerPoly}
                    closed
                    stroke="#FFFFFF"
                    strokeWidth={draftElement.strokeWidth || 2}
                    opacity={0.8}
                    dash={[5, 5]}
                    listening={false}
                  />
                  {/* Temporary dimension display */}
                  {wallLength > 10 && (
                    <Group listening={false}>
                      <Line
                        points={dimLinePoints}
                        stroke="#3b82f6"
                        strokeWidth={1}
                        dash={[4, 4]}
                        opacity={0.8}
                      />
                      <Text
                        x={labelPoint.x}
                        y={labelPoint.y - 12}
                        text={lengthLabel}
                        fontSize={12}
                        fill="#3b82f6"
                        fontStyle="bold"
                        align="center"
                        offsetX={lengthLabel.length * 3}
                      />
                    </Group>
                  )}
                </>
              );
            })()}
            {draftElement.type === 'door' && (() => {
              const doorElement = draftElement as any;
              const swingRadius = doorElement.width || 80;
              const swingAngle = doorElement.swingAngle || 90;
              
              return (
                <Group
                  x={doorElement.x}
                  y={doorElement.y}
                  rotation={doorElement.rotation || 0}
                >
                  {/* Door opening - AutoCAD style */}
                  <Rect
                    x={0}
                    y={0}
                    width={doorElement.width || 80}
                    height={doorElement.height || 5}
                    fill={(draftElement as any).fill || 'transparent'}
                    stroke={draftElement.stroke || '#000000'}
                    strokeWidth={doorElement.strokeWidth || 2}
                    opacity={doorElement.opacity * 0.8}
                    dash={[5, 5]}
                    listening={false}
                  />
                  {/* Door swing arc - AutoCAD style (dashed arc) */}
                  <Arc
                    x={0}
                    y={0}
                    innerRadius={0}
                    outerRadius={swingRadius}
                    angle={swingAngle}
                    rotation={0}
                    stroke={draftElement.stroke || '#000000'}
                    strokeWidth={1}
                    opacity={doorElement.opacity * 0.8}
                    dash={[4, 2]}
                    listening={false}
                  />
                  {/* Door panel - AutoCAD style (solid line) */}
                  <Line
                    points={[0, 0, doorElement.width || 80, 0]}
                    stroke={draftElement.stroke || '#000000'}
                    strokeWidth={doorElement.strokeWidth || 2}
                    opacity={doorElement.opacity * 0.8}
                    dash={[5, 5]}
                    listening={false}
                  />
                </Group>
              );
            })()}
            {draftElement.type === 'window' && (() => {
              const windowElement = draftElement as any;
              
              return (
                <Group
                  x={windowElement.x}
                  y={windowElement.y}
                  rotation={windowElement.rotation || 0}
                >
                  {/* Window frame - AutoCAD style (double line) */}
                  <Rect
                    x={0}
                    y={0}
                    width={Math.max(10, windowElement.width || 0)}
                    height={windowElement.height || 8}
                    fill={(draftElement as any).fill || 'transparent'}
                    stroke={draftElement.stroke || '#000000'}
                    strokeWidth={windowElement.strokeWidth || 2}
                    opacity={windowElement.opacity * 0.8}
                    dash={[5, 5]}
                    listening={false}
                  />
                  {/* Inner frame line - AutoCAD style - only show if width is sufficient */}
                  {windowElement.width > 4 && (
                    <Rect
                      x={2}
                      y={2}
                      width={Math.max(0, (windowElement.width || 0) - 4)}
                      height={Math.max(0, (windowElement.height || 8) - 4)}
                      fill={(draftElement as any).fill || 'transparent'}
                      stroke={draftElement.stroke || '#000000'}
                      strokeWidth={0.5}
                      opacity={windowElement.opacity * 0.8}
                      dash={[5, 5]}
                      listening={false}
                    />
                  )}
                  {/* Window mullion - AutoCAD style (vertical line) - only show if width is sufficient */}
                  {windowElement.width > 20 && (
                    <Line
                      points={[
                        (windowElement.width || 0) / 2,
                        0,
                        (windowElement.width || 0) / 2,
                        windowElement.height || 8,
                      ]}
                      stroke={draftElement.stroke || '#000000'}
                      strokeWidth={0.5}
                      opacity={windowElement.opacity * 0.8}
                      dash={[5, 5]}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })()}
            </Group>
          )}

          {/* Dimension Tool Preview - Scale/Ruler - works like line tool */}
          {draftElement && draftElement.type === 'dimension' && (() => {
          const dimensionElement = draftElement as any;
          const dimensionStart = dimensionElement.startPoint || { x: 0, y: 0 };
          const dimensionEnd = dimensionElement.endPoint || { x: 0, y: 0 };
          
          const strokeWidth = drawingSettings.strokeWidth || 1.5;
          const currentEnd = dimensionEnd;
          const deltaX = currentEnd.x - dimensionStart.x;
          const deltaY = currentEnd.y - dimensionStart.y;
          const totalDistance = Math.hypot(deltaX, deltaY);
          const angle = Math.atan2(deltaY, deltaX);
          const perpAngle = angle + Math.PI / 2;
          const dimStyle = drawingSettings.dimensionStyle;
          
          const scaleValue = totalDistance * drawingSettings.unitScale;
          const numMarkers = totalDistance > 1 ? Math.max(5, Math.min(20, Math.floor(totalDistance / 30))) : 0;
          
          const formatValue = (val: number): string => {
            if (drawingSettings.unit === 'mm' || drawingSettings.unit === 'cm') {
              return val.toFixed(1);
            } else if (drawingSettings.unit === 'm') {
              return val.toFixed(3);
            }
            return val.toFixed(2);
          };

          const labelText = `${formatValue(scaleValue)} ${drawingSettings.unit}`;
          const labelFontSize = dimStyle.fontSize ?? 12;
          const labelWidth = Math.max(80, labelText.length * (labelFontSize * 0.7));
          const labelHeight = labelFontSize * 1.8;
          
          return (
            <Group name="dimension-preview-group">
              {/* Main scale line - solid by default */}
              <Line
                points={[dimensionStart.x, dimensionStart.y, currentEnd.x, currentEnd.y]}
                stroke={drawingSettings.strokeColor}
                strokeWidth={strokeWidth}
                opacity={0.8}
              />

              {dimStyle.showExtensions && (
                <>
                  <Line
                    points={[
                      dimensionStart.x,
                      dimensionStart.y,
                      dimensionStart.x + Math.cos(perpAngle) * 12,
                      dimensionStart.y + Math.sin(perpAngle) * 12,
                    ]}
                    stroke={drawingSettings.strokeColor}
                    strokeWidth={strokeWidth * 0.8}
                    opacity={0.6}
                  />
                  <Line
                    points={[
                      currentEnd.x,
                      currentEnd.y,
                      currentEnd.x + Math.cos(perpAngle) * 12,
                      currentEnd.y + Math.sin(perpAngle) * 12,
                    ]}
                    stroke={drawingSettings.strokeColor}
                    strokeWidth={strokeWidth * 0.8}
                    opacity={0.6}
                  />
                </>
              )}
              
              {/* Simplified scale markers - fewer, cleaner */}
              {Array.from({ length: numMarkers + 1 }).map((_, i) => {
                const t = i / numMarkers;
                const markerX = dimensionStart.x + deltaX * t;
                const markerY = dimensionStart.y + deltaY * t;
                const isStart = i === 0;
                const isEnd = i === numMarkers;
                const isMajor = isStart || isEnd || i % Math.ceil(numMarkers / 4) === 0;
                
                const tickLen = isMajor ? strokeWidth * 5 : strokeWidth * 2.5;
                const tickX1 = markerX - Math.cos(perpAngle) * tickLen;
                const tickY1 = markerY - Math.sin(perpAngle) * tickLen;
                const tickX2 = markerX + Math.cos(perpAngle) * tickLen;
                const tickY2 = markerY + Math.sin(perpAngle) * tickLen;
                
                return (
                  <Line
                    key={`preview-tick-${i}`}
                    points={[tickX1, tickY1, tickX2, tickY2]}
                    stroke={drawingSettings.strokeColor}
                    strokeWidth={isMajor ? strokeWidth : strokeWidth * 0.6}
                    opacity={0.8}
                  />
                );
              })}
              
              {/* Total measurement at midpoint - user friendly */}
              {totalDistance > 10 && (
                <Group
                  x={(dimensionStart.x + currentEnd.x) / 2 - Math.cos(perpAngle) * (strokeWidth * 10)}
                  y={(dimensionStart.y + currentEnd.y) / 2 - Math.sin(perpAngle) * (strokeWidth * 10)}
                >
                  <Rect
                    x={-labelWidth / 2}
                    y={-labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    fill="#1e293b"
                    stroke={drawingSettings.strokeColor || '#00bcd4'}
                    strokeWidth={1}
                    cornerRadius={4}
                    opacity={0.9}
                  />
                  <Text
                    text={labelText}
                    fontSize={labelFontSize}
                    fontFamily="Arial"
                    fontWeight="bold"
                    fill="#00bcd4"
                    width={labelWidth}
                    opacity={1}
                    align="center"
                    verticalAlign="middle"
                    offsetX={labelWidth / 2}
                    offsetY={labelFontSize / 2}
                  />
                </Group>
              )}
              
              {/* End point markers */}
              <Circle
                x={dimensionStart.x}
                y={dimensionStart.y}
                radius={strokeWidth * 2}
                fill={drawingSettings.strokeColor}
                opacity={0.8}
                listening={false}
              />
              <Circle
                x={currentEnd.x}
                y={currentEnd.y}
                radius={strokeWidth * 2}
                fill={drawingSettings.strokeColor}
                opacity={0.6}
                listening={false}
              />
            </Group>
          );
        })()}

          {/* Measure Tool Layer */}
          {tool === 'measure' && measureStart && (
            <Group name="measure-group">
            <Line
              points={[
                measureStart.x,
                measureStart.y,
                measureEnd ? measureEnd.x : pointer.x,
                measureEnd ? measureEnd.y : pointer.y,
              ]}
              stroke="#3b82f6"
              strokeWidth={1.5}
              dash={[5, 5]}
            />
            {measureStart && (
              <Circle
                x={measureStart.x}
                y={measureStart.y}
                radius={4}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={1}
              />
            )}
            {measureEnd && (
              <>
                <Circle
                  x={measureEnd.x}
                  y={measureEnd.y}
                  radius={4}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth={1}
                />
                <Text
                  x={(measureStart.x + measureEnd.x) / 2}
                  y={(measureStart.y + measureEnd.y) / 2 - 15}
                  text={formatMeasureText(
                    calculateMeasure(measureStart, measureEnd),
                    drawingSettings.unit,
                    drawingSettings.unitScale
                  )}
                  fontSize={12}
                  fill="#fff"
                  padding={4}
                  align="center"
                />
              </>
            )}
            </Group>
          )}

          {/* Smart Guides Layer */}
          <Group name="guides-group">
            <SmartGuides
              guides={smartGuides}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </Group>

          {/* Selection Window Layer */}
          {selectionWindow && (
            <Group name="selection-group">
              <SelectionWindow {...selectionWindow} />
            </Group>
          )}

          {/* Snap Point Indicator */}
          {snapPoint && (
            <Group name="snap-group">
              <Circle
                x={snapPoint.x}
                y={snapPoint.y}
                radius={5}
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={1}
              />
            </Group>
          )}

          {/* Crosshair */}
          <Group name="crosshair-group">
            <Line
              points={[pointer.x - 20, pointer.y, pointer.x + 20, pointer.y]}
              stroke="#666"
              strokeWidth={0.5}
              dash={[2, 2]}
              opacity={0.5}
            />
            <Line
              points={[pointer.x, pointer.y - 20, pointer.x, pointer.y + 20]}
              stroke="#666"
              strokeWidth={0.5}
              dash={[2, 2]}
              opacity={0.5}
            />
          </Group>

          {/* Remote collaborators */}
          <Group name="collaboration-presence">
            {presence.map((user) => (
              <Group key={user.userId}>
                <Circle
                  x={user.pointer.x}
                  y={user.pointer.y}
                  radius={6}
                  fill="rgba(59,130,246,0.6)"
                  stroke="#1d4ed8"
                  strokeWidth={1}
                  listening={false}
                />
                <Text
                  x={user.pointer.x + 8}
                  y={user.pointer.y - 4}
                  text={user.userId.slice(0, 2).toUpperCase()}
                  fontSize={10}
                  fill="#1d4ed8"
                  listening={false}
                />
              </Group>
            ))}
          </Group>

        </KonvaLayer>

        {/* Transformer needs pointer events, so keep it on its own interactive layer */}
        {selectedElementIds.length > 0 && (
          <KonvaLayer name="transformer-layer">
            <Group name="transformer-group">
              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Group>
          </KonvaLayer>
        )}
      </Stage>

      {/* Inline Text Editor Overlay - Simple and Reliable */}
      {editingTextId && (() => {
        const textElement = elements.find(el => el.id === editingTextId);
        if (!textElement || textElement.type !== 'text') return null;
        const txtEl = textElement as any;
        
        const container = containerRef.current;
        if (!container) return null;
        const containerBox = container.getBoundingClientRect();
        
        // Simple calculation for editor size
        const fontSize = (txtEl.fontSize || 16) * stageScale;
        const fontFamily = txtEl.fontFamily || 'Arial';
        const textContent = editingTextValue || txtEl.text || '';
        const lines = textContent.split('\n');
        const lineCount = Math.max(lines.length, 1);
        const maxLineLength = Math.max(...lines.map((line: string) => line.length), 1);
        
        // Simple width calculation - character count * average char width
        const avgCharWidth = fontSize * 0.6;
        const minWidth = 200 * stageScale;
        const padding = 20 * stageScale;
        const lineHeight = fontSize * 1.5;
        const calculatedWidth = Math.max(minWidth, maxLineLength * avgCharWidth + padding);
        const calculatedHeight = Math.max(fontSize + padding, lineCount * lineHeight + padding);
        
        // Try to get position from group node if available
        const groupNode = shapeRefs.current[editingTextId] as Konva.Group;
        let x = textElement.x;
        let y = textElement.y;
        
        if (groupNode) {
          try {
            const box = groupNode.getClientRect();
            x = containerBox.left + box.x * stageScale + stagePosition.x;
            y = containerBox.top + box.y * stageScale + stagePosition.y;
          } catch (e) {
            x = containerBox.left + textElement.x * stageScale + stagePosition.x;
            y = containerBox.top + textElement.y * stageScale + stagePosition.y;
          }
        } else {
          x = containerBox.left + textElement.x * stageScale + stagePosition.x;
          y = containerBox.top + textElement.y * stageScale + stagePosition.y;
        }
        
        // Keep editor visible on screen
        const maxX = window.innerWidth - calculatedWidth - 20;
        const maxY = window.innerHeight - calculatedHeight - 20;
        x = Math.max(20, Math.min(x, maxX));
        y = Math.max(20, Math.min(y, maxY));
        
        return (
          <>
            {/* Hidden div for text measurement */}
            <div
              ref={textMeasureRef}
              style={{
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'pre-wrap',
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily,
                fontWeight: txtEl.fontSize >= 18 ? 'bold' : 'normal',
                padding: `${8 * stageScale}px ${10 * stageScale}px`,
              }}
            >
              {textContent || 'A'}
            </div>
            
            <div
              key={editingTextId}
              style={{
                position: 'fixed',
                left: `${x}px`,
                top: `${y}px`,
                width: `${calculatedWidth}px`,
                minHeight: `${calculatedHeight}px`,
                zIndex: 10000,
                pointerEvents: 'auto',
              }}
            >
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={editingTextValue}
                onChange={(e) => {
                  setEditingTextValue(e.target.value);
                  // Simple auto-resize using scrollHeight
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  const newHeight = Math.max(
                    fontSize + padding,
                    textarea.scrollHeight + padding
                  );
                  textarea.style.height = `${newHeight}px`;
                  
                  // Update width based on longest line
                  const newLines = e.target.value.split('\n');
                  const newMaxLength = Math.max(...newLines.map((line: string) => line.length), 1);
                  const newWidth = Math.max(minWidth, newMaxLength * avgCharWidth + padding);
                  textarea.style.width = `${newWidth}px`;
                  if (textMeasureRef.current) {
                    textMeasureRef.current.textContent = e.target.value || 'A';
                    const measuredWidth = textMeasureRef.current.offsetWidth;
                    if (measuredWidth > 0) {
                      textarea.style.width = `${Math.max(minWidth, measuredWidth + padding)}px`;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const txtEl = textElement as any;
                    if (txtEl && txtEl.type === 'text') {
                      const newText = editingTextValue.trim();
                      if (newText === '') {
                        removeElement(editingTextId);
                      } else {
                        updateElement(editingTextId, { text: newText });
                      }
                    }
                    setEditingTextId(null);
                    setEditingTextValue('');
                    if (textInputRef.current) {
                      textInputRef.current.blur();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    const txtEl = textElement as any;
                    if (txtEl && (!txtEl.text || txtEl.text.trim() === '')) {
                      removeElement(editingTextId);
                    }
                    setEditingTextId(null);
                    setEditingTextValue('');
                    if (textInputRef.current) {
                      textInputRef.current.blur();
                    }
                  }
                }}
                onBlur={() => {
                  if (editingTextId) {
                    const txtEl = textElement as any;
                    if (txtEl && txtEl.type === 'text') {
                      const newText = editingTextValue.trim();
                      if (newText === '') {
                        removeElement(editingTextId);
                      } else if (newText !== (txtEl.text || '')) {
                        updateElement(editingTextId, { text: newText });
                      }
                    }
                    setTimeout(() => {
                      if (editingTextId) {
                        setEditingTextId(null);
                        setEditingTextValue('');
                      }
                    }, 100);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  width: `${calculatedWidth}px`,
                  minHeight: `${calculatedHeight}px`,
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: txtEl.fontSize >= 18 ? 'bold' : 'normal',
                  textAlign: txtEl.align || 'left',
                  border: '2px solid #4299E1',
                  borderRadius: '6px',
                  padding: `${8 * stageScale}px ${10 * stageScale}px`,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: txtEl.stroke || '#000000',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'text',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
                autoFocus
                placeholder="Type text here... (Shift+Enter for new line)"
              />
            </div>
          </>
        );
      })()}
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetElementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Floor Plan Page Tabs - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur border-t border-slate-700 flex items-center px-2 py-1.5 gap-1">
        {/* Page Tabs */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {floorPlanPages.map((page, index) => (
            <div
              key={page.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[80px] ${
                page.id === currentFloorPlanPageId
                  ? 'bg-white text-slate-800 font-medium'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              onClick={() => setCurrentFloorPlanPage(page.id)}
              onDoubleClick={() => {
                setEditingPageId(page.id);
                setEditingPageName(page.name);
              }}
            >
              {editingPageId === page.id ? (
                <input
                  type="text"
                  value={editingPageName}
                  onChange={(e) => setEditingPageName(e.target.value)}
                  onBlur={() => {
                    if (editingPageName.trim()) {
                      renameFloorPlanPage(page.id, editingPageName.trim());
                    }
                    setEditingPageId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingPageName.trim()) {
                        renameFloorPlanPage(page.id, editingPageName.trim());
                      }
                      setEditingPageId(null);
                    } else if (e.key === 'Escape') {
                      setEditingPageId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-20 px-1 py-0 text-xs bg-white border border-slate-300 rounded text-slate-800"
                  autoFocus
                />
              ) : (
                <>
                  <span className="text-xs truncate">{page.name}</span>
                  {floorPlanPages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFloorPlanPage(page.id);
                      }}
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
                      title="Remove Page"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          
          {/* Add Page Button */}
          <button
            onClick={() => addFloorPlanPage()}
            className="flex items-center justify-center w-8 h-8 rounded bg-slate-700 text-slate-300 hover:bg-cyan-600 hover:text-white transition-colors"
            title="Add New Page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Auto-save Controls */}
        <div className="flex items-center gap-2 ml-4 border-l border-slate-600 pl-4">
          <button
            onClick={() => saveCurrentPageElements()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-emerald-600 hover:text-white transition-colors text-xs"
            title="Save Now"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Save
          </button>
          
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-3 h-3 rounded accent-emerald-500"
            />
            <span className="text-xs text-slate-400">AutoSave</span>
          </label>
          
          {lastAutoSave && (
            <span className="text-[10px] text-slate-500">
              Saved {new Date(lastAutoSave).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

