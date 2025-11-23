import { useMemo } from 'react';
import { Layer, Line, Text } from 'react-konva';
import type { Point, Entity } from '../lib/snap-utils';

type SmartGuidesProps = {
  activePoint: Point | null;
  otherEntities: Entity[];
  stageWidth?: number;
  stageHeight?: number;
  tolerance?: number;
};

const extractPoints = (entity: Entity): Point[] => {
  const points: Point[] = [];
  const { type, geom, bbox } = entity;

  if (type === 'point' && geom?.point) {
    return [geom.point as Point];
  }

  if ((type === 'line' || type === 'polyline') && geom?.points) {
    const pts = geom.points as number[];
    for (let i = 0; i < pts.length; i += 2) {
      points.push({ x: pts[i], y: pts[i + 1] });
    }
    return points;
  }

  if (type === 'rect') {
    const [minX, minY, maxX, maxY] = bbox;
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
      { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    ];
  }

  if (type === 'circle' && geom?.center) {
    const center = geom.center as Point;
    return [center];
  }

  return [];
};

const SmartGuides = ({
  activePoint,
  otherEntities,
  stageWidth = 2000,
  stageHeight = 2000,
  tolerance = 2,
}: SmartGuidesProps) => {
  const guides = useMemo(() => {
    if (!activePoint) return [];

    const allPoints: Point[] = [];
    otherEntities.forEach((entity) => {
      allPoints.push(...extractPoints(entity));
    });

    const horizontalGuides: Array<{ y: number; distance: number }> = [];
    const verticalGuides: Array<{ x: number; distance: number }> = [];
    const centerGuides: Array<{ x?: number; y?: number; distance: number }> = [];

    allPoints.forEach((point) => {
      const dx = Math.abs(point.x - activePoint.x);
      const dy = Math.abs(point.y - activePoint.y);

      if (dy <= tolerance) {
        horizontalGuides.push({ y: point.y, distance: dx });
      }
      if (dx <= tolerance) {
        verticalGuides.push({ x: point.x, distance: dy });
      }

      const centerX = point.x;
      const centerY = point.y;
      if (Math.abs(centerX - activePoint.x) <= tolerance) {
        centerGuides.push({ x: centerX, distance: Math.abs(centerY - activePoint.y) });
      }
      if (Math.abs(centerY - activePoint.y) <= tolerance) {
        centerGuides.push({ y: centerY, distance: Math.abs(centerX - activePoint.x) });
      }
    });

    return {
      horizontal: horizontalGuides.sort((a, b) => a.distance - b.distance)[0] || null,
      vertical: verticalGuides.sort((a, b) => a.distance - b.distance)[0] || null,
      center: centerGuides.sort((a, b) => a.distance - b.distance)[0] || null,
    };
  }, [activePoint, otherEntities, tolerance]);

  if (!activePoint || (!guides.horizontal && !guides.vertical && !guides.center)) {
    return null;
  }

  const elements: JSX.Element[] = [];

  if (guides.horizontal) {
    elements.push(
      <Line
        key="h-guide"
        points={[0, guides.horizontal.y, stageWidth, guides.horizontal.y]}
        stroke="#4fd1c5"
        strokeWidth={1}
        dash={[4, 4]}
        opacity={0.7}
      />,
      <Text
        key="h-label"
        x={activePoint.x + 8}
        y={guides.horizontal.y - 16}
        text={`${guides.horizontal.distance.toFixed(1)}px`}
        fontSize={10}
        fill="#4fd1c5"
        fontFamily="monospace"
        padding={2}
        background="#0f1115"
        backgroundOpacity={0.8}
      />,
    );
  }

  if (guides.vertical) {
    elements.push(
      <Line
        key="v-guide"
        points={[guides.vertical.x, 0, guides.vertical.x, stageHeight]}
        stroke="#4fd1c5"
        strokeWidth={1}
        dash={[4, 4]}
        opacity={0.7}
      />,
      <Text
        key="v-label"
        x={guides.vertical.x + 8}
        y={activePoint.y - 16}
        text={`${guides.vertical.distance.toFixed(1)}px`}
        fontSize={10}
        fill="#4fd1c5"
        fontFamily="monospace"
        padding={2}
        background="#0f1115"
        backgroundOpacity={0.8}
      />,
    );
  }

  if (guides.center) {
    if (guides.center.x !== undefined) {
      elements.push(
        <Line
          key="c-x"
          points={[guides.center.x, 0, guides.center.x, stageHeight]}
          stroke="#c77dff"
          strokeWidth={1}
          dash={[2, 2]}
          opacity={0.6}
        />,
      );
    }
    if (guides.center.y !== undefined) {
      elements.push(
        <Line
          key="c-y"
          points={[0, guides.center.y, stageWidth, guides.center.y]}
          stroke="#c77dff"
          strokeWidth={1}
          dash={[2, 2]}
          opacity={0.6}
        />,
      );
    }
    if (guides.center.x !== undefined || guides.center.y !== undefined) {
      elements.push(
        <Text
          key="c-label"
          x={activePoint.x + 8}
          y={activePoint.y - 16}
          text={`center ${guides.center.distance.toFixed(1)}px`}
          fontSize={10}
          fill="#c77dff"
          fontFamily="monospace"
          padding={2}
          background="#0f1115"
          backgroundOpacity={0.8}
        />,
      );
    }
  }

  return <Layer listening={false}>{elements}</Layer>;
};

export default SmartGuides;

