// src/components/modern/ModernPropertiesPanel.tsx
import React from 'react';
import { X, Settings2, Move, RotateCw, Maximize2 } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface ModernPropertiesPanelProps {
  onClose: () => void;
}

export const ModernPropertiesPanel: React.FC<ModernPropertiesPanelProps> = ({ onClose }) => {
  const {
    selectedElementIds,
    elements,
    updateElement,
    drawingSettings,
    setDrawingSettings,
  } = useEditorStore();

  const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div className="w-52 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl shadow-black/30 flex flex-col overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-emerald-400" />
          <h3 className="text-white font-semibold">Properties</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 active:scale-90 touch-manipulation"
        >
          <X size={18} />
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Selection Info */}
        {selectedElements.length > 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 animate-fade-in">
            <p className="text-xs text-slate-400 mb-1">Selected</p>
            <p className="text-sm text-white font-medium">
              {selectedElements.length === 1
                ? selectedElement?.type?.charAt(0).toUpperCase() + selectedElement?.type?.slice(1)
                : `${selectedElements.length} elements`}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400">No selection</p>
            <p className="text-xs text-slate-500 mt-1">Editing default settings</p>
          </div>
        )}

        {/* Position */}
        {selectedElement && 'x' in selectedElement && (
          <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <Move size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Position</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">X</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as any).x || 0)}
                  onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all touch-manipulation"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Y</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as any).y || 0)}
                  onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all touch-manipulation"
                />
              </div>
            </div>
          </div>
        )}

        {/* Size */}
        {selectedElement && 'width' in selectedElement && (
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <Maximize2 size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Size</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Width</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as any).width || 0)}
                  onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all touch-manipulation"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Height</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as any).height || 0)}
                  onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all touch-manipulation"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation - show for all element types */}
        {selectedElement && (
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <RotateCw size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rotation</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="360"
                value={(selectedElement as any).rotation || 0}
                onChange={(e) => updateElement(selectedElement.id, { rotation: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500 touch-manipulation"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((selectedElement as any).rotation || 0) / 360 * 100}%, #334155 ${((selectedElement as any).rotation || 0) / 360 * 100}%, #334155 100%)`,
                }}
              />
              <span className="text-sm text-white w-12 text-right font-medium">
                {Math.round((selectedElement as any).rotation || 0)}°
              </span>
            </div>
          </div>
        )}

        {/* Stroke Color */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <label className="text-xs text-slate-500 mb-2 block">
            Stroke Color {selectedElement ? '(Selected)' : '(New Drawings)'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(selectedElement as any)?.stroke || drawingSettings.strokeColor || '#000000'}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement.id, { stroke: e.target.value });
                } else {
                  setDrawingSettings({ ...drawingSettings, strokeColor: e.target.value });
                }
              }}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-600 bg-transparent"
            />
            <input
              type="text"
              value={(selectedElement as any)?.stroke || drawingSettings.strokeColor || '#000000'}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement.id, { stroke: e.target.value });
                } else {
                  setDrawingSettings({ ...drawingSettings, strokeColor: e.target.value });
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        {/* Fill Color */}
        <div className="animate-fade-in-up" style={{ animationDelay: '225ms' }}>
          <label className="text-xs text-slate-500 mb-2 block">
            Fill Color {selectedElement ? '(Selected)' : '(New Drawings)'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(selectedElement as any)?.fill && (selectedElement as any)?.fill !== 'transparent' ? (selectedElement as any)?.fill : drawingSettings.fillColor !== 'transparent' ? drawingSettings.fillColor : '#ffffff'}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement.id, { fill: e.target.value });
                } else {
                  setDrawingSettings({ ...drawingSettings, fillColor: e.target.value });
                }
              }}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-600 bg-transparent"
            />
            <input
              type="text"
              value={(selectedElement as any)?.fill || drawingSettings.fillColor || 'transparent'}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement.id, { fill: e.target.value });
                } else {
                  setDrawingSettings({ ...drawingSettings, fillColor: e.target.value });
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white"
            />
            <button
              onClick={() => {
                if (selectedElement) {
                  updateElement(selectedElement.id, { fill: 'transparent' });
                } else {
                  setDrawingSettings({ ...drawingSettings, fillColor: 'transparent' });
                }
              }}
              className="px-2 py-2 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-lg"
              title="No Fill"
            >
              None
            </button>
          </div>
        </div>

        {/* Stroke Width */}
        <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <label className="text-xs text-slate-500 mb-2 block">Stroke Width</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={selectedElement?.strokeWidth || drawingSettings.strokeWidth}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (selectedElement) {
                  updateElement(selectedElement.id, { strokeWidth: value });
                } else {
                  setDrawingSettings({ ...drawingSettings, strokeWidth: value });
                }
              }}
              className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500 touch-manipulation"
            />
            <span className="text-sm text-white w-12 text-right font-medium">
              {selectedElement?.strokeWidth || drawingSettings.strokeWidth}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
