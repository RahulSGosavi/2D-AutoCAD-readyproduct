// src/canvas/AutoCADRulers.tsx
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../state/useEditorStore';

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
}) => {
  const drawingSettings = useEditorStore((state) => state.drawingSettings);
  // Use strokeColor from drawingSettings - this changes when user selects color
  const textColor = drawingSettings.strokeColor;
  
  const hCanvasRef = useRef<HTMLCanvasElement>(null);
  const vCanvasRef = useRef<HTMLCanvasElement>(null);

  const RULER_SIZE = 24;

  const getStep = (s: number) => {
    const px = 100 * s;
    if (px < 30) return 500;
    if (px < 60) return 200;
    if (px < 120) return 100;
    if (px < 240) return 50;
    return 20;
  };

  // Draw horizontal ruler
  useEffect(() => {
    const canvas = hCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = width - RULER_SIZE;
    canvas.width = w * dpr;
    canvas.height = RULER_SIZE * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = RULER_SIZE + 'px';
    ctx.scale(dpr, dpr);

    // Clear - transparent background
    ctx.clearRect(0, 0, w, RULER_SIZE);

    const step = getStep(scale);
    const start = Math.floor((-offsetX + RULER_SIZE) / scale / step) * step;
    const end = Math.ceil((width - offsetX) / scale / step) * step;

    for (let v = start; v <= end; v += step) {
      const x = v * scale + offsetX - RULER_SIZE;
      if (x < -20 || x > w + 20) continue;

      // Tick line - uses strokeColor
      ctx.fillStyle = textColor;
      ctx.fillRect(x, RULER_SIZE - 5, 1, 5);

      // Number - uses strokeColor, no background
      ctx.fillStyle = textColor;
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v), x, 10);
    }
  }, [width, scale, offsetX, textColor]);

  // Draw vertical ruler
  useEffect(() => {
    const canvas = vCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const h = height - RULER_SIZE;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = h * dpr;
    canvas.style.width = RULER_SIZE + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Clear - transparent background
    ctx.clearRect(0, 0, RULER_SIZE, h);

    const step = getStep(scale);
    const start = Math.floor((-offsetY + RULER_SIZE) / scale / step) * step;
    const end = Math.ceil((height - offsetY) / scale / step) * step;

    for (let v = start; v <= end; v += step) {
      const y = v * scale + offsetY - RULER_SIZE;
      if (y < -20 || y > h + 20) continue;

      // Tick line - uses strokeColor
      ctx.fillStyle = textColor;
      ctx.fillRect(RULER_SIZE - 5, y, 5, 1);

      // Number - uses strokeColor, no background
      ctx.fillStyle = textColor;
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v), RULER_SIZE - 7, y);
    }
  }, [height, scale, offsetY, textColor]);

  return (
    <>
      {/* Horizontal Ruler - transparent */}
      <canvas
        ref={hCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      />

      {/* Vertical Ruler - transparent */}
      <canvas
        ref={vCanvasRef}
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      />

      {/* Corner - transparent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: RULER_SIZE,
        height: RULER_SIZE,
        zIndex: 101,
        pointerEvents: 'none',
      }} />
    </>
  );
};
