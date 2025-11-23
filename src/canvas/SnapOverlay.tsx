import { Layer, Circle, Line, Text } from 'react-konva';
import type { SnapResult, Point } from '../lib/snap-utils';

type SnapOverlayProps = {
  index: any;
  snapResult: SnapResult | null;
  lastPoint: Point | null;
  visible: boolean;
  zoom: number;
};

const SNAP_COLORS: Record<string, string> = {
  endpoint: '#29c97a',
  midpoint: '#3da4ff',
  intersection: '#ffb84d',
  perpendicular: '#ff6b6b',
  grid: '#9aa0a6',
  angle: '#c77dff',
  none: '#9aa0a6',
};

const SnapOverlay = ({ snapResult, lastPoint, visible, zoom }: SnapOverlayProps) => {
  if (!visible || !snapResult || snapResult.type === 'none') {
    return null;
  }

  const snapPoint = snapResult.point;
  const color = SNAP_COLORS[snapResult.type] || '#9aa0a6';
  const markerRadius = 6 / Math.max(zoom, 0.1);

  return (
    <Layer listening={false}>
      {lastPoint && (
        <Line
          points={[lastPoint.x, lastPoint.y, snapPoint.x, snapPoint.y]}
          stroke={color}
          dash={[4 / Math.max(zoom, 0.1), 4 / Math.max(zoom, 0.1)]}
          strokeWidth={1.5 / Math.max(zoom, 0.1)}
          opacity={0.6}
        />
      )}
      <Circle
        x={snapPoint.x}
        y={snapPoint.y}
        radius={markerRadius}
        fill={color}
        stroke="#ffffff"
        strokeWidth={1}
        opacity={0.95}
      />
      <Text
        x={snapPoint.x + markerRadius + 4}
        y={snapPoint.y - markerRadius - 16}
        text={`${snapResult.type.toUpperCase()}\n${snapPoint.x.toFixed(1)}, ${snapPoint.y.toFixed(1)}`}
        fontSize={11 / Math.max(zoom, 0.1)}
        fill={color}
        padding={4}
        background={color}
        backgroundOpacity={0.15}
      />
    </Layer>
  );
};

export default SnapOverlay;

