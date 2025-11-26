import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type Konva from 'konva';
import { CommandStack, type Command } from './undoRedoEngine';
import type { CabinetModuleConfig, FurnitureFinishSet, FurnitureSection } from '../types/catalog';
import { catalogMetadataStore } from '../services/catalog/catalogStorage';
import { versionHistory, type VersionSnapshot } from '../services/projects/versionHistory';

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
  fill?: string;
  // Elevation properties
  wallHeight?: number; // Wall height (default 2440mm / 8ft)
  // Link mode - connected walls
  connectedWalls?: string[]; // IDs of walls connected to this wall
}

export interface DoorElement extends BaseElement {
  type: 'door';
  width: number;
  height: number;
  swingAngle: number;
  wallId?: string;
  // Elevation properties
  doorHeight?: number; // Actual door height (default 2032mm / 80in)
}

export interface WindowElement extends BaseElement {
  type: 'window';
  width: number;
  height: number;
  wallId?: string;
  // Elevation properties
  sillHeight?: number; // Height from floor to bottom of window
  elevationHeight?: number; // Actual window height in elevation
}

export interface FurnitureElement extends BaseElement {
  type: 'furniture';
  width: number;
  height: number;
  category?: string;
  fill?: string;
  depth?: number;
  // Elevation properties
  elevationHeight?: number; // Height in elevation view (3D height)
  floorHeight?: number; // Distance from floor (for wall cabinets)
  topAlign?: number; // Top alignment position
  moduleClass?: CabinetModuleConfig['moduleClass'];
  cabinet?: CabinetModuleConfig;
  finish?: FurnitureFinishSet;
  manufacturer?: string;
  sku?: string;
  catalogId?: string;
  price?: number;
  currency?: string;
  tags?: string[];
  accessories?: string[];
  sections?: FurnitureSection[];
  metadata?: Record<string, unknown>;
  blockId?: string;
  blockName?: string;
  planSymbolId?: string;
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
  style?: {
    showExtensions?: boolean;
    showTicks?: boolean;
    textBackground?: string;
    fontSize?: number;
  };
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
  collision: boolean; // Prevent overlapping items
  itemSnap: boolean; // Snap items to each other
  orthoMode: boolean; // Restrict to 45-degree angles
  linkMode: boolean; // Keep walls linked when editing
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
  dimensionStyle: {
    showExtensions: boolean;
    showTicks: boolean;
    textBackground: string;
    fontSize: number;
  };
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

export type ViewMode = 'floorPlan' | 'elevation' | 'drawingLayout';

// Floor Plan Page - for multi-page drawing
export interface FloorPlanPage {
  id: string;
  name: string;
  elements: EditorElement[];
  lastSaved?: number; // timestamp
}

interface EditorState {
  tool: ToolType;
  viewMode: ViewMode;
  selectedWallForElevation: string | null; // Wall ID for elevation view
  layers: Layer[];
  activeLayerId: string;
  elements: EditorElement[];
  // Multi-page floor plan
  floorPlanPages: FloorPlanPage[];
  currentFloorPlanPageId: string;
  autoSaveEnabled: boolean;
  lastAutoSave: number | null;
  selectedElementIds: string[];
  pointer: Vector2d;
  stageScale: number;
  stagePosition: Vector2d;
  stageRotation: number;
  stageInstance: Konva.Stage | null;
  floorPlanStage: Konva.Stage | null;
  floorPlanSnapshot: string | null;
  snapSettings: SnapSettings;
  drawingSettings: DrawingSettings;
  commandStack: CommandStack;
  isDrawing: boolean;
  draftElement: EditorElement | null;
  isPanMode: boolean;
  pdfBackground: PDFBackground | null;
  canUndo: boolean;
  canRedo: boolean;
  setTool: (tool: ToolType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedWallForElevation: (wallId: string | null) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
  setFloorPlanStage: (stage: Konva.Stage | null) => void;
  setFloorPlanSnapshot: (snapshot: string | null) => void;
  setPointer: (point: Vector2d) => void;
  setStageTransform: (transform: { scale?: number; position?: Vector2d; rotation?: number }) => void;
  setSelectedElements: (ids: string[]) => void;
  updateDrawingSettings: (settings: Partial<DrawingSettings>) => void;
  setDrawingSettings: (settings: DrawingSettings) => void;
  setSnapSettings: (settings: SnapSettings) => void;
  setPanMode: (enabled: boolean) => void;
  addLayer: (layer?: Partial<Layer>) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setActiveLayer: (id: string) => void;
  addElement: (element: EditorElement) => void;
  updateElement: (id: string, attrs: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  deleteSelectedElements: () => void;
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
  saveVersionSnapshot: (label?: string) => void;
  restoreVersionSnapshot: (snapshotId: string) => void;
  listVersionSnapshots: () => VersionSnapshot[];
  // Multi-page floor plan actions
  addFloorPlanPage: (name?: string) => void;
  removeFloorPlanPage: (pageId: string) => void;
  setCurrentFloorPlanPage: (pageId: string) => void;
  renameFloorPlanPage: (pageId: string, name: string) => void;
  saveCurrentPageElements: () => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  getAllFloorPlanElements: () => EditorElement[];
}

const LOCAL_STORAGE_KEY = 'floor-plan-editor-state';
const DEFAULT_PROJECT_ID = 'local-project';

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
      collision: true,
      itemSnap: true,
      orthoMode: false,
      linkMode: true,
    },
    drawingSettings: {
      strokeColor: '#000000',
      fillColor: 'transparent',
      strokeWidth: 1,
      opacity: 1, // Default opacity 100%
      unit: 'mm',
      unitScale: 1, // 1 pixel = 1mm by default
      lineType: 'solid', // Default line type
      dimensionStyle: {
        showExtensions: true,
        showTicks: true,
        textBackground: '#0f172a',
        fontSize: 12,
      },
    },
  };
};

const createInitialFloorPlanPage = (): FloorPlanPage => ({
  id: nanoid(),
  name: 'Page 1',
  elements: [],
  lastSaved: Date.now(),
});

export const useEditorStore = create<EditorState>((set, get) => {
  const initial = createInitialState();
  const commandStack = new CommandStack();
  const initialPage = createInitialFloorPlanPage();

  return {
    tool: 'select',
    viewMode: 'floorPlan',
    selectedWallForElevation: null,
    layers: initial.layers,
    activeLayerId: initial.activeLayerId,
    elements: [],
    // Multi-page floor plan
    floorPlanPages: [initialPage],
    currentFloorPlanPageId: initialPage.id,
    autoSaveEnabled: true,
    lastAutoSave: null,
    selectedElementIds: [],
    pointer: { x: 0, y: 0 },
    stageScale: 1,
    stagePosition: { x: 0, y: 0 },
    stageRotation: 0,
    stageInstance: null,
    floorPlanStage: null,
    floorPlanSnapshot: null,
    snapSettings: initial.snapSettings,
    drawingSettings: initial.drawingSettings,
    commandStack,
    isDrawing: false,
    draftElement: null,
    isPanMode: false,
    pdfBackground: null,
    canUndo: false,
    canRedo: false,
    setTool: (tool) => set({ tool }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedWallForElevation: (wallId) => set({ selectedWallForElevation: wallId }),
    setStageInstance: (stage) =>
      set((state) => {
        if (state.stageInstance === stage) {
          return state;
        }
        return { stageInstance: stage };
      }),
    setFloorPlanStage: (stage) => set({ floorPlanStage: stage }),
    setFloorPlanSnapshot: (snapshot) => set({ floorPlanSnapshot: snapshot }),
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
    setDrawingSettings: (settings) => set({ drawingSettings: settings }),
    setSnapSettings: (settings) => set({ snapSettings: settings }),
    setPanMode: (enabled) => set({ isPanMode: enabled }),
    setSelectedElements: (ids) => set({ selectedElementIds: ids }),
    addLayer: (layer) =>
      set((state) => {
        const newLayer: Layer = {
          id: layer?.id || nanoid(),
          name: layer?.name || `Layer ${state.layers.length}`,
          visible: layer?.visible ?? true,
          locked: layer?.locked ?? false,
          color: layer?.color || '#06b6d4',
        };
        return {
          layers: [...state.layers, newLayer],
          activeLayerId: newLayer.id,
        };
      }),
    updateLayer: (id, updates) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, ...updates } : layer
        ),
      })),
    removeLayer: (id) =>
      set((state) => {
        // Don't remove if it's the only layer
        if (state.layers.length <= 1) return state;
        
        const newLayers = state.layers.filter((layer) => layer.id !== id);
        const newActiveLayerId = state.activeLayerId === id
          ? newLayers[0]?.id || ''
          : state.activeLayerId;
        
        // Also remove elements on that layer
        const newElements = state.elements.filter((el) => el.layerId !== id);
        
        return {
          layers: newLayers,
          activeLayerId: newActiveLayerId,
          elements: newElements,
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
    addElement: (element) => {
      const command: Command = {
        execute: () => {
          set((state) => {
            if (element.type === 'furniture') {
              catalogMetadataStore.save(element as FurnitureElement);
            }
            return {
              elements: [...state.elements, element],
              selectedElementIds: [element.id],
            };
          });
        },
        undo: () => {
          set((state) => {
            if (element.type === 'furniture') {
              catalogMetadataStore.remove(element.id);
            }
            return {
              elements: state.elements.filter((el) => el.id !== element.id),
              selectedElementIds: state.selectedElementIds.filter((sid) => sid !== element.id),
            };
          });
        },
        description: `Add ${element.type}`,
      };
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    updateElement: (id, attrs) => {
      const oldElement = get().elements.find((el) => el.id === id);
      if (!oldElement) return;
      const oldAttrs = { ...oldElement };
      
      const command: Command = {
        execute: () => {
          set((state) => {
            const updatedElements = state.elements.map((el) => {
              if (el.id === id) {
                const merged = { ...el, ...attrs } as EditorElement;
                if (merged.type === 'furniture') {
                  catalogMetadataStore.save(merged as FurnitureElement);
                }
                return merged;
              }
              return el;
            });
            return { elements: updatedElements };
          });
        },
        undo: () => {
          set((state) => {
            const updatedElements = state.elements.map((el) => {
              if (el.id === id) {
                if (oldElement.type === 'furniture') {
                  catalogMetadataStore.save(oldElement as FurnitureElement);
                }
                return oldAttrs as EditorElement;
              }
              return el;
            });
            return { elements: updatedElements };
          });
        },
        description: `Update element`,
      };
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    removeElement: (id) => {
      const elementToRemove = get().elements.find((el) => el.id === id);
      if (!elementToRemove) return;
      
      const command: Command = {
        execute: () => {
          set((state) => {
            if (elementToRemove.type === 'furniture') {
              catalogMetadataStore.remove(id);
            }
            return {
              elements: state.elements.filter((el) => el.id !== id),
              selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
            };
          });
        },
        undo: () => {
          set((state) => {
            if (elementToRemove.type === 'furniture') {
              catalogMetadataStore.save(elementToRemove as FurnitureElement);
            }
            return {
              elements: [...state.elements, elementToRemove],
              selectedElementIds: [elementToRemove.id],
            };
          });
        },
        description: `Remove ${elementToRemove.type}`,
      };
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    removeElements: (ids) => {
      const elementsToRemove = get().elements.filter((el) => ids.includes(el.id));
      if (elementsToRemove.length === 0) return;
      
      const command: Command = {
        execute: () => {
          set((state) => {
            elementsToRemove
              .filter((el) => el.type === 'furniture')
              .forEach((el) => catalogMetadataStore.remove(el.id));
            return {
              elements: state.elements.filter((el) => !ids.includes(el.id)),
              selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
            };
          });
        },
        undo: () => {
          set((state) => {
            elementsToRemove
              .filter((el) => el.type === 'furniture')
              .forEach((el) => catalogMetadataStore.save(el as FurnitureElement));
            return {
              elements: [...state.elements, ...elementsToRemove],
              selectedElementIds: elementsToRemove.map((el) => el.id),
            };
          });
        },
        description: `Remove ${elementsToRemove.length} elements`,
      };
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    deleteSelectedElements: () => {
      const state = get();
      if (state.selectedElementIds.length === 0) return;
      const elementsToDelete = state.elements.filter((el) => state.selectedElementIds.includes(el.id));
      
      const command: Command = {
        execute: () => {
          elementsToDelete
            .filter((el) => el.type === 'furniture')
            .forEach((el) => catalogMetadataStore.remove(el.id));
          set({
            elements: get().elements.filter((el) => !state.selectedElementIds.includes(el.id)),
            selectedElementIds: [],
          });
        },
        undo: () => {
          elementsToDelete
            .filter((el) => el.type === 'furniture')
            .forEach((el) => catalogMetadataStore.save(el as FurnitureElement));
          set({
            elements: [...get().elements, ...elementsToDelete],
            selectedElementIds: elementsToDelete.map((el) => el.id),
          });
        },
        description: `Delete ${elementsToDelete.length} elements`,
      };
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    executeCommand: (command) => {
      commandStack.execute(command);
      set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
    },
    undo: () => {
      if (commandStack.undo()) {
        set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
      }
    },
    redo: () => {
      if (commandStack.redo()) {
        set({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
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
    saveVersionSnapshot: (label = 'Manual snapshot') =>
      set((state) => {
        const snapshot: VersionSnapshot = {
          id: nanoid(),
          projectId: DEFAULT_PROJECT_ID,
          label,
          createdAt: new Date().toISOString(),
          layers: state.layers,
          elements: state.elements,
          activeLayerId: state.activeLayerId,
        };
        versionHistory.saveSnapshot(snapshot);
        return state;
      }),
    restoreVersionSnapshot: (snapshotId) => {
      const snapshots = versionHistory.listSnapshots(DEFAULT_PROJECT_ID);
      const snapshot = snapshots.find((snap) => snap.id === snapshotId);
      if (!snapshot) return;
      set({
        layers: snapshot.layers,
        elements: snapshot.elements,
        activeLayerId: snapshot.activeLayerId,
      });
    },
    listVersionSnapshots: () => versionHistory.listSnapshots(DEFAULT_PROJECT_ID),
    
    // Multi-page floor plan actions
    addFloorPlanPage: (name) =>
      set((state) => {
        // Save current page elements first
        const updatedPages = state.floorPlanPages.map((page) =>
          page.id === state.currentFloorPlanPageId
            ? { ...page, elements: state.elements, lastSaved: Date.now() }
            : page
        );
        
        const newPage: FloorPlanPage = {
          id: nanoid(),
          name: name || `Page ${state.floorPlanPages.length + 1}`,
          elements: [],
          lastSaved: Date.now(),
        };
        
        return {
          floorPlanPages: [...updatedPages, newPage],
          currentFloorPlanPageId: newPage.id,
          elements: [], // Clear canvas for new page
          selectedElementIds: [],
        };
      }),
    
    removeFloorPlanPage: (pageId) =>
      set((state) => {
        if (state.floorPlanPages.length <= 1) return state; // Keep at least one page
        
        const newPages = state.floorPlanPages.filter((p) => p.id !== pageId);
        const isCurrentPage = state.currentFloorPlanPageId === pageId;
        
        if (isCurrentPage) {
          // Switch to first available page
          const newCurrentPage = newPages[0];
          return {
            floorPlanPages: newPages,
            currentFloorPlanPageId: newCurrentPage.id,
            elements: newCurrentPage.elements,
            selectedElementIds: [],
          };
        }
        
        return { floorPlanPages: newPages };
      }),
    
    setCurrentFloorPlanPage: (pageId) =>
      set((state) => {
        if (state.currentFloorPlanPageId === pageId) return state;
        
        // Save current page elements
        const updatedPages = state.floorPlanPages.map((page) =>
          page.id === state.currentFloorPlanPageId
            ? { ...page, elements: state.elements, lastSaved: Date.now() }
            : page
        );
        
        // Load new page elements
        const newPage = updatedPages.find((p) => p.id === pageId);
        if (!newPage) return state;
        
        return {
          floorPlanPages: updatedPages,
          currentFloorPlanPageId: pageId,
          elements: newPage.elements,
          selectedElementIds: [],
        };
      }),
    
    renameFloorPlanPage: (pageId, name) =>
      set((state) => ({
        floorPlanPages: state.floorPlanPages.map((page) =>
          page.id === pageId ? { ...page, name } : page
        ),
      })),
    
    saveCurrentPageElements: () =>
      set((state) => ({
        floorPlanPages: state.floorPlanPages.map((page) =>
          page.id === state.currentFloorPlanPageId
            ? { ...page, elements: state.elements, lastSaved: Date.now() }
            : page
        ),
        lastAutoSave: Date.now(),
      })),
    
    setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
    
    getAllFloorPlanElements: () => {
      const state = get();
      // Combine current page elements with saved page elements
      const allElements: EditorElement[] = [];
      
      state.floorPlanPages.forEach((page) => {
        if (page.id === state.currentFloorPlanPageId) {
          // Use current elements for active page
          allElements.push(...state.elements);
        } else {
          allElements.push(...page.elements);
        }
      });
      
      return allElements;
    },
  };
});

