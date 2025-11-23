import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { SnapIndex, snapPoint, type SnapResult, type Point, type Entity } from '../lib/snap-utils';
import SnapOverlay from '../components/SnapOverlay';

const initialPolyline = (points: number[]): Entity => ({
  id: `poly-${points.join('-')}`,
  type: 'polyline',
  bbox: polyPointsToBBox(points),
  geom: { points },
});

const rectangleEntity = (x: number, y: number, w: number, h: number): Entity => ({
  id: `rect-${x}-${y}`,
  type: 'rect',
  bbox: [x, y, x + w, y + h],
  geom: {},
});

export const SnapIntegrationExample = () => {
  const indexRef = useRef(new SnapIndex());
  const baseEntities = useMemo<Entity[]>(
    () => [
      initialPolyline([50, 50, 300, 200, 450, 60]),
      initialPolyline([80, 280, 400, 40, 520, 280]),
      rectangleEntity(200, 220, 160, 120),
    ],
    [],
  );
  const [entities, setEntities] = useState<Entity[]>(baseEntities);
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);

  useEffect(() => {
    const idx = indexRef.current;
    idx.clear();
    entities.forEach((entity) => idx.add(entity));
  }, [entities]);

  const handlePointerMove = (evt: KonvaEventObject<PointerEvent>) => {
    const stage = evt.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const result = snapPoint(
      indexRef.current,
      pointer,
      lastPoint,
      { tolerance: 12, gridSize: 25, angleSnapStep: 15 },
    );
    setSnapResult(result);
    setCurrentPoints((prev) => {
      if (!prev.length || !result.point) return prev;
      return [...prev.slice(0, -2), result.point.x, result.point.y];
    });
  };

  const handlePointerDown = (evt: KonvaEventObject<PointerEvent>) => {
    const stage = evt.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const effectivePoint = snapResult && snapResult.type !== 'none' ? snapResult.point : pointer;
    setCurrentPoints((prev) => [...prev, effectivePoint.x, effectivePoint.y]);
    setLastPoint(effectivePoint);
  };

  const handlePointerDblClick = () => {
    if (currentPoints.length < 4) {
      setCurrentPoints([]);
      setLastPoint(null);
      return;
    }
    const idx = indexRef.current;
    const poly = [...currentPoints];
    const entity = initialPolyline(poly);
    idx.add(entity);
    setEntities((prev) => [...prev, entity]);
    setCurrentPoints([]);
    setLastPoint(null);
  };

  const overlayVisible = Boolean(snapResult && snapResult.type !== 'none');

  return (
    <Stage
      width={800}
      height={600}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onDblClick={handlePointerDblClick}
      style={{ border: '1px solid #1f2937', background: '#0f1115' }}
    >
      <Layer>
        {entities
          .filter((entity) => entity.type === 'polyline' && entity.geom?.points)
          .map((entity) => (
            <Line
              key={entity.id}
              points={entity.geom?.points as number[]}
              stroke="#4fd1c5"
              strokeWidth={2}
              lineJoin="round"
              lineCap="round"
            />
          ))}
        {currentPoints.length >= 2 ? (
          <Line
            points={currentPoints}
            stroke="#cbd5f5"
            dash={[6, 6]}
            strokeWidth={1.5}
          />
        ) : null}
      </Layer>
      <SnapOverlay
        index={indexRef.current}
        snapResult={snapResult}
        lastPoint={lastPoint}
        visible={overlayVisible}
        zoom={1}
      />
    </Stage>
  );
};

export const polyPointsToBBox = (points: number[]): [number, number, number, number] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
};

