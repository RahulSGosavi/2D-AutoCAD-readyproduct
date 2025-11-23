import { useRef, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { Point, Entity } from '../lib/snap-utils';
import Rulers from '../components/Rulers';
import GridBackground from '../components/GridBackground';
import SmartGuides from '../components/SmartGuides';

/**
 * Example integration of Rulers, GridBackground, and SmartGuides
 * into a Konva-based 2D CAD editor.
 *
 * Usage:
 * 1. Import this component or copy the pattern into your FloorCanvas
 * 2. Add Rulers, GridBackground, and SmartGuides as separate Layers
 * 3. Update stage transform state when panning/zooming
 * 4. Pass activePoint from your drawing tool state
 */
export const RulerIntegrationExample = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activePoint, setActivePoint] = useState<Point | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateTransform = () => {
      setZoom(stage.scaleX());
      setScrollX(stage.x());
      setScrollY(stage.y());
    };

    stage.on('wheel', updateTransform);
    stage.on('dragmove', updateTransform);
    stage.on('dragend', updateTransform);

    return () => {
      stage.off('wheel', updateTransform);
      stage.off('dragmove', updateTransform);
      stage.off('dragend', updateTransform);
    };
  }, []);

  const handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const point = transform.point(pointer);
    setActivePoint(point);
  };

  const handlePointerLeave = () => {
    setActivePoint(null);
  };

  return (
    <div className="relative w-full h-full">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        draggable
        style={{ background: '#0f1115' }}
      >
        {/* Grid Background - render first, behind everything */}
        <GridBackground
          zoom={zoom}
          offsetX={scrollX}
          offsetY={scrollY}
          gridSize={25}
          width={window.innerWidth}
          height={window.innerHeight}
        />

        {/* Main drawing layer */}
        <Layer>
          {/* Your drawing elements go here */}
        </Layer>

        {/* Smart Guides - render above drawing but below rulers */}
        <SmartGuides
          activePoint={activePoint}
          otherEntities={entities}
          stageWidth={window.innerWidth}
          stageHeight={window.innerHeight}
          tolerance={2}
        />

        {/* Rulers - render on top */}
        <Rulers stage={stageRef.current} zoom={zoom} scrollX={scrollX} scrollY={scrollY} />
      </Stage>
    </div>
  );
};

/**
 * Integration pattern for FloorCanvas.tsx:
 *
 * 1. Add state for rulers/grid:
 *    const [zoom, setZoom] = useState(1);
 *    const [scrollX, setScrollX] = useState(0);
 *    const [scrollY, setScrollY] = useState(0);
 *
 * 2. Update transform state in handleWheel, handleStageDragEnd:
 *    setZoom(newScale);
 *    setScrollX(newPos.x);
 *    setScrollY(newPos.y);
 *
 * 3. Add layers in Stage (in order):
 *    <GridBackground zoom={zoom} offsetX={scrollX} offsetY={scrollY} />
 *    <Layer>{/* your drawing elements *\/}</Layer>
 *    <SmartGuides activePoint={pointer} otherEntities={elements} />
 *    <Rulers stage={stageRef.current} zoom={zoom} scrollX={scrollX} scrollY={scrollY} />
 *
 * 4. Track activePoint from pointer move events
 */

