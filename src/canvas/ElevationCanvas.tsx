// src/canvas/ElevationCanvas.tsx
// Elevation View - Front view of a wall showing cabinets, doors, windows at their heights

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer as KonvaLayer, Rect, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../state/useEditorStore';

// Default heights in mm
const DEFAULT_WALL_HEIGHT = 2440; // 8 feet
const DEFAULT_DOOR_HEIGHT = 2032; // 80 inches
const DEFAULT_WINDOW_SILL = 914; // 36 inches from floor
const DEFAULT_WINDOW_HEIGHT = 1219; // 48 inches
const DEFAULT_BASE_CABINET_HEIGHT = 864; // 34 inches
const DEFAULT_WALL_CABINET_HEIGHT = 762; // 30 inches
const DEFAULT_WALL_CABINET_FLOOR_HEIGHT = 1372; // 54 inches from floor
const COUNTERTOP_HEIGHT = 914; // 36 inches

interface ElevationCanvasProps {
  wallId: string | null;
}

export const ElevationCanvas: React.FC<ElevationCanvasProps> = ({ wallId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(0.2);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const {
    elements,
    selectedElementIds,
    setSelectedElements,
    updateElement,
    drawingSettings,
  } = useEditorStore();

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // Get the selected wall
  const wall = wallId ? elements.find(el => el.id === wallId && el.type === 'wall') : null;
  
  // Calculate wall length
  const getWallLength = () => {
    if (!wall || !('points' in wall)) return 3000;
    const pts = (wall as any).points;
    if (pts.length < 4) return 3000;
    const dx = pts[pts.length - 2] - pts[0];
    const dy = pts[pts.length - 1] - pts[1];
    return Math.hypot(dx, dy);
  };

  const wallLength = getWallLength();
  const wallHeight = (wall as any)?.wallHeight || DEFAULT_WALL_HEIGHT;

  // Calculate offset to center the wall
  const baseOffsetX = 120;
  const baseOffsetY = 100;

  // Get elements on this wall
  const getElementsOnWall = () => {
    if (!wall) return [];
    
    const wallPts = (wall as any).points || [];
    if (wallPts.length < 4) return [];
    
    const wallX1 = ((wall as any).x || 0) + wallPts[0];
    const wallY1 = ((wall as any).y || 0) + wallPts[1];
    const wallX2 = ((wall as any).x || 0) + wallPts[wallPts.length - 2];
    const wallY2 = ((wall as any).y || 0) + wallPts[wallPts.length - 1];
    const wallDx = wallX2 - wallX1;
    const wallDy = wallY2 - wallY1;
    const wallLen = Math.hypot(wallDx, wallDy);
    
    if (wallLen === 0) return [];
    
    // Find elements on or near this wall
    return elements.filter(el => {
      if (el.id === wallId) return false;
      // Include furniture, door, window, block types
      if (!['door', 'window', 'furniture', 'block'].includes(el.type)) return false;
      
      const elem = el as any;
      
      // Check if element has wallId property that matches
      if (elem.wallId === wallId) return true;
      
      // Otherwise check proximity to wall
      const elemX = elem.x || 0;
      const elemY = elem.y || 0;
      
      const dx = elemX - wallX1;
      const dy = elemY - wallY1;
      
      // Distance from wall line (perpendicular)
      const cross = Math.abs(dx * wallDy - dy * wallDx) / wallLen;
      // Increased tolerance to 300px to catch more elements
      if (cross > 300) return false;
      
      // Position along wall
      const dot = (dx * wallDx + dy * wallDy) / wallLen;
      // Allow elements slightly outside wall bounds
      if (dot < -200 || dot > wallLen + 200) return false;
      
      return true;
    }).map(el => {
      const elem = el as any;
      const elemX = elem.x || 0;
      const elemY = elem.y || 0;
      
      const dx = elemX - wallX1;
      const dy = elemY - wallY1;
      const posAlongWall = (dx * wallDx + dy * wallDy) / wallLen;
      
      return { ...el, elevationX: Math.max(0, Math.min(wallLen, posAlongWall)) };
    });
  };

  const elementsOnWall = getElementsOnWall();
  
  // Debug: log all elements and what's on wall
  const allPlaceableElements = elements.filter(e => ['door', 'window', 'furniture', 'block'].includes(e.type));
  console.log('All elements:', elements.length, 'Placeable:', allPlaceableElements.length);
  console.log('Element types:', [...new Set(elements.map(e => e.type))]);
  console.log('Wall:', wallId, 'Elements on wall:', elementsOnWall.length);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.15;
    const newScale = e.evt.deltaY < 0 ? scale * scaleBy : scale / scaleBy;
    setScale(Math.max(0.05, Math.min(1, newScale)));
  }, [scale]);

  // Handle panning
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || e.evt.ctrlKey) { // Middle mouse or Ctrl+click
      setIsPanning(true);
      setLastMousePos({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastMousePos.x;
      const dy = e.evt.clientY - lastMousePos.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setLastMousePos({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Floor line Y position
  const floorY = canvasSize.height - baseOffsetY + panOffset.y;

  // Render element in elevation view
  const renderElevationElement = (el: any) => {
    const x = baseOffsetX + el.elevationX * scale + panOffset.x;
    const width = (el.width || 600) * scale;
    
    let elemHeight = 0;
    let floorOffset = 0;
    let fill = '#94a3b8';
    let stroke = '#475569';
    let label = el.name || el.type;
    let showHandles = false;
    let showDoorSwing = false;

    switch (el.type) {
      case 'door':
        elemHeight = el.doorHeight || DEFAULT_DOOR_HEIGHT;
        floorOffset = 0;
        fill = 'linear-gradient(180deg, #d4a574 0%, #c49464 100%)';
        stroke = '#8b5a2b';
        label = el.name || 'Door';
        showHandles = true;
        showDoorSwing = true;
        break;
        
      case 'window':
        elemHeight = el.elevationHeight || DEFAULT_WINDOW_HEIGHT;
        floorOffset = el.sillHeight || DEFAULT_WINDOW_SILL;
        fill = '#b8e0f0';
        stroke = '#5a9ab8';
        label = el.name || 'Window';
        break;
        
      case 'furniture':
        const category = (el.category || '').toLowerCase();
        if (category.includes('wall') || category.includes('upper')) {
          elemHeight = el.elevationHeight || DEFAULT_WALL_CABINET_HEIGHT;
          floorOffset = el.floorHeight || DEFAULT_WALL_CABINET_FLOOR_HEIGHT;
          fill = '#a8d5ba';
          stroke = '#5a8a6a';
          label = el.name || 'Wall Cabinet';
        } else if (category.includes('tall')) {
          elemHeight = el.elevationHeight || 2134;
          floorOffset = 0;
          fill = '#d4c4a8';
          stroke = '#8a7a5a';
          label = el.name || 'Tall Cabinet';
        } else {
          elemHeight = el.elevationHeight || DEFAULT_BASE_CABINET_HEIGHT;
          floorOffset = 0;
          fill = '#c8d8b8';
          stroke = '#6a8a5a';
          label = el.name || 'Base Cabinet';
        }
        break;
        
      default:
        return null;
    }

    const scaledHeight = elemHeight * scale;
    const y = floorY - (floorOffset + elemHeight) * scale;
    const isSelected = selectedElementIds.includes(el.id);

    return (
      <Group key={el.id} onClick={() => setSelectedElements([el.id])}>
        {/* Main body */}
        <Rect
          x={x - width / 2}
          y={y}
          width={width}
          height={scaledHeight}
          fill={fill}
          stroke={isSelected ? '#0ea5e9' : stroke}
          strokeWidth={isSelected ? 3 : 1.5}
          cornerRadius={3}
          shadowColor="#000"
          shadowBlur={isSelected ? 8 : 3}
          shadowOpacity={0.2}
          shadowOffsetY={2}
        />
        
        {/* Door details - 2020 Design style */}
        {el.type === 'door' && (
          <>
            {/* Door frame */}
            <Rect
              x={x - width / 2 - 8}
              y={y - 5}
              width={width + 16}
              height={scaledHeight + 5}
              fill="transparent"
              stroke="#5d4e37"
              strokeWidth={3}
            />
            {/* Door frame top */}
            <Rect
              x={x - width / 2 - 8}
              y={y - 15}
              width={width + 16}
              height={15}
              fill="#8b7355"
              stroke="#5d4e37"
              strokeWidth={1}
            />
            {/* Door panel - main body */}
            <Rect
              x={x - width / 2 + 4}
              y={y + 4}
              width={width - 8}
              height={scaledHeight - 8}
              fill="#d4c4a8"
              stroke="#8b7355"
              strokeWidth={1.5}
            />
            {/* Door panels - decorative */}
            <Rect
              x={x - width / 2 + width * 0.12}
              y={y + scaledHeight * 0.04}
              width={width * 0.32}
              height={scaledHeight * 0.28}
              fill="transparent"
              stroke="#8b7355"
              strokeWidth={1.5}
              cornerRadius={3}
            />
            <Rect
              x={x - width / 2 + width * 0.56}
              y={y + scaledHeight * 0.04}
              width={width * 0.32}
              height={scaledHeight * 0.28}
              fill="transparent"
              stroke="#8b7355"
              strokeWidth={1.5}
              cornerRadius={3}
            />
            <Rect
              x={x - width / 2 + width * 0.12}
              y={y + scaledHeight * 0.36}
              width={width * 0.32}
              height={scaledHeight * 0.58}
              fill="transparent"
              stroke="#8b7355"
              strokeWidth={1.5}
              cornerRadius={3}
            />
            <Rect
              x={x - width / 2 + width * 0.56}
              y={y + scaledHeight * 0.36}
              width={width * 0.32}
              height={scaledHeight * 0.58}
              fill="transparent"
              stroke="#8b7355"
              strokeWidth={1.5}
              cornerRadius={3}
            />
            {/* Door handle plate */}
            <Rect
              x={x + width / 2 - width * 0.22}
              y={y + scaledHeight * 0.45}
              width={width * 0.08}
              height={scaledHeight * 0.15}
              fill="#c0a060"
              stroke="#8b6914"
              strokeWidth={1}
              cornerRadius={2}
            />
            {/* Door handle */}
            <Rect
              x={x + width / 2 - width * 0.20}
              y={y + scaledHeight * 0.50}
              width={width * 0.04}
              height={scaledHeight * 0.05}
              fill="#d4af37"
              cornerRadius={1}
            />
            {/* Door threshold */}
            <Rect
              x={x - width / 2 - 5}
              y={y + scaledHeight}
              width={width + 10}
              height={6}
              fill="#5d4e37"
            />
          </>
        )}
        
        {/* Window details - 2020 Design style */}
        {el.type === 'window' && (
          <>
            {/* Window frame outer */}
            <Rect
              x={x - width / 2 + 3}
              y={y + 3}
              width={width - 6}
              height={scaledHeight - 6}
              fill="transparent"
              stroke="#5a6a7a"
              strokeWidth={2}
            />
            {/* Window panes - 2x2 grid */}
            <Line
              points={[x, y + 6, x, y + scaledHeight - 6]}
              stroke={stroke}
              strokeWidth={1.5}
            />
            <Line
              points={[x - width / 2 + 6, y + scaledHeight / 2, x + width / 2 - 6, y + scaledHeight / 2]}
              stroke={stroke}
              strokeWidth={1.5}
            />
            {/* Glass panes with subtle fill */}
            <Rect
              x={x - width / 2 + 6}
              y={y + 6}
              width={width / 2 - 9}
              height={scaledHeight / 2 - 9}
              fill="rgba(135,206,250,0.3)"
              stroke="transparent"
            />
            <Rect
              x={x + 3}
              y={y + 6}
              width={width / 2 - 9}
              height={scaledHeight / 2 - 9}
              fill="rgba(135,206,250,0.3)"
              stroke="transparent"
            />
            <Rect
              x={x - width / 2 + 6}
              y={y + scaledHeight / 2 + 3}
              width={width / 2 - 9}
              height={scaledHeight / 2 - 9}
              fill="rgba(135,206,250,0.3)"
              stroke="transparent"
            />
            <Rect
              x={x + 3}
              y={y + scaledHeight / 2 + 3}
              width={width / 2 - 9}
              height={scaledHeight / 2 - 9}
              fill="rgba(135,206,250,0.3)"
              stroke="transparent"
            />
            {/* Glass reflections */}
            <Line
              points={[x - width / 4 - 5, y + scaledHeight * 0.15, x - width / 4 + 8, y + scaledHeight * 0.35]}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={3}
              lineCap="round"
            />
            <Line
              points={[x + width / 4 - 5, y + scaledHeight * 0.65, x + width / 4 + 8, y + scaledHeight * 0.85]}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={2}
              lineCap="round"
            />
            {/* Window sill */}
            <Rect
              x={x - width / 2 - 5}
              y={y + scaledHeight}
              width={width + 10}
              height={8}
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth={1}
            />
          </>
        )}
        
        {/* Cabinet details - 2020 Design style */}
        {el.type === 'furniture' && (
          <>
            {/* Base Cabinet */}
            {(el.category || '').toLowerCase().includes('base') && (
              <>
                {/* Top drawer */}
                <Rect
                  x={x - width / 2 + 5}
                  y={y + 5}
                  width={width - 10}
                  height={scaledHeight * 0.18}
                  fill="#e8e0d0"
                  stroke={stroke}
                  strokeWidth={1}
                  cornerRadius={2}
                />
                {/* Drawer handle */}
                <Rect
                  x={x - 15}
                  y={y + 5 + scaledHeight * 0.07}
                  width={30}
                  height={4}
                  fill="#94a3b8"
                  cornerRadius={2}
                />
                {/* Door(s) */}
                {width > 60 ? (
                  <>
                    {/* Two doors */}
                    <Rect
                      x={x - width / 2 + 5}
                      y={y + scaledHeight * 0.22}
                      width={width / 2 - 8}
                      height={scaledHeight * 0.73}
                      fill="#e8e0d0"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    <Rect
                      x={x + 3}
                      y={y + scaledHeight * 0.22}
                      width={width / 2 - 8}
                      height={scaledHeight * 0.73}
                      fill="#e8e0d0"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    {/* Door handles */}
                    <Rect
                      x={x - 8}
                      y={y + scaledHeight * 0.5}
                      width={4}
                      height={20}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                    <Rect
                      x={x + 4}
                      y={y + scaledHeight * 0.5}
                      width={4}
                      height={20}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                  </>
                ) : (
                  <>
                    {/* Single door */}
                    <Rect
                      x={x - width / 2 + 5}
                      y={y + scaledHeight * 0.22}
                      width={width - 10}
                      height={scaledHeight * 0.73}
                      fill="#e8e0d0"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    {/* Door handle */}
                    <Rect
                      x={x + width / 4}
                      y={y + scaledHeight * 0.5}
                      width={4}
                      height={20}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                  </>
                )}
              </>
            )}
            
            {/* Wall Cabinet */}
            {(el.category || '').toLowerCase().includes('wall') && (
              <>
                {/* Cabinet body */}
                <Rect
                  x={x - width / 2 + 3}
                  y={y + 3}
                  width={width - 6}
                  height={scaledHeight - 6}
                  fill="#d8e8d0"
                  stroke={stroke}
                  strokeWidth={1}
                />
                {width > 50 ? (
                  <>
                    {/* Two doors */}
                    <Rect
                      x={x - width / 2 + 5}
                      y={y + 5}
                      width={width / 2 - 8}
                      height={scaledHeight - 10}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    <Rect
                      x={x + 3}
                      y={y + 5}
                      width={width / 2 - 8}
                      height={scaledHeight - 10}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    {/* Handles */}
                    <Rect
                      x={x - 8}
                      y={y + scaledHeight * 0.7}
                      width={4}
                      height={15}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                    <Rect
                      x={x + 4}
                      y={y + scaledHeight * 0.7}
                      width={4}
                      height={15}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                  </>
                ) : (
                  <>
                    {/* Single door */}
                    <Rect
                      x={x - width / 2 + 5}
                      y={y + 5}
                      width={width - 10}
                      height={scaledHeight - 10}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1}
                      cornerRadius={2}
                    />
                    <Rect
                      x={x + width / 4}
                      y={y + scaledHeight * 0.7}
                      width={4}
                      height={15}
                      fill="#94a3b8"
                      cornerRadius={2}
                    />
                  </>
                )}
              </>
            )}
            
            {/* Tall Cabinet */}
            {(el.category || '').toLowerCase().includes('tall') && (
              <>
                {/* Upper section */}
                <Rect
                  x={x - width / 2 + 5}
                  y={y + 5}
                  width={width - 10}
                  height={scaledHeight * 0.45}
                  fill="#e0d8c8"
                  stroke={stroke}
                  strokeWidth={1}
                  cornerRadius={2}
                />
                {/* Lower section */}
                <Rect
                  x={x - width / 2 + 5}
                  y={y + scaledHeight * 0.52}
                  width={width - 10}
                  height={scaledHeight * 0.43}
                  fill="#e0d8c8"
                  stroke={stroke}
                  strokeWidth={1}
                  cornerRadius={2}
                />
                {/* Handles */}
                <Rect
                  x={x + width / 4}
                  y={y + scaledHeight * 0.25}
                  width={4}
                  height={20}
                  fill="#94a3b8"
                  cornerRadius={2}
                />
                <Rect
                  x={x + width / 4}
                  y={y + scaledHeight * 0.72}
                  width={4}
                  height={20}
                  fill="#94a3b8"
                  cornerRadius={2}
                />
              </>
            )}
            
            {/* Generic furniture - simple box with detail */}
            {!(el.category || '').toLowerCase().includes('base') && 
             !(el.category || '').toLowerCase().includes('wall') && 
             !(el.category || '').toLowerCase().includes('tall') && (
              <>
                <Rect
                  x={x - width / 2 + 4}
                  y={y + 4}
                  width={width - 8}
                  height={scaledHeight - 8}
                  fill="transparent"
                  stroke={stroke}
                  strokeWidth={1}
                  cornerRadius={2}
                />
              </>
            )}
          </>
        )}
        
        {/* Label */}
        <Text
          x={x - width / 2}
          y={y + scaledHeight / 2 - 6}
          width={width}
          text={label}
          fontSize={Math.max(8, 10 * scale * 5)}
          fill="#1e293b"
          align="center"
          fontStyle="bold"
        />
        
        {/* Dimension label */}
        <Text
          x={x + width / 2 + 8}
          y={y + scaledHeight / 2 - 5}
          text={`${Math.round(elemHeight)}mm`}
          fontSize={9}
          fill="#64748b"
        />
        
        {/* Floor height label */}
        {floorOffset > 0 && (
          <Text
            x={x + width / 2 + 8}
            y={y + scaledHeight + 5}
            text={`↑${Math.round(floorOffset)}mm`}
            fontSize={8}
            fill="#94a3b8"
          />
        )}
      </Group>
    );
  };

  const unit = drawingSettings.unit || 'mm';

  // Get all walls for wall selector
  const allWalls = elements.filter(el => el.type === 'wall');

  return (
    <div ref={containerRef} className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-slate-800/95 backdrop-blur flex items-center justify-between px-4 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold text-sm">
            📐 Elevation View
          </span>
          {wall && (
            <span className="text-slate-300 text-xs bg-slate-700 px-2 py-1 rounded">
              Wall: {wallLength.toFixed(0)}mm × {wallHeight}mm
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs">
            Zoom: {(scale * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setScale(0.2)}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
          >
            Reset
          </button>
          <button
            onClick={() => useEditorStore.getState().setViewMode('floorPlan')}
            className="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
          >
            ← Back to Floor Plan
          </button>
        </div>
      </div>

      {/* Wall Selector */}
      {allWalls.length > 1 && (
        <div className="absolute top-14 left-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg p-2 shadow-lg">
          <p className="text-xs text-slate-400 mb-2">Select Wall:</p>
          <div className="flex flex-wrap gap-1 max-w-xs">
            {allWalls.map((w, i) => (
              <button
                key={w.id}
                onClick={() => useEditorStore.getState().setSelectedWallForElevation(w.id)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  w.id === wallId
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Wall {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ marginTop: 48, cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <KonvaLayer>
          {/* Background grid */}
          {Array.from({ length: Math.ceil(canvasSize.width / 50) }).map((_, i) => (
            <Line
              key={`vgrid-${i}`}
              points={[i * 50, 0, i * 50, canvasSize.height]}
              stroke="#cbd5e1"
              strokeWidth={0.5}
              opacity={0.5}
            />
          ))}
          {Array.from({ length: Math.ceil(canvasSize.height / 50) }).map((_, i) => (
            <Line
              key={`hgrid-${i}`}
              points={[0, i * 50, canvasSize.width, i * 50]}
              stroke="#cbd5e1"
              strokeWidth={0.5}
              opacity={0.5}
            />
          ))}

          {/* Floor */}
          <Rect
            x={0}
            y={floorY}
            width={canvasSize.width}
            height={baseOffsetY}
            fill="#8b7355"
          />
          <Line
            points={[0, floorY, canvasSize.width, floorY]}
            stroke="#5d4e37"
            strokeWidth={3}
          />
          <Text
            x={10}
            y={floorY + 10}
            text="FLOOR"
            fontSize={10}
            fill="#d4c4a8"
            fontStyle="bold"
          />

          {/* Wall background */}
          {wall && (
            <Rect
              x={baseOffsetX + panOffset.x}
              y={floorY - wallHeight * scale}
              width={wallLength * scale}
              height={wallHeight * scale}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={2}
              shadowColor="#000"
              shadowBlur={10}
              shadowOpacity={0.1}
            />
          )}

          {/* Ceiling line */}
          {wall && (
            <>
              <Line
                points={[
                  baseOffsetX + panOffset.x - 20,
                  floorY - wallHeight * scale,
                  baseOffsetX + wallLength * scale + panOffset.x + 20,
                  floorY - wallHeight * scale,
                ]}
                stroke="#64748b"
                strokeWidth={2}
              />
              <Text
                x={baseOffsetX + panOffset.x - 60}
                y={floorY - wallHeight * scale - 5}
                text="CEILING"
                fontSize={9}
                fill="#64748b"
              />
            </>
          )}

          {/* Countertop line (36" / 914mm) */}
          {wall && (
            <>
              <Line
                points={[
                  baseOffsetX + panOffset.x,
                  floorY - COUNTERTOP_HEIGHT * scale,
                  baseOffsetX + wallLength * scale + panOffset.x,
                  floorY - COUNTERTOP_HEIGHT * scale,
                ]}
                stroke="#10b981"
                strokeWidth={1}
                dash={[5, 5]}
                opacity={0.7}
              />
              <Text
                x={baseOffsetX + wallLength * scale + panOffset.x + 10}
                y={floorY - COUNTERTOP_HEIGHT * scale - 5}
                text={`Countertop (${COUNTERTOP_HEIGHT}mm)`}
                fontSize={8}
                fill="#10b981"
              />
            </>
          )}

          {/* Height markers */}
          {wall && [0, 500, 1000, 1500, 2000, wallHeight].map(h => (
            <Group key={h}>
              <Line
                points={[
                  baseOffsetX + panOffset.x - 30,
                  floorY - h * scale,
                  baseOffsetX + panOffset.x - 10,
                  floorY - h * scale,
                ]}
                stroke="#64748b"
                strokeWidth={1}
              />
              <Text
                x={baseOffsetX + panOffset.x - 80}
                y={floorY - h * scale - 5}
                text={`${h}`}
                fontSize={10}
                fill="#475569"
                fontStyle="bold"
              />
            </Group>
          ))}

          {/* Height axis label */}
          {wall && (
            <Text
              x={baseOffsetX + panOffset.x - 110}
              y={floorY - wallHeight * scale / 2}
              text="Height (mm)"
              fontSize={10}
              fill="#64748b"
              rotation={-90}
            />
          )}

          {/* Width markers */}
          {wall && Array.from({ length: Math.ceil(wallLength / 500) + 1 }).map((_, i) => {
            const w = i * 500;
            if (w > wallLength) return null;
            return (
              <Group key={w}>
                <Line
                  points={[
                    baseOffsetX + w * scale + panOffset.x,
                    floorY,
                    baseOffsetX + w * scale + panOffset.x,
                    floorY + 15,
                  ]}
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <Text
                  x={baseOffsetX + w * scale + panOffset.x - 15}
                  y={floorY + 20}
                  text={`${w}`}
                  fontSize={10}
                  fill="#475569"
                />
              </Group>
            );
          })}

          {/* Elements on wall */}
          {elementsOnWall.map(el => renderElevationElement(el))}

          {/* Info if no elements */}
          {wall && elementsOnWall.length === 0 && (
            <>
              <Text
                x={baseOffsetX + wallLength * scale / 2 + panOffset.x - 120}
                y={floorY - wallHeight * scale / 2 - 30}
                text="No items detected on this wall"
                fontSize={14}
                fill="#64748b"
                align="center"
                fontStyle="bold"
              />
              <Text
                x={baseOffsetX + wallLength * scale / 2 + panOffset.x - 150}
                y={floorY - wallHeight * scale / 2}
                text={`Total placeable items in design: ${elements.filter(e => ['door', 'window', 'furniture', 'block'].includes(e.type)).length}\nElement types: ${[...new Set(elements.map(e => e.type))].join(', ')}\n\nPlace doors, windows, or furniture blocks\nnear this wall in Floor Plan view,\nor select a different wall above.`}
                fontSize={11}
                fill="#94a3b8"
                align="center"
                lineHeight={1.6}
              />
            </>
          )}
        </KonvaLayer>
      </Stage>

      {/* No wall selected overlay */}
      {!wall && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 mt-12">
          <div className="bg-slate-800 rounded-xl p-8 text-center max-w-md shadow-2xl">
            <div className="text-4xl mb-4">📐</div>
            <p className="text-white font-semibold text-lg mb-2">No Wall Selected</p>
            <p className="text-slate-400 text-sm mb-6">
              Double-click a wall in Floor Plan view to see its elevation
            </p>
            
            {allWalls.length > 0 ? (
              <div className="space-y-3">
                <p className="text-slate-500 text-xs">Or select a wall:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {allWalls.map((w, i) => (
                    <button
                      key={w.id}
                      onClick={() => useEditorStore.getState().setSelectedWallForElevation(w.id)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-all"
                    >
                      Wall {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No walls in design. Draw walls first in Floor Plan view.</p>
            )}
            
            <button
              onClick={() => useEditorStore.getState().setViewMode('floorPlan')}
              className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
            >
              ← Go to Floor Plan
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {wall && (
        <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur rounded-lg p-3 shadow-lg">
          <p className="text-xs text-slate-400 mb-2 font-medium">Legend</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: '#c8d8b8' }} />
              <span className="text-slate-300">Base Cabinet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: '#a8d5ba' }} />
              <span className="text-slate-300">Wall Cabinet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: '#d4a574' }} />
              <span className="text-slate-300">Door</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: '#b8e0f0' }} />
              <span className="text-slate-300">Window</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {wall && (
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-slate-400">
            <span className="text-slate-300 font-medium">Scroll</span> to zoom • 
            <span className="text-slate-300 font-medium"> Ctrl+Drag</span> to pan
          </p>
        </div>
      )}
    </div>
  );
};
