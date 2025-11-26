import type { ModuleClass } from '../types/catalog';

export type PlanShape =
  | {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      cornerRadius?: number;
      stroke?: 'base' | 'detail' | string;
      strokeWidth?: number;
      fill?: 'base' | 'detail' | string;
      dash?: number[];
    }
  | {
      kind: 'line';
      points: [number, number, number, number];
      stroke?: 'base' | 'detail' | string;
      strokeWidth?: number;
      dash?: number[];
    }
  | {
      kind: 'circle';
      x: number;
      y: number;
      radius: number;
      stroke?: 'base' | 'detail' | string;
      strokeWidth?: number;
      fill?: 'base' | 'detail' | string;
      dash?: number[];
    };

export interface BlockDefinition {
  id: string;
  name: string;
  type: 'furniture';
  category: 'kitchen' | 'bathroom' | 'furniture' | 'electrical' | 'plumbing' | 'appliances';
  manufacturer?: string;
  sku?: string;
  tags?: string[];
  moduleClass?: ModuleClass;
  width: number;
  height: number;
  depth?: number;
  description?: string;
  planSymbols: PlanShape[];
}

export const BLOCK_CATALOG: BlockDefinition[] = [
  // ============ FURNITURE ============
  {
    id: 'bed-single',
    name: 'Bed (Single)',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'Generic Furniture Co.',
    sku: 'BED-S-1000',
    width: 1000,
    height: 2000,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.04 },
      { kind: 'rect', x: 0.05, y: 0.05, width: 0.9, height: 0.35, fill: 'detail' },
      { kind: 'rect', x: 0.05, y: 0.45, width: 0.9, height: 0.5, fill: 'detail', dash: [0.02, 0.03] },
      { kind: 'line', points: [0.05, 0.45, 0.95, 0.45], stroke: 'detail' },
    ],
  },
  {
    id: 'bed-double',
    name: 'Bed (Double)',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'Generic Furniture Co.',
    sku: 'BED-D-1600',
    width: 1600,
    height: 2000,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.05 },
      { kind: 'line', points: [0.5, 0.05, 0.5, 0.95], stroke: 'detail', dash: [0.03, 0.03] },
      { kind: 'rect', x: 0.07, y: 0.07, width: 0.86, height: 0.32, fill: 'detail' },
      { kind: 'rect', x: 0.07, y: 0.45, width: 0.86, height: 0.48, fill: 'detail', dash: [0.02, 0.03] },
      { kind: 'line', points: [0.07, 0.45, 0.93, 0.45], stroke: 'detail' },
    ],
  },
  {
    id: 'sofa-3',
    name: 'Sofa (3-Seater)',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'ComfortLiving',
    sku: 'SOFA-3-2100',
    width: 2100,
    height: 800,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0.1, width: 1, height: 0.8, cornerRadius: 0.05 },
      { kind: 'rect', x: 0.05, y: 0.05, width: 0.9, height: 0.35, fill: 'detail' },
      { kind: 'line', points: [0.33, 0.1, 0.33, 0.9], dash: [0.02, 0.02], stroke: 'detail' },
      { kind: 'line', points: [0.66, 0.1, 0.66, 0.9], dash: [0.02, 0.02], stroke: 'detail' },
      { kind: 'rect', x: 0.02, y: 0.2, width: 0.06, height: 0.6, fill: 'detail' },
      { kind: 'rect', x: 0.92, y: 0.2, width: 0.06, height: 0.6, fill: 'detail' },
    ],
  },
  {
    id: 'dining-table-rect',
    name: 'Dining Table (Rect)',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'Atelier Tables',
    sku: 'TABLE-RECT-1800',
    width: 1800,
    height: 900,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.08 },
      { kind: 'rect', x: 0.05, y: 0.15, width: 0.9, height: 0.7, stroke: 'detail' },
      { kind: 'circle', x: 0.15, y: 0.25, radius: 0.04, fill: 'detail' },
      { kind: 'circle', x: 0.15, y: 0.75, radius: 0.04, fill: 'detail' },
      { kind: 'circle', x: 0.85, y: 0.25, radius: 0.04, fill: 'detail' },
      { kind: 'circle', x: 0.85, y: 0.75, radius: 0.04, fill: 'detail' },
    ],
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'Closets Pro',
    sku: 'WARD-1200',
    width: 1200,
    height: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'line', points: [0.33, 0, 0.33, 1], stroke: 'detail' },
      { kind: 'line', points: [0.66, 0, 0.66, 1], stroke: 'detail' },
      { kind: 'circle', x: 0.16, y: 0.5, radius: 0.03, fill: 'detail' },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.03, fill: 'detail' },
      { kind: 'circle', x: 0.84, y: 0.5, radius: 0.03, fill: 'detail' },
    ],
  },
  {
    id: 'desk',
    name: 'Office Desk',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'WorkSpace',
    sku: 'DESK-1400',
    width: 1400,
    height: 700,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.03 },
      { kind: 'rect', x: 0.02, y: 0.6, width: 0.25, height: 0.38, fill: 'detail' },
      { kind: 'rect', x: 0.73, y: 0.6, width: 0.25, height: 0.38, fill: 'detail' },
    ],
  },
  {
    id: 'chair',
    name: 'Chair',
    type: 'furniture',
    category: 'furniture',
    manufacturer: 'SeatCo',
    sku: 'CHAIR-450',
    width: 450,
    height: 450,
    planSymbols: [
      { kind: 'rect', x: 0.1, y: 0.1, width: 0.8, height: 0.8, cornerRadius: 0.1 },
      { kind: 'rect', x: 0.2, y: 0, width: 0.6, height: 0.15, fill: 'detail' },
    ],
  },

  // ============ KITCHEN ============
  {
    id: 'base-cabinet',
    name: 'Base Cabinet',
    type: 'furniture',
    category: 'kitchen',
    manufacturer: 'KAB Kitchens',
    sku: 'CAB-B-600',
    moduleClass: 'base',
    width: 600,
    height: 600,
    depth: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'line', points: [0.5, 0, 0.5, 1], stroke: 'detail' },
      { kind: 'circle', x: 0.25, y: 0.5, radius: 0.04, fill: 'detail' },
      { kind: 'circle', x: 0.75, y: 0.5, radius: 0.04, fill: 'detail' },
    ],
  },
  {
    id: 'sink-unit',
    name: 'Sink Base Unit',
    type: 'furniture',
    category: 'kitchen',
    manufacturer: 'KAB Kitchens',
    sku: 'SINK-900',
    moduleClass: 'base',
    width: 900,
    height: 600,
    depth: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'rect', x: 0.08, y: 0.1, width: 0.84, height: 0.6, fill: 'detail' },
      { kind: 'circle', x: 0.35, y: 0.4, radius: 0.05, stroke: 'base' },
      { kind: 'circle', x: 0.65, y: 0.4, radius: 0.05, stroke: 'base' },
      { kind: 'line', points: [0.08, 0.8, 0.92, 0.8], stroke: 'detail' },
      { kind: 'circle', x: 0.5, y: 0.25, radius: 0.03, fill: 'detail' },
    ],
  },
  {
    id: 'stove',
    name: 'Stove/Cooktop',
    type: 'furniture',
    category: 'kitchen',
    manufacturer: 'KAB Kitchens',
    sku: 'STOVE-600',
    width: 600,
    height: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'circle', x: 0.25, y: 0.25, radius: 0.12, stroke: 'detail' },
      { kind: 'circle', x: 0.75, y: 0.25, radius: 0.12, stroke: 'detail' },
      { kind: 'circle', x: 0.25, y: 0.75, radius: 0.12, stroke: 'detail' },
      { kind: 'circle', x: 0.75, y: 0.75, radius: 0.12, stroke: 'detail' },
    ],
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    type: 'furniture',
    category: 'kitchen',
    manufacturer: 'CoolTech',
    sku: 'FRIDGE-900',
    width: 900,
    height: 700,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'line', points: [0.6, 0, 0.6, 1], stroke: 'detail' },
      { kind: 'circle', x: 0.3, y: 0.5, radius: 0.04, fill: 'detail' },
      { kind: 'circle', x: 0.8, y: 0.5, radius: 0.03, fill: 'detail' },
    ],
  },

  // ============ BATHROOM ============
  {
    id: 'wc',
    name: 'Toilet (WC)',
    type: 'furniture',
    category: 'bathroom',
    manufacturer: 'SanitaryWorks',
    sku: 'WC-400',
    width: 400,
    height: 700,
    planSymbols: [
      { kind: 'rect', x: 0.2, y: 0, width: 0.6, height: 0.35, cornerRadius: 0.05 },
      { kind: 'circle', x: 0.5, y: 0.65, radius: 0.28, stroke: 'base' },
      { kind: 'circle', x: 0.5, y: 0.65, radius: 0.15, stroke: 'detail' },
    ],
  },
  {
    id: 'bathtub',
    name: 'Bathtub',
    type: 'furniture',
    category: 'bathroom',
    manufacturer: 'SanitaryWorks',
    sku: 'BATH-1700',
    width: 1700,
    height: 750,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.1 },
      { kind: 'rect', x: 0.05, y: 0.08, width: 0.9, height: 0.84, cornerRadius: 0.08, stroke: 'detail' },
      { kind: 'circle', x: 0.15, y: 0.5, radius: 0.04, fill: 'detail' },
    ],
  },
  {
    id: 'shower',
    name: 'Shower',
    type: 'furniture',
    category: 'bathroom',
    manufacturer: 'SanitaryWorks',
    sku: 'SHOWER-900',
    width: 900,
    height: 900,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'line', points: [0, 0, 1, 1], stroke: 'detail', dash: [0.05, 0.05] },
      { kind: 'line', points: [1, 0, 0, 1], stroke: 'detail', dash: [0.05, 0.05] },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.08, fill: 'detail' },
    ],
  },
  {
    id: 'basin',
    name: 'Wash Basin',
    type: 'furniture',
    category: 'bathroom',
    manufacturer: 'SanitaryWorks',
    sku: 'BASIN-500',
    width: 500,
    height: 450,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.1 },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.3, stroke: 'detail' },
      { kind: 'circle', x: 0.5, y: 0.35, radius: 0.05, fill: 'detail' },
    ],
  },

  // ============ ELECTRICAL ============
  {
    id: 'outlet-single',
    name: 'Power Outlet',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'ElectroPro',
    sku: 'OUT-S-01',
    width: 100,
    height: 100,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.4, stroke: 'base' },
      { kind: 'line', points: [0.35, 0.35, 0.65, 0.65], stroke: 'detail' },
      { kind: 'line', points: [0.35, 0.65, 0.65, 0.35], stroke: 'detail' },
    ],
  },
  {
    id: 'outlet-double',
    name: 'Double Outlet',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'ElectroPro',
    sku: 'OUT-D-01',
    width: 150,
    height: 100,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0.1, width: 1, height: 0.8, cornerRadius: 0.1 },
      { kind: 'circle', x: 0.3, y: 0.5, radius: 0.2, stroke: 'detail' },
      { kind: 'circle', x: 0.7, y: 0.5, radius: 0.2, stroke: 'detail' },
    ],
  },
  {
    id: 'switch-single',
    name: 'Light Switch',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'ElectroPro',
    sku: 'SW-S-01',
    width: 80,
    height: 80,
    planSymbols: [
      { kind: 'rect', x: 0.1, y: 0.1, width: 0.8, height: 0.8, cornerRadius: 0.1 },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.15, fill: 'detail' },
    ],
  },
  {
    id: 'ceiling-fan',
    name: 'Ceiling Fan',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'AirFlow',
    sku: 'FAN-C-01',
    width: 1200,
    height: 1200,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.45, stroke: 'base' },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.1, fill: 'detail' },
      { kind: 'line', points: [0.5, 0.1, 0.5, 0.35], stroke: 'detail' },
      { kind: 'line', points: [0.5, 0.65, 0.5, 0.9], stroke: 'detail' },
      { kind: 'line', points: [0.1, 0.5, 0.35, 0.5], stroke: 'detail' },
      { kind: 'line', points: [0.65, 0.5, 0.9, 0.5], stroke: 'detail' },
    ],
  },
  {
    id: 'ceiling-light',
    name: 'Ceiling Light',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'LightCo',
    sku: 'LIGHT-C-01',
    width: 400,
    height: 400,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.4, stroke: 'base' },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.2, fill: 'detail' },
      { kind: 'line', points: [0.2, 0.2, 0.8, 0.8], stroke: 'detail' },
      { kind: 'line', points: [0.2, 0.8, 0.8, 0.2], stroke: 'detail' },
    ],
  },
  {
    id: 'tv',
    name: 'Television',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'ViewTech',
    sku: 'TV-55',
    width: 1200,
    height: 100,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.05 },
      { kind: 'rect', x: 0.05, y: 0.15, width: 0.9, height: 0.7, fill: 'detail' },
    ],
  },
  {
    id: 'ac-unit',
    name: 'AC Unit',
    type: 'furniture',
    category: 'electrical',
    manufacturer: 'CoolAir',
    sku: 'AC-SPLIT-01',
    width: 1000,
    height: 300,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.1 },
      { kind: 'line', points: [0.1, 0.3, 0.9, 0.3], stroke: 'detail' },
      { kind: 'line', points: [0.1, 0.5, 0.9, 0.5], stroke: 'detail' },
      { kind: 'line', points: [0.1, 0.7, 0.9, 0.7], stroke: 'detail' },
    ],
  },

  // ============ PLUMBING ============
  {
    id: 'water-heater',
    name: 'Water Heater',
    type: 'furniture',
    category: 'plumbing',
    manufacturer: 'HotWater Inc',
    sku: 'WH-50L',
    width: 500,
    height: 500,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.45, stroke: 'base' },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.3, stroke: 'detail' },
      { kind: 'line', points: [0.3, 0.3, 0.7, 0.7], stroke: 'detail' },
    ],
  },
  {
    id: 'floor-drain',
    name: 'Floor Drain',
    type: 'furniture',
    category: 'plumbing',
    manufacturer: 'DrainTech',
    sku: 'FD-100',
    width: 150,
    height: 150,
    planSymbols: [
      { kind: 'rect', x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.25, stroke: 'detail' },
      { kind: 'line', points: [0.3, 0.3, 0.7, 0.7], stroke: 'detail' },
      { kind: 'line', points: [0.3, 0.7, 0.7, 0.3], stroke: 'detail' },
    ],
  },
  {
    id: 'water-tap',
    name: 'Water Tap/Faucet',
    type: 'furniture',
    category: 'plumbing',
    manufacturer: 'TapWorks',
    sku: 'TAP-01',
    width: 100,
    height: 100,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.35, stroke: 'base' },
      { kind: 'rect', x: 0.35, y: 0.2, width: 0.3, height: 0.6, fill: 'detail' },
    ],
  },
  {
    id: 'pipe-valve',
    name: 'Pipe Valve',
    type: 'furniture',
    category: 'plumbing',
    manufacturer: 'PipeTech',
    sku: 'VALVE-01',
    width: 80,
    height: 80,
    planSymbols: [
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.4, stroke: 'base' },
      { kind: 'line', points: [0.2, 0.5, 0.8, 0.5], stroke: 'detail' },
      { kind: 'line', points: [0.5, 0.2, 0.5, 0.8], stroke: 'detail' },
    ],
  },
  {
    id: 'washing-machine',
    name: 'Washing Machine',
    type: 'furniture',
    category: 'plumbing',
    manufacturer: 'CleanTech',
    sku: 'WM-600',
    width: 600,
    height: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'circle', x: 0.5, y: 0.55, radius: 0.35, stroke: 'detail' },
      { kind: 'rect', x: 0.1, y: 0.05, width: 0.8, height: 0.12, fill: 'detail' },
    ],
  },

  // ============ APPLIANCES ============
  {
    id: 'microwave',
    name: 'Microwave',
    type: 'furniture',
    category: 'appliances',
    manufacturer: 'KitchenPro',
    sku: 'MW-01',
    width: 500,
    height: 350,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1, cornerRadius: 0.05 },
      { kind: 'rect', x: 0.05, y: 0.1, width: 0.7, height: 0.8, stroke: 'detail' },
      { kind: 'circle', x: 0.87, y: 0.3, radius: 0.06, fill: 'detail' },
      { kind: 'circle', x: 0.87, y: 0.5, radius: 0.06, fill: 'detail' },
      { kind: 'circle', x: 0.87, y: 0.7, radius: 0.06, fill: 'detail' },
    ],
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    type: 'furniture',
    category: 'appliances',
    manufacturer: 'CleanTech',
    sku: 'DW-600',
    width: 600,
    height: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'rect', x: 0.1, y: 0.1, width: 0.8, height: 0.4, stroke: 'detail' },
      { kind: 'rect', x: 0.1, y: 0.55, width: 0.8, height: 0.35, stroke: 'detail' },
      { kind: 'circle', x: 0.5, y: 0.3, radius: 0.05, fill: 'detail' },
    ],
  },
  {
    id: 'oven',
    name: 'Oven',
    type: 'furniture',
    category: 'appliances',
    manufacturer: 'KitchenPro',
    sku: 'OVEN-600',
    width: 600,
    height: 600,
    planSymbols: [
      { kind: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { kind: 'rect', x: 0.08, y: 0.08, width: 0.84, height: 0.84, stroke: 'detail' },
      { kind: 'circle', x: 0.5, y: 0.5, radius: 0.15, stroke: 'detail' },
    ],
  },
];

export const BLOCKS_BY_CATEGORY = BLOCK_CATALOG.reduce<Record<string, BlockDefinition[]>>((acc, block) => {
  if (!acc[block.category]) acc[block.category] = [];
  acc[block.category].push(block);
  return acc;
}, {});

export const BLOCKS_BY_ID = BLOCK_CATALOG.reduce<Record<string, BlockDefinition>>((acc, block) => {
  acc[block.id] = block;
  return acc;
}, {});
