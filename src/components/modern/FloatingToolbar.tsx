// src/components/modern/FloatingToolbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../state/useEditorStore';
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  Type,
  Move,
  Eraser,
  LayoutGrid,
  Ruler,
  DoorOpen,
  AppWindow,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: Move, label: 'Pan', shortcut: 'H' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { id: 'pencil', icon: Pencil, label: 'Freehand', shortcut: 'P' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'wall', icon: LayoutGrid, label: 'Wall', shortcut: 'W' },
  { id: 'door', icon: DoorOpen, label: 'Door', shortcut: 'D' },
  { id: 'window', icon: AppWindow, label: 'Window', shortcut: 'N' },
  { id: 'dimension', icon: Ruler, label: 'Dimension', shortcut: 'M' },
  { id: 'erase', icon: Eraser, label: 'Erase', shortcut: 'E' },
];

export const FloatingToolbar: React.FC = () => {
  const { tool: activeTool, setTool } = useEditorStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch drag
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      offsetX: position.x,
      offsetY: position.y,
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.offsetX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.offsetY + deltaY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 select-none touch-none"
      style={{ 
        left: position.x, 
        top: position.y,
        transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
      }}
    >
      <div
        className={`bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 ${
          isDragging ? 'shadow-cyan-500/20 scale-105' : ''
        }`}
      >
        {/* Drag Handle */}
        <div 
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors touch-manipulation"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripVertical size={16} className="text-slate-500" />
        </div>

        {/* Tools */}
        <div 
          className={`flex flex-col p-2 gap-1 transition-all duration-300 ease-out ${
            isCollapsed ? 'max-h-0 overflow-hidden py-0 opacity-0' : 'max-h-[600px] opacity-100'
          }`}
        >
          {tools.map((t, index) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id as any)}
                className={`group relative flex items-center justify-center min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                }`}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
                title={`${t.label} (${t.shortcut})`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip - hidden on touch devices */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-xl hidden md:block">
                  {t.label}
                  <span className="ml-2 text-slate-400 text-xs">{t.shortcut}</span>
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full py-3 min-h-[44px] flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-all duration-200 border-t border-slate-700/50 active:scale-95 touch-manipulation"
        >
          <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            <ChevronUp size={18} />
          </div>
        </button>
      </div>
    </div>
  );
};
