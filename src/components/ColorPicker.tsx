import { useEditorStore } from '../state/useEditorStore';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#808080', '#ff8080',
  '#80ff80', '#8080ff', '#ffa500', '#800080', '#008080',
  '#8b4513', '#ffc0cb', '#a52a2a', '#000080', '#008000',
];

const ColorPicker = () => {
  const drawingSettings = useEditorStore((state) => state.drawingSettings);
  const updateDrawingSettings = useEditorStore((state) => state.updateDrawingSettings);

  return (
    <div className="flex flex-col gap-2 p-2 border border-outline rounded bg-surface-raised">
      <div className="text-xs text-slate-300 mb-1">Stroke Color</div>
      <div className="grid grid-cols-5 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => updateDrawingSettings({ strokeColor: color })}
            className={`w-8 h-8 rounded border-2 ${
              drawingSettings.strokeColor === color
                ? 'border-accent ring-2 ring-accent/50'
                : 'border-outline hover:border-slate-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <input
        type="color"
        value={drawingSettings.strokeColor}
        onChange={(e) => updateDrawingSettings({ strokeColor: e.target.value })}
        className="w-full h-8 rounded border border-outline cursor-pointer"
        title="Custom stroke color"
      />
      <div className="text-xs text-slate-300 mt-2 mb-1">Fill Color</div>
      <div className="grid grid-cols-5 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={`fill-${color}`}
            onClick={() => updateDrawingSettings({ fillColor: color })}
            className={`w-8 h-8 rounded border-2 ${
              drawingSettings.fillColor === color
                ? 'border-accent ring-2 ring-accent/50'
                : 'border-outline hover:border-slate-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <input
        type="color"
        value={drawingSettings.fillColor}
        onChange={(e) => updateDrawingSettings({ fillColor: e.target.value })}
        className="w-full h-8 rounded border border-outline cursor-pointer"
        title="Custom fill color"
      />
      <div className="text-xs text-slate-300 mt-2 mb-1">Stroke Width</div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={drawingSettings.strokeWidth}
          onChange={(e) => updateDrawingSettings({ strokeWidth: parseFloat(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs text-slate-300 w-12 text-right">
          {drawingSettings.strokeWidth.toFixed(1)}px
        </span>
      </div>
    </div>
  );
};

export default ColorPicker;

