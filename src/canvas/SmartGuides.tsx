// src/canvas/SmartGuides.tsx
import React from 'react';
import { Line } from 'react-konva';

interface SmartGuidesProps {
  guides: Array<{ type: 'horizontal' | 'vertical'; position: number }>;
  width: number;
  height: number;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({ guides, width, height }) => {
  return (
    <>
      {guides.map((guide, index) => {
        if (guide.type === 'horizontal') {
          return (
            <Line
              key={index}
              points={[0, guide.position, width, guide.position]}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              opacity={0.6}
              listening={false}
            />
          );
        } else {
          return (
            <Line
              key={index}
              points={[guide.position, 0, guide.position, height]}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              opacity={0.6}
              listening={false}
            />
          );
        }
      })}
    </>
  );
};
