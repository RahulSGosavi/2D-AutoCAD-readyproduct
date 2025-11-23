import { useRef, useCallback, useEffect, useState } from 'react';
import type Konva from 'konva';
import type { SnapResult, Point } from '../lib/snap-utils';

type UseSnapOverlayOptions = {
  showGuides?: boolean;
  showAngleGuide?: boolean;
  showGridCross?: boolean;
};

export function useSnapOverlay(
  stage: Konva.Stage | null,
  options: UseSnapOverlayOptions = {},
) {
  const snapResultRef = useRef<SnapResult | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [zoom, setZoom] = useState(1);

  const { showGuides = true, showAngleGuide = true, showGridCross = true } = options;

  useEffect(() => {
    if (!stage) return;

    const updateZoom = () => {
      const scale = stage.scaleX();
      setZoom(scale);
    };

    updateZoom();
    stage.on('scale', updateZoom);
    return () => {
      stage.off('scale', updateZoom);
    };
  }, [stage]);

  const setSnapResult = useCallback((result: SnapResult | null, lastPt: Point | null = null) => {
    snapResultRef.current = result;
    lastPointRef.current = lastPt;
    if (layerRef.current) {
      layerRef.current.batchDraw();
    }
  }, []);

  const clearSnap = useCallback(() => {
    snapResultRef.current = null;
    lastPointRef.current = null;
    if (layerRef.current) {
      layerRef.current.batchDraw();
    }
  }, []);

  useEffect(() => {
    if (!stage) return;

    const handlePointerUp = () => clearSnap();
    const handlePointerDown = () => clearSnap();

    stage.on('pointerup', handlePointerUp);
    stage.on('pointerdown', handlePointerDown);

    return () => {
      stage.off('pointerup', handlePointerUp);
      stage.off('pointerdown', handlePointerDown);
    };
  }, [stage, clearSnap]);

  const renderOverlay = useCallback(() => {
    if (!stage || !snapResultRef.current) return null;

    return {
      snapResult: snapResultRef.current,
      lastPoint: lastPointRef.current,
      zoom,
      showGuides,
      showAngleGuide,
      showGridCross,
      stage,
    };
  }, [stage, zoom, showGuides, showAngleGuide, showGridCross]);

  return {
    snapLayerRef: layerRef,
    setSnapResult,
    clearSnap,
    renderOverlay,
  };
}

