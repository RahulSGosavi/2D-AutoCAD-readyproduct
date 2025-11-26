import { useEffect, useMemo, useState } from 'react';
import { catalogImporter } from '../services/catalog/catalogImporter';
import type { CatalogDataset, CatalogRecord, ModuleClass } from '../types/catalog';
import { useEditorStore, type FurnitureElement } from '../state/useEditorStore';

const moduleOptions: { value: ModuleClass | ''; label: string }[] = [
  { value: '', label: 'All modules' },
  { value: 'base', label: 'Base' },
  { value: 'wall', label: 'Wall' },
  { value: 'tall', label: 'Tall' },
  { value: 'vanity', label: 'Vanity' },
  { value: 'corner', label: 'Corner' },
  { value: 'appliance', label: 'Appliance' },
];

const CatalogImportPanel = () => {
  const { elements, selectedElementIds, updateElement } = useEditorStore();
  const [datasets, setDatasets] = useState<CatalogDataset[]>([]);
  const [datasetName, setDatasetName] = useState('Manufacturer Catalog');
  const [datasetVersion, setDatasetVersion] = useState('v1');
  const [importError, setImportError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ moduleClass: ModuleClass | ''; term: string }>({
    moduleClass: '',
    term: '',
  });
  const [items, setItems] = useState<CatalogRecord[]>([]);

  const selectedFurniture = useMemo(() => {
    const selectedId = selectedElementIds[0];
    if (!selectedId) return undefined;
    const el = elements.find((element) => element.id === selectedId);
    if (el?.type === 'furniture') return el as FurnitureElement;
    return undefined;
  }, [elements, selectedElementIds]);

  const refreshDatasets = () => {
    const allDatasets = catalogImporter.listDatasets();
    setDatasets(allDatasets);
    const filteredItems = catalogImporter.filterItems({
      moduleClass: filter.moduleClass || undefined,
      term: filter.term || undefined,
    });
    setItems(filteredItems);
  };

  useEffect(() => {
    refreshDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filteredItems = catalogImporter.filterItems({
      moduleClass: filter.moduleClass || undefined,
      term: filter.term || undefined,
    });
    setItems(filteredItems);
  }, [filter]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const parsedItems = isCsv ? catalogImporter.parseCsv(text) : catalogImporter.parseJson(text);
      catalogImporter.saveDataset({
        name: datasetName || file.name,
        version: datasetVersion || 'v1',
        source: isCsv ? 'csv' : 'json',
        items: parsedItems,
      });
      setImportError(null);
      refreshDatasets();
      event.target.value = '';
    } catch (error) {
      console.error(error);
      setImportError('Failed to import catalog. Please check file format.');
    }
  };

  const handleApplyRecord = (record: CatalogRecord) => {
    if (!selectedFurniture) return;
    updateElement(selectedFurniture.id, {
      width: record.width,
      height: record.height,
      depth: record.depth,
      moduleClass: record.moduleClass,
      manufacturer: record.manufacturer,
      sku: record.sku,
      price: record.price,
      currency: record.currency,
      metadata: {
        ...(selectedFurniture.metadata ?? {}),
        catalogRecordId: record.id,
      },
    });
  };

  const handleDeleteDataset = (id: string) => {
    catalogImporter.deleteDataset(id);
    refreshDatasets();
  };

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-slate-200">Catalog Import</p>
        <p className="text-[11px] text-slate-400">Upload CSV/JSON catalogs and apply entries to cabinets.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-slate-400">Dataset Name</label>
        <input
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          className="rounded border border-outline bg-surface px-2 py-1 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Version</label>
          <input
            type="text"
            value={datasetVersion}
            onChange={(e) => setDatasetVersion(e.target.value)}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-slate-400">Upload File</label>
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs"
          />
        </div>
      </div>
      {importError && <div className="text-[11px] text-red-400">{importError}</div>}

      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-slate-400">Filter Items</label>
        <div className="flex gap-2">
          <select
            className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={filter.moduleClass}
            onChange={(e) => setFilter((prev) => ({ ...prev, moduleClass: e.target.value as ModuleClass | '' }))}
          >
            {moduleOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search manufacturer / SKU"
            className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs"
            value={filter.term}
            onChange={(e) => setFilter((prev) => ({ ...prev, term: e.target.value }))}
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto rounded border border-outline divide-y divide-outline/40">
        {items.length === 0 && <p className="p-3 text-[11px] text-slate-400">No catalog entries match filters.</p>}
        {items.map((item) => (
          <div key={item.id} className="p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-slate-200 text-xs font-semibold">{item.name}</p>
              <span className="text-[11px] text-slate-400">{item.moduleClass}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {item.width}×{item.depth}×{item.height} mm • {item.manufacturer ?? 'Manufacturer N/A'}
            </p>
            <p className="text-[11px] text-slate-500">SKU: {item.sku ?? '—'}</p>
            <button
              className={`mt-1 rounded border px-2 py-1 text-[11px] ${
                selectedFurniture ? 'border-accent text-accent hover:bg-accent/10' : 'border-outline text-slate-500 cursor-not-allowed'
              }`}
              disabled={!selectedFurniture}
              onClick={() => selectedFurniture && handleApplyRecord(item)}
            >
              Apply to Selected
            </button>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] text-slate-400 uppercase mb-1">Datasets</p>
        <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
          {datasets.length === 0 && <p className="text-[11px] text-slate-500">No datasets imported yet.</p>}
          {datasets.map((dataset) => (
            <div key={dataset.id} className="rounded border border-outline px-2 py-2 flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-xs font-semibold">{dataset.name}</p>
                <p className="text-[11px] text-slate-500">
                  {dataset.version} · {dataset.items.length} items
                </p>
              </div>
              <button className="text-[11px] text-red-400 hover:text-red-300" onClick={() => handleDeleteDataset(dataset.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatalogImportPanel;

