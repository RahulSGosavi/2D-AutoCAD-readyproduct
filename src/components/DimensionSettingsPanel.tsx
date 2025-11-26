import { useEditorStore } from '../state/useEditorStore';

const DimensionSettingsPanel = () => {
  const { drawingSettings, updateDrawingSettings } = useEditorStore();
  const style = drawingSettings.dimensionStyle;

  const updateStyle = (changes: Partial<typeof style>) => {
    updateDrawingSettings({
      dimensionStyle: {
        ...style,
        ...changes,
      },
    });
  };

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-slate-200">Dimension Style</p>
        <p className="text-[11px] text-slate-400">Control extension lines, ticks, and label appearance.</p>
      </div>
      <label className="inline-flex items-center gap-2 text-slate-300 text-[11px]">
        <input
          type="checkbox"
          checked={style.showExtensions}
          onChange={(e) => updateStyle({ showExtensions: e.target.checked })}
        />
        Show extension lines
      </label>
      <label className="inline-flex items-center gap-2 text-slate-300 text-[11px]">
        <input type="checkbox" checked={style.showTicks} onChange={(e) => updateStyle({ showTicks: e.target.checked })} />
        Show tick marks
      </label>
      <div>
        <label className="text-[11px] text-slate-400">Label background</label>
        <input
          type="color"
          value={style.textBackground || '#0f172a'}
          onChange={(e) => updateStyle({ textBackground: e.target.value })}
          className="w-full h-8 rounded border border-outline bg-surface"
        />
      </div>
      <div>
        <label className="text-[11px] text-slate-400">Font size</label>
        <input
          type="number"
          min={8}
          max={32}
          value={style.fontSize}
          onChange={(e) => updateStyle({ fontSize: Number(e.target.value) || style.fontSize })}
          className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
};

export default DimensionSettingsPanel;

