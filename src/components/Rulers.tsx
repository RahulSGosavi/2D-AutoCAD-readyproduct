import { useMemo, useEffect, useState } from 'react';
import { Layer, Line, Text, Group } from 'react-konva';
import type Konva from 'konva';
import type { Point } from '../lib/snap-utils';

type RulersProps = {
  stage: Konva.Stage | null;
  zoom: number;
  scrollX: number;
  scrollY: number;
};

const RULER_HEIGHT = 24;
const RULER_WIDTH = 24;
const TICK_SIZE_SMALL = 6;
const TICK_SIZE_LARGE = 10;
const TEXT_OFFSET = 4;

const formatNumber = (value: number, zoom: number): string => {
  const scaled = value / zoom;
  if (Math.abs(scaled) < 0.1) return '0';
  if (Math.abs(scaled) >= 1000) return `${(scaled / 1000).toFixed(1)}k`;
  return Math.round(scaled).toString();
};

const Rulers = ({ stage, zoom, scrollX, scrollY }: RulersProps) => {
  const [pointerPos, setPointerPos] = useState<Point | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!stage) return;
    const updateSize = () => {
      setStageSize({ width: stage.width(), height: stage.height() });
    };
    updateSize();
    stage.on('resize', updateSize);
    return () => stage.off('resize', updateSize);
  }, [stage]);

  useEffect(() => {
    if (!stage) return;
    const handleMove = (e: MouseEvent) => {
      const rect = stage.container().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const point = transform.point({ x, y });
      setPointerPos(point);
    };
    const container = stage.container();
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', () => setPointerPos(null));
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', () => setPointerPos(null));
    };
  }, [stage]);

  const horizontalTicks = useMemo(() => {
    const ticks: Array<{ x: number; value: number; isMajor: boolean }> = [];
    const start = Math.floor((-scrollX / zoom) / 10) * 10;
    const end = Math.ceil((stageSize.width / zoom - scrollX / zoom) / 10) * 10;
    for (let i = start; i <= end; i += 10) {
      const x = i * zoom + scrollX;
      if (x >= -100 && x <= stageSize.width + 100) {
        ticks.push({ x, value: i, isMajor: i % 100 === 0 });
      }
    }
    return ticks;
  }, [scrollX, zoom, stageSize.width]);

  const verticalTicks = useMemo(() => {
    const ticks: Array<{ y: number; value: number; isMajor: boolean }> = [];
    const start = Math.floor((-scrollY / zoom) / 10) * 10;
    const end = Math.ceil((stageSize.height / zoom - scrollY / zoom) / 10) * 10;
    for (let i = start; i <= end; i += 10) {
      const y = i * zoom + scrollY;
      if (y >= -100 && y <= stageSize.height + 100) {
        ticks.push({ y, value: i, isMajor: i % 100 === 0 });
      }
    }
    return ticks;
  }, [scrollY, zoom, stageSize.height]);

  const zeroX = -scrollX / zoom;
  const zeroY = -scrollY / zoom;

  return (
    <>
      {/* Top Horizontal Ruler */}
      <Layer listening={false} x={RULER_WIDTH} y={0}>
        <Line
          points={[0, RULER_HEIGHT, stageSize.width, RULER_HEIGHT]}
          stroke="#4a4a4a"
          strokeWidth={1}
        />
        {horizontalTicks.map((tick, idx) => (
          <Group key={`h-tick-${idx}`}>
            <Line
              points={[
                tick.x,
                RULER_HEIGHT - (tick.isMajor ? TICK_SIZE_LARGE : TICK_SIZE_SMALL),
                tick.x,
                RULER_HEIGHT,
              ]}
              stroke="#6a6a6a"
              strokeWidth={tick.isMajor ? 1.5 : 1}
            />
            {tick.isMajor && (
              <Text
                x={tick.x + TEXT_OFFSET}
                y={2}
                text={formatNumber(tick.value, 1)}
                fontSize={10}
                fill="#9a9a9a"
                fontFamily="monospace"
              />
            )}
          </Group>
        ))}
        {pointerPos && (
          <Line
            points={[
              pointerPos.x * zoom + scrollX,
              0,
              pointerPos.x * zoom + scrollX,
              RULER_HEIGHT,
            ]}
            stroke="#ef4444"
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.8}
          />
        )}
      </Layer>

      {/* Left Vertical Ruler */}
      <Layer listening={false} x={0} y={RULER_HEIGHT}>
        <Line
          points={[RULER_WIDTH, 0, RULER_WIDTH, stageSize.height]}
          stroke="#4a4a4a"
          strokeWidth={1}
        />
        {verticalTicks.map((tick, idx) => (
          <Group key={`v-tick-${idx}`}>
            <Line
              points={[
                RULER_WIDTH - (tick.isMajor ? TICK_SIZE_LARGE : TICK_SIZE_SMALL),
                tick.y,
                RULER_WIDTH,
                tick.y,
              ]}
              stroke="#6a6a6a"
              strokeWidth={tick.isMajor ? 1.5 : 1}
            />
            {tick.isMajor && (
              <Text
                x={2}
                y={tick.y + TEXT_OFFSET}
                text={formatNumber(tick.value, 1)}
                fontSize={10}
                fill="#9a9a9a"
                fontFamily="monospace"
                rotation={-90}
              />
            )}
          </Group>
        ))}
        {pointerPos && (
          <Line
            points={[
              0,
              pointerPos.y * zoom + scrollY,
              RULER_WIDTH,
              pointerPos.y * zoom + scrollY,
            ]}
            stroke="#ef4444"
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.8}
          />
        )}
      </Layer>

      {/* Corner */}
      <Layer listening={false} x={0} y={0}>
        <Line
          points={[RULER_WIDTH, 0, RULER_WIDTH, RULER_HEIGHT, 0, RULER_HEIGHT]}
          stroke="#4a4a4a"
          strokeWidth={1}
        />
        {zeroX >= 0 && zeroX <= stageSize.width && (
          <Line
            points={[RULER_WIDTH + zeroX * zoom, 0, RULER_WIDTH + zeroX * zoom, RULER_HEIGHT]}
            stroke="#4fd1c5"
            strokeWidth={1.5}
            opacity={0.6}
          />
        )}
        {zeroY >= 0 && zeroY <= stageSize.height && (
          <Line
            points={[0, RULER_HEIGHT + zeroY * zoom, RULER_WIDTH, RULER_HEIGHT + zeroY * zoom]}
            stroke="#4fd1c5"
            strokeWidth={1.5}
            opacity={0.6}
          />
        )}
      </Layer>
    </>
  );
};

export default Rulers;

