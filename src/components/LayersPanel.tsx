import type { ChangeEvent } from 'react';
import { useEditorStore } from '../state/useEditorStore';

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
    {visible ? (
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    ) : (
      <path d="M3.53 2.47 2.47 3.53 5.14 6.2C3.1 7.46 1.67 9.19 1 12c0 0 4 7 11 7 2.35 0 4.28-.58 5.86-1.49l2.67 2.66 1.06-1.06zm5.14 5.14 2.4 2.4a3 3 0 0 1 3.12 3.12l2.4 2.4A8.5 8.5 0 0 1 12 17c-4.42 0-7.33-3.02-8.85-5 0 0 1.3-1.77 3.38-3.07zm3.98-2.78c4.42 0 7.33 3.02 8.85 5 0 0-.63.86-1.73 1.91l-1.43-1.43a8.5 8.5 0 0 0-5.69-2.48l-1.6-1.6c.51-.26 1.06-.4 1.6-.4z" />
    )}
  </svg>
);

const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
    {locked ? (
      <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-6 9v-3h2v3zm3-9H10V6a2 2 0 1 1 4 0z" />
    ) : (
      <path d="M18 8h-1.1A4 4 0 0 0 7 6v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10.2l2.8 2.8 1.4-1.4-2-2V10a2 2 0 0 0-2-2zm-4.1 0H9V6a2 2 0 0 1 4 0zm-1.9 9.17-2-2V14h2z" />
    )}
  </svg>
);

const LayersPanel = () => {
  const layers = useEditorStore((state) => state.layers);
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const setActiveLayer = useEditorStore((state) => state.setActiveLayer);
  const addLayer = useEditorStore((state) => state.addLayer);
  const renameLayer = useEditorStore((state) => state.renameLayer);
  const toggleLayerVisibility = useEditorStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore((state) => state.toggleLayerLock);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const selectedElement = useEditorStore(
    (state) => selectedElementIds.length === 1 ? state.elements.find((el) => el.id === selectedElementIds[0]) ?? null : null,
  );
  const updateElement = useEditorStore((state) => state.updateElement);

  const handleRename = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    renameLayer(id, event.target.value);
  };

  const handleStrokeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { strokeWidth: Number(event.target.value) });
  };

  const handleOpacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { opacity: Number(event.target.value) / 100 });
  };

  return (
    <aside className="flex h-full w-72 flex-col border-l border-outline bg-surface-raised/80 px-4 py-6 text-slate-100 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">Layers</h2>
        <button
          onClick={addLayer}
          className="rounded-full border border-outline px-3 py-1 text-xs uppercase tracking-wide text-slate-300 transition hover:border-accent hover:text-accent"
        >
          Add
        </button>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`rounded-xl border px-3 py-2 ${layer.id === activeLayerId ? 'border-accent bg-accent/10' : 'border-outline bg-surface-sunken'}`}
          >
            <div className="flex items-center gap-2">
              <button
                className={`text-xs uppercase tracking-wide ${layer.id === activeLayerId ? 'text-accent' : 'text-slate-400'}`}
                onClick={() => setActiveLayer(layer.id)}
              >
                {layer.id === activeLayerId ? 'Active' : 'Layer'}
              </button>
              <input
                value={layer.name}
                onChange={(event) => handleRename(layer.id, event)}
                className="flex-1 rounded bg-transparent text-sm text-slate-100 outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={() => toggleLayerVisibility(layer.id)}
                className={`rounded-full p-1 transition ${layer.visible ? 'text-accent' : 'text-slate-500 hover:text-accent'}`}
                title="Toggle visibility"
              >
                <EyeIcon visible={layer.visible} />
              </button>
              <button
                onClick={() => toggleLayerLock(layer.id)}
                className={`rounded-full p-1 transition ${layer.locked ? 'text-accent' : 'text-slate-500 hover:text-accent'}`}
                title="Toggle lock"
              >
                <LockIcon locked={layer.locked} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-outline bg-surface-sunken px-3 py-3 text-sm">
        <h3 className="text-xs uppercase tracking-widest text-slate-400">Properties</h3>
        {selectedElement ? (
          <div className="mt-3 space-y-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Type</span>
              <span className="font-semibold text-slate-100">{selectedElement.type}</span>
            </div>
            <label className="flex flex-col gap-1">
              <span>Stroke Width</span>
              <input
                type="range"
                min={1}
                max={12}
                value={selectedElement.strokeWidth}
                onChange={handleStrokeChange}
                className="accent-accent"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>Opacity</span>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedElement.opacity * 100)}
                onChange={handleOpacityChange}
                className="accent-accent"
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-xs text-slate-300">
            <p className="text-slate-500">Select an object to edit</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LayersPanel;
