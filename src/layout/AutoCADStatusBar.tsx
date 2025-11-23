// src/layout/AutoCADStatusBar.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';

interface AutoCADStatusBarProps {
  autosaveStatus?: 'saved' | 'saving' | 'unsaved';
}

export const AutoCADStatusBar: React.FC<AutoCADStatusBarProps> = ({ autosaveStatus = 'saved' }) => {
  const {
    pointer,
    snapSettings,
    stageScale,
    tool,
    layers,
    activeLayerId,
  } = useEditorStore();

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const snapModes: string[] = [];
  if (snapSettings.endpoint) snapModes.push('Endpoint');
  if (snapSettings.midpoint) snapModes.push('Midpoint');
  if (snapSettings.intersection) snapModes.push('Intersection');
  if (snapSettings.perpendicular) snapModes.push('Perpendicular');
  if (snapSettings.parallel) snapModes.push('Parallel');
  if (snapSettings.grid) snapModes.push('Grid');
  if (snapSettings.angle) snapModes.push('Angle');

  return (
    <div className="h-6 bg-slate-800 border-t border-slate-700 flex items-center text-xs text-slate-300 px-2">
      {/* Cursor Coordinates */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">X:</span>{' '}
        <span className="font-mono">{pointer.x.toFixed(1)}</span>{' '}
        <span className="text-slate-400">Y:</span>{' '}
        <span className="font-mono">{pointer.y.toFixed(1)}</span>
      </div>

      {/* Snap Mode */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Snap:</span>{' '}
        <span>{snapModes.length > 0 ? snapModes.join(', ') : 'None'}</span>
      </div>

      {/* Grid Status */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Grid:</span>{' '}
        <span className={snapSettings.showGrid ? 'text-green-400' : 'text-slate-500'}>
          {snapSettings.showGrid ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Ortho Status */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Ortho:</span>{' '}
        <span className={snapSettings.angle ? 'text-green-400' : 'text-slate-500'}>
          {snapSettings.angle ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Zoom */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Zoom:</span>{' '}
        <span className="font-mono">{(stageScale * 100).toFixed(0)}%</span>
      </div>

      {/* Selected Layer */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Layer:</span>{' '}
        <span>{activeLayer?.name || 'None'}</span>
      </div>

      {/* Active Tool */}
      <div className="px-3 border-r border-slate-700">
        <span className="text-slate-400">Tool:</span>{' '}
        <span className="capitalize">{tool}</span>
      </div>

      {/* Autosave Status */}
      <div className="px-3 flex-1 flex items-center justify-end">
        {autosaveStatus === 'saved' && (
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Saved
          </span>
        )}
        {autosaveStatus === 'saving' && (
          <span className="text-yellow-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Saving...
          </span>
        )}
        {autosaveStatus === 'unsaved' && (
          <span className="text-orange-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            Unsaved
          </span>
        )}
      </div>
    </div>
  );
};

