// src/components/AutoCADBlocksPanel.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { nanoid } from 'nanoid';

interface BlockTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  width: number;
  height: number;
  type: string;
}

const BLOCKS: BlockTemplate[] = [
  // Kitchen
  { id: 'base-cabinet', name: 'Base Cabinet', category: 'kitchen', icon: '🗄️', width: 600, height: 600, type: 'furniture' },
  { id: 'wall-cabinet', name: 'Wall Cabinet', category: 'kitchen', icon: '📦', width: 600, height: 350, type: 'furniture' },
  { id: 'sink-unit', name: 'Sink Unit', category: 'kitchen', icon: '🚿', width: 900, height: 600, type: 'furniture' },
  { id: 'hob-unit', name: 'Hob Unit', category: 'kitchen', icon: '🔥', width: 900, height: 600, type: 'furniture' },
  { id: 'refrigerator', name: 'Refrigerator', category: 'kitchen', icon: '❄️', width: 600, height: 1800, type: 'furniture' },
  { id: 'microwave', name: 'Microwave', category: 'kitchen', icon: '📻', width: 600, height: 400, type: 'furniture' },
  
  // Bathroom
  { id: 'wc', name: 'WC', category: 'bathroom', icon: '🚽', width: 400, height: 700, type: 'furniture' },
  { id: 'wash-basin', name: 'Wash Basin', category: 'bathroom', icon: '🚰', width: 600, height: 400, type: 'furniture' },
  { id: 'shower-panel', name: 'Shower Panel', category: 'bathroom', icon: '🚿', width: 900, height: 900, type: 'furniture' },
  { id: 'floor-drain', name: 'Floor Drain', category: 'bathroom', icon: '💧', width: 100, height: 100, type: 'furniture' },
  
  // Furniture
  { id: 'bed-single', name: 'Bed (Single)', category: 'furniture', icon: '🛏️', width: 1000, height: 2000, type: 'furniture' },
  { id: 'bed-double', name: 'Bed (Double)', category: 'furniture', icon: '🛏️', width: 1600, height: 2000, type: 'furniture' },
  { id: 'sofa-2', name: 'Sofa (2-seater)', category: 'furniture', icon: '🛋️', width: 1600, height: 800, type: 'furniture' },
  { id: 'sofa-3', name: 'Sofa (3-seater)', category: 'furniture', icon: '🛋️', width: 2100, height: 800, type: 'furniture' },
  { id: 'table-round', name: 'Table (Round)', category: 'furniture', icon: '🪑', width: 1200, height: 1200, type: 'furniture' },
  { id: 'table-rect', name: 'Table (Rect)', category: 'furniture', icon: '🪑', width: 1800, height: 900, type: 'furniture' },
  { id: 'wardrobe', name: 'Wardrobe', category: 'furniture', icon: '👔', width: 1200, height: 2400, type: 'furniture' },
  { id: 'tv-unit', name: 'TV Unit', category: 'furniture', icon: '📺', width: 2400, height: 600, type: 'furniture' },
  
  // Electrical
  { id: 'switchboard', name: 'Switchboard', category: 'electrical', icon: '⚡', width: 300, height: 400, type: 'furniture' },
  { id: 'power-socket', name: 'Power Socket', category: 'electrical', icon: '🔌', width: 100, height: 100, type: 'furniture' },
  { id: 'light-point', name: 'Light Point', category: 'electrical', icon: '💡', width: 100, height: 100, type: 'furniture' },
  { id: 'fan-point', name: 'Fan Point', category: 'electrical', icon: '🌀', width: 100, height: 100, type: 'furniture' },
  { id: 'ac-point', name: 'AC Point', category: 'electrical', icon: '❄️', width: 100, height: 100, type: 'furniture' },
  
  // Plumbing
  { id: 'water-line', name: 'Hot/Cold Water', category: 'plumbing', icon: '🚿', width: 50, height: 50, type: 'furniture' },
  { id: 'drain-pipe', name: 'Drain Pipe', category: 'plumbing', icon: '💧', width: 50, height: 50, type: 'furniture' },
];

export const AutoCADBlocksPanel: React.FC = () => {
  const { activeLayerId, drawingSettings, addElement } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('kitchen');

  const categories = Array.from(new Set(BLOCKS.map((b) => b.category)));

  const handleDragStart = (e: React.DragEvent, block: BlockTemplate) => {
    const data = JSON.stringify(block);
    e.dataTransfer.setData('application/json', data);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleBlockClick = (block: BlockTemplate) => {
    if (!activeLayerId) return;
    
    const element = {
      id: nanoid(),
      type: block.type as any,
      layerId: activeLayerId,
      x: 0,
      y: 0,
      width: block.width,
      height: block.height,
      stroke: drawingSettings.strokeColor,
      strokeWidth: drawingSettings.strokeWidth,
      fill: drawingSettings.fillColor,
      opacity: 1,
      rotation: 0,
      category: block.category,
    };
    
    addElement(element as any);
  };

  const filteredBlocks = BLOCKS.filter((b) => b.category === selectedCategory);

  return (
    <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      <div className="p-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Blocks Library</h3>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
              selectedCategory === cat
                ? 'border-blue-500 text-blue-400 bg-slate-700'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredBlocks.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(e, block)}
            onClick={() => handleBlockClick(block)}
            className="flex items-center gap-2 p-2 mb-1 bg-slate-700 hover:bg-slate-600 rounded cursor-move transition-colors"
          >
            <span className="text-2xl">{block.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{block.name}</div>
              <div className="text-xs text-slate-400">
                {block.width} × {block.height}mm
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

