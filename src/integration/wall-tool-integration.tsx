import { useCallback } from 'react';
import type { Point } from '../lib/snap-utils';
import { SnapIndex } from '../lib/snap-utils';
import { autoJoinWithNearbyWalls } from '../functions/wall-drawing-integration';

export const useWallToolIntegration = (snapIndex: SnapIndex | null) => {
  const handleWallAutoJoin = useCallback(
    (startPoint: Point, endPoint: Point, thickness: number) => {
      if (!snapIndex) return null;

      const segment = { A: startPoint, B: endPoint };
      return autoJoinWithNearbyWalls(snapIndex, segment, thickness);
    },
    [snapIndex],
  );

  return { handleWallAutoJoin };
};

