import type { FurnitureElement } from '../../state/useEditorStore';

const STORAGE_KEY = 'catalog-furniture-metadata';

type FurnitureMetadataRecord = Pick<
  FurnitureElement,
  | 'id'
  | 'category'
  | 'moduleClass'
  | 'cabinet'
  | 'finish'
  | 'manufacturer'
  | 'sku'
  | 'catalogId'
  | 'price'
  | 'currency'
  | 'tags'
  | 'accessories'
  | 'sections'
  | 'metadata'
>;

const safeWindow = (): Window | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window;
};

const readMetadata = (): Record<string, FurnitureMetadataRecord> => {
  const win = safeWindow();
  if (!win) return {};
  const raw = win.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse catalog metadata cache', error);
    return {};
  }
};

const writeMetadata = (records: Record<string, FurnitureMetadataRecord>): void => {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const catalogMetadataStore = {
  save(element: FurnitureElement) {
    const records = readMetadata();
    records[element.id] = {
      id: element.id,
      category: element.category,
      moduleClass: element.moduleClass,
      cabinet: element.cabinet,
      finish: element.finish,
      manufacturer: element.manufacturer,
      sku: element.sku,
      catalogId: element.catalogId,
      price: element.price,
      currency: element.currency,
      tags: element.tags,
      accessories: element.accessories,
      sections: element.sections,
      metadata: element.metadata,
    };
    writeMetadata(records);
  },
  remove(elementId: string) {
    const records = readMetadata();
    if (records[elementId]) {
      delete records[elementId];
      writeMetadata(records);
    }
  },
  get(elementId: string): FurnitureMetadataRecord | undefined {
    const records = readMetadata();
    return records[elementId];
  },
  list(): FurnitureMetadataRecord[] {
    return Object.values(readMetadata());
  },
};

