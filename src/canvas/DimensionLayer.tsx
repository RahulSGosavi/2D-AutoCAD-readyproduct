import { Layer, Line, Text, Circle, Group } from 'react-konva';
import type { DimensionElement } from '../state/useEditorStore';

type DimensionLayerProps = {
  dimensions: DimensionElement[];
  visible: boolean;
};

const DimensionLayer = ({ dimensions, visible }: DimensionLayerProps) => {
  if (!visible) return null;

  return (
    <Layer listening={false}>
      {dimensions.map((dim) => {
        const { startPoint, endPoint, dimensionType, value, text } = dim;
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        const offset = 20;

        if (dimensionType === 'linear') {
          return (
            <Group key={dim.id}>
              <Line
                points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
                stroke="#4fd1c5"
                strokeWidth={1}
                dash={[4, 4]}
              />
              <Line
                points={[startPoint.x, startPoint.y - offset, startPoint.x, startPoint.y + offset]}
                stroke="#4fd1c5"
                strokeWidth={1.5}
              />
              <Line
                points={[endPoint.x, endPoint.y - offset, endPoint.x, endPoint.y + offset]}
                stroke="#4fd1c5"
                strokeWidth={1.5}
              />
              <Text
                x={midX}
                y={midY - offset - 16}
                text={text || `${value.toFixed(2)}`}
                fontSize={12}
                fill="#4fd1c5"
                fontFamily="monospace"
                padding={4}
                background="#0f1115"
                backgroundOpacity={0.8}
              />
            </Group>
          );
        }

        return null;
      })}
    </Layer>
  );
};

export default DimensionLayer;

