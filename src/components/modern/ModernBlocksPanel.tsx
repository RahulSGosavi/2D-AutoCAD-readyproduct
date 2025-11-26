// src/components/modern/ModernBlocksPanel.tsx
import React, { useState, useRef } from 'react';
import { X, Search, Star, Clock, Grid3X3, ChefHat, Bath, Sofa, Zap, Droplets, Tv } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';
import { useCatalogStore } from '../../state/useCatalogStore';
import { createFurnitureElement } from '../../tools/block-tools';
import type { BlockDefinition } from '../../data/blockCatalog';

const BlockPreview: React.FC<{ block: BlockDefinition }> = ({ block }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {block.planSymbols.map((shape, index) => {
      if (shape.kind === 'rect') {
        return (
          <rect
            key={index}
            x={shape.x * 100}
            y={shape.y * 100}
            width={shape.width * 100}
            height={shape.height * 100}
            rx={(shape.cornerRadius ?? 0) * 100}
            fill={shape.fill ? 'currentColor' : 'none'}
            fillOpacity={shape.fill === 'detail' ? 0.15 : 0.05}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray={shape.dash?.map((d) => d * 100).join(' ')}
          />
        );
      }
      if (shape.kind === 'line') {
        return (
          <line
            key={index}
            x1={shape.points[0] * 100}
            y1={shape.points[1] * 100}
            x2={shape.points[2] * 100}
            y2={shape.points[3] * 100}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray={shape.dash?.map((d) => d * 100).join(' ')}
          />
        );
      }
      if (shape.kind === 'circle') {
        return (
          <circle
            key={index}
            cx={shape.x * 100}
            cy={shape.y * 100}
            r={shape.radius * 100}
            fill={shape.fill ? 'currentColor' : 'none'}
            fillOpacity={shape.fill === 'detail' ? 0.25 : 0.05}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        );
      }
      return null;
    })}
  </svg>
);

const categoryIcons: Record<string, React.ElementType> = {
  all: Grid3X3,
  kitchen: ChefHat,
  bathroom: Bath,
  furniture: Sofa,
  electrical: Zap,
  plumbing: Droplets,
  appliances: Tv,
};

const categoryColors: Record<string, string> = {
  all: 'cyan',
  kitchen: 'orange',
  bathroom: 'blue',
  furniture: 'violet',
  electrical: 'yellow',
  plumbing: 'emerald',
  appliances: 'pink',
};

interface ModernBlocksPanelProps {
  onClose: () => void;
}

export const ModernBlocksPanel: React.FC<ModernBlocksPanelProps> = ({ onClose }) => {
  const { activeLayerId, drawingSettings, addElement } = useEditorStore();
  const { blocks, blocksByCategory } = useCatalogStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = ['all', ...Object.keys(blocksByCategory || {})];

  const filteredBlocks = React.useMemo(() => {
    let result = selectedCategory === 'all' ? (blocks || []) : ((blocksByCategory || {})[selectedCategory] || []);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.manufacturer?.toLowerCase().includes(query) ||
          b.sku?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [blocks, blocksByCategory, selectedCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent | React.TouchEvent, block: BlockDefinition) => {
    setIsDragging(true);
    if ('dataTransfer' in e) {
      e.dataTransfer.setData('application/json', JSON.stringify({ blockId: block.id }));
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleBlockClick = (block: BlockDefinition) => {
    if (!activeLayerId) return;
    const element = createFurnitureElement(
      { x: 200, y: 200 },
      block.width / 10,
      block.height / 10,
      block.category,
      activeLayerId,
      {
        blockId: block.id,
        blockName: block.name,
        manufacturer: block.manufacturer,
        sku: block.sku,
        depth: block.depth ? block.depth / 10 : undefined,
        moduleClass: block.moduleClass,
        stroke: drawingSettings.strokeColor,
        strokeWidth: drawingSettings.strokeWidth,
        fill: drawingSettings.fillColor,
      }
    );
    addElement(element);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-56 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl shadow-black/30 flex flex-col overflow-hidden transition-all duration-300 ease-out">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Grid3X3 size={18} className="text-cyan-400" />
          <h3 className="text-white font-semibold">Blocks</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white active:scale-95 hover:bg-slate-700 rounded-xl transition-all duration-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 min-h-[44px] bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-700/50 scrollbar-none touch-pan-x">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || Grid3X3;
          const color = categoryColors[cat] || 'cyan';
          const isActive = selectedCategory === cat;
          
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-medium rounded-xl whitespace-nowrap transition-all duration-200 active:scale-95 ${
                isActive
                  ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 shadow-lg shadow-${color}-500/10`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
              style={isActive ? {
                backgroundColor: `rgb(var(--color-${color}-500) / 0.2)`,
                color: `rgb(var(--color-${color}-400))`,
                borderColor: `rgb(var(--color-${color}-500) / 0.3)`,
              } : {}}
            >
              <Icon size={14} />
              <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            </button>
          );
        })}
      </div>

      {/* Blocks Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="grid grid-cols-2 gap-2">
          {filteredBlocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e, block)}
              onTouchEnd={handleDragEnd}
              onClick={() => handleBlockClick(block)}
              className="group relative bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] touch-manipulation"
              style={{
                animationName: 'fadeInUp',
                animationDuration: '0.3s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Favorite Button */}
              <button
                onClick={(e) => toggleFavorite(block.id, e)}
                onTouchEnd={(e) => toggleFavorite(block.id, e)}
                className={`absolute top-2 right-2 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                  favorites.has(block.id)
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-slate-600 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-700'
                }`}
              >
                <Star size={14} fill={favorites.has(block.id) ? 'currentColor' : 'none'} />
              </button>

              {/* Preview */}
              <div className="aspect-square mb-2 text-cyan-400 bg-slate-900/50 rounded-lg p-2 transition-transform duration-200 group-hover:scale-105">
                <BlockPreview block={block} />
              </div>

              {/* Info */}
              <div className="space-y-0.5">
                <div className="text-xs text-white font-medium truncate">{block.name}</div>
                <div className="text-[10px] text-slate-500">
                  {block.width} × {block.height}mm
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Search size={32} className="mb-3 opacity-50" />
            <p className="text-sm">No blocks found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
        <Clock size={12} />
        <span>{(blocks || []).length} blocks available</span>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
