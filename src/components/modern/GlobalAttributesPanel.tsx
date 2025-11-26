// src/components/modern/GlobalAttributesPanel.tsx
import React, { useState } from 'react';
import { X, Palette, Settings, Layers, ArrowUp } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface GlobalAttributesPanelProps {
  onClose: () => void;
}

export const GlobalAttributesPanel: React.FC<GlobalAttributesPanelProps> = ({ onClose }) => {
  const { elements, updateElement, drawingSettings, setDrawingSettings } = useEditorStore();

  const { selectedElementIds } = useEditorStore();
  
  const [selectedCategory, setSelectedCategory] = useState<'selected' | 'all' | 'cabinets' | 'furniture' | 'walls'>('selected');
  const [strokeColor, setStrokeColor] = useState(drawingSettings.strokeColor || '#000000');
  const [fillColor, setFillColor] = useState(drawingSettings.fillColor || 'transparent');
  const [topAlign, setTopAlign] = useState('2286'); // 90 inches in mm (wall cabinet top)
  
  const presetColors = [
    '#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b',
  ];

  // Get elements by category
  const getElementsByCategory = () => {
    switch (selectedCategory) {
      case 'selected':
        return elements.filter(el => selectedElementIds.includes(el.id));
      case 'cabinets':
        return elements.filter(el => 
          el.type === 'furniture' && 
          ['base', 'wall', 'tall', 'corner'].some(t => 
            ((el as any).category || '').toLowerCase().includes(t) ||
            ((el as any).name || '').toLowerCase().includes('cabinet')
          )
        );
      case 'furniture':
        return elements.filter(el => el.type === 'furniture');
      case 'walls':
        return elements.filter(el => el.type === 'wall');
      default:
        return elements;
    }
  };

  // Apply stroke color to all selected category
  const applyStrokeColor = () => {
    const targetElements = getElementsByCategory();
    targetElements.forEach(el => {
      updateElement(el.id, { stroke: strokeColor });
    });
    // Also update default
    setDrawingSettings({ ...drawingSettings, strokeColor });
  };

  // Apply fill color to all selected category
  const applyFillColor = () => {
    const targetElements = getElementsByCategory();
    targetElements.forEach(el => {
      updateElement(el.id, { fill: fillColor } as any);
    });
    // Also update default
    setDrawingSettings({ ...drawingSettings, fillColor });
  };

  // Apply top alignment (for wall cabinets)
  const applyTopAlign = () => {
    const wallCabinets = elements.filter(el => 
      el.type === 'furniture' && 
      ((el as any).category || '').toLowerCase().includes('wall')
    );
    
    const topValue = parseFloat(topAlign) || 2286;
    wallCabinets.forEach(el => {
      const height = (el as any).height || 762; // Default 30 inch cabinet
      const newY = topValue - height;
      updateElement(el.id, { y: newY, topAlign: topValue } as any);
    });
  };

  const categoryCount = getElementsByCategory().length;

  return (
    <div className="w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-violet-400" />
          <h3 className="text-white font-semibold text-sm">Global Attributes</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Category Selection */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2 block">
            Apply To
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'selected', label: `Selected (${selectedElementIds.length})`, highlight: true },
              { value: 'all', label: 'All Items' },
              { value: 'cabinets', label: 'Cabinets' },
              { value: 'furniture', label: 'Furniture' },
              { value: 'walls', label: 'Walls' },
            ].map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value as any)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? cat.value === 'selected' 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-violet-500/20 text-violet-400 border border-violet-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700'
                } ${cat.value === 'selected' && selectedElementIds.length === 0 ? 'opacity-50' : ''}`}
                disabled={cat.value === 'selected' && selectedElementIds.length === 0}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {selectedCategory === 'selected' 
              ? `${selectedElementIds.length} element(s) selected on canvas`
              : `${categoryCount} items will be affected`}
          </p>
        </div>

        {/* Stroke Color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette size={14} className="text-slate-400" />
            <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Stroke Color
            </label>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {presetColors.map(color => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${
                  strokeColor === color 
                    ? 'border-white scale-110' 
                    : 'border-transparent hover:border-slate-500'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={applyStrokeColor}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all"
          >
            Apply Stroke Color
          </button>
        </div>

        {/* Fill Color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-slate-400" />
            <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Fill Color
            </label>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setFillColor('transparent')}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                fillColor === 'transparent' 
                  ? 'border-white scale-110' 
                  : 'border-transparent hover:border-slate-500'
              }`}
              style={{
                background: 'repeating-linear-gradient(45deg, #334155, #334155 2px, #1e293b 2px, #1e293b 4px)',
              }}
              title="Transparent"
            />
            {presetColors.map(color => (
              <button
                key={color}
                onClick={() => setFillColor(color)}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${
                  fillColor === color 
                    ? 'border-white scale-110' 
                    : 'border-transparent hover:border-slate-500'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={applyFillColor}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all"
          >
            Apply Fill Color
          </button>
        </div>

        {/* Top Alignment (for wall cabinets) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp size={14} className="text-slate-400" />
            <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Top Alignment (Wall Cabinets)
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={topAlign}
              onChange={(e) => setTopAlign(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              placeholder="2286"
            />
            <span className="flex items-center text-xs text-slate-500">mm</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard: 2286mm (90") from floor
          </p>
          <button
            onClick={applyTopAlign}
            className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all"
          >
            Apply Top Alignment
          </button>
        </div>
      </div>
    </div>
  );
};

