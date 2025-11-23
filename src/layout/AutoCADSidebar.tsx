// src/layout/AutoCADSidebar.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';

export const AutoCADSidebar: React.FC = () => {
  const { tool, setTool } = useEditorStore();

  const ToolButton: React.FC<{ 
    icon: string; 
    label: string; 
    toolType: string; 
    onClick?: () => void;
  }> = ({ icon, label, toolType, onClick }) => {
    const isActive = tool === toolType;
    return (
      <button
        onClick={onClick || (() => setTool(toolType as any))}
        className={`w-full flex flex-col items-center justify-center p-3 border-b border-slate-700 hover:bg-slate-700 transition-colors ${
          isActive ? 'bg-slate-600 border-l-2 border-l-blue-500' : ''
        }`}
        title={label}
      >
        <span className="text-2xl mb-1">{icon}</span>
        <span className="text-xs text-slate-300">{label}</span>
      </button>
    );
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-800 border-b border-slate-700">
      {title}
    </div>
  );

  return (
    <div className="w-20 bg-slate-900 border-r border-slate-700 overflow-y-auto flex flex-col">
      {/* SELECTION / NAVIGATION */}
      <SectionHeader title="Selection" />
      <ToolButton icon="👆" label="Select" toolType="select" />
      <ToolButton icon="✋" label="Pan" toolType="pan" />
      <ToolButton icon="🔍" label="Zoom" toolType="zoom" />
      <ToolButton icon="🧹" label="Eraser" toolType="erase" />

      {/* DRAWING TOOLS */}
      <SectionHeader title="Draw" />
      <ToolButton icon="📏" label="Line" toolType="line" />
      <ToolButton icon="📐" label="Polyline" toolType="polyline" />
      <ToolButton icon="⬜" label="Rectangle" toolType="rectangle" />
      <ToolButton icon="⭕" label="Circle" toolType="circle" />
      <ToolButton icon="◯" label="Arc" toolType="arc" />
      <ToolButton icon="🔘" label="Ellipse" toolType="ellipse" />
      <ToolButton icon="✏️" label="Freehand" toolType="pencil" />

      {/* ARCHITECTURAL TOOLS */}
      <SectionHeader title="Architecture" />
      <ToolButton icon="🧱" label="Wall" toolType="wall" />
      <ToolButton icon="🚪" label="Door" toolType="door" />
      <ToolButton icon="🪟" label="Window" toolType="window" />

      {/* ANNOTATIONS */}
      <SectionHeader title="Annotations" />
      <ToolButton icon="📝" label="Text" toolType="text" />
      <ToolButton icon="🧭" label="North Symbol" toolType="north-symbol" />
      <ToolButton icon="📏" label="Dimension" toolType="dimension" />
    </div>
  );
};

