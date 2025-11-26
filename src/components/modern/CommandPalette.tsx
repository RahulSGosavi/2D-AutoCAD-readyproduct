// src/components/modern/CommandPalette.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  Type,
  Move,
  Eraser,
  LayoutGrid,
  Ruler,
  DoorOpen,
  AppWindow,
  Save,
  FolderOpen,
  Download,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Command,
} from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { setTool, undo, redo, deleteSelectedElements, saveToLocalStorage } = useEditorStore();

  const commands: CommandItem[] = [
    // Tools
    { id: 'select', label: 'Select Tool', icon: MousePointer2, shortcut: 'V', category: 'Tools', action: () => setTool('select') },
    { id: 'pan', label: 'Pan Tool', icon: Move, shortcut: 'H', category: 'Tools', action: () => setTool('pan') },
    { id: 'line', label: 'Line Tool', icon: Minus, shortcut: 'L', category: 'Tools', action: () => setTool('line') },
    { id: 'rectangle', label: 'Rectangle Tool', icon: Square, shortcut: 'R', category: 'Tools', action: () => setTool('rectangle') },
    { id: 'circle', label: 'Circle Tool', icon: Circle, shortcut: 'C', category: 'Tools', action: () => setTool('circle') },
    { id: 'pencil', label: 'Freehand Tool', icon: Pencil, shortcut: 'P', category: 'Tools', action: () => setTool('pencil') },
    { id: 'text', label: 'Text Tool', icon: Type, shortcut: 'T', category: 'Tools', action: () => setTool('text') },
    { id: 'wall', label: 'Wall Tool', icon: LayoutGrid, shortcut: 'W', category: 'Tools', action: () => setTool('wall') },
    { id: 'door', label: 'Door Tool', icon: DoorOpen, shortcut: 'D', category: 'Tools', action: () => setTool('door') },
    { id: 'window', label: 'Window Tool', icon: AppWindow, shortcut: 'N', category: 'Tools', action: () => setTool('window') },
    { id: 'dimension', label: 'Dimension Tool', icon: Ruler, shortcut: 'M', category: 'Tools', action: () => setTool('dimension') },
    { id: 'erase', label: 'Erase Tool', icon: Eraser, shortcut: 'E', category: 'Tools', action: () => setTool('erase') },
    
    // Actions
    { id: 'undo', label: 'Undo', icon: Undo2, shortcut: '⌘Z', category: 'Edit', action: () => undo() },
    { id: 'redo', label: 'Redo', icon: Redo2, shortcut: '⌘⇧Z', category: 'Edit', action: () => redo() },
    { id: 'delete', label: 'Delete Selected', icon: Trash2, shortcut: 'Del', category: 'Edit', action: () => deleteSelectedElements() },
    { id: 'save', label: 'Save Project', icon: Save, shortcut: '⌘S', category: 'File', action: () => saveToLocalStorage() },
  ];

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
          <Command size={20} className="text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-md border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-2">
              <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd) => {
                const Icon = cmd.icon;
                const globalIndex = filteredCommands.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => executeCommand(cmd)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-cyan-500/30' : 'bg-slate-800'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="flex-1 text-left font-medium">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded border border-slate-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Search size={32} className="mb-3 opacity-50" />
              <p className="text-sm">No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
};

