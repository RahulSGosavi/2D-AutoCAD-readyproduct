// src/components/modern/PlacementBox.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Move, Crosshair, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface PlacementBoxProps {
  onClose: () => void;
}

export const PlacementBox: React.FC<PlacementBoxProps> = ({ onClose }) => {
  const {
    selectedElementIds,
    elements,
    updateElement,
    pointer,
    drawingSettings,
  } = useEditorStore();

  const [wallLeft, setWallLeft] = useState<string>('');
  const [wallRight, setWallRight] = useState<string>('');
  const [fromFloor, setFromFloor] = useState<string>('');
  const [activeField, setActiveField] = useState<'wallLeft' | 'wallRight' | 'fromFloor' | null>(null);

  const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  // Find the wall that the selected element is on
  const findParentWall = useCallback(() => {
    if (!selectedElement) return null;
    
    // Find walls in the design
    const walls = elements.filter(el => el.type === 'wall' || el.type === 'line');
    
    for (const wall of walls) {
      if ('points' in wall && wall.points && wall.points.length >= 4) {
        const wallX1 = wall.x + wall.points[0];
        const wallY1 = wall.y + wall.points[1];
        const wallX2 = wall.x + wall.points[wall.points.length - 2];
        const wallY2 = wall.y + wall.points[wall.points.length - 1];
        
        const elemX = (selectedElement as any).x || 0;
        const elemY = (selectedElement as any).y || 0;
        
        // Check if element is near this wall (within threshold)
        const distToWall = pointToLineDistance(elemX, elemY, wallX1, wallY1, wallX2, wallY2);
        if (distToWall < 50) {
          return {
            wall,
            startX: wallX1,
            startY: wallY1,
            endX: wallX2,
            endY: wallY2,
            length: Math.hypot(wallX2 - wallX1, wallY2 - wallY1),
          };
        }
      }
    }
    return null;
  }, [selectedElement, elements]);

  // Calculate distance from point to line
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    return Math.hypot(px - xx, py - yy);
  };

  // Update wall distances when element changes
  useEffect(() => {
    if (selectedElement && 'x' in selectedElement) {
      const parentWall = findParentWall();
      if (parentWall) {
        const elemX = (selectedElement as any).x || 0;
        const elemY = (selectedElement as any).y || 0;
        
        // Calculate distance from wall start (left)
        const distFromStart = Math.hypot(elemX - parentWall.startX, elemY - parentWall.startY);
        // Calculate distance from wall end (right)
        const distFromEnd = Math.hypot(elemX - parentWall.endX, elemY - parentWall.endY);
        
        const scale = drawingSettings.unitScale || 1;
        setWallLeft((distFromStart * scale).toFixed(1));
        setWallRight((distFromEnd * scale).toFixed(1));
      }
    }
  }, [selectedElement, findParentWall, drawingSettings.unitScale]);

  // Handle wall left distance change
  const handleWallLeftChange = (value: string) => {
    setWallLeft(value);
    if (selectedElement && value) {
      const parentWall = findParentWall();
      if (parentWall) {
        const distance = parseFloat(value) / (drawingSettings.unitScale || 1);
        const angle = Math.atan2(parentWall.endY - parentWall.startY, parentWall.endX - parentWall.startX);
        const newX = parentWall.startX + Math.cos(angle) * distance;
        const newY = parentWall.startY + Math.sin(angle) * distance;
        updateElement(selectedElement.id, { x: newX, y: newY });
      }
    }
  };

  // Handle wall right distance change
  const handleWallRightChange = (value: string) => {
    setWallRight(value);
    if (selectedElement && value) {
      const parentWall = findParentWall();
      if (parentWall) {
        const distance = parseFloat(value) / (drawingSettings.unitScale || 1);
        const angle = Math.atan2(parentWall.startY - parentWall.endY, parentWall.startX - parentWall.endX);
        const newX = parentWall.endX + Math.cos(angle) * distance;
        const newY = parentWall.endY + Math.sin(angle) * distance;
        updateElement(selectedElement.id, { x: newX, y: newY });
      }
    }
  };

  // Handle keyboard enter
  const handleKeyDown = (e: React.KeyboardEvent, field: 'wallLeft' | 'wallRight' | 'fromFloor') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'wallLeft') {
        handleWallLeftChange(wallLeft);
      } else if (field === 'wallRight') {
        handleWallRightChange(wallRight);
      }
      // Move to next field with Tab-like behavior
      if (field === 'wallLeft') setActiveField('wallRight');
      else if (field === 'wallRight') setActiveField('fromFloor');
      else setActiveField(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (field === 'wallLeft') setActiveField('wallRight');
      else if (field === 'wallRight') setActiveField('fromFloor');
      else setActiveField('wallLeft');
    }
  };

  const unit = drawingSettings.unit || 'mm';

  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Crosshair size={16} className="text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Placement</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Coords Tab */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide font-medium">
            <Move size={12} />
            <span>Coordinates</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">X</label>
              <input
                type="number"
                value={Math.round(pointer.x * (drawingSettings.unitScale || 1))}
                readOnly
                className="w-full px-2 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Y</label>
              <input
                type="number"
                value={Math.round(pointer.y * (drawingSettings.unitScale || 1))}
                readOnly
                className="w-full px-2 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Wall Distance Inputs */}
        <div className="space-y-3 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide font-medium">
            <ArrowLeft size={12} />
            <span>Wall Distance</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowLeft size={14} className="text-cyan-400 flex-shrink-0" />
              <label className="text-xs text-slate-400 w-16">Wall Left</label>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="number"
                  value={wallLeft}
                  onChange={(e) => setWallLeft(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'wallLeft')}
                  onBlur={() => handleWallLeftChange(wallLeft)}
                  onFocus={() => setActiveField('wallLeft')}
                  placeholder="0"
                  className={`w-full px-2 py-2 bg-slate-800/80 border rounded-lg text-xs text-white font-mono focus:outline-none transition-all ${
                    activeField === 'wallLeft' 
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                      : 'border-slate-700 focus:border-cyan-500/50'
                  }`}
                />
                <span className="text-xs text-slate-500 w-8">{unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowRight size={14} className="text-emerald-400 flex-shrink-0" />
              <label className="text-xs text-slate-400 w-16">Wall Right</label>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="number"
                  value={wallRight}
                  onChange={(e) => setWallRight(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'wallRight')}
                  onBlur={() => handleWallRightChange(wallRight)}
                  onFocus={() => setActiveField('wallRight')}
                  placeholder="0"
                  className={`w-full px-2 py-2 bg-slate-800/80 border rounded-lg text-xs text-white font-mono focus:outline-none transition-all ${
                    activeField === 'wallRight' 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                      : 'border-slate-700 focus:border-emerald-500/50'
                  }`}
                />
                <span className="text-xs text-slate-500 w-8">{unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUp size={14} className="text-violet-400 flex-shrink-0" />
              <label className="text-xs text-slate-400 w-16">From Floor</label>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="number"
                  value={fromFloor}
                  onChange={(e) => setFromFloor(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'fromFloor')}
                  onFocus={() => setActiveField('fromFloor')}
                  placeholder="0"
                  className={`w-full px-2 py-2 bg-slate-800/80 border rounded-lg text-xs text-white font-mono focus:outline-none transition-all ${
                    activeField === 'fromFloor' 
                      ? 'border-violet-500 ring-2 ring-violet-500/20' 
                      : 'border-slate-700 focus:border-violet-500/50'
                  }`}
                />
                <span className="text-xs text-slate-500 w-8">{unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Element Info */}
        {selectedElement && (
          <div className="pt-2 border-t border-slate-700/50">
            <div className="bg-slate-800/50 rounded-lg p-2">
              <p className="text-xs text-slate-400">Selected: <span className="text-white">{selectedElement.type}</span></p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
          <p>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Tab</kbd> to move between fields</p>
          <p>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Enter</kbd> to apply value</p>
        </div>
      </div>
    </div>
  );
};

