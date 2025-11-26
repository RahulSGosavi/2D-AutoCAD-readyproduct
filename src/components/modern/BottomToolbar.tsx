// src/components/modern/BottomToolbar.tsx
import React, { useRef } from 'react';
import { useEditorStore } from '../../state/useEditorStore';
import { useThemeStore } from '../../state/useThemeStore';
import {
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
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  Upload,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'pencil', icon: Pencil, label: 'Freehand' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'wall', icon: LayoutGrid, label: 'Wall' },
  { id: 'door', icon: DoorOpen, label: 'Door' },
  { id: 'window', icon: AppWindow, label: 'Window' },
  { id: 'dimension', icon: Ruler, label: 'Dimension' },
  { id: 'erase', icon: Eraser, label: 'Erase' },
];

const units = [
  { id: 'mm', label: 'Millimeters (mm)' },
  { id: 'cm', label: 'Centimeters (cm)' },
  { id: 'm', label: 'Meters (m)' },
  { id: 'in', label: 'Inches (in)' },
  { id: 'ft', label: 'Feet (ft)' },
];

export const BottomToolbar: React.FC = () => {
  const { 
    tool: activeTool, 
    setTool, 
    undo, 
    redo, 
    drawingSettings,
    setDrawingSettings,
    setPdfBackground,
    pdfBackground,
    elements,
  } = useEditorStore();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const handleImportPDF = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      // For PDF, we'll use the existing PDF background functionality
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPdfBackground({
          url: dataUrl,
          currentPage: 1,
          totalPages: 1,
          scale: 1,
          position: { x: 0, y: 0 },
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleExportPDF = async () => {
    // Simple export - create a downloadable file with project data
    const projectData = {
      elements: useEditorStore.getState().elements,
      layers: useEditorStore.getState().layers,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kab-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDrawingSettings({ ...drawingSettings, unit: e.target.value as any });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl border transition-colors duration-300 ${
        resolvedTheme === 'dark'
          ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-black/40'
          : 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-slate-300/40'
      }`}>
        {/* Scroll Left */}
        <button
          onClick={scrollLeft}
          className={`p-2 rounded-lg transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Tools Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[400px] md:max-w-[600px]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id as any)}
                className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-90 touch-manipulation ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : resolvedTheme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={t.label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>

        {/* Scroll Right */}
        <button
          onClick={scrollRight}
          className={`p-2 rounded-lg transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ChevronRight size={18} />
        </button>

        {/* Divider */}
        <div className={`w-px h-8 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Undo/Redo */}
        <button
          onClick={() => undo()}
          className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        <button
          onClick={() => redo()}
          className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Redo"
        >
          <Redo2 size={20} />
        </button>

        {/* Divider */}
        <div className={`w-px h-8 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Unit Dropdown */}
        <select
          value={drawingSettings.unit || 'mm'}
          onChange={handleUnitChange}
          className={`px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-all touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'bg-slate-800 text-white border border-slate-700 focus:border-cyan-500'
              : 'bg-slate-100 text-slate-900 border border-slate-200 focus:border-cyan-500'
          } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>
          ))}
        </select>

        {/* Divider */}
        <div className={`w-px h-8 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Import PDF */}
        <button
          onClick={handleImportPDF}
          className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Import PDF"
        >
          <Upload size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Export */}
        <button
          onClick={handleExportPDF}
          className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Export Project"
        >
          <Download size={20} />
        </button>

        {/* Divider */}
        <div className={`w-px h-8 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
            resolvedTheme === 'dark'
              ? 'text-amber-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

