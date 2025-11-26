// src/components/modern/ModernTopBar.tsx
import React from 'react';
import {
  ArrowLeft,
  Search,
  Undo2,
  Redo2,
  Grid3X3,
  Layers,
  Settings2,
  Command,
} from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';
import { ThemeToggle } from './ThemeToggle';

interface ModernTopBarProps {
  onBackToProjects?: () => void;
  onOpenCommandPalette: () => void;
  onToggleBlocks: () => void;
  onToggleLayers: () => void;
  onToggleProperties: () => void;
  showBlocks: boolean;
  showLayers: boolean;
  showProperties: boolean;
}

export const ModernTopBar: React.FC<ModernTopBarProps> = ({
  onBackToProjects,
  onOpenCommandPalette,
  onToggleBlocks,
  onToggleLayers,
  onToggleProperties,
  showBlocks,
  showLayers,
  showProperties,
}) => {
  const { undo, redo, canUndo, canRedo } = useEditorStore();

  return (
    <div className="h-16 bg-slate-900/80 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-xl border-b border-slate-700/50 dark:border-slate-800/50 light:border-slate-200 flex items-center justify-between px-4 transition-colors duration-300">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {onBackToProjects && (
          <button
            onClick={onBackToProjects}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-slate-400 hover:text-white active:text-cyan-400 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-200 hover:scale-105">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-white dark:text-white light:text-slate-900 font-semibold ml-1 hidden sm:inline">KAB Studio</span>
        </div>
      </div>

      {/* Center Section - Command Bar */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 light:hover:bg-slate-200 border border-slate-700/50 dark:border-slate-600/50 light:border-slate-300 rounded-xl text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-all duration-200 active:scale-[0.98] touch-manipulation min-w-[200px] sm:min-w-[300px]"
      >
        <Search size={16} />
        <span className="text-sm hidden sm:inline">Search commands...</span>
        <div className="flex-1" />
        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-700 dark:bg-slate-600 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-600 text-xs rounded-md">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 mx-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
              canUndo
                ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
              canRedo
                ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={20} />
          </button>
        </div>

        {/* Panel Toggles */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-700/50">
          <button
            onClick={onToggleBlocks}
            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
              showBlocks
                ? 'text-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Blocks Panel"
          >
            <Grid3X3 size={20} />
          </button>
          <button
            onClick={onToggleLayers}
            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
              showLayers
                ? 'text-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Layers Panel"
          >
            <Layers size={20} />
          </button>
          <button
            onClick={onToggleProperties}
            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
              showProperties
                ? 'text-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Properties Panel"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
