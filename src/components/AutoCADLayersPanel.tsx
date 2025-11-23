// src/components/AutoCADLayersPanel.tsx
import React, { useState } from 'react';
import { useEditorStore } from '../state/useEditorStore';

export const AutoCADLayersPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
  } = useEditorStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      renameLayer(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
        <button
          onClick={addLayer}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`px-3 py-2 border-b border-slate-700 hover:bg-slate-700 cursor-pointer ${
              activeLayerId === layer.id ? 'bg-slate-700 border-l-2 border-l-blue-500' : ''
            }`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <div className="flex items-center gap-2">
              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="text-lg"
              >
                {layer.visible ? '👁️' : '🚫'}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className="text-lg"
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>

              {/* Layer Name */}
              <div className="flex-1 min-w-0">
                {editingId === layer.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRenameSubmit(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(layer.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditName('');
                      }
                    }}
                    className="w-full px-1 py-0.5 text-sm bg-slate-600 text-white rounded"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="text-sm text-white truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleRename(layer.id, layer.name);
                    }}
                  >
                    {layer.name}
                  </div>
                )}
              </div>

              {/* Color Indicator */}
              <div
                className="w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: layer.color || '#ffffff' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

