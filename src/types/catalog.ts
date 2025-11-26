export type ModuleClass =
  | 'base'
  | 'wall'
  | 'tall'
  | 'vanity'
  | 'corner'
  | 'appliance'
  | 'panel'
  | 'custom';

export type SectionType = 'door' | 'drawer' | 'open' | 'appliance' | 'panel';

export interface FurnitureSection {
  id: string;
  type: SectionType;
  widthRatio?: number;
  heightRatio?: number;
  swing?: 'left' | 'right' | 'bi-fold';
  drawerCount?: number;
  notes?: string;
}

export interface FurnitureFinishSet {
  carcass?: string;
  front?: string;
  countertop?: string;
  hardware?: string;
  toeKick?: string;
  notes?: string;
}

export interface AccessoryRef {
  id: string;
  quantity?: number;
  description?: string;
}

export interface CabinetModuleConfig {
  moduleClass: ModuleClass;
  depth?: number;
  height?: number;
  orientation?: 'left' | 'right' | 'center';
  toeKick?: boolean;
  sections?: FurnitureSection[];
  accessories?: AccessoryRef[];
  notes?: string;
}

export interface CatalogRecord {
  id: string;
  name: string;
  moduleClass: ModuleClass;
  width: number;
  height: number;
  depth: number;
  manufacturer?: string;
  sku?: string;
  price?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface CatalogDataset {
  id: string;
  name: string;
  version: string;
  source: 'csv' | 'json' | 'api';
  importedAt: string;
  items: CatalogRecord[];
}

