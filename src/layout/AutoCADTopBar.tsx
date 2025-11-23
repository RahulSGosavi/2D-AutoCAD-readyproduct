// src/layout/AutoCADTopBar.tsx
import React, { useRef } from 'react';
import { useEditorStore } from '../state/useEditorStore';
import { exportStageToSVG, exportStageToPDF, exportPDFWithDrawings } from '../utils/exporters';
import { handleFileUpload } from '../utils/file-upload';

interface AutoCADTopBarProps {
  onBackToProjects?: () => void;
}

export const AutoCADTopBar: React.FC<AutoCADTopBarProps> = ({ onBackToProjects }) => {
  const {
    tool,
    setTool,
    undo,
    redo,
    removeElements,
    selectedElementIds,
    stageInstance,
    saveToLocalStorage,
    loadFromLocalStorage,
    snapSettings,
    updateSnapSettings,
    setStageTransform,
    stageScale,
    stagePosition,
    elements,
    layers,
    activeLayerId,
    drawingSettings,
    updateDrawingSettings,
    setPdfBackground,
    updatePdfBackground,
    pdfBackground,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    if (confirm('Create new drawing? Unsaved changes will be lost.')) {
      useEditorStore.setState({
        elements: [],
        selectedElementIds: [],
        layers: [{ id: 'layer-0', name: 'Layer 0', visible: true, locked: false }],
        activeLayerId: 'layer-0',
      });
    }
  };

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    // Save to localStorage first
    saveToLocalStorage();
    
    // Also export as JSON file
    const data = {
      layers,
      elements,
      activeLayerId,
      snapSettings,
      drawingSettings,
      pdfBackground,
      timestamp: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawing.json';
    a.click();
    URL.revokeObjectURL(url);
    
    // Show brief notification (optional - you can add a toast library)
    console.log('Drawing saved successfully');
  };

  const handleExportPNG = () => {
    if (!stageInstance) return;
    const dataURL = stageInstance.toDataURL({ pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'drawing.png';
    a.click();
  };

  const handleExportSVG = () => {
    if (!stageInstance) return;
    exportStageToSVG(stageInstance, 'drawing.svg');
  };

  const handleExportPDF = async () => {
    if (!stageInstance) return;
    
    // If PDF background is loaded, export multi-page PDF with drawings
    if (pdfBackground && pdfBackground.pages && pdfBackground.pages.length > 0) {
      try {
        await exportPDFWithDrawings(
          stageInstance,
          pdfBackground,
          elements,
          'drawing-with-pdf.pdf'
        );
      } catch (error) {
        console.error('Failed to export PDF with drawings:', error);
        // Fallback to single page export
        exportStageToPDF(stageInstance, 'drawing.pdf');
      }
    } else {
      // Regular single page export
      exportStageToPDF(stageInstance, 'drawing.pdf');
    }
  };

  const handleCut = () => {
    // TODO: Implement clipboard
    if (selectedElementIds.length > 0) {
      removeElements(selectedElementIds);
    }
  };

  const handleCopy = () => {
    // TODO: Implement clipboard
  };

  const handlePaste = () => {
    // TODO: Implement clipboard
  };

  const handleDelete = () => {
    if (selectedElementIds.length > 0) {
      removeElements(selectedElementIds);
    }
  };

  const handleZoomIn = () => {
    setStageTransform({ scale: stageScale * 1.2 });
  };

  const handleZoomOut = () => {
    setStageTransform({ scale: stageScale / 1.2 });
  };

  const handleZoomFit = () => {
    if (!stageInstance) return;
    const box = stageInstance.getClientRect();
    const stageBox = stageInstance.findOne('Layer')?.getClientRect();
    if (stageBox) {
      const scale = Math.min(
        box.width / stageBox.width,
        box.height / stageBox.height,
        1
      );
      setStageTransform({
        scale: scale * 0.9,
        position: { x: box.width / 2 - stageBox.width * scale * 0.45, y: box.height / 2 - stageBox.height * scale * 0.45 },
      });
    }
  };

  const handleZoomSelection = () => {
    // TODO: Implement zoom to selection
    handleZoomFit();
  };

  const handleResetView = () => {
    setStageTransform({ scale: 1, position: { x: 0, y: 0 }, rotation: 0 });
  };

  const handleToggleGrid = () => {
    updateSnapSettings({ showGrid: !snapSettings.showGrid });
  };

  return (
    <div className="bg-slate-800 text-white border-b border-slate-700 flex items-center h-10 px-2 text-sm">
      {/* BACK BUTTON */}
      {onBackToProjects && (
        <button
          onClick={onBackToProjects}
          className="px-3 py-1 hover:bg-slate-700 flex items-center gap-1 mr-2"
          title="Back to Projects"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>
      )}

      {/* FILE */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">File</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[180px] hidden group-hover:block">
          <button onClick={handleNew} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            New Drawing
          </button>
          <button onClick={handleOpen} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Open Drawing
          </button>
          <button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  const { convertPDFToImages } = await import('../utils/pdf-converter');
                  const pdfPages = await convertPDFToImages(file);
                  if (pdfPages && pdfPages.length > 0) {
                    const firstPage = pdfPages[0];
                    // Calculate fit-to-view scale and position
                    // PDF is rendered at 4x scale, so divide by 4 to get display size
                    const displayWidth = firstPage.width / 4;
                    const displayHeight = firstPage.height / 4;
                    const canvasWidth = stageInstance?.width() || window.innerWidth;
                    const canvasHeight = stageInstance?.height() || window.innerHeight;
                    const scaleX = canvasWidth / displayWidth;
                    const scaleY = canvasHeight / displayHeight;
                    const fitScale = Math.min(scaleX, scaleY); // Use full scale to cover canvas
                    
                    // Calculate scaled dimensions
                    const scaledWidth = displayWidth * fitScale;
                    const scaledHeight = displayHeight * fitScale;
                    
                    // Center the PDF in the canvas
                    // Position PDF at origin, then adjust stage position to center it
                    const centerX = (canvasWidth - scaledWidth) / 2;
                    const centerY = (canvasHeight - scaledHeight) / 2;
                    
                    // Set PDF background with display dimensions (1x, not 4x)
                    // The image itself is 4x for quality, but we display it at 1x size
                    setPdfBackground({
                      imageData: firstPage.imageData,
                      width: displayWidth, // Display at 1x size
                      height: displayHeight, // Display at 1x size
                      x: 0, // Start at origin in stage coordinates
                      y: 0, // Start at origin in stage coordinates
                      opacity: 0.7, // Increased opacity for better visibility
                      visible: true,
                      currentPage: 1,
                      totalPages: pdfPages.length,
                      pages: pdfPages,
                    });
                    
                    // Auto-fit and center the view to show the PDF
                    // Position stage to center the scaled PDF
                    setStageTransform({
                      scale: fitScale,
                      position: { x: centerX, y: centerY },
                    });
                    
                    console.log('PDF loaded:', {
                      pages: pdfPages.length,
                      imageWidth: firstPage.width,
                      imageHeight: firstPage.height,
                      displayWidth: displayWidth,
                      displayHeight: displayHeight,
                      fitScale: fitScale,
                      canvasWidth: canvasWidth,
                      canvasHeight: canvasHeight,
                    });
                  }
                } catch (error) {
                  alert(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              };
              input.click();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-slate-600"
          >
            Import PDF for Editing
          </button>
          <button onClick={handleSave} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Save Drawing
          </button>
          <div className="border-t border-slate-600 my-1"></div>
          <button onClick={handleExportPNG} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Export PNG
          </button>
          <button onClick={handleExportSVG} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Export SVG
          </button>
          <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Export PDF
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Export DXF (placeholder)
          </button>
        </div>
      </div>

      {/* EDIT */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">Edit</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[140px] hidden group-hover:block">
          <button onClick={undo} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Undo
          </button>
          <button onClick={redo} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Redo
          </button>
          <div className="border-t border-slate-600 my-1"></div>
          <button onClick={handleCut} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Cut
          </button>
          <button onClick={handleCopy} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Copy
          </button>
          <button onClick={handlePaste} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Paste
          </button>
          <button onClick={handleDelete} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Delete
          </button>
        </div>
      </div>

      {/* VIEW */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">View</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[160px] hidden group-hover:block">
          <button onClick={handleZoomIn} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Zoom In
          </button>
          <button onClick={handleZoomOut} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Zoom Out
          </button>
          <button onClick={handleZoomFit} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Zoom to Fit
          </button>
          <button onClick={handleZoomSelection} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Zoom to Selection
          </button>
          <button onClick={handleResetView} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            Reset View
          </button>
          <div className="border-t border-slate-600 my-1"></div>
          <button
            onClick={handleToggleGrid}
            className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${snapSettings.showGrid ? 'bg-slate-600' : ''}`}
          >
            Toggle Grid
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Toggle Rulers
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Toggle Smart Guides
          </button>
        </div>
      </div>

      {/* DRAW */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">Draw</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[140px] hidden group-hover:block">
          <button onClick={() => setTool('line')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'line' ? 'bg-slate-600' : ''}`}>
            Line
          </button>
          <button onClick={() => setTool('polyline')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'polyline' ? 'bg-slate-600' : ''}`}>
            Polyline
          </button>
          <button onClick={() => setTool('rectangle')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'rectangle' ? 'bg-slate-600' : ''}`}>
            Rectangle
          </button>
          <button onClick={() => setTool('circle')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'circle' ? 'bg-slate-600' : ''}`}>
            Circle
          </button>
          <button onClick={() => setTool('arc')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'arc' ? 'bg-slate-600' : ''}`}>
            Arc (3-point)
          </button>
          <button onClick={() => setTool('ellipse')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'ellipse' ? 'bg-slate-600' : ''}`}>
            Ellipse
          </button>
          <button onClick={() => setTool('pencil')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'pencil' ? 'bg-slate-600' : ''}`}>
            Freehand (Pencil)
          </button>
        </div>
      </div>

      {/* MODIFY */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">Modify</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[140px] hidden group-hover:block">
          <button onClick={() => setTool('move')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'move' ? 'bg-slate-600' : ''}`}>
            Move
          </button>
          <button onClick={() => setTool('rotate')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'rotate' ? 'bg-slate-600' : ''}`}>
            Rotate
          </button>
          <button onClick={() => setTool('scale')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'scale' ? 'bg-slate-600' : ''}`}>
            Scale
          </button>
          <button onClick={() => setTool('mirror')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'mirror' ? 'bg-slate-600' : ''}`}>
            Mirror
          </button>
          <button onClick={() => setTool('offset')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'offset' ? 'bg-slate-600' : ''}`}>
            Offset
          </button>
          <button onClick={() => setTool('trim')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'trim' ? 'bg-slate-600' : ''}`}>
            Trim
          </button>
          <button onClick={() => setTool('extend')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'extend' ? 'bg-slate-600' : ''}`}>
            Extend
          </button>
          <button onClick={() => setTool('fillet')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'fillet' ? 'bg-slate-600' : ''}`}>
            Fillet
          </button>
          <button onClick={() => setTool('chamfer')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'chamfer' ? 'bg-slate-600' : ''}`}>
            Chamfer
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Join
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Explode
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">Layout</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[160px] hidden group-hover:block">
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Layers Panel (Already visible)
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Color Palette (Already visible)
          </button>
          <div className="border-t border-slate-600 my-1"></div>
          <button 
            onClick={() => updateDrawingSettings({ strokeWidth: Math.max(1, drawingSettings.strokeWidth - 0.5) })}
            className="block w-full text-left px-4 py-2 hover:bg-slate-600"
          >
            Decrease Line Weight
          </button>
          <button 
            onClick={() => updateDrawingSettings({ strokeWidth: Math.min(12, drawingSettings.strokeWidth + 0.5) })}
            className="block w-full text-left px-4 py-2 hover:bg-slate-600"
          >
            Increase Line Weight
          </button>
          <div className="border-t border-slate-600 my-1"></div>
          <button
            onClick={() => updateSnapSettings({ grid: !snapSettings.grid })}
            className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${snapSettings.grid ? 'bg-slate-600' : ''}`}
          >
            {snapSettings.grid ? 'Disable' : 'Enable'} Grid Snap
          </button>
          <button
            onClick={() => updateSnapSettings({ showGrid: !snapSettings.showGrid })}
            className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${snapSettings.showGrid ? 'bg-slate-600' : ''}`}
          >
            {snapSettings.showGrid ? 'Hide' : 'Show'} Grid
          </button>
        </div>
      </div>

      {/* ANNOTATE */}
      <div className="relative group">
        <button className="px-3 py-1 hover:bg-slate-700">Annotate</button>
        <div className="absolute top-full left-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[180px] hidden group-hover:block">
          <button onClick={() => setTool('dimension')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'dimension' ? 'bg-slate-600' : ''}`}>
            Linear Dimension
          </button>
          <button onClick={() => setTool('measure')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'measure' ? 'bg-slate-600' : ''}`}>
            Measure Distance
          </button>
          <button onClick={() => setTool('text')} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${tool === 'text' ? 'bg-slate-600' : ''}`}>
            Text
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Aligned Dimension
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Angular Dimension
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Radius/Diameter
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-slate-600 opacity-50">
            Leader
          </button>
        </div>
      </div>

      {/* UNIT & SCALE SELECTOR */}
      <div className="ml-auto flex items-center gap-2">
        {/* Scale Selector */}
        <div className="relative group">
          <button className="px-3 py-1 hover:bg-slate-700 flex items-center gap-1">
            <span>Scale: 1:{drawingSettings.unitScale === 1 ? '1' : drawingSettings.unitScale === 0.1 ? '10' : drawingSettings.unitScale === 0.01 ? '100' : '1'}</span>
          </button>
          <div className="absolute top-full right-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[120px] hidden group-hover:block">
            <button
              onClick={() => updateDrawingSettings({ unitScale: 1 })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unitScale === 1 ? 'bg-slate-600' : ''}`}
            >
              1:1 (Full Scale)
            </button>
            <button
              onClick={() => updateDrawingSettings({ unitScale: 0.1 })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unitScale === 0.1 ? 'bg-slate-600' : ''}`}
            >
              1:10
            </button>
            <button
              onClick={() => updateDrawingSettings({ unitScale: 0.05 })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unitScale === 0.05 ? 'bg-slate-600' : ''}`}
            >
              1:20
            </button>
            <button
              onClick={() => updateDrawingSettings({ unitScale: 0.02 })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unitScale === 0.02 ? 'bg-slate-600' : ''}`}
            >
              1:50
            </button>
            <button
              onClick={() => updateDrawingSettings({ unitScale: 0.01 })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unitScale === 0.01 ? 'bg-slate-600' : ''}`}
            >
              1:100
            </button>
          </div>
        </div>

        {/* Unit Selector */}
        <div className="relative group">
          <button className="px-3 py-1 hover:bg-slate-700 flex items-center gap-1">
            <span>Unit: {drawingSettings.unit.toUpperCase()}</span>
          </button>
          <div className="absolute top-full right-0 bg-slate-700 border border-slate-600 shadow-lg z-50 min-w-[140px] hidden group-hover:block">
            <button
              onClick={() => updateDrawingSettings({ unit: 'mm', unitScale: drawingSettings.unitScale })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unit === 'mm' ? 'bg-slate-600' : ''}`}
            >
              mm (Millimeters)
            </button>
            <button
              onClick={() => updateDrawingSettings({ unit: 'cm', unitScale: drawingSettings.unitScale })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unit === 'cm' ? 'bg-slate-600' : ''}`}
            >
              cm (Centimeters)
            </button>
            <button
              onClick={() => updateDrawingSettings({ unit: 'm', unitScale: drawingSettings.unitScale })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unit === 'm' ? 'bg-slate-600' : ''}`}
            >
              m (Meters)
            </button>
            <button
              onClick={() => updateDrawingSettings({ unit: 'inch', unitScale: drawingSettings.unitScale })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unit === 'inch' ? 'bg-slate-600' : ''}`}
            >
              inch (Inches)
            </button>
            <button
              onClick={() => updateDrawingSettings({ unit: 'ft', unitScale: drawingSettings.unitScale })}
              className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${drawingSettings.unit === 'ft' ? 'bg-slate-600' : ''}`}
            >
              ft (Feet)
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.svg"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.name.endsWith('.pdf')) {
              try {
                const { convertPDFToImages } = await import('../utils/pdf-converter');
                const pdfPages = await convertPDFToImages(file);
                if (pdfPages && pdfPages.length > 0) {
                  const firstPage = pdfPages[0];
                  // Calculate fit-to-view scale and position
                  // PDF is rendered at 4x scale, so divide by 4 to get display size
                  const displayWidth = firstPage.width / 4;
                  const displayHeight = firstPage.height / 4;
                  const canvasWidth = stageInstance?.width() || window.innerWidth;
                  const canvasHeight = stageInstance?.height() || window.innerHeight;
                  const scaleX = canvasWidth / displayWidth;
                  const scaleY = canvasHeight / displayHeight;
                  const fitScale = Math.min(scaleX, scaleY); // Use full scale to cover canvas
                  
                  // Calculate scaled dimensions
                  const scaledWidth = displayWidth * fitScale;
                  const scaledHeight = displayHeight * fitScale;
                  
                  // Center the PDF in the canvas
                  const centerX = (canvasWidth - scaledWidth) / 2;
                  const centerY = (canvasHeight - scaledHeight) / 2;
                  
                  setPdfBackground({
                    imageData: firstPage.imageData,
                    width: displayWidth, // Display at 1x size
                    height: displayHeight, // Display at 1x size
                    x: 0, // Start at origin in stage coordinates
                    y: 0, // Start at origin in stage coordinates
                    opacity: 0.7, // Increased opacity for better visibility
                    visible: true,
                    currentPage: 1,
                    totalPages: pdfPages.length,
                    pages: pdfPages,
                  });
                  
                  // Auto-fit and center the view to show the PDF
                  setStageTransform({
                    scale: fitScale,
                    position: { x: centerX, y: centerY },
                  });
                }
              } catch (error) {
                alert(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            } else {
              handleFileUpload(file, (data) => {
                useEditorStore.getState().loadFromProjectData(data);
              });
            }
          }
        }}
      />
    </div>
  );
};

