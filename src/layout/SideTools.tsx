import { useEditorStore, type ToolType } from '../state/useEditorStore';

const toolIcons: Record<ToolType, JSX.Element> = {
  select: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 3l6.4 16 1.7-5.5 5.5-1.7z" />
    </svg>
  ),
  move: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M5 9l-3-3m0 0l3-3m-3 3h18M5 15l-3 3m0 0l3 3m-3-3h18M9 5l3-3m0 0l3 3m-3-3v18m0 0l-3-3m3 3l3-3" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  rotate: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 1 1 8.5-8.5M22 12.5a10 10 0 1 1-8.5 8.5" />
    </svg>
  ),
  scale: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
    </svg>
  ),
  mirror: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
    </svg>
  ),
  erase: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M16.24 3.56a3 3 0 0 1 4.24 4.24L10.83 17.45a3 3 0 0 1-4.24 0L3.76 14.62a3 3 0 0 1 0-4.24zM3 20h18" />
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  polyline: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="4" cy="4" r="2" />
      <circle cx="4" cy="20" r="2" />
      <circle cx="20" cy="12" r="2" />
      <path d="M4 4l4 8 8-4" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="1" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <ellipse cx="12" cy="12" rx="8" ry="5" />
    </svg>
  ),
  arc: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2a10 10 0 0 0-10 10" />
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  ),
  wall: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" />
      <line x1="3" y1="8" x2="3" y2="16" />
      <line x1="21" y1="8" x2="21" y2="16" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="4" width="8" height="16" rx="1" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  window: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  furniture: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="4" y1="14" x2="20" y2="14" />
    </svg>
  ),
  dimension: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="8" x2="3" y2="16" />
      <line x1="21" y1="8" x2="21" y2="16" />
    </svg>
  ),
  trim: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M3 6l6 6-6 6M21 6l-6 6 6 6" />
    </svg>
  ),
  extend: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M3 12h18M3 6l6 6-6 6M21 6l-6 6 6 6" />
    </svg>
  ),
  offset: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 3v18M3 12h18" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  ),
  fillet: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M3 3l6 6M21 21l-6-6M3 21l6-6M21 3l-6 6" />
    </svg>
  ),
  chamfer: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M3 3h6v6M21 21h-6v-6M3 21h6v-6M21 3h-6v6" />
    </svg>
  ),
  measure: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="8" x2="3" y2="16" />
      <line x1="21" y1="8" x2="21" y2="16" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <line x1="11" y1="7" x2="11" y2="15" />
      <line x1="7" y1="11" x2="15" y2="11" />
    </svg>
  ),
  pan: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  // Furniture tools
  bed: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <circle cx="7" cy="14" r="1" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  ),
  sofa: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M4 16v4M20 16v4" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="8" width="12" height="8" rx="1" />
      <line x1="8" y1="16" x2="8" y2="20" />
      <line x1="16" y1="16" x2="16" y2="20" />
    </svg>
  ),
  wardrobe: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
    </svg>
  ),
  tvUnit: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="14" width="16" height="6" rx="1" />
      <rect x="6" y="6" width="12" height="8" rx="1" />
    </svg>
  ),
  dining: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="10" r="6" />
      <line x1="8" y1="16" x2="8" y2="20" />
      <line x1="16" y1="16" x2="16" y2="20" />
    </svg>
  ),
  // Bathroom tools
  wc: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <ellipse cx="12" cy="14" rx="4" ry="5" />
      <rect x="10" y="6" width="4" height="4" rx="1" />
    </svg>
  ),
  washBasin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <ellipse cx="12" cy="12" rx="5" ry="4" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="8" x2="12" y2="6" />
    </svg>
  ),
  showerPanel: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <circle cx="12" cy="16" r="1.5" />
    </svg>
  ),
  floorDrain: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  mirror: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <line x1="12" y1="4" x2="12" y2="2" />
    </svg>
  ),
  // Kitchen tools
  baseCabinet: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="14" width="16" height="6" rx="1" />
      <line x1="8" y1="14" x2="8" y2="20" />
      <line x1="16" y1="14" x2="16" y2="20" />
      <circle cx="10" cy="17" r="1" />
      <circle cx="14" cy="17" r="1" />
    </svg>
  ),
  wallCabinet: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="4" width="16" height="6" rx="1" />
      <line x1="8" y1="4" x2="8" y2="10" />
      <line x1="16" y1="4" x2="16" y2="10" />
    </svg>
  ),
  sinkUnit: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="12" width="12" height="8" rx="1" />
      <ellipse cx="12" cy="14" rx="4" ry="2" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  ),
  hobUnit: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="12" width="12" height="8" rx="1" />
      <circle cx="9" cy="16" r="2" />
      <circle cx="15" cy="16" r="2" />
    </svg>
  ),
  refrigerator: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="7" y="4" width="10" height="16" rx="1" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="9" cy="8" r="0.8" />
      <circle cx="15" cy="8" r="0.8" />
    </svg>
  ),
  microwave: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="7" y="6" width="10" height="12" rx="1" />
      <line x1="7" y1="10" x2="17" y2="10" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  ),
  // Electrical tools
  switchboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  ),
  powerSocket: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  lightPoint: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="8" x2="12" y2="4" />
    </svg>
  ),
  fanPoint: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 7v10M7 12h10M9 9l6 6M15 9l-6 6" />
    </svg>
  ),
  acPoint: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  ),
  // Plumbing tools
  hotWaterLine: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" />
      <circle cx="6" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  coldWaterLine: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" />
      <circle cx="18" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  drainPipe: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
      <path d="M12 8v8M8 10l4-2 4 2" />
    </svg>
  ),
};

const toolGroups: Array<{ label: string; tools: ToolType[] }> = [
  { label: 'Select', tools: ['select', 'move', 'copy', 'rotate', 'scale', 'mirror', 'erase'] },
  {
    label: 'Draw',
    tools: ['line', 'polyline', 'rectangle', 'circle', 'ellipse', 'arc', 'pencil'],
  },
  { label: 'Architecture', tools: ['wall', 'door', 'window'] },
  { label: 'Dimension', tools: ['dimension'] },
  { label: 'Modify', tools: ['trim', 'extend', 'offset', 'fillet', 'chamfer'] },
  { label: 'Navigation', tools: ['measure', 'zoom'] },
  { label: 'Furniture', tools: ['bed', 'sofa', 'table', 'wardrobe', 'tvUnit', 'dining'] },
  { label: 'Bathroom', tools: ['wc', 'washBasin', 'showerPanel', 'floorDrain', 'mirror'] },
  { label: 'Kitchen', tools: ['baseCabinet', 'wallCabinet', 'sinkUnit', 'hobUnit', 'refrigerator', 'microwave'] },
  { label: 'Electrical', tools: ['switchboard', 'powerSocket', 'lightPoint', 'fanPoint', 'acPoint'] },
  { label: 'Plumbing', tools: ['hotWaterLine', 'coldWaterLine', 'drainPipe'] },
];

const SideTools = () => {
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const isPanMode = useEditorStore((state) => state.isPanMode);
  const setPanMode = useEditorStore((state) => state.setPanMode);

  return (
    <div className="flex h-full w-12 sm:w-16 flex-col gap-2 border-r border-outline bg-surface-sunken/90 p-1 sm:p-2 overflow-y-auto transition-all duration-300">
      <div className="mb-2">
        <button
          onClick={() => {
            setPanMode(!isPanMode);
            if (!isPanMode) setTool('select');
          }}
          type="button"
          className={`w-full h-12 flex items-center justify-center rounded mb-1 transition ${
            isPanMode
              ? 'bg-accent/30 border-2 border-accent text-accent'
              : 'bg-surface-raised border border-outline text-slate-300 hover:border-accent/50'
          }`}
          title="Pan Tool (Hand)"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      </div>
      {toolGroups.map((group) => (
        <div key={group.label} className="mb-2">
          <div className="text-xs text-slate-400 mb-1 px-2">{group.label}</div>
          {group.tools.map((toolType) => (
            <button
              key={toolType}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTool(toolType);
              }}
              type="button"
              className={`w-full h-10 sm:h-12 flex items-center justify-center rounded mb-1 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                tool === toolType
                  ? 'bg-accent/30 border-2 border-accent text-accent shadow-lg'
                  : 'bg-surface-raised border border-outline text-slate-300 hover:border-accent/50 hover:bg-surface-raised/80'
              }`}
              title={toolType}
            >
              {toolIcons[toolType]}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SideTools;

