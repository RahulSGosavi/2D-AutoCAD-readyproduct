// src/components/modern/ModernLayersPanel.tsx
import React from 'react';
import { X, Layers, Plus, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface ModernLayersPanelProps {
  onClose: () => void;
}

export const ModernLayersPanel: React.FC<ModernLayersPanelProps> = ({ onClose }) => {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    updateLayer,
    removeLayer,
  } = useEditorStore();

  const handleAddLayer = () => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      color: '#06b6d4',
    };
    addLayer(newLayer);
  };

  return (
    <div className="w-48 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl shadow-black/30 flex flex-col overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-violet-400" />
          <h3 className="text-white font-semibold">Layers</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddLayer}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white active:text-violet-400 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-all duration-200 active:scale-90 touch-manipulation"
            title="Add Layer"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 active:scale-90 touch-manipulation"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div 
        className="flex-1 overflow-y-auto p-2 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 animate-fade-in">
            <Layers size={32} className="mb-3 opacity-50" />
            <p className="text-sm">No layers yet</p>
            <button
              onClick={handleAddLayer}
              className="mt-4 px-5 py-3 min-h-[44px] bg-violet-500/20 text-violet-400 rounded-xl text-sm font-medium hover:bg-violet-500/30 active:bg-violet-500/40 transition-all duration-200 active:scale-95 touch-manipulation"
            >
              Create Layer
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {[...layers].reverse().map((layer, index) => {
              const isActive = layer.id === activeLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`group flex items-center gap-2 p-3 min-h-[56px] rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                    isActive
                      ? 'bg-violet-500/20 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                      : 'hover:bg-slate-800/50 active:bg-slate-700/50 border border-transparent'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards',
                  }}
                >
                  {/* Color Indicator */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: layer.color || '#06b6d4' }}
                  />

                  {/* Layer Name */}
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 rounded-lg px-2 py-1 transition-all ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { visible: !layer.visible });
                      }}
                      className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 touch-manipulation ${
                        layer.visible
                          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                          : 'text-slate-600 hover:text-slate-400 bg-slate-800/50'
                      }`}
                      title={layer.visible ? 'Hide' : 'Show'}
                    >
                      {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { locked: !layer.locked });
                      }}
                      className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 touch-manipulation ${
                        layer.locked
                          ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title={layer.locked ? 'Unlock' : 'Lock'}
                    >
                      {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 active:scale-90 touch-manipulation"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 text-xs text-slate-500">
        {layers.length} layer{layers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
