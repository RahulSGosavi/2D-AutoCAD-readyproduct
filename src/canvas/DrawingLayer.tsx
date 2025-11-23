import { Layer, Line, Rect, Ellipse, Arc, Circle } from 'react-konva';
import type { EditorElement } from '../state/useEditorStore';

type DrawingLayerProps = {
  elements: EditorElement[];
  visible: boolean;
};

const DrawingLayer = ({ elements, visible }: DrawingLayerProps) => {
  if (!visible) return null;

  return (
    <Layer listening={true}>
      {elements.map((element) => {
        switch (element.type) {
          case 'line': {
            const el = element as { points: [number, number, number, number] };
            return (
              <Line
                key={element.id}
                points={[el.points[0], el.points[1], el.points[2], el.points[3]]}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                opacity={element.opacity}
                x={element.x}
                y={element.y}
                rotation={element.rotation}
              />
            );
          }
          case 'polyline': {
            const el = element as { points: number[] };
            return (
              <Line
                key={element.id}
                points={el.points}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                opacity={element.opacity}
                x={element.x}
                y={element.y}
                rotation={element.rotation}
                closed={(element as { closed?: boolean }).closed}
              />
            );
          }
          case 'rectangle': {
            const el = element as { width: number; height: number; fill?: string };
            return (
              <Rect
                key={element.id}
                x={element.x}
                y={element.y}
                width={el.width}
                height={el.height}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                fill={el.fill}
                opacity={element.opacity}
                rotation={element.rotation}
              />
            );
          }
          case 'circle': {
            const el = element as { radius: number; fill?: string };
            return (
              <Circle
                key={element.id}
                x={element.x}
                y={element.y}
                radius={el.radius}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                fill={el.fill}
                opacity={element.opacity}
                rotation={element.rotation}
              />
            );
          }
          case 'ellipse': {
            const el = element as { radiusX: number; radiusY: number; fill?: string };
            return (
              <Ellipse
                key={element.id}
                x={element.x}
                y={element.y}
                radiusX={el.radiusX}
                radiusY={el.radiusY}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                fill={el.fill}
                opacity={element.opacity}
                rotation={element.rotation}
              />
            );
          }
          case 'arc': {
            const el = element as { radius: number; startAngle: number; endAngle: number };
            return (
              <Arc
                key={element.id}
                x={element.x}
                y={element.y}
                innerRadius={0}
                outerRadius={el.radius}
                angle={el.endAngle - el.startAngle}
                rotation={el.startAngle}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                opacity={element.opacity}
              />
            );
          }
          case 'free': {
            const el = element as { points: number[]; tension?: number };
            return (
              <Line
                key={element.id}
                points={el.points}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                tension={el.tension ?? 0.5}
                lineCap="round"
                lineJoin="round"
                opacity={element.opacity}
                x={element.x}
                y={element.y}
                rotation={element.rotation}
              />
            );
          }
          default:
            return null;
        }
      })}
    </Layer>
  );
};

export default DrawingLayer;

