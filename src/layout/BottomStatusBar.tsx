import { useEditorStore } from '../state/useEditorStore';

const BottomStatusBar = () => {
  const pointer = useEditorStore((state) => state.pointer);
  const stageScale = useEditorStore((state) => state.stageScale);
  const snapSettings = useEditorStore((state) => state.snapSettings);
  const tool = useEditorStore((state) => state.tool);

  const activeSnaps: string[] = [];
  if (snapSettings.endpoint) activeSnaps.push('Endpoint');
  if (snapSettings.midpoint) activeSnaps.push('Midpoint');
  if (snapSettings.intersection) activeSnaps.push('Intersection');
  if (snapSettings.perpendicular) activeSnaps.push('Perpendicular');
  if (snapSettings.grid) activeSnaps.push('Grid');
  if (snapSettings.angle) activeSnaps.push('Angle');

  return (
    <div className="flex h-8 items-center gap-4 border-t border-outline bg-surface-raised px-4 text-xs text-slate-300">
      <span className="font-mono">
        X: {pointer.x.toFixed(1)} Y: {pointer.y.toFixed(1)}
      </span>
      <span className="font-mono">Zoom: {(stageScale * 100).toFixed(0)}%</span>
      <span className="text-slate-400">Tool: {tool}</span>
      {activeSnaps.length > 0 && (
        <span className="text-slate-400">Snap: {activeSnaps.join(', ')}</span>
      )}
    </div>
  );
};

export default BottomStatusBar;

