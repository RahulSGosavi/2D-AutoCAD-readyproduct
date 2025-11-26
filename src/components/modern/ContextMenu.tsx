// src/components/modern/ContextMenu.tsx
import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Trash2, 
  Move, 
  RotateCw, 
  AlignCenter,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  targetElementId?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, targetElementId }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selectedElementIds,
    elements,
    updateElement,
    removeElement,
    setSelectedElements,
  } = useEditorStore();

  const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));
  const targetElement = targetElementId 
    ? elements.find(el => el.id === targetElementId) 
    : selectedElements[0];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Center on another element
  const handleCenterOn = () => {
    if (!targetElement || selectedElements.length < 2) {
      // Need to select target first
      alert('Select two items: first the item to center, then the target to center on');
      onClose();
      return;
    }

    const itemToCenter = selectedElements[0] as any;
    const targetItem = selectedElements[1] as any;

    if (!itemToCenter || !targetItem) return;

    // Calculate center of target
    let targetCenterX = targetItem.x || 0;
    let targetCenterY = targetItem.y || 0;
    
    if ('width' in targetItem && 'height' in targetItem) {
      targetCenterX += targetItem.width / 2;
      targetCenterY += targetItem.height / 2;
    }

    // Calculate offset to center the item
    let itemWidth = 0;
    let itemHeight = 0;
    if ('width' in itemToCenter && 'height' in itemToCenter) {
      itemWidth = itemToCenter.width;
      itemHeight = itemToCenter.height;
    }

    const newX = targetCenterX - itemWidth / 2;
    const newY = targetCenterY - itemHeight / 2;

    updateElement(itemToCenter.id, { x: newX, y: newY });
    onClose();
  };

  // Duplicate element
  const handleDuplicate = () => {
    if (!targetElement) return;
    
    const el = targetElement as any;
    const newElement = {
      ...el,
      id: `${el.id}-copy-${Date.now()}`,
      x: (el.x || 0) + 20,
      y: (el.y || 0) + 20,
    };
    
    useEditorStore.getState().addElement(newElement);
    setSelectedElements([newElement.id]);
    onClose();
  };

  // Delete element
  const handleDelete = () => {
    selectedElements.forEach(el => removeElement(el.id));
    onClose();
  };

  // Rotate 90 degrees
  const handleRotate90 = () => {
    if (!targetElement) return;
    const el = targetElement as any;
    const currentRotation = el.rotation || 0;
    updateElement(targetElement.id, { rotation: (currentRotation + 90) % 360 });
    onClose();
  };

  // Flip horizontal
  const handleFlipH = () => {
    if (!targetElement) return;
    const el = targetElement as any;
    updateElement(targetElement.id, { scaleX: (el.scaleX || 1) * -1 });
    onClose();
  };

  // Flip vertical
  const handleFlipV = () => {
    if (!targetElement) return;
    const el = targetElement as any;
    updateElement(targetElement.id, { scaleY: (el.scaleY || 1) * -1 });
    onClose();
  };

  const menuItems = [
    { icon: Copy, label: 'Duplicate', shortcut: 'Ctrl+D', action: handleDuplicate },
    { icon: Trash2, label: 'Delete', shortcut: 'Del', action: handleDelete, danger: true },
    { type: 'divider' },
    { icon: AlignCenter, label: 'Center On...', action: handleCenterOn },
    { icon: RotateCw, label: 'Rotate 90°', action: handleRotate90 },
    { icon: FlipHorizontal, label: 'Flip Horizontal', action: handleFlipH },
    { icon: FlipVertical, label: 'Flip Vertical', action: handleFlipV },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 py-2 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {targetElement && (
        <div className="px-3 py-2 border-b border-slate-700/50 mb-1">
          <p className="text-xs text-slate-400">Selected</p>
          <p className="text-sm text-white font-medium capitalize">{targetElement.type}</p>
        </div>
      )}
      
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className="h-px bg-slate-700/50 my-1" />;
        }
        
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              item.danger 
                ? 'text-red-400 hover:bg-red-500/20' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {Icon && <Icon size={14} />}
            <span className="flex-1 text-sm">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-slate-500">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

