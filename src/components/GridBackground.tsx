import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

type GridBackgroundProps = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  gridSize?: number;
  width?: number;
  height?: number;
  name?: string;
  visible?: boolean;
};

const GridBackground = ({
  zoom,
  offsetX,
  offsetY,
  gridSize = 25,
  width = 2000,
  height = 2000,
  name = 'grid-layer',
  visible = true,
}: GridBackgroundProps) => {
  const lines = useMemo(() => {
    const scaledGrid = gridSize * zoom;
    const majorGrid = scaledGrid * 10;
    const startX = Math.floor((-offsetX / zoom) / gridSize) * gridSize;
    const startY = Math.floor((-offsetY / zoom) / gridSize) * gridSize;
    const endX = startX + Math.ceil((width / zoom) / gridSize) * gridSize;
    const endY = startY + Math.ceil((height / zoom) / gridSize) * gridSize;

    const minorLines: Array<{ points: number[] }> = [];
    const majorLines: Array<{ points: number[] }> = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      const screenX = x * zoom + offsetX;
      if (screenX < -50 || screenX > width + 50) continue;
      const isMajor = x % (gridSize * 10) === 0;
      const points = [screenX, 0, screenX, height];
      if (isMajor) {
        majorLines.push({ points });
      } else {
        minorLines.push({ points });
      }
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      const screenY = y * zoom + offsetY;
      if (screenY < -50 || screenY > height + 50) continue;
      const isMajor = y % (gridSize * 10) === 0;
      const points = [0, screenY, width, screenY];
      if (isMajor) {
        majorLines.push({ points });
      } else {
        minorLines.push({ points });
      }
    }

    return { minorLines, majorLines };
  }, [zoom, offsetX, offsetY, gridSize, width, height]);

  return (
    <Layer listening={false} name={name} visible={visible}>
      {lines.minorLines.map((line, idx) => (
        <Line
          key={`minor-${idx}`}
          points={line.points}
          stroke="#2c2c2c"
          strokeWidth={0.5}
          opacity={0.6}
        />
      ))}
      {lines.majorLines.map((line, idx) => (
        <Line
          key={`major-${idx}`}
          points={line.points}
          stroke="#3a3a3a"
          strokeWidth={0.8}
          opacity={0.8}
        />
      ))}
    </Layer>
  );
};

export default GridBackground;

