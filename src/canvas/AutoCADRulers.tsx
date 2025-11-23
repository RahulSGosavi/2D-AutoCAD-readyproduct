// src/canvas/AutoCADRulers.tsx
import React from 'react';

interface AutoCADRulersProps {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
}

export const AutoCADRulers: React.FC<AutoCADRulersProps> = ({
  width,
  height,
  scale,
  offsetX,
  offsetY,
  gridSize,
}) => {
  const rulerHeight = 20;
  const rulerWidth = 20;

  // Calculate visible range
  const startX = -offsetX / scale;
  const endX = (width - offsetX) / scale;
  const startY = -offsetY / scale;
  const endY = (height - offsetY) / scale;

  // Generate tick marks
  const ticksX: Array<{ pos: number; label: string }> = [];
  const ticksY: Array<{ pos: number; label: string }> = [];

  const step = gridSize * Math.max(1, Math.floor(50 / (gridSize * scale)));
  const startTickX = Math.floor(startX / step) * step;
  const startTickY = Math.floor(startY / step) * step;

  for (let x = startTickX; x <= endX; x += step) {
    if (x >= startX) {
      ticksX.push({ pos: x, label: x.toFixed(0) });
    }
  }

  for (let y = startTickY; y <= endY; y += step) {
    if (y >= startY) {
      ticksY.push({ pos: y, label: y.toFixed(0) });
    }
  }

  return (
    <>
      {/* Top Ruler */}
      <div
        className="absolute top-0 left-0 bg-slate-700 border-b border-slate-600 z-10"
        style={{ width: `${width}px`, height: `${rulerHeight}px`, left: `${rulerWidth}px` }}
      >
        <svg width={width} height={rulerHeight} className="absolute">
          {ticksX.map((tick) => {
            const screenX = tick.pos * scale + offsetX;
            return (
              <g key={tick.pos}>
                <line
                  x1={screenX}
                  y1={0}
                  x2={screenX}
                  y2={rulerHeight}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
                <text
                  x={screenX + 2}
                  y={rulerHeight - 4}
                  fontSize="10"
                  fill="#cbd5e1"
                  className="select-none"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Left Ruler */}
      <div
        className="absolute top-0 left-0 bg-slate-700 border-r border-slate-600 z-10"
        style={{ width: `${rulerWidth}px`, height: `${height}px` }}
      >
        <svg width={rulerWidth} height={height} className="absolute">
          {ticksY.map((tick) => {
            const screenY = tick.pos * scale + offsetY;
            return (
              <g key={tick.pos}>
                <line
                  x1={0}
                  y1={screenY}
                  x2={rulerWidth}
                  y2={screenY}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
                <text
                  x={2}
                  y={screenY + 10}
                  fontSize="10"
                  fill="#cbd5e1"
                  className="select-none"
                  transform={`rotate(-90 ${2} ${screenY + 10})`}
                >
                  {tick.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Corner */}
      <div
        className="absolute top-0 left-0 bg-slate-800 border-b border-r border-slate-600 z-20"
        style={{ width: `${rulerWidth}px`, height: `${rulerHeight}px` }}
      />
    </>
  );
};

