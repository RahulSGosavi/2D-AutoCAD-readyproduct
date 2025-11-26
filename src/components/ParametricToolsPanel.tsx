import { useState } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { generateCabinetRun } from '../tools/parametric-tools';

const defaultModules = [
  {
    name: 'Sink Base 900',
    width: 90,
    height: 60,
    category: 'base-cabinet',
    moduleClass: 'base',
  },
  {
    name: 'Drawer Stack 600',
    width: 60,
    height: 60,
    category: 'base-cabinet',
    moduleClass: 'base',
  },
  {
    name: 'Corner Fill 150',
    width: 15,
    height: 60,
    category: 'base-cabinet',
    moduleClass: 'corner',
  },
] as const;

const ParametricToolsPanel = () => {
  const { activeLayerId, addElement } = useEditorStore();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [gap, setGap] = useState(5);

  const handleGenerate = () => {
    if (!activeLayerId) return;
    const runElements = generateCabinetRun({
      start: { x: startX, y: startY },
      direction,
      gap,
      layerId: activeLayerId,
      modules: defaultModules.map((module) => ({
        width: module.width,
        height: module.height,
        category: module.category,
        moduleClass: module.moduleClass,
        metadata: { preset: module.name },
      })),
    });
    runElements.forEach((element) => addElement(element));
  };

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-slate-200">Parametric Tools</p>
        <p className="text-[11px] text-slate-400">Generate cabinet runs using presets.</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Start X</label>
          <input
            type="number"
            value={startX}
            onChange={(e) => setStartX(Number(e.target.value) || 0)}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Start Y</label>
          <input
            type="number"
            value={startY}
            onChange={(e) => setStartY(Number(e.target.value) || 0)}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'horizontal' | 'vertical')}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Gap (mm)</label>
          <input
            type="number"
            value={gap}
            onChange={(e) => setGap(Number(e.target.value) || 0)}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          />
        </div>
      </div>
      <button
        className="rounded border border-accent text-accent px-2 py-2 text-xs hover:bg-accent/10 disabled:opacity-40"
        onClick={handleGenerate}
        disabled={!activeLayerId}
      >
        Generate Base Run
      </button>
      <div className="text-[11px] text-slate-500">
        Preset modules: {defaultModules.map((mod) => mod.name).join(', ')}
      </div>
    </div>
  );
};

export default ParametricToolsPanel;

