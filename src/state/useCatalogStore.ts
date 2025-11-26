import { create } from 'zustand';
import { BLOCK_CATALOG, type BlockDefinition } from '../data/blockCatalog';
import { apiService } from '../services/api';

type Status = 'idle' | 'loading' | 'ready' | 'error';

const buildMap = (blocks: BlockDefinition[]) =>
  blocks.reduce<Record<string, BlockDefinition>>((acc, block) => {
    acc[block.id] = block;
    return acc;
  }, {});

interface CatalogState {
  status: Status;
  blocks: BlockDefinition[];
  byId: Record<string, BlockDefinition>;
  error?: string;
  loadBlocks: (force?: boolean) => Promise<void>;
  upsertBlock: (block: BlockDefinition) => void;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  status: 'idle',
  blocks: BLOCK_CATALOG,
  byId: buildMap(BLOCK_CATALOG),
  error: undefined,
  loadBlocks: async (force) => {
    const { status } = get();
    if (!force && (status === 'loading' || status === 'ready')) {
      return;
    }
    set({ status: 'loading', error: undefined });
    try {
      const response = await apiService.getCatalogBlocks();
      const remoteBlocks = response.data?.blocks;
      if (remoteBlocks && remoteBlocks.length > 0) {
        set({
          status: 'ready',
          blocks: remoteBlocks,
          byId: buildMap(remoteBlocks),
        });
        return;
      }
      set({
        status: 'ready',
        blocks: BLOCK_CATALOG,
        byId: buildMap(BLOCK_CATALOG),
      });
    } catch (error) {
      console.warn('Falling back to local block catalog', error);
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load catalog',
        blocks: BLOCK_CATALOG,
        byId: buildMap(BLOCK_CATALOG),
      });
    }
  },
  upsertBlock: (block) => {
    const nextBlocks = get()
      .blocks.filter((item) => item.id !== block.id)
      .concat(block);
    set({
      blocks: nextBlocks,
      byId: buildMap(nextBlocks),
      status: 'ready',
    });
  },
}));

