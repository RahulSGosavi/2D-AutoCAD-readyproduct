import { Layer, Circle, Line, Text } from 'react-konva';
import type { Point, SnapResult, SnapIndex } from '../lib/snap-utils';

type Props = {
  index: SnapIndex;
  snapResult: SnapResult | null;
  lastPoint: Point | null;
  visible: boolean;
  zoom: number;
  getStageTransform?: (point: Point) => Point;
};

const snapColors: Record<SnapResult['type'], string> = {
  endpoint: '#29c97a',
  midpoint: '#3da4ff',
  intersection: '#ffb84d',
  perpendicular: '#ff6b6b',
  grid: '#9aa0a6',
  angle: '#c77dff',
  none: '#9aa0a6',
};

const formatCoords = (pt: Point) => `${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}`;

const SnapOverlay = ({
  index: _index,
  snapResult,
  lastPoint,
  visible,
  zoom,
  getStageTransform,
}: Props) => {
  void _index;
  if (!visible || !snapResult || snapResult.type === 'none') {
    return null;
  }

  const markerPoint = getStageTransform ? getStageTransform(snapResult.point) : snapResult.point;
  const prevPoint = lastPoint && (getStageTransform ? getStageTransform(lastPoint) : lastPoint);
  const radius = 8 / Math.max(zoom, 0.1);
  const stroke = snapColors[snapResult.type];

  return (
    <Layer listening={false}>
      {prevPoint ? (
        <Line
          points={[prevPoint.x, prevPoint.y, markerPoint.x, markerPoint.y]}
          stroke={stroke}
          dash={[6 / Math.max(zoom, 0.1), 6 / Math.max(zoom, 0.1)]}
          strokeWidth={1.5 / Math.max(zoom, 0.1)}
          opacity={0.7}
        />
      ) : null}
      <Circle
        x={markerPoint.x}
        y={markerPoint.y}
        radius={radius}
        fill={stroke}
        opacity={0.9}
      />
      <Text
        x={markerPoint.x + radius + 4}
        y={markerPoint.y - radius - 4}
        text={`${snapResult.type.toUpperCase()} (${formatCoords(markerPoint)})`}
        fontSize={12 / Math.max(zoom, 0.1)}
        fill={stroke}
        padding={4}
        listening={false}
      />
    </Layer>
  );
};

export default SnapOverlay;

