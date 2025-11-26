import type { EditorElement, Layer } from '../../state/useEditorStore';

export interface VersionSnapshot {
  id: string;
  projectId: string;
  label: string;
  createdAt: string;
  layers: Layer[];
  elements: EditorElement[];
  activeLayerId: string;
}

const STORAGE_KEY = 'kab-project-history';

const safeWindow = (): Window | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window;
};

const readHistory = (): VersionSnapshot[] => {
  const win = safeWindow();
  if (!win) return [];
  const raw = win.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as VersionSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (snapshots: VersionSnapshot[]) => {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

export const versionHistory = {
  saveSnapshot(snapshot: VersionSnapshot) {
    const snapshots = readHistory();
    snapshots.push(snapshot);
    writeHistory(snapshots);
  },
  listSnapshots(projectId: string) {
    return readHistory()
      .filter((snapshot) => snapshot.projectId === projectId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  deleteSnapshot(id: string) {
    const snapshots = readHistory().filter((snapshot) => snapshot.id !== id);
    writeHistory(snapshots);
  },
};

