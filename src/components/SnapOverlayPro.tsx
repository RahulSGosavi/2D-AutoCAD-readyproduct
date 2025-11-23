import { useMemo } from 'react';
import { Layer, Circle, Line, Text, Arc } from 'react-konva';
import type Konva from 'konva';
import type { SnapResult, Point } from '../lib/snap-utils';

type Props = {
  snapResult: SnapResult | null;
  lastPoint: Point | null;
  zoom: number;
  showGuides: boolean;
  showAngleGuide: boolean;
  showGridCross: boolean;
  stage: Konva.Stage;
};

const SNAP_COLORS: Record<SnapResult['type'], string> = {
  endpoint: '#29c97a',
  midpoint: '#3da4ff',
  intersection: '#ffb84d',
  perpendicular: '#ff6b6b',
  grid: '#9aa0a6',
  angle: '#c77dff',
  none: '#9aa0a6',
};

const formatCoords = (pt: Point) => `${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}`;

const getStageBounds = (stage: Konva.Stage) => {
  const box = stage.getClientRect();
  const transform = stage.getAbsoluteTransform().copy().invert();
  const topLeft = transform.point({ x: 0, y: 0 });
  const bottomRight = transform.point({ x: box.width, y: box.height });
  return { topLeft, bottomRight, width: box.width, height: box.height };
};

const SnapOverlayPro = ({
  snapResult,
  lastPoint,
  zoom,
  showGuides,
  showAngleGuide,
  showGridCross,
  stage,
}: Props) => {
  const stageBounds = useMemo(() => getStageBounds(stage), [stage, zoom]);

  if (!snapResult || snapResult.type === 'none') {
    return null;
  }

  const snapPoint = snapResult.point;
  const color = SNAP_COLORS[snapResult.type];
  const markerRadius = 6 / Math.max(zoom, 0.1);
  const strokeWidth = 1.5 / Math.max(zoom, 0.1);
  const fontSize = 11 / Math.max(zoom, 0.1);

  const elements: JSX.Element[] = [];

  // Ghost line from lastPoint to snapped point
  if (lastPoint) {
    elements.push(
      <Line
        key="ghost-line"
        points={[lastPoint.x, lastPoint.y, snapPoint.x, snapPoint.y]}
        stroke={color}
        dash={[4 / Math.max(zoom, 0.1), 4 / Math.max(zoom, 0.1)]}
        strokeWidth={strokeWidth}
        opacity={0.6}
        listening={false}
      />,
    );
  }

  // Main snap marker circle
  elements.push(
    <Circle
      key="marker"
      x={snapPoint.x}
      y={snapPoint.y}
      radius={markerRadius}
      fill={color}
      stroke="#ffffff"
      strokeWidth={strokeWidth * 0.8}
      opacity={0.95}
      listening={false}
    />,
  );

  // Perpendicular symbol (L shape)
  if (snapResult.type === 'perpendicular' && showGuides) {
    const perpSize = 12 / Math.max(zoom, 0.1);
    const entity = (snapResult as { entityId: string }).entityId;
    const node = stage.findOne(`#${entity}`);
    if (node && 'points' in node.attrs) {
      const points = node.getAttr('points') as number[];
      if (points && points.length >= 4) {
        const segA = { x: points[0], y: points[1] };
        const segB = { x: points[2], y: points[3] };
        const dx = segB.x - segA.x;
        const dy = segB.y - segA.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const perpX = -dy / len;
          const perpY = dx / len;
          elements.push(
            <Line
              key="perp-l1"
              points={[
                snapPoint.x,
                snapPoint.y,
                snapPoint.x + perpX * perpSize,
                snapPoint.y + perpY * perpSize,
              ]}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={0.8}
              listening={false}
            />,
            <Line
              key="perp-l2"
              points={[
                snapPoint.x + perpX * perpSize * 0.6,
                snapPoint.y + perpY * perpSize * 0.6,
                snapPoint.x + perpX * perpSize * 0.6 - perpY * perpSize * 0.4,
                snapPoint.y + perpY * perpSize * 0.6 + perpX * perpSize * 0.4,
              ]}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={0.8}
              listening={false}
            />,
          );
        }
      }
    }
  }

  // Midpoint symbol (double circle)
  if (snapResult.type === 'midpoint' && showGuides) {
    const innerRadius = markerRadius * 0.5;
    elements.push(
      <Circle
        key="midpoint-inner"
        x={snapPoint.x}
        y={snapPoint.y}
        radius={innerRadius}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.9}
        listening={false}
      />,
    );
  }

  // Intersection cross (X marker)
  if (snapResult.type === 'intersection' && showGuides) {
    const crossSize = 10 / Math.max(zoom, 0.1);
    elements.push(
      <Line
        key="intersect-x1"
        points={[
          snapPoint.x - crossSize,
          snapPoint.y - crossSize,
          snapPoint.x + crossSize,
          snapPoint.y + crossSize,
        ]}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.9}
        listening={false}
      />,
      <Line
        key="intersect-x2"
        points={[
          snapPoint.x - crossSize,
          snapPoint.y + crossSize,
          snapPoint.x + crossSize,
          snapPoint.y - crossSize,
        ]}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.9}
        listening={false}
      />,
    );

    // Draw infinite guide lines along both segments
    if (showGuides) {
      const entityIds = (snapResult as { entityIds: [string, string] }).entityIds;
      entityIds.forEach((entityId, idx) => {
        const node = stage.findOne(`#${entityId}`);
        if (node && 'points' in node.attrs) {
          const points = node.getAttr('points') as number[];
          if (points && points.length >= 4) {
            const segA = { x: points[0], y: points[1] };
            const segB = { x: points[2], y: points[3] };
            const dx = segB.x - segA.x;
            const dy = segB.y - segA.y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
              const dirX = dx / len;
              const dirY = dy / len;
              const extend = Math.max(stageBounds.width, stageBounds.height) * 2;
              elements.push(
                <Line
                  key={`guide-line-${idx}`}
                  points={[
                    snapPoint.x - dirX * extend,
                    snapPoint.y - dirY * extend,
                    snapPoint.x + dirX * extend,
                    snapPoint.y + dirY * extend,
                  ]}
                  stroke={color}
                  dash={[8 / Math.max(zoom, 0.1), 4 / Math.max(zoom, 0.1)]}
                  strokeWidth={strokeWidth * 0.8}
                  opacity={0.4}
                  listening={false}
                />,
              );
            }
          }
        }
      });
    }
  }

  // Grid crosshair (+ sign)
  if (snapResult.type === 'grid' && showGridCross) {
    const crossSize = 8 / Math.max(zoom, 0.1);
    elements.push(
      <Line
        key="grid-h"
        points={[snapPoint.x - crossSize, snapPoint.y, snapPoint.x + crossSize, snapPoint.y]}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.8}
        listening={false}
      />,
      <Line
        key="grid-v"
        points={[snapPoint.x, snapPoint.y - crossSize, snapPoint.x, snapPoint.y + crossSize]}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.8}
        listening={false}
      />,
    );
  }

  // Angle guide (arc + text)
  if (snapResult.type === 'angle' && lastPoint && showAngleGuide) {
    const angleSnap = snapResult as { snappedAngle: number; step: number };
    const snappedAngleDeg = angleSnap.snappedAngle;
    const snappedAngleRad = (snappedAngleDeg * Math.PI) / 180;
    const radius = Math.hypot(snapPoint.x - lastPoint.x, snapPoint.y - lastPoint.y);
    const arcRadius = Math.min(radius * 0.5, 35 / Math.max(zoom, 0.1));
    const actualAngleRad = Math.atan2(snapPoint.y - lastPoint.y, snapPoint.x - lastPoint.x);
    const actualAngleDeg = (actualAngleRad * 180) / Math.PI;

    elements.push(
      <Arc
        key="angle-arc"
        x={lastPoint.x}
        y={lastPoint.y}
        innerRadius={arcRadius * 0.7}
        outerRadius={arcRadius}
        angle={Math.abs(actualAngleDeg)}
        rotation={0}
        fill={color}
        opacity={0.25}
        listening={false}
      />,
      <Line
        key="angle-line"
        points={[lastPoint.x, lastPoint.y, snapPoint.x, snapPoint.y]}
        stroke={color}
        strokeWidth={strokeWidth * 0.6}
        opacity={0.5}
        dash={[2 / Math.max(zoom, 0.1), 2 / Math.max(zoom, 0.1)]}
        listening={false}
      />,
      <Text
        key="angle-text"
        x={lastPoint.x + Math.cos(actualAngleRad / 2) * arcRadius * 1.4}
        y={lastPoint.y + Math.sin(actualAngleRad / 2) * arcRadius * 1.4}
        text={`${snappedAngleDeg.toFixed(0)}°`}
        fontSize={fontSize * 0.9}
        fill={color}
        padding={3}
        background={color}
        backgroundOpacity={0.2}
        listening={false}
      />,
    );
  }

  // Tooltip
  elements.push(
    <Text
      key="tooltip"
      x={snapPoint.x + markerRadius + 4}
      y={snapPoint.y - markerRadius - fontSize - 4}
      text={`${snapResult.type.toUpperCase()}\n${formatCoords(snapPoint)}`}
      fontSize={fontSize}
      fill={color}
      padding={4}
      background={color}
      backgroundOpacity={0.15}
      listening={false}
    />,
  );

  return <Layer listening={false}>{elements}</Layer>;
};

export default SnapOverlayPro;

