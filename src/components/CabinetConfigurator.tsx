import { useMemo } from 'react';
import { useEditorStore, type FurnitureElement } from '../state/useEditorStore';
import type { FurnitureSection } from '../types/catalog';

const MODULE_OPTIONS = [
  { value: 'base', label: 'Base' },
  { value: 'wall', label: 'Wall' },
  { value: 'tall', label: 'Tall' },
  { value: 'vanity', label: 'Vanity' },
  { value: 'corner', label: 'Corner' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'panel', label: 'Panel' },
  { value: 'custom', label: 'Custom' },
] as const;

const WIDTH_PRESETS = [300, 450, 600, 900, 1200];
const DEPTH_PRESETS = [350, 450, 600];

type LayoutPresetKey = 'double-door' | 'drawer-stack' | 'door-drawer' | 'open';

const LAYOUT_PRESETS: Record<LayoutPresetKey, FurnitureSection[]> = {
  'double-door': [
    { id: 'left', type: 'door', widthRatio: 0.5, swing: 'left' },
    { id: 'right', type: 'door', widthRatio: 0.5, swing: 'right' },
  ],
  'drawer-stack': [{ id: 'drawers', type: 'drawer', drawerCount: 3 }],
  'door-drawer': [
    { id: 'door', type: 'door', widthRatio: 0.6, swing: 'left' },
    { id: 'drawer', type: 'drawer', widthRatio: 0.4, drawerCount: 3 },
  ],
  open: [{ id: 'open', type: 'open' }],
};

const prettyNumber = (value?: number) => (value ? Math.round(value) : '');

const CabinetConfigurator = () => {
  const { elements, selectedElementIds, updateElement } = useEditorStore();
  const selected = useMemo(() => {
    const selectedId = selectedElementIds[0];
    if (!selectedId) return undefined;
    const element = elements.find((el) => el.id === selectedId);
    if (element?.type !== 'furniture') return undefined;
    return element as FurnitureElement;
  }, [elements, selectedElementIds]);

  const updateFurniture = (changes: Partial<FurnitureElement>) => {
    if (!selected) return;
    updateElement(selected.id, changes);
  };

  const updateFinish = (key: keyof NonNullable<FurnitureElement['finish']>, value: string) => {
    if (!selected) return;
    updateFurniture({
      finish: {
        ...(selected.finish ?? {}),
        [key]: value,
      },
    });
  };

  const applyLayout = (layout: LayoutPresetKey) => {
    updateFurniture({
      sections: LAYOUT_PRESETS[layout],
      metadata: {
        ...(selected?.metadata ?? {}),
        layout,
      },
    });
  };

  if (!selected) {
    return (
      <div className="rounded border border-outline bg-surface-sunken p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-200 mb-1">Cabinet Configurator</p>
        <p>Select a cabinet/furniture block to edit its parameters.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-200 font-semibold text-sm">Cabinet Configurator</p>
          <p className="text-slate-400 text-[11px]">
            Editing: <span className="text-slate-200">{selected.category ?? 'Furniture'}</span>
          </p>
        </div>
        <span className="text-[11px] text-slate-400">ID: {selected.id.slice(0, 6)}</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-slate-300 text-[11px] uppercase">Module Type</label>
        <select
          className="rounded border border-outline bg-surface px-2 py-1 text-xs"
          value={selected.moduleClass ?? ''}
          onChange={(e) =>
            updateFurniture({
              moduleClass: e.target.value as FurnitureElement['moduleClass'],
              cabinet: {
                ...(selected.cabinet ?? {}),
                moduleClass: e.target.value as FurnitureElement['moduleClass'],
              },
            })
          }
        >
          <option value="" disabled>
            Select type
          </option>
          {MODULE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-slate-400 text-[11px]">Width (mm)</label>
          <input
            type="number"
            min={100}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={prettyNumber(selected.width)}
            onChange={(e) => updateFurniture({ width: Number(e.target.value) || selected.width })}
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px]">Height (mm)</label>
          <input
            type="number"
            min={100}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={prettyNumber(selected.height)}
            onChange={(e) => updateFurniture({ height: Number(e.target.value) || selected.height })}
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px]">Depth (mm)</label>
          <input
            type="number"
            min={100}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={prettyNumber(selected.depth)}
            onChange={(e) => updateFurniture({ depth: Number(e.target.value) || selected.depth })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {WIDTH_PRESETS.map((preset) => (
          <button
            key={preset}
            className={`flex-1 rounded border px-2 py-1 text-xs ${
              Math.round(selected.width) === preset
                ? 'border-accent text-accent bg-accent/10'
                : 'border-outline text-slate-300 hover:border-accent/50'
            }`}
            onClick={() => updateFurniture({ width: preset })}
          >
            {preset} mm
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DEPTH_PRESETS.map((preset) => (
          <button
            key={preset}
            className={`flex-1 rounded border px-2 py-1 text-xs ${
              Math.round(selected.depth ?? 0) === preset
                ? 'border-accent text-accent bg-accent/10'
                : 'border-outline text-slate-300 hover:border-accent/50'
            }`}
            onClick={() => updateFurniture({ depth: preset })}
          >
            Depth {preset}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-slate-300 text-[11px] uppercase">Layout</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(LAYOUT_PRESETS) as LayoutPresetKey[]).map((key) => (
            <button
              key={key}
              className={`rounded border px-2 py-2 text-[11px] capitalize ${
                selected.metadata?.layout === key
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-outline text-slate-300 hover:border-accent/50'
              }`}
              onClick={() => applyLayout(key)}
            >
              {key.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-slate-400 text-[11px]">Front Finish</label>
          <input
            type="color"
            className="w-full rounded border border-outline bg-surface h-8"
            value={selected.finish?.front ?? '#cbd5f5'}
            onChange={(e) => updateFinish('front', e.target.value)}
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px]">Carcass Finish</label>
          <input
            type="color"
            className="w-full rounded border border-outline bg-surface h-8"
            value={selected.finish?.carcass ?? '#e2e8f0'}
            onChange={(e) => updateFinish('carcass', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-slate-400 text-[11px]">Manufacturer</label>
          <input
            type="text"
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={selected.manufacturer ?? ''}
            onChange={(e) => updateFurniture({ manufacturer: e.target.value })}
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px]">SKU</label>
          <input
            type="text"
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={selected.sku ?? ''}
            onChange={(e) => updateFurniture({ sku: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-slate-400 text-[11px]">Catalog ID</label>
          <input
            type="text"
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={selected.catalogId ?? ''}
            onChange={(e) => updateFurniture({ catalogId: e.target.value })}
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px]">Price</label>
          <input
            type="number"
            min={0}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={selected.price ?? ''}
            onChange={(e) => updateFurniture({ price: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
};

export default CabinetConfigurator;

