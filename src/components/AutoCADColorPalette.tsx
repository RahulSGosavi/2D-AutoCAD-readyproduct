// src/components/AutoCADColorPalette.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000',
  '#008000', '#000080', '#808000', '#800080', '#008080',
  '#C0C0C0', '#FF8080', '#80FF80', '#8080FF', '#FFFF80',
  '#FF80FF', '#80FFFF', '#404040', '#FF4040', '#40FF40',
];

const LINE_TYPES = [
  { value: 'solid', label: 'Solid', dash: [] },
  { value: 'dashed', label: 'Dashed', dash: [10, 5] },
  { value: 'dotted', label: 'Dotted', dash: [2, 3] },
  { value: 'dash-dot', label: 'Dash-Dot', dash: [10, 3, 2, 3] },
];

export const AutoCADColorPalette: React.FC = () => {
  const { drawingSettings, updateDrawingSettings } = useEditorStore();

  return (
    <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Color & Stroke</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Stroke Color */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Stroke Color</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="color"
              value={drawingSettings.strokeColor}
              onChange={(e) => updateDrawingSettings({ strokeColor: e.target.value })}
              className="w-10 h-10 rounded border border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={drawingSettings.strokeColor}
              onChange={(e) => updateDrawingSettings({ strokeColor: e.target.value })}
              className="flex-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600"
            />
          </div>
          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateDrawingSettings({ strokeColor: color })}
                className={`w-8 h-8 rounded border-2 ${
                  drawingSettings.strokeColor === color
                    ? 'border-blue-500'
                    : 'border-slate-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Fill Color */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Fill Color</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="color"
              value={drawingSettings.fillColor}
              onChange={(e) => updateDrawingSettings({ fillColor: e.target.value })}
              className="w-10 h-10 rounded border border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={drawingSettings.fillColor}
              onChange={(e) => updateDrawingSettings({ fillColor: e.target.value })}
              className="flex-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600"
            />
          </div>
          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateDrawingSettings({ fillColor: color })}
                className={`w-8 h-8 rounded border-2 ${
                  drawingSettings.fillColor === color
                    ? 'border-blue-500'
                    : 'border-slate-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Stroke Width: {drawingSettings.strokeWidth}px
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={drawingSettings.strokeWidth}
            onChange={(e) => updateDrawingSettings({ strokeWidth: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Line Type */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Line Type</label>
          <select
            value="solid" // TODO: Add lineType to drawingSettings
            onChange={(e) => {
              // TODO: Implement line type
            }}
            className="w-full px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600"
          >
            {LINE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Opacity: {Math.round((drawingSettings.opacity || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round((drawingSettings.opacity || 1) * 100)}
            onChange={(e) => {
              updateDrawingSettings({ opacity: parseFloat(e.target.value) / 100 });
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

