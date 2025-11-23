// src/canvas/SelectionWindow.tsx
import React from 'react';
import { Rect } from 'react-konva';

interface SelectionWindowProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isLeftToRight: boolean; // true = blue (inside), false = green (touch)
}

export const SelectionWindow: React.FC<SelectionWindowProps> = ({
  startX,
  startY,
  endX,
  endY,
  isLeftToRight,
}) => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={isLeftToRight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'}
      stroke={isLeftToRight ? '#3b82f6' : '#22c55e'}
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

