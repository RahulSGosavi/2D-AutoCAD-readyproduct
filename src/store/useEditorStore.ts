import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type Konva from 'konva';

export type ToolType =
  | 'select'
  | 'pencil'
  | 'polyline'
  | 'rectangle'
  | 'ellipse'
  | 'eraser'
  | 'wall'
  | 'door'
  | 'window'
  | 'furniture'
  | 'dimension';

export type ElementType = 'free' | 'polyline' | 'rectangle' | 'ellipse';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

type Vector2d = { x: number; y: number };

interface BaseElement {
  id: string;
  layerId: string;
  type: ElementType;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  draggable: boolean;
  rotation: number;
  x: number;
  y: number;
}

export interface FreeElement extends BaseElement {
  type: 'free' | 'polyline';
  points: number[];
  tension?: number;
  closed?: boolean;
}

export interface RectElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
  fill?: string;
}

export type EditorElement = FreeElement | RectElement | EllipseElement;

interface DocumentState {
  layers: Layer[];
  elements: EditorElement[];
  activeLayerId: string;
}

const LOCAL_STORAGE_KEY = 'floor-canvas-doc';

const cloneDocumentState = (state: EditorState): DocumentState => ({
  layers: state.layers.map((layer) => ({ ...layer })),
  elements: state.elements.map((element) => JSON.parse(JSON.stringify(element))),
  activeLayerId: state.activeLayerId,
});

interface EditorState {
  tool: ToolType;
  layers: Layer[];
  activeLayerId: string;
  elements: EditorElement[];
  selectedElementId: string | null;
  pointer: Vector2d;
  stageScale: number;
  stagePosition: Vector2d;
  stageInstance: Konva.Stage | null;
  history: {
    past: DocumentState[];
    future: DocumentState[];
  };
  setTool: (tool: ToolType) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
  setPointer: (point: Vector2d) => void;
  setStageTransform: (transform: { scale?: number; position?: Vector2d }) => void;
  setSelectedElement: (id: string | null) => void;
  addLayer: () => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setActiveLayer: (id: string) => void;
  addElement: (element: EditorElement) => void;
  updateElement: (
    id: string,
    attrs: Partial<EditorElement>,
    options?: { skipHistory?: boolean },
  ) => void;
  removeElement: (id: string) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const withHistory = (state: EditorState, snapshot?: DocumentState) => {
  const docs = state.history.past.length >= 50 ? state.history.past.slice(1) : state.history.past.slice();
  const snap = snapshot ?? cloneDocumentState(state);
  docs.push(snap);
  return docs;
};

const createInitialState = (): Pick<EditorState, 'layers' | 'activeLayerId'> => {
  const baseLayerId = nanoid();
  return {
    layers: [
      {
        id: baseLayerId,
        name: 'Layer 1',
        visible: true,
        locked: false,
      },
    ],
    activeLayerId: baseLayerId,
  };
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initial = createInitialState();

  return {
    tool: 'select',
    layers: initial.layers,
    activeLayerId: initial.activeLayerId,
    elements: [],
    selectedElementId: null,
    pointer: { x: 0, y: 0 },
    stageScale: 1,
    stagePosition: { x: 0, y: 0 },
    stageInstance: null,
    history: {
      past: [],
      future: [],
    },
    setTool: (tool) => set({ tool }),
    setStageInstance: (stage) =>
      set((state) => {
        if (state.stageInstance === stage) {
          return state;
        }
        return { stageInstance: stage };
      }),
    setPointer: (point) => set({ pointer: point }),
    setStageTransform: ({ scale, position }) =>
      set((state) => ({
        stageScale: scale ?? state.stageScale,
        stagePosition: position ?? state.stagePosition,
      })),
    setSelectedElement: (id) => set({ selectedElementId: id }),
    clearSelection: () => set({ selectedElementId: null }),
    addLayer: () =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        const newLayer = {
          id: nanoid(),
          name: `Layer ${state.layers.length + 1}`,
          visible: true,
          locked: false,
        };
        return {
          layers: [...state.layers, newLayer],
          activeLayerId: newLayer.id,
          history,
        };
      }),
    renameLayer: (id, name) =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        return {
          layers: state.layers.map((layer) =>
            layer.id === id ? { ...layer, name } : layer,
          ),
          history,
        };
      }),
    toggleLayerVisibility: (id) =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        return {
          layers: state.layers.map((layer) =>
            layer.id === id ? { ...layer, visible: !layer.visible } : layer,
          ),
          history,
        };
      }),
    toggleLayerLock: (id) =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        return {
          layers: state.layers.map((layer) =>
            layer.id === id ? { ...layer, locked: !layer.locked } : layer,
          ),
          history,
        };
      }),
    setActiveLayer: (id) => set({ activeLayerId: id }),
    addElement: (element) =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        return {
          elements: [...state.elements, element],
          history,
          selectedElementId: element.id,
        };
      }),
    updateElement: (id, attrs, options) =>
      set((state) => {
        const index = state.elements.findIndex((el) => el.id === id);
        if (index === -1) return state;

        const nextElements = state.elements.slice();
        nextElements[index] = {
          ...nextElements[index],
          ...attrs,
        } as EditorElement;

        return {
          elements: nextElements,
          history: options?.skipHistory
            ? state.history
            : {
                past: withHistory(state),
                future: [],
              },
        };
      }),
    removeElement: (id) =>
      set((state) => {
        const history = {
          past: withHistory(state),
          future: [],
        };
        return {
          elements: state.elements.filter((el) => el.id !== id),
          history,
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        };
      }),
    undo: () =>
      set((state) => {
        if (!state.history.past.length) return state;
        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, -1);
        const currentSnapshot = cloneDocumentState(state);
        return {
          ...state,
          layers: previous.layers,
          elements: previous.elements,
          activeLayerId: previous.activeLayerId,
          selectedElementId: null,
          history: {
            past: newPast,
            future: [currentSnapshot, ...state.history.future],
          },
        };
      }),
    redo: () =>
      set((state) => {
        if (!state.history.future.length) return state;
        const next = state.history.future[0];
        const remainingFuture = state.history.future.slice(1);
        const currentSnapshot = cloneDocumentState(state);
        return {
          ...state,
          layers: next.layers,
          elements: next.elements,
          activeLayerId: next.activeLayerId,
          selectedElementId: null,
          history: {
            past: [...state.history.past, currentSnapshot],
            future: remainingFuture,
          },
        };
      }),
    saveToLocalStorage: () => {
      const state = get();
      const doc = cloneDocumentState(state);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(doc));
      }
    },
    loadFromLocalStorage: () => {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      try {
        const doc = JSON.parse(raw) as DocumentState;
        set(() => ({
          layers: doc.layers,
          elements: doc.elements,
          activeLayerId: doc.activeLayerId,
          selectedElementId: null,
          history: {
            past: [],
            future: [],
          },
        }));
      } catch (error) {
        console.error('Failed to load drawing', error);
      }
    },
  };
});

export type { EditorState };

