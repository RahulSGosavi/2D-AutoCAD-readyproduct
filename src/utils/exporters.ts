import type Konva from 'konva';
import { jsPDF } from 'jspdf';
import type { EditorElement } from '../state/useEditorStore';


const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const exportStageToPNG = async (
  stage: Konva.Stage,
  filename = 'floorplan.png',
  minDimension = 3840,
) => {
  const maxSide = Math.max(stage.width(), stage.height());
  const pixelRatio = clamp(minDimension / maxSide, 1, 8);
  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
  });
  triggerDownload(dataUrl, filename);
  return dataUrl;
};

type StageWithSVG = Konva.Stage & { toSVG?: () => string };

export const exportStageToSVG = (stage: Konva.Stage, filename = 'floorplan.svg') => {
  const stageWithSVG = stage as StageWithSVG;
  if (!stageWithSVG.toSVG) {
    throw new Error('SVG export requires Konva 9.0+');
  }
  const svgContent = stageWithSVG.toSVG();
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const dataUrl = URL.createObjectURL(blob);
  triggerDownload(dataUrl, filename);
  setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
  return svgContent;
};

export const exportStageToPDF = (stage: Konva.Stage, filename = 'floorplan.pdf') => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const stageWidth = stage.width();
  const stageHeight = stage.height();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scaleX = pageWidth / stageWidth;
  const scaleY = pageHeight / stageHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledWidth = stageWidth * scale;
  const scaledHeight = stageHeight * scale;
  const offsetX = (pageWidth - scaledWidth) / 2;
  const offsetY = (pageHeight - scaledHeight) / 2;

  // Hide UI layers and selection handles before export
  const gridLayer = stage.findOne('.grid-layer') || stage.findOne('#grid-layer') || stage.getLayers().find(l => l.name() === 'grid-layer');
  const selectionLayer = stage.findOne('.selection-layer') || stage.findOne('#selection-layer') || stage.getLayers().find(l => l.name() === 'selection-layer');
  const transformer = stage.findOne('Transformer') || stage.find('Transformer')[0];
  const compassLayer = stage.findOne('.compass-layer') || stage.findOne('#compass-layer') || stage.getLayers().find(l => l.name() === 'compass-layer');
  const guidesLayer = stage.findOne('.guides-layer') || stage.findOne('#guides-layer') || stage.getLayers().find(l => l.name() === 'guides-layer');
  const measureLayer = stage.findOne('.measure-layer') || stage.findOne('#measure-layer') || stage.getLayers().find(l => l.name() === 'measure-layer');
  const dimensionPreviewLayer = stage.findOne('.dimension-preview-layer') || stage.findOne('#dimension-preview-layer') || stage.getLayers().find(l => l.name() === 'dimension-preview-layer');
  const eraserPreviewLayer = stage.findOne('.eraser-preview-layer') || stage.findOne('#eraser-preview-layer') || stage.getLayers().find(l => l.name() === 'eraser-preview-layer');
  const draftLayer = stage.findOne('.draft-layer') || stage.findOne('#draft-layer') || stage.getLayers().find(l => l.name() === 'draft-layer');
  
  // Store previous visibility states
  const previousGridVisibility = gridLayer?.visible();
  const previousSelectionVisibility = selectionLayer?.visible();
  const previousTransformerVisibility = transformer?.visible();
  const previousCompassVisibility = compassLayer?.visible();
  const previousGuidesVisibility = guidesLayer?.visible();
  const previousMeasureVisibility = measureLayer?.visible();
  const previousDimensionPreviewVisibility = dimensionPreviewLayer?.visible();
  const previousEraserPreviewVisibility = eraserPreviewLayer?.visible();
  const previousDraftVisibility = draftLayer?.visible();
  
  // Hide all UI elements
  if (gridLayer) gridLayer.visible(false);
  if (selectionLayer) selectionLayer.visible(false);
  if (transformer) transformer.visible(false);
  if (compassLayer) compassLayer.visible(false);
  if (guidesLayer) guidesLayer.visible(false);
  if (measureLayer) measureLayer.visible(false);
  if (dimensionPreviewLayer) dimensionPreviewLayer.visible(false);
  if (eraserPreviewLayer) eraserPreviewLayer.visible(false);
  if (draftLayer) draftLayer.visible(false);
  
  // Force redraw to ensure UI elements are hidden
  stage.draw();

  // Use high pixel ratio for 4K quality
  const targetDPI = 300;
  const baseDPI = 72;
  const qualityMultiplier = 4;
  const pixelRatio = Math.min(qualityMultiplier, (targetDPI / baseDPI) * qualityMultiplier);

  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
    quality: 1.0,
  });

  // Use 'SLOW' compression for maximum quality
  pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight, undefined, 'SLOW');
  
  // Restore visibility of all UI elements
  if (gridLayer && previousGridVisibility !== undefined) gridLayer.visible(previousGridVisibility);
  if (selectionLayer && previousSelectionVisibility !== undefined) selectionLayer.visible(previousSelectionVisibility);
  if (transformer && previousTransformerVisibility !== undefined) transformer.visible(previousTransformerVisibility);
  if (compassLayer && previousCompassVisibility !== undefined) compassLayer.visible(previousCompassVisibility);
  if (guidesLayer && previousGuidesVisibility !== undefined) guidesLayer.visible(previousGuidesVisibility);
  if (measureLayer && previousMeasureVisibility !== undefined) measureLayer.visible(previousMeasureVisibility);
  if (dimensionPreviewLayer && previousDimensionPreviewVisibility !== undefined) dimensionPreviewLayer.visible(previousDimensionPreviewVisibility);
  if (eraserPreviewLayer && previousEraserPreviewVisibility !== undefined) eraserPreviewLayer.visible(previousEraserPreviewVisibility);
  if (draftLayer && previousDraftVisibility !== undefined) draftLayer.visible(previousDraftVisibility);
  
  stage.draw();
  
  pdf.save(filename);
  return pdf;
};

/**
 * Export multi-page PDF with drawings on each page
 * Only shows drawings that belong to each specific page
 */
export const exportPDFWithDrawings = async (
  stage: Konva.Stage,
  pdfBackground: {
    pages: Array<{ pageNumber: number; imageData: string; width: number; height: number }>;
    currentPage: number;
    totalPages: number;
  },
  elements: EditorElement[],
  filename = 'drawing-with-pdf.pdf',
) => {
  // Hide layers that shouldn't be in export (grid, PDF background, rulers, guides, etc.)
  // Find layers by name (both with and without dot prefix)
  const gridLayer = stage.findOne('.grid-layer') || stage.findOne('#grid-layer') || stage.getLayers().find(l => l.name() === 'grid-layer');
  const pdfBackgroundLayer = stage.findOne('.pdf-background-layer') || stage.findOne('#pdf-background-layer') || stage.getLayers().find(l => l.name() === 'pdf-background-layer');
  const compassLayer = stage.findOne('.compass-layer') || stage.findOne('#compass-layer') || stage.getLayers().find(l => l.name() === 'compass-layer');
  const guidesLayer = stage.findOne('.guides-layer') || stage.findOne('#guides-layer') || stage.getLayers().find(l => l.name() === 'guides-layer');
  const measureLayer = stage.findOne('.measure-layer') || stage.findOne('#measure-layer') || stage.getLayers().find(l => l.name() === 'measure-layer');
  const dimensionPreviewLayer = stage.findOne('.dimension-preview-layer') || stage.findOne('#dimension-preview-layer') || stage.getLayers().find(l => l.name() === 'dimension-preview-layer');
  const selectionLayer = stage.findOne('.selection-layer') || stage.findOne('#selection-layer') || stage.getLayers().find(l => l.name() === 'selection-layer');
  const eraserPreviewLayer = stage.findOne('.eraser-preview-layer') || stage.findOne('#eraser-preview-layer') || stage.getLayers().find(l => l.name() === 'eraser-preview-layer');
  const draftLayer = stage.findOne('.draft-layer') || stage.findOne('#draft-layer') || stage.getLayers().find(l => l.name() === 'draft-layer');
  const transformer = stage.findOne('Transformer') || stage.find('Transformer')[0];

  const layersToHide = [
    gridLayer,
    pdfBackgroundLayer,
    compassLayer,
    guidesLayer,
    measureLayer,
    dimensionPreviewLayer,
    selectionLayer,
    eraserPreviewLayer,
    draftLayer,
  ].filter(Boolean) as Konva.Layer[];
  
  // Store transformer visibility separately
  const previousTransformerVisibility = transformer?.visible();

  // Store previous visibility states
  const previousVisibility = layersToHide.map(layer => layer.visible());
  
  // Hide all non-drawing layers
  layersToHide.forEach(layer => {
    if (layer) {
      layer.visible(false);
    }
  });
  
  // Hide transformer (selection handles)
  if (transformer) {
    transformer.visible(false);
  }
  
  // Force redraw to ensure UI elements are hidden
  stage.draw();

  // Get all drawing layers (layers with actual elements)
  const drawingLayers = stage.getLayers().filter(layer => {
    const layerName = layer.name();
    return layerName && 
           !layerName.includes('grid') && 
           !layerName.includes('pdf-background') &&
           !layerName.includes('ruler') &&
           !layerName.includes('compass') &&
           !layerName.includes('guides') &&
           !layerName.includes('measure') &&
           !layerName.includes('dimension-preview') &&
           !layerName.includes('selection') &&
           !layerName.includes('draft');
  });

  // Store previous visibility of all shapes in drawing layers
  const shapeVisibilityMap = new Map<string, boolean>();
  drawingLayers.forEach(layer => {
    layer.find('Shape').forEach(shape => {
      const elementId = shape.id();
      if (elementId) {
        shapeVisibilityMap.set(elementId, shape.visible());
      }
    });
  });

  // Store original stage transform
  const originalStageScale = stage.scaleX();
  const originalStageX = stage.x();
  const originalStageY = stage.y();

  // Export each PDF page with drawings
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compressPdf: true,
  });

  for (let pageNum = 0; pageNum < pdfBackground.pages.length; pageNum++) {
    const pdfPage = pdfBackground.pages[pageNum];
    const targetPageNumber = pageNum + 1;
    
    // Add new page (except for first page)
    if (pageNum > 0) {
      pdf.addPage();
    }

    // Get display dimensions (PDF is rendered at 4x, so divide by 4)
    const displayWidth = pdfPage.width / 4;
    const displayHeight = pdfPage.height / 4;

    // Calculate page size and scale for PDF document
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate scale to fit PDF page in PDF document
    const scaleX = pageWidth / displayWidth;
    const scaleY = pageHeight / displayHeight;
    const fitScale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some margin
    
    const scaledWidth = displayWidth * fitScale;
    const scaledHeight = displayHeight * fitScale;
    const offsetX = (pageWidth - scaledWidth) / 2;
    const offsetY = (pageHeight - scaledHeight) / 2;

    // Reset stage transform to origin and scale 1 for accurate coordinate capture
    // The PDF background is at (0,0) in world coordinates, so drawings should also be at (0,0)
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    // Filter elements for this page - hide elements that don't belong to this page
    drawingLayers.forEach(layer => {
      layer.find('Shape').forEach(shape => {
        const elementId = shape.id();
        if (elementId) {
          const element = elements.find(el => el.id === elementId);
          if (element) {
            const elementPage = (element as any).pdfPageNumber;
            // Show element if it belongs to this page, or if it has no page assigned (legacy elements on first page)
            const shouldShow = elementPage === undefined 
              ? targetPageNumber === 1 
              : elementPage === targetPageNumber;
            shape.visible(shouldShow);
          }
        }
      });
    });

    // Redraw stage with filtered elements and reset transform
    stage.draw();

    // Capture drawings at the PDF page's display size
    // Since stage is reset to origin and scale 1, we capture from (0,0) to (displayWidth, displayHeight)
    // Use high pixel ratio for 4K quality (4x for true 4K, or 3x for high quality)
    // Calculate pixel ratio based on desired output resolution
    // For 4K (3840x2160), we want at least 4x pixel ratio
    const targetDPI = 300; // Print quality DPI
    const baseDPI = 72; // Screen DPI
    const qualityMultiplier = 4; // 4K quality multiplier
    const pixelRatio = Math.min(qualityMultiplier, (targetDPI / baseDPI) * qualityMultiplier);
    
    const drawingsDataUrl = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality: 1.0, // Maximum quality
      x: 0,
      y: 0,
      width: displayWidth,
      height: displayHeight,
    });
    
    // Validate that we got a valid data URL
    if (!drawingsDataUrl || drawingsDataUrl === 'data:,') {
      console.warn(`Failed to capture drawings for page ${targetPageNumber}`);
    }

    // Load and add PDF page as background
    try {
      // Wait for PDF page image to be ready
      const pdfPageImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = pdfPage.imageData;
      });
      
      // Use 'SLOW' compression for maximum quality (4K/HD)
      pdf.addImage(pdfPageImg, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight, undefined, 'SLOW');
    } catch (error) {
      console.error(`Failed to load PDF page ${pageNum + 1}:`, error);
      // Continue with next page
      continue;
    }

    // Add drawings overlay on top of PDF page (only if we have drawings for this page)
    if (drawingsDataUrl && drawingsDataUrl !== 'data:,') {
      // Drawings are captured at displayWidth x displayHeight, so they should match PDF page size exactly
      // Scale them to match the PDF page's scaled size
      let drawWidth = scaledWidth;
      let drawHeight = scaledHeight;
      let drawOffsetX = offsetX;
      let drawOffsetY = offsetY;

      // Load and add drawings image
      try {
        const drawingsImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = drawingsDataUrl;
        });
        
        // Use 'SLOW' compression for maximum quality (4K/HD)
        // Drawings should align perfectly with PDF page since both are at (0,0) in world coordinates
        pdf.addImage(drawingsImg, 'PNG', drawOffsetX, drawOffsetY, drawWidth, drawHeight, undefined, 'SLOW');
      } catch (error) {
        console.error(`Failed to load drawings image for page ${targetPageNumber}:`, error);
        // Continue without drawings overlay
      }
    }
  }

  // Restore original stage transform
  stage.scale({ x: originalStageScale, y: originalStageScale });
  stage.position({ x: originalStageX, y: originalStageY });

  // Restore visibility of all shapes
  drawingLayers.forEach(layer => {
    layer.find('Shape').forEach(shape => {
      const elementId = shape.id();
      if (elementId && shapeVisibilityMap.has(elementId)) {
        shape.visible(shapeVisibilityMap.get(elementId) ?? true);
      }
    });
  });

  // Restore visibility of all hidden layers
  layersToHide.forEach((layer, index) => {
    layer.visible(previousVisibility[index] ?? true);
  });
  
  // Restore transformer visibility
  if (transformer && previousTransformerVisibility !== undefined) {
    transformer.visible(previousTransformerVisibility);
  }
  
  stage.draw();

  pdf.save(filename);
  return pdf;
};

const triggerDownload = (dataUrl: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
