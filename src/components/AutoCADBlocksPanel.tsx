// src/components/AutoCADBlocksPanel.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { createFurnitureElement } from '../tools/block-tools';
import { type BlockDefinition } from '../data/blockCatalog';
import { useCatalogStore } from '../state/useCatalogStore';

const BlockPreview: React.FC<{ block: BlockDefinition }> = ({ block }) => {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12 text-white">
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
              ry={(shape.cornerRadius ?? 0) * 100}
              fill={shape.fill ? 'currentColor' : 'none'}
              fillOpacity={shape.fill === 'detail' ? 0.2 : 0.05}
              stroke="currentColor"
              strokeWidth={(shape.strokeWidth ?? 1) * 1.6}
              strokeDasharray={shape.dash?.map((d) => d * 100).join(' ') ?? undefined}
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
              strokeWidth={(shape.strokeWidth ?? 1) * 1.5}
              strokeDasharray={shape.dash?.map((d) => d * 100).join(' ') ?? undefined}
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
              fillOpacity={shape.fill === 'detail' ? 0.3 : 0.05}
              stroke="currentColor"
              strokeWidth={(shape.strokeWidth ?? 1) * 1.4}
              strokeDasharray={shape.dash?.map((d) => d * 100).join(' ') ?? undefined}
            />
          );
        }
        return null;
      })}
    </svg>
  );
};

export const AutoCADBlocksPanel: React.FC = () => {
  const { activeLayerId, drawingSettings, addElement } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('kitchen');
  const blocks = useCatalogStore((state) => state.blocks);
  const status = useCatalogStore((state) => state.status);
  const loadBlocks = useCatalogStore((state) => state.loadBlocks);

  React.useEffect(() => {
    if (status === 'idle') {
      loadBlocks();
    }
  }, [status, loadBlocks]);

  const categories = React.useMemo(() => {
    const unique = new Set(blocks.map((block) => block.category));
    return Array.from(unique);
  }, [blocks]);

  React.useEffect(() => {
    if (!categories.includes(selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const handleDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ blockId: block.id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const spawnBlock = (block: BlockDefinition) => {
    if (!activeLayerId) return;
    const element = createFurnitureElement(
      { x: 0, y: 0 },
      block.width / 10,
      block.height / 10,
      block.category,
      activeLayerId,
      {
        blockId: block.id,
        blockName: block.name,
        category: block.category,
        manufacturer: block.manufacturer,
        sku: block.sku,
        tags: block.tags,
        depth: block.depth ? block.depth / 10 : undefined,
        moduleClass: block.moduleClass,
        metadata: {
          ...(block.description ? { description: block.description } : {}),
          blockId: block.id,
        },
        stroke: drawingSettings.strokeColor,
        strokeWidth: drawingSettings.strokeWidth,
        fill: drawingSettings.fillColor,
      },
    );
    addElement(element);
  };

  const filteredBlocks = React.useMemo(
    () => blocks.filter((block) => block.category === selectedCategory),
    [blocks, selectedCategory],
  );

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
        {status === 'loading' && blocks.length === 0 && (
          <div className="text-center text-slate-400 text-xs py-6">Loading catalog…</div>
        )}
        {filteredBlocks.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(e, block)}
            onClick={() => spawnBlock(block)}
            className="flex items-center gap-2 p-2 mb-1 bg-slate-700 hover:bg-slate-600 rounded cursor-move transition-colors"
          >
            <div className="flex items-center justify-center rounded bg-slate-900 w-14 h-14 border border-slate-600">
              <BlockPreview block={block} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{block.name}</div>
              <div className="text-xs text-slate-400">
                {block.width} × {block.height}mm
              </div>
              {block.manufacturer && (
                <div className="text-[11px] text-slate-500 truncate">{block.manufacturer}</div>
              )}
              {block.sku && (
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">{block.sku}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

