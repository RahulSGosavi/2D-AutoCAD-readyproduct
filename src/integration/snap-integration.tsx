import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { SnapIndex } from '../lib/snap-utils';
import { initializeIndexWithStage, attachIndexAutoUpdate } from '../adapters/entity-index-setup';

export const useSnapIntegration = (stage: Konva.Stage | null) => {
  const snapIndexRef = useRef<SnapIndex | null>(null);

  useEffect(() => {
    if (!stage) return;

    const index = new SnapIndex();
    snapIndexRef.current = index;

    initializeIndexWithStage(stage, index);
    attachIndexAutoUpdate(stage, index);

    return () => {
      index.clear();
    };
  }, [stage]);

  return snapIndexRef.current;
};

