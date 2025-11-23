import { useEditorStore } from '../state/useEditorStore';

const ViewControls = () => {
  const stageInstance = useEditorStore((state) => state.stageInstance);
  const stageScale = useEditorStore((state) => state.stageScale);
  const setStageTransform = useEditorStore((state) => state.setStageTransform);
  const stageRotation = useEditorStore((state) => state.stageRotation);

  const handleViewDirection = (direction: 'left' | 'right' | 'top' | 'front') => {
    if (!stageInstance) return;

    const stage = stageInstance;
    const width = stage.width();
    const height = stage.height();

    switch (direction) {
      case 'left':
        setStageTransform({
          position: { x: -width * 0.25, y: 0 },
          rotation: 0,
        });
        break;
      case 'right':
        setStageTransform({
          position: { x: width * 0.25, y: 0 },
          rotation: 0,
        });
        break;
      case 'top':
        setStageTransform({
          position: { x: 0, y: -height * 0.25 },
          rotation: 0,
        });
        break;
      case 'front':
        setStageTransform({
          position: { x: 0, y: 0 },
          rotation: 0,
        });
        break;
    }
  };

  const handleZoomIn = () => {
    if (!stageInstance) return;
    const newScale = Math.min(4, stageScale * 1.2);
    const stage = stageInstance;
    const width = stage.width();
    const height = stage.height();
    const centerX = width / 2;
    const centerY = height / 2;
    const mousePointTo = {
      x: (centerX - stagePosition.x) / stageScale,
      y: (centerY - stagePosition.y) / stageScale,
    };
    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };
    setStageTransform({ scale: newScale, position: newPos });
  };

  const handleZoomOut = () => {
    if (!stageInstance) return;
    const newScale = Math.max(0.1, stageScale / 1.2);
    const stage = stageInstance;
    const width = stage.width();
    const height = stage.height();
    const centerX = width / 2;
    const centerY = height / 2;
    const mousePointTo = {
      x: (centerX - stagePosition.x) / stageScale,
      y: (centerY - stagePosition.y) / stageScale,
    };
    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };
    setStageTransform({ scale: newScale, position: newPos });
  };

  const handleRotate = (angle: number) => {
    setStageTransform({ rotation: stageRotation + angle });
  };

  const handleResetView = () => {
    setStageTransform({
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    });
  };

  return (
    <div className="flex flex-col gap-2 p-2 border border-outline rounded bg-surface-raised transition-all duration-200 hover:border-accent/50">
      <div className="text-xs text-slate-300 mb-1">View Direction</div>
      <div className="grid grid-cols-3 gap-1">
        <div></div>
        <button
          onClick={() => handleViewDirection('top')}
          className="px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="Top View"
        >
          ↑
        </button>
        <div></div>
        <button
          onClick={() => handleViewDirection('left')}
          className="px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="Left View"
        >
          ←
        </button>
        <button
          onClick={() => handleViewDirection('front')}
          className="px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="Front View"
        >
          ⊙
        </button>
        <button
          onClick={() => handleViewDirection('right')}
          className="px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="Right View"
        >
          →
        </button>
        <div></div>
        <button
          onClick={() => handleViewDirection('top')}
          className="px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="Bottom View"
        >
          ↓
        </button>
        <div></div>
      </div>
      <div className="text-xs text-slate-300 mt-2 mb-1">Zoom</div>
      <div className="flex gap-1">
        <button
          onClick={handleZoomOut}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50"
          title="Zoom Out"
        >
          −
        </button>
        <span className="px-2 py-1.5 text-xs text-slate-300 self-center">
          {(stageScale * 100).toFixed(0)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50"
          title="Zoom In"
        >
          +
        </button>
      </div>
      <div className="text-xs text-slate-300 mt-2 mb-1">Rotation</div>
      <div className="flex gap-1">
        <button
          onClick={() => handleRotate(-90)}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50"
          title="Rotate Left"
        >
          ↺
        </button>
        <button
          onClick={handleResetView}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50"
          title="Reset View"
        >
          ⟲
        </button>
        <button
          onClick={() => handleRotate(90)}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-surface-sunken border border-outline text-slate-300 hover:border-accent/50"
          title="Rotate Right"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default ViewControls;

