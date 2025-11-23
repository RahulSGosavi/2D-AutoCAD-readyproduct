import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

type GridBackgroundProps = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  gridSize?: number;
  width?: number;
  height?: number;
  name?: string;
  visible?: boolean;
};

const GridBackground = ({
  zoom,
  offsetX,
  offsetY,
  gridSize = 25,
  width = 2000,
  height = 2000,
  name = 'grid-layer',
  visible = true,
}: GridBackgroundProps) => {
  const lines = useMemo(() => {
    // Dynamic grid size based on zoom level
    // Base grid size in world coordinates
    const baseGridSize = gridSize;
    
    // Calculate grid size that scales with zoom
    // When zoomed out (zoom < 1): use smaller grid size for MORE grid lines
    // When zoomed in (zoom > 1): use larger grid size for fewer but clearer lines
    
    // Simple approach: grid size scales with zoom
    // zoom < 1 (zoomed out) → smaller grid size (baseGridSize * zoom) = more lines
    // zoom > 1 (zoomed in) → larger grid size (baseGridSize * zoom) = fewer lines
    let scaledGridSize = baseGridSize * Math.max(zoom, 0.01);
    
    // Round to nearest nice number (powers of 1, 2, 5, 10, etc.)
    // This creates clean grid divisions like AutoCAD
    const niceNumbers = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    let finalGridSize = baseGridSize;
    
    // Find the closest nice number to scaledGridSize
    if (zoom < 0.5) {
      // Very zoomed out - use small subdivisions for dense grid
      // Find nice number closest to scaledGridSize (which is small)
      for (let i = 0; i < niceNumbers.length; i++) {
        const testSize = baseGridSize * niceNumbers[i];
        if (testSize >= scaledGridSize * 0.5) {
          finalGridSize = testSize;
          break;
        }
      }
      finalGridSize = Math.max(finalGridSize, baseGridSize * 0.1);
    } else if (zoom < 1) {
      // Moderately zoomed out - use smaller grid
      for (let i = 0; i < niceNumbers.length; i++) {
        const testSize = baseGridSize * niceNumbers[i];
        if (testSize >= scaledGridSize * 0.7) {
          finalGridSize = testSize;
          break;
        }
      }
      finalGridSize = Math.max(finalGridSize, baseGridSize * 0.2);
    } else if (zoom > 1) {
      // Zoomed in - use larger grid for clarity
      for (let i = niceNumbers.length - 1; i >= 0; i--) {
        const testSize = baseGridSize * niceNumbers[i];
        if (testSize <= scaledGridSize * 1.5) {
          finalGridSize = testSize;
          break;
        }
      }
      finalGridSize = Math.min(finalGridSize, baseGridSize * 200);
    } else {
      // At 100% zoom, use base grid size
      finalGridSize = baseGridSize;
    }
    
    // Ensure reasonable bounds
    finalGridSize = Math.max(finalGridSize, baseGridSize * 0.1);
    finalGridSize = Math.min(finalGridSize, baseGridSize * 500);
    
    // Calculate visible area in world coordinates
    const visibleWidth = width / Math.max(zoom, 0.01);
    const visibleHeight = height / Math.max(zoom, 0.01);
    const worldStartX = -offsetX / Math.max(zoom, 0.01);
    const worldStartY = -offsetY / Math.max(zoom, 0.01);
    const worldEndX = worldStartX + visibleWidth;
    const worldEndY = worldStartY + visibleHeight;
    
    // Extend grid bounds significantly when zoomed out to ensure continuous lines
    // Add extra padding based on zoom level - more padding when zoomed out
    const paddingFactor = Math.max(2, 1 / Math.max(zoom, 0.01)); // More padding when zoomed out
    const extendedStartX = Math.floor((worldStartX - visibleWidth * paddingFactor) / finalGridSize) * finalGridSize;
    const extendedStartY = Math.floor((worldStartY - visibleHeight * paddingFactor) / finalGridSize) * finalGridSize;
    const extendedEndX = Math.ceil((worldEndX + visibleWidth * paddingFactor) / finalGridSize) * finalGridSize;
    const extendedEndY = Math.ceil((worldEndY + visibleHeight * paddingFactor) / finalGridSize) * finalGridSize;
    
    // Calculate screen bounds with large extension for zoom out
    // Extend screen bounds significantly to ensure lines cover entire viewport
    const screenPadding = Math.max(2000, width * 2, height * 2); // Large padding for zoom out
    const screenStartX = -screenPadding;
    const screenStartY = -screenPadding;
    const screenEndX = width + screenPadding;
    const screenEndY = height + screenPadding;

    const minorLines: Array<{ points: number[] }> = [];
    const majorLines: Array<{ points: number[] }> = [];

    // Calculate major grid spacing (every 10th minor line, or every 5th for very small grids)
    const majorGridSpacing = finalGridSize >= baseGridSize * 10 
      ? finalGridSize * 10 
      : finalGridSize * 5;

    // Vertical lines - extend far beyond visible area
    for (let x = extendedStartX; x <= extendedEndX; x += finalGridSize) {
      const screenX = x * zoom + offsetX;
      // Only render if line is within extended screen bounds
      if (screenX < screenStartX || screenX > screenEndX) continue;
      // Use floating point comparison with tolerance for major lines
      const isMajor = Math.abs(x % majorGridSpacing) < finalGridSize * 0.1;
      // Extend lines far beyond viewport to ensure continuous appearance
      const points = [screenX, screenStartY, screenX, screenEndY];
      if (isMajor) {
        majorLines.push({ points });
      } else {
        minorLines.push({ points });
      }
    }

    // Horizontal lines - extend far beyond visible area
    for (let y = extendedStartY; y <= extendedEndY; y += finalGridSize) {
      const screenY = y * zoom + offsetY;
      // Only render if line is within extended screen bounds
      if (screenY < screenStartY || screenY > screenEndY) continue;
      // Use floating point comparison with tolerance for major lines
      const isMajor = Math.abs(y % majorGridSpacing) < finalGridSize * 0.1;
      // Extend lines far beyond viewport to ensure continuous appearance
      const points = [screenStartX, screenY, screenEndX, screenY];
      if (isMajor) {
        majorLines.push({ points });
      } else {
        minorLines.push({ points });
      }
    }

    return { 
      minorLines, 
      majorLines
    };
  }, [zoom, offsetX, offsetY, gridSize, width, height]);

  // Dynamic stroke width based on zoom - thicker when zoomed out
  const baseStrokeWidth = Math.max(0.5, 1 / Math.max(zoom, 0.1)); // Minimum 0.5, scales with zoom
  const minorStrokeWidth = Math.min(baseStrokeWidth, 2); // Cap at 2px
  const majorStrokeWidth = Math.min(baseStrokeWidth * 1.5, 3); // Cap at 3px

  // Dynamic opacity - more visible when zoomed out
  const baseOpacity = Math.min(0.8, 0.4 + (1 / Math.max(zoom, 0.1)) * 0.2);
  const minorOpacity = Math.min(baseOpacity, 0.9);
  const majorOpacity = Math.min(baseOpacity + 0.1, 1.0);

  return (
    <Layer listening={false} name={name} visible={visible}>
      {lines.minorLines.map((line, idx) => (
        <Line
          key={`minor-${idx}`}
          points={line.points}
          stroke="#d0d0d0"
          strokeWidth={minorStrokeWidth}
          opacity={minorOpacity}
          perfectDrawEnabled={false}
        />
      ))}
      {lines.majorLines.map((line, idx) => (
        <Line
          key={`major-${idx}`}
          points={line.points}
          stroke="#a0a0a0"
          strokeWidth={majorStrokeWidth}
          opacity={majorOpacity}
          perfectDrawEnabled={false}
        />
      ))}
    </Layer>
  );
};

export default GridBackground;

