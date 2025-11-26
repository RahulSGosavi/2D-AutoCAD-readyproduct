import { nanoid } from 'nanoid';
import type { CatalogDataset, CatalogRecord, ModuleClass } from '../../types/catalog';

const STORAGE_KEY = 'furniture-catalog-datasets';

const safeWindow = (): Window | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window;
};

const readDatasets = (): CatalogDataset[] => {
  const win = safeWindow();
  if (!win) return [];
  const raw = win.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CatalogDataset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read catalog datasets', error);
    return [];
  }
};

const writeDatasets = (datasets: CatalogDataset[]) => {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
};

const normaliseModuleClass = (value: string): ModuleClass => {
  const normalized = value.toLowerCase();
  if (['base', 'wall', 'tall', 'vanity', 'corner', 'appliance', 'panel'].includes(normalized)) {
    return normalized as ModuleClass;
  }
  return 'custom';
};

export const catalogImporter = {
  parseCsv(csv: string): CatalogRecord[] {
    const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
    return rows
      .map((row) => row.split(',').map((cell) => cell.trim()))
      .filter((cells) => cells.length === headers.length)
      .map((cells) => {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = cells[index];
        });
        return {
          id: record.id || nanoid(),
          name: record.name || 'Catalog Item',
          moduleClass: normaliseModuleClass(record.moduleclass || record.type || 'custom'),
          width: Number(record.width) || 600,
          height: Number(record.height) || 720,
          depth: Number(record.depth) || 600,
          manufacturer: record.manufacturer,
          sku: record.sku,
          price: record.price ? Number(record.price) : undefined,
          currency: record.currency || 'USD',
          metadata: record,
        } as CatalogRecord;
      });
  },
  parseJson(json: string): CatalogRecord[] {
    const payload = JSON.parse(json) as Array<Partial<CatalogRecord>>;
    return payload.map((item) => ({
      id: item.id ?? nanoid(),
      name: item.name ?? 'Catalog Item',
      moduleClass: item.moduleClass ?? 'custom',
      width: item.width ?? 600,
      height: item.height ?? 720,
      depth: item.depth ?? 600,
      manufacturer: item.manufacturer,
      sku: item.sku,
      price: item.price,
      currency: item.currency ?? 'USD',
      metadata: item.metadata ?? {},
    }));
  },
  saveDataset(dataset: Omit<CatalogDataset, 'id' | 'importedAt'>): CatalogDataset {
    const datasets = readDatasets();
    const existingIndex = datasets.findIndex((d) => d.name === dataset.name && d.version === dataset.version);
    const newDataset: CatalogDataset = {
      ...dataset,
      id: existingIndex >= 0 ? datasets[existingIndex].id : nanoid(),
      importedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      datasets[existingIndex] = newDataset;
    } else {
      datasets.push(newDataset);
    }
    writeDatasets(datasets);
    return newDataset;
  },
  listDatasets(): CatalogDataset[] {
    return readDatasets();
  },
  deleteDataset(id: string) {
    const datasets = readDatasets().filter((dataset) => dataset.id !== id);
    writeDatasets(datasets);
  },
  filterItems(filters: { moduleClass?: ModuleClass; manufacturer?: string; term?: string }) {
    const datasets = readDatasets();
    const entries = datasets.flatMap((dataset) => dataset.items);
    return entries.filter((item) => {
      if (filters.moduleClass && item.moduleClass !== filters.moduleClass) return false;
      if (filters.manufacturer && item.manufacturer !== filters.manufacturer) return false;
      if (filters.term) {
        const term = filters.term.toLowerCase();
        return (
          item.name.toLowerCase().includes(term) ||
          (item.sku?.toLowerCase().includes(term) ?? false) ||
          (item.manufacturer?.toLowerCase().includes(term) ?? false)
        );
      }
      return true;
    });
  },
};

