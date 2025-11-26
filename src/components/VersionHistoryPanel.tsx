import { useState } from 'react';
import { useEditorStore } from '../state/useEditorStore';

const VersionHistoryPanel = () => {
  const [label, setLabel] = useState('Snapshot');
  const saveSnapshot = useEditorStore((state) => state.saveVersionSnapshot);
  const restoreSnapshot = useEditorStore((state) => state.restoreVersionSnapshot);
  const listSnapshots = useEditorStore((state) => state.listVersionSnapshots);
  const snapshots = listSnapshots();

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-slate-200">Version History</p>
        <p className="text-[11px] text-slate-400">Save and restore local checkpoints.</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs"
        />
        <button
          className="rounded border border-accent text-accent px-2 py-1 text-[11px] hover:bg-accent/10"
          onClick={() => saveSnapshot(label)}
        >
          Save
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto divide-y divide-outline/40 rounded border border-outline">
        {snapshots.length === 0 && <p className="p-3 text-[11px] text-slate-500">No snapshots yet.</p>}
        {snapshots.map((snapshot) => (
          <div key={snapshot.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-200 text-xs font-semibold">{snapshot.label}</p>
              <p className="text-[11px] text-slate-500">{new Date(snapshot.createdAt).toLocaleString()}</p>
            </div>
            <button
              className="text-[11px] text-accent border border-accent rounded px-2 py-1 hover:bg-accent/10"
              onClick={() => restoreSnapshot(snapshot.id)}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistoryPanel;

