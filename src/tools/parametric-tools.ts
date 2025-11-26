import type { FurnitureElement } from '../state/useEditorStore';
import type { FurnitureSection, ModuleClass } from '../types/catalog';
import { createFurnitureElement } from './block-tools';

export interface CabinetModuleInput {
  width: number;
  height: number;
  depth?: number;
  category: string;
  moduleClass: ModuleClass;
  sections?: FurnitureSection[];
  metadata?: Record<string, unknown>;
}

export interface CabinetRunParams {
  start: { x: number; y: number };
  direction: 'horizontal' | 'vertical';
  modules: CabinetModuleInput[];
  gap?: number;
  layerId: string;
}

export const generateCabinetRun = (params: CabinetRunParams): FurnitureElement[] => {
  const { start, direction, modules, gap = 5, layerId } = params;
  const elements: FurnitureElement[] = [];
  let offset = 0;
  modules.forEach((module, index) => {
    const position =
      direction === 'horizontal'
        ? { x: start.x + offset, y: start.y }
        : { x: start.x, y: start.y + offset };
    const furniture = createFurnitureElement(position, module.width, module.height, module.category, layerId, {
      moduleClass: module.moduleClass,
      sections: module.sections,
      metadata: {
        ...(module.metadata ?? {}),
        runIndex: index,
      },
      depth: module.depth,
    });
    elements.push(furniture);
    offset += module.width + gap;
  });
  return elements;
};

