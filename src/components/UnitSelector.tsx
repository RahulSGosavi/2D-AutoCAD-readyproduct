import { useEditorStore, type UnitType } from '../state/useEditorStore';

const UNITS: { value: UnitType; label: string; scale: number }[] = [
  { value: 'mm', label: 'mm', scale: 1 },
  { value: 'cm', label: 'cm', scale: 10 },
  { value: 'm', label: 'm', scale: 1000 },
  { value: 'inch', label: 'inch', scale: 25.4 },
  { value: 'ft', label: 'ft', scale: 304.8 },
];

const UnitSelector = () => {
  const drawingSettings = useEditorStore((state) => state.drawingSettings);
  const updateDrawingSettings = useEditorStore((state) => state.updateDrawingSettings);

  const handleUnitChange = (unit: UnitType) => {
    const unitConfig = UNITS.find((u) => u.value === unit);
    if (unitConfig) {
      updateDrawingSettings({
        unit,
        unitScale: unitConfig.scale,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 border border-outline rounded bg-surface-raised">
      <div className="text-xs text-slate-300 mb-1">Measurement Unit</div>
      <div className="flex flex-col gap-1">
        {UNITS.map((unit) => (
          <button
            key={unit.value}
            onClick={() => handleUnitChange(unit.value)}
            className={`px-3 py-1.5 text-xs rounded text-left ${
              drawingSettings.unit === unit.value
                ? 'bg-accent/30 border-2 border-accent text-accent'
                : 'bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50'
            }`}
          >
            {unit.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnitSelector;

