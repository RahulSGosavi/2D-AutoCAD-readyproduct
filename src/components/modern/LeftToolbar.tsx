// src/components/modern/LeftToolbar.tsx
import React from 'react';
import { useEditorStore } from '../../state/useEditorStore';
import { useThemeStore } from '../../state/useThemeStore';
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
  Spline,
  CircleDot,
  PieChart,
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'pan', icon: Move, label: 'Pan (H)' },
  { id: 'line', icon: Minus, label: 'Line (L)' },
  { id: 'polyline', icon: Spline, label: 'Polyline (PL)' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
  { id: 'circle', icon: Circle, label: 'Circle (C)' },
  { id: 'ellipse', icon: CircleDot, label: 'Ellipse (EL)' },
  { id: 'arc', icon: PieChart, label: 'Arc (A)' },
  { id: 'pencil', icon: Pencil, label: 'Freehand (P)' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'wall', icon: LayoutGrid, label: 'Wall (W)' },
  { id: 'door', icon: DoorOpen, label: 'Door (D)' },
  { id: 'window', icon: AppWindow, label: 'Window (N)' },
  { id: 'dimension', icon: Ruler, label: 'Dimension (M)' },
  { id: 'erase', icon: Eraser, label: 'Erase (E)' },
];

export const LeftToolbar: React.FC = () => {
  const { tool: activeTool, setTool } = useEditorStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className="flex flex-col items-center py-1 gap-0.5 z-50"
      style={{
        width: 40,
        backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
        borderRight: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
      }}
    >
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id as any)}
            title={t.label}
            className="relative flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: isActive 
                ? (isDark ? '#0ea5e9' : '#0284c7')
                : 'transparent',
              color: isActive 
                ? '#ffffff' 
                : (isDark ? '#94a3b8' : '#64748b'),
            }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
};

