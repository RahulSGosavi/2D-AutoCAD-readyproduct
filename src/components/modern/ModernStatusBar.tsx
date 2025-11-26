// src/components/modern/ModernStatusBar.tsx
import React from 'react';
import { useEditorStore } from '../../state/useEditorStore';
import {
  MousePointer2,
  Grid3X3,
  Magnet,
  ZoomIn,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ModernStatusBarProps {
  autosaveStatus: 'saved' | 'saving' | 'unsaved';
}

export const ModernStatusBar: React.FC<ModernStatusBarProps> = ({ autosaveStatus }) => {
  const { tool, snapSettings, setSnapSettings, stageScale, stagePosition, drawingSettings } = useEditorStore();

  const zoomPercent = Math.round((stageScale || 1) * 100);

  const toolLabels: Record<string, string> = {
    select: 'Select',
    pan: 'Pan',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    ellipse: 'Ellipse',
    freehand: 'Freehand',
    text: 'Text',
    wall: 'Wall',
    door: 'Door',
    window: 'Window',
    dimension: 'Dimension',
    erase: 'Erase',
  };

  return (
    <div className="h-10 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-700/50 flex items-center justify-between px-4 text-xs transition-colors duration-300">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Current Tool */}
        <div className="flex items-center gap-2 text-slate-400">
          <MousePointer2 size={12} />
          <span className="text-cyan-400 font-medium">{toolLabels[tool] || tool}</span>
        </div>

        {/* Cursor Position - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <span>X: {Math.round(stagePosition?.x || 0)}</span>
          <span>Y: {Math.round(stagePosition?.y || 0)}</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-2">
        {/* Grid Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, showGrid: !snapSettings.showGrid })}
          className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
            snapSettings.showGrid
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Grid3X3 size={12} />
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, snapToGrid: !snapSettings.snapToGrid })}
          className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
            snapSettings.snapToGrid
              ? 'text-violet-400 bg-violet-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Magnet size={12} />
          <span className="hidden sm:inline">Snap</span>
        </button>

        {/* Ortho Mode */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, orthoMode: !snapSettings.orthoMode })}
          className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
            snapSettings.orthoMode
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>Ortho</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Zoom */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <ZoomIn size={12} />
          <span className="font-medium">{zoomPercent}%</span>
        </div>

        {/* Unit - hidden on mobile */}
        <div className="hidden sm:block text-slate-500">
          Unit: <span className="text-slate-300">{drawingSettings.unit?.toUpperCase() || 'MM'}</span>
        </div>

        {/* Autosave Status */}
        <div className="flex items-center gap-1.5">
          {autosaveStatus === 'saved' && (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 hidden sm:inline">Saved</span>
            </>
          )}
          {autosaveStatus === 'saving' && (
            <>
              <Loader2 size={12} className="text-amber-400 animate-spin" />
              <span className="text-amber-400 hidden sm:inline">Saving...</span>
            </>
          )}
          {autosaveStatus === 'unsaved' && (
            <>
              <AlertCircle size={12} className="text-slate-500" />
              <span className="text-slate-500 hidden sm:inline">Unsaved</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
