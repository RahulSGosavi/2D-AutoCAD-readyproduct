import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useEditorStore, type ToolType } from '../store/useEditorStore';
import { exportStageToPNG, exportStageToSVG } from '../utils/exporters';

const toolIcons: Record<ToolType, ReactElement> = {
  select: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3l6.4 16 1.7-5.5 5.5-1.7z" />
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  ),
  polyline: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="4" r="2" fill="currentColor" />
      <circle cx="4" cy="20" r="2" fill="currentColor" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
      <path d="M4 4l4 8 8-4" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="1" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="8" ry="5" />
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.24 3.56a3 3 0 0 1 4.24 4.24L10.83 17.45a3 3 0 0 1-4.24 0L3.76 14.62a3 3 0 0 1 0-4.24z" />
      <line x1="3" y1="20" x2="21" y2="20" strokeWidth="2" />
    </svg>
  ),
  wall: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" />
      <line x1="3" y1="8" x2="3" y2="16" />
      <line x1="21" y1="8" x2="21" y2="16" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="16" rx="1" />
      <path d="M12 4v16" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 4l8 0M12 20l8 0" />
    </svg>
  ),
  window: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  furniture: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="12" y1="6" x2="12" y2="16" />
      <line x1="4" y1="16" x2="4" y2="20" />
      <line x1="20" y1="16" x2="20" y2="20" />
    </svg>
  ),
  dimension: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="8" x2="3" y2="16" />
      <line x1="21" y1="8" x2="21" y2="16" />
      <line x1="6" y1="6" x2="6" y2="18" />
      <line x1="18" y1="6" x2="18" y2="18" />
      <text x="12" y="10" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">D</text>
    </svg>
  ),
};

const Toolbar = () => {
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const saveToLocalStorage = useEditorStore((state) => state.saveToLocalStorage);
  const loadFromLocalStorage = useEditorStore((state) => state.loadFromLocalStorage);
  const stageInstance = useEditorStore((state) => state.stageInstance);

  const tools = useMemo<ToolType[]>(
    () => [
      'select',
      'pencil',
      'polyline',
      'rectangle',
      'ellipse',
      'eraser',
      'wall',
      'door',
      'window',
      'furniture',
      'dimension',
    ],
    [],
  );

  const handleExportPNG = () => {
    if (stageInstance) {
      exportStageToPNG(stageInstance);
    }
  };

  const handleExportSVG = () => {
    if (stageInstance) {
      exportStageToSVG(stageInstance);
    }
  };

  return (
    <aside className="flex h-full w-20 flex-col items-center gap-3 border-r border-outline bg-surface-sunken/90 py-4 text-slate-200 shadow-panel overflow-y-auto">
      <div className="flex flex-col gap-2 w-full px-2 flex-shrink-0">
        {tools.map((item) => (
          <button
            key={item}
            onClick={() => setTool(item)}
            className={`flex h-14 w-full items-center justify-center rounded-lg border-2 transition-all duration-200 flex-shrink-0 ${
              tool === item
                ? 'bg-accent/30 border-accent text-accent shadow-lg'
                : 'bg-surface-raised border-outline text-slate-300 hover:border-accent/50 hover:text-accent hover:bg-surface-raised/80'
            }`}
            title={item.charAt(0).toUpperCase() + item.slice(1)}
          >
            {toolIcons[item]}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-xs">
        <button
          className="rounded-full bg-surface-raised px-3 py-2 text-slate-200 transition hover:text-accent"
          onClick={undo}
        >
          Undo
        </button>
        <button
          className="rounded-full bg-surface-raised px-3 py-2 text-slate-200 transition hover:text-accent"
          onClick={redo}
        >
          Redo
        </button>
      </div>
      <div className="mt-auto flex flex-col gap-2 text-xs">
        <button
          onClick={saveToLocalStorage}
          className="rounded-lg bg-surface-raised px-3 py-2 transition hover:text-accent"
        >
          Save
        </button>
        <button
          onClick={loadFromLocalStorage}
          className="rounded-lg bg-surface-raised px-3 py-2 transition hover:text-accent"
        >
          Load
        </button>
        <button
          onClick={handleExportPNG}
          className="rounded-lg bg-surface-raised px-3 py-2 transition hover:text-accent"
        >
          PNG
        </button>
        <button
          onClick={handleExportSVG}
          className="rounded-lg bg-surface-raised px-3 py-2 transition hover:text-accent"
        >
          SVG
        </button>
      </div>
    </aside>
  );
};

export default Toolbar;

