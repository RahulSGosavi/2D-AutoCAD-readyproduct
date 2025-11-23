import { useEditorStore } from '../state/useEditorStore';
import { exportStageToSVG, exportStageToPDF } from '../utils/exporters';
import { handleFileUpload } from '../utils/file-upload';

const TopBar = () => {
  const saveToLocalStorage = useEditorStore((state) => state.saveToLocalStorage);
  const loadFromLocalStorage = useEditorStore((state) => state.loadFromLocalStorage);
  const loadFromProjectData = useEditorStore((state) => state.loadFromProjectData);
  const stageInstance = useEditorStore((state) => state.stageInstance);
  const snapSettings = useEditorStore((state) => state.snapSettings);
  const updateSnapSettings = useEditorStore((state) => state.updateSnapSettings);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const commandStack = useEditorStore((state) => state.commandStack);

  const handleExportSVG = () => {
    if (stageInstance) exportStageToSVG(stageInstance);
  };

  const handleExportPDF = () => {
    if (stageInstance) void exportStageToPDF(stageInstance);
  };

  const handleLocalUpload = () => {
    handleFileUpload(
      'local',
      (data) => {
        loadFromProjectData(data);
      },
      (error) => {
        alert(`Upload failed: ${error}`);
      },
    );
  };

  const handleGoogleDriveUpload = () => {
    // You'll need to set these in environment variables or config
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
      alert('Google Drive integration requires API key and Client ID. Please configure them in environment variables.');
      return;
    }

    handleFileUpload(
      'google',
      (data) => {
        loadFromProjectData(data);
      },
      (error) => {
        alert(`Google Drive upload failed: ${error}`);
      },
      { apiKey: GOOGLE_API_KEY, clientId: GOOGLE_CLIENT_ID },
    );
  };

  return (
    <div className="flex h-12 items-center gap-1 border-b border-outline bg-surface-raised px-4 text-sm text-slate-200">
      <div className="flex items-center gap-1">
        <button className="px-3 py-1.5 hover:bg-surface-sunken rounded">File</button>
        <button className="px-3 py-1.5 hover:bg-surface-sunken rounded">View</button>
        <button className="px-3 py-1.5 hover:bg-surface-sunken rounded">Tools</button>
        <button className="px-3 py-1.5 hover:bg-surface-sunken rounded">Modify</button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={snapSettings.endpoint}
            onChange={(e) => updateSnapSettings({ endpoint: e.target.checked })}
            className="rounded"
          />
          <span>Endpoint</span>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={snapSettings.midpoint}
            onChange={(e) => updateSnapSettings({ midpoint: e.target.checked })}
            className="rounded"
          />
          <span>Midpoint</span>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={snapSettings.intersection}
            onChange={(e) => updateSnapSettings({ intersection: e.target.checked })}
            className="rounded"
          />
          <span>Intersection</span>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={snapSettings.grid}
            onChange={(e) => updateSnapSettings({ grid: e.target.checked })}
            className="rounded"
          />
          <span>Grid Snap</span>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={snapSettings.showGrid}
            onChange={(e) => updateSnapSettings({ showGrid: e.target.checked })}
            className="rounded"
          />
          <span>Show Grid</span>
        </label>
      </div>
      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={undo}
          disabled={!commandStack.canUndo()}
          className="px-3 py-1.5 hover:bg-surface-sunken rounded disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!commandStack.canRedo()}
          className="px-3 py-1.5 hover:bg-surface-sunken rounded disabled:opacity-50"
        >
          Redo
        </button>
        <button onClick={saveToLocalStorage} className="px-3 py-1.5 hover:bg-surface-sunken rounded">
          Save
        </button>
        <button onClick={loadFromLocalStorage} className="px-3 py-1.5 hover:bg-surface-sunken rounded">
          Load
        </button>
        <button onClick={handleLocalUpload} className="px-3 py-1.5 hover:bg-surface-sunken rounded" title="Upload from local file">
          Upload
        </button>
        <button onClick={handleGoogleDriveUpload} className="px-3 py-1.5 hover:bg-surface-sunken rounded" title="Upload from Google Drive">
          Google Drive
        </button>
        <button onClick={handleExportSVG} className="px-3 py-1.5 hover:bg-surface-sunken rounded">
          SVG
        </button>
        <button onClick={handleExportPDF} className="px-3 py-1.5 hover:bg-surface-sunken rounded">
          PDF
        </button>
      </div>
    </div>
  );
};

export default TopBar;

