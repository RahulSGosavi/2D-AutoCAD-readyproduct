import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type Konva from 'konva';
import { CommandStack, type Command } from './undoRedoEngine';

export type ToolType =
  | 'select'
  | 'move'
  | 'copy'
  | 'rotate'
  | 'scale'
  | 'mirror'
  | 'erase'
  | 'line'
  | 'polyline'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'arc'
  | 'pencil'
  | 'wall'
  | 'door'
  | 'window'
  | 'furniture'
  | 'dimension'
  | 'trim'
  | 'extend'
  | 'offset'
  | 'fillet'
  | 'chamfer'
  | 'measure'
  | 'zoom'
  | 'pan'
  // Furniture tools
  | 'bed'
  | 'sofa'
  | 'table'
  | 'wardrobe'
  | 'tvUnit'
  | 'dining'
  // Bathroom tools
  | 'wc'
  | 'washBasin'
  | 'showerPanel'
  | 'floorDrain'
  | 'mirror'
  // Kitchen tools
  | 'baseCabinet'
  | 'wallCabinet'
  | 'sinkUnit'
  | 'hobUnit'
  | 'refrigerator'
  | 'microwave'
  // Electrical tools
  | 'switchboard'
  | 'powerSocket'
  | 'lightPoint'
  | 'fanPoint'
  | 'acPoint'
  // Plumbing tools
  | 'hotWaterLine'
  | 'coldWaterLine'
  | 'drainPipe'
  // Annotation tools
  | 'text'
  | 'north-symbol';

export type ElementType =
  | 'line'
  | 'polyline'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'arc'
  | 'free'
  | 'wall'
  | 'door'
  | 'window'
  | 'furniture'
  | 'dimension'
  | 'text';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color?: string;
}

type Vector2d = { x: number; y: number };

interface BaseElement {
  id: string;
  layerId: string;
  type: ElementType;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  pdfPageNumber?: number; // Track which PDF page this element belongs to (if PDF is loaded)
  dash?: number[]; // Dash pattern for line styles (e.g., [5, 5] for dashed, [] for solid)
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: [number, number, number, number];
}

export interface PolylineElement extends BaseElement {
  type: 'polyline';
  points: number[];
  closed?: boolean;
}

export interface RectElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
  fill?: string;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
  fill?: string;
}

export interface ArcElement extends BaseElement {
  type: 'arc';
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface FreeElement extends BaseElement {
  type: 'free';
  points: number[];
  tension?: number;
}

export interface WallElement extends BaseElement {
  type: 'wall';
  points: number[];
  thickness: number;
  outerPoly?: number[];
  innerPoly?: number[];
}

export interface DoorElement extends BaseElement {
  type: 'door';
  width: number;
  height: number;
  swingAngle: number;
  wallId?: string;
}

export interface WindowElement extends BaseElement {
  type: 'window';
  width: number;
  height: number;
  wallId?: string;
}

export interface FurnitureElement extends BaseElement {
  type: 'furniture';
  width: number;
  height: number;
  category?: string;
  fill?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fill?: string; // Background fill color (transparent by default)
}


export interface DimensionElement extends BaseElement {
  type: 'dimension';
  startPoint: Vector2d;
  endPoint: Vector2d;
  dimensionType: 'linear' | 'aligned' | 'angular' | 'radius' | 'area';
  value: number;
  text?: string;
}

export type EditorElement =
  | LineElement
  | PolylineElement
  | RectElement
  | CircleElement
  | EllipseElement
  | ArcElement
  | FreeElement
  | WallElement
  | DoorElement
  | WindowElement
  | FurnitureElement
  | DimensionElement
  | TextElement;

interface SnapSettings {
  endpoint: boolean;
  midpoint: boolean;
  intersection: boolean;
  perpendicular: boolean;
  parallel: boolean;
  grid: boolean;
  angle: boolean;
  angleStep: number;
  gridSize: number;
  tolerance: number;
  showGrid: boolean;
}

export type UnitType = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

export type LineType = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

interface DrawingSettings {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number; // Element opacity (0.0 to 1.0)
  unit: UnitType;
  unitScale: number; // pixels per unit
  lineType?: LineType; // Line type for new elements
}

// Helper function to convert LineType to dash pattern
export const lineTypeToDash = (lineType: LineType = 'solid'): number[] => {
  switch (lineType) {
    case 'solid':
      return [];
    case 'dashed':
      return [10, 5];
    case 'dotted':
      return [2, 5];
    case 'dash-dot':
      return [10, 5, 2, 5];
    default:
      return [];
  }
};

// Helper function to convert dash pattern back to LineType
export const dashToLineType = (dash: number[] | undefined): LineType => {
  if (!dash || dash.length === 0) return 'solid';
  const dashStr = dash.join(',');
  if (dashStr === '10,5') return 'dashed';
  if (dashStr === '2,5') return 'dotted';
  if (dashStr === '10,5,2,5') return 'dash-dot';
  return 'solid';
};

interface PDFBackground {
  imageData: string; // Base64 data URL
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  currentPage: number;
  totalPages: number;
  pages: Array<{ pageNumber: number; imageData: string; width: number; height: number }>;
}

interface EditorState {
  tool: ToolType;
  layers: Layer[];
  activeLayerId: string;
  elements: EditorElement[];
  selectedElementIds: string[];
  pointer: Vector2d;
  stageScale: number;
  stagePosition: Vector2d;
  stageRotation: number;
  stageInstance: Konva.Stage | null;
  snapSettings: SnapSettings;
  drawingSettings: DrawingSettings;
  commandStack: CommandStack;
  isDrawing: boolean;
  draftElement: EditorElement | null;
  isPanMode: boolean;
  pdfBackground: PDFBackground | null;
  setTool: (tool: ToolType) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
  setPointer: (point: Vector2d) => void;
  setStageTransform: (transform: { scale?: number; position?: Vector2d; rotation?: number }) => void;
  setSelectedElements: (ids: string[]) => void;
  updateDrawingSettings: (settings: Partial<DrawingSettings>) => void;
  setPanMode: (enabled: boolean) => void;
  addLayer: () => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setActiveLayer: (id: string) => void;
  addElement: (element: EditorElement) => void;
  updateElement: (id: string, attrs: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  updateSnapSettings: (settings: Partial<SnapSettings>) => void;
  setIsDrawing: (drawing: boolean) => void;
  setDraftElement: (element: EditorElement | null) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  loadFromProjectData: (data: { layers: Layer[]; elements: EditorElement[]; activeLayerId: string; snapSettings?: SnapSettings }) => void;
  setPdfBackground: (background: PDFBackground | null) => void;
  updatePdfBackground: (updates: Partial<PDFBackground>) => void;
}

const LOCAL_STORAGE_KEY = 'floor-plan-editor-state';

const createInitialState = (): Pick<EditorState, 'layers' | 'activeLayerId' | 'snapSettings' | 'drawingSettings'> => {
  const baseLayerId = nanoid();
  return {
    layers: [
      {
        id: baseLayerId,
        name: 'Layer 0',
        visible: true,
        locked: false,
        color: '#ffffff',
      },
    ],
    activeLayerId: baseLayerId,
    snapSettings: {
      endpoint: true,
      midpoint: true,
      intersection: true,
      perpendicular: true,
      parallel: false,
      grid: true,
      angle: true,
      angleStep: 15,
      gridSize: 25,
      tolerance: 8,
      showGrid: true,
    },
    drawingSettings: {
      strokeColor: '#000000',
      fillColor: 'rgba(0, 0, 0, 0.08)',
      strokeWidth: 1,
      opacity: 1, // Default opacity 100%
      unit: 'mm',
      unitScale: 1, // 1 pixel = 1mm by default
      lineType: 'solid', // Default line type
    },
  };
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initial = createInitialState();
  const commandStack = new CommandStack();

  return {
    tool: 'select',
    layers: initial.layers,
    activeLayerId: initial.activeLayerId,
    elements: [],
    selectedElementIds: [],
    pointer: { x: 0, y: 0 },
    stageScale: 1,
    stagePosition: { x: 0, y: 0 },
    stageRotation: 0,
    stageInstance: null,
    snapSettings: initial.snapSettings,
    drawingSettings: initial.drawingSettings,
    commandStack,
    isDrawing: false,
    draftElement: null,
    isPanMode: false,
    pdfBackground: null,
    setTool: (tool) => set({ tool }),
    setStageInstance: (stage) =>
      set((state) => {
        if (state.stageInstance === stage) {
          return state;
        }
        return { stageInstance: stage };
      }),
    setPointer: (point) =>
      set((state) => {
        const dx = Math.abs(state.pointer.x - point.x);
        const dy = Math.abs(state.pointer.y - point.y);
        if (dx < 0.1 && dy < 0.1) {
          return state;
        }
        return { pointer: point };
      }),
    setStageTransform: ({ scale, position, rotation }) =>
      set((state) => ({
        stageScale: scale ?? state.stageScale,
        stagePosition: position ?? state.stagePosition,
        stageRotation: rotation ?? state.stageRotation,
      })),
    updateDrawingSettings: (settings) =>
      set((state) => ({
        drawingSettings: { ...state.drawingSettings, ...settings },
      })),
    setPanMode: (enabled) => set({ isPanMode: enabled }),
    setSelectedElements: (ids) => set({ selectedElementIds: ids }),
    addLayer: () =>
      set((state) => {
        const newLayer: Layer = {
          id: nanoid(),
          name: `Layer ${state.layers.length}`,
          visible: true,
          locked: false,
          color: '#ffffff',
        };
        return {
          layers: [...state.layers, newLayer],
          activeLayerId: newLayer.id,
        };
      }),
    renameLayer: (id, name) =>
      set((state) => ({
        layers: state.layers.map((layer) => (layer.id === id ? { ...layer, name } : layer)),
      })),
    toggleLayerVisibility: (id) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer,
        ),
      })),
    toggleLayerLock: (id) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, locked: !layer.locked } : layer,
        ),
      })),
    setActiveLayer: (id) => set({ activeLayerId: id }),
    addElement: (element) =>
      set((state) => ({
        elements: [...state.elements, element],
        selectedElementIds: [element.id],
      })),
    updateElement: (id, attrs) =>
      set((state) => ({
        elements: state.elements.map((el) => (el.id === id ? { ...el, ...attrs } : el)),
      })),
    removeElement: (id) =>
      set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
      })),
    removeElements: (ids) =>
      set((state) => ({
        elements: state.elements.filter((el) => !ids.includes(el.id)),
        selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
      })),
    executeCommand: (command) => {
      commandStack.execute(command);
      set({});
    },
    undo: () => {
      if (commandStack.undo()) {
        set({});
      }
    },
    redo: () => {
      if (commandStack.redo()) {
        set({});
      }
    },
    updateSnapSettings: (settings) =>
      set((state) => ({
        snapSettings: { ...state.snapSettings, ...settings },
      })),
    setIsDrawing: (drawing) => set({ isDrawing: drawing }),
    setDraftElement: (element) => set({ draftElement: element }),
    saveToLocalStorage: () => {
      const state = get();
      const data = {
        layers: state.layers,
        elements: state.elements,
        activeLayerId: state.activeLayerId,
        snapSettings: state.snapSettings,
        drawingSettings: state.drawingSettings,
        pdfBackground: state.pdfBackground,
        timestamp: Date.now(),
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          // Also save to a backup key
          localStorage.setItem(`${LOCAL_STORAGE_KEY}-backup`, JSON.stringify(data));
        } catch (error) {
          console.error('Failed to save to localStorage', error);
          // If storage is full, try to clear old backups
          try {
            localStorage.removeItem(`${LOCAL_STORAGE_KEY}-backup`);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error('Storage is full, cannot save', e);
          }
        }
      }
    },
    loadFromLocalStorage: () => {
      if (typeof window === 'undefined') return;
      let raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      // If main key doesn't exist, try backup
      if (!raw) {
        raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}-backup`);
      }
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        set({
          layers: data.layers || [],
          elements: data.elements || [],
          activeLayerId: data.activeLayerId || '',
          snapSettings: data.snapSettings || initial.snapSettings,
          drawingSettings: data.drawingSettings || initial.drawingSettings,
          pdfBackground: data.pdfBackground || null,
        });
        console.log('Loaded from localStorage', {
          elements: data.elements?.length || 0,
          layers: data.layers?.length || 0,
          timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown',
        });
      } catch (error) {
        console.error('Failed to load from localStorage', error);
        // Try to load from backup if main failed
        try {
          const backupRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}-backup`);
          if (backupRaw) {
            const backupData = JSON.parse(backupRaw);
            set({
              layers: backupData.layers || [],
              elements: backupData.elements || [],
              activeLayerId: backupData.activeLayerId || '',
              snapSettings: backupData.snapSettings || initial.snapSettings,
              drawingSettings: backupData.drawingSettings || initial.drawingSettings,
              pdfBackground: backupData.pdfBackground || null,
            });
            console.log('Loaded from backup');
          }
        } catch (e) {
          console.error('Failed to load from backup', e);
        }
      }
    },
    loadFromProjectData: (data) => {
      // Ensure we have at least one layer
      let layers = data.layers || [];
      let activeLayerId = data.activeLayerId || '';
      
      // If no layers, create a default layer
      if (layers.length === 0) {
        const defaultLayer = {
          id: nanoid(),
          name: 'Layer 0',
          visible: true,
          locked: false,
          color: '#ffffff',
        };
        layers = [defaultLayer];
        activeLayerId = defaultLayer.id;
        console.log('Created default layer because none were found');
      }
      
      // If activeLayerId doesn't match any layer, use the first layer
      if (activeLayerId && !layers.find(l => l.id === activeLayerId)) {
        activeLayerId = layers[0].id;
        console.log('Fixed activeLayerId to match first layer:', activeLayerId);
      }
      
      // If still no activeLayerId, use the first layer
      if (!activeLayerId && layers.length > 0) {
        activeLayerId = layers[0].id;
        console.log('Set activeLayerId to first layer:', activeLayerId);
      }
      
      set({
        layers,
        elements: data.elements || [],
        activeLayerId: activeLayerId || initial.activeLayerId,
        snapSettings: data.snapSettings || initial.snapSettings,
        selectedElementIds: [],
      });
      
      console.log('Loaded project data:', {
        layers: layers.length,
        elements: (data.elements || []).length,
        activeLayerId,
      });
    },
    setPdfBackground: (background) => set({ pdfBackground: background }),
    updatePdfBackground: (updates) =>
      set((state) => ({
        pdfBackground: state.pdfBackground ? { ...state.pdfBackground, ...updates } : null,
      })),
  };
});

