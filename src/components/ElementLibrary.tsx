import { useState } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import type { EditorElement } from '../state/useEditorStore';

// Icon components for each element type
const ElementIcon = ({ category, width, height }: { category: string; width: number; height: number }) => {
  const scale = Math.min(width, height) / 60;
  
  switch (category) {
    case 'kitchen-sink':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="8" width="16" height="8" rx="1" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
          <line x1="12" y1="8" x2="12" y2="6" />
        </svg>
      );
    case 'kitchen-stove':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="6" width="16" height="12" rx="1" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <line x1="12" y1="6" x2="12" y2="4" />
        </svg>
      );
    case 'kitchen-fridge':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="4" width="12" height="16" rx="1" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <circle cx="9" cy="8" r="0.8" />
          <circle cx="15" cy="8" r="0.8" />
        </svg>
      );
    case 'kitchen-dishwasher':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="6" width="14" height="12" rx="1" />
          <rect x="8" y="9" width="8" height="6" />
          <line x1="12" y1="6" x2="12" y2="4" />
        </svg>
      );
    case 'kitchen-cabinet':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="10" width="16" height="8" rx="1" />
          <line x1="8" y1="10" x2="8" y2="18" />
          <line x1="16" y1="10" x2="16" y2="18" />
          <circle cx="10" cy="14" r="0.8" />
          <circle cx="14" cy="14" r="0.8" />
        </svg>
      );
    case 'bathroom-toilet':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="16" rx="6" ry="4" />
          <rect x="8" y="6" width="8" height="6" rx="1" />
          <line x1="10" y1="6" x2="10" y2="4" />
          <line x1="14" y1="6" x2="14" y2="4" />
        </svg>
      );
    case 'bathroom-sink':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="14" rx="8" ry="4" />
          <circle cx="12" cy="14" r="3" />
          <line x1="8" y1="10" x2="8" y2="8" />
          <line x1="16" y1="10" x2="16" y2="8" />
        </svg>
      );
    case 'bathroom-tub':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="10" width="16" height="8" rx="2" />
          <circle cx="8" cy="14" r="1" />
          <circle cx="16" cy="14" r="1" />
          <line x1="6" y1="10" x2="6" y2="8" />
          <line x1="18" y1="10" x2="18" y2="8" />
        </svg>
      );
    case 'bathroom-shower':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="6" width="12" height="12" rx="1" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <circle cx="9" cy="9" r="1" />
          <circle cx="15" cy="9" r="1" />
          <circle cx="9" cy="15" r="1" />
          <circle cx="15" cy="15" r="1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="6" width="16" height="12" rx="1" />
        </svg>
      );
  }
};

export type LibraryElementTemplate = {
  name: string;
  type: 'furniture';
  width: number;
  height: number;
  category: string;
  icon?: string;
};

const KITCHEN_ELEMENTS = [
  {
    name: 'Sink',
    type: 'furniture' as const,
    width: 60,
    height: 40,
    category: 'kitchen-sink',
  },
  {
    name: 'Stove',
    type: 'furniture' as const,
    width: 60,
    height: 60,
    category: 'kitchen-stove',
  },
  {
    name: 'Refrigerator',
    type: 'furniture' as const,
    width: 60,
    height: 80,
    category: 'kitchen-fridge',
  },
  {
    name: 'Dishwasher',
    type: 'furniture' as const,
    width: 60,
    height: 60,
    category: 'kitchen-dishwasher',
  },
  {
    name: 'Cabinet',
    type: 'furniture' as const,
    width: 60,
    height: 30,
    category: 'kitchen-cabinet',
  },
];

const BATHROOM_ELEMENTS = [
  {
    name: 'Toilet',
    type: 'furniture' as const,
    width: 40,
    height: 60,
    category: 'bathroom-toilet',
  },
  {
    name: 'Sink',
    type: 'furniture' as const,
    width: 50,
    height: 40,
    category: 'bathroom-sink',
  },
  {
    name: 'Bathtub',
    type: 'furniture' as const,
    width: 70,
    height: 40,
    category: 'bathroom-tub',
  },
  {
    name: 'Shower',
    type: 'furniture' as const,
    width: 40,
    height: 40,
    category: 'bathroom-shower',
  },
];

const ElementLibrary = () => {
  const [draggedElement, setDraggedElement] = useState<LibraryElementTemplate | null>(null);

  const handleDragStart = (e: React.DragEvent, template: LibraryElementTemplate) => {
    setDraggedElement(template);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    
    // Create custom drag image with element representation
    const dragImage = document.createElement('div');
    const size = Math.max(template.width, template.height, 40);
    dragImage.style.width = `${size}px`;
    dragImage.style.height = `${size}px`;
    dragImage.style.border = '2px solid #3b82f6';
    dragImage.style.borderRadius = '4px';
    dragImage.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.color = '#3b82f6';
    
    // Add icon to drag image
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('width', '20');
    iconSvg.setAttribute('height', '20');
    iconSvg.style.fill = 'none';
    iconSvg.style.stroke = 'currentColor';
    iconSvg.style.strokeWidth = '1.5';
    
    // Create icon based on category
    const createIconPath = (category: string) => {
      switch (category) {
        case 'kitchen-sink':
          return '<rect x="4" y="8" width="16" height="8" rx="1"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><line x1="12" y1="8" x2="12" y2="6"/>';
        case 'kitchen-stove':
          return '<rect x="4" y="6" width="16" height="12" rx="1"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><line x1="12" y1="6" x2="12" y2="4"/>';
        case 'kitchen-fridge':
          return '<rect x="6" y="4" width="12" height="16" rx="1"/><line x1="12" y1="4" x2="12" y2="20"/><circle cx="9" cy="8" r="0.8"/><circle cx="15" cy="8" r="0.8"/>';
        case 'kitchen-dishwasher':
          return '<rect x="5" y="6" width="14" height="12" rx="1"/><rect x="8" y="9" width="8" height="6"/><line x1="12" y1="6" x2="12" y2="4"/>';
        case 'kitchen-cabinet':
          return '<rect x="4" y="10" width="16" height="8" rx="1"/><line x1="8" y1="10" x2="8" y2="18"/><line x1="16" y1="10" x2="16" y2="18"/><circle cx="10" cy="14" r="0.8"/><circle cx="14" cy="14" r="0.8"/>';
        case 'bathroom-toilet':
          return '<ellipse cx="12" cy="16" rx="6" ry="4"/><rect x="8" y="6" width="8" height="6" rx="1"/><line x1="10" y1="6" x2="10" y2="4"/><line x1="14" y1="6" x2="14" y2="4"/>';
        case 'bathroom-sink':
          return '<ellipse cx="12" cy="14" rx="8" ry="4"/><circle cx="12" cy="14" r="3"/><line x1="8" y1="10" x2="8" y2="8"/><line x1="16" y1="10" x2="16" y2="8"/>';
        case 'bathroom-tub':
          return '<rect x="4" y="10" width="16" height="8" rx="2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/><line x1="6" y1="10" x2="6" y2="8"/><line x1="18" y1="10" x2="18" y2="8"/>';
        case 'bathroom-shower':
          return '<rect x="6" y="6" width="12" height="12" rx="1"/><line x1="12" y1="6" x2="12" y2="2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>';
        default:
          return '<rect x="4" y="6" width="16" height="12" rx="1"/>';
      }
    };
    
    iconSvg.innerHTML = createIconPath(template.category);
    dragImage.appendChild(iconSvg);
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, size / 2, size / 2);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div>
        <div className="text-xs text-slate-300 mb-2 font-semibold">Kitchen</div>
        <div className="flex flex-col gap-1">
          {KITCHEN_ELEMENTS.map((element) => (
            <div
              key={element.name}
              draggable
              onDragStart={(e) => handleDragStart(e, element)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-2 text-xs rounded border cursor-move transition ${
                draggedElement?.name === element.name
                  ? 'bg-accent/30 border-accent text-accent'
                  : 'bg-surface-sunken border-outline text-slate-300 hover:border-accent/50'
              }`}
              title={`Drag ${element.name} to canvas`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 border-2 border-slate-400 rounded flex-shrink-0 flex items-center justify-center bg-slate-50/10"
                  style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <ElementIcon category={element.category} width={element.width} height={element.height} />
                </div>
                <span className="flex-1">{element.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-300 mb-2 font-semibold">Bathroom</div>
        <div className="flex flex-col gap-1">
          {BATHROOM_ELEMENTS.map((element) => (
            <div
              key={element.name}
              draggable
              onDragStart={(e) => handleDragStart(e, element)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-2 text-xs rounded border cursor-move transition ${
                draggedElement?.name === element.name
                  ? 'bg-accent/30 border-accent text-accent'
                  : 'bg-surface-sunken border-outline text-slate-300 hover:border-accent/50'
              }`}
              title={`Drag ${element.name} to canvas`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 border-2 border-slate-400 rounded flex-shrink-0 flex items-center justify-center bg-slate-50/10"
                  style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <ElementIcon category={element.category} width={element.width} height={element.height} />
                </div>
                <span className="flex-1">{element.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElementLibrary;

