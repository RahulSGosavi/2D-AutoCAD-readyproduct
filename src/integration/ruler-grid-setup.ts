import type Konva from 'konva';

export interface RulerGridConfig {
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
}

export const setupRulerGrid = (
  stage: Konva.Stage,
  config: RulerGridConfig,
): { cleanup: () => void } => {
  const { gridSize, showGrid, showRulers, snapToGrid } = config;

  const handleZoom = () => {
    stage.batchDraw();
  };

  const handleScroll = () => {
    stage.batchDraw();
  };

  if (showRulers || showGrid) {
    stage.on('wheel', handleZoom);
    stage.on('dragmove', handleScroll);
  }

  return {
    cleanup: () => {
      stage.off('wheel', handleZoom);
      stage.off('dragmove', handleScroll);
    },
  };
};

